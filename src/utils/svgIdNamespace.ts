// 型ページでは複数問題のproblem asset（インラインSVG）が同じHTMLに並ぶ。各assetの
// 内部ID（marker・clipPath・mask・filter・gradient等）は単体の問題ページでしか一意性を
// 確認していないため（例：複数assetが `pa-arrow` を持つ）、型ページへ埋め込む前に
// asset単位の接頭辞で名前空間化し、同じasset内の参照（url(#…)・href/xlink:href="#…"・
// aria-labelledby/describedby）も同じ対応表で書き換える。asset正本・問題ページ側の表示は変えない。
//
// scripts/audit-type-pages.mjs（Node）からも直接importするため、Nodeの型除去だけで
// 読める構文に限定する（外部import・enumなし）。

const ID_ATTR = /(\sid=)(["'])([^"']+)\2/g;
const URL_REF = /url\(\s*(["']?)#([^"')\s]+)\1\s*\)/g;
const HREF_REF = /(\s(?:xlink:)?href=)(["'])#([^"']+)\2/g;
const ARIA_REF = /(\saria-(?:labelledby|describedby)=)(["'])([^"']+)\2/g;

export function namespaceSvgIds(svg: string, prefix: string): string {
  const mapping = new Map<string, string>();
  for (const match of svg.matchAll(ID_ATTR)) {
    mapping.set(match[3], `${prefix}${match[3]}`);
  }
  if (mapping.size === 0) return svg;
  const rename = (id: string): string => mapping.get(id) ?? id;
  return svg
    .replace(ID_ATTR, (_, attr: string, quote: string, id: string) => `${attr}${quote}${rename(id)}${quote}`)
    .replace(URL_REF, (_, quote: string, id: string) => `url(${quote}#${rename(id)}${quote})`)
    .replace(HREF_REF, (_, attr: string, quote: string, id: string) => `${attr}${quote}#${rename(id)}${quote}`)
    .replace(
      ARIA_REF,
      (_, attr: string, quote: string, ids: string) =>
        `${attr}${quote}${ids.split(/\s+/).map(rename).join(' ')}${quote}`,
    );
}

export interface SvgIdAuditResult {
  duplicateIds: string[];
  danglingRefs: string[];
}

// HTML断片内の全id・内部参照を監査する（重複idと、参照先idが存在しない参照を返す）。
export function auditSvgIdReferences(html: string): SvgIdAuditResult {
  const counts = new Map<string, number>();
  for (const match of html.matchAll(ID_ATTR)) {
    counts.set(match[3], (counts.get(match[3]) ?? 0) + 1);
  }
  const refs = new Set<string>();
  for (const match of html.matchAll(URL_REF)) refs.add(match[2]);
  for (const match of html.matchAll(HREF_REF)) refs.add(match[3]);
  for (const match of html.matchAll(ARIA_REF)) match[3].split(/\s+/).forEach((id) => refs.add(id));
  return {
    duplicateIds: [...counts].filter(([, n]) => n > 1).map(([id]) => id),
    danglingRefs: [...refs].filter((id) => !counts.has(id)),
  };
}

export function assertSvgIdReferences(html: string, context: string): void {
  const { duplicateIds, danglingRefs } = auditSvgIdReferences(html);
  if (duplicateIds.length > 0 || danglingRefs.length > 0) {
    throw new Error(
      `[${context}] インラインSVGのid監査に失敗しました。` +
        (duplicateIds.length > 0 ? ` 重複id: ${duplicateIds.join(', ')}。` : '') +
        (danglingRefs.length > 0 ? ` 参照先のないid参照: ${danglingRefs.join(', ')}。` : ''),
    );
  }
}
