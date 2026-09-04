# 高校数学データベース - 推薦特化型 -

推薦・定期試験向けの高校数学学習ナビゲーションサイトのクローズド試作です。

問題や長い解説を大量に増やすことより、

- 何を優先して解くか
- 何を後回しにできるか
- どういう順番で考えるか

を分かりやすく示すことを重視しています。

## 現在地

数学I「二次関数」M1-QF-001〜054の54問について、以下まで完了しています。

- 正本Markdown作成
- 独立検算
- 教材ページ生成
- asset生成・配置
- PC実画面レビュー
- Codex構造監査
- 最終build確認

スマートフォン表示の確認・調整は別Phaseとして扱います。

## データと表示の分離

教材データの正本は `math_db_quadratic_working/problems/` の `problem.md` です。

Astro側では正本Markdownを読み込み、parser / prepare処理を通して共通UIへ描画します。
教材内容をTypeScriptへ手動転記して二重管理しません。

assetの表示位置もファイル名ではなく、`problem.md` のmetadataを正本とします。

- 通常Flow：`placement + flow`
- 小問内Flow：`placement + part + flow`

## 現行ThinkingFlow UI

ThinkingFlowは、初期状態では各Flowの題名だけを一覧表示し、本文は閉じています。

- 各Flowを個別に開閉
- 「考え方を全部見る」で全開
- 全開後はまとめて閉じられる
- 最終解答はThinkingFlowとは独立して開閉

問題によって補助的な言い換えが必要な場合だけ、`## 問題の言い換え` を用いて「言い換えを見る」を表示します。

## 開発上の基本方針

- Astro + TypeScript
- 教材データと表示UIを分離
- 不要な機能を勝手に追加しない
- ログイン・ユーザー管理は作らない
- データベースは導入しない
- 課金機能は作らない
- 外部AI APIは直接接続しない
- SEO・本番公開対応は、明示的にそのPhaseへ入るまで行わない
- スマホ対応はPC版の締め工程とは分離して扱う

## Commands

プロジェクトルートで実行します。

```sh
npm install
npm run dev
npx astro build
npm run preview
```

## 関連する正本文書

教材・制作ルールの詳細は、以下の正本文書を優先します。

- `math_service_design_summary.md`
- `problem_authoring_workflow.md`
- `_TEMPLATE_for_page_generation.md`
- `quadratic_function_problem_master.xlsx`

READMEは概要のみを持ち、詳細仕様を重複して抱えません。
