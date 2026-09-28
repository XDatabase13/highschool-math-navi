# 高校数学ナビ 型ページ実装仕様 v1.1

- 確定日: 2026-09-28
- 対象: `math_db_quadratic_working` / `highschool_math_db`
- 状態: 実装前・最終仕様確定
- 旧版: `type_page_implementation_spec_v1_2026-09-28.md`
- 前提資料: `type_page_preimplementation_audit_2026-09-28.md`
- 今回の非対象: Web実装、master更新、37型の本文作成、公開ページ生成、SEOデータ変更

## 0. 仕様の結論

型ページは既存の問題DBを置き換えず、同じDBシェルの中に追加するナビゲーション層とする。

```text
PC左列: 科目・単元（現状維持）
PC中央列: 「問題タイプ / 問題一覧」の切替
PC右列: 選択した型ページ、または既存問題詳細

スマホ: 既存「問題一覧」ボタン・dialogを維持
        dialog内に「問題タイプ / 問題一覧」の切替を追加
```

- 「問題一覧」は現行の分類・アコーディオン・行UIを変更しない。
- 「問題タイプ」は型ページだけを単元内のフラットリストで表示し、アコーディオンにしない。
- 型ページ本文の正本は `math_db_quadratic_working/type_pages/<型ページID>.md` とする。
- 型の構造、公開名、slug、状態、キーワード、所属問題、主副所属、役割、表示順の正本は各master xlsxとする。
- Web buildはxlsxを直接読まず、手動同期で生成・commitした構造スナップショットとMarkdownスナップショットだけを読む。
- `採用` 37件を `published`、`保留` 1件を `hold` に正規化する。公開route・ナビ・sitemapへ出すのはpublishedのみ。
- published 37件は、「37件の本文・description・人間レビューが全件完了」かつ「人間による明示的な公開承認」の2条件を満たしたときだけ一括公開する。37件そろっても自動公開はしない。途中の型だけを段階公開しない。
- 0〜36件（および承認前の37件）の正式Markdownは、教材正本として保存・同期・ローカル確認（dev）してよい。ただし公開ゲート通過まではproductionの型route・型nav・型sitemapを1件も有効化しない。空本文、仮本文、AIによる穴埋め本文は公開しない。
- holdのQF-T10は従来どおり非公開とする。
- 型ページH1はmasterの公開名。本文は人間が書く「型の概要」2〜4文だけを常時表示する。
- descriptionは、人間執筆の概要を基にAIが案を作成してよいが、人間がレビュー・承認したものだけをMarkdownへ保存し公開する。
- 型ページ内の問題は、既存問題データの `display_order` 昇順で表示する。
- 各問題はネイティブ `<details>` で問題文と `placement: problem` のassetだけを開閉し、既存個別ページへの「この問題を解く」リンクを持つ。
- 同一型ページ内で開ける問題previewは原則1問だけとし、別のpreviewを開くと、それまで開いていたpreviewを閉じる。
- 型一覧はmasterの明示的な `表示順` を使う。初期値は各単元のT01→Tnn順とする。
- xlsx同期・検証には、同等依存がないことを確認したうえで `exceljs` をdevDependencyとして使用してよい。ブラウザbundle/runtimeへ含めない。
- 初版では推薦順、4×4、ユーザー条件、スコア、推薦理由を表示しない。
- 将来推薦は候補問題集合の「表示順を決める別レイヤー」とし、master・型Markdown・既存問題データを汚染しない。

## 1. 正本と生成物の責務

### 1.1 正本

| 情報 | 正本 | 備考 |
|---|---|---|
| 型ページID、公開名、slug、状態、表示順 | 各master xlsx「型ページ管理」 | Web側に手入力で複製しない |
| 主検索キーワード、補助検索キーワード、検索意図、構成メモ | 各master xlsx「型ページ管理」 | 編集・SEO監査用。補助KWは画面へ列挙しない |
| 主所属、副所属、問題ごとの役割 | 各master xlsx「公開問題管理」 | 現行master注記どおり、所属・役割はこちらを最終正本とする |
| 型ページ本文、承認済みmeta description | `type_pages/<型ページID>.md` | 公開文章の正本。概要は人間執筆、descriptionは人間承認必須 |
| 問題文、title、重要度、難易度、表示順、問題asset | 既存 `problems/*.md` / `assets/*` | 型Markdownへ重複記載しない |

### 1.2 Web repoの生成物

| 生成物 | 置き場所 | 扱い |
|---|---|---|
| 正規化済み型構造 | `highschool_math_db/src/data/type-pages.generated.json` | 同期スクリプト生成。直接編集禁止 |
| 型Markdown公開スナップショット | `highschool_math_db/src/content/typePages/*.md` | 正本からコピー。直接編集禁止 |
| README notice | `src/content/typePages/README.md` | 既存問題スナップショットと同じ編集禁止表示 |

GitHub Actionsでは隣接教材フォルダやxlsxの存在を前提にしない。buildの入力はcommit済みWebスナップショットだけとする。

### 1.3 masterへ追加する列

「型ページ管理」に `表示順` を追加する。初期値として各単元のT番号順（T01、T02、…、Tnn）を正式採用する。

- 型ページ一覧はmasterの `表示順` 昇順で表示する。
- Webはworksheet上の物理行順を使わない。
- Webは型ページID文字列から順序を暗黙推論しない。
- `表示順` は同一単元内で正の整数かつ重複不可とする。

`unitId`、URL、canonical、title全文、breadcrumb、Markdownパスは決定規則から生成できるため、master列として増やさない。

## 2. データ契約

### 2.1 単元設定

xlsxファイル名・問題ID prefix・Web collection・URLを1か所の設定で対応させる。

