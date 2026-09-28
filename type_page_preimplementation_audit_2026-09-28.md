# 高校数学ナビ「型ページ」実装前調査報告

- 調査日: 2026-09-28
- 対象: `math_db_quadratic_working`（教材正本）と `highschool_math_db`（Web repo、master branch）
- 調査範囲: 現行Web構造、数学I 5単元の型ページ38件、URL・データ契約・内部リンク・実装影響
- 非実施: Web実装、master修正、SEOデータ修正、新規公開ページ生成、build

## 結論

型ページ管理38件は、採用37件・保留1件で集計が一致した。ID、slug、URL候補、対象問題ID、主所属・副所属の相互突合に異常はない。所属問題0件もない。現時点のデータは「型ページの企画・問題との対応関係」としてはよく整っている。

ただし、Webが型ページを生成するための公開データ経路はまだ存在しない。現行buildはrepo内の問題Markdownスナップショットだけを読み、master xlsxを読まない。このため実装前に最低限、次の4点を決める必要がある。

1. 型ページ本文をどこに置くか（masterの「ページ内容概要」は編集方針であり、そのまま公開本文とは言いにくい）。
2. 公開用 `description` をどこで管理するか。
3. 単元内の安定した表示順をどこで管理するか。
4. masterからWeb repoへ、検証済みの型ページ公開スナップショットをどう同期するか。

推奨URLは既存URLを保ったまま `/math1/{unit-slug}/{type-slug}/` とする。例は `/math1/quadratic/max-min/`。ただしこのURL形は既存の個別問題用 `[slug].astro` と同じ動的ルートを使うため、別の同階層動的ファイルを追加してはいけない。各単元の既存 `[slug].astro` の `getStaticPaths()` を問題と型ページのunionにし、propsの種類で表示を分けるのが最も自然である。

## 1. 現行Web構造の概要

### 1.1 生成・データフロー

現行の流れは次のとおり。

```text
教材正本 problems/*.md / assets/*
  └─ npm run sync-content（手動）
       └─ Web repo src/content/<5 collections> と *-assets（commit対象スナップショット）
            └─ Astro Content Collections
                 └─ getVerifiedCollection（独立検算済みだけ）
                      ├─ 単元トップ index.astro
                      ├─ 個別問題 [slug].astro / getStaticPaths()
                      ├─ /app/
                      └─ sitemap.xml.ts
```

GitHub Actions等には隣接教材フォルダがないため、build時に教材正本やmasterを直接読む設計ではない。同期スクリプトも「buildの一部として自動実行しない」と明記されている。

### 1.2 実装箇所の棚卸し

