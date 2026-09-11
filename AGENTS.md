## プロジェクトの目的

高校数学の学習ナビゲーションサイト **「高校数学ナビ」** の公開試作です。

公開URL：

- https://math-navi.com

中心価値は、問題や詳しい解説を大量に増やすことではなく、

> **「何をやるか」「何を後回しにするか」「どういう順番で考えるか」を明確にすること**

です。

現在、数学I「二次関数」を上位区分として、M1-QF-001〜054の54問について、

- 独立検算
- 教材化
- asset生成
- PC実画面レビュー
- スマホ狭幅での主要導線・DB表示確認と初回レスポンシブ調整
- Codex構造監査
- 共通3ペインDB UIへの統合
- 各問題固有URLの静的生成
- GitHub Pages公開
- TOPページの独自ビジュアルデザイン（hero・DBプレビュー・CONCEPTセクション等）実装

まで完了しています。

この54問の内訳は以下です。

- M1-QF-001〜027：二次関数
- M1-QF-028〜041：二次方程式・グラフと二次方程式
- M1-QF-042〜054：二次不等式

スマートフォンは主要導線・DB表示の初回狭幅確認まで完了しています。現行レスポンシブ仕様を、明示的な依頼なしに大きく変更しないでください。

TOPページ（`/`）の現行ビジュアルデザイン（配色・タイポグラフィ・hero・DBプレビュー・CONCEPTセクションの構成等）も人間レビュー済みです。明示的な依頼なしに大きく変更しないでください。

旧6サンプルのデータ・コンポーネントは開発資産として残していますが、公開routeは生成しません。理由なく再公開しないでください。

---

## 三角比（試験バッチ）の現在地

数学I「三角比」M1-TR-001〜041（41問）について、独立検算・教材化・asset生成・実画面レビュー・Opus横断レビュー・Codex構造監査まで完了しています。本番公開はまだです。

- 正本・同期先はQFと同じ枠組みを共有します：正本`math_db_quadratic_working/problems/`・`assets/`のM1-TR-*ファイル、スナップショット`src/content/trig4/`・`src/content/trig4-assets/`（`npm run sync-content`が両方を同期）。
- 対応するContent Collectionは`trig4`（`src/content.config.ts`）、表示は`prepareTrigEntry.ts`経由でQFと同じ`Quadratic27Detail.astro`を再利用します。
- 中央一覧の4区分（三角比の基本（0〜90°）／三角比の拡張（0〜180°）／平面図形と三角比／空間図形と三角比）は`src/utils/trigDbItems.ts`の`SECTION_TO_GROUP`で判定し、QFの`quadraticDbItems.ts`と同じ方式（section値ベース、問題IDレンジではない）です。
- ルートは`/math1/trig/`・`/math1/trig/M1-TR-001/`〜`/math1/trig/M1-TR-041/`ですが、**すべてnoindexの試験用ページで、sitemapには含めません**。人間レビュー・構造監査・本番公開判断が済むまで、QFと同格の公開contractへ昇格させないでください。
- 三角比masterは`trigonometric_ratio_problem_master.xlsx`（`problem_master/`配下、QFのmasterと同じフォルダ）です。
- M1-TR-008の問題文・最終解答の表、M1-TR-015の警告文表示のため、共通parser（`src/utils/markdownSections.ts`）にremark-gfm・rehype-rawを追加済みです。既存54問はパイプ表・生HTMLを使っていないため表示への影響はありません。
- M1-TR-017〜020の幾何asset（正弦定理・余弦定理の三角形図）は、`pa-*`とは別の役割別CSSクラス`geo-*`（頂点・角度・辺でサイズ/太さを分ける）を使っています。新しい三角比幾何assetを作る場合はこの方式を踏襲し、`pa-*`と混在させないでください。

---

## 正本と責任範囲

教材制作の正本はWeb repoの外側にあります。

- Markdown正本：`math_db_quadratic_working/problems/`
- asset正本：`math_db_quadratic_working/assets/`

Web repoでは、GitHub Actions単独でbuildできるよう公開用スナップショットを保持します。

- `src/content/quadratic27/`
- `src/content/quadratic27-assets/`

**公開用スナップショットは正本ではありません。直接編集しないでください。**

教材内容・assetを変更する場合は、原則として制作側の正本を変更し、その後Web repoで、

```sh
npm run sync-content
```

を実行してMarkdownとassetを同期します。

`sync-content` はローカルの制作側フォルダを必要とします。GitHub Actionsでは実行せず、commit済みのスナップショットだけでbuildします。

正本Markdownの数学的固定内容には、少なくとも以下を含みます。

- 問題文
- 問題メタ
- 解法メタ
- ThinkingFlowの見出し・順序
- 各Flowの中間結果・数式・確認事項
- 最終解答
- asset配置情報

これらを、明示的なユーザー指示なしに勝手に数学的変更しないでください。

