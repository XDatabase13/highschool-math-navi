// /navigator/（4×4ナビゲーションの設定画面）のclient script。
// 範囲の木と4×4の枠はページ側が静的に出力済みで、ここでは選択状態・件数・主ボタン・
// 保存一覧の更新だけを行う。抽出・集計・正規化は navigatorCore.ts、保存と復元の優先順位は
// navigatorStore.ts の関数をそのまま使う（このファイルに別の抽出・復元ロジックを書かない）。

import {
  ALL_CELLS,
  candidateProblems,
  countCells,
  createNavIndex,
  extractProblems,
  parseStateString,
  rangeSummary,
  selectCells,
  selectionCount,
  serializeState,
  setSectionSelected,
  setSubjectSelected,
  setUnitSelected,
  toggleCell,
  unitBreakdown,
  withSections,
  type NavData,
  type NavState,
  type StateChange,
} from '../utils/navigatorCore.ts';
import { NAV_RESULT_PATH } from '../utils/navigatorReturn.ts';
import {
  MAX_SETTING_NAME_LENGTH,
  createNavStore,
  resolveInitialState,
  type SavedSettingView,
} from '../utils/navigatorStore.ts';
import {
  getLocalStorage,
  resultUrl,
  saveFailureMessage,
  shareUrl,
  showShareOutcome,
  trackNavEvent,
} from '../utils/navigatorBrowser.ts';

const NOTICE_CELLS_REMOVED = '試験範囲の変更により、該当問題がなくなったマスの選択を解除しました。';
const NOTICE_PARTIAL = '読み込めない条件が含まれていたため、利用できる条件だけを反映しました。';
const NOTICE_INVALID = 'URLの条件を読み込めませんでした。新しく設定してください。';
const NOTICE_UNSUPPORTED =
  'このURLは新しい形式の設定です。ページを再読み込みしても開けない場合は、新しく設定してください。';

function one<T extends Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

function all<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