| 項目 | 現行実装 | 観察結果 |
|---|---|---|
| 単元トップページ生成 | `src/pages/math1/{unit}/index.astro` 5ファイル | 検算済みcollectionを表示順で読み、先頭問題を `ProblemDbShell + Quadratic27Detail` で表示する。単元トップは独立した目次本文ではなく、先頭問題を選択したDB画面。 |
| 個別問題ページ生成 | `src/pages/math1/{unit}/[slug].astro` 5ファイル | `getStaticPaths()` が検算済み問題IDをslugとして静的HTMLを生成。各ページに固有本文・title・description・canonicalを持つ。 |
| 共通レイアウト | `src/components/ProblemDbShell.astro`、一般ページは `src/layouts/BaseLayout.astro` | DBページの実質的な共通レイアウトは `ProblemDbShell`。GA4、head、canonical、breadcrumb、PC左ナビ、問題一覧、スマホdialogを含む。`BaseLayout` はTOP・情報ページ等で、canonicalを標準実装していない。 |
| 問題一覧 | 各 `src/utils/*DbItems.ts` → `src/utils/dbCenterList.ts` → `src/components/ProblemGroupList.astro` | 問題collectionを共通 `DbCenterItem` に変換し、section対応表でグループ化。通常の `<a href>`。 |
| PC左ナビ | `ProblemDbShell.astro` と `src/data/subjects.ts` | `dbSubjectNav` が唯一の単元ナビ。型ページは単元追加ではないため、原則変更不要。 |
| スマホ問題一覧dialog | `ProblemDbShell.astro` | PC中央列と同じ `ProblemGroupList` を再利用。単元選択も `dbSubjectNav` から生成。 |
| BreadcrumbList | `ProblemDbShell.astro` | 画面パンくずとJSON-LDを同じ `breadcrumbItems` から生成。URLを持たない中間項目はJSON-LDから除外し、2階層未満ならJSON-LD自体を出さない。 |
| title / description / canonical | 各routeから `ProblemDbShell` へprops渡し | canonicalは `Astro.site`（`https://math-navi.com`）と `canonicalPath` から生成。個別問題は固有値。 |
| sitemap生成 | `src/pages/sitemap.xml.ts` | 5 collectionを読み、単元トップ・全問題を列挙。現行189 URL。`/app/` は除外。 |
| master / 公開スナップショット読込 | `scripts/sync-quadratic-content.mjs`、`src/content.config.ts`、`src/utils/verifiedCollection.ts` | xlsx masterはWeb buildでは未読。問題Markdownとassetだけを手動同期。公開対象は `verification_status === 独立検算済み`。 |
| 内部リンク生成 | `subjects.ts`、各 `*DbItems.ts`、`ProblemGroupList.astro`、各routeのbreadcrumb | 問題一覧・単元ナビ・breadcrumbは静的な通常リンク。問題詳細本文内のサイト内型リンクはまだない。 |
| build時のページ生成route | `src/pages/**`、特に各単元の `index.astro` と `[slug].astro` | Astroの静的生成。型ページ用routeは未実装。現在の `[slug]` が型ページ候補URLと同じ階層をすでに担当している。 |

主要根拠:

- `highschool_math_db/src/pages/math1/quadratic/index.astro` 2–27行
- `highschool_math_db/src/pages/math1/quadratic/[slug].astro` 8–42行
- `highschool_math_db/src/components/ProblemDbShell.astro` 29–120行、152–248行
- `highschool_math_db/src/components/ProblemGroupList.astro` 17–64行
- `highschool_math_db/src/utils/dbCenterList.ts` 5–44行
- `highschool_math_db/src/pages/sitemap.xml.ts` 1–52行
- `highschool_math_db/scripts/sync-quadratic-content.mjs` 1–57行、227–242行
- `highschool_math_db/src/content.config.ts` 1–61行以降の5 collection定義

### 1.3 現行公開契約

- `/app/` は `noindex,follow`、self-canonical、sitemap非掲載。
- 5単元トップと180個別問題はindex対象、self-canonical、sitemap掲載。
- 現行sitemapは189 URL。既存distでも189件を確認した。
- 1問題=1固有URL、表示UI=共通DBシェル。
- 正本とWeb公開スナップショットのファイル名集合は5単元すべて一致した（54/41/23/44/18、差分0）。

## 2. 型ページ実装で再利用できるもの

### そのまま再利用できる

- `ProblemDbShell.astro`: head、canonical、GA4、画面パンくず、BreadcrumbList、PC左ナビ、レスポンシブ骨格。
- `dbSubjectNav`: 単元間移動。型ページを追加しても単元集合は変わらない。
- 各単元の検算済み問題collection: 型ページから関連問題のタイトル、URL、重要度、難易度を取得できる。
- 各 `*DbItems.ts` と `DbCenterItem`: 型ページ上でも既存の問題一覧を表示するなら利用可能。
- `ProblemGroupList.astro`: 「関連問題」を現行と同じ問題行として見せる用途には再利用可能。
- `ProblemDbShell` のbreadcrumb生成: 型ページでは `数学I（非リンク） > 単元（リンク） > 型ページ名（現在地）` を渡せばよい。
- `sitemap.xml.ts` のpaths配列生成方式とself-canonical契約。
- 既存 `[slug].astro` の静的生成パターン。

### そのままでは再利用できない

