// ============================================================
// 型ページ（問題タイプ）の公開承認フラグ（人間が明示的に変更する）
// ============================================================
// productionで型route・型一覧nav・sitemapを有効にする条件は、次の2つを両方満たすことだけ：
//   1. published全38件の型Markdown（本文・description・人間レビュー完了）がスナップショットにそろっている
//   2. 人間が公開を明示的に承認し、この値を true に変更してcommitしている
// 38件がそろっても、この値が false の間は自動公開しない（production sitemapは189件のまま）。
// true なのに38件そろっていない場合はbuildエラー（1〜37件だけの公開はしない）。
//
// 承認前の型Markdownのローカル確認（astro dev）は
// この公開ゲートとは別扱いで、DEV環境だけで表示される。
//
// scripts/audit-type-pages.mjs（Node）からも直接importするため、型除去だけで読める構文に限る。

export const TYPE_PAGES_PUBLICATION_APPROVED: boolean = true;
