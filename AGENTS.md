## プロジェクトの目的

高校数学の学習ナビゲーションサイト **「高校数学ナビ」** の公開試作です。

公開URL：

- https://math-navi.com

中心価値は、問題や詳しい解説を大量に増やすことではなく、

> **「何をやるか」「何を後回しにするか」「どういう順番で考えるか」を明確にすること**

です。

現在、数学I「数と式」「集合と論証」「二次関数」「三角比」「データの分析」の5単元・計180問（M1-EC-001〜044・M1-SL-001〜018・M1-QF-001〜054・M1-TR-001〜041・M1-DA-001〜023）を本番公開しています。2026-09-29には、これらを問題タイプ単位で束ねる型ページ38件も本番公開しました（「型ページ（問題タイプ）の現在地」節）。三角比・データの分析・数と式・集合と論証の詳細は後述の各節を参照してください。

数学I「数と式」M1-EC-001〜044（44問、式の計算／因数分解／実数・平方根／一次不等式の4区分）は全問独立検算済みで、教材化・技術実装・人間による全44ページSSレビュー・Codex最終構造監査を経て、2026-09-23に本番公開しました。詳細は「数と式の現在地」節を参照してください。

数学I「集合と論証」M1-SL-001〜018（18問、集合／命題・論証の2区分）は全問独立検算済みで、教材化・人間による実画面・SSレビューを経て、2026-09-27に本番公開しました（AI-context・Worker対応も同日）。詳細は「集合と論証の現在地」節を参照してください。

まず二次関数（M1-QF-001〜054の54問）について、

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

TOPページ（`/`）の現行ビジュアルデザイン（配色・タイポグラフィ・hero・DBプレビュー・CONCEPTセクションの構成等）も人間レビュー済みです。明示的な依頼なしに大きく変更しないでください。2026-09に装飾面のブラッシュアップ（詳細は「UIブラッシュアップ」節）を行っており、以後はその状態が「現行」の基準です。

旧6サンプル（6分野の初期検証用ページ・データ・コンポーネント。公開routeは生成していなかった）は、2026-09-24の不要ファイル整理で削除しました（git履歴には残っています）。公開routeとして復活させないでください。

---

## 三角比の現在地

数学I「三角比」M1-TR-001〜041（41問）について、独立検算・教材化・asset生成・実画面レビュー・Opus横断レビュー・Codex構造監査まで完了し、本番公開済みです（コミット90cb5c5「Add trigonometry database and publish 95 math problems」、2026-09-12）。

- 正本・同期先はQFと同じ枠組みを共有します：正本`math_db_quadratic_working/problems/`・`assets/`のM1-TR-*ファイル、スナップショット`src/content/trig4/`・`src/content/trig4-assets/`（`npm run sync-content`が両方を同期）。
- 対応するContent Collectionは`trig4`（`src/content.config.ts`）、表示は`prepareTrigEntry.ts`経由でQFと同じ`Quadratic27Detail.astro`を再利用します。
- 中央一覧の4区分（三角比の基本（0〜90°）／三角比の拡張（0〜180°）／平面図形と三角比／空間図形と三角比）は`src/utils/trigDbItems.ts`の`SECTION_TO_GROUP`で判定し、QFの`quadraticDbItems.ts`と同じ方式（section値ベース、問題IDレンジではない）です。
- ルートは`/math1/trig/`・`/math1/trig/M1-TR-001/`〜`/math1/trig/M1-TR-041/`で、QFと同格の公開contract（index対象・sitemap掲載・canonicalは各URL自身）です。既存契約を理由なく変更しないでください。
- 三角比masterは`trigonometric_ratio_problem_master.xlsx`（`problem_master/`配下、QFのmasterと同じフォルダ）です。
- M1-TR-008の問題文・最終解答の表、M1-TR-015の警告文表示のため、共通parser（`src/utils/markdownSections.ts`）にremark-gfm・rehype-rawを追加済みです。既存54問はパイプ表・生HTMLを使っていないため表示への影響はありません。
- M1-TR-017〜020の幾何asset（正弦定理・余弦定理の三角形図）は、`pa-*`とは別の役割別CSSクラス`geo-*`（頂点・角度・辺でサイズ/太さを分ける）を使っています。新しい三角比幾何assetを作る場合はこの方式を踏襲し、`pa-*`と混在させないでください。

---

## データの分析の現在地

数学I「データの分析」M1-DA-001〜023（23問）について、独立検算・教材化・asset生成・実画面レビュー・レビュー後修正・Codex構造監査まで完了し、本番公開済みです（2026-09-17）。**Opus asset横断レビューのみ未実施です。**

- 正本・同期先はQF/TRと同じ枠組みを共有します：正本`math_db_quadratic_working/problems/`・`assets/`のM1-DA-*ファイル、スナップショット`src/content/dataAnalysis/`・`src/content/dataAnalysis-assets/`（`npm run sync-content`が3コレクションまとめて同期）。
- 対応するContent Collectionは`dataAnalysis`（`src/content.config.ts`）、表示は`prepareDataAnalysisEntry.ts`経由でQF/TRと同じ`Quadratic27Detail.astro`を再利用します。
- 中央一覧の5区分（代表値と度数分布／四分位数と箱ひげ図／分散と標準偏差／散布図と相関／仮説検定）は`src/utils/dataAnalysisDbItems.ts`の`SECTION_TO_GROUP`で判定し、QF/TRと同じ方式（section値ベース、問題IDレンジではない）です。
- ルートは`/math1/data-analysis/`・`/math1/data-analysis/M1-DA-001/`〜`/math1/data-analysis/M1-DA-023/`で、QF/TRと同格の公開contract（index対象・sitemap掲載・canonicalは各URL自身）です。`dbSubjectNav`（DB UI）に掲載済みです（旧左サイドナビ`publicSubjectNav`は2026-09-24に削除。「数と式の現在地」節を参照）。既存契約を理由なく変更しないでください。
- データ分析masterは`problem_master/data_analysis_problem_master.xlsx`です（QF/TRのmasterと同じフォルダ）。独立検算後の資産のみ変更（数学的内容に影響しない）の経緯は`math_db_quadratic_working/verification/post_review_addenda.md`に追記する運用です。
- ヒストグラム・箱ひげ図・散布図は本単元で新規追加したasset typeで、既存の`pa-*`共通クラス（`pa-axis`・`pa-figure-line`・`pa-figure-fill`・`pa-guide`・`pa-label`・`pa-label-muted`・`pa-panel-label`・`pa-axis-highlight`）の組み合わせのみで表現し、新しいCSSクラスは追加していません。
- ThinkingFlow見出しにTeX記法を生表示させず、変数＋Unicode上付き文字（`x²`等）またはUnicode丸数字＋`\text{\textcircled{}}`（本文数式・最終解答内）を使う方式はQF/TRと共通の規約です。新しい問題でも踏襲してください。

---

## 数と式の現在地

数学I「数と式」M1-EC-001〜044（全44問。M1-EC-001〜013：式の計算（展開）、M1-EC-014〜023：因数分解、M1-EC-024〜036：実数・平方根、M1-EC-037〜044：一次不等式）について、全問独立検算・教材化・技術実装（ページ生成・DB統合・新セクション「事前知識・使用公式」の初回実装）・build確認まで完了しています。2026-09-23に44問すべてを公開対象と決定しました。単元としてはこの44問で大きな追加・変更は予定していません。44問・4区分化ともcommit済み（コミット`9f67faf`）です。その後、人間による全44ページSSレビューと、Codex公開前最終構造監査（基準commit `d3f2e32`、PASS WITH REVIEW・BLOCKERなし）を完了し、監査指摘の軽微修正（master検算batch名・M1-EC-038/039のSVG marker ID重複・単元トップdescription・現在地文書）を反映し、2026-09-23に本番公開しました（push・GitHub Actions deploy）。Opus asset横断レビューは未実施のまま公開しています。