- `Quadratic27Detail.astro`: 問題・ThinkingFlow・解答専用。型ページ本文には新しい詳細コンポーネントが必要。
- `ProblemGroupList.astro` を「型ページ一覧」に流用すること: ID末尾の数字表示、重要度/難易度chips、選択問題という意味を前提にしている。型ページ一覧として使うならデータモデルと表示意味の見直しが必要。
- `verifiedCollection.ts`: 問題の検算状態専用。型ページの `採用/保留` は別の公開判定ヘルパーが必要。
- 現行sync: xlsxの型ページ管理を読まず、型ページ本文も同期しない。

## 3. 型ページ38件のデータ監査結果

### 3.1 対象と集計

| 単元 | 件数 | 採用 | 保留 |
|---|---:|---:|---:|
| 二次関数 | 10 | 9 | 1 |
| 三角比 | 9 | 9 | 0 |
| データの分析 | 6 | 6 | 0 |
| 数と式 | 8 | 8 | 0 |
| 集合と論証 | 5 | 5 | 0 |
| 合計 | 38 | 37 | 1 |

主所属は172件、副所属は5件。180問のうち主所属なしは8問で、各問題のmaster行に「個別ページで受ける」「単元トップで補足」等の意図が記載されているため、欠落とは判定しない。

主所属なしの8問:

- QF: M1-QF-001、003、004、005
- TR: M1-TR-026、029
- EC: M1-EC-024、025
- DA/SL: なし

### 3.2 異常チェック

| 確認項目 | 結果 |
|---|---|
| 型ページID重複 | なし |
| URL候補衝突 | なし。現行公開URLとも衝突なし |
| slug衝突 | 単元内なし、全38件横断でもなし |
| slug形式 | 全件 `^[a-z0-9]+(?:-[a-z0-9]+)*$` に適合 |
| 存在しない問題ID | なし。公開問題管理・正本Markdown双方に全対象IDが存在 |
| 所属問題0件 | なし |
| 型ページ管理→問題側の主所属不一致 | なし |
| 問題側→型ページ管理の主所属不一致 | なし |
| 副所属の片側欠落 | なし |
| 公開名不一致 | なし |
| 必須監査列の空欄 | なし |
| 主検索キーワード重複 | なし |
| 主＋補助キーワードのページ間重複 | なし |
| 状態 | `採用` 37、`保留` 1のみ |

### 3.3 副所属5件の妥当性

| 型ページ | 問題 | 判定理由 |
|---|---|---|
| QF-T04 | M1-QF-019 | 主所属は最大・最小。場合分けが不要な対比例としてT04に置くため自然。 |
| QF-T05 | M1-QF-012 | 主所属は平行・対称移動。移動条件から式を決定する関連例として自然。 |
| QF-T07 | M1-QF-049 | 主所属は二次不等式。判別式D<0を使う関連例として自然。 |
| DA-T04 | M1-DA-019 | 主所属は相関。変量変換で相関係数が不変という関連例として自然。 |
| SL-T04 | M1-SL-011 | 主所属は命題と集合。包含関係による必要・十分の判定例として自然。 |

不自然な副所属は見つからなかった。いずれも「比較」または「関連」として限定され、主所属を奪っていない。

### 3.4 実装上の不足情報

masterの型ページ管理には企画情報が豊富だが、公開生成に必要な次の情報は明示されていない。

- `unitId` / route base: 所属単元はmasterファイルから推論できるが、行データにはない。Web公開スナップショットでは明示した方が安全。
- `displayOrder`: 現在はシート行順が事実上の順序。行挿入・並べ替えに依存しない安定キーがない。
- 公開用 `description`: 検索意図・ページ内容概要はあるが、meta descriptionとして確定した文章ではない。
- 公開本文: 「ページ内容概要」は構成メモであり、見出し・本文・数式・図等の公開コンテンツではない。
- 公開スナップショット形式と同期処理: Web repoには型ページデータの読込経路がない。

一方、canonical URL、title、breadcrumb、関連問題のタイトル・URLは既存値から決定できるため、masterに重複保存する必要はない。

### 3.5 38件一覧

「補助KW数」は補助検索キーワードの件数。全語を読み取り、空欄とページ間重複がないことを確認した。対象問題の `(副)` は副所属。

