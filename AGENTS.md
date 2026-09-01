## プロジェクトの目的

高校数学の学習ナビゲーションサイトのプロトタイプ開発です。

現在の対象範囲は、**性質の異なる6分野・6問の代表問題を用いた
問題ページ構造（UI・思考フロー・図表・分岐の表現）の検証** です。
数学Iを含む数学全体を網羅的に作ることが目的ではありません。

対象は以下の承認済み6問に限定します。この6問以外の教材コンテンツを
自由に追加してよいという意味ではありません。

1. 数と式｜因数分解（実装済み）
2. 二次関数｜文字を含む最大・最小（未実装）
3. 三角比｜円に内接する四角形（未実装。問題タイプ〔図＋補助線＋既習事項を
   つなぐ〕は確定しているが、具体的な数値設定は未確定。本実装時に教科書・
   学校準拠問題集の標準的な出題構成を確認のうえ調整する）
4. データの分析｜相関係数（未実装）
5. 確率｜反復試行（未実装）
6. 図形の性質｜メネラウスの定理（未実装）

### 例外：二次関数のみ27問

上記2「二次関数」については、ユーザー指示により例外として、
数学I・二次関数の代表問題1問に代えて、**M1-QF-001〜027の27問**を
ローカルWeb監査用に実装することを承認済みとする。

正本は `math_db_quadratic_working/problems/` のMarkdownであり、
Astro Content Collectionsで読み込む（TSへの手動転記・二重管理はしない）。
他の5分野については、上記の1問限定ルールを維持する。

現段階では完成サービスを作ることが目的ではなく、
問題ページのUI・教材構造・学習導線を検証するための **クローズドな試作** です。

このサイトでは、問題数や詳細解説を増やすこと自体を価値としません。
「何をやるか・何をやらないか・どういう順番で考えるか」を明確にすることを重視します。

## 開発ルール（厳守）

- Astro + TypeScript を使用する
- 上記の承認済み6問以外の教材コンテンツは勝手に作らない（二次関数の27問例外を除く）
- ログイン・ユーザー管理は作らない
- データベースは導入しない
- 課金機能は作らない
- 外部AI APIを直接接続しない（後述のプロンプト生成・コピー機能に留める）
- SEOや本番公開対応はまだ行わない
- 不要な機能を勝手に追加しない
- まずはシンプルで変更しやすい構造を優先する
- 教材データと表示UIは分離する（コンテンツはデータとして持ち、コンポーネントはそれを描画するだけにする）

上記のルールは既定の動作より優先されます。範囲外の作業が必要そうに見えても、
勝手に対象を広げず、まずユーザーに確認してください。

## 問題ページの基本構成

1. 問題
2. 問題の位置づけ
3. 重要度・難易度
4. 短い所感
5. 解答フロー
6. 解答フローの各段階から「ここが分からない」を選べる
7. 選択した段階について外部生成AIへ質問するためのプロンプトを生成・コピーできる
8. 関連問題・前後ページへのナビゲーション

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