- 全44問とも`verification_status: 独立検算済み`です。難易度・重要度は問題ごとに異なります（M1-EC-001〜007：難易度1・重要度4「土台」、以降は展開・因数分解・実数の応用度に応じて難易度1〜4・重要度1〜4）。master xlsx（`expression_calculation_problem_master.xlsx`「公開問題管理」シート）の全44問PASS判定と一致しています。（同ファイルの別シート「式と計算マスタ」冒頭サマリ欄の「独立検算は未実施」という古いメモは2026-09-23に修正済みです。）**判定の正本は「公開問題管理」シートと各`problem.md`の`verification_status`**としてください。
- 正本・同期先・Content Collection・中央一覧の分類方式（`expressionCalculationDbItems.ts`の`SECTION_TO_GROUP`）はQF/TR/DAと共通の枠組みです。中央一覧は2026-09-23に、`section`値ベースで4区分（式の計算：M1-EC-001〜013／因数分解：M1-EC-014〜023／実数・平方根：M1-EC-024〜036／一次不等式：M1-EC-037〜044）へ分割しました。正本`problem.md`の`section`値・`SECTION_TO_GROUP`・master xlsx（「式と計算マスタ」「公開問題管理」両シートの問題区分列）の3箇所を一致させてください。
- ルートは`/math1/suto-shiki/`・`/math1/suto-shiki/M1-EC-001/`〜`/M1-EC-044/`です。**slug「suto-shiki」は、旧開発用サンプル（`src/pages/math1/suto-shiki/_factorization.astro`、公開routeなし。2026-09-24に削除）で使われていたromanizationを、ユーザー確認のうえ再利用したものです。**
- `dbSubjectNav`（`src/data/subjects.ts`、DB UI専用の単元ナビ）には追加済みで、TOPから「問題データベースを見る」で`/app/`へ移ると数と式・集合と論証を含む全5単元が表示されます。サイト内の単元ナビは`dbSubjectNav`だけです。旧左サイドナビ（`Nav.astro`・`subjectNav`／`publicSubjectNav`・`BaseLayout.astro`の`showNav`引数）は、公開ページで表示されていなかった（404だけは2026-09-24まで古いナビが出ていた）ため、同日の不要ファイル整理で旧サンプルとあわせて削除しました。`BaseLayout.astro`のページ（TOP・Privacy・Disclaimer・Contact・404）に単元ナビが必要になった場合は、`dbSubjectNav`を元に新しく設計してください。
- 数と式masterは`problem_master/expression_calculation_problem_master.xlsx`です（他単元のmasterと同じフォルダ）。
- ThinkingFlow見出しにTeX記法（`$x^2$`等）を生表示させない規約（QF/TR/DA共通）はM1-EC-004〜044にも踏襲しています。M1-EC-008・009・012（展開）、M1-EC-017・018・019（因数分解）、M1-EC-026・028・030・031・034（実数・平方根、`\sqrt{...}`混入）で混入が見つかりましたが、いずれもUnicode表記（例：`x²`・`(a-b)³`・`√18`）へ修正済みです。新しい問題を追加する際は、ThinkingFlow見出し内に生の`^`・`\sqrt`を残さないよう特に注意してください。
- **M1-EC-014〜023（因数分解10問）・M1-EC-024〜036（実数・平方根13問）の正本には、独立検算とは無関係にThinkingFlow見出し階層の技術的な不整合が複数見つかり、2026-09に修正済みです**（文言・数式・ThinkingFlowの結論・順序はいずれも無変更のため再独立検算対象外。コミット`ee196d3`）。
  - M1-EC-021：ThinkingFlow見出しが`####`になっていました（他の単独Flow問題はすべて`###`）。放置するとThinkingFlowの各Flowが個別Flowとして認識されず空表示になる不具合だったため`###`へ修正。
  - M1-EC-036：小問(2)内2番目のFlow見出しが`###`のままで、`####`であるべきところが1レベル浅くなっていました（他のFlowとの深さ不整合）。放置すると`markdownSections.ts`のパーサーが(2)の子ではなく孤立した見出しとして分割してしまう不具合だったため`####`へ修正。
  - M1-EC-016・017・018・019・020・022・023・025・026・027：見出し内の強調マーク☆と番号の順序が「☆ N. 見出し」のように逆転していました（正しい順序は「N. ☆ 見出し」。`prepareQuadratic27Entry.ts`の`MARKER_PATTERN`・`verifyStepNumberMatchesIndex`が要求する順序で、崩れるとbuildエラーになります）。順序を修正。
  - M1-EC-032：本文の数式中（`$...$`内）に生のUnicode丸数字（①②）が直接書かれ、KaTeXの`unknownSymbol`build警告の原因になっていました。既存規約（M1-DA-008等で使用）の`\text{\textcircled{1}}`表記へ修正。
  - 13問すべてで正本`problem.md`の`verification_status`が`未検算`のまま更新漏れになっており、master xlsx「公開問題管理」シートの全問PASS判定と不一致でした。`独立検算済み`へ更新（この不一致を放置すると`getVerifiedCollection`のフィルタで全問非公開のままビルドされます）。
- M1-EC-016（「事前知識・使用公式」・ThinkingFlow 1）とM1-EC-021（ThinkingFlow 3）に「たすき掛け」の交差図assetを追加しています。M1-EC-025（「事前知識・使用公式」）には実数の分類（自然数⊂整数⊂有理数⊂実数、無理数）を示すネスト矩形図assetを追加しました。M1-EC-038・039・041・043・044（一次不等式）には、ThinkingFlow内（`placement: flow`）に解の範囲・共通範囲・場合分けを示す数直線asset（`type: number`）を配置しています。他の問題は`assets: []`のままです。詳細は次節「事前知識・使用公式」の追記、および下記asset規約を参照してください。
- 「SEOの現行契約」節のsitemap内訳は、2026-09-23に170 URL（`/math1/suto-shiki/`単元トップ1＋個別問題44を追加）へ更新しました（2026-09-27の集合と論証追加後は189 URL）。数と式の単元トップ・個別問題URLは他単元と同格の公開contract（index対象・sitemap掲載・canonicalは各URL自身）で、ローカルbuildで45URLすべて確認済みです。

---

## 集合と論証の現在地

数学I「集合と論証」M1-SL-001〜018（18問）について、全問独立検算済みの正本をもとに、教材化・asset生成・技術実装・人間による実画面／全18ページSSレビューとレビュー後修正を行い、2026-09-27に本番公開しました（コミット`5fe39b0`、GitHub Actions deploy）。同日、AI-context生成・Workerの問題ID許可もSLへ拡張し、本番Workerを再deployしています（「AI質問機能・外部追加演習リンクの現在地」節）。TOPページの本文（計180問）・DBプレビュー画像も更新済みです（コミット`0549f06`）。**Codex最終構造監査・Opus asset横断レビューは未実施のまま公開しています。**

- 正本・同期先・Content Collection・中央一覧の分類方式は他単元と共通の枠組みです：正本`math_db_quadratic_working/problems/`・`assets/`のM1-SL-*ファイル、スナップショット`src/content/setLogic/`・`src/content/setLogic-assets/`（`npm run sync-content`が5コレクションまとめて同期）、Content Collection`setLogic`、表示は`prepareSetLogicEntry.ts`経由で`Quadratic27Detail.astro`を再利用します。
- 中央一覧は`src/utils/setLogicDbItems.ts`の`SECTION_TO_GROUP`で、`section`値ベースの2区分（集合：M1-SL-001〜008／命題・論証：M1-SL-009〜018）に分けます。**masterの「問題区分」は管理用の細分類で、`section`とは一致させません**（数と式とは運用が異なります）。
- ルートは`/math1/set-logic/`・`/math1/set-logic/M1-SL-001/`〜`/M1-SL-018/`で、他単元と同格の公開contract（index対象・sitemap掲載・canonicalは各URL自身）です。`dbSubjectNav`では「数と式」の次に置いています。
- 集合と論証masterは`problem_master/set_logic_problem_master.xlsx`です（他単元のmasterと同じフォルダ）。M1-SL-004の`reference_problem`は95が正です。
- 全18問に「事前知識・使用公式」があります。
- **SL正本は初回納品時、既存規約と書式が一部異なっていたため、教材化時に表示構造だけを揃えました**（数学的内容・文章の意味・Flowの順序は無変更のため、再独立検算の対象外）。新しい単元の正本でも同じ点を確認してください。
  - ThinkingFlow見出し`### (1) 1. …`（小問番号とFlow番号が同じ行）を、既存規約の`### (1)`＋`#### 1. …`へ分割（001〜015）。
  - 見出し内のTeXをUnicode表記へ（例：`A∩B`・`p ⇒ q`・`3k±1`・`√2`）。**上線（補集合`B̄`）は結合文字（U+0304／U+0305）がWebフォントでずれて表示されるため使えません。** M1-SL-006 (3)-2・M1-SL-007 (1)-1の見出しは「A∩(Bの補集合)」「B の補集合」という同じ意味の文言にしています（人間レビュー済み）。
  - 独自のasset記法（`asset_id`・`placement: ThinkingFlow (2)(3)`・本文中の`[asset: …]`）を既存の`file`/`placement`/`part`/`flow`/`type`形式へ変換。
  - 複数行にまたがるインライン数式`$…$`の途中に`=`だけの行があると、Markdownのsetext見出しとして解釈され、生TeX＋巨大見出しになります（M1-SL-006・007で発生）。インライン数式は1行に書いてください。
  - `**「…」**と`のように、`**`が「」やインライン数式と隣り合うと、CommonMarkの規則で太字になりません（M1-SL-005・006・009・010・011・016・017で発生）。該当箇所は`<strong>…</strong>`で書いています。
  - 長い数式を1行のインライン数式にすると、スマホ幅で横にはみ出します（M1-SL-001の問題文）。既存規約どおり、独立行の`$$`（3行形式）にしてください。