| ID | 状態 | 単元 | 公開名 | slug | 主検索キーワード | 補助KW数 | 対象問題ID |
|---|---|---|---|---|---|---:|---|
| QF-T01 | 採用 | 二次関数 | 二次関数のグラフと平方完成 | `graph` | 二次関数 グラフ | 8 | M1-QF-002、006、007、008、039 |
| QF-T02 | 採用 | 二次関数 | 放物線の平行移動・対称移動 | `translation-reflection` | 二次関数 平行移動 | 8 | M1-QF-009、010、011、012 |
| QF-T03 | 採用 | 二次関数 | 二次関数の最大・最小 | `max-min` | 二次関数 最大最小 | 8 | M1-QF-013、014、015、016、019、020、022 |
| QF-T04 | 採用 | 二次関数 | 軸や定義域が動く最大・最小（場合分け） | `max-min-cases` | 二次関数 最大最小 場合分け | 8 | M1-QF-017、018、021、019(副) |
| QF-T05 | 採用 | 二次関数 | 二次関数の決定 | `determination` | 二次関数の決定 | 7 | M1-QF-023、024、025、026、027、012(副) |
| QF-T06 | 採用 | 二次関数 | 二次方程式の解き方 | `quadratic-equation` | 二次方程式 解き方 | 6 | M1-QF-028、029、030、031 |
| QF-T07 | 採用 | 二次関数 | 判別式と実数解の個数 | `discriminant` | 判別式 | 7 | M1-QF-032、033、047、049(副) |
| QF-T08 | 採用 | 二次関数 | 放物線とx軸・直線の共有点 | `intersection` | 二次関数 共有点 | 8 | M1-QF-034、035、036、037、038、040、041、048 |
| QF-T09 | 採用 | 二次関数 | 二次不等式と連立不等式 | `inequality` | 二次不等式 | 8 | M1-QF-042、043、044、045、046、049、050、051、052 |
| QF-T10 | 保留 | 二次関数 | 二次方程式の解の配置 | `root-location` | 解の配置 | 6 | M1-QF-053、054 |
| TR-T01 | 採用 | 三角比 | 三角比の定義と三角比の表 | `definition` | 三角比の定義 | 7 | M1-TR-001、002、003、004 |
| TR-T02 | 採用 | 三角比 | 三角比の相互関係と変換公式 | `identities` | 三角比の相互関係 | 7 | M1-TR-005、006、007、010、013、014 |
| TR-T03 | 採用 | 三角比 | 単位円と0°〜180°の三角比 | `unit-circle` | 三角比 単位円 | 8 | M1-TR-008、009、011、012、015 |
| TR-T04 | 採用 | 三角比 | 正弦定理と外接円 | `law-of-sines` | 正弦定理 | 6 | M1-TR-016、017、024、025 |
| TR-T05 | 採用 | 三角比 | 余弦定理 | `law-of-cosines` | 余弦定理 | 7 | M1-TR-018、019、020 |
| TR-T06 | 採用 | 三角比 | 正弦定理・余弦定理の使い分け（三角形の決定・形状） | `solving-triangles` | 正弦定理 余弦定理 使い分け | 7 | M1-TR-021、022、023 |
| TR-T07 | 採用 | 三角比 | 三角形の面積と内接円の半径 | `triangle-area` | 三角形の面積 sin | 7 | M1-TR-027、028、033、034、035 |
| TR-T08 | 採用 | 三角比 | 円に内接する四角形 | `cyclic-quadrilateral` | 円に内接する四角形 | 5 | M1-TR-030、031、032 |
| TR-T09 | 採用 | 三角比 | 空間図形と三角比 | `solid-figures` | 空間図形 三角比 | 8 | M1-TR-036、037、038、039、040、041 |
| DA-T01 | 採用 | データの分析 | 代表値（平均値・中央値・最頻値） | `representative-values` | 平均値 中央値 最頻値 | 8 | M1-DA-001、002、003、004、005 |
| DA-T02 | 採用 | データの分析 | 四分位数と箱ひげ図 | `box-plot` | 箱ひげ図 | 8 | M1-DA-006、007、008、009 |
| DA-T03 | 採用 | データの分析 | 分散と標準偏差 | `variance` | 分散 標準偏差 | 7 | M1-DA-010、011、012、013 |
| DA-T04 | 採用 | データの分析 | 変量の変換 | `variable-transformation` | 変量変換 | 7 | M1-DA-014、015、019(副) |
| DA-T05 | 採用 | データの分析 | 相関係数と散布図 | `correlation` | 相関係数 | 8 | M1-DA-016、017、018、019 |
| DA-T06 | 採用 | データの分析 | 仮説検定の考え方 | `hypothesis-testing` | 仮説検定 | 7 | M1-DA-020、021、022、023 |
| EC-T01 | 採用 | 数と式 | 整式の次数・整理と指数法則 | `polynomial-basics` | 多項式 次数 | 7 | M1-EC-001、002、003、004、005 |
| EC-T02 | 採用 | 数と式 | 式の展開と展開公式 | `expansion` | 展開公式 | 8 | M1-EC-006、007、008、009、010、011、012、013 |
| EC-T03 | 採用 | 数と式 | 因数分解の公式とたすき掛け | `factorization` | 因数分解 公式 | 8 | M1-EC-014、015、016、019、021 |
| EC-T04 | 採用 | 数と式 | 因数分解の工夫（置き換え・整理） | `factorization-techniques` | 因数分解 置き換え | 7 | M1-EC-017、018、020、022、023 |
| EC-T05 | 採用 | 数と式 | 平方根の計算と分母の有理化 | `square-roots` | ルート 計算 | 8 | M1-EC-028、029、030、034、036 |
| EC-T06 | 採用 | 数と式 | 根号を含む式の値と整数部分・小数部分 | `root-values` | 整数部分 小数部分 | 7 | M1-EC-026、031、032、033 |
| EC-T07 | 採用 | 数と式 | 絶対値の外し方と方程式・不等式 | `absolute-value` | 絶対値 外し方 | 8 | M1-EC-027、035、042、043、044 |
| EC-T08 | 採用 | 数と式 | 一次不等式と連立不等式 | `linear-inequality` | 一次不等式 | 8 | M1-EC-037、038、039、040、041 |
| SL-T01 | 採用 | 集合と論証 | 集合の表し方と部分集合 | `sets-subsets` | 部分集合 | 7 | M1-SL-001、002、003 |
| SL-T02 | 採用 | 集合と論証 | 集合の演算（共通部分・和集合・補集合） | `set-operations` | 共通部分 和集合 | 8 | M1-SL-004、005、006、007、008 |
| SL-T03 | 採用 | 集合と論証 | 命題と条件（真偽・反例・否定） | `propositions` | 命題 真偽 | 8 | M1-SL-009、010、011、012、015 |
| SL-T04 | 採用 | 集合と論証 | 必要条件・十分条件 | `necessary-sufficient` | 必要条件 十分条件 | 7 | M1-SL-013、014、011(副) |
| SL-T05 | 採用 | 集合と論証 | 逆・裏・対偶と証明法（対偶法・背理法） | `contrapositive-proof` | 逆 裏 対偶 | 8 | M1-SL-016、017、018 |