```ts
type TypePageUnitConfig = {
  unitId: 'quadratic' | 'trig' | 'data-analysis' | 'suto-shiki' | 'set-logic';
  unitName: string;
  subjectName: '数学I';
  problemPrefix: 'QF' | 'TR' | 'DA' | 'EC' | 'SL';
  collection:
    | 'quadratic27'
    | 'trig4'
    | 'dataAnalysis'
    | 'expressionCalculation'
    | 'setLogic';
  routeBase: string;
  masterFile: string;
  assetsRoot: string;
};
```

この設定は同期・route生成・問題preview・sitemapで共有し、5か所に別々の対応表を増やさない。

### 2.2 生成JSONの契約

```ts
type TypePageStatus = 'published' | 'hold';
type TypeMembership = 'primary' | 'secondary';

type TypeProblemRef = {
  problemId: string;
  membership: TypeMembership;
  role: string;
};

type TypePageRecord = {
  id: string;
  unitId: TypePageUnitConfig['unitId'];
  name: string;
  slug: string;
  status: TypePageStatus;
  displayOrder: number;
  primaryKeyword: string;
  problems: TypeProblemRef[];
};

type TypePageSnapshot = {
  schemaVersion: 1;
  typePages: TypePageRecord[];
};
```

#### フィールド規則

| フィールド | 規則 |
|---|---|
| `id` | masterの型ページID。全体一意。不変キー |
| `unitId` | masterファイルとunit configから付与 |
| `name` | masterの公開名。H1・一覧ラベル・breadcrumb名の正本 |
| `slug` | 小文字英数字と単一ハイフン。単元内一意 |
| `status` | `採用 → published`、`保留 → hold` |
| `displayOrder` | masterの明示列。単元内一意の正整数。行順やIDから補完しない |
| `primaryKeyword` | masterの主検索キーワード。画面への機械挿入はせず、文章制作・監査に使う |
| `problems` | 「公開問題管理」を正本として正規化。表示時は配列順でなく既存問題の `display_order` でsort |
| `membership` | 主所属はprimary、副所属はsecondary |
| `role` | 主所属は「型ページ内役割」、副所属は「副所属型ページ（ID：役割）」の役割部分 |

補助検索キーワード、検索意図、ページ内容概要、備考は同期時の監査とdescription制作には使うが、初版のWeb runtime JSONへは出さない。公開UIや推薦ロジックが使わない情報を配信契約へ増やさないためである。

### 2.3 Markdown collection契約

```ts
type TypePageMarkdownData = {
  type_page_id: string;
  description: string;
};
```

- filenameは `<type_page_id>.md` と完全一致させる。例 `QF-T03.md`。
- frontmatterは `type_page_id` と `description` だけを許可するstrict schemaとする。
- title、slug、unit、status、problem IDs、キーワードをMarkdownへ重複記載しない。
- `description` はそのページ固有のmeta descriptionであり、人間承認後の値だけを保存する。
- 公開にはpublished型のMarkdownが37件すべて必要。制作途中（0〜36件）のMarkdownは同期・ローカル確認できるが、productionの型route・nav・sitemapには出さない。公開承認済みなのに37件そろっていない場合はbuildを失敗させ、部分公開しない。
- 空本文、仮本文、AIによる穴埋め本文、未レビューdescriptionを公開入力として認めない。
- hold型はMarkdownなしを許可する。Markdownが存在してもroute・ナビ・sitemapへは出さない。
- masterに存在しないMarkdown、ID不一致、重複IDはエラー。

### 2.4 build時の結合結果

```ts
type PublishedTypePage = TypePageRecord & {
  status: 'published';
  description: string;
  overviewHtml: string;
  url: string;
  problems: Array<{
    ref: TypeProblemRef;
    entry: VerifiedProblemEntry;
    preview: ProblemPreview;
  }>;
};
```

`url`、title全文、canonical、breadcrumb、問題URLは保存せず、unit configとslug/IDから生成する。

## 3. Markdownテンプレートと制作フロー

### 3.1 確定テンプレート

```md
---
type_page_id: QF-T03
description: "二次関数の最大値・最小値を求める基本的な考え方と、定義域や頂点を見る際のポイントを整理します。"
---

## 型の概要

二次関数の最大値・最小値を、グラフの頂点と定義域の位置関係から判断する型です。平方完成して軸と頂点を確認し、定義域の端点と比べるところがポイントになります。
```

上記は書式例であり、37型の本文または公開用descriptionを生成するものではない。

### 3.2 本文ルール

- H1は書かない。H1はmasterの公開名からUIが生成する。
- bodyは `## 型の概要` を1つだけ持つ。
- 概要は合計2〜4文、原則1〜2段落とし、人間が執筆する。
- 概要は常時表示し、折りたたまない。
- 「この型は何をする問題か」「どこがポイントになりやすいか」までを書く。
- 主軸キーワードをH1・概要・descriptionの全体で自然に表現する。完全一致を機械的に何度も挿入しない。
- 許可するMarkdownは段落、強調、インライン数式を基本とする。
- 初版では追加見出し、箇条書き、表、画像、asset記法、生HTML、詳細解法、公式一覧、個別問題解説、推奨順を書かない。
- 問題ID、重要度、難易度、問題文を本文へ手入力しない。
- 個別問題へのリンクは本文に手入力せず、構造データから問題一覧を生成する。

### 3.3 meta description制作フロー

公開用descriptionは次の順序で制作する。

1. 人間が型の概要本文2〜4文を書く。
2. AIは、その概要、masterの主検索キーワード、検索意図を材料としてdescription案を作成してよい。
3. 人間が内容、SEO上の自然さ、本文との整合をレビューする。
4. 人間が承認したdescriptionだけを公開正本Markdownのfrontmatterへ保存する。

AIによる下書きは許可するが、AI出力の無レビュー自動採用、同期時の機械生成、空欄の自動穴埋めは禁止する。型の概要本文そのものは従来どおり人間執筆を基本とする。

