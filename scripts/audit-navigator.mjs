#!/usr/bin/env node
// 4×4ナビゲーションのproduction build監査。`npm run build` の後に実行する。
//
//   npm run build && npm run audit-navigator
//
// 1. /navigator/：index対象（noindexなし）・self-canonical・sitemap掲載、埋め込み候補データが
//    公開用スナップショットのfrontmatterから作ったものと一致する（180問）。
// 2. /app/navigation/（抽出結果の入口）：noindex,follow・self-canonical・sitemap非掲載、
//    通常の問題DB・各単元トップへの静的リンクがある（JavaScript無効時のfallback）。
//    /app/navigation/data.json（問題DBの抽出モードが取得する候補データ）が埋め込みデータと一致する。
//    個別問題ページの抽出モード用の帯は空・非表示で、候補データを静的HTMLに含まない。
// 3. 既存契約の回帰：/app/ のnoindex・canonical、sitemapが「既存＋/navigator/ の1件だけ」、robots.txt、
//    個別問題・単元トップ・型ページが従来どおり生成され、self-canonical・noindexなし・本文が静的HTMLにある。
// 4. GA4（gtag.js）が各ページで1回だけ読み込まれる。TOPに2つの導線がある。
//
// 任意：環境変数 NAV_AUDIT_BASELINE に、4×4実装前のcommitでbuildした dist のパスを渡すと、
// 既存ページ（TOP以外）の静的HTMLが実装前と同じであることも比較する
// （script・style・Astroのscope属性・抽出モード用の空の帯は比較対象から除く）。

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbSubjectNav } from '../src/data/subjects.ts';
import { NAVIGATOR_SUBJECTS } from '../src/data/navigator-config.ts';
import { buildNavData, createNavIndex, problemHref } from '../src/utils/navigatorCore.ts';

