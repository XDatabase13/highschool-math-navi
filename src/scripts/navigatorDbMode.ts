// 問題DB（ProblemDbShell）の「4×4ナビゲーションの抽出モード」本体。
// URL fragmentに4×4の条件（#v=1&r=…&c=…）が付いているページでだけ、ProblemDbShellから遅延読み込みされる。
//
// 既存の個別問題ページ（静的HTML）はそのまま使い、ここでは次のことだけを行う。
//   - 中央の問題一覧（PC中央列・スマホの問題一覧ダイアログ）を、抽出した問題の行だけにする
//   - 左の科目・単元ナビを、抽出した問題がある単元だけにする（行き先はその単元の最初の抽出問題）
//   - 一覧・単元のリンクへ同じ条件のfragmentを付け、問題を移動しても抽出状態を保つ
//   - ヘッダー直下の帯に、選択中のマスを示す小型の4×4（読み取り専用）・「4×4　○問　n/○」・
//     条件のタグ（範囲、重要度 × 難易度）と、問題再選定・保存・共有・
//     全問題表示、を出す（前後移動のボタンは置かない。問題の移動は中央の抽出問題一覧から行う）
// 問題本文の後付け描画・並び替えはしない（並び順は静的な一覧の順＝単元順 → display_order のまま）。
// どの問題が抽出対象か・何問目かは、navigatorCore.ts の buildDbModeView() が決める。
//
// 一覧・単元ナビの要素は、ProblemDbShell.astro と ProblemGroupList.astro が出力するclass名
// （.db-problem-group / .db-problem-row / .db-problem-link / .db-problem-group-count /
//   .db-unit-btn / .db-list-toggle / [data-mobile-unit-select]）で見つける。
// 個別問題ページの静的HTMLへ抽出モード用の属性を足さないための取り決めなので、
// これらのclass名を変えるときはこのファイルも合わせて直す。

import '../styles/navigatorDbMode.css';
import {
  ALL_CELLS,
  buildDbModeView,
  cellsSummaryParts,
  createNavIndex,
  rangeSummaryParts,
  resolveDbModeStart,
  serializeState,
  type NavData,
} from '../utils/navigatorCore.ts';
import { NAV_DATA_PATH, isNavModeEntry, type NavModeFailure } from '../utils/navigatorLink.ts';
import { MAX_SAVED_SETTINGS, createNavStore } from '../utils/navigatorStore.ts';
import {
  getLocalStorage,
  resultUrl,
  saveFailureMessage,
  shareUrl,
  showShareFallback,
  trackNavEvent,
} from '../utils/navigatorBrowser.ts';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function all<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

