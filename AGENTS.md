## プロジェクトの目的

高校数学の学習ナビゲーションサイト **「高校数学ナビ」** の公開試作です。

公開URL：

- https://math-navi.com

中心価値は、問題や詳しい解説を大量に増やすことではなく、

> **「何をやるか」「何を後回しにするか」「どういう順番で考えるか」を明確にすること**

です。

現在、数学I「数と式」「二次関数」「三角比」「データの分析」の4単元・計162問（M1-EC-001〜044・M1-QF-001〜054・M1-TR-001〜041・M1-DA-001〜023）を本番公開しています。三角比・データの分析・数と式の詳細は後述の各節を参照してください。

数学I「数と式」M1-EC-001〜044（44問、式の計算／因数分解／実数・平方根／一次不等式の4区分）は全問独立検算済みで、教材化・技術実装・人間による全44ページSSレビュー・Codex最終構造監査を経て、2026-09-23に本番公開しました。詳細は「数と式の現在地」節を参照してください。

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
- `dbSubjectNav`（`src/data/subjects.ts`、DB UI専用の単元ナビ）には追加済みで、TOPから「問題データベースを見る」で`/app/`へ移ると数と式を含む全4単元が表示されます。サイト内の単元ナビは`dbSubjectNav`だけです。旧左サイドナビ（`Nav.astro`・`subjectNav`／`publicSubjectNav`・`BaseLayout.astro`の`showNav`引数）は、公開ページで表示されていなかった（404だけは2026-09-24まで古いナビが出ていた）ため、同日の不要ファイル整理で旧サンプルとあわせて削除しました。`BaseLayout.astro`のページ（TOP・Privacy・Disclaimer・Contact・404）に単元ナビが必要になった場合は、`dbSubjectNav`を元に新しく設計してください。
- 数と式masterは`problem_master/expression_calculation_problem_master.xlsx`です（他単元のmasterと同じフォルダ）。
- ThinkingFlow見出しにTeX記法（`$x^2$`等）を生表示させない規約（QF/TR/DA共通）はM1-EC-004〜044にも踏襲しています。M1-EC-008・009・012（展開）、M1-EC-017・018・019（因数分解）、M1-EC-026・028・030・031・034（実数・平方根、`\sqrt{...}`混入）で混入が見つかりましたが、いずれもUnicode表記（例：`x²`・`(a-b)³`・`√18`）へ修正済みです。新しい問題を追加する際は、ThinkingFlow見出し内に生の`^`・`\sqrt`を残さないよう特に注意してください。
- **M1-EC-014〜023（因数分解10問）・M1-EC-024〜036（実数・平方根13問）の正本には、独立検算とは無関係にThinkingFlow見出し階層の技術的な不整合が複数見つかり、2026-09に修正済みです**（文言・数式・ThinkingFlowの結論・順序はいずれも無変更のため再独立検算対象外。コミット`ee196d3`）。
  - M1-EC-021：ThinkingFlow見出しが`####`になっていました（他の単独Flow問題はすべて`###`）。放置するとThinkingFlowの各Flowが個別Flowとして認識されず空表示になる不具合だったため`###`へ修正。
  - M1-EC-036：小問(2)内2番目のFlow見出しが`###`のままで、`####`であるべきところが1レベル浅くなっていました（他のFlowとの深さ不整合）。放置すると`markdownSections.ts`のパーサーが(2)の子ではなく孤立した見出しとして分割してしまう不具合だったため`####`へ修正。
  - M1-EC-016・017・018・019・020・022・023・025・026・027：見出し内の強調マーク☆と番号の順序が「☆ N. 見出し」のように逆転していました（正しい順序は「N. ☆ 見出し」。`prepareQuadratic27Entry.ts`の`MARKER_PATTERN`・`verifyStepNumberMatchesIndex`が要求する順序で、崩れるとbuildエラーになります）。順序を修正。
  - M1-EC-032：本文の数式中（`$...$`内）に生のUnicode丸数字（①②）が直接書かれ、KaTeXの`unknownSymbol`build警告の原因になっていました。既存規約（M1-DA-008等で使用）の`\text{\textcircled{1}}`表記へ修正。
  - 13問すべてで正本`problem.md`の`verification_status`が`未検算`のまま更新漏れになっており、master xlsx「公開問題管理」シートの全問PASS判定と不一致でした。`独立検算済み`へ更新（この不一致を放置すると`getVerifiedCollection`のフィルタで全問非公開のままビルドされます）。
