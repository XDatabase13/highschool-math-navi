import type { CollectionEntry } from 'astro:content';
import type { DbCenterItem } from './dbCenterList';

// dataAnalysis（M1-DA-001〜023、数学I「データの分析」）の正本frontmatterに実在する
// section値を中央ペインの区分見出しへ対応させる表。trigDbItems.ts・quadraticDbItems.tsと
// 同じ方式（section値をキーにした対応表・未知のsectionはエラーで止める）を踏襲する。
const SECTION_TO_GROUP: Record<string, { groupId: string; groupLabel: string }> = {
  代表値と度数分布: { groupId: 'da-summary-stats', groupLabel: '代表値と度数分布' },
  四分位数と箱ひげ図: { groupId: 'da-quartiles', groupLabel: '四分位数と箱ひげ図' },
  分散と標準偏差: { groupId: 'da-variance', groupLabel: '分散と標準偏差' },
  散布図と相関: { groupId: 'da-correlation', groupLabel: '散布図と相関' },
  仮説検定: { groupId: 'da-hypothesis-testing', groupLabel: '仮説検定' },
};

function resolveGroup(section: string): { groupId: string; groupLabel: string } {
  const group = SECTION_TO_GROUP[section];
  if (!group) {
    throw new Error(
      `section「${section}」に対応する中央ペインの区分がSECTION_TO_GROUPに定義されていません。`,
    );
  }
  return group;
}

export function buildDataAnalysisCenterItems(entries: CollectionEntry<'dataAnalysis'>[]): DbCenterItem[] {
  return entries.map((entry) => {
    const group = resolveGroup(entry.data.section);
    return {
      id: entry.id,
      href: `/math1/data-analysis/${entry.id}/`,
      title: entry.data.title,
      chips: [entry.data.importance_label, String(entry.data.difficulty)],
      groupId: group.groupId,
      groupLabel: group.groupLabel,
    };
  });
}
