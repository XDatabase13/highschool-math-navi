import { dbSubjectNav } from '../data/subjects';
import { NAVIGATOR_SUBJECTS } from '../data/navigator-config';
import { getVerifiedCollection } from './verifiedCollection';
import { buildNavData, createNavIndex, type NavData, type NavIndex, type NavProblemInput } from './navigatorCore';

// 4×4ナビゲーションの候補データをbuild時に組み立てる（/navigator/・/app/navigation/ への埋め込みと、
// 問題DBの抽出モードが取得する /app/navigation/data.json の両方がこれを使う）。
// 情報源は独立検算済みの公開対象問題（getVerifiedCollection）のfrontmatterだけで、
// 重要度・難易度・section・display_orderを別の一覧へ書き写さない。
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

function toInputs(collection: string, entries: FrontmatterEntry[]): NavProblemInput[] {
  return entries.map((entry) => ({ collection, id: entry.id, ...entry.data }));
}

const SOURCES: (() => Promise<NavProblemInput[]>)[] = [
  async () => toInputs('expressionCalculation', await getVerifiedCollection('expressionCalculation')),
  async () => toInputs('setLogic', await getVerifiedCollection('setLogic')),
  async () => toInputs('quadratic27', await getVerifiedCollection('quadratic27')),
  async () => toInputs('trig4', await getVerifiedCollection('trig4')),
  async () => toInputs('dataAnalysis', await getVerifiedCollection('dataAnalysis')),
];

export type NavigatorPageData = {
  // ページへJSONで埋め込み（またはJSONとして配信し）、client scriptが createNavIndex() で索引化する。
  data: NavData;
  index: NavIndex;
};

export async function loadNavigatorData(): Promise<NavigatorPageData> {
  const inputs = (await Promise.all(SOURCES.map((source) => source()))).flat();
  // 並び順（科目順 → dbSubjectNavの単元順 → display_order）は buildNavData が決める。
  const data = buildNavData(NAVIGATOR_SUBJECTS, dbSubjectNav, inputs);
  return { data, index: createNavIndex(data) };
}
