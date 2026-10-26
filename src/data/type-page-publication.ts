// ============================================================
// 型ページ（問題タイプ）の公開承認フラグ（人間が明示的に変更する）
// ============================================================
// 公開グループ（src/data/type-page-units.ts の TYPE_PAGE_PUBLICATION_GROUPS）ごとに承認を持つ。
// productionでそのグループの型route・型一覧nav・sitemapを有効にする条件は、次の2つを両方満たすことだけ：
//   1. そのグループのpublished全件の型Markdown（本文・description・人間レビュー完了）がスナップショットにそろっている
//   2. 人間が公開を明示的に承認し、そのグループの値を true に変更してcommitしている
// 全件がそろっても、値が false の間は自動公開しない。
// true なのに全件そろっていない場合はbuildエラー（グループ内の一部だけの公開はしない）。
// グループごとに独立して判定し、あるグループの未承認・本文不足は他のグループの公開に影響しない。
//
// 承認前の型Markdownのローカル確認（astro dev）は
// この公開ゲートとは別扱いで、DEV環境だけで表示される（noindex付き）。
//
// scripts/audit-type-pages.mjs（Node）からも直接importするため、型除去だけで読める構文に限る。

// 数学I 5単元の38型（2026-09-29に人間が公開承認し、本番公開済み）。
export const TYPE_PAGES_PUBLICATION_APPROVED: boolean = true;

// 数学A「場合の数・確率」の18型（本文・description承認済み。2026-10-26に人間の画面レビュー・
// 構造監査を経て、人間が本番公開を承認）。
export const CP_TYPE_PAGES_PUBLICATION_APPROVED: boolean = true;

// 公開グループID → 公開承認。
export const TYPE_PAGE_GROUP_PUBLICATION_APPROVED = {
  math1: TYPE_PAGES_PUBLICATION_APPROVED,
  'math-a-cp': CP_TYPE_PAGES_PUBLICATION_APPROVED,
};