### 3.4 自動検査と人間検査

自動でエラーにする:

- frontmatterの不足・余分なkey
- filenameと `type_page_id` の不一致
- `## 型の概要` の欠落・重複
- H1または別見出しの存在
- list/table/image/raw HTMLの使用
- 問題ID形式 `M1-XX-999` の本文混入
- 空のdescriptionまたは空本文
- published 37件のMarkdownが1件でも欠ける状態

自動ではwarningに留め、人間が判定する:

- 概要が実質2〜4文か（句点カウントは補助にしかならない）
- 主軸キーワードが自然に反映されているか
- 詳細解法・公式羅列・個別問題説明・推奨表現へ踏み込んでいないか
- descriptionと概要が不自然に重複していないか
- descriptionが概要・検索意図と整合しているか
- 読者が「何をする型か」「何がポイントか」を理解できるか

人間承認済みかどうかは文章から完全には自動判定できないため、37件のレビュー完了を公開チェックリストで管理する。新たなfrontmatter keyは増やさない。

## 4. master同期・検証仕様

### 4.1 同期コマンドとxlsx依存

新規 `scripts/sync-type-pages.mjs` を作り、既存 `npm run sync-content` から問題同期の後に呼ぶ。

```json
{
  "scripts": {
    "sync-problems": "node scripts/sync-quadratic-content.mjs",
    "sync-type-pages": "node scripts/sync-type-pages.mjs",
    "sync-content": "npm run sync-problems && npm run sync-type-pages"
  }
}
```

xlsx読取はNodeの同期・検証処理だけで完結させる。

1. 実装前にWeb repoの既存dependencies/devDependenciesと同期scriptを確認する。
2. 同等のxlsx読取依存が既にあれば、無条件に `exceljs` を重複追加せず既存依存を利用できるか確認する。
3. 同等依存がなければ `exceljs` をdevDependencyとして追加する。
4. xlsx読取依存をAstro component、client script、公開runtimeからimportしない。
5. build成果物とブラウザbundleへxlsx読取コードを含めない。

### 4.2 同期手順

1. 5 masterの「型ページ管理」「公開問題管理」を読む。
2. unit configを付与して38型を正規化する。
3. `採用/保留` を `published/hold` へ変換する。
4. `表示順` を読み、欠落・非整数・単元内重複を検査する。行順やIDから補完しない。
5. 「型ページ管理」の対象問題と「公開問題管理」の主副所属・公開名を双方向照合する。
6. 問題IDがmaster、教材正本Markdown、Web問題スナップショットのすべてに存在するか確認する。
7. published型が参照する全問題が `独立検算済み` で、Webのverified collection対象になることを確認する。
8. `type_pages/*.md` を検査し、存在する各ファイルの本文とdescriptionが空でないこと・書式規則を満たすことを確認する（0〜37件のどの状態でも同期可。件数は報告のみ）。
9. 別途、37件の人間レビュー完了を公開前チェックリストで確認する。公開は同期ではなく、公開承認フラグ（`src/data/type-page-publication.ts`）で決める。
10. 検査がすべて通った場合だけ、一時ディレクトリへJSONとMarkdownスナップショットを生成する。
11. 生成完了後にWeb repoの対象ディレクトリを置換する。途中失敗で既存正常スナップショットを消さない。
12. deterministic JSONとして出力する。timestamp等、入力不変でもdiffが出る値は入れない。

同期は公開を決めない。productionの公開集合は「37件完了＋公開承認」のときの37件か、それ以外の0件のどちらかだけで、1〜36件だけが公開される状態は作らない。

### 4.3 必須エラー条件

- ID、単元内slug、完全URL、単元内表示順の重複
- `表示順` の欠落・非正整数
- slug形式違反
- 未知の状態
- 型ページの所属問題0件、またはprimary問題0件
- 存在しない問題ID
- 型ページ管理と公開問題管理の片側だけにある所属
- 公開名不一致
- 副所属の `(副)` と問題側の副所属欄の不一致
- role空欄
- 型Markdownの重複・空本文・空description・書式違反
- 公開承認済みなのにpublished 37件のMarkdownがそろっていない状態（build error）
- hold型を公開対象配列へ混入
- orphan Markdown
- published型が未検算問題を参照
- 型slugと既存問題slug/予約routeの衝突

人間レビュー未完了は自動判定ではなく公開ゲートの失敗条件とする。

### 4.4 build時の再検証

同期時だけでなくbuildでも、生成JSONとContent Collectionの結合を検証する。CIにはxlsxがないため、build検証は生成スナップショット内部の整合性を対象にする。

- schemaVersion対応
- published件数37、holdはroute対象外
- 公開ゲート: 型Markdown 37件完了かつ公開承認のときだけ型route・nav・sitemapを生成。それ以外は0件（承認済みで37件未満はerror）
- 空本文・空descriptionなし
- problem collection参照の存在
- URL一意性
- sitemapとroute集合の一致

件数37は初版の一括公開監査として固定チェックしてよい。将来型を追加する段階では別仕様変更として「master集計との一致」へ置き換える。

## 5. PC表示仕様

### 5.1 初期選択

| 表示route | 初期タブ |
|---|---|
| `/app/` | 問題一覧 |
| 各単元トップ | 問題一覧 |
| 既存個別問題 | 問題一覧 |
| 型ページ | 問題タイプ |

これにより既存routeへ着地した利用者の初期表示を変えず、現行問題一覧導線を維持する。

### 5.2 中央列

中央列上部へ2択の切替を置く。

```text
[ 問題タイプ ] [ 問題一覧 ]
```

