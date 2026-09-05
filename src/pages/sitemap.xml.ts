import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// 正式な検索対象のみを掲載する、手書きの最小限のsitemap。
// /app/（学習DBの入口だがnoindex）と旧6サンプルroute（非公開）は含めない。
// 個別問題54件はquadratic27コレクションから毎回組み立てるため、
// npm run sync-content で問題が増減しても手作業でsitemapを更新する必要がない。
const SITE = 'https://math-navi.com';

export const GET: APIRoute = async () => {
  const quadratic27 = (await getCollection('quadratic27')).sort(
    (a, b) => a.data.display_order - b.data.display_order,
  );

  const paths = [
    '/',
    '/math1/quadratic/',
    ...quadratic27.map((entry) => `/math1/quadratic/${entry.id}/`),
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