function readData(): NavData | null {
  try {
    return JSON.parse(document.getElementById('navigator-data')?.textContent ?? '') as NavData;
  } catch {
    return null;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  // 設定名など利用者の入力は、必ずtextContentで入れる（HTMLとして解釈しない）。
  if (text !== undefined) node.textContent = text;
  return node;
}

function init(data: NavData) {
  const index = createNavIndex(data);
  const store = createNavStore(getLocalStorage());
  const initial = resolveInitialState(index, window.location.hash, store);
  let state: NavState = initial.state;
  let offer = initial.offer;
  // 「試験範囲を選んだ」「マスを選んだ」は、1回の来訪につき最初の1回だけ計測する。
  const tracked = { range: false, cell: false };

  const rangePanel = one<HTMLElement>('[data-nv-range]');
  const rangeToggle = one<HTMLButtonElement>('[data-nv-range-toggle]');
  const notice = one<HTMLElement>('[data-nv-notice]');
  const live = one<HTMLElement>('[data-nv-live]');
  const goLink = one<HTMLAnchorElement>('[data-nv-go]');
  const cellButtons = all<HTMLButtonElement>('[data-nv-cell]');
  const resume = one<HTMLElement>('[data-nv-resume]');
  const savedList = one<HTMLElement>('[data-nv-saved-list]');
  const savedStatus = one<HTMLElement>('[data-nv-saved-status]');
  const shareFallback = one<HTMLElement>('[data-nv-share-fallback]');

  function showNotice(message: string) {
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = message === '';
  }

  function setRangeCollapsed(collapsed: boolean) {
    if (!rangePanel || !rangeToggle) return;
    rangePanel.dataset.collapsed = String(collapsed);
    rangeToggle.setAttribute('aria-expanded', String(!collapsed));
    rangeToggle.textContent = collapsed ? '変更' : '閉じる';
  }

  function setUnitExpanded(unitId: string, expanded: boolean) {
    const toggle = one<HTMLButtonElement>(`[data-nv-unit-toggle="${unitId}"]`);
    const list = document.getElementById(`nv-sections-${unitId}`);
    if (!toggle || !list) return;
    toggle.setAttribute('aria-expanded', String(expanded));
    list.hidden = !expanded;
  }

  // PCでは全単元を開く。スマホでは全sectionを常時展開せず、一部だけ選択中の単元だけ開く。
  function expandUnitsForState() {
    const isWide = window.matchMedia('(min-width: 901px)').matches;
    for (const subject of index.subjects) {
      for (const unit of subject.units) {
        const count = selectionCount(state, unit.sections);
        setUnitExpanded(unit.id, isWide || (count.selected > 0 && count.selected < count.total));
      }
    }
    return isWide;
  }

  function render() {
    const selected = new Set(state.sections);
    const candidates = candidateProblems(index, state.sections);
    const counts = countCells(candidates);
    const pressed = new Set(state.cells);
    const results = extractProblems(index, state);

    // --- 試験範囲 ---
    for (const input of all<HTMLInputElement>('[data-nv-section]')) {
      input.checked = selected.has(input.dataset.nvSection ?? '');
    }
    for (const subject of index.subjects) {
      for (const unit of subject.units) {
        const count = selectionCount(state, unit.sections);
        const input = one<HTMLInputElement>(`[data-nv-unit="${unit.id}"]`);
        if (input) {
          input.checked = count.selected === count.total;
          // 一部のsectionだけ選択した単元は中間状態にする。
          input.indeterminate = count.selected > 0 && count.selected < count.total;
        }
        const label = one<HTMLElement>(`[data-nv-unit-count="${unit.id}"]`);
        if (label) label.textContent = `${count.selected}/${count.total}`;
      }
      const subjectCount = selectionCount(
        state,
        subject.units.flatMap((unit) => unit.sections),
      );
      const subjectInput = one<HTMLInputElement>(`[data-nv-subject="${subject.id}"]`);
      if (subjectInput) {
        subjectInput.checked = subjectCount.selected === subjectCount.total;
        subjectInput.indeterminate = subjectCount.selected > 0 && subjectCount.selected < subjectCount.total;
      }
    }
    const summary = one<HTMLElement>('[data-nv-range-summary]');
    if (summary) summary.textContent = rangeSummary(index, state.sections) || '未選択';
    const rangeCount = one<HTMLElement>('[data-nv-range-count]');
    if (rangeCount) rangeCount.textContent = String(candidates.length);

    // --- 4×4 ---
    for (const button of cellButtons) {
      const cell = button.dataset.nvCell ?? '';
      const count = counts[cell] ?? 0;
      const isPressed = pressed.has(cell);
      button.disabled = count === 0;
      button.setAttribute('aria-pressed', String(isPressed));
      button.setAttribute(
        'aria-label',
        `${button.dataset.nvCellLabel}：${count}問${isPressed ? '（選択中）' : ''}`,
      );
      const countEl = one<HTMLElement>('[data-nv-cell-count]', button);
      if (countEl) countEl.textContent = String(count);
    }
    const hasCandidates = candidates.length > 0;
    const selectAll = one<HTMLButtonElement>('[data-nv-cells-all]');
    const clearCells = one<HTMLButtonElement>('[data-nv-cells-clear]');
    if (selectAll) selectAll.disabled = !hasCandidates;
    if (clearCells) clearCells.disabled = state.cells.length === 0;
    const hint = one<HTMLElement>('[data-nv-matrix-hint]');
    if (hint) {
      hint.textContent = hasCandidates
        ? '取り組むマスを選んでください（複数選択できます）。数字は試験範囲内の問題数です。'
        : 'まず試験範囲を選んでください。';
    }

    // --- 抽出問題数と主ボタン ---
    const resultCount = one<HTMLElement>('[data-nv-result-count]');
    if (resultCount) resultCount.textContent = String(results.length);
    const breakdown = one<HTMLElement>('[data-nv-result-breakdown]');
    if (breakdown) {
      breakdown.textContent = unitBreakdown(index, results)
        .map((row) => `${row.name} ${row.count}問`)
        .join(' ／ ');
    }
    const help = one<HTMLElement>('[data-nv-result-help]');
    if (goLink) {
      if (results.length > 0) {
        goLink.href = `${NAV_RESULT_PATH}#${serializeState(index, state)}`;
        goLink.removeAttribute('aria-disabled');
        goLink.textContent = `${results.length}問を問題データベースで見る`;
      } else {
        // 0件のときは結果画面へ進めない。
        goLink.removeAttribute('href');
        goLink.setAttribute('aria-disabled', 'true');
        goLink.textContent = '問題データベースで見る';
      }
    }
    if (help) {
      help.hidden = results.length > 0;
      help.textContent = !hasCandidates
        ? '試験範囲とマスを選ぶと、抽出した問題を一覧で確認できます。'
        : '問題のあるマスを1つ以上選ぶと、抽出した問題を一覧で確認できます。';
    }
    if (live) {
      live.textContent = hasCandidates ? `対象${candidates.length}問、抽出${results.length}問` : '';
    }

    // URLへ現在の条件を反映する（再読み込み・結果画面からの「戻る」で同じ選択へ戻れる）。
    const serialized = serializeState(index, state);
    const current = window.location.hash.replace(/^#/, '');
    if (serialized !== current && (serialized !== '' || parseStateString(index, current).kind !== 'none')) {
      try {
        history.replaceState(
          null,
          '',
          serialized === '' ? window.location.pathname + window.location.search : `#${serialized}`,
        );
      } catch {
        // replaceStateが使えない環境では、URLへの反映だけを諦める。
      }
    }
  }

  // --- 復元の案内（前回の設定／途中の設定） ---
  function renderResume() {
    if (!resume) return;
    resume.hidden = offer === null;
    if (!offer) return;
    const isLast = offer.kind === 'last';
    const label = one<HTMLElement>('[data-nv-resume-label]', resume);
    const summary = one<HTMLElement>('[data-nv-resume-summary]', resume);
    const apply = one<HTMLElement>('[data-nv-resume-apply]', resume);
    if (label) label.textContent = isLast ? '前回の設定があります' : '途中の設定があります';
    if (summary) {
      summary.textContent = `${rangeSummary(index, offer.state.sections)}（${extractProblems(index, offer.state).length}問）`;
    }
    if (apply) apply.textContent = isLast ? '前回の設定を続ける' : '途中の設定を続ける';
  }

  // 利用者の操作による変更。ここで初めて下書きを保存する（ページを開いただけでは保存しない）。
  function update(next: NavState, removedCells: string[] = []) {
    const hadRange = state.sections.length > 0;
    const hadCells = state.cells.length > 0;
    state = next;
    showNotice(removedCells.length > 0 ? NOTICE_CELLS_REMOVED : '');
    // 自分で設定を始めたら、復元の案内は閉じる。
    offer = null;
    renderResume();
    store.setDraft(index, state);
    render();

    if (!tracked.range && !hadRange && state.sections.length > 0) {
      tracked.range = true;
      trackNavEvent('navigator_range_select');
    }
    if (!tracked.cell && !hadCells && state.cells.length > 0) {
      tracked.cell = true;
      trackNavEvent('navigator_cell_select');
    }
  }

  const applyChange = (change: StateChange) => update(change.state, change.removedCells);

  function showUrlNotice(kind: string, partial: boolean) {
    if (kind === 'ok') showNotice(partial ? NOTICE_PARTIAL : '');
    else if (kind === 'unsupported') showNotice(NOTICE_UNSUPPORTED);
    else if (kind === 'invalid') showNotice(NOTICE_INVALID);
  }

  // --- 保存した学習設定 ---
  function setSavedStatus(message: string) {
    if (savedStatus) savedStatus.textContent = message;
  }

  function actionButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = el('button', 'nv-text-btn', label);
    button.type = 'button';
    button.addEventListener('click', onClick);
    return button;
  }

  function savedItem(setting: SavedSettingView): HTMLLIElement {
    const item = el('li', 'nv-saved-item');
    const usable = setting.stateString !== '';
    const count = usable ? extractProblems(index, setting.state).length : 0;

    const main = el('div', 'nv-saved-main');
    main.append(
      el('span', 'nv-saved-name', setting.name),
      el(
        'span',
        'nv-saved-meta',
        usable
          ? `${rangeSummary(index, setting.state.sections)}・${count}問`
          : '現在公開中の範囲では利用できない設定です',
      ),
    );

    const actions = el('div', 'nv-saved-actions');
    if (usable) {
      // 「開く」は、条件をURLへ載せて抽出結果画面へ移動する通常のリンク。
      const open = el('a', 'nv-text-btn', '開く');
      open.href = `${NAV_RESULT_PATH}#${setting.stateString}`;
      const onOpen = () => {
        store.setLast(index, setting.state);
        trackNavEvent('navigator_resume', { source: 'saved' });
      };
      open.addEventListener('click', onOpen);
      open.addEventListener('auxclick', onOpen);
      actions.append(open);
    }
    actions.append(
      actionButton('名前変更', () => {
        const edit = el('form', 'nv-saved-edit');
        const input = el('input', 'nv-input');
        input.type = 'text';
        input.value = setting.name;
        input.maxLength = MAX_SETTING_NAME_LENGTH;
        input.setAttribute('aria-label', '設定の名前');
        const submit = el('button', 'nv-btn nv-btn--primary', '変更する');
        submit.type = 'submit';
        const cancel = el('button', 'nv-btn', 'やめる');
        cancel.type = 'button';
        cancel.addEventListener('click', () => renderSaved(setting.id));
        edit.append(input, submit, cancel);
        edit.addEventListener('submit', (event) => {
          event.preventDefault();
          const result = store.renameSetting(setting.id, input.value);
          if (result.ok) setSavedStatus('名前を変更しました。');
          else if (result.reason === 'empty-name') setSavedStatus('名前を入力してください。');
          else if (result.reason === 'not-found') setSavedStatus('この設定は見つかりませんでした。');
          else setSavedStatus(saveFailureMessage(result.reason));
          if (result.ok || result.reason !== 'empty-name') renderSaved(setting.id);
        });
        item.replaceChildren(edit);
        input.focus();
        input.select();
      }),
    );
    if (usable) {
      actions.append(
        actionButton('共有', async () => {
          const url = resultUrl(setting.stateString);
          const outcome = await shareUrl(url, '高校数学ナビ 4×4ナビゲーション');
          showShareOutcome(outcome, url, savedStatus, shareFallback);
          if (outcome !== 'cancelled') trackNavEvent('navigator_share', { method: outcome, source: 'saved' });
        }),
      );
    }
    actions.append(
      actionButton('削除', () => {
        // 誤操作を防ぐため、その場で確認してから削除する（ブラウザのconfirmダイアログは使わない）。
        const confirmRow = el('div', 'nv-saved-edit');
        const remove = el('button', 'nv-btn', '削除する');
        remove.type = 'button';
        remove.addEventListener('click', () => {
          const result = store.deleteSetting(setting.id);
          setSavedStatus(
            result.ok || result.reason === 'not-found'
              ? '設定を削除しました。'
              : result.reason === 'empty-name'
                ? ''
                : saveFailureMessage(result.reason),
          );
          renderSaved();
        });
        const cancel = el('button', 'nv-btn', 'やめる');
        cancel.type = 'button';
        cancel.addEventListener('click', () => renderSaved(setting.id));
        confirmRow.append(el('p', '', `「${setting.name}」を削除しますか？`), remove, cancel);
        item.replaceChildren(confirmRow);
        cancel.focus();
      }),
    );

    item.append(main, actions);
    item.dataset.nvSavedId = setting.id;
    return item;
  }

  // focusId: 描画し直した後、その設定の最初の操作へフォーカスを戻す。
  function renderSaved(focusId?: string) {
    if (!savedList) return;
    const status = store.status();
    const settings = store.listSettings(index);
    savedList.replaceChildren(...settings.map(savedItem));
    const empty = one<HTMLElement>('[data-nv-saved-empty]');
    if (empty) {
      empty.hidden = settings.length > 0 || status !== 'ok';
    }
    const problem = one<HTMLElement>('[data-nv-store-problem]');
    const problemText = one<HTMLElement>('[data-nv-store-problem-text]');
    if (problem && problemText) {
      problem.hidden = status === 'ok';
      const reset = one<HTMLElement>('[data-nv-store-reset]', problem);
      if (reset) reset.hidden = status === 'unavailable';
      problemText.textContent =
        status === 'unavailable'
          ? 'このブラウザでは設定を保存できません（シークレットモードや設定による制限）。ナビゲーションと共有はそのまま使えます。'
          : status === 'newer'
            ? '保存済みデータが新しい形式のため、このページでは読み込めません。ページを再読み込みしても変わらない場合は、初期化すると再び保存できるようになります（保存済みの設定は消えます）。'
            : status === 'unreadable'
              ? '保存済みデータを読み込めませんでした。初期化すると再び保存できるようになります（保存済みの設定は消えます）。'
              : '';
    }
    if (focusId) {
      const target = all<HTMLElement>('[data-nv-saved-id]', savedList).find(
        (node) => node.dataset.nvSavedId === focusId,
      );
      one<HTMLElement>('a, button', target ?? savedList)?.focus();
    }
  }

  // --- イベント ---
  for (const input of all<HTMLInputElement>('[data-nv-section]')) {
    input.addEventListener('change', () => {
      applyChange(setSectionSelected(index, state, input.dataset.nvSection ?? '', input.checked));
    });
  }
  for (const input of all<HTMLInputElement>('[data-nv-unit]')) {
    input.addEventListener('change', () => {
      applyChange(setUnitSelected(index, state, input.dataset.nvUnit ?? '', input.checked));
    });
  }
  for (const input of all<HTMLInputElement>('[data-nv-subject]')) {
    input.addEventListener('change', () => {
      applyChange(setSubjectSelected(index, state, input.dataset.nvSubject ?? '', input.checked));
    });
  }
  one('[data-nv-range-clear]')?.addEventListener('click', () => applyChange(withSections(index, state, [])));
  for (const toggle of all<HTMLButtonElement>('[data-nv-unit-toggle]')) {
    toggle.addEventListener('click', () => {
      setUnitExpanded(toggle.dataset.nvUnitToggle ?? '', toggle.getAttribute('aria-expanded') !== 'true');
    });
  }
  rangeToggle?.addEventListener('click', () => {
    setRangeCollapsed(rangePanel?.dataset.collapsed !== 'true');
  });
  for (const button of cellButtons) {
    button.addEventListener('click', () => update(toggleCell(index, state, button.dataset.nvCell ?? '')));
  }
  one('[data-nv-cells-all]')?.addEventListener('click', () => update(selectCells(index, state, ALL_CELLS)));
  one('[data-nv-cells-clear]')?.addEventListener('click', () => update(selectCells(index, state, [])));

  // 主ボタン：結果画面へ進む時点で、前回使用設定として記録する（中クリック等の別タブも含む）。
  const onGo = (event: Event) => {
    if (!goLink || goLink.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    const results = extractProblems(index, state);
    store.setLast(index, state);
    trackNavEvent('navigator_extract', {
      problem_count: results.length,
      cell_count: state.cells.length,
      section_count: state.sections.length,
      unit_count: unitBreakdown(index, candidateProblems(index, state.sections)).length,
    });
  };
  goLink?.addEventListener('click', onGo);
  goLink?.addEventListener('auxclick', onGo);

  one('[data-nv-resume-apply]')?.addEventListener('click', () => {
    if (!offer) return;
    const kind = offer.kind;
    state = offer.state;
    offer = null;
    renderResume();
    showNotice('');
    setRangeCollapsed(!expandUnitsForState());
    render();
    trackNavEvent('navigator_resume', { source: kind });
  });
  one('[data-nv-resume-dismiss]')?.addEventListener('click', () => {
    // 途中の設定を使わないと決めたら、次回は案内しない（前回使用設定は残す）。
    if (offer?.kind === 'draft') store.setDraft(index, { sections: [], cells: [] });
    offer = null;
    renderResume();
  });

  one('[data-nv-store-reset]')?.addEventListener('click', () => {
    const result = store.reset();
    setSavedStatus(result.ok ? '保存データを初期化しました。' : '保存データを初期化できませんでした。');
    renderSaved();
  });

  // 「4×4の見方」。フォーカス移動・Escで閉じる・閉じた後のフォーカス復帰は<dialog>の標準動作に任せる。
  const guide = one<HTMLDialogElement>('[data-nv-guide]');
  if (guide && typeof guide.showModal === 'function') {
    one('[data-nv-guide-open]')?.addEventListener('click', () => guide.showModal());
    one('[data-nv-guide-close]', guide)?.addEventListener('click', () => guide.close());
    // 背景（dialog自身の余白）をクリックしたら閉じる。
    guide.addEventListener('click', (event) => {
      if (event.target === guide) guide.close();
    });
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash.replace(/^#/, '') === serializeState(index, state)) return;
    const parsed = parseStateString(index, window.location.hash);
    if (parsed.kind === 'none') return;
    if (parsed.kind === 'ok') state = parsed.state;
    showUrlNotice(parsed.kind, parsed.kind === 'ok' && (parsed.ignored > 0 || parsed.removedCells.length > 0));
    render();
  });

  // --- 初期表示 ---
  const url = initial.url;
  showUrlNotice(url.kind, url.kind === 'ok' && (url.ignored > 0 || url.removedCells.length > 0));
  const isWide = expandUnitsForState();
  // 条件を引き継いで開いたときは、スマホでは範囲を要約表示へ折りたたんでおく。
  setRangeCollapsed(!isWide && initial.source === 'url');
  renderResume();
  renderSaved();
  render();
  trackNavEvent('navigator_open', { source: initial.source === 'url' ? 'url' : offer ? `offer_${offer.kind}` : 'new' });
}

const data = readData();
if (data) init(data);
