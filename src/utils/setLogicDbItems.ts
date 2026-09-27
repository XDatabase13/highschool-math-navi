import type { CollectionEntry } from 'astro:content';
import type { DbCenterItem } from './dbCenterList';

// setLogic（M1-SL-001〜018、数学I「集合と論証」）の正本frontmatterに実在する
// section値を中央ペインの区分見出しへ対応させる表。expressionCalculationDbItems.ts等と同じ方式
// （section値をキーにした対応表・未知のsectionはエラーで止める）を踏襲する。
// masterの「問題区分」（管理用の細分類）ではなく、Web表示用のsection値だけを使う。
const SECTION_TO_GROUP: Record<string, { groupId: string; groupLabel: string }> = {
  集合: { groupId: 'sl-sets', groupLabel: '集合' },
  '命題・論証': { groupId: 'sl-propositions', groupLabel: '命題・論証' },
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

export function buildSetLogicCenterItems(entries: CollectionEntry<'setLogic'>[]): DbCenterItem[] {
  return entries.map((entry) => {
    const group = resolveGroup(entry.data.section);
    return {
      id: entry.id,
      href: `/math1/set-logic/${entry.id}/`,
      title: entry.data.title,
      chips: [entry.data.importance_label, String(entry.data.difficulty)],
      groupId: group.groupId,
      groupLabel: group.groupLabel,
    };
  });
}