- assetは10ファイル・14か所に配置しています（002・004・005・006・008・011・014・016）。ベン図・数直線・包含関係図・逆裏対偶の関係図で、既存の`pa-*`クラスだけで構成し、新しいCSSクラスは追加していません。塗りは`fill="var(--color-accent)" fill-opacity="0.3"`の属性指定です（`var(--color-accent-bg)`は「事前知識」パネルの背景と同色で見えないため）。
- **問題メタ・解法メタ内へのasset配置（`placement: problem_meta`／`solution_meta`）はSLで新設しました**（M1-SL-002・004・005）。本文中の表示位置は、そのセクション内の単独段落`[asset: <file>]`で示し、`prepareSetLogicEntry.ts`がfigureへ置き換えます。宣言とマーカーは1対1で対応していなければならず、余ったマーカー・対応するマーカーのない宣言、置換されずに残った`[asset:`はbuildエラーになります。QF/TR/DA/ECの`prepare*Entry.ts`はこの2値を処理しないため、他単元で使う場合は先に同じ分岐を追加してください。
- 外部追加演習リンクは未登録です。

---

## 型ページ（問題タイプ）の現在地

既存問題DBを置き換えない追加ナビゲーション層として、型ページ基盤を2026-09-28に実装し、**2026-09-29にpublished 38型を一括で本番公開しました**（人間の公開承認により`TYPE_PAGES_PUBLICATION_APPROVED = true`、sitemap 189→227）。実装正本は本教材側（`math_db_quadratic_working/`）の `type_page_implementation_spec_v1.1_2026-09-28.md`（§16に公開ゲート改訂、§17にQF-T10採用による38型改訂を追記済み。2026-09-29にWeb repo直下から移動）です。正式Markdown 38件（published 38・hold 0）はPC/スマホのDEV確認を経て公開しています。Codex横断監査は未実施のまま公開しています。

- **正本**：型の構造（型ページID・公開名・slug・状態・表示順・所属問題・主副・役割）は5つのmaster xlsx（「型ページ管理」「公開問題管理」）、公開本文と人間承認済みdescriptionは `math_db_quadratic_working/type_pages/<型ページID>.md`（published 38型すべて作成・人間承認済み。2026-09-29）。「型ページ管理」には2026-09-28に明示列 `表示順`（L列、初期値T01→Tnn）を追加済みです。Web側は行順・ID文字列から順序を推論しません。
- **同期**：`npm run sync-type-pages`（`scripts/sync-type-pages.mjs`、`sync-content` からも問題同期の後に実行）。exceljs（devDependency）でmasterを読み、`src/data/type-pages.generated.json`（38型＝published 38・hold 0、所属177件＝主172・副5。2026-09-29にQF-T10を保留から採用へ変更）と `src/content/typePages/*.md` を生成します。いずれも直接編集禁止。既存masterはテーブル定義のrelsが絶対パスのため、exceljsは `ignoreNodes: ['tableParts']` なしでは読めません。また、Open XML SDK等で保存されたmaster（2026-09-29時点のQF master。要素に`x:`等の名前空間prefixが付く）はexceljsが直接読めないため、同期スクリプトがjszip（devDependency）でメモリ上だけprefixを既定名前空間へ正規化してから読みます（masterは書き換えません）。xlsx読取コードをAstro component・client・runtimeからimportしないでください。
- **公開ゲート**：型Markdownは0〜38件のどの状態でも同期・devでのローカル確認（noindex付き）ができます。productionで型route・型一覧nav・sitemapを出すのは、「published 38件すべての本文・description・人間レビュー完了」かつ「人間が `src/data/type-page-publication.ts` の `TYPE_PAGES_PUBLICATION_APPROVED` を `true` にしてcommit」の2条件を満たしたときだけで、38件を一括で出します（sitemap 189→227）。38件そろっても承認なしでは自動公開しません。承認済みで38件未満はbuildエラーです（1〜37件だけの公開は禁止）。hold型（現在0件）はroute・nav・sitemapへ出しません。2026-09-29に人間の公開承認を受けて`true`にしました。**承認フラグは明示的な指示なしに変更しないでください**（`false`へ戻すと型ページ38件が一括で非公開になります）。
- **URL**：`/math1/{単元}/{型slug}/`（例 `/math1/quadratic/max-min/`）。既存の各単元 `[slug].astro` がproblem/typeのunionを返します（同階層に別の動的routeを作らない）。型ページはself-canonical、title「{公開名} | 数学I {単元名} | 高校数学ナビ」、BreadcrumbListは単元＋現在地の2要素です。
- **UI**：PC中央列とスマホ問題一覧dialogに「問題タイプ / 問題一覧」切替を追加しました（`ProblemDbShell.astro`、型一覧が0件のページでは切替を出さず従来と同じマークアップ）。初期タブは型ページだけ「問題タイプ」、それ以外は「問題一覧」です。型一覧は `TypePageList.astro`（masterの表示順のフラットリスト）、本文は `TypePageDetail.astro`、問題previewは `TypeProblemPreview.astro`（ネイティブ`details`、初期全閉、型ページ内だけ単一open）。previewに出すのは「## 問題」（小問含む）と `placement: problem` のassetだけで、`prepareProblemPreview.ts` が用意します。型内の問題順は既存の `display_order` 昇順（`orderTypeProblems(..., {mode:'number'})`）。既存の `ProblemGroupList`・分類utils・`Quadratic27Detail` は変更していません。
- **SVG**：1ページに複数問題のinline SVGが並ぶため、preview用assetの内部IDは `tp-<問題ID>-a<n>-` で名前空間化し、参照（`url(#…)`・`href`・`xlink:href`・aria）も書き換えます（`src/utils/svgIdNamespace.ts`）。重複id・参照切れはbuildエラーです。problem assetを持つ型はQF-T01・TR-T01・TR-T09・DA-T01・DA-T02・DA-T05の6つだけです。
- **開発確認用fixture**：正式Markdown 38件の同期に伴い、2026-09-29に`src/dev-fixtures/typePageFixture.ts`（QF-T03の仮文）と`typePages.ts`の読込分岐を削除しました。DEVで表示されるのは同期済みの正式Markdownがある型だけです。`audit-type-pages`は旧fixtureの文字列がbuild成果物へ混入していないかを引き続き検査します。
- **監査・テスト**：`npm run build && npm run audit-type-pages`（公開集合・sitemap件数・hold・旧fixture残骸・exceljs混入・全38型のSVG監査）、`node scripts/test-type-pages.mjs sync`（同期の正常系・異常系）、`node scripts/test-type-pages.mjs gate`（1件・37件・38件承認なし→190、38件承認あり→228、37件承認あり→buildエラー。件数は4×4ナビの `/navigator/` 1件を含む。スナップショットと承認フラグを一時的に書き換え、終了時に復元）。
- **初版でやらないこと**：推薦順・4×4・ユーザー条件・推薦理由、型同士のリンク、個別問題本文からの所属型リンク、primary/secondary・roleの表示、型専用GA4 event。将来の推薦は `orderTypeProblems` の新modeとして分離し、master・型Markdown・問題データへ順序情報を持たせないでください。
- **本文の自動検査**：spec §3.2・§3.4（2026-09-29改訂）どおり、本文中の問題ID（`M1-XX-999`形式）・3桁の問題番号（数式外の単独の3桁数字。角度`180°`等は除き、`020〜023`は範囲展開）は所属問題の例示として許可し、warningとして報告します。その型の所属問題でない番号・別単元の問題IDだけが同期エラーです（`scripts/sync-type-pages.mjs`の`checkMentionedProblems`）。句点数（目安2〜4文）もwarningだけです。warningが出ても承認済み本文・descriptionを自動修正しないでください。
- **残作業**：Codexによる型ページ横断監査（公開後に実施予定）。型を追加・削除する場合は、`EXPECTED_PUBLISHED_TYPE_PAGE_COUNT`・テスト・この節・SEO節（sitemap件数）を一緒に更新してください。

---

## 4×4ナビゲーションの現在地

