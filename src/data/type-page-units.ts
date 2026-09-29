// 型ページ（問題タイプ）の単元設定。master xlsx・問題ID prefix・Web collection・URLの
// 対応をここ1か所に集約し、同期script（scripts/sync-type-pages.mjs）・route生成・
// 問題preview・sitemapのすべてがこの表だけを参照する（別々の対応表を増やさない）。
//
// scripts/sync-type-pages.mjs（Node）からも直接importするため、Nodeの型除去だけで
// 読める構文（型注釈・as const）に限定する。enum・namespace・外部importは使わない。

export type TypePageUnitId = 'quadratic' | 'trig' | 'data-analysis' | 'suto-shiki' | 'set-logic';
export type TypePageProblemPrefix = 'QF' | 'TR' | 'DA' | 'EC' | 'SL';
export type TypePageProblemCollection =
  | 'quadratic27'
  | 'trig4'
  | 'dataAnalysis'
  | 'expressionCalculation'
  | 'setLogic';

export type TypePageUnitConfig = {
  unitId: TypePageUnitId;
  unitName: string;
  subjectName: '数学I';
  problemPrefix: TypePageProblemPrefix;
  collection: TypePageProblemCollection;
  // 単元URLのディレクトリ名（/math1/{routeBase}/）。
  routeBase: string;
  // math_db_quadratic_working/problem_master/ 配下のファイル名。
  masterFile: string;
  // repo直下からの公開用assetスナップショットのパス。
  assetsRoot: string;
};

export const TYPE_PAGE_UNITS: readonly TypePageUnitConfig[] = [
  {
    unitId: 'suto-shiki',
    unitName: '数と式',
    subjectName: '数学I',
    problemPrefix: 'EC',
    collection: 'expressionCalculation',
    routeBase: 'suto-shiki',
    masterFile: 'expression_calculation_problem_master.xlsx',
    assetsRoot: 'src/content/expressionCalculation-assets',
  },
  {
    unitId: 'set-logic',
    unitName: '集合と論証',
    subjectName: '数学I',
    problemPrefix: 'SL',
    collection: 'setLogic',
    routeBase: 'set-logic',
    masterFile: 'set_logic_problem_master.xlsx',
    assetsRoot: 'src/content/setLogic-assets',
  },
  {
    unitId: 'quadratic',
    unitName: '二次関数',
    subjectName: '数学I',
    problemPrefix: 'QF',
    collection: 'quadratic27',
    routeBase: 'quadratic',
    masterFile: 'quadratic_function_problem_master.xlsx',
    assetsRoot: 'src/content/quadratic27-assets',
  },
  {
    unitId: 'trig',
    unitName: '三角比',
    subjectName: '数学I',
    problemPrefix: 'TR',
    collection: 'trig4',
    routeBase: 'trig',
    masterFile: 'trigonometric_ratio_problem_master.xlsx',
    assetsRoot: 'src/content/trig4-assets',
  },
  {
    unitId: 'data-analysis',
    unitName: 'データの分析',
    subjectName: '数学I',
    problemPrefix: 'DA',
    collection: 'dataAnalysis',
    routeBase: 'data-analysis',
    masterFile: 'data_analysis_problem_master.xlsx',
    assetsRoot: 'src/content/dataAnalysis-assets',
  },
];

// 初版の一括公開監査用の固定件数（仕様v1.1 §4.4）。publishedが38件ちょうどでない
// 構造データは同期・buildの双方でエラーにする。productionで型ページを公開できるのは、
// 38件すべての型Markdownがそろい、かつ公開承認（type-page-publication.ts）があるときだけ。
// 将来型を追加する段階では、別の仕様変更として「master集計との一致」へ置き換える。
export const EXPECTED_PUBLISHED_TYPE_PAGE_COUNT = 38;

export const TYPE_PAGE_SNAPSHOT_SCHEMA_VERSION = 1;

// 型slugの形式（小文字英数字と単一ハイフン）。
export const TYPE_PAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function typePageUnitById(unitId: string): TypePageUnitConfig {
  const unit = TYPE_PAGE_UNITS.find((u) => u.unitId === unitId);
  if (!unit) throw new Error(`型ページの単元設定に存在しないunitIdです: ${unitId}`);
  return unit;
}

export function typePageUrl(unit: TypePageUnitConfig, slug: string): string {
  return `/math1/${unit.routeBase}/${slug}/`;
}

export function problemUrl(unit: TypePageUnitConfig, problemId: string): string {
  return `/math1/${unit.routeBase}/${problemId}/`;
}