監査元:

- `problem_master/quadratic_function_problem_master.xlsx`: 型ページ管理 A4:K14、公開問題管理 A4:V58
- `problem_master/trigonometric_ratio_problem_master.xlsx`: 型ページ管理 A4:K13、公開問題管理 A4:V45
- `problem_master/data_analysis_problem_master.xlsx`: 型ページ管理 A4:K10、公開問題管理 A4:V27
- `problem_master/expression_calculation_problem_master.xlsx`: 型ページ管理 A4:K12、公開問題管理 A4:V48
- `problem_master/set_logic_problem_master.xlsx`: 型ページ管理 A4:K9、公開問題管理 A4:V22

## 4. 推奨URL構造

### 推奨

```text
/math1/{unit-slug}/{type-slug}/
```

例:

```text
/math1/quadratic/max-min/
/math1/trig/law-of-sines/
/math1/data-analysis/box-plot/
/math1/suto-shiki/factorization/
/math1/set-logic/necessary-sufficient/
```

理由:

- 既存の単元トップ・個別問題と同じ単元配下に収まり、意味階層が自然。
- 問題IDは `M1-QF-013` のような大文字ID、型slugは小文字英数字＋ハイフンで、現データに衝突がない。
- `/type/` 等を挟まず短い。
- 単元を変えず、既存URLを一切変更しない。