const SITE = 'https://math-navi.com';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(repoRoot, 'dist');
const errors = [];
let checks = 0;
function check(name, condition, detail = '') {
  checks += 1;
  if (!condition) errors.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

if (!existsSync(path.join(dist, 'sitemap.xml'))) {
  console.error('dist/sitemap.xml がありません。先に npm run build を実行してください。');
  process.exit(1);
}

const page = (url, root = dist) => {
  const file = path.join(root, url, 'index.html');
  return existsSync(file) ? readFileSync(file, 'utf-8') : null;
};
const canonicalOf = (html) => html?.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null;
const robotsOf = (html) => html?.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? null;
const gtagCount = (html) => (html?.match(/googletagmanager\.com\/gtag\/js/g) ?? []).length;
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- 公開用スナップショットから期待値を作る ---
function readFrontmatter(file) {
  const block = readFileSync(file, 'utf-8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const data = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return data;
}
const entries = [];
const titles = new Map();
for (const unit of NAVIGATOR_SUBJECTS.flatMap((subject) => subject.units)) {
  const dir = path.join(repoRoot, 'src/content', unit.collection);
  for (const file of readdirSync(dir).filter((name) => /^M1-[A-Z]{2}-\d{3}\.md$/.test(name)).sort()) {
    const fm = readFrontmatter(path.join(dir, file));
    if (fm.verification_status !== '独立検算済み') continue;
    titles.set(fm.problem_id, fm.title);
    entries.push({
      collection: unit.collection,
      id: fm.problem_id,
      subject: fm.subject,
      unit: fm.unit,
      section: fm.section,
      display_order: Number(fm.display_order),
      importance: Number(fm.importance),
      importance_label: fm.importance_label,
      difficulty: Number(fm.difficulty),
    });
  }
}
const expectedData = buildNavData(NAVIGATOR_SUBJECTS, dbSubjectNav, entries);
const index = createNavIndex(expectedData);
const problemUrls = index.problems.map((p) => `${index.unitInfo.get(p.unitId).unit.href}${p.id}/`);
const unitUrls = index.subjects.flatMap((subject) => subject.units.map((unit) => unit.href));
const typeSnapshot = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/type-pages.generated.json'), 'utf-8'));

// --- 1. /navigator/ ---
const navigatorHtml = page('/navigator/');
check('/navigator/ が生成されている', navigatorHtml !== null);
check('/navigator/ はindex対象（robots metaなし）', robotsOf(navigatorHtml) === null);
check('/navigator/ はself-canonical', canonicalOf(navigatorHtml) === `${SITE}/navigator/`, canonicalOf(navigatorHtml) ?? '');
const embedded = navigatorHtml?.match(/<script type="application\/json" id="navigator-data">([\s\S]*?)<\/script>/)?.[1];
let embeddedData = null;
try {
  embeddedData = JSON.parse(embedded ?? '');
} catch {
  embeddedData = null;
}
check(
  '/navigator/ の埋め込み候補データがスナップショットのfrontmatterと一致する',
  embeddedData !== null && JSON.stringify(embeddedData) === JSON.stringify(expectedData),
  `${embeddedData?.problems?.length ?? 0}問`,
);
check('/navigator/ の候補は180問・問題IDの重複なし', index.problems.length === 180 && new Set(index.problems.map((p) => p.id)).size === 180);
check(
  '/navigator/ に範囲22 section・16マス・説明dialog・主ボタンがある',
  (navigatorHtml?.match(/data-nv-section="/g) ?? []).length === index.sectionIds.length &&
    index.sectionIds.length === 22 &&
    (navigatorHtml?.match(/data-nv-cell="/g) ?? []).length === 16 &&
    /<dialog[^>]*data-nv-guide/.test(navigatorHtml ?? '') &&
    /data-nv-go/.test(navigatorHtml ?? ''),
);
check(
  '/navigator/ の初期HTMLは16マス未選択・主ボタン無効',
  (navigatorHtml?.match(/aria-pressed="false"/g) ?? []).length === 16 &&
    !/aria-pressed="true"/.test(navigatorHtml ?? '') &&
    /<a[^>]*aria-disabled="true"[^>]*data-nv-go|<a[^>]*data-nv-go[^>]*aria-disabled="true"/.test(navigatorHtml ?? ''),
);
check('/navigator/ はプリセットUIを持たない', !/プリセット|おすすめ/.test(navigatorHtml ?? ''));

// --- 2. /app/navigation/ ---
const resultHtml = page('/app/navigation/');
check('/app/navigation/ が生成されている', resultHtml !== null);
check('/app/navigation/ はnoindex,follow', robotsOf(resultHtml) === 'noindex,follow', robotsOf(resultHtml) ?? 'なし');
check('/app/navigation/ はself-canonical', canonicalOf(resultHtml) === `${SITE}/app/navigation/`, canonicalOf(resultHtml) ?? '');
check(
  '/app/navigation/ に通常の問題DB・設定画面・各単元トップへの静的リンクがある',
  ['/app/', '/navigator/', ...unitUrls].every((url) => (resultHtml ?? '').includes(`href="${url}"`)),
);
check('/app/navigation/ は独立した問題一覧を持たない', !/db-problem-link/.test(resultHtml ?? ''));
const dataJsonFile = path.join(dist, 'app/navigation/data.json');
check(
  '/app/navigation/data.json が埋め込み候補データと一致する',
  existsSync(dataJsonFile) && readFileSync(dataJsonFile, 'utf-8') === JSON.stringify(expectedData),
);
check(
  '抽出モードの移動先（単元トップURL＋問題ID）が、既存の個別問題ページとしてすべて実在する',
  JSON.stringify(index.problems.map((problem) => problemHref(index, problem))) === JSON.stringify(problemUrls) &&
    problemUrls.every((url) => page(url) !== null),
);

// --- 3. 既存契約 ---
const appHtml = page('/app/');
check('/app/ はnoindex,follow・self-canonicalのまま', robotsOf(appHtml) === 'noindex,follow' && canonicalOf(appHtml) === `${SITE}/app/`);

const sitemapUrls = [...readFileSync(path.join(dist, 'sitemap.xml'), 'utf-8').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
const typeUrls = typeSnapshot.typePages
  .filter((t) => t.status === 'published')
  .map((t) => `${dbSubjectNav.flatMap((s) => s.units).find((unit) => unit.id === t.unitId)?.href}${t.slug}/`);
const typePagesBuilt = typeUrls.filter((url) => page(url) !== null);
// 型ページは公開ゲート（承認＋38件）を通過しているときだけsitemapに入る。ここでは実際にbuildされた型ページを基準にする。
const expectedExisting = ['/', ...unitUrls, ...problemUrls, ...typePagesBuilt, '/privacy/', '/disclaimer/', '/contact/'];
const expectedSitemap = [...expectedExisting, '/navigator/'].map((url) => `${SITE}${url}`);
check('sitemapにURLの重複がない', new Set(sitemapUrls).size === sitemapUrls.length);
check(
  'sitemapは既存URL＋/navigator/ の1件だけ',
  sitemapUrls.length === expectedSitemap.length && expectedSitemap.every((url) => sitemapUrls.includes(url)),
  `${sitemapUrls.length}件（既存${expectedExisting.length}＋1）`,
);
check('sitemapは228件（型ページ公開中）', typePagesBuilt.length !== 38 || sitemapUrls.length === 228, `${sitemapUrls.length}件・型ページ${typePagesBuilt.length}件`);
check('sitemapに /navigator/ が1件だけある', sitemapUrls.filter((url) => url === `${SITE}/navigator/`).length === 1);
check('sitemapに /app/ と /app/navigation/ がない', !sitemapUrls.some((url) => url.startsWith(`${SITE}/app/`)));
check('sitemapにfragment付きURLがない', !sitemapUrls.some((url) => url.includes('#')));

const robots = readFileSync(path.join(dist, 'robots.txt'), 'utf-8');
check(
  'robots.txtが従来どおり（Disallowなし）',
  robots === readFileSync(path.join(repoRoot, 'public/robots.txt'), 'utf-8') &&
    robots.replace(/\r\n/g, '\n').trim() === `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml`,
);

let problemPagesOk = 0;
const problemPageIssues = [];
index.problems.forEach((problem, i) => {
  const url = problemUrls[i];
  const html = page(url);
  const ok =
    html !== null &&
    canonicalOf(html) === `${SITE}${url}` &&
    robotsOf(html) === null &&
    html.includes(escapeHtml(titles.get(problem.id))) &&
    /class="[^"]*q27-detail/.test(html) &&
    /ThinkingFlow/.test(html);
  if (ok) problemPagesOk += 1;
  else problemPageIssues.push(problem.id);
});
check('個別問題180ページ：生成・self-canonical・noindexなし・本文が静的HTMLにある', problemPagesOk === 180, problemPageIssues.slice(0, 5).join(', ') || `${problemPagesOk}件`);
check(
  '単元トップ5ページ：生成・self-canonical・noindexなし',
  unitUrls.length === 5 && unitUrls.every((url) => canonicalOf(page(url)) === `${SITE}${url}` && robotsOf(page(url)) === null),
);
check(
  '型ページ：生成済みの全件がself-canonical・noindexなし',
  typePagesBuilt.every((url) => canonicalOf(page(url)) === `${SITE}${url}` && robotsOf(page(url)) === null),
  `${typePagesBuilt.length}件`,
);
const sampleProblem = page(problemUrls[0]);
const modeHosts = [sampleProblem, appHtml, page(unitUrls[0]), page(typePagesBuilt[0] ?? unitUrls[0])].map(
  (html) => html?.match(/<div[^>]*data-nav-mode[^>]*>([\s\S]*?)<\/div>/) ?? null,
);
check(
  '問題DBの抽出モード用の帯は、静的HTMLでは空・非表示（個別問題・/app/・単元トップ・型ページ）',
  modeHosts.every((m) => m !== null && /\bhidden\b/.test(m[0]) && m[1].trim() === ''),
);
check(
  '個別問題ページの静的HTMLに4×4の候補データを含まない',
  !/navigator-data/.test(sampleProblem ?? '') && !(sampleProblem ?? '').includes('"problems":[["M1-'),
);

// --- 4. GA4・TOP導線 ---
const topHtml = readFileSync(path.join(dist, 'index.html'), 'utf-8');
check(
  'GA4（gtag.js）の読み込みは各ページ1回だけ',
  [navigatorHtml, resultHtml, topHtml, appHtml, sampleProblem].every((html) => gtagCount(html) === 1),
  [navigatorHtml, resultHtml, topHtml, appHtml, sampleProblem].map(gtagCount).join('/'),
);
check(
  'TOPに「問題データベースを見る」と「4×4ナビゲーション」の2導線がある',
  /<a[^>]*class="hero-cta-link"[^>]*href="\/app\/"/.test(topHtml) && /<a[^>]*href="\/navigator\/"/.test(topHtml) && topHtml.includes('4×4ナビゲーション'),
);

// --- 任意：実装前のbuildとの比較 ---
const baseline = process.env.NAV_AUDIT_BASELINE;
if (baseline) {
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  // 静的な内容だけを比べる：script・style・stylesheetのlink・Astroのscope属性・抽出モード用の空の帯を除く。
  const normalize = (html) =>
    html
      .replace(/<script\b[^>]*type="module"[\s\S]*?<\/script>/g, '')
      .replace(/<style\b[\s\S]*?<\/style>/g, '')
      .replace(/<link rel="stylesheet"[^>]*>/g, '')
      .replace(/<div[^>]*class="db-nav-mode"[^>]*><\/div>/g, '')
      .replace(/\s*data-astro-cid-[a-z0-9]+(="[^"]*")?/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ');
  const baseFiles = walk(baseline).filter((file) => file.endsWith('.html'));
  const changed = [];
  const missing = [];
  for (const file of baseFiles) {
    const rel = path.relative(baseline, file);
    const current = path.join(dist, rel);
    if (!existsSync(current)) missing.push(rel);
    else if (normalize(readFileSync(file, 'utf-8')) !== normalize(readFileSync(current, 'utf-8'))) changed.push(rel);
  }
  const added = walk(dist)
    .filter((file) => file.endsWith('.html'))
    .map((file) => path.relative(dist, file))
    .filter((rel) => !existsSync(path.join(baseline, rel)));
  check('実装前との比較：既存ページの欠落がない', missing.length === 0, missing.slice(0, 5).join(', ') || `${baseFiles.length}ページ`);
  check(
    '実装前との比較：静的HTMLが変わったのはTOP（index.html）だけ',
    JSON.stringify(changed) === JSON.stringify(['index.html']),
    changed.slice(0, 8).join(', ') || '変更なし',
  );
  check(
    '実装前との比較：追加ページは /navigator/ と /app/navigation/ だけ',
    JSON.stringify(added.map((rel) => rel.replace(/\\/g, '/')).sort()) === JSON.stringify(['app/navigation/index.html', 'navigator/index.html']),
    added.join(', '),
  );
  const aiContext = (root) => walk(path.join(root, 'ai-context')).map((file) => [path.relative(root, file), readFileSync(file, 'utf-8')]);
  check('実装前との比較：AI-context JSONが同一', JSON.stringify(aiContext(baseline)) === JSON.stringify(aiContext(dist)));
}

console.log(`\n${checks}件中 ${checks - errors.length}件成功、${errors.length}件失敗。`);
if (errors.length > 0) {
  for (const e of errors) console.error(`[error] ${e}`);
  console.error('4×4ナビ監査に失敗しました。');
  process.exit(1);
}
console.log('4×4ナビ監査: OK');
