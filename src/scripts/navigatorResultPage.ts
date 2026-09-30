// /app/navigation/（4×4ナビゲーションの抽出結果画面）のclient script。
// ページ側が静的に出力した全問題の一覧（結果の並び順）から、URL fragmentの条件に
// 合わない行を隠すだけ。並び替え・問題本文の後付け描画はしない。
// 抽出・正規化は navigatorCore.ts の純粋関数をそのまま使う。

import {
  cellsSummary,
  createNavIndex,
  extractProblems,
  parseStateString,
  rangeSummary,
  serializeState,
  type NavData,
  type NavState,
} from '../utils/navigatorCore.ts';
import { NAV_RETURN_KEY } from '../utils/navigatorReturn.ts';

const NOTICE_PARTIAL = '読み込めない条件が含まれていたため、利用できる条件だけで抽出しました。';
const NOTICE_INVALID = 'URLの条件を読み込めなかったため、全問題を表示しています。「条件を変更」から設定し直してください。';
const NOTICE_UNSUPPORTED =
  'このURLは新しい形式の設定のため、条件を適用できませんでした。全問題を表示しています。ページを再読み込みしても変わらない場合は、「条件を変更」から設定し直してください。';

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
  // 現在適用している条件（条件なし＝全問題表示のときはnull）。
  let state: NavState | null = null;

  const notice = one<HTMLElement>('[data-nvr-notice]');
  const list = one<HTMLElement>('[data-nvr-list]');
  const editLink = one<HTMLAnchorElement>('[data-nvr-edit]');
  const clearButton = one<HTMLButtonElement>('[data-nvr-clear]');

  function showNotice(message: string) {
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = message === '';
  }

  function setText(selector: string, text: string) {
    const el = one<HTMLElement>(selector);
    if (el) el.textContent = text;
  }

  function apply() {
    const parsed = parseStateString(index, window.location.hash);
    state = parsed.kind === 'ok' ? parsed.state : null;

    if (parsed.kind === 'ok') {
      showNotice(parsed.ignored > 0 || parsed.removedCells.length > 0 ? NOTICE_PARTIAL : '');
      // 同じ設定は同じURLになるよう、正規化した形へ揃える。
      const serialized = serializeState(index, parsed.state);
      if (window.location.hash.replace(/^#/, '') !== serialized) {
        try {
          history.replaceState(null, '', `#${serialized}`);
        } catch {
          // URLへの反映だけを諦める。
        }
      }
    } else if (parsed.kind === 'unsupported') {
      showNotice(NOTICE_UNSUPPORTED);
    } else if (parsed.kind === 'invalid') {
      showNotice(NOTICE_INVALID);
    } else {
      showNotice('');
    }

    const visibleIds = state ? new Set(extractProblems(index, state).map((problem) => problem.id)) : null;
    let total = 0;
    for (const group of all<HTMLDetailsElement>('[data-nav-group]')) {
      let count = 0;
      for (const row of all<HTMLElement>('[data-nav-problem]', group)) {
        const visible = !visibleIds || visibleIds.has(row.dataset.navProblem ?? '');
        row.hidden = !visible;
        if (visible) count += 1;
      }
      group.hidden = count === 0;
      const countEl = one<HTMLElement>('[data-nav-group-count]', group);
      if (countEl) countEl.textContent = `${count}問`;
      total += count;
    }

    setText('[data-nvr-count]', String(total));
    setText('[data-nvr-range]', state ? rangeSummary(index, state.sections) : '指定なし');
    setText('[data-nvr-cells]', state ? cellsSummary(state.cells) || '未選択' : '指定なし');
    const empty = one<HTMLElement>('[data-nvr-empty]');
    if (empty) empty.hidden = total > 0;
    if (clearButton) clearButton.hidden = state === null;
    // 「条件を変更」は、同じ選択状態のまま設定画面へ戻る。
    if (editLink) editLink.href = state ? `/navigator/#${serializeState(index, state)}` : '/navigator/';

    document.documentElement.classList.remove('nvr-pending');
  }

  // 絞り込みを解除：条件を外して全問題を表示する（ブラウザの「戻る」で元の条件へ戻れる）。
  clearButton?.addEventListener('click', () => {
    try {
      history.pushState(null, '', window.location.pathname + window.location.search);
    } catch {
      window.location.hash = '';
    }
    apply();
  });

  // 個別問題へ移動するとき、同じ学習設定へ戻るための条件をタブ内（sessionStorage）へ残す。
  // 個別問題ページ（ProblemDbShell）が、これを読んで戻り導線を表示する。
  const rememberReturn = (event: Event) => {
    if (!(event.target instanceof Element) || !event.target.closest('a.db-problem-link')) return;
    try {
      if (state) window.sessionStorage.setItem(NAV_RETURN_KEY, serializeState(index, state));
      else window.sessionStorage.removeItem(NAV_RETURN_KEY);
    } catch {
      // sessionStorageが使えなくても、問題への移動自体は通常のリンクとして行われる。
    }
  };
  list?.addEventListener('click', rememberReturn);
  list?.addEventListener('auxclick', rememberReturn);

  window.addEventListener('hashchange', apply);
  window.addEventListener('popstate', apply);
  apply();
}

const data = readData();
if (data) init(data);
else document.documentElement.classList.remove('nvr-pending');
