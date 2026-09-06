import type { CollectionEntry } from 'astro:content';
import type { DbCenterItem } from '../components/ProblemDbShell.astro';

// quadratic27の正本frontmatterには「関数とグラフ／グラフ／最大・最小／決定／
// 二次方程式／グラフと二次方程式／二次不等式」という7種類の`section`はあるが、
// 中央ペインの区分見出しに使う「二次関数／二次方程式／二次不等式」という3区分
// そのものを表す単一フィールドは正本に存在しない。
// そのため、この対応表はWeb表示専用の分類ルールとしてここに保持する
// （正本Markdownの`section`値をキーにしており、問題IDのレンジ判定ではない）。
const SECTION_TO_GROUP: Record<string, { groupId: string; groupLabel: string }> = {
  関数とグラフ: { groupId: 'quadratic-function', groupLabel: '二次関数' },
  グラフ: { groupId: 'quadratic-function', groupLabel: '二次関数' },
  '最大・最小': { groupId: 'quadratic-function', groupLabel: '二次関数' },
  決定: { groupId: 'quadratic-function', groupLabel: '二次関数' },
  二次方程式: { groupId: 'quadratic-equation', groupLabel: '二次方程式' },
  グラフと二次方程式: { groupId: 'quadratic-equation', groupLabel: '二次方程式' },
  二次不等式: { groupId: 'quadratic-inequality', groupLabel: '二次不等式' },
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

// M1-QF-001〜054（quadratic27）を、ProblemDbShellの中央ペイン用データ形式へ変換する。
// /app/・/math1/quadratic/・/math1/quadratic/[slug]/ の3箇所で同じ一覧を使うため、
// ここに一本化する（54問分のtitle/chips組み立てをページごとに重複させない）。
export function buildQuadraticCenterItems(
  entries: CollectionEntry<'quadratic27'>[],
): DbCenterItem[] {
  return entries.map((entry) => {
    const group = resolveGroup(entry.data.section);
    return {
      id: entry.id,
      href: `/math1/quadratic/${entry.id}/`,
      title: entry.data.title,
      // 行リスト表示ではラベル文字列（「重要度：」等）を出さず、値だけを小さなチップにする。
      // 重要度・難易度の内部値・意味は変更しない。
      chips: [entry.data.importance_label, String(entry.data.difficulty)],
      groupId: group.groupId,
      groupLabel: group.groupLabel,
    };
  });
}