### route実装上の重要事項

既存の `src/pages/math1/{unit}/[slug].astro` がすでに同じURL形を担当する。そのため、次のような2本立てはできない。

```text
[slug].astro       # 既存問題
[typeSlug].astro   # 新規型ページ（同じ動的パターンなので競合）
```

推奨は既存 `[slug].astro` の `getStaticPaths()` が次の両方を返す形。

```text
problem routes: slug = problem.id, kind = "problem"
type routes:    slug = typePage.slug, kind = "type"
```

URL namespaceを実装上完全分離したい場合の代替は `/math1/{unit}/type/{slug}/`。ただし、URLが長くなり、提示例とも異なるため第二候補とする。

### canonical / breadcrumb / sitemap / 既存ページとの関係

- canonical: 型ページ自身。例 `https://math-navi.com/math1/quadratic/max-min/`。単元トップや代表問題へ統合しない。
- breadcrumb（画面）: `数学I > 二次関数 > 二次関数の最大・最小`。
- BreadcrumbList: 現行ロジックでは実URLを持つ「二次関数」と現在地の2要素になり、有効。
- sitemap: `状態 === 採用` の37件のみ追加。保留QF-T10は除外。現行189件から226件になる。
- 単元トップ: canonicalは従来どおり自己URL。採用型ページ一覧への通常リンクを持たせる。
- 個別問題: canonicalは従来どおり各問題自身。重複ページ扱いにせず、所属型ページへの通常リンクを追加する。

## 5. 型ページ用の最小データ契約案

### 5.1 Web公開スナップショットの最小形

```ts
type TypePageSnapshot = {
  id: string;                 // QF-T03
  unitId: string;             // quadratic
  name: string;               // 二次関数の最大・最小
  slug: string;               // max-min
  status: 'published' | 'hold';
  displayOrder: number;
  description: string;        // 公開用meta description
  problems: Array<{
    id: string;               // M1-QF-013
    membership: 'primary' | 'secondary';
  }>;
};
```

公開本文はこのmanifestへ長文を埋め込まず、型ページMarkdownのbodyとして別管理するのが最小かつ自然。

```yaml
---
type_page_id: QF-T03
---

（公開本文）
```

manifestと本文をContent Collection 1件に統合する設計でもよい。その場合も同じ情報がfrontmatter/bodyにあれば足りる。

### 5.2 既存masterで足りるもの

- `id`: 型ページID
- `name`: 公開名
- `slug`
- `status`: 採用/保留
- `problems`: 対象問題IDの順序、主副区分
- 企画・執筆根拠: 主検索キーワード、補助検索キーワード、検索意図、ページ内容概要、備考
- 詳細な問題側役割: 公開問題管理の「型ページ内役割」「副所属型ページ」

master注記どおり、所属と役割の正本は「公開問題管理」側とし、同期時に「型ページ管理」の対象問題IDとの双方向一致を検証してから1つの正規化配列へ出力するのが安全。

### 5.3 新たに必要になるもの

| 項目 | 必要性 | 推奨管理場所 |
|---|---|---|
| `unitId` | route・collection・ナビとの結合に必要 | 同期設定から付与、またはmasterに明示 |
| `displayOrder` | 単元トップの型一覧順を安定させる | masterまたは同期設定 |
| `description` | 現行共通shellの必須props、SEO説明 | 公開用型ページfrontmatter |
| 公開本文 | ページの実体 | 型ページMarkdown body |
| 同期・検証処理 | CIはmasterを直接読めない | `scripts/` とrepo内スナップショット |

