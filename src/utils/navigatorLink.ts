// 4×4ナビゲーションのURLまわりの小さな共有部品。
//
// 問題DBの全ページ（ProblemDbShell）が、URL fragmentに4×4の条件が付いているかを判定するために
// 読み込む。ナビ本体のロジック（navigatorCore）はここからimportしない（通常の来訪者には
// この小さな判定だけを配り、抽出モードの本体は条件があるときだけ遅延読み込みする）。
// 値は形式だけを検査し、詳しい正規化は parseStateString（navigatorCore.ts）が行う。

// 設定画面。
export const NAV_SETUP_PATH = '/navigator/';
// 共有URL・保存設定の入口（条件のfragmentを付けて開く。noindex,follow）。
export const NAV_RESULT_PATH = '/app/navigation/';
// 候補データ（build時に生成する静的JSON）。抽出モードのときだけ取得する。
export const NAV_DATA_PATH = '/app/navigation/data.json';

// serializeState() が出力する形（v=1&r=<ID,…>&c=<セル,…>）だけを通す。
const STATE_STRING_SHAPE =
  /^v=1&r=[a-z][a-z0-9]{0,7}(?:,[a-z][a-z0-9]{0,7}){0,99}(?:&c=(?:all|[1-4]{2}(?:,[1-4]{2}){0,15}))?$/;

export function isStateStringShape(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 1000 && STATE_STRING_SHAPE.test(value);
}

// 4×4の条件らしいfragment（「v=<数字>」で始まる）。形が正しいか・読めるかは問わない。
// 問題DBはこれを見て抽出モードの本体を読み込み、条件を読めなかった場合は（全問題一覧を
// 黙って出す代わりに）案内を出す。通常のアンカー（#saved 等）には反応しない。
export function looksLikeNavFragment(value: unknown): value is string {
  return typeof value === 'string' && /^v=\d/.test(value);
}

// 抽出モードを始められなかった理由。
//   load: 抽出モードの本体を読み込めない・実行中に失敗した / data: 候補データを取得・解釈できない /
//   invalid: 条件を読めない / unsupported: 新しい形式の条件 / empty: 条件に合う問題がない
export type NavModeFailure = 'load' | 'data' | 'invalid' | 'unsupported' | 'empty';

// 「問題再選定」の行き先。fragmentを可能な範囲で引き継いで設定画面へ渡す（読める部分だけを
// 設定画面側の parseStateString が反映する）。条件に使わない文字を含む・長すぎる場合は引き継がない。
export function navEditHref(fragment: unknown): string {
  return typeof fragment === 'string' && /^[A-Za-z0-9=&,]{1,1000}$/.test(fragment)
    ? `${NAV_SETUP_PATH}#${fragment}`
    : NAV_SETUP_PATH;
}

// 抽出モードへ「入った」表示かどうか（navigator_result_view を1回の入場につき1回だけ送るための判定）。
// 設定画面・共有URLの入口・外部や直接のURLから開いたときだけtrue。抽出モードのまま問題DB内を
// 移動したとき（参照元が同じサイトの別ページ）と、再読み込み・戻る／進むはfalse。
export function isNavModeEntry(referrer: string, origin: string, navigationType: string): boolean {
  if (navigationType === 'reload' || navigationType === 'back_forward') return false;
  if (referrer === '') return true;
  try {
    const from = new URL(referrer);
    if (from.origin !== origin) return true;
    return from.pathname === NAV_SETUP_PATH || from.pathname === NAV_RESULT_PATH;
  } catch {
    return true;
  }
}
