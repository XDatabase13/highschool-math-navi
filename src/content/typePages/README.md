# 自動生成スナップショット（編集禁止）

このディレクトリの中身は、正本 `math_db_quadratic_working/type_pages/`（highschool_math_db の外）から
`npm run sync-type-pages`（scripts/sync-type-pages.mjs）でコピーしたものです。
同じ同期で `src/data/type-pages.generated.json`（型構造。正本はmaster xlsx）も生成されます。

直接編集しないでください。編集は正本側で行い、その後このコマンドで再同期してください。
制作途中（0〜37件）の型Markdownも同期されますが、productionで型ページを公開するのは
「published全38件がそろう」かつ「src/data/type-page-publication.ts で公開承認」のときだけです。