- 選択中を見た目と `aria-pressed` で示す。
- 各buttonは対応panelを `aria-controls` で参照する。
- panel切替は `hidden` 属性で行う。
- 初期状態はサーバー出力時点で正しく設定し、JS実行前の誤表示を避ける。
- 同一ページ内のPC・スマホ切替は1つの小さなcontrollerで同期可能な構造にする。
- localStorage、query parameter、SPA状態管理は導入しない。
- ページ遷移後はroute種別に基づく初期タブへ戻る。

#### 問題一覧panel

- 既存 `ProblemGroupList.astro` をそのまま使う。
- 現行section分類、アコーディオン、番号、title、重要度・難易度chip、選択表示を変えない。
- 各 `*DbItems.ts` と `groupCenterItems()` を変えない。
- 型ページrouteでも問題一覧panelには単元全問題を表示する。

#### 問題タイプpanel

- 新規 `TypePageList.astro` をPC・スマホで共有する。
- published型だけをmasterの `displayOrder` 昇順で表示する。
- `<nav><ul><li><a>` のフラットリスト。
- アコーディオン、重要度、難易度、問題数chip、説明文previewは付けない。
- 表示ラベルはmasterの公開名。
- 選択中の型だけ `aria-current="page"` と選択styleを付ける。
- hold型はDOMへ出さない。

### 5.3 右側本文領域

型ページ選択時は新規 `TypePageDetail.astro` を表示する。

```text
H1: 公開名

型の概要
  2〜4文（常時表示）

この型の問題
  問題preview details × N
```

- H1はmasterの公開名。
- 概要HTMLは型Markdownから生成。
- 「この型の問題」は構造データから生成し、Markdownへ書かない。
- 主所属・副所属を合わせ、既存問題の `display_order` 昇順。membershipによって順番を分けない。
- 同じ問題が同じ型へ重複登録されていたらbuild error。
- 初版UIではprimary/secondaryやroleを表示しない。関係情報はデータに保持する。

### 5.4 問題文preview

各問題をネイティブ `<details>` で表示する。

```text
▶ 013  最大・最小を求める問題       本命  2
   （開いたとき）
   問題文
   問題文配置の図・表
   [この問題を解く]
```

- 初期状態はすべて閉じる。
- 同一型ページの問題一覧内では、原則として1問だけopenにする。
- 別の問題previewを開いたら、同じ型ページ内でそれまで開いていたpreviewを閉じる。
- summaryには既存の3桁問題番号、問題title、重要度label、難易度を表示する。
- open時に表示するのは `## 問題` セクションと `placement: problem` のassetだけ。
- 問題を理解するための図・表・問題用assetは問題文の一部として必ずpreviewへ含める。
- 小問subsectionも問題文の一部として表示する。
- 問題の言い換え、問題メタ、解法メタ、事前知識、ThinkingFlow、最終解答、解答用asset、外部追加演習リンクは表示しない。
- CTA「この問題を解く」は既存個別問題URLへの通常の `<a href>`。
- 問題文とproblem assetはクライアントfetchせず静的HTMLへ含める。
- preview用に全詳細をprepareせず、問題セクションとproblem assetだけを読む `prepareProblemPreview` を新設する。

#### 単一open制御とアクセシビリティ

- `<details>` / `<summary>` のネイティブ操作性と意味論を維持する。
- `data-type-problem-list` 等の型ページ内コンテナにだけ最小限のJSを適用する。document全体の別の`details`は閉じない。
- コンテナ内の `toggle` eventを監視し、開いた対象が `HTMLDetailsElement` かつ `open === true` のときだけ、同じコンテナの他のopen要素を閉じる。
- 他要素を閉じた際に発生する `toggle` は `open === false` なので再処理しない。
- click専用実装にせず、キーボード操作やプログラムによるopen変更でも単一openを保つ。
- 開いたsummaryやCTAへスクリプトでfocusを移動しない。別previewを開いても利用者のfocusを現在のsummaryに残す。
- `<summary>` の標準キーボード操作を妨げる `preventDefault()` や独自button化を行わない。
- ネイティブ`details`が公開する状態へ、重複する手動 `aria-expanded` を付けない。
- JS無効時も全previewは個別に開閉でき、問題文とCTAへ到達できる。単一openは一覧性向上の漸進的強化とする。

### 5.5 problem assetとSVG衝突監査

- previewへ含めるassetは既存問題データで `placement: problem` と判定されたものだけとする。
- ThinkingFlow、解答、解法メタ等に属するassetを含めない。
- 同一型ページに複数問題のinline SVGが共存するため、ページ単位で全SVGの `id` を一意化または名前空間化する。
- `url(#...)`、`href="#..."`、`xlink:href="#..."`、clipPath、mask、filter、marker、gradient等の参照を書換え後IDへ一致させる。
- 重複IDと参照切れを自動監査し、検出時はbuild/testを失敗させる。

## 6. スマホ表示仕様

### 6.1 維持するもの

- 画面右上固定の既存「問題一覧」ピルボタン。
- 既存 `<dialog>` / `showModal()`。
- backdrop、フォーカストラップ、Esc closeをブラウザ標準へ任せる方式。
- dialog上部の科目・単元selector。
- 問題一覧の `ProblemGroupList` と分類。

### 6.2 追加するもの

科目・単元selectorの下、一覧本体の上へPCと同じ切替を置く。

```text
科目  [数学I]
単元  [二次関数]

[ 問題タイプ ] [ 問題一覧 ]

選択中panel
```

- 問題タイプpanelはPCと同じ `TypePageList.astro`。
- 問題一覧panelは現行と同じ `ProblemGroupList.astro`。
- 型ページrouteではdialogを開いた直後に問題タイプを表示する。
- 個別問題・単元トップ・`/app/` では問題一覧を表示する。
- 型ページリンクまたは問題リンクを選べば通常のページ遷移が起き、dialogはページ遷移により閉じる。追加close処理は不要。
- dialog triggerと見出しの「問題一覧」は、既存導線維持の決定に従い初版では変更しない。内部切替が内容種別を明示する。

