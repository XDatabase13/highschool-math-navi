import type { CollectionEntry } from 'astro:content';
import type { DbCenterItem } from '../components/ProblemDbShell.astro';

// M1-QF-001〜054（quadratic27）を、ProblemDbShellの中央ペイン用データ形式へ変換する。
// /app/・/math1/quadratic/・/math1/quadratic/[slug]/ の3箇所で同じ一覧を使うため、
// ここに一本化する（54問分のtitle/chips組み立てをページごとに重複させない）。
export function buildQuadraticCenterItems(
  entries: CollectionEntry<'quadratic27'>[],
): DbCenterItem[] {
  return entries.map((entry) => ({
    id: entry.id,
    href: `/math1/quadratic/${entry.id}/`,
    title: entry.data.title,
    chips: [`重要度：${entry.data.importance_label}`, `難易度：${entry.data.difficulty}`],
  }));
}
