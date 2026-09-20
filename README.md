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

数学I「二次関数」「三角比」「データの分析」の3単元・計118問を本番公開しています。

- M1-QF-001〜054（二次関数）
  - M1-QF-001〜027：二次関数
  - M1-QF-028〜041：二次方程式・グラフと二次方程式
  - M1-QF-042〜054：二次不等式
- M1-TR-001〜041（三角比、本番公開commit `90cb5c5`）
  - M1-TR-001〜015：三角比の基本・拡張
  - M1-TR-016〜035：平面図形と三角比
  - M1-TR-036〜041：空間図形と三角比
- M1-DA-001〜023（データの分析、本番公開commit `13fce88`）
  - M1-DA-001〜005：代表値と度数分布
  - M1-DA-006〜009：四分位数と箱ひげ図
  - M1-DA-010〜015：分散と標準偏差
  - M1-DA-016〜019：散布図と相関
  - M1-DA-020〜023：仮説検定

3単元とも、正本Markdown作成・独立検算・教材化・asset生成・配置・共通3ペインDB UIへの統合・各問題固有URLの静的HTML生成・GitHub Pagesでの公開・Codex構造監査まで完了しています（TRはさらにOpus asset横断レビューも実施）。**DAはOpus asset横断レビューのみ未実施のまま本番公開しています。**

数学I「数と式」M1-EC-001〜013（式の計算、全13問独立検算済み）は、正本作成・教材化・技術実装（ページ生成・DB統合・新設の任意セクション「事前知識・使用公式」の初回実装）・build確認・commitまで完了していますが、2026-09-20時点でまだpush・本番公開前です。詳細は`AGENTS.md`「数と式「式の計算」の現在地」「事前知識・使用公式」節を参照してください。

スマートフォンは主要導線・DB表示の初回狭幅確認まで完了しています。TOPページの現行ビジュアルデザインも人間レビュー済みです。2026-09に、TOPページ・個別問題ページの装飾を整理するUIブラッシュアップを実施し、masterへマージ済みです（詳細は`AGENTS.md`「UIブラッシュアップ」節を参照）。続けて2026-09-18に、TOP/DBの配色・面の色温度統一、ヘッダー色の調整、DB問題詳細への表示番号追加・中央一覧の整列調整も行っています（同節に追記）。TOPページのDBプレビュー画像も、その都度最新UIのスクリーンショットへ差し替えています。

## AI質問機能・外部追加演習リンク

ThinkingFlow単位のAI質問機能（Cloudflare Worker＋Gemini接続）は実装・本番Worker構築・本番end-to-end実証まで完了していますが、AI機能群全体の整備が進むまで、本番では`PUBLIC_AI_ENABLED`により意図的にOFFにしています（Cloudflare本番Worker自体はdeploy済み）。

AI質問機能・外部追加演習リンクはいずれも対象がQF・TRの95問のみで、**データの分析（M1-DA-001〜023）はまだ対象外**です（AI-context JSON生成・外部リンクデータともに未拡張）。

公開95問（QF・TR）のうちFTEXT（CC BY 4.0の外部フリー教材）とEXACT水準で対応する47問には、問題文直下に「追加で練習する」外部リンクを実装し、本番公開済みです。

詳細は`math_service_design_summary.md`第36節・第37節を参照してください。

## 公開UIとURL

PCの基本UIは、

> 科目・単元 ｜ 問題一覧 ｜ 選択中の問題詳細

の3ペインDB型です。

主要URL：

- `/app/`：問題DBへの入口。検索インデックス対象外（`noindex,follow`）
- `/math1/quadratic/`：数学I「二次関数」上位区分の単元トップ、`/math1/quadratic/M1-QF-001/`〜`/M1-QF-054/`
- `/math1/trig/`：数学I「三角比」上位区分の単元トップ、`/math1/trig/M1-TR-001/`〜`/M1-TR-041/`
- `/math1/data-analysis/`：数学I「データの分析」上位区分の単元トップ、`/math1/data-analysis/M1-DA-001/`〜`/M1-DA-023/`

3単元とも同格の公開contract（index対象・sitemap掲載・canonicalは各URL自身）です。

`/math1/suto-shiki/`（数学I「数と式」、`/math1/suto-shiki/M1-EC-001/`〜`/M1-EC-013/`）も同じ設計で実装済みですが、2026-09-20時点で未push・未公開です。

個別問題URLもブログ型ページではなく、共通DB UIを表示します。
各URLはAstroで独立した静的HTMLとして生成され、固有のtitle / description / canonical / 問題本文を持ちます。

