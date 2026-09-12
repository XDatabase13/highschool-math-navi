import type { APIRoute } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getVerifiedCollection } from '../../utils/verifiedCollection';
import { buildAiContext, type AiContextCollection } from '../../utils/aiContext';

// ThinkingFlow単位のAI質問機能用のAI-context JSONを、独立検算済みの問題（quadratic27・
// trig4）ごとに静的生成する。sitemap.xml.tsと同じ「Content Collectionから毎回組み立てる」
// 方式のため、npm run sync-content で問題が増減しても手作業でファイルを追加・削除する
// 必要がない。公開URLは /ai-context/<problem_id>.json（例：/ai-context/M1-QF-001.json）。
//
// 生成物はAI APIへの通信・context整形の入力になる想定だが、この段階では
// 外部API接続・serverless proxy・認証・ログ保存は一切行わない。

interface Props {
  entry: CollectionEntry<AiContextCollection>;
  collection: AiContextCollection;
}

export async function getStaticPaths() {
  const quadratic27 = await getVerifiedCollection('quadratic27');
  const trig4 = await getVerifiedCollection('trig4');

  const targets: Props[] = [
    ...quadratic27.map((entry) => ({ entry, collection: 'quadratic27' as const })),
    ...trig4.map((entry) => ({ entry, collection: 'trig4' as const })),
  ];

  return targets.map(({ entry, collection }) => ({
    params: { id: entry.id },
    props: { entry, collection },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry, collection } = props as Props;
  const context = await buildAiContext(entry, collection);
  return new Response(JSON.stringify(context, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