// 抽出モードを始める。始められなかった場合は、画面を変えずに理由を返す（案内を出すのは呼び出し側の
// ProblemDbShell。全問題一覧へ黙って戻さないため、呼び出し側は一覧を隠したまま案内を表示する）。
export async function startNavigatorDbMode(host: HTMLElement): Promise<NavModeFailure | null> {
  let index: ReturnType<typeof createNavIndex>;
  try {
    const response = await fetch(NAV_DATA_PATH);
    if (!response.ok) return 'data';
    index = createNavIndex((await response.json()) as NavData);
  } catch {
    return 'data';
  }
  const start = resolveDbModeStart(index, window.location.hash);
  if (start.kind !== 'ok') return start.kind;
  const state = start.state;
  const view = buildDbModeView(index, state, window.location.pathname);
  const total = view.results.length;

  const stateString = serializeState(index, state);
  const withState = (href: string) => `${href}#${stateString}`;
  if (window.location.hash.slice(1) !== stateString) {
    try {
      history.replaceState(null, '', `#${stateString}`);
    } catch {
      // URLの正規化だけを諦める。
    }
  }

  const shell = document.querySelector<HTMLElement>('.db-shell');
  shell?.classList.add('db-nav-mode-on');

  // --- 中央の問題一覧（PC中央列・スマホの問題一覧ダイアログの両方） ---
  const resultHrefs = new Set(view.hrefs);
  let unitCount = 0;
  const lists = all<HTMLElement>('.db-problem-groups');
  lists.forEach((list, listIndex) => {
    let visibleInList = 0;
    for (const group of all<HTMLDetailsElement>('.db-problem-group', list)) {
      let count = 0;
      for (const row of all<HTMLElement>('.db-problem-row', group)) {
        const link = row.querySelector<HTMLAnchorElement>('a.db-problem-link');
        const href = link?.getAttribute('href') ?? '';
        if (link && resultHrefs.has(href)) {
          link.setAttribute('href', withState(href));
          count += 1;
        } else {
          row.hidden = true;
        }
      }
      group.hidden = count === 0;
      if (count > 0) group.open = true;
      const countEl = group.querySelector<HTMLElement>('.db-problem-group-count');
      if (countEl) countEl.textContent = `${count}問`;
      visibleInList += count;
    }
    if (listIndex === 0) unitCount = visibleInList;
    if (visibleInList === 0) {
      list.append(el('p', 'db-nav-mode-empty', 'この単元には、4×4ナビで選んだ問題がありません。左の単元から選んでください。'));
    }
  });
  // 「問題タイプ / 問題一覧」の切替は抽出と関係しないので隠し、問題一覧だけを出す（切替自体はCSSで隠す）。
  for (const panel of all<HTMLElement>('[data-list-view-panel]')) {
    panel.hidden = panel.dataset.listViewPanel !== 'problems';
  }
  for (const toggle of all<HTMLElement>('.db-list-toggle')) {
    toggle.textContent = `4×4ナビで選んだ問題を開く（この単元 ${unitCount}問）`;
  }
  const dialogTitle = document.getElementById('mobile-problem-dialog-title');
  if (dialogTitle) dialogTitle.textContent = `4×4ナビで選んだ問題（全${total}問）`;

  // --- 左の科目・単元ナビ：抽出した問題がある単元だけにし、行き先をその単元の最初の抽出問題にする ---
  for (const link of all<HTMLAnchorElement>('a.db-unit-btn')) {
    const unit = view.units.get(link.getAttribute('href') ?? '');
    const item = link.closest('li');
    if (unit) {
      link.setAttribute('href', withState(unit.href));
      link.append(el('span', 'db-nav-mode-unit-count', `${unit.count}問`));
    } else if (item) {
      item.hidden = true;
    }
  }
  for (const subject of all<HTMLElement>('.db-subject')) {
    subject.hidden = all<HTMLElement>('.db-unit-list > li', subject).every((item) => item.hidden);
  }
  // パンくずの単元リンクも、同じ抽出状態のまま移動させる。
  for (const link of all<HTMLAnchorElement>('.db-breadcrumb-list a')) {
    const unit = view.units.get(link.getAttribute('href') ?? '');
    if (unit) link.setAttribute('href', withState(unit.href));
  }
  // スマホの問題一覧ダイアログの「単元」切り替え（選ぶとそのvalueへ移動する）。
  const unitSelect = document.querySelector<HTMLSelectElement>('[data-mobile-unit-select]');
  const remapUnitOptions = () => {
    if (!unitSelect) return;
    for (const option of Array.from(unitSelect.options)) {
      const unit = view.units.get(option.value);
      if (unit) option.value = withState(unit.href);
      else if (!option.value.includes('#')) option.remove();
    }
  };
  remapUnitOptions();
  // 「科目」を切り替えると既存のscriptが単元の選択肢を作り直すので、その後でもう一度絞る。
  document.querySelector('[data-mobile-subject-select]')?.addEventListener('change', remapUnitOptions);

  // --- ヘッダー直下の帯 ---
  const store = createNavStore(getLocalStorage());

  // 件数・現在位置は短い表記、条件（範囲・重要度×難易度）はタグで示す（PC・スマホ共通）。
  const title = el('p', 'db-nav-mode-title');
  title.append(
    el('strong', '', `4×4　${total}問`),
    el('span', 'db-nav-mode-position', view.current >= 0 ? `${view.current + 1}/${total}` : '対象外'),
  );

  // 選択中のマスを示す小型の4×4（読み取り専用。押せない・フォーカスも受けない）。
  // 並びは設定画面の盤面と同じ（縦＝重要度、横＝難易度）。選択中＝重要度色の塗り、それ以外＝枠だけ。
  const mini = el('span', 'db-nav-mode-mini');
  mini.setAttribute('role', 'img');
  mini.setAttribute('aria-label', `選択中のマス：${cellsSummaryParts(state.cells).join('、')}`);
  const selectedCells = new Set(state.cells);
  for (const cell of ALL_CELLS) {
    const dot = el('i', selectedCells.has(cell) ? 'is-on' : '');
    dot.dataset.r = cell.charAt(0);
    mini.append(dot);
  }

  const chips = el('ul', 'db-nav-mode-chips');
  chips.setAttribute('aria-label', '選択中の範囲・重要度と難易度');
  chips.append(
    ...[...rangeSummaryParts(index, state.sections), ...cellsSummaryParts(state.cells)].map((part) =>
      el('li', 'db-nav-mode-chip', part),
    ),
  );

  const status = el('p', 'db-nav-mode-status');
  status.setAttribute('role', 'status');
  const fallback = el('div', 'db-nav-mode-share-fallback');
  fallback.hidden = true;
  const fallbackInput = el('input', 'db-nav-mode-input');
  fallbackInput.type = 'text';
  fallbackInput.readOnly = true;
  fallbackInput.setAttribute('aria-label', '共有用のURL');
  fallback.append(fallbackInput);

  // 共有URLから開いた条件は、開いただけでは保存データへ記録しない（利用者が選んだ後に記録する）。
  const sharedRow = el('div', 'db-nav-mode-shared');
  sharedRow.hidden = true;
  const adopt = () => {
    store.setLast(index, state);
    sharedRow.hidden = true;
  };
  if (store.status() === 'ok') {
    if (store.isOwnCondition(index, state)) {
      store.setLast(index, state);
    } else {
      const adoptButton = el('button', 'db-nav-mode-btn', 'この条件で学習する');
      adoptButton.type = 'button';
      adoptButton.addEventListener('click', () => {
        adopt();
        status.textContent = 'この条件を前回の設定として記録しました。';
        trackNavEvent('navigator_resume', { source: 'shared' });
      });
      sharedRow.append(
        el('span', '', '共有された条件を表示しています（この端末にはまだ記録していません）。'),
        adoptButton,
      );
      sharedRow.hidden = false;
    }
  }

  const edit = el('a', 'db-nav-mode-btn', '問題再選定');
  edit.href = `/navigator/#${stateString}`;

  const save = el('button', 'db-nav-mode-btn', '学習設定を保存');
  save.type = 'button';
  save.addEventListener('click', () => {
    const result = store.saveSetting(index, state);
    if (result.ok) {
      status.textContent = `「${result.setting.name}」として保存しました（このブラウザの中だけに保存されます）。名前の変更・削除は、4×4ナビゲーションの「学習設定」から行えます。`;
      trackNavEvent('navigator_save', { problem_count: total });
    } else if (result.reason === 'duplicate') {
      status.textContent = `同じ条件の設定「${result.existing?.name ?? ''}」が保存済みです。`;
    } else if (result.reason === 'limit') {
      status.textContent = `保存できる設定は${MAX_SAVED_SETTINGS}件までです。不要な設定を削除してから保存してください。`;
    } else if (result.reason !== 'empty') {
      status.textContent = saveFailureMessage(result.reason);
    }
    // 保存を選んだ時点で、この条件を利用者自身の条件として扱う。
    if (result.ok || result.reason === 'duplicate') adopt();
  });

  const share = el('button', 'db-nav-mode-btn', '条件を共有');
  share.type = 'button';
  share.addEventListener('click', async () => {
    const url = resultUrl(stateString);
    const outcome = await shareUrl(url, '高校数学ナビ 4×4ナビゲーション');
    showShareFallback(outcome, url, status, fallback);
    if (outcome !== 'cancelled') trackNavEvent('navigator_share', { method: outcome, source: 'db' });
  });

  // 抽出モードの終了：条件のfragmentを外し、静的な通常表示（その単元の全問題）を読み込み直す。
  const exit = el('button', 'db-nav-mode-btn db-nav-mode-exit', '全問題表示');
  exit.type = 'button';
  exit.addEventListener('click', () => {
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      window.location.hash = '';
    }
    window.location.reload();
  });

  // スマホ幅では4つの操作を「4×4設定」のメニューへ格納し、押したときだけ本文の上へ重ねて出す
  // （本文を押し下げない）。PCではメニューのボタンを出さず、4つの操作を常に横並びで表示する。
  const more = el('button', 'db-nav-mode-btn db-nav-mode-more', '4×4設定');
  more.type = 'button';
  more.setAttribute('aria-expanded', 'false');
  more.setAttribute('aria-controls', 'db-nav-mode-menu');
  const extra = el('div', 'db-nav-mode-extra');
  extra.id = 'db-nav-mode-menu';
  extra.append(edit, save, share, exit);
  const actions = el('div', 'db-nav-mode-actions');
  actions.append(more, extra);

  const isMenuOpen = () => host.classList.contains('is-open');
  // refocus: メニュー内の操作で閉じたとき、消える項目からボタンへフォーカスを戻す（スマホ幅だけ）。
  const setMenuOpen = (open: boolean, refocus = false) => {
    host.classList.toggle('is-open', open);
    more.setAttribute('aria-expanded', String(open));
    if (refocus && more.offsetParent !== null) more.focus();
  };
  more.addEventListener('click', () => setMenuOpen(!isMenuOpen()));
  // 保存・共有は、押したらメニューを閉じる（結果の表示は帯の中に出る）。
  // 問題再選定・全問題表示はページ移動なので、そのままにする。
  save.addEventListener('click', () => setMenuOpen(false, true));
  share.addEventListener('click', () => setMenuOpen(false, true));
  document.addEventListener('click', (event) => {
    if (isMenuOpen() && !event.composedPath().includes(actions)) setMenuOpen(false);
  });
  actions.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isMenuOpen()) return;
    setMenuOpen(false, true);
  });
  actions.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (isMenuOpen() && next instanceof Node && !actions.contains(next)) setMenuOpen(false);
  });

  const main = el('div', 'db-nav-mode-main');
  main.append(mini, title, actions);
  host.replaceChildren(main, chips, sharedRow, status, fallback);
  host.setAttribute('role', 'region');
  host.setAttribute('aria-label', '4×4ナビゲーションの抽出モード');
  host.hidden = false;

  // 抽出表示が成立した。設定画面・共有URLの入口などから抽出モードへ入ったときに1回だけ計測する
  // （抽出モードのまま問題を移動するたびには送らない）。送るのは実際の抽出件数だけ。
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (isNavModeEntry(document.referrer, window.location.origin, navigation?.type ?? 'navigate')) {
    trackNavEvent('navigator_result_view', { problem_count: total });
  }
  return null;
}
