// ============================================================
// 開発確認用fixture（公開正本ではない・本番に出さない）
// ============================================================
// 型ページの正式Markdown（math_db_quadratic_working/type_pages/*.md、37件）がそろう前に、
// 本物のTypePageDetail・ProblemDbShell・PC/スマホ切替を通して実画面レビューするための仮データ。
//
// - 使うのは `astro dev`（import.meta.env.DEV）のときだけ。src/utils/typePages.ts から
//   DEV分岐内の動的importでのみ読み込み、production buildのroute・nav・sitemapには出さない
//   （scripts/audit-type-pages.mjs が dist への混入を検査する）。
// - 型の名称・slug・所属問題は本物の構造スナップショット（type-pages.generated.json）の値を使い、
//   ここに置くのは「型の概要」とdescriptionの仮文だけ。問題文・重要度・難易度・assetは既存問題データ。
// - 公開ゲート（37件完了＋公開承認）とは別扱い。正式な type_pages/QF-T03.md の代わりではなく、
//   正式なQF-T03のMarkdownが同期されると、devでもそちらが優先されfixtureは使われなくなる。
//   公開ゲート通過後は使われない。不要になったらこのファイルごと削除してよい。

export const DEV_TYPE_PAGE_FIXTURE = {
  typePageId: 'QF-T03',
  description: '【開発確認用・非公開】型ページUIの実画面確認用の仮descriptionです。公開用の文章ではありません。',
  overviewMarkdown: [
    '## 型の概要',
    '',
    '【開発確認用の仮文】この文章は、型ページのレイアウトと問題previewを実画面で確認するための仮の概要です。' +
      '公開用の「型の概要」は、人間が執筆した正式な型Markdownに置き換わります。',
    '',
  ].join('\n'),
} as const;
