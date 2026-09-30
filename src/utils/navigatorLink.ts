// 4×4ナビゲーションのURLまわりの小さな共有部品。
//
// 問題DBの全ページ（ProblemDbShell）が、URL fragmentに4×4の条件が付いているかを判定するために
// 読み込む。ナビ本体のロジック（navigatorCore）はここからimportしない（通常の来訪者には
// この小さな判定だけを配り、抽出モードの本体は条件があるときだけ遅延読み込みする）。
// 値は形式だけを検査し、詳しい正規化は parseStateString（navigatorCore.ts）が行う。

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
