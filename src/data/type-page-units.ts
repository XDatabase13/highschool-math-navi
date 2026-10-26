// 型ページ（問題タイプ）の単元設定。master xlsx・問題ID prefix・Web collection・URLの
// 対応をここ1か所に集約し、同期script（scripts/sync-type-pages.mjs）・route生成・
// 問題preview・sitemapのすべてがこの表だけを参照する（別々の対応表を増やさない）。
//
// scripts/sync-type-pages.mjs（Node）からも直接importするため、Nodeの型除去だけで
// 読める構文（型注釈・as const）に限定する。enum・namespace・外部importは使わない。

export type TypePageUnitId = 'quadratic' | 'trig' | 'data-analysis' | 'suto-shiki' | 'set-logic' | 'counting-probability';
export type TypePageProblemPrefix = 'QF' | 'TR' | 'DA' | 'EC' | 'SL' | 'CP';
export type TypePageProblemCollection =
  | 'quadratic27'
  | 'trig4'
  | 'dataAnalysis'
  | 'expressionCalculation'
  | 'setLogic'
  | 'countingProbability';
export type TypePageSubjectName = '数学I' | '数学A';
// 公開グループ。グループごとに型数・本文の完全性・公開承認（type-page-publication.ts）を判定する。
export type TypePagePublicationGroupId = 'math1' | 'math-a-cp';

export type TypePageUnitConfig = {
  unitId: TypePageUnitId;
  unitName: string;
  subjectName: TypePageSubjectName;
  // 科目URLのディレクトリ名（/{subjectRouteBase}/{routeBase}/）。
  subjectRouteBase: 'math1' | 'math-a';
  // 型ページIDの接頭辞（QF-T01のQF）。問題IDの単元記号と同じ。
  problemPrefix: TypePageProblemPrefix;
  // 問題IDの接頭辞（M1-QF-001のM1-QF、MA-CP-001のMA-CP）。
  problemIdPrefix: string;
  collection: TypePageProblemCollection;
  publicationGroup: TypePagePublicationGroupId;
  // 単元URLのディレクトリ名（/{subjectRouteBase}/{routeBase}/）。
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
    subjectRouteBase: 'math1',
    problemPrefix: 'EC',
    problemIdPrefix: 'M1-EC',
    publicationGroup: 'math1',
    collection: 'expressionCalculation',
    routeBase: 'suto-shiki',
    masterFile: 'expression_calculation_problem_master.xlsx',
    assetsRoot: 'src/content/expressionCalculation-assets',
  },
  {
    unitId: 'set-logic',
    unitName: '集合と論証',
    subjectName: '数学I',
    subjectRouteBase: 'math1',
    problemPrefix: 'SL',
    problemIdPrefix: 'M1-SL',
    publicationGroup: 'math1',
    collection: 'setLogic',
    routeBase: 'set-logic',
    masterFile: 'set_logic_problem_master.xlsx',
    assetsRoot: 'src/content/setLogic-assets',
  },
  {
    unitId: 'quadratic',
    unitName: '二次関数',
    subjectName: '数学I',
    subjectRouteBase: 'math1',
    problemPrefix: 'QF',
    problemIdPrefix: 'M1-QF',
    publicationGroup: 'math1',
    collection: 'quadratic27',
    routeBase: 'quadratic',
    masterFile: 'quadratic_function_problem_master.xlsx',
    assetsRoot: 'src/content/quadratic27-assets',
  },
  {
    unitId: 'trig',
    unitName: '三角比',
    subjectName: '数学I',
    subjectRouteBase: 'math1',
    problemPrefix: 'TR',
    problemIdPrefix: 'M1-TR',
    publicationGroup: 'math1',
    collection: 'trig4',
    routeBase: 'trig',
    masterFile: 'trigonometric_ratio_problem_master.xlsx',
    assetsRoot: 'src/content/trig4-assets',
  },
  {
    unitId: 'data-analysis',
    unitName: 'データの分析',
    subjectName: '数学I',
    subjectRouteBase: 'math1',
    problemPrefix: 'DA',
    problemIdPrefix: 'M1-DA',
    publicationGroup: 'math1',
    collection: 'dataAnalysis',
    routeBase: 'data-analysis',
    masterFile: 'data_analysis_problem_master.xlsx',
    assetsRoot: 'src/content/dataAnalysis-assets',
  },
  {
    unitId: 'counting-probability',
    unitName: '場合の数・確率',
    subjectName: '数学A',
    subjectRouteBase: 'math-a',
    problemPrefix: 'CP',
    problemIdPrefix: 'MA-CP',
    publicationGroup: 'math-a-cp',
    collection: 'countingProbability',
    routeBase: 'counting-probability',
    masterFile: 'counting_probability_problem_master.xlsx',
    assetsRoot: 'src/content/countingProbability-assets',
  },
];

// 公開グループ（仕様 §20.3）。グループごとにpublished型の件数を固定し、件数が合わない構造データは
// 同期・buildの双方でエラーにする。productionでグループの型ページを公開できるのは、そのグループの
// published全件の型Markdownがそろい、かつそのグループの公開承認（type-page-publication.ts）が
// あるときだけで、グループ単位で一括公開する（グループ内の部分公開はしない）。
// 他グループの未承認・本文不足は、承認済みグループの公開に影響しない。
export type TypePagePublicationGroup = {
  id: TypePagePublicationGroupId;
  label: string;
  expectedPublishedCount: number;
};

export const TYPE_PAGE_PUBLICATION_GROUPS: readonly TypePagePublicationGroup[] = [
  // 数学I初版（2026-09-29本番公開）。
  { id: 'math1', label: '数学I 5単元', expectedPublishedCount: 38 },
  // 数学A「場合の数・確率」（2026-10-26追加。Web実画面レビュー・公開承認前）。
  { id: 'math-a-cp', label: '数学A 場合の数・確率', expectedPublishedCount: 18 },
];

export const TYPE_PAGE_SNAPSHOT_SCHEMA_VERSION = 1;

// 型slugの形式（小文字英数字と単一ハイフン）。
export const TYPE_PAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function typePageUnitById(unitId: string): TypePageUnitConfig {
  const unit = TYPE_PAGE_UNITS.find((u) => u.unitId === unitId);
  if (!unit) throw new Error(`型ページの単元設定に存在しないunitIdです: ${unitId}`);
  return unit;
}

export function typePagePublicationGroupById(groupId: string): TypePagePublicationGroup {
  const group = TYPE_PAGE_PUBLICATION_GROUPS.find((g) => g.id === groupId);
  if (!group) throw new Error(`型ページの公開グループ設定に存在しないIDです: ${groupId}`);
  return group;
}

// 単元トップのURL（/math1/quadratic/、/math-a/counting-probability/）。
export function unitUrl(unit: TypePageUnitConfig): string {
  return `/${unit.subjectRouteBase}/${unit.routeBase}/`;
}

export function typePageUrl(unit: TypePageUnitConfig, slug: string): string {
  return `${unitUrl(unit)}${slug}/`;
}

export function problemUrl(unit: TypePageUnitConfig, problemId: string): string {
  return `${unitUrl(unit)}${problemId}/`;
}