### 5.4 増やさなくてよい項目

- canonical URL: `unitId + slug` から生成。
- title全文: `name + unit名 + 高校数学ナビ` のテンプレートで生成可能。
- breadcrumb文言: unit名とnameから生成。
- 関連問題のtitle/重要度/難易度: 既存問題collectionから取得。
- `meta keywords`: 使用しない。主・補助検索キーワードは編集用情報としてmasterに留める。
- `relatedTypeIds`: MVPでは不要。型ページ同士のリンク方針を決めた場合だけ追加。
- OGP画像、更新日、著者、FAQ schema等: 現段階では不要。

## 6. 推奨内部リンク構造

### MVPで必須

```text
単元トップ
  └─ 採用型ページ一覧
       └─ 型ページ
            ├─ 主所属の関連問題
            └─ 副所属の関連問題（「関連」「比較」と分かる弱い表示）

個別問題
  ├─ 主所属型ページへ
  └─ 副所属型ページへ（存在する5問のみ）
```

理由:

- 生徒は単元の地図から型を選び、型の説明後に具体問題へ進める。
- 個別問題へ検索流入した生徒も「この問題が属する型」に戻れる。
- 副所属を主所属と同列に扱わず、「関連する型」と示せる。
- すべて通常の `<a href>` とし、現行の静的・クロール可能な設計を維持できる。

### 型ページ同士のリンク

初回必須ではない。自動で「同単元の全型」を本文末に並べると選択肢が多くなり、学習上の意味も薄い。必要なら次のどちらかを人間が決めてから追加する。

- 学習順の「前に確認する型」「次に進む型」
- 強い比較関係（例 QF-T03 ↔ QF-T04）のみ

単元トップへのbreadcrumbがあるため、型ページ同士の網羅リンクがなくても行き止まりにはならない。

### 現行PC左ナビ・スマホdialogとの関係

- PC左ナビは単元ナビなので変更不要。
- スマホdialogは「問題一覧」であり、型一覧を混在させるかはUI判断が必要。MVPでは問題一覧のまま維持し、型への導線は型ページ本文・単元トップ・問題詳細内に置く方が意味が明確。
- 型ページ上でも関連問題一覧を中央列に出すなら、現行 `ProblemGroupList` を関連問題に限定して再利用できる。

## 7. 実装時の影響範囲

### 新規作成候補

| 種別 | 候補 |
|---|---|
| 公開データ | `src/content/typePages/` または `src/data/type-pages.json` |
| 型ページ本文 | `src/content/typePages/<type-id>.md` 等 |
| schema | `content.config.ts` 内のtypePages collection、または専用validator |
| 表示 | `src/components/TypePageDetail.astro` |
| 共通処理 | `src/utils/typePages.ts`（公開filter、unit別取得、問題結合、URL生成） |
| 同期 | `scripts/sync-type-pages.mjs`、または既存syncの明確な拡張 |
| 監査 | ID/slug/URL/参照/主副所属をbuild前に検査するscript |

### 変更候補となる既存ファイル

| ファイル | 変更理由 |
|---|---|
| `src/pages/math1/*/[slug].astro` 5ファイル | flat URLを採用する場合、問題＋型ページのstatic pathsと表示分岐を追加 |
| `src/pages/math1/*/index.astro` 5ファイル | 単元トップから採用型ページ一覧へリンク |
| `src/components/Quadratic27Detail.astro` | 個別問題→主/副所属型ページの導線を共通追加する場合 |
| `src/components/ProblemDbShell.astro` | 型ページで中央列やモバイル一覧の意味を変える場合のみ。head/breadcrumbはそのまま利用可 |
| `src/pages/sitemap.xml.ts` | 採用型ページ37件を追加 |
| `src/content.config.ts` | Content Collection方式ならschema追加 |
| `scripts/sync-quadratic-content.mjs` | 型ページmanifest/本文を同期する設計なら拡張。ただし責務が広がるためrenameも将来検討対象 |
| `src/styles/global.css` | 型ページ固有表示に必要な最小styleのみ。UI決定後 |