問題メタ・解法メタは人間側の価値です。初回教材化時に書き換え・言い換え・整文しません。
人間レビューで具体的な修正指示が与えられた場合のみ、その指示範囲で正本Markdownを更新して構いません。

ページ生成は `verification_status: 独立検算済み` の問題だけを対象にします。

---

## 公開URLとDB UIの契約

問題表示は `ProblemDbShell.astro` を共通3ペインシェルとして使用します。

基本構造：

> **科目・単元 ｜ 問題一覧 ｜ 選択中の問題詳細**

主要route：

- `/app/`：問題DBへの入口
- `/math1/quadratic/`：数学I「二次関数」上位区分の単元トップ
- `/math1/quadratic/M1-QF-001/` 〜 `/math1/quadratic/M1-QF-054/`：各問題の固有URL

個別問題URLをブログ型・縦長型の別UIへ戻さないでください。
**1問題＝1固有URL、表示UI＝共通DBシェル**が現行仕様です。

各個別URLはJavaScriptだけで問題を後付け表示するのではなく、Astroの静的生成によって、その問題固有の本文をHTML内に持たせます。

中央問題一覧は、検索エンジンが辿れる通常の `<a href>` で各問題URLへリンクします。
SPA化や複雑なクライアント状態管理を、明示的な要求なしに導入しないでください。

### 中央問題一覧の分類・共有コンポーネント

中央問題一覧は、数学Iでは「二次関数／二次方程式／二次不等式」の3区分アコーディオン＋行リストで表示します。

- 3区分への分類は問題IDのレンジではなく、正本frontmatterの `section` 値をキーにした対応表（`src/utils/quadraticDbItems.ts` の `SECTION_TO_GROUP`）で行います。分類ロジック自体は `src/utils/dbCenterList.ts`（`groupCenterItems`）に一本化しています。
- 一覧のマークアップ・スタイルは `src/components/ProblemGroupList.astro` に一本化し、PC中央列・スマホ用問題一覧ダイアログの両方から同じ実装を再利用します。
- 新しい単元を追加する場合や表示を調整する場合も、この対応表とコンポーネントを流用してください。`ProblemDbShell.astro` 側や別コンポーネントに、もう一つ別の分類ロジックを増やさないでください。

### スマートフォン表示

PC幅では現在の3ペインUIを維持します。狭幅では、同じ `ProblemDbShell.astro` を使ったまま表示順を次のように切り替えます。

> **ヘッダー → 選択中の問題詳細 → 折りたたみ式問題一覧 → 科目・単元**

- 個別問題URLへ直接着地した利用者が、問題本文より先に全問題一覧をスクロールする構造へ戻さない
- 問題一覧はネイティブの `details/summary` を使い、スマホでは初期状態を閉じる
- PC幅では問題一覧を従来どおり常時表示し、3ペインの見た目を維持する
- DBヘッダーの「高校数学ナビ」はスマホでも1行表示を維持し、`/` へのリンクとして機能させる
- Privacy／Disclaimer／Contact等のヘッダーリンクを狭幅で見切れさせない
- スマホ専用の別ページや別DBを作らず、共通シェルのレスポンシブ挙動として実装する
- 問題本文・ThinkingFlow・最終解答を読んでいる最中でも問題一覧へ移動できるよう、画面右上固定のピルボタン（「問題一覧」）からネイティブ `<dialog>`（`showModal()`）を開き、中央列と同じ `ProblemGroupList` を表示します。背景操作の無効化・フォーカストラップ・Escでの close はブラウザ標準の `<dialog>` 機能に任せ、自前実装を増やさないでください。PC幅ではこのボタン・ダイアログは表示しません。

---

## SEOの現行契約

以下を維持してください。

### `/app/`

- `noindex,follow`
- canonicalは `/app/` 自身
- sitemapには載せない
- robots.txtでDisallowしない

### `/math1/quadratic/` と個別問題URL

- index対象
- noindexを付けない
- 個別問題は固有title / description
- canonicalは各URL自身
- `/app/` へcanonical統合しない

### sitemap / robots

`sitemap.xml` は検索対象ページを掲載します。
現行54問時点の内訳は、

- `/`
- `/math1/quadratic/`
- 個別問題54URL
- `/privacy/`
- `/disclaimer/`
- `/contact/`

です。

`/app/` と旧6サンプルrouteはsitemapへ含めません。

`robots.txt` の基本形：

```text
User-agent: *
Allow: /

Sitemap: https://math-navi.com/sitemap.xml
```

問題追加時に、既存のContent Collectionベースのsitemap生成を壊さないでください。

---

## 問題ページの現行構造

右ペインの問題詳細は基本的に以下です。

1. 問題情報
2. 問題
3. 必要な場合のみ「問題の言い換え」
4. 問題メタ（スマホでは開閉式、初期状態は閉じる）
5. 解法メタ（スマホでは開閉式、初期状態は閉じる。問題メタとは独立して開閉）
6. ThinkingFlow
7. 最終解答