試験範囲（科目 → 単元 → section）と重要度×難易度の16マスから問題を抽出する「4×4推薦・学習ナビゲーション」初版を、2026-09-30に `feature/4x4-navigation` branch（基準commit `2f74b6e`）で実装しました。**masterへのmerge・push・本番公開は、人間のPC／スマホ確認と明示的な承認の後です**（この節はmerge後の契約として書いています）。実装正本は本教材側（`math_db_quadratic_working/`）の `four_by_four_navigation_implementation_spec_v1.0_2026-09-30.md` です。既存の問題DB・型ページを置き換えない別レイヤーで、正本Markdown・master xlsx・型ページ所属・既存問題URLは変更していません。

- **ルートとindex契約**：設定画面 `/navigator/`（index対象・self-canonical・sitemap掲載。sitemapは227→228）、抽出結果の入口 `/app/navigation/`（`noindex,follow`・self-canonical・sitemap非掲載）。条件はURL fragmentで渡し、条件ごとのHTML・sitemap登録は作りません。どちらも `BaseLayout`（GA4は既存の `Analytics.astro` を1回だけ）を使います。TOPには既存の「問題データベースを見る」の隣に副ボタン「4×4ナビゲーション」を置いています。
- **抽出結果は通常の問題DBで見る（抽出モード）**：独立した抽出結果一覧ページは持ちません（2026-09-30に廃止）。「○問を問題データベースで見る」は、抽出した先頭の問題の既存URLへ条件のfragmentを付けて移動します（例 `/math1/set-logic/M1-SL-001/#v=1&r=sl,qf1,qf3&c=41,42,31`）。`ProblemDbShell` は、fragmentが条件の形（`src/utils/navigatorLink.ts` の `isStateStringShape`）のときだけ `src/scripts/navigatorDbMode.ts` を遅延読み込みし、(1) 中央の問題一覧（PC中央列・スマホの問題一覧ダイアログ）を抽出した問題の行だけにする、(2) 左の単元ナビを抽出した問題がある単元だけにして行き先をその単元の最初の抽出問題にする、(3) 一覧・単元・パンくず・前後移動のリンクへ同じfragmentを付けて抽出状態を保つ、(4) ヘッダー直下の帯に「4×4ナビで選んだ○問を表示中」・前の問題／次の問題・条件を変更・学習設定を保存・条件を共有・通常の全問題表示へ戻る、を出します。候補データは抽出モードのときだけ `/app/navigation/data.json`（build時生成の静的JSON）を取得します。**条件はURL fragmentだけで持ち、sessionStorage等には置きません**。そのため、fragmentのない通常の入口（`/app/`・単元トップ・検索からの直接着地）は従来どおり全問題表示で、個別問題の静的HTML（本文・一覧・canonical・index契約）は抽出モードの有無で変わりません（帯のための空の `<div data-nav-mode hidden>` があるだけ）。個別問題をSPA化・クライアント描画にしないでください。抽出モードは `ProblemGroupList.astro`・`ProblemDbShell.astro` が出力するclass名（`.db-problem-group`・`.db-problem-row`・`.db-problem-link`・`.db-problem-group-count`・`.db-unit-btn`・`.db-list-toggle`・`.db-list-switch`）で要素を見つけるので、これらを変えるときは `navigatorDbMode.ts` も合わせて直してください。
- **`/app/navigation/` の役割**：共有URL・保存設定の入口です。条件を読めて該当問題があれば、抽出した先頭の問題のURLへ同じfragmentを付けて `location.replace` します。条件がない・読めない・該当問題がない場合とJavaScript無効時は移動せず、案内と `/navigator/`・`/app/`・各単元トップへの静的リンクを表示します。共有するURLは常にこの入口の形（`/app/navigation/#…`）です。
- **データ源**：独立検算済みの公開対象問題のfrontmatter（`subject`・`unit`・`section`・`display_order`・`importance`・`importance_label`・`difficulty`）だけです。`src/utils/navigatorData.ts` がbuild時に5コレクションから候補データを作り、ページへJSONで埋め込みます。重要度・難易度・所属sectionを別の一覧へ書き写さないでください。Web側だけで持つのは、URL・保存用の短い安定ID（`src/data/navigator-config.ts`：科目 `m1`、単元 `ec`/`sl`/`qf`/`tr`/`da`、section `ec1`…`da5` の22件）です。**一度公開したIDは変更・再利用しないでください**（共有URL・保存済み設定が別の範囲を指します）。科目名・単元名・単元順は `dbSubjectNav` が唯一の情報源で、設定とfrontmatterの食い違い（未知のsection・問題0件のsection・単元の過不足・重要度ラベルの不一致・評価値の範囲外）はbuildエラーになります。
- **ロジックの置き場所**：候補・範囲集計・16マス・抽出・並び順・状態のencode/decode・正規化は `src/utils/navigatorCore.ts`、ブラウザ保存と復元の優先順位は `src/utils/navigatorStore.ts` の純粋関数に一本化し、ページのclient script（`src/scripts/navigatorPage.ts`・`navigatorResultPage.ts`・`navigatorDbMode.ts`）とテストが同じ関数を使います。UI側に別の抽出・正規化ロジックを増やさないでください。
- **並び順**：抽出結果は常に「科目順 → `dbSubjectNav` の単元順 → `display_order` 昇順」で、問題IDで重複排除します。4×4は候補を残すフィルターで、難易度順・重要度順・推薦スコア順へ並べ替えません。抽出モードは既存の静的な一覧から対象外の行を隠すだけで（並び替えない）、前後移動・単元リンクの行き先は `navigatorCore.ts` の `buildDbModeView()` が同じ順序から決めます。
- **4×4**：行＝土台・本命・次点・余力（内部値4→1）、列＝難易度1〜4。初期状態は範囲・16マスとも未選択。0問のマスは無効で、範囲変更で0問になった選択マスは自動解除して通知し、後で件数が戻っても自動再選択しません。プリセットUIはありません。将来のプリセット（例：土台・本命×難易度1〜3）は `selectCells()` へセル集合を渡すだけで追加し、専用の抽出ロジックを作らないでください。
- **状態と共有URL**：形式は `#v=1&r=<範囲>&c=<セル>`（例 `/app/navigation/#v=1&r=sl,qf1,qf3&c=41,42,31`）。範囲は科目全体＝科目ID・単元全体＝単元ID・それ以外はsectionのID、セルは「重要度の内部値＋難易度」（全16マスは `all`）で、同じ設定は必ず同じ文字列になります。不明なID・重複・不正な値はその値だけ無視し、未知の `v` は適用しません。URLには設定名・学習履歴・個人情報を含めません。形式を変えるときは `v` を上げ、`v=1` を読めるままにしてください。
- **保存**：アカウント・サーバー・外部DBは使わず、localStorage（key `mathnavi.navigator`、形式version 1）へ「条件」だけを保存します（問題ID一覧・進捗・正誤は保存しない）。保存済み設定（複数。自動名・名前変更・開く・共有・削除）、前回使用設定、下書きの3種です。復元の優先順位は「URLの条件 → 前回使用設定 → 下書き → 新規」で、前回使用設定・下書きは自動適用せず「続ける／新しく設定する」を提示します。共有URLを開いただけでは保存データへ書き込みません（利用者が「この条件で学習する」か保存を選んだ後に記録）。localStorageが使えない・容量超過・壊れたデータでもナビ・共有・DB利用は継続でき、読めない保存データは利用者が明示的に初期化するまで上書きしません。
- **共有された条件の扱い（抽出モード）**：この端末の前回設定・下書き・保存済み設定のどれとも違う条件で開いたときは、帯に「共有された条件を表示しています」と「この条件で学習する」を出し、選ぶまで保存データへ記録しません。
- **GA4イベント**：`navigator_open`・`navigator_range_select`・`navigator_cell_select`・`navigator_extract`・`navigator_result_view`・`navigator_save`・`navigator_share`・`navigator_resume`（`src/utils/navigatorBrowser.ts`）。送るのは件数と種別だけで、section名・設定名・問題ID・条件文字列は送りません。
- **テスト・監査**：`npm run test-navigator`（buildなし。候補180問・5単元22 section・不正値検出・範囲集計・抽出・並び順・0問セル・URL状態・抽出モードの一覧／前後移動／単元リンク・保存と復元）、`npm run build && npm run audit-navigator`（両ルートのindex契約・`data.json`・抽出モード用の帯が静的HTMLでは空で非表示・sitemap 228件・robots・既存180問／単元トップ5／型ページ38の回帰・GA4の二重読込なし。`NAV_AUDIT_BASELINE=<実装前のdist>` を渡すと既存ページの静的HTMLが実装前と同じことも比較）。抽出モードのDOM操作そのもの（行の絞り込み・帯の表示）は自動テストがなく、ブラウザで確認します。
- **数学A追加時の拡張点**：(1) `dbSubjectNav` に科目・単元を追加、(2) `navigator-config.ts` に科目（例 `ma`）・単元・sectionのIDを追加、(3) `navigatorData.ts` の `SOURCES` に新しいcollectionを追加。状態形式・抽出ロジック・UIは変更不要です（科目横断の選択・並び順はテスト済み）。数学Aを同じ4×4へ載せる前に、数学Iと同じ尺度で重要度・難易度を付け、科目横断監査を通してください。仮データ・空の科目は置かないでください。
- **未実施・既知の点**：Codex監査は未実施。Privacyページには、ブラウザ内保存（localStorage）についての記述をまだ追加していません。