### 6.3 狭幅本文

現行順序を維持する。

```text
ヘッダー
→ 右本文領域（型ページまたは問題詳細）
→ 折りたたみ中央一覧
→ 科目・単元
```

型ページ内の問題previewは右本文領域に含まれ、固定「問題一覧」ボタンからいつでも別型・別問題へ移動できる。previewの単一open制御はPC・スマホ共通で、型ページ本文内だけに作用する。

## 7. route・SEO仕様

### 7.1 URL

```text
/math1/{unit-route}/{type-slug}/
```

例:

```text
/math1/quadratic/max-min/
```

既存問題URLは一切変更しない。

### 7.2 Astro route

既存5単元の `[slug].astro` が同じURL階層を担当している。別の `[typeSlug].astro` を同階層へ作るとroute競合するため禁止。

各 `[slug].astro` の `getStaticPaths()` は次のunionを返す。

```ts
type RouteProps =
  | { kind: 'problem'; problem: CollectionEntry<...> }
  | { kind: 'type'; typePageId: string };
```

- problem route: 既存どおり `slug = problem.id`
- type route: `slug = typePage.slug`
- route生成前に両slug集合の衝突を検査する。
- existing problem branchのtitle、description、canonical、breadcrumb、本文を変えない。
- 37件の本文・description・レビュー完了と人間の公開承認がそろうまでtype route集合を公開buildへ含めない（devのローカル確認は除く）。
- 公開時はpublished 37件を一括で有効化し、1〜36件だけの部分集合を生成しない。

### 7.3 title / H1 / description

- H1: `{型の公開名}`
- title: `{型の公開名} | 数学I {単元名} | 高校数学ナビ`
- description: 型Markdown frontmatterの人間承認済み `description`
- `meta keywords` は出力しない。
- 主検索キーワードの機械的反復や補助キーワード一覧の出力はしない。

### 7.4 canonical

各型ページ自身をcanonicalとする。

```text
https://math-navi.com/math1/quadratic/max-min/
```

- 単元トップ、代表問題、`/app/` へcanonical統合しない。
- 既存問題ページのself-canonicalを変更しない。
- trailing slashは現行契約に合わせる。

### 7.5 breadcrumb / BreadcrumbList

画面:

```text
数学I ＞ 二次関数 ＞ 二次関数の最大・最小
```

props:

```ts
[
  { label: '数学I' },
  { label: '二次関数', href: '/math1/quadratic/' },
  { label: '二次関数の最大・最小' },
]
```

現行 `ProblemDbShell` のJSON-LD生成を再利用する。構造化データでは実URLを持つ単元と現在地の2要素になる。

### 7.6 sitemap / index制御

- 公開ゲート（37件完了＋人間の公開承認）通過後、published 37型を一括してsitemapへ追加する。
- hold QF-T10はrouteを生成せず、sitemap、PC/スマホ型一覧、内部リンクへ出さない。
- published型にnoindexを付けない。
- 公開承認前は（37件そろっていても）現行189 URLを維持し、公開承認後にだけ189 + 37 = 226 URLとする。190〜225件の段階状態は作らない。
- `/app/` は引き続きnoindex,follow・sitemap非掲載・self-canonical。

## 8. 将来レコメンドを阻害しない構造

### 8.1 原則

型と問題の所属は「候補集合」、表示順は「presentation policy」と分離する。

```text
master: この型にどの問題が属するか
problem data: 難易度・重要度・section・問題本文
初版policy: display_order昇順
将来policy: 4×4、ユーザー条件、履歴等から並べ替え
```

型Markdownへ推奨順、対象レベル、スコア、4×4座標を書かない。

### 8.2 初版のinterface境界

```ts
type ProblemOrderingContext =
  | { mode: 'number' }
  | {
      mode: 'recommendation';
      // 将来追加。初版では生成・利用しない
      userConditions: unknown;
    };

type OrderedTypeProblem = {
  problemId: string;
  rank?: number;
  reason?: string;
};

function orderTypeProblems(
  candidates: TypeProblemRef[],
  problemEntries: VerifiedProblemEntry[],
  context: ProblemOrderingContext,
): OrderedTypeProblem[];
```

初版は `mode: 'number'` だけを実装し、既存 `display_order` 昇順を返す。recommendation branch、UI、placeholder、ダミースコアは作らない。

### 8.3 将来変更してよい場所

- `orderTypeProblems` の新policy
- 型ページ内問題一覧の表示順・推薦理由表示
- クライアント側の条件入力UI
- 必要なら別の推薦データ/API

変更しない場所:

- 型ページID、slug、URL、canonical
- masterの所属関係
- 型Markdown本文
- 既存問題URL・問題データ
- 基本の静的問題一覧（推薦が使えないときのfallback）

推薦導入後も、検索エンジン・未ログイン・JS無効時には番号順の全候補を辿れる状態を維持する。

## 9. 現行コードとの整合・矛盾監査

### 9.1 整合する点

- 型ページは `ProblemDbShell` を再利用でき、GA4、head、canonical、breadcrumb、左単元ナビ、レスポンシブ骨格を維持できる。
- 既存問題一覧は `ProblemGroupList` を変更せず別panelへ包める。
- スマホdialogは同じ2一覧componentを再利用できる。
- 型ページの関連問題は既存verified collectionsから取得できる。
- breadcrumb JSON-LDは現行props方式で要件を満たす。
- 静的生成・通常リンク中心という現行設計を維持できる。
- 問題previewの単一openは型ページ内に限定した小さなclient scriptで実現でき、既存問題一覧アコーディオンの仕様を変えない。

### 9.2 必要だが視覚契約を壊さない変更