- M1-EC-016（「事前知識・使用公式」・ThinkingFlow 1）とM1-EC-021（ThinkingFlow 3）に「たすき掛け」の交差図assetを追加しています。M1-EC-025（「事前知識・使用公式」）には実数の分類（自然数⊂整数⊂有理数⊂実数、無理数）を示すネスト矩形図assetを追加しました。M1-EC-038・039・041・043・044（一次不等式）には、ThinkingFlow内（`placement: flow`）に解の範囲・共通範囲・場合分けを示す数直線asset（`type: number`）を配置しています。他の問題は`assets: []`のままです。詳細は次節「事前知識・使用公式」の追記、および下記asset規約を参照してください。
- 「SEOの現行契約」節のsitemap内訳は、2026-09-23に170 URL（`/math1/suto-shiki/`単元トップ1＋個別問題44を追加）へ更新済みです。数と式の単元トップ・個別問題URLは他単元と同格の公開contract（index対象・sitemap掲載・canonicalは各URL自身）で、ローカルbuildで45URLすべて確認済みです。

---

## 「事前知識・使用公式」（任意セクション、2026-09追加）

正本problem.mdスキーマに新しく追加された任意セクションです。M1-EC-001〜003で初めて使用され、M1-EC-004〜044でも踏襲しています。2026-09-24に、QF/TR/DAの118問（M1-QF-001〜054・M1-TR-001〜041・M1-DA-001〜023）にも追加し、**公開162問すべてにこのセクションがあります**。

- QF/TR/DAへの追加は、単元ごとに「正本から問題文・ThinkingFlow題名を作業用ファイルへ抽出→GPTと人間による本文作成→Codexの監査・再監査→監査済み確定本文を正本へそのまま挿入→`npm run sync-content`」の手順で行いました（コミット：DA`714e8b1`・TR`9c6237c`・QF`9980ee4`）。作業用ファイル（`review/M1-*_prior_knowledge_*.md`、git管理外）は、確定本文118問分が正本の「事前知識・使用公式」と完全一致することを確認のうえ、2026-09-24に削除しました。監査済み本文は言い換えずに挿入し、問題文・問題メタ・解法メタ・ThinkingFlow・最終解答・frontmatter・assetは無変更です。数学的固定内容を変えていないため、再独立検算の対象外です。
- 正本内の配置は「`## 問題`（→`## 問題の言い換え`がある場合はその後）→`## 事前知識・使用公式`→`## 問題メタ`」です。「問題の言い換え」があるのはM1-QF-047・048・049・053・054です。
- QF/TR/DAの事前知識は箇条書きのテキスト・数式だけで、`placement: prior_knowledge`のassetはありません（このassetを使っているのは下記のM1-EC-016・025だけです）。
- 正本の改行コードは単元・問題ごとに異なります（M1-TR-005・006・009〜021の15ファイルはCRLF、他はLF）。スクリプトで一括編集する場合は、ファイルごとの改行コードを維持してください。