問題メタ・解法メタの開閉はスマホ幅だけの挙動です。PC幅では従来どおり常時展開のままにしてください。

### 問題の言い換え

`## 問題の言い換え` が存在する場合だけUIを表示します。

問題IDのハードコードで判定せず、Markdown sectionの存在で汎用的に処理してください。

通常の数学的条件は `## 問題` に残し、補助的な言い換えだけを分離します。

### ThinkingFlow

現行UIは一覧型アコーディオンです。

- 初期状態：全Flowの題名を表示、本文は閉じる
- 各Flow：個別開閉
- 「考え方を全部見る」：全開
- 全開後：まとめて閉じられる
- 最終解答：ThinkingFlowとは独立状態

Flow数は固定しません。

通常問題：

```text
## ThinkingFlow
### 1. ...
### 2. ...
```

小問付き問題：

```text
## ThinkingFlow
### (1)
#### 1. ...
#### 2. ...

### (2)
#### 1. ...
```

小問構造・Flow構造を問題IDで特別扱いしないでください。

開閉には軽いアニメーション（CSS Gridの `grid-template-rows: 0fr → 1fr` ＋ opacity、`prefers-reduced-motion` では即時開閉）を使っています。最終解答、およびスマホの問題メタ／解法メタの開閉も同じ手法を再利用しているため、新しい開閉アニメーション実装を増やさないでください。

---

## assetルール

assetの表示位置はファイル名ではなく `problem.md` のmetadataを正本とします。

- 通常Flow：`placement + flow`
- 小問内Flow：`placement + part + flow`
- 問題文：`placement: problem`
- 最終解答：`placement: final_answer`

`problem.svg` のようなファイル名だけから表示位置を推測しないでください。

assetは必要最小限とし、数学的に意味のある視覚補助として使います。
色・線幅・ラベル位置等は実装側で調整できますが、人間レビュー済みassetを理由なく作り直さないでください。

公開用assetスナップショットだけを直接修正しないでください。正本assetを修正して再同期します。

---

## 公開・計測

公開基盤：

- Hosting：GitHub Pages
- Deploy：GitHub Actions
- Deploy branch：`master`
- Node.js：24
- 正式URL：`https://math-navi.com`

GA4は `src/components/Analytics.astro` を共通利用します。

- `BaseLayout.astro`
- `ProblemDbShell.astro`

の双方で利用し、1ページ内で二重読み込みしないこと。

新規ページは、原則として既存のGA4対応済み共通レイアウト／シェルを利用してください。
別レイアウトを新設する場合はGA4計測漏れを確認します。

公開情報ページ：

- `/privacy/`
- `/disclaimer/`
- `/contact/`

ContactはGoogleフォームへの外部リンク方式です。
PrivacyのGoogle Analytics／Googleフォームに関する記述を、実装変更と矛盾させないでください。

---

## 開発ルール

- Astro + TypeScript を使用する
- 教材データと表示UIを分離する
- 制作正本とWeb公開スナップショットを分離する
- 問題ID別の場当たり的な分岐を増やさない
- 不要な機能を勝手に追加しない
- ログイン・ユーザー管理を作らない
- データベースを導入しない
- 課金機能を作らない
- 外部AI APIを直接接続しない
- 既存の人間レビュー済みUI・asset・教材文を、リファクタリング目的だけで変更しない
- 既存のroute・canonical・noindex・sitemap・GA4契約を、理由なく変更しない
- 範囲外の修正が必要に見える場合は、先に報告して確認する

既存の `Quadratic27...` 等の旧名称がコード上に残っていても、名称だけを理由に勝手にrenameしないでください。

---

## build・監査

教材変更・構造変更後は、必要に応じて以下を確認します。

- `npm run build`
- KaTeXエラー
- asset参照切れ
- `part / flow` 配置不整合
- parser上のsection / subsection / Flow欠落
- 意図しない問題IDハードコード
- repo外依存が復活していないか
- 個別URLを直接開いたとき該当問題が初期選択されるか
- 個別HTMLに固有の問題本文が含まれるか
- title / description / canonical / noindexの意図しない変更
- Analyticsの二重読み込み

現在のM1-QF-001〜054はCodex構造監査済みで、FIX相当の構造的不整合はありません。

既存54問を変更した場合は、変更内容に応じて再監査・再独立検算が必要かを判断してください。
純粋なUI・余白・asset描画調整等は、数学的固定内容を変えない限り原則として再独立検算対象ではありません。

---

## Documentation

詳細仕様は、READMEより以下の正本文書を優先してください。

- `math_service_design_summary.md`
- `problem_authoring_workflow.md`
- `_TEMPLATE_for_page_generation.md`
- `quadratic_function_problem_master.xlsx`

README / AGENTS.mdには概要と作業境界を置き、正本文書と同じ細則を過剰に重複させないでください。