原則変更不要:

- `src/data/subjects.ts`: 単元自体は増えない。
- `BaseLayout.astro`: 型ページはDB系のため `ProblemDbShell` を使う方が契約を維持しやすい。
- 各 `prepare*Entry.ts`: 問題Markdownの表示処理であり、型本文処理と混ぜない方がよい。
- 問題Markdown正本: 型所属はmaster側にすでにあり、frontmatterへ重複追加する必要はない。

### buildへの影響

- 採用37ページ分の静的HTMLが増える。
- 現行189 sitemap URLは226 URLになる。
- 保留QF-T10はページ生成・単元トップリンク・sitemapから除外する。
- 各型ページが対象問題collectionを結合するため、参照切れをbuild errorにするべき。
- adjacent masterをbuild時に直接読む設計はGitHub Actionsで成立しない。必ずrepo内公開スナップショットをcommitする。

### 必要なテスト

1. データschema: 必須値、state列挙、slug形式。
2. 一意性: ID、単元内slug、完全URL。
3. 参照整合: 全問題ID存在、主副所属の双方向一致、公開名一致。
4. 公開filter: 採用37のみ、保留1は非生成。
5. route: 既存180問題URLが不変で、37型URLが生成される。
6. HTML: 型ページ固有本文が静的HTMLに含まれる。
7. SEO: 固有title/description、self-canonical、noindexなし。
8. breadcrumb: 画面とJSON-LDのunit/current pageが正しい。
9. sitemap: 226件、重複なし、保留なし、既存189件欠落なし。
10. 内部リンク: 単元トップ→型、型→問題、問題→主/副型が全件到達可能。
11. レスポンシブ: PC 3ペインとスマホdialogを壊さない。
12. 回帰: GA4二重読み込みなし、KaTeX/asset/既存問題build警告の増加なし。

## 8. 人間が型ページ仕様を決める前に判断すべき事項

優先度順。

1. 型ページ本文の正本場所。xlsxの概要を公開本文にするのか、別Markdownを正本にするのか。
2. 型ページの本文最低要件。どの状態を「公開可能」とみなすか。37件を一括公開するか段階公開か。
3. 公開用descriptionの執筆責任と保存場所。
4. 単元トップでの型一覧の順序。master行順を正式順序にするか、`displayOrder` を設けるか。
5. flat URLを既存 `[slug].astro` でunion処理するか、`/type/` namespaceを採るか。本報告はflatを推奨。
6. 問題ページから型ページへ出す位置と文言。主所属と副所属をどう見分けさせるか。
7. 型ページ上の関連問題の並べ方。masterの対象問題順を学習順として採用するか。
8. 保留QF-T10の扱い。公開データへ含めてfilterするか、同期対象から外すか。監査上は含めて状態で除外する方が見落としにくい。
9. スマホ「問題一覧」dialogに型一覧も入れるか。現行の意味を保つなら入れない方が単純。
10. 37件公開前の文章・数式・図・検索意図に関する人間レビュー工程。

## 9. 今の時点では決めなくてよい事項

- 型ページの最終UI、カード形状、色、余白、レスポンシブ細部。
- 本文の最終見出し構成や文章トーン。
- OGP画像、専用サムネイル。
- FAQ、HowTo、LearningResource等の追加構造化データ。
- 型ページ同士の全リンク網、前後ナビ、関連記事アルゴリズム。
- 閲覧履歴、進捗、ログイン、DB、検索機能。
- GA4の型ページ専用イベント。通常ページビューは共通shellで取得できる。
- `lastmod`、priority、changefreq等のsitemap拡張。
- 既存コンポーネントの名称整理や大規模リファクタリング。

## 最終判断

データ38件そのものに公開を妨げる整合性エラーはない。実装着手前の本当の未決事項は、UIよりも「公開本文・description・表示順・同期形式」の4点である。これらを決めれば、既存の静的生成、共通DBシェル、canonical、breadcrumb、問題collection、sitemap生成方式を大きく崩さずに型ページを追加できる。