- 見出しは`## 事前知識・使用公式`。パーサー（`markdownSections.ts`）自体は無変更で、既存の`##`見出し分割の汎用ロジックが処理します。各`prepare*Entry.ts`（QF/TR/DA/EC全4コレクション）に`findSection(sections, '事前知識・使用公式')`を追加し、値の有無だけで表示可否を判定します。
- 表示位置：問題 → **事前知識・使用公式** → 元講師の独り言 → ThinkingFlow → 最終解答。
- 初期状態は閉じています（progressive disclosure）。存在する問題だけ見出し・ボタンを表示し、存在しない問題には何も出しません。
- 開閉ロジック・アニメーションは最終解答の開閉（`data-answer-toggle`/`.result-box`、`grid-template-rows` 0fr/1fr手法）をそのまま複製しています。ボタン文言が異なるため別data属性（`data-prior-knowledge-toggle`/`data-prior-knowledge-box`）を使いますが、ロジック自体は複製元と同一です。新しい開閉アニメーション実装は増やしていません。
- CSS（`global.css`の`.prior-knowledge-section`）も最終解答の外枠処理（`.final-answer-section`と同じ上罫線＋transparent、白カード外枠・shadow・pill・左色バーなし）を複製しています。新しいカードUIは作っていません。
- 数式内に日本語テキストを直接書く場合（例：`(x\text{の指数})`）は、既存規約通り`\text{}`で囲んでください。囲まずに書くとKaTeX build時に`unicodeTextInMathMode`警告が出ます（KaTeXが自動でCJKフォールバック表示するため見た目自体は同じですが、警告は避けられます）。
- 「事前知識・使用公式」は**AI-context JSON（`src/pages/ai-context/[id].json.ts`）へ含めません**（現行仕様）。固定教材側の参照欄であり、AI質問用contextとは別レイヤーとして扱います。`src/utils/aiContext.ts`は「問題」「問題の言い換え」「ThinkingFlow」「最終解答」のセクションだけを取り出すため、公開162問すべてで事前知識の本文・`placement: prior_knowledge`のassetはAI-contextに入りません（問題メタ・解法メタも同様）。
- asset配置：当初「事前知識・使用公式」内へのasset配置は未対応でしたが、2026-09にM1-EC-016向けに対応しました。`content.config.ts`の`problemAssetSchema`へ`placement: 'prior_knowledge'`を追加し（既存の`problem`/`flow`/`final_answer`に1値追加、他3値は無変更）、`prepareExpressionCalculationEntry.ts`に`priorKnowledgeAssets`を返す分岐を追加、`Quadratic27Detail.astro`の展開領域内（`.result-box-inner`、`problemAssets`と同じfigure/table描画パターン）へ表示します。QF/TR/DAの`prepare*Entry.ts`はこのフィールドを返さないため、コンポーネント側は`prepared.priorKnowledgeAssets ?? []`で未定義を吸収しています。QF/TR/DAの118問は事前知識のテキストは持ちますが、事前知識内のassetは表示されません。QF/TR/DAの事前知識にassetを置く場合は、先に該当する`prepare*Entry.ts`へ同じ分岐を追加してください。

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

**AI-context JSON（`/ai-context/<problem_id>.json`、`src/pages/ai-context/[id].json.ts`）は公開162問（QF54・TR41・DA23・EC44）すべてが対象です**（2026-09-24にDA/ECへ拡張）。build時に4コレクションの独立検算済み問題から自動生成し、手動の許可リストは持ちません。AI用のFlow識別は`problem_id`＋`context_key`（1問題内の表示順`f1`,`f2`,...）で、既存の`part`/`flow`/`flow_key`も維持しています。含めるのは問題文・問題の言い換え（存在する場合）・ThinkingFlow全体・最終解答・asset metadataだけで、**「事前知識・使用公式」・問題メタ・解法メタは含めません**。HTMLコメント（`<!-- ... -->`、制作用メモ）も生成時に除去します（正本は無変更）。Worker側`worker/src/validate.ts`の`PROBLEM_ID_PATTERN`は`/^M1-(QF|TR|DA|EC)-\d{3}$/`で、本番Workerへdeploy済みです。新しい単元を追加する場合は、`[id].json.ts`・`aiContext.ts`の`AiContextCollection`へコレクションを追加し、Workerの正規表現も拡張・再deployしてください。

公開95問（QF・TR）のうちFTEXT（CC BY 4.0の外部フリー教材）とEXACT水準で対応する47問には、問題文直下に「追加で練習する」外部リンクを実装し、本番公開済みです（`src/data/external-practice-links.json`、`Quadratic27Detail.astro`）。CLOSE／BROAD／NONE判定の問題にはリンクを追加していません。データの分析（M1-DA-001〜023）も、EXACT判定の12問に外部サイト「教科書より詳しい高校数学」（yorikuwa.com）への同じ「追加で練習する」リンクを追加し、本番公開済みです（コミット`c0b7d45`、同じ`external-practice-links.json`に追記。表示ロジックは共通）。同ファイルの登録は計59問（QF26・TR21・DA12）です。数と式（M1-EC-001〜044）はリンク未登録です。詳細は同文書第37節を正本としてください。

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
- `/math1/quadratic/`：数学I「二次関数」上位区分の単元トップ、`/math1/quadratic/M1-QF-001/` 〜 `/M1-QF-054/`
- `/math1/trig/`：数学I「三角比」上位区分の単元トップ、`/math1/trig/M1-TR-001/` 〜 `/M1-TR-041/`
- `/math1/data-analysis/`：数学I「データの分析」上位区分の単元トップ、`/math1/data-analysis/M1-DA-001/` 〜 `/M1-DA-023/`
- `/math1/suto-shiki/`：数学I「数と式」上位区分の単元トップ、`/math1/suto-shiki/M1-EC-001/` 〜 `/M1-EC-044/`（2026-09-23本番公開。詳細は「数と式の現在地」節を参照）

