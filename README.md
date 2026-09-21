# 高校数学ナビ

推薦・定期試験向けの高校数学学習ナビゲーションサイトです。

公開URL：

- https://math-navi.com

問題や長い解説を大量に増やすことより、

- 何を優先して解くか
- 何を後回しにできるか
- どういう順番で考えるか

を分かりやすく示すことを重視しています。

## 現在地

数学I「二次関数」「三角比」「データの分析」の3単元・計118問を本番公開しています（M1-QF-001〜054・M1-TR-001〜041・M1-DA-001〜023）。

数学I「数と式」M1-EC-001〜023（式の計算、23問）は独立検算・教材化・技術実装まで完了していますが、まだpush・本番公開前です。

単元別の進捗・工程チェックリスト・技術的な実装詳細は、このREADMEでは重複記載せず`AGENTS.md`を一次情報源とします。最新の現在地はそちらの単元別「〜の現在地」節を参照してください。

## 公開UIとURL

PCの基本UIは、

> 科目・単元 ｜ 問題一覧 ｜ 選択中の問題詳細

の3ペインDB型です。スマホでは同じ`ProblemDbShell`を使い、ヘッダー→選択中の問題詳細→折りたたみ式問題一覧→科目・単元の順に表示を切り替えます。

主要URL：

- `/app/`：問題DBへの入口（検索インデックス対象外、`noindex,follow`）
- `/math1/quadratic/`：二次関数の単元トップ、`/M1-QF-001/`〜`/M1-QF-054/`
- `/math1/trig/`：三角比の単元トップ、`/M1-TR-001/`〜`/M1-TR-041/`
- `/math1/data-analysis/`：データの分析の単元トップ、`/M1-DA-001/`〜`/M1-DA-023/`

3単元とも同格の公開contract（index対象・sitemap掲載・canonicalは各URL自身）です。個別問題URLはAstroで独立した静的HTMLとして生成され、固有のtitle / description / canonical / 問題本文を持ちます。UI・URL契約の詳細は`AGENTS.md`「公開URLとDB UIの契約」を参照してください。

## 正本とWeb公開スナップショット

教材データの正本はWeb repoの外側にあります。

- 正本Markdown：`math_db_quadratic_working/problems/`
- 正本asset：`math_db_quadratic_working/assets/`

Web repoは`src/content/<collection>/`配下に公開用スナップショットを保持し、GitHub Actions単独でbuildできるようにしています。スナップショットは派生データであり正本ではないため、直接編集しません。

```sh
npm run sync-content
```

で正本からスナップショットを再生成してからbuild・commit・pushします。正本の分離ルール・スナップショット構成の詳細は`AGENTS.md`「正本と責任範囲」を参照してください。

## 公開・計測

- Hosting：GitHub Pages
- Deploy：GitHub Actions（`master` push）
- Node.js：24
- 正式URL：`https://math-navi.com`
- Search Console：Domain property登録済み、sitemap送信済み
- GA4：導入済み

`/privacy/`、`/disclaimer/`、`/contact/` を公開しています。お問い合わせはGoogleフォームへの外部リンク方式です。

## 開発上の基本方針

Astro + TypeScriptを使用し、教材データと表示UI、制作正本とWeb公開スナップショットをそれぞれ分離しています。問題ID別の場当たり的な分岐や不要な機能を増やさない、既存の人間レビュー済みUI・asset・教材文を無断で変更しない、といった詳しい開発ルール・禁止事項は`AGENTS.md`「開発ルール」を参照してください。

## Commands

プロジェクトルートで実行します。

```sh
npm install
npm run dev
npm run sync-content
npm run build
npm run preview
```

`npm run sync-content` は制作側の正本フォルダが存在するローカル環境で実行します。
GitHub Actionsではcommit済みの公開スナップショットだけを使用します。

## 関連文書

- `AGENTS.md`：Claude Code向けの詳細仕様・単元別の現在地（最新状況の一次情報源）
- `math_service_design_summary.md`
- `problem_authoring_workflow.md`
- `_TEMPLATE_for_page_generation.md`
- `problem_master/`配下の各xlsx（`quadratic_function_problem_master.xlsx` / `trigonometric_ratio_problem_master.xlsx` / `data_analysis_problem_master.xlsx` / `expression_calculation_problem_master.xlsx`）

このREADMEは概要のみを持ち、詳細仕様・現在地の細部は重複して記載しません。