---

## 「事前知識・使用公式」（任意セクション、2026-09追加）

正本problem.mdスキーマに新しく追加された任意セクションです。M1-EC-001〜003で初めて使用され、M1-EC-004〜044でも踏襲しています。2026-09-24に、QF/TR/DAの118問（M1-QF-001〜054・M1-TR-001〜041・M1-DA-001〜023）にも追加し、**公開162問すべてにこのセクションがあります**（2026-09-27公開の集合と論証18問も全問にあり、公開180問すべてが対象）。

- QF/TR/DAへの追加は、単元ごとに「正本から問題文・ThinkingFlow題名を作業用ファイルへ抽出→GPTと人間による本文作成→Codexの監査・再監査→監査済み確定本文を正本へそのまま挿入→`npm run sync-content`」の手順で行いました（コミット：DA`714e8b1`・TR`9c6237c`・QF`9980ee4`）。作業用ファイル（`review/M1-*_prior_knowledge_*.md`、git管理外）は、確定本文118問分が正本の「事前知識・使用公式」と完全一致することを確認のうえ、2026-09-24に削除しました。監査済み本文は言い換えずに挿入し、問題文・問題メタ・解法メタ・ThinkingFlow・最終解答・frontmatter・assetは無変更です。数学的固定内容を変えていないため、再独立検算の対象外です。
- 正本内の配置は「`## 問題`（→`## 問題の言い換え`がある場合はその後）→`## 事前知識・使用公式`→`## 問題メタ`」です。「問題の言い換え」があるのはM1-QF-047・048・049・053・054です。
- QF/TR/DAの事前知識は箇条書きのテキスト・数式だけで、`placement: prior_knowledge`のassetはありません（このassetを使っているのは下記のM1-EC-016・025と、M1-SL-016だけです）。
- 正本の改行コードは単元・問題ごとに異なります（M1-TR-005・006・009〜021の15ファイルはCRLF、他はLF）。スクリプトで一括編集する場合は、ファイルごとの改行コードを維持してください。

- 見出しは`## 事前知識・使用公式`。パーサー（`markdownSections.ts`）自体は無変更で、既存の`##`見出し分割の汎用ロジックが処理します。各`prepare*Entry.ts`（QF/TR/DA/EC/SL全5コレクション）に`findSection(sections, '事前知識・使用公式')`を追加し、値の有無だけで表示可否を判定します。
- 表示位置：問題 → **事前知識・使用公式** → 元講師の独り言 → ThinkingFlow → 最終解答。
- 初期状態は閉じています（progressive disclosure）。存在する問題だけ見出し・ボタンを表示し、存在しない問題には何も出しません。
- 開閉ロジック・アニメーションは最終解答の開閉（`data-answer-toggle`/`.result-box`、`grid-template-rows` 0fr/1fr手法）をそのまま複製しています。ボタン文言が異なるため別data属性（`data-prior-knowledge-toggle`/`data-prior-knowledge-box`）を使いますが、ロジック自体は複製元と同一です。新しい開閉アニメーション実装は増やしていません。
- CSS（`global.css`の`.prior-knowledge-section`）も最終解答の外枠処理（`.final-answer-section`と同じ上罫線＋transparent、白カード外枠・shadow・pill・左色バーなし）を複製しています。新しいカードUIは作っていません。
- 数式内に日本語テキストを直接書く場合（例：`(x\text{の指数})`）は、既存規約通り`\text{}`で囲んでください。囲まずに書くとKaTeX build時に`unicodeTextInMathMode`警告が出ます（KaTeXが自動でCJKフォールバック表示するため見た目自体は同じですが、警告は避けられます）。
- 「事前知識・使用公式」は**AI-context JSON（`src/pages/ai-context/[id].json.ts`）へ含めません**（現行仕様）。固定教材側の参照欄であり、AI質問用contextとは別レイヤーとして扱います。`src/utils/aiContext.ts`は「問題」「問題の言い換え」「ThinkingFlow」「最終解答」のセクションだけを取り出すため、公開180問すべてで事前知識の本文・`placement: prior_knowledge`のassetはAI-contextに入りません（問題メタ・解法メタも同様）。
- asset配置：当初「事前知識・使用公式」内へのasset配置は未対応でしたが、2026-09にM1-EC-016向けに対応しました。`content.config.ts`の`problemAssetSchema`へ`placement: 'prior_knowledge'`を追加し（既存の`problem`/`flow`/`final_answer`に1値追加、他3値は無変更）、`prepareExpressionCalculationEntry.ts`に`priorKnowledgeAssets`を返す分岐を追加、`Quadratic27Detail.astro`の展開領域内（`.result-box-inner`、`problemAssets`と同じfigure/table描画パターン）へ表示します。QF/TR/DAの`prepare*Entry.ts`はこのフィールドを返さないため、コンポーネント側は`prepared.priorKnowledgeAssets ?? []`で未定義を吸収しています。QF/TR/DAの118問は事前知識のテキストは持ちますが、事前知識内のassetは表示されません。QF/TR/DAの事前知識にassetを置く場合は、先に該当する`prepare*Entry.ts`へ同じ分岐を追加してください。`prepareSetLogicEntry.ts`（集合と論証）はECと同じく`priorKnowledgeAssets`を返します（M1-SL-016で使用）。

### 「たすき掛け」交差図asset（2026-09追加）

因数分解のたすき掛け（M1-EC-016の事前知識・ThinkingFlow 1、M1-EC-021のThinkingFlow 3）専用の表現方法です。`design_refs/tasuki.png`（repo直下のデザイン参考画像フォルダ。ページとしては公開されない）のレイアウトを踏襲しています。

- 構成：左列（各因数の一次の項）→交差する2本の矢印（`pa-axis-highlight`、矢尻は`<marker>`）→右列（各因数のもう一方の項）→水平矢印（`pa-axis`）→交差積→区切り線→下段3項（左列の積／右列の積／交差積の和）。
- 文字サイズ：既存の`pa-label`（11px）はグラフの座標軸ラベル用で、本文中のKaTeX数式と並べると小さすぎたため、新設した`pa-label-eq`（22px、`global.css`）を使います。`pa-label`自体は変更していません（既存のグラフ系assetへの影響なし）。
- 新しい「たすき掛け」assetを作る場合は、この構成・クラス（`pa-label-eq`／`pa-axis-highlight`／`pa-axis`／`pa-figure-line`／`pa-table-cell-strong`の組み合わせ）を踏襲し、独自の新しいCSSクラスを増やさないでください。

### 数の分類ネスト矩形図asset（2026-09追加）

M1-EC-025（「事前知識・使用公式」）専用。自然数⊂整数⊂有理数⊂実数の包含関係と、無理数（実数のうち有理数ではない部分）を示す図です。既存の`pa-figure-fill`（外枠の実数を表す塗りつぶし矩形）・`pa-figure-line`（有理数／整数／自然数の入れ子矩形、`fill="var(--color-surface)"`で内側を白抜き）・`pa-panel-label`（各領域名ラベル）のみで構成し、新しいCSSクラスは追加していません。

- 無理数には枠を描かず、有理数の入れ子矩形の右側に生じる余白へラベルのみ配置しています。当初は実数の枠内を無理数／有理数で縦の区切り線（`pa-guide`）で仕切っていましたが、人間レビューで「実数と無理数が別枠に見える」と指摘されたため区切り線を削除しました。`.result-box-inner`・「事前知識」パネルの背景色が`pa-figure-fill`の塗り（`var(--color-accent-bg)`）と同一のため、区切り線を消すだけで実数全体が1つの連続した矩形に見えます。
- 「実数」ラベルは外枠上辺の線に重なる位置（`y=29`、線は`y=24`）まで引き上げ、文字の裏側だけ`var(--color-accent-bg)`の小さな矩形パッチ（線・テキストより先に描画）で線を消しています。ラベルが枠線をまたいで乗っているような見た目にする場合の実装パターンとして、他のnested-box系assetでも踏襲して構いません。
- 新しい数の分類図（例：複素数を含む拡張等）を作る場合も、この構成（入れ子矩形＋余白ラベルで補集合を表現、区切り線は使わない）を踏襲してください。

