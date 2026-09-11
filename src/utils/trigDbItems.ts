import type { CollectionEntry } from 'astro:content';
import type { DbCenterItem } from './dbCenterList';

// trig4（M1-TR-001〜021、三角比試験バッチ）の正本frontmatterに実在するsection値を
// 中央ペインの区分見出しへ対応させる表。quadraticDbItems.tsのSECTION_TO_GROUPと
// 同じ方式（section値をキーにした対応表・未知のsectionはエラーで止める）を踏襲する。
const SECTION_TO_GROUP: Record<string, { groupId: string; groupLabel: string }> = {
  '三角比の基本（0〜90°）': { groupId: 'trig-basic', groupLabel: '三角比の基本（0〜90°）' },
  '三角比の拡張（0〜180°）': { groupId: 'trig-extended', groupLabel: '三角比の拡張（0〜180°）' },
  平面図形と三角比: { groupId: 'trig-plane-figure', groupLabel: '平面図形と三角比' },
  空間図形と三角比: { groupId: 'trig-solid-figure', groupLabel: '空間図形と三角比' },
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

export function buildTrigCenterItems(entries: CollectionEntry<'trig4'>[]): DbCenterItem[] {
  return entries.map((entry) => {
    const group = resolveGroup(entry.data.section);
    return {
      id: entry.id,
      href: `/math1/trig/${entry.id}/`,
      title: entry.data.title,
      chips: [entry.data.importance_label, String(entry.data.difficulty)],
      groupId: group.groupId,
      groupLabel: group.groupLabel,
    };
  });
}
