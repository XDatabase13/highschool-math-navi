import type { APIRoute } from 'astro';
import { getVerifiedCollection } from '../utils/verifiedCollection';
import { getPublishedTypePagePaths } from '../utils/typePages';

// 正式な検索対象のみを掲載する、手書きの最小限のsitemap。
// /app/（学習DBの入口だがnoindex）は含めない。
// 個別問題はquadratic27・trig4・dataAnalysis・expressionCalculation・setLogicコレクションから毎回組み立てるため、
// npm run sync-content で問題が増減しても手作業でsitemapを更新する必要がない。
// 型ページは公開ゲート（published全38件の型Markdown＋人間の公開承認）を通過した場合だけ
// 各単元の末尾へ一括で入る（承認前は0件で現行189 URLのまま。hold型・承認前の型は入らない）。
const SITE = 'https://math-navi.com';

export const GET: APIRoute = async () => {
  const quadratic27 = (await getVerifiedCollection('quadratic27')).sort(
    (a, b) => a.data.display_order - b.data.display_order,
  );
  const trig4 = (await getVerifiedCollection('trig4')).sort(
    (a, b) => a.data.display_order - b.data.display_order,
  );
  const dataAnalysis = (await getVerifiedCollection('dataAnalysis')).sort(
    (a, b) => a.data.display_order - b.data.display_order,
  );
  const expressionCalculation = (await getVerifiedCollection('expressionCalculation')).sort(
    (a, b) => a.data.display_order - b.data.display_order,
  );
  const setLogic = (await getVerifiedCollection('setLogic')).sort(
    (a, b) => a.data.display_order - b.data.display_order,
  );

  const typePagePaths = await getPublishedTypePagePaths();

  const paths = [
    '/',
    '/math1/suto-shiki/',
    ...expressionCalculation.map((entry) => `/math1/suto-shiki/${entry.id}/`),
    ...(typePagePaths.get('suto-shiki') ?? []),
    '/math1/set-logic/',
    ...setLogic.map((entry) => `/math1/set-logic/${entry.id}/`),
    ...(typePagePaths.get('set-logic') ?? []),
    '/math1/quadratic/',
    ...quadratic27.map((entry) => `/math1/quadratic/${entry.id}/`),
    ...(typePagePaths.get('quadratic') ?? []),
    '/math1/trig/',
    ...trig4.map((entry) => `/math1/trig/${entry.id}/`),
    ...(typePagePaths.get('trig') ?? []),
    '/math1/data-analysis/',
    ...dataAnalysis.map((entry) => `/math1/data-analysis/${entry.id}/`),
    ...(typePagePaths.get('data-analysis') ?? []),
    '/privacy/',
    '/disclaimer/',
    '/contact/',
  ];

  const urlsXml = paths
    .map((path) => `  <url><loc>${SITE}${path}</loc></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