個別問題URLをブログ型・縦長型の別UIへ戻さないでください。
**1問題＝1固有URL、表示UI＝共通DBシェル**が現行仕様です。

各個別URLはJavaScriptだけで問題を後付け表示するのではなく、Astroの静的生成によって、その問題固有の本文をHTML内に持たせます。

中央問題一覧は、検索エンジンが辿れる通常の `<a href>` で各問題URLへリンクします。
SPA化や複雑なクライアント状態管理を、明示的な要求なしに導入しないでください。

### 中央問題一覧の分類・共有コンポーネント

中央問題一覧は単元ごとにアコーディオン＋行リストで表示します（二次関数＝二次関数／二次方程式／二次不等式の3区分、三角比＝4区分、データの分析＝5区分、数と式＝4区分）。

- 区分への分類は問題IDのレンジではなく、正本frontmatterの `section` 値をキーにした対応表（`quadraticDbItems.ts` / `trigDbItems.ts` / `dataAnalysisDbItems.ts` / `expressionCalculationDbItems.ts` の `SECTION_TO_GROUP`）で単元ごとに行います。分類ロジック自体は `src/utils/dbCenterList.ts`（`groupCenterItems`）に一本化しています。
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

### 各単元トップ・個別問題URL（QF/TR/DA/EC共通）

- `/math1/quadratic/`・`/math1/trig/`・`/math1/data-analysis/`・`/math1/suto-shiki/`と各個別問題URL
- index対象
- noindexを付けない
- 個別問題は固有title / description
- canonicalは各URL自身
- `/app/` へcanonical統合しない

### sitemap / robots

`sitemap.xml` は検索対象ページを掲載します（`src/pages/sitemap.xml.ts`）。
現行162問（QF54・TR41・DA23・EC44）時点の内訳は、

- `/`
- `/math1/quadratic/` ＋ 個別問題54URL
- `/math1/trig/` ＋ 個別問題41URL
- `/math1/data-analysis/` ＋ 個別問題23URL
- `/math1/suto-shiki/` ＋ 個別問題44URL
- `/privacy/`
- `/disclaimer/`
- `/contact/`

の計170 URLです（2026-09-23のローカルbuildで`dist/sitemap.xml`の件数・内訳を確認済み）。

`/app/` はsitemapへ含めません（旧6サンプルrouteは2026-09-24に削除済み）。

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

M1-QF-001〜054・M1-TR-001〜041・M1-DA-001〜023・M1-EC-001〜044はCodex構造監査済みです（QF/TRはFIX相当の構造的不整合なし、ECはPASS WITH REVIEW・BLOCKERなし）。
**M1-DA-001〜023はOpus asset横断レビューのみ未実施のまま本番公開しています。** DAへ追加修正を行う際は、この監査が別途必要になる可能性を踏まえてください。

既存問題を変更した場合は、変更内容に応じて再監査・再独立検算が必要かを判断してください。
純粋なUI・余白・asset描画調整等は、数学的固定内容を変えない限り原則として再独立検算対象ではありません。

---

## Documentation

詳細仕様は、READMEより以下の正本文書を優先してください。

- `math_service_design_summary.md`
- `problem_authoring_workflow.md`
- `_TEMPLATE_for_page_generation.md`
- `problem_master/`配下の各xlsx（`quadratic_function_problem_master.xlsx` / `trigonometric_ratio_problem_master.xlsx` / `data_analysis_problem_master.xlsx`）

README / AGENTS.mdには概要と作業境界を置き、正本文書と同じ細則を過剰に重複させないでください。
