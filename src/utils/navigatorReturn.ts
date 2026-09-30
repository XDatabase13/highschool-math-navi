// 4×4ナビの抽出結果（/app/navigation/）から個別問題ページへ移動したあと、
// 同じ学習設定へ戻るための導線用の小さな共有部品。
//
// 結果画面が問題リンクのクリック時に、条件の文字列（serializeStateの出力）を
// sessionStorageへ置き、個別問題ページ（ProblemDbShell）がそれを読んで戻りリンクを出す。
// sessionStorageはタブ単位で、検索等から直接来た利用者には何も表示されない。
// 個別問題ページ全体へ読み込まれるため、ナビ本体のロジック（navigatorCore）はimportしない。
// 値は形式だけを検査し、詳しい正規化は結果画面側（parseStateString）が行う。

export const NAV_RETURN_KEY = 'mathnavi.navigator.return';
export const NAV_RESULT_PATH = '/app/navigation/';

// serializeState() が出力する形（v=1&r=<ID,…>&c=<セル,…>）だけを通す。
const STATE_STRING_SHAPE =
  /^v=1&r=[a-z][a-z0-9]{0,7}(?:,[a-z][a-z0-9]{0,7}){0,99}(?:&c=(?:all|[1-4]{2}(?:,[1-4]{2}){0,15}))?$/;

export function isStateStringShape(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 1000 && STATE_STRING_SHAPE.test(value);
}

// 戻り先URL（形式が正しくない値のときはnull）。
export function navReturnHref(value: unknown): string | null {
  return isStateStringShape(value) ? `${NAV_RESULT_PATH}#${value}` : null;
}
