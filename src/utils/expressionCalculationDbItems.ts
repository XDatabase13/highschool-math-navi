import type { CollectionEntry } from 'astro:content';
import type { DbCenterItem } from './dbCenterList';

// expressionCalculation（M1-EC-001〜044、数学I「数と式」）の正本frontmatterに実在する
// section値を中央ペインの区分見出しへ対応させる表。dataAnalysisDbItems.ts・trigDbItems.ts・
// quadraticDbItems.tsと同じ方式（section値をキーにした対応表・未知のsectionはエラーで止める）を
// 踏襲する。「数と式」単元内に区分が増えた場合もここへ追記するだけでよい。
const SECTION_TO_GROUP: Record<string, { groupId: string; groupLabel: string }> = {
  式の計算: { groupId: 'ec-expression-calculation', groupLabel: '式の計算' },
  因数分解: { groupId: 'ec-factorization', groupLabel: '因数分解' },
  実数・平方根: { groupId: 'ec-real-numbers', groupLabel: '実数・平方根' },
  一次不等式: { groupId: 'ec-linear-inequality', groupLabel: '一次不等式' },
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

export function buildExpressionCalculationCenterItems(
  entries: CollectionEntry<'expressionCalculation'>[],
): DbCenterItem[] {
  return entries.map((entry) => {
    const group = resolveGroup(entry.data.section);
    return {
      id: entry.id,
      href: `/math1/suto-shiki/${entry.id}/`,
      title: entry.data.title,
      chips: [entry.data.importance_label, String(entry.data.difficulty)],
      groupId: group.groupId,
      groupLabel: group.groupLabel,
    };
  });
}
