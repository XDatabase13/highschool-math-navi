// /navigator/（4×4ナビゲーションの設定画面）のclient script。
// 範囲の木と4×4の枠はページ側が静的に出力済みで、ここでは選択状態・件数・主ボタンの
// 更新だけを行う。抽出・集計・正規化は navigatorCore.ts の純粋関数をそのまま使う
// （このファイルに別の抽出ロジックを書かない）。

import {
  ALL_CELLS,
  candidateProblems,
  countCells,
  createNavIndex,
  emptyState,
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

function init(data: NavData) {
  const index = createNavIndex(data);
  let state: NavState = emptyState();

  const rangePanel = one<HTMLElement>('[data-nv-range]');
  const rangeToggle = one<HTMLButtonElement>('[data-nv-range-toggle]');
  const notice = one<HTMLElement>('[data-nv-notice]');
  const live = one<HTMLElement>('[data-nv-live]');
  const goLink = one<HTMLAnchorElement>('[data-nv-go]');
  const cellButtons = all<HTMLButtonElement>('[data-nv-cell]');

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
        history.replaceState(null, '', serialized === '' ? window.location.pathname + window.location.search : `#${serialized}`);
      } catch {
        // file:// 等でreplaceStateが使えない環境では、URLへの反映だけを諦める。
      }
    }
  }

  // 利用者の操作による変更。
  function update(next: NavState, removedCells: string[] = []) {
    state = next;
    showNotice(removedCells.length > 0 ? NOTICE_CELLS_REMOVED : '');
    render();
  }

  const applyChange = (change: StateChange) => update(change.state, change.removedCells);

  // URL（共有・結果画面からの引き継ぎ）の条件を読む。
  function loadFromHash() {
    const parsed = parseStateString(index, window.location.hash);
    if (parsed.kind === 'ok') {
      state = parsed.state;
      showNotice(parsed.ignored > 0 || parsed.removedCells.length > 0 ? NOTICE_PARTIAL : '');
    } else if (parsed.kind === 'unsupported') {
      showNotice(NOTICE_UNSUPPORTED);
    } else if (parsed.kind === 'invalid') {
      showNotice(NOTICE_INVALID);
    }
    return parsed.kind;
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
  goLink?.addEventListener('click', (event) => {
    if (goLink.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash.replace(/^#/, '') === serializeState(index, state)) return;
    loadFromHash();
    render();
  });

  // --- 初期表示 ---
  const source = loadFromHash();
  const isWide = window.matchMedia('(min-width: 901px)').matches;
  for (const subject of index.subjects) {
    for (const unit of subject.units) {
      // PCでは全単元を開く。スマホでは全sectionを常時展開せず、一部だけ選択中の単元だけ開く。
      const count = selectionCount(state, unit.sections);
      setUnitExpanded(unit.id, isWide || (count.selected > 0 && count.selected < count.total));
    }
  }
  // 条件を引き継いで開いたときは、スマホでは範囲を要約表示へ折りたたんでおく。
  setRangeCollapsed(!isWide && source === 'ok');
  render();
}

const data = readData();
if (data) init(data);