- `ProblemDbShell` の中央列は現在問題一覧1種類だけを受け取るため、`typeItems`、`activeListView`、`activeTypeId` を追加する。
- 中央列 `aria-label="問題一覧"` は両一覧を含む意味へ更新する。
- 右列 `aria-label="選択中の問題の詳細"` は型ページでも正しくなるよう「選択中の内容」等へ一般化するかprops化する。
- スマホdialog内へ切替panelを追加する。
- 型routeでは中央列の型tabを初期選択する。
- `TypePageDetail` の問題一覧コンテナへ、単一open制御用の限定的な識別子とclient scriptを追加する。

これらは意味・アクセシビリティの拡張であり、既存問題一覧の見た目・分類・リンクを変えるものではない。

### 9.3 明確な技術上の衝突・制約

1. **route衝突**: flat型URLは既存 `[slug].astro` と同じパターン。別dynamic routeは作れない。union routeが必要。
2. **build入力**: 現行CIはxlsxを読めない。生成スナップショットなしにmaster直読はできない。
3. **一覧モデル**: `DbCenterItem` / `ProblemGroupList` は問題番号・重要度・難易度前提。型一覧へ流用せず別componentにする。
4. **本文component**: `Quadratic27Detail` は問題詳細専用。型本文へ流用しない。
5. **一括公開ゲート**: 37 Markdownとレビューが揃う前にpublished検査とrouteを有効化するとbuildが失敗する。基盤コードは先に実装できるが、公開route・nav・sitemapは全件準備完了後に一括で有効化する。
6. **SVG ID**: 1型ページに複数問題のinline SVGが並ぶ。既存問題単体ページでは同居しなかったasset同士の内部ID衝突を必ず監査する。
7. **xlsx依存境界**: `exceljs` または既存同等依存はNode同期処理に限定し、Web runtime側から参照してはならない。

### 9.4 前回調査から上書きされる提案

前回調査ではスマホdialogへ型一覧を混在させない案をMVP候補としたが、明示決定により廃止する。スマホdialog内へ「問題タイプ / 問題一覧」切替を追加することを確定仕様とする。

型ページ内の問題順はmaster記載順ではなく、既存問題番号（`display_order`）昇順とする。型一覧自体の順序はmasterの明示的な `表示順` とし、初期値は各単元T01→Tnn順とする。

## 10. 人間判断がまだ必要な点

### 10.1 未決の仕様判断

実装開始を止める未決の仕様判断はない。v1で未決だった次の事項はv1.1で確定済みである。

- problem assetは `placement: problem` をpreviewへ含める。
- 型一覧の初期表示順は各単元T01→Tnn順とし、masterへ明示列を持つ。
- published 37型は全本文・description・レビュー完了後に一括公開する。
- descriptionはAI下書きを許可し、人間承認後の値だけを正本へ保存する。
- xlsx読取は既存同等依存を確認し、なければ `exceljs` をdevDependencyへ追加する。

### 10.2 実装・公開工程で必要な人間作業

次は仕様の未決事項ではなく、確定済みフロー上の人間作業である。

- 37型の概要本文を人間が執筆する。
- description案を人間が内容・自然さ・本文整合の観点でレビューし、承認する。
- PC・スマホの実画面を既存design tokenに照らして視覚確認する。
- 37件のレビュー完了、QF-T10非公開、テスト結果を確認して一括公開を承認する。

toggle、型一覧、previewの色・余白・borderは既存design tokenと現行コンポーネントへ従って実装し、新しい視覚仕様を本書では追加しない。問題詳細から所属型への直リンク、primary/secondary表示、型同士のリンク、推薦UI、型専用GA4 eventも初版では追加しない。

## 11. Claude Code向け実装計画

基盤実装は37型本文の完成前でも進められるが、公開route・nav・sitemapは37件の本文・description・レビューが揃うまで有効化しない。空本文、仮本文、AI生成の穴埋め本文は作らない。

### Phase 0: 作業境界とbaseline確認

1. `AGENTS.md` と本仕様書を読む。
2. Web repo・教材repoのdirty stateを確認し、ユーザー変更を保護する。
3. Web repoの既存xlsx読取依存と同期scriptを確認し、`exceljs` の重複追加を避ける。
4. 37型Markdownと人間レビューが未完了なら、公開route・nav・sitemap有効化は行わない。
5. 既存189 URL、5単元180問題、現行buildをbaselineとして記録する。

### Phase 1: master schemaと同期基盤

1. 5 master「型ページ管理」へ `表示順` を追加し、各単元T01→Tnn順の値を明示する。
2. 同等依存がなければ `exceljs` をdevDependencyへ追加し、同期・検証scriptだけからimportする。
3. `scripts/sync-type-pages.mjs` を新設する。
4. unit configを1ファイルへ集約する。
5. 38型・177所属関係（主172＋副5）を正規化する。
6. 双方向監査、slug/URL/順序/Markdown検査を実装する。
7. 一時出力→成功時置換のatomicに近い同期にする。
8. `type-pages.generated.json` とMarkdownスナップショットの編集禁止noticeを生成する。
9. `sync-content` を問題同期＋型同期の順に更新する。
10. 37件未満の部分公開用オプションは実装しない。

### Phase 2: Webデータ層

1. `content.config.ts` に `typePages` collectionを追加する。
2. frontmatterをstrict schemaにする。
3. `src/utils/typePages.ts` を新設し、JSON schema、published filter、unit別取得、URL生成、Markdown結合を実装する。
4. `orderTypeProblems(..., {mode:'number'})` を実装する。
5. `prepareProblemPreview.ts` を新設し、問題sectionと `placement: problem` assetだけをprepareする。
6. 複数previewのinline SVG IDをページ内で一意化し、内部参照も整合させる処理または既存機構の再利用を実装する。
7. 不存在・重複・未検算参照をbuild errorにする。
8. xlsxライブラリがclient/runtime import graphへ入らないことを確認する。

