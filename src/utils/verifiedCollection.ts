import { getCollection, type CollectionEntry } from 'astro:content';

// 公開対象は「独立検算済み」の問題だけに限定する（QF/TR/DA/EC共通基準）。
// getCollection() をそのまま呼ぶと未検算問題でも条件次第でページ・一覧・sitemapに
// 入りうるため、quadratic27・trig4・dataAnalysis・expressionCalculationを読むすべての箇所は
// このヘルパー経由に統一する。verification_statusの許可値はcontent.config.tsで列挙型として制限している。
const VERIFICATION_STATUS_PUBLISHED = '独立検算済み';

export async function getVerifiedCollection<
  C extends 'quadratic27' | 'trig4' | 'dataAnalysis' | 'expressionCalculation',
>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  return getCollection(collection, ({ data }) => data.verification_status === VERIFICATION_STATUS_PUBLISHED);
}