---

## AI質問機能・外部追加演習リンクの現在地

ThinkingFlow単位のAI質問機能（Cloudflare Worker＋Gemini接続）は実装・本番Worker構築・本番end-to-end実証まで完了していますが、AI機能群全体（類題生成等）の整備が進むまで、本番では`PUBLIC_AI_ENABLED`により意図的にOFFにしています。Cloudflare本番Worker自体はdeploy済みのまま維持しています。詳細・現在地は`math_service_design_summary.md`第36節を正本としてください。

**AI-context JSON（`/ai-context/<problem_id>.json`、`src/pages/ai-context/[id].json.ts`）は公開180問（QF54・TR41・DA23・EC44・SL18）すべてが対象です**（2026-09-24にDA/ECへ、2026-09-27にSLへ拡張）。build時に5コレクションの独立検算済み問題から自動生成し、手動の許可リストは持ちません。AI用のFlow識別は`problem_id`＋`context_key`（1問題内の表示順`f1`,`f2`,...）で、既存の`part`/`flow`/`flow_key`も維持しています。含めるのは問題文・問題の言い換え（存在する場合）・ThinkingFlow全体・最終解答・asset metadataだけで、**「事前知識・使用公式」・問題メタ・解法メタは含めません**。HTMLコメント（`<!-- ... -->`、制作用メモ）も生成時に除去します（正本は無変更）。Worker側`worker/src/validate.ts`の`PROBLEM_ID_PATTERN`は`/^M1-(QF|TR|DA|EC|SL)-\d{3}$/`で、本番Workerへdeploy済みです（2026-09-27、Version `c9fd20e4-e191-415c-977b-411f5810e311`）。この正規表現は`M1-SL-000`のような存在しない番号も形式上は通しますが、対応するAI-context JSONがないためWorkerは404「対象外」を返し、Geminiには到達しません。**本番Workerのdeployは`worker/`で`npm run deploy -- --env production`です**（素の`npm run deploy`は`wrangler.toml`の既定＝ローカル開発用設定（参照先localhost）で、本番とは別のWorkerになります）。Webを先にdeployして本番にAI-context JSONが出てからWorkerをdeployしてください。新しい単元を追加する場合は、`[id].json.ts`・`aiContext.ts`の`AiContextCollection`へコレクションを追加し、Workerの正規表現も拡張・再deployしてください。

公開95問（QF・TR）のうちFTEXT（CC BY 4.0の外部フリー教材）とEXACT水準で対応する47問には、問題文直下に「追加で練習する」外部リンクを実装し、本番公開済みです（`src/data/external-practice-links.json`、`Quadratic27Detail.astro`）。CLOSE／BROAD／NONE判定の問題にはリンクを追加していません。データの分析（M1-DA-001〜023）も、EXACT判定の12問に外部サイト「教科書より詳しい高校数学」（yorikuwa.com）への同じ「追加で練習する」リンクを追加し、本番公開済みです（コミット`c0b7d45`、同じ`external-practice-links.json`に追記。表示ロジックは共通）。同ファイルの登録は計59問（QF26・TR21・DA12）です。数と式（M1-EC-001〜044）・集合と論証（M1-SL-001〜018）はリンク未登録です。詳細は同文書第37節を正本としてください。

---

## 正本と責任範囲

教材制作の正本はWeb repoの外側にあります。

- Markdown正本：`math_db_quadratic_working/problems/`
- asset正本：`math_db_quadratic_working/assets/`

Web repoでは、GitHub Actions単独でbuildできるよう公開用スナップショットを保持します。

- `src/content/quadratic27/`・`src/content/quadratic27-assets/`（二次関数）
- `src/content/trig4/`・`src/content/trig4-assets/`（三角比）
- `src/content/dataAnalysis/`・`src/content/dataAnalysis-assets/`（データの分析）
- `src/content/expressionCalculation/`・`src/content/expressionCalculation-assets/`（数と式、M1-EC-001〜044。2026-09-23本番公開。詳細は「数と式の現在地」節を参照）
- `src/content/setLogic/`・`src/content/setLogic-assets/`（集合と論証、M1-SL-001〜018。2026-09-27本番公開。詳細は「集合と論証の現在地」節を参照）
- `src/content/typePages/`・`src/data/type-pages.generated.json`（型ページの本文・構造。正本は `type_pages/*.md` とmaster xlsx。詳細は「型ページ（問題タイプ）の現在地」節を参照）

**公開用スナップショットは正本ではありません。直接編集しないでください。**

教材内容・assetを変更する場合は、原則として制作側の正本を変更し、その後Web repoで、

```sh
npm run sync-content
```

を実行してMarkdownとassetを同期します（`sync-problems`＝問題Markdown・asset → `sync-type-pages`＝型ページ構造・型Markdownの順）。

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
- `/math1/quadratic/`：数学I「二次関数」上位区分の単元トップ、`/math1/quadratic/M1-QF-001/` 〜 `/M1-QF-054/`
- `/math1/trig/`：数学I「三角比」上位区分の単元トップ、`/math1/trig/M1-TR-001/` 〜 `/M1-TR-041/`
- `/math1/data-analysis/`：数学I「データの分析」上位区分の単元トップ、`/math1/data-analysis/M1-DA-001/` 〜 `/M1-DA-023/`
- `/math1/suto-shiki/`：数学I「数と式」上位区分の単元トップ、`/math1/suto-shiki/M1-EC-001/` 〜 `/M1-EC-044/`（2026-09-23本番公開。詳細は「数と式の現在地」節を参照）
- `/math1/set-logic/`：数学I「集合と論証」上位区分の単元トップ、`/math1/set-logic/M1-SL-001/` 〜 `/M1-SL-018/`（2026-09-27本番公開。詳細は「集合と論証の現在地」節を参照）
- `/navigator/`：4×4ナビゲーションの設定画面、`/app/navigation/`：その抽出結果の入口（どちらも `BaseLayout`。抽出結果そのものは、条件のfragmentを付けた既存の個別問題URL＝問題DBの抽出モードで表示する。詳細は「4×4ナビゲーションの現在地」節を参照）

個別問題URLをブログ型・縦長型の別UIへ戻さないでください。
**1問題＝1固有URL、表示UI＝共通DBシェル**が現行仕様です。

各個別URLはJavaScriptだけで問題を後付け表示するのではなく、Astroの静的生成によって、その問題固有の本文をHTML内に持たせます。

中央問題一覧は、検索エンジンが辿れる通常の `<a href>` で各問題URLへリンクします。
SPA化や複雑なクライアント状態管理を、明示的な要求なしに導入しないでください。

### 中央問題一覧の分類・共有コンポーネント

中央問題一覧は単元ごとにアコーディオン＋行リストで表示します（二次関数＝二次関数／二次方程式／二次不等式の3区分、三角比＝4区分、データの分析＝5区分、数と式＝4区分、集合と論証＝2区分）。

- 区分への分類は問題IDのレンジではなく、正本frontmatterの `section` 値をキーにした対応表（`quadraticDbItems.ts` / `trigDbItems.ts` / `dataAnalysisDbItems.ts` / `expressionCalculationDbItems.ts` / `setLogicDbItems.ts` の `SECTION_TO_GROUP`）で単元ごとに行います。分類ロジック自体は `src/utils/dbCenterList.ts`（`groupCenterItems`）に一本化しています。
- 一覧のマークアップ・スタイルは `src/components/ProblemGroupList.astro` に一本化し、PC中央列・スマホ用問題一覧ダイアログの両方から同じ実装を再利用します。
- 新しい単元を追加する場合や表示を調整する場合も、この対応表とコンポーネントを流用してください。`ProblemDbShell.astro` 側や別コンポーネントに、もう一つ別の分類ロジックを増やさないでください。
- 型ページ一覧が1件以上ある単元では、中央列（とスマホdialog）に「問題タイプ / 問題一覧」切替が出ます。「問題一覧」側は上記の `ProblemGroupList` そのままで、分類・見た目は変えません。詳細は「型ページ（問題タイプ）の現在地」節を参照（2026-09-29の型ページ公開以降、productionでも全5単元に切替が出ます）。

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

### `/navigator/`・`/app/navigation/`（4×4ナビゲーション）