### Phase 3: 共通component

1. `TypePageList.astro` を新設する。
2. `TypeProblemPreview.astro` を新設する。
3. `TypePageDetail.astro` を新設する。
4. 型ページ内問題一覧を識別する限定的なcontainerを設け、`toggle` eventによる単一open制御を追加する。
5. JS無効時もネイティブ`details`として利用できること、focusを強制移動しないことを維持する。
6. `ProblemDbShell.astro` に型一覧propsとactive viewを追加する。
7. PC中央列とスマホdialogへ同じ切替・同じ2一覧componentを配置する。
8. 既存 `ProblemGroupList` と5単元の分類utilsは変更しない。
9. 右列ARIAを問題・型の両方に正しくする。

### Phase 4: route統合

1. 5単元の `[slug].astro` へ問題＋型のunion static pathsを追加する。
2. discriminated union propsでproblem/typeを分岐する。
3. 既存problem branchの出力を保持する。
4. 5単元トップと `/app/` にunit別type itemsを渡す。初期viewは問題一覧。
5. type routeの初期viewを問題タイプにする。
6. 既存URLを変更・redirectしない。
7. 公開ゲート通過までは公開buildのtype pathsを有効化せず、通過時に37件を一括で有効化する。

### Phase 5: SEO・sitemap

1. 型routeへ固有title、人間承認済みMarkdown description、self-canonical、breadcrumbを設定する。
2. 公開ゲート通過後、published 37型だけをsitemapへ一括追加する。
3. hold型がroute、nav、sitemapに存在しないことを確認する。
4. 公開前189、公開後226 URLであることと、既存189 URLの完全包含を検証する。

### Phase 6: 自動テスト・回帰

1. `npm run check`。
2. `npm run build`。
3. route数・sitemap数・canonical・title・description・BreadcrumbListを自動監査する。
4. 37型すべてで対象問題が問題の `display_order` 昇順か確認する。
5. 型一覧がmasterの `表示順` を使い、行順またはID順に依存しないことをfixtureで確認する。
6. previewに問題sectionと `placement: problem` assetが含まれ、それ以外のsection・assetが混入しないことを確認する。
7. CTAが正しい既存問題URLを指すことを確認する。
8. 同じ型ページのpreview Aを開いた後にBを開くとAが閉じ、Bだけが開くことを確認する。
9. 初期状態が全閉、同じpreviewを閉じれば全閉も可能、別型ページ外の`details`へ影響しないことを確認する。
10. mouse、Enter/Spaceによるsummary操作、プログラムによるopen変更で単一openが保たれ、focusが不意に移動しないことを確認する。
11. JS無効時にも各previewとCTAへ到達できることを確認する。
12. 型ページごとにinline SVGの全 `id` と `url(#...)` / `href` 系参照を監査し、重複・参照切れを検出する。
13. 37 Markdownのうち1件欠落、空本文、空description、hold混入の各fixtureで公開同期/buildが失敗し、部分routeが生成されないことを確認する。
14. xlsx読取依存がブラウザbundle/runtimeへ含まれないことを確認する。
15. PCで既存問題一覧の分類、開閉、選択styleがbaselineと同じか確認する。
16. スマホでdialog、科目/単元selector、切替、Esc、backdrop、focusを確認する。
17. `/app/` のnoindex、既存問題のcanonical、GA4一重読込、KaTeX警告を回帰確認する。

### Phase 7: Markdown制作・人間レビュー・一括公開

1. 人間が37 Markdownの概要2〜4文を執筆する。
2. AIは概要・主検索キーワード・検索意図を材料にdescription案を作成してよい。
3. 人間が各descriptionの内容、SEO上の自然さ、本文との整合をレビューする。
4. 承認されたdescriptionだけを各正本Markdownへ保存する。
5. 自動検査後、37件すべての本文・description・レビュー完了をチェックリストで確認する。
6. PC全型とスマホ代表ページを実画面レビューする。
7. hold QF-T10非公開を確認する。
8. 全ゲート通過後に37 route・nav・sitemapを一括で有効化し、commit・push・deployする。

## 12. 変更ファイル計画

### 教材repoで新規

- `type_pages/_TEMPLATE.md`
- `type_pages/QF-T01.md` 等の37ファイル（今回は作らない）

### 教材repoで後日変更

- 5 master xlsxの「型ページ管理」: `表示順` 追加のみ

### Web repoで新規候補

- `scripts/sync-type-pages.mjs`
- `src/data/type-page-units.ts`
- `src/data/type-pages.generated.json`
- `src/content/typePages/README.md`
- `src/content/typePages/*.md`
- `src/utils/typePages.ts`
- `src/utils/prepareProblemPreview.ts`
- `src/components/TypePageList.astro`
- `src/components/TypePageDetail.astro`
- `src/components/TypeProblemPreview.astro`
- 型ページ監査script/test

### Web repoで変更候補

- `package.json` / `package-lock.json`（既存同等依存がなければ `exceljs` devDependency）
- `src/content.config.ts`
- `src/components/ProblemDbShell.astro`
- `src/pages/app/index.astro`
- `src/pages/math1/{5単元}/index.astro`
- `src/pages/math1/{5単元}/[slug].astro`
- `src/pages/sitemap.xml.ts`
- 必要最小限のcomponent scoped CSSまたは `src/styles/global.css`
- `AGENTS.md`（実装完了後の契約・現在地更新）

### 原則変更しない

- `src/components/ProblemGroupList.astro`
- `src/utils/dbCenterList.ts`
- 5つの `*DbItems.ts`
- `src/data/subjects.ts`
- `src/components/Quadratic27Detail.astro`
- 既存問題Markdown・問題asset
- 既存問題URL・単元URL

