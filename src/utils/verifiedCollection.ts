import { getCollection, type CollectionEntry } from 'astro:content';

// 公開対象は「独立検算済み」の問題だけに限定する（QF/TR共通基準）。
// getCollection() をそのまま呼ぶと未検算問題でも条件次第でページ・一覧・sitemapに
// 入りうるため、quadratic27・trig4を読むすべての箇所はこのヘルパー経由に統一する。
const VERIFICATION_STATUS_PUBLISHED = '独立検算済み';

export async function getVerifiedCollection<C extends 'quadratic27' | 'trig4'>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  return getCollection(collection, ({ data }) => data.verification_status === VERIFICATION_STATUS_PUBLISHED);
}