- `/navigator/`：index対象・noindexを付けない・canonicalは自身・sitemapに1件だけ掲載
- `/app/navigation/`：`noindex,follow`・canonicalは自身・sitemapには載せない・robots.txtでDisallowしない
- 条件はURL fragmentで渡す。条件ごとのページ・sitemap登録は作らない
- 個別問題URLへ条件のfragmentを付けて開く「抽出モード」は、表示だけをclient側で絞るもので、個別問題のcanonical・index・静的HTMLは変えない

### 各単元トップ・個別問題URL（QF/TR/DA/EC/SL共通）

- `/math1/quadratic/`・`/math1/trig/`・`/math1/data-analysis/`・`/math1/suto-shiki/`・`/math1/set-logic/`と各個別問題URL
- index対象
- noindexを付けない
- 個別問題は固有title / description
- canonicalは各URL自身
- `/app/` へcanonical統合しない

### sitemap / robots

`sitemap.xml` は検索対象ページを掲載します（`src/pages/sitemap.xml.ts`）。
現行180問（QF54・TR41・DA23・EC44・SL18）時点の内訳は、

- `/`
- `/navigator/`（4×4ナビゲーションの設定画面）
- `/math1/quadratic/` ＋ 個別問題54URL ＋ 型ページ10URL
- `/math1/trig/` ＋ 個別問題41URL ＋ 型ページ9URL
- `/math1/data-analysis/` ＋ 個別問題23URL ＋ 型ページ6URL
- `/math1/suto-shiki/` ＋ 個別問題44URL ＋ 型ページ8URL
- `/math1/set-logic/` ＋ 個別問題18URL ＋ 型ページ5URL
- `/privacy/`
- `/disclaimer/`
- `/contact/`

の計228 URLです（型ページなしの190＋型ページ38。2026-09-29時点の227 URLに、4×4ナビゲーションの `/navigator/` 1件を加えたもの。2026-09-30のbuildで件数・内訳を確認済み。型ページは各単元の個別問題の後ろに並びます）。

`/app/`・`/app/navigation/` はsitemapへ含めません（旧6サンプルrouteは2026-09-24に削除済み）。

型ページは、公開ゲート（published 38件完了＋人間の公開承認）を通過したときだけ38件を一括でsitemapへ追加する方式で、2026-09-29の公開承認により189→227 URLになりました（4×4ナビの `/navigator/` 追加後は、型ページなし190・型ページあり228）。その中間の件数になる段階状態は作りません。型ページは単元トップ・個別問題と同格の公開contract（index対象・self-canonical）です。

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
4. 必要な場合のみ「事前知識・使用公式」（2026-09追加の任意セクション。詳細は該当節を参照。PC・スマホ共通で初期状態は閉じる）
5. 「元講師の独り言」（問題メタ・解法メタ。PC・スマホ共通で初期状態は閉じる）
6. ThinkingFlow
7. 最終解答

### 元講師の独り言（問題メタ・解法メタ）

問題メタ・解法メタは、上位見出し「元講師の独り言」の下にまとめて1つの開閉ブロックとして表示します（`Quadratic27Detail.astro`の`impression-section`）。内部データ名・frontmatterの`problem_meta`/`solution_meta`相当は変更していません。

- 閉状態：「元講師の独り言」見出し＋問題メタ冒頭2行（CSSの`line-clamp`のみで制限、本文は加工しない）＋「続きを読む」。「問題メタ」小見出し・解法メタは非表示。
- 開状態：「問題メタ」小見出し＋問題メタ全文、「解法メタ」小見出し＋解法メタ全文、「閉じる」。
- 問題メタ本文（`problemMeta.html`）はDOMを複製せず、同一要素（`.impression-clamp`）に`is-expanded`クラスを付け外しするだけでプレビュー⇔全文を切り替えます。解法メタは別要素（`.impression-panel`）をhidden解除して表示します。
- PC・スマホで挙動を分けません（以前はスマホ幅だけ開閉式でしたが、2026-09時点でPC・スマホ共通の単一開閉に統一しました）。
- 開閉ボタンには`aria-expanded`と、問題メタ・解法メタ双方のDOM要素idを指す`aria-controls`（スペース区切り）を付与しています。

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

開閉には軽いアニメーション（CSS Gridの `grid-template-rows: 0fr → 1fr` ＋ opacity、`prefers-reduced-motion` では即時開閉）を使っています。最終解答、および「元講師の独り言」内の解法メタ開閉も同じ手法を再利用しているため、新しい開閉アニメーション実装を増やさないでください。

---

## UIブラッシュアップ（2026-09）

「AIが作ったSaaSテンプレのような視覚表現」を弱める目的で、TOPページ・個別問題ページの装飾を段階的に整理しています。baseline tag `ui-before-ai-look-cleanup`（commit `0aa8707`）から分岐した`ui-cleanup-experiment`ブランチ上で第一段階〜TOPページの見た目まで（下記4節）を実施し、2026-09-17にmasterへマージ済みです（コミット`e30e570`）。以下の内容はmaster上の現行仕様です。

### 第一段階：装飾の削減
- 共有の角丸変数`--radius`を8px→2pxへ縮小（カード・ボタン・チップ等サイト全体に連動する唯一の変数）。
- 通常コンテンツのbox-shadowを撤去（モーダル・スマホドロワー・フローティングUIは維持）。
- 見出しの左ボーダー装飾（`h2`・`.impression-subhead`等）を撤去し、文字ウェイト・余白だけで階層を表現。
- 「元講師の独り言」見出しの斜体を撤去（正体に統一）。
- TOPページの方眼グリッド背景を撤去。
- 「元講師の独り言」・最終解答・TOP「このサイトについて」の白カード外枠を撤去し、上罫線＋余白の区切りへ統一。

### ThinkingFlowの見た目（第二段階A）
- STEPの白背景・外枠・角丸を撤去し、左に縦レール＋小さな番号マーカー（円。★付きSTEPだけ塗りつぶし）を配置。
- 右端のシェブロンを＋／−の静かなアイコンに変更。
- 「考え方を全部見る」をボタンからテキストリンクへ弱めた。
- STEPの順番・タイトル・本文・開閉ロジック・aria属性・★の付与位置は無変更（`splitStepNumber`でdisplayTitle先頭の"N."を表示分割しているだけ）。

### 重要度・難易度の見た目（第二段階B）
「土台／本命／次点／余力」の表示色を、`data-importance`属性ベースの共通CSSルール（`global.css`の`[data-importance="..."]`）へ一本化しました。以下の3箇所すべてが同じルールを参照します。新しい場所に重要度を表示する場合も、要素に`data-importance="土台|本命|次点|余力"`を付けるだけで揃います。

- 個別問題タイトル下（`Quadratic27Detail.astro`の`.label-value`）
- PC/スマホ問題一覧（`ProblemGroupList.astro`の`.db-problem-chip`。`chips[0]`＝重要度にのみ付与、`chips[1]`＝難易度は`:not([data-importance])`で除外）
- TOPページCONCEPT重要度説明（`index.astro`の`.concept-item-label`）

現在の配色（すべて`border-radius:2px`前後の平たいラベル、影・ピル型なし）：

- 土台：ネイビーブルー `#234A60`・白文字
- 本命：ロイヤルブルー `#33569C`・白文字
- 次点：ラグーンブルー `#1C7089`・白文字
- 余力：薄いグレー `#E3E2DE`・濃いグレー文字（`--color-text-subtle`）

難易度（★表示）には新しい配色システムを作らず、従来通りの控えめな文字表示のままです（重要度と違いピル/箱にしない）。

### TOPページの見た目
- Hero見出しの装飾フォント（Zen Maru Gothic）を撤去し、本文と同じ`--font-base`へ。
- サブコピーを「重要度 × 難易度 × 定期試験 × ThinkingFlow」→「重要度 ｜ 難易度 ｜ 定期試験 ｜ ThinkingFlow」に変更。
- 「試作公開中」バッジを塗りピルから細枠の静かな小ラベルへ。
- CTAの矢印スライドhoverアニメーションを撤去（hoverは背景色変化のみ、影・浮き上がりは第一段階で撤去済み）。
- CONCEPTセクションの英字装飾ラベル「CONCEPT」と、4列上部の汎用線画アイコン（ピラミッド・階段・家・フローチャート）を撤去（4分割構造自体は維持）。
- 難易度説明の丸数字①〜④を、大きい塗りつぶし円から小さいアウトライン円へ縮小。
- ThinkingFlow説明（ミニ実演、`.mini-flow-*`）に、実際のThinkingFlowと同じ縦レール・番号マーカー・★の視覚言語を反映。
- DBプレビュー画像（`public/images/top-db-preview.png`）を最新UIのスクリーンショットに差し替え。
  - 2026-09-27、集合と論証の追加に合わせ、同じ問題（M1-QF-017）・同じ構図・同じサイズ（2540×1182）で撮り直しました（左の単元ナビに全5単元が並ぶ状態）。

