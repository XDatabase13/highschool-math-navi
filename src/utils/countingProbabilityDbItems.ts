import type { CollectionEntry } from 'astro:content';
import type { DbCenterItem } from './dbCenterList';

// countingProbability（MA-CP-001〜034、数学A「場合の数・確率」）の正本frontmatterに実在する
// section値を中央ペインの区分見出しへ対応させる表。setLogicDbItems.ts等と同じ方式
// （section値をキーにした対応表・未知のsectionはエラーで止める）を踏襲する。
// 区分は問題IDのレンジではなくsection値で決める（例：MA-CP-030〜032は「順列」、033・034は「組合せ」）。
const SECTION_TO_GROUP: Record<string, { groupId: string; groupLabel: string }> = {
  集合の要素の個数: { groupId: 'cp-set-count', groupLabel: '集合の要素の個数' },
  場合の数: { groupId: 'cp-counting', groupLabel: '場合の数' },
  順列: { groupId: 'cp-permutations', groupLabel: '順列' },
  組合せ: { groupId: 'cp-combinations', groupLabel: '組合せ' },
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

// groupCenterItems（dbCenterList.ts）は連続する同じ区分だけを1つにまとめるため、display_order順の
// ままだと「順列」「組合せ」が2回ずつに分かれてしまう。この単元だけ、SECTION_TO_GROUPの区分順 →
// display_order順に並べてから渡す（各区分の中の順序はdisplay_orderのまま）。
const GROUP_ORDER = Object.keys(SECTION_TO_GROUP);

export function buildCountingProbabilityCenterItems(
  entries: CollectionEntry<'countingProbability'>[],
): DbCenterItem[] {
  const ordered = [...entries].sort(
    (a, b) =>
      GROUP_ORDER.indexOf(a.data.section) - GROUP_ORDER.indexOf(b.data.section) ||
      a.data.display_order - b.data.display_order,
  );
  return ordered.map((entry) => {
    const group = resolveGroup(entry.data.section);
    return {
      id: entry.id,
      href: `/math-a/counting-probability/${entry.id}/`,
      title: entry.data.title,
      chips: [entry.data.importance_label, String(entry.data.difficulty)],
      groupId: group.groupId,
      groupLabel: group.groupLabel,
    };
  });
}
