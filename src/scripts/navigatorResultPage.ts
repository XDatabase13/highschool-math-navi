// /app/navigation/（4×4ナビゲーションの抽出結果の入口）のclient script。
// URL fragmentの条件を読み、抽出した最初の問題の個別ページ（通常の問題DB画面）へ、
// 同じ条件を付けて移動する。一覧の絞り込み・保存・共有は、移動先の問題DB側の抽出モード
// （src/scripts/navigatorDbMode.ts）が行う。移動できない場合だけ、このページに案内を出す。

import {
  createNavIndex,
  firstResultHref,
  parseStateString,
  serializeState,
  type NavData,
} from '../utils/navigatorCore.ts';

const MESSAGE_NONE = '条件が指定されていません。4×4ナビゲーションで試験範囲とマスを選んでください。';
const MESSAGE_EMPTY = '条件に合う問題がありません。試験範囲またはマスを選び直してください。';
const MESSAGE_INVALID = 'URLの条件を読み込めませんでした。4×4ナビゲーションで設定し直してください。';
const MESSAGE_UNSUPPORTED =
  'このURLは新しい形式の設定のため、条件を適用できませんでした。ページを再読み込みしても変わらない場合は、4×4ナビゲーションで設定し直してください。';
const MESSAGE_MOVING = '問題データベースへ移動しています。';

function readData(): NavData | null {
  try {
    return JSON.parse(document.getElementById('navigator-data')?.textContent ?? '') as NavData;
  } catch {
    return null;
  }
}

function init(data: NavData) {
  const index = createNavIndex(data);
  const message = document.querySelector<HTMLElement>('[data-nvr-message]');
  const editLink = document.querySelector<HTMLAnchorElement>('[data-nvr-edit]');

  function show(text: string) {
    if (message) message.textContent = text;
    document.documentElement.classList.remove('nvr-pending');
  }

  function apply() {
    const parsed = parseStateString(index, window.location.hash);
    if (parsed.kind === 'ok') {
      const stateString = serializeState(index, parsed.state);
      const first = firstResultHref(index, parsed.state);
      if (first) {
        if (message) message.textContent = MESSAGE_MOVING;
        // navigator_result_view は、移動先の問題DBで抽出表示が成立した時点で送る
        // （navigatorDbMode.ts。ここでは送らない＝二重に計測しない）。
        // このページを履歴に残さない（「戻る」で元の画面へ戻れるようにする）。
        window.location.replace(`${first}#${stateString}`);
        return;
      }
      // 範囲は読めたが、該当する問題がない（マス未選択など）。同じ範囲のまま設定画面へ戻れるようにする。
      if (editLink) {
        editLink.href = `/navigator/#${stateString}`;
        editLink.textContent = '条件を変更';
      }
      show(MESSAGE_EMPTY);
    } else if (parsed.kind === 'unsupported') {
      show(MESSAGE_UNSUPPORTED);
    } else if (parsed.kind === 'invalid') {
      show(MESSAGE_INVALID);
    } else {
      show(MESSAGE_NONE);
    }
  }

  window.addEventListener('hashchange', apply);
  apply();
}

const data = readData();
if (data) init(data);
else document.documentElement.classList.remove('nvr-pending');