情報構造・セクション順・文章内容（上記の明示した文言変更を除く）・レスポンシブのブレークポイント・AI導線・SEO関連（title/description/canonical/BreadcrumbList/単元トップ構造）は変更していません。各段階とも実機確認のうえ、ユーザーの明示的な承認を得て順にcommitしています。

### 配色・面の色温度統一（2026-09-18）

上記の第一〜第四段階に続く追加調整です。TOPとDBでやや異なって見えていた色温度を、「暖かい無彩色＋白＋濃いネイビー＋既存ブルー系アクセント」の1系統へ揃えました。

- 主要design token（`src/styles/global.css`）：`--color-bg: #f7f6f3`／`--color-border: #dad8d2`／`--color-text: #1c2229`。新規`--color-surface-sunken: #f1f0ec`を追加し、PC左サイドバー・中央問題一覧（`ProblemDbShell.astro`の`.db-pane-subjects`・`.db-pane-list`）とスマホ問題一覧ドロワーの背景に使用（白い問題詳細面より1段沈めるナビゲーション面）。
- TOP専用配色`.app.top-theme`（`index.astro`のみ）から`--color-bg`・`--color-border`・`--color-text`・`--color-text-muted`・`--color-primary-dark`の個別上書きを削除し、:root側の統一トークンへ委譲。`--color-primary`（TOP限定のミッドブルー）・`--color-accent-bg`はTOP固有のブルー系アクセントとして維持（意図的に残した差分）。
- 重要度専用トークン（`--color-importance-navy`/`royal`/`lagoon`）・重要度の配色ルールは無変更。
- TOPページのDBプレビュー画像（`public/images/top-db-preview.png`）を、新配色反映後の実画面スクリーンショットに再差し替え。

### ヘッダー色の調整（2026-09-18）

ヘッダー背景専用のdesign token `--color-header-bg` を新設しました。`.site-header`（TOP、`global.css`）・`.db-header`（PC/スマホ共通のDBヘッダー、`ProblemDbShell.astro`）がこれを参照し、`--color-primary-dark`（ボタン・見出し文字色など本文側でも広く使うトークン）とは独立してヘッダーの色味だけを調整できるようにしています。

検討の過程で、薄い青灰色や白背景＋罫線も試しましたが、最終的には元の濃いネイビー `#1f3347`（`--color-header-bg`の値も同じ）で確定しています。TOP・DBヘッダーは背景・ブランド文字色・右側リンク色・hover挙動まで完全に同一です。

スマホ問題一覧ドロワーのヘッダー（`.mobile-problem-dialog-header`）は、モーダル／ドロワー系floating UI（第一段階で影・浮き上がりを維持する対象とした要素群）として扱い、常設の上部ヘッダー（`.site-header`/`.db-header`）とは意図的に区別しています。今回の調整対象外です。

### DB問題詳細・中央一覧の整理（2026-09-18）

- 問題詳細タイトル（`Quadratic27Detail.astro`）に、中央一覧と同じ3桁表示番号を追加しました。内部ID（`M1-QF-017`等）をそのまま表示せず、末尾数字を取り出す`displayProblemNumber()`（`src/utils/dbCenterList.ts`）を中央一覧（`ProblemGroupList.astro`）と共有し、表示番号の情報源を一本化しています。見た目はタイトルより明確に弱く（絶対サイズ1rem・通常ウェイト・muted文字色、チップ化なし）。
- 中央問題一覧の行（`ProblemGroupList.astro`の`.db-problem-link`）は`align-items: center`から`flex-start`へ変更しました。番号・タイトル・重要度・難易度チップの横位置はflex-growで元から安定していましたが、タイトルが1〜3行に折り返すたびに縦位置がずれていたため、常に1行目の高さで揃うようにしています。横方向のレイアウト自体（flexboxの構造）は作り直していません。
- 問題詳細内（問題→元講師の独り言→ThinkingFlow→最終解答）の縦余白を`getBoundingClientRect`による実測で監査した結果、いずれも11〜18px程度で既に揃っていたため、変更していません。

---

## assetルール

assetの表示位置はファイル名ではなく `problem.md` のmetadataを正本とします。

- 通常Flow：`placement + flow`
- 小問内Flow：`placement + part + flow`
- 問題文：`placement: problem`
- 最終解答：`placement: final_answer`
- 事前知識・使用公式：`placement: prior_knowledge`（EC・SLのみ対応）
- 問題メタ／解法メタ：`placement: problem_meta`／`solution_meta`＋本文中の単独段落`[asset: <file>]`（SLのみ対応。「集合と論証の現在地」節を参照）

`problem.svg` のようなファイル名だけから表示位置を推測しないでください。

assetは必要最小限とし、数学的に意味のある視覚補助として使います。
色・線幅・ラベル位置等は実装側で調整できますが、人間レビュー済みassetを理由なく作り直さないでください。

公開用assetスナップショットだけを直接修正しないでください。正本assetを修正して再同期します。

### SVG内部IDの命名規則

SVGはインラインで埋め込まれるため、複数assetが同じ内部ID（`<marker>`・`clipPath`・`mask`・gradient等の`id`）を持つと同一ページ内で衝突します。閉じたFlow（`hidden`＝`display:none`）内の定義が先に現れると、別Flowの`url(#…)`参照が描画されません（2026-09に`pa-arrow`でQF/TRの15問の矢尻消失として発生し修正済み）。

- 内部IDは `<用途>-<問題ID>-<ファイル名由来>` の形で、assetファイル単位で一意にしてください（例：`pa-arrow-qf002-flow-01`、`pa-arrow-tr015-trig-inequality-sin`）。`id`定義と対応する`url(#…)`参照は必ずセットで変更します。
- 同じSVGファイルを同一ページの複数箇所へ配置すると、内部IDもそのまま重複します。その場合は必要に応じてasset自体を別ファイル化してください（例：M1-QF-002はFlow2用`problem.svg`と最終解答用`final-answer.svg`に分離）。

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
- ブラウザから外部AI APIへ直接接続しない
- 外部AI APIを利用する場合、APIキーや認証情報をクライアントへ露出させない
- 外部AI APIへの通信は、Cloudflare Workers等のserverless proxyなど、管理された中継層を経由する
- 中継層では、Origin制限・レート制限・payload上限等の濫用対策を行う
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
- 型ページの公開集合・SVG監査（`npm run audit-type-pages`。build後に実行。公開承認済みの現在は型route 38件・sitemap 228件）
- 4×4ナビゲーションのロジックテスト（`npm run test-navigator`。buildなしで実行可）とbuild監査（`npm run audit-navigator`。build後に実行）

M1-QF-001〜054・M1-TR-001〜041・M1-DA-001〜023・M1-EC-001〜044はCodex構造監査済みです（QF/TRはFIX相当の構造的不整合なし、ECはPASS WITH REVIEW・BLOCKERなし）。**M1-SL-001〜018はCodex構造監査・Opus asset横断レビューとも未実施のまま本番公開しています。**
**M1-DA-001〜023はOpus asset横断レビューのみ未実施のまま本番公開しています。** DAへ追加修正を行う際は、この監査が別途必要になる可能性を踏まえてください。

既存問題を変更した場合は、変更内容に応じて再監査・再独立検算が必要かを判断してください。
純粋なUI・余白・asset描画調整等は、数学的固定内容を変えない限り原則として再独立検算対象ではありません。

---

## Documentation

詳細仕様は、READMEより以下の正本文書を優先してください。

- `math_service_design_summary.md`
- `problem_authoring_workflow.md`
- `_TEMPLATE_for_page_generation.md`
- `problem_master/`配下の各xlsx（`quadratic_function_problem_master.xlsx` / `trigonometric_ratio_problem_master.xlsx` / `data_analysis_problem_master.xlsx` / `expression_calculation_problem_master.xlsx` / `set_logic_problem_master.xlsx`）
- 型ページの実装仕様：`type_page_implementation_spec_v1.1_2026-09-28.md`（本教材側 `math_db_quadratic_working/` 直下）
- 4×4ナビゲーションの実装仕様：`four_by_four_navigation_implementation_spec_v1.0_2026-09-30.md`（同上）

README / AGENTS.mdには概要と作業境界を置き、正本文書と同じ細則を過剰に重複させないでください。