中央問題一覧は単元ごとにアコーディオン＋行リストで表示します（二次関数＝二次関数／二次方程式／二次不等式の3区分、三角比＝4区分、データの分析＝5区分）。分類は問題IDのレンジではなく正本frontmatterの`section`値から決めており（`src/utils/dbCenterList.ts` / `quadraticDbItems.ts` / `trigDbItems.ts` / `dataAnalysisDbItems.ts`）、一覧のマークアップは`ProblemGroupList`コンポーネントとしてPC・スマホ共通・全単元共通で再利用しています。

スマートフォンでは同じ `ProblemDbShell` を使い、表示順を次のように切り替えます。

> ヘッダー → 選択中の問題詳細 → 折りたたみ式の問題一覧 → 科目・単元

問題一覧は初期状態では閉じ、PC幅では従来どおり3ペインの中央一覧として常時表示します。DBヘッダーの「高校数学ナビ」はスマホでも1行表示を維持し、Privacy／Disclaimer／Contactのリンクを画面外へ見切れさせません。

さらにスマホでは、本文やThinkingFlowを読んでいる最中でも画面右上固定の「問題一覧」ボタンから、ネイティブ`<dialog>`で同じ問題一覧をいつでも開けます。問題メタ・解法メタは「元講師の独り言」という上位見出しの下にまとめ、PC・スマホ共通で初期状態は閉じています（以前はスマホ幅だけ開閉式・PC幅は常時展開でしたが統一しました）。

## 正本とWeb公開スナップショット

教材データの正本はWeb repoの外側にあります。

- 正本Markdown：`math_db_quadratic_working/problems/`
- 正本asset：`math_db_quadratic_working/assets/`

GitHub Pagesのbuildでは、Web repo内の公開用スナップショットを使用します。

- `src/content/quadratic27/`：二次関数の公開用Markdown、`src/content/quadratic27-assets/`：対応asset
- `src/content/trig4/`：三角比の公開用Markdown、`src/content/trig4-assets/`：対応asset
- `src/content/dataAnalysis/`：データの分析の公開用Markdown、`src/content/dataAnalysis-assets/`：対応asset
- `src/content/expressionCalculation/`：数と式（式の計算）の公開用Markdown、`src/content/expressionCalculation-assets/`：対応asset（2026-09-19時点で未commit）

公開用スナップショットは**派生データであり正本ではありません。直接編集しません。**

正本を変更した後は、Web repoで以下を実行します。

```sh
npm run sync-content
```

Markdownとassetを同期した後、buildしてからcommit / pushします。

## 現行ThinkingFlow UI

ThinkingFlowは、初期状態では各Flowの題名だけを一覧表示し、本文は閉じています。

- 各Flowを個別に開閉
- 「考え方を全部見る」で全開
- 全開後はまとめて閉じられる
- 最終解答はThinkingFlowとは独立して開閉

開閉にはCSS Grid（`grid-template-rows: 0fr → 1fr` ＋ opacity）による軽いアニメーションを使い、`prefers-reduced-motion`では即時開閉になります。最終解答や「元講師の独り言」内の解法メタの開閉も同じ手法です。見た目（縦レール・番号マーカー・★・＋／−アイコン等）はUIブラッシュアップで再設計済み（master反映済み、詳細は`AGENTS.md`「UIブラッシュアップ」節）です。構造・開閉ロジックは変更していません。

問題によって補助的な言い換えが必要な場合だけ、`## 問題の言い換え` を用いて「言い換えを見る」を表示します。

## 公開・計測

- Hosting：GitHub Pages
- Deploy：GitHub Actions（`master` push）
- Node.js：24
- 正式URL：`https://math-navi.com`
- Search Console：Domain property登録済み、sitemap送信済み
- sitemap：検索対象ページをContent Collectionから生成
- robots：`public/robots.txt`
- GA4：導入済み

`/privacy/`、`/disclaimer/`、`/contact/` を公開しています。
お問い合わせはGoogleフォームへの外部リンク方式です。

## 開発上の基本方針

- Astro + TypeScript
- 教材データと表示UIを分離
- 制作正本とWeb公開スナップショットを分離
- 問題ID別の場当たり的な分岐を増やさない
- 不要な機能を勝手に追加しない
- ログイン・ユーザー管理は作らない
- データベースは導入しない
- 課金機能は作らない
- 外部AI APIは直接接続しない
- 既存SEO・canonical・GA4・公開routeの契約を無断で崩さない
- PCの3ペインUIと、スマホの問題詳細優先・問題一覧折りたたみUIの両方を現行仕様として維持する

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

## 関連する正本文書

教材・制作ルールの詳細は、以下の正本文書を優先します。

- `math_service_design_summary.md`
- `problem_authoring_workflow.md`
- `_TEMPLATE_for_page_generation.md`
- `problem_master/`配下の各xlsx（`quadratic_function_problem_master.xlsx` / `trigonometric_ratio_problem_master.xlsx` / `data_analysis_problem_master.xlsx`）

READMEは概要のみを持ち、詳細仕様を重複して抱えません。
