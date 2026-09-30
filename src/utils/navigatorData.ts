import { dbSubjectNav } from '../data/subjects';
import { NAVIGATOR_SUBJECTS } from '../data/navigator-config';
import { getVerifiedCollection } from './verifiedCollection';
import { buildNavData, createNavIndex, type NavData, type NavIndex, type NavProblemInput } from './navigatorCore';
import type { DbCenterGroup, DbCenterItem } from './dbCenterList';
import { buildExpressionCalculationCenterItems } from './expressionCalculationDbItems';
import { buildSetLogicCenterItems } from './setLogicDbItems';
import { buildQuadraticCenterItems } from './quadraticDbItems';
import { buildTrigCenterItems } from './trigDbItems';
import { buildDataAnalysisCenterItems } from './dataAnalysisDbItems';

// 4×4ナビゲーション（/navigator/・/app/navigation/）の候補データをbuild時に組み立てる。
// 情報源は独立検算済みの公開対象問題（getVerifiedCollection）のfrontmatterだけで、
// 重要度・難易度・section・display_orderを別の一覧へ書き写さない。
// 個別問題URL・タイトル・チップは、既存DBの中央一覧と同じ build*CenterItems を再利用する。
//
// 新しいcollection（数学A等）を足すときは、navigator-config.ts とこの SOURCES の両方へ追加する
// （片方だけだと buildNavData がbuildエラーにする）。

type FrontmatterEntry = {
  id: string;
  data: {
    subject: string;
    unit: string;
    section: string;
    display_order: number;
    importance: number;
    importance_label: string;
    difficulty: number;
  };
};

const byDisplayOrder = (a: FrontmatterEntry, b: FrontmatterEntry) => a.data.display_order - b.data.display_order;

function toInputs(collection: string, entries: FrontmatterEntry[]): NavProblemInput[] {
  return entries.map((entry) => ({ collection, id: entry.id, ...entry.data }));
}

type Source = () => Promise<{ inputs: NavProblemInput[]; items: DbCenterItem[] }>;

const SOURCES: Source[] = [
  async () => {
    const entries = (await getVerifiedCollection('expressionCalculation')).sort(byDisplayOrder);
    return { inputs: toInputs('expressionCalculation', entries), items: buildExpressionCalculationCenterItems(entries) };
  },
  async () => {
    const entries = (await getVerifiedCollection('setLogic')).sort(byDisplayOrder);
    return { inputs: toInputs('setLogic', entries), items: buildSetLogicCenterItems(entries) };
  },
  async () => {
    const entries = (await getVerifiedCollection('quadratic27')).sort(byDisplayOrder);
    return { inputs: toInputs('quadratic27', entries), items: buildQuadraticCenterItems(entries) };
  },
  async () => {
    const entries = (await getVerifiedCollection('trig4')).sort(byDisplayOrder);
    return { inputs: toInputs('trig4', entries), items: buildTrigCenterItems(entries) };
  },
  async () => {
    const entries = (await getVerifiedCollection('dataAnalysis')).sort(byDisplayOrder);
    return { inputs: toInputs('dataAnalysis', entries), items: buildDataAnalysisCenterItems(entries) };
  },
];

export type NavigatorPageData = {
  // ページへJSONで埋め込み、client scriptが createNavIndex() で索引化する。
  data: NavData;
  index: NavIndex;
  // 抽出結果画面の静的な全問題一覧（単元ごと、結果の並び順）。ProblemGroupListへそのまま渡す。
  resultGroups: DbCenterGroup[];
};

export async function loadNavigatorData(): Promise<NavigatorPageData> {
  const loaded = await Promise.all(SOURCES.map((source) => source()));
  const data = buildNavData(
    NAVIGATOR_SUBJECTS,
    dbSubjectNav,
    loaded.flatMap((source) => source.inputs),
  );
  const index = createNavIndex(data);

  const itemById = new Map(loaded.flatMap((source) => source.items).map((item) => [item.id, item]));
  const showSubject = index.subjects.length > 1;
  const resultGroups: DbCenterGroup[] = [];
  for (const problem of index.problems) {
    const item = itemById.get(problem.id);
    const info = index.unitInfo.get(problem.unitId);
    if (!item || !info) throw new Error(`4×4ナビ: 問題 ${problem.id} の一覧データがありません。`);
    const groupId = `nav-${info.unit.id}`;
    const groupLabel = showSubject ? `${info.subject.name} ${info.unit.name}` : info.unit.name;
    const current = resultGroups[resultGroups.length - 1];
    const resultItem = { ...item, groupId, groupLabel };
    if (current && current.groupId === groupId) current.items.push(resultItem);
    else resultGroups.push({ groupId, groupLabel, items: [resultItem] });
  }

  return { data, index, resultGroups };
}
