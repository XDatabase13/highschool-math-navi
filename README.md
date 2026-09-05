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

数学I「二次関数」を上位区分として、M1-QF-001〜054の54問について以下まで完了しています。

内訳：

- M1-QF-001〜027：二次関数
- M1-QF-028〜041：二次方程式・グラフと二次方程式
- M1-QF-042〜054：二次不等式

完了済み：

- 正本Markdown作成
- 独立検算
- 教材化
- asset生成・配置
- PC実画面レビュー
- スマホ狭幅での主要導線・DB表示確認と初回レスポンシブ調整
- Codex構造監査
- 共通3ペインDB UIへの統合
- 各問題固有URLの静的HTML生成
- GitHub Pagesでの公開
- HTTPS
- Search Console / sitemap / robots
- Google Analytics 4
- TOPページの独自ビジュアルデザイン（hero・DBプレビュー・CONCEPTセクション等）

スマートフォンは主要導線・DB表示の初回狭幅確認まで完了しています。TOPページの現行ビジュアルデザインも人間レビュー済みです。

## 公開UIとURL

PCの基本UIは、

> 科目・単元 ｜ 問題一覧 ｜ 選択中の問題詳細

の3ペインDB型です。

主要URL：

- `/app/`：問題DBへの入口。検索インデックス対象外（`noindex,follow`）
- `/math1/quadratic/`：数学I「二次関数」上位区分の単元トップ
- `/math1/quadratic/M1-QF-001/` 〜 `/math1/quadratic/M1-QF-054/`：各問題の固有URL

個別問題URLもブログ型ページではなく、共通DB UIを表示します。
各URLはAstroで独立した静的HTMLとして生成され、固有のtitle / description / canonical / 問題本文を持ちます。

スマートフォンでは同じ `ProblemDbShell` を使い、表示順を次のように切り替えます。

> ヘッダー → 選択中の問題詳細 → 折りたたみ式の問題一覧 → 科目・単元

問題一覧は初期状態では閉じ、PC幅では従来どおり3ペインの中央一覧として常時表示します。DBヘッダーの「高校数学ナビ」はスマホでも1行表示を維持し、Privacy／Disclaimer／Contactのリンクを画面外へ見切れさせません。

## 正本とWeb公開スナップショット

教材データの正本はWeb repoの外側にあります。

- 正本Markdown：`math_db_quadratic_working/problems/`
- 正本asset：`math_db_quadratic_working/assets/`

GitHub Pagesのbuildでは、Web repo内の公開用スナップショットを使用します。

- `src/content/quadratic27/`：公開用Markdown
- `src/content/quadratic27-assets/`：公開用asset

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
- `quadratic_function_problem_master.xlsx`

READMEは概要のみを持ち、詳細仕様を重複して抱えません。