## 13. 受入条件

実装完了とみなす条件:

- published 37型に、人間が執筆した概要と人間承認済みdescriptionを持つMarkdownが1件ずつ存在する。
- 37件の本文・description・人間レビューの全件完了と、人間による明示的な公開承認の両方がそろうまでproductionの公開route・nav・sitemapが1件も有効にならず（sitemap 189件）、公開時は37件を一括で有効化する（226件）。
- 0〜36件、および承認前の37件の正式Markdownは、同期・devでのローカル確認ができる（noindex付き、productionには出ない）。
- 開発確認用fixtureは公開ゲートとは別扱いで、DEV環境だけに出る。
- 空本文、仮本文、AIによる穴埋め本文、未レビューdescriptionが公開されない。
- hold QF-T10が公開面のどこにも出ない。
- 37型URLが静的生成され、各HTMLに固有H1・概要・問題preview・CTAが含まれる。
- PC/スマホ双方で問題タイプと問題一覧を切り替えられる。
- 現行問題一覧のUI・分類・リンク・既存180問題routeが変わらない。
- 型一覧はmasterの明示的な `表示順`、型内問題は既存問題の `display_order` 昇順である。
- previewは初期状態が全閉で、同一型ページ内では別previewを開くと先に開いていたpreviewが閉じる。
- 単一open制御がmouse・keyboardで機能し、focusを強制移動せず、JS無効時も内容とCTAへ到達できる。
- previewは問題文と `placement: problem` assetだけで、ThinkingFlow、解法メタ、解答、その他assetを含まない。
- 同一ページ内のinline SVGにID重複・内部参照切れがない。
- canonical、breadcrumb、BreadcrumbList、sitemapが本仕様どおり。
- 公開後sitemapは226件で重複なし。既存189件をすべて保持する。
- データ不一致が同期/build errorとして検出され、公開承認済みで37件未満の状態（部分公開）がbuild errorとして検出される。
- xlsx読取依存は同期・検証だけに使われ、ブラウザbundle/runtimeへ含まれない。
- 初版に推薦表示、ダミー推薦データ、ユーザー状態管理が存在しない。
- `npm run check` と `npm run build` が成功し、既存回帰監査を通る。

## 14. v1からv1.1への変更履歴

- 問題previewを複数同時openから、同一型ページ内で原則1問だけopenへ変更し、最小JSとアクセシビリティ要件を追加した。
- `placement: problem` assetをpreviewへ含めることを確定し、SVG内部ID・参照衝突監査を必須化した。
- 型一覧の初期順を各単元T01→Tnn順と正式決定し、masterの明示的な `表示順` だけをWebが使う契約を確定した。
- published 37型を全本文・description・レビュー完了後に一括公開するゲートを確定した。
- descriptionを「AI下書き可・人間レビューと承認必須」とする制作フローへ更新した。概要本文は人間執筆を維持した。
- `exceljs` を、既存同等依存の確認を前提に、同期・検証専用devDependencyとして追加可能と確定した。

## 15. 最終再監査

- 今回の変更は既存問題DB、問題一覧UI、URL、問題データを置き換えず、追加ナビゲーション層という原則と矛盾しない。
- 単一open制御は型ページ内コンテナに限定するため、PC/スマホの既存問題一覧アコーディオンやdialogの`details`へ干渉しない。
- problem assetの包含範囲は既存 `placement` によって限定され、ThinkingFlow・解答・解法メタを除外する契約と矛盾しない。
- 明示的な `表示順` は型一覧用、既存問題の `display_order` は型内問題用であり、責務が競合しない。
- 37件完了＋公開承認の一括公開により、route・nav・sitemapの公開集合は常に一致し、公開承認前189件から公開承認後226件へ一度に移行する。
- descriptionのAI利用は制作時の下書きに限定され、公開正本が人間承認済みMarkdownである契約を維持する。
- xlsx依存はNode同期境界に限定され、commit済みスナップショットだけを読むCI/build契約を変更しない。
- v1で未決だった5項目はすべて確定した。今回の変更による新たな仕様矛盾または実装開始を止める未決事項はない。
- Claude Codeによる基盤実装へ進める。ただし、公開route・nav・sitemapの有効化とdeployは、37件の本文・description・人間レビュー完了後に限る。

## 16. 2026-09-28 公開ゲート改訂（v1.1への追記）

制作途中のMarkdown保存を阻害しないよう、公開ゲートを次のとおり改訂した。本書の該当箇所は改訂後の内容へ更新済み。

- 0〜36件の正式Markdownは、教材正本として保存・同期・ローカル確認（astro dev、noindex付き）してよい。
- productionでは、次の2条件を両方満たしたときだけ、published 37件の型route・型nav・型sitemapを一括で有効化する。
  1. published 37件すべての本文・description・人間レビューが完了し、Markdownが同期されている。
  2. 人間が公開を明示的に承認し、`src/data/type-page-publication.ts` の `TYPE_PAGES_PUBLICATION_APPROVED` を `true` にしてcommitしている。
- 37件がそろっても、承認がなければ自動公開しない（production sitemapは189件のまま）。承認後だけ226件。
- 1〜36件だけがproductionへ公開される状態は引き続き禁止する。承認済みなのに37件そろっていない場合はbuild error。
- 開発確認用fixtureは公開ゲートとは別扱いで、DEV環境だけに出る（正式Markdownがある型ではそちらが優先）。
- 検証: `node scripts/test-type-pages.mjs sync`（同期）、`node scripts/test-type-pages.mjs gate`（1件・36件・37件承認なし→189、37件承認あり→226、36件承認あり→build error）、`npm run audit-type-pages`（build後の公開集合・hold・fixture・exceljs・SVG監査）。
