#!/usr/bin/env node
// 型ページ（問題タイプ）のproduction build監査。`npm run build` の後に実行する。
//
// 1. 公開集合: 公開グループ（数学I 38型／数学A 場合の数・確率 18型）ごとの公開ゲート＝
//    「そのグループのpublished全件の型Markdown」かつ「そのグループの公開承認
//    （src/data/type-page-publication.ts）」。ゲート未通過のグループは（型Markdownが何件でも）、
//    dist・sitemapにそのグループの型route・型一覧nav・切替UI・型Markdown本文が1件も存在しないこと。
//    ゲート通過グループだけ、published全件が一括で存在すること。sitemapは型ページなし258 URL＋
//    通過グループの型数（数学Iだけなら296、両方なら314）。
//    承認済みなのに全件そろっていないグループは監査エラー（buildもエラーになる）。
// 2. hold型が、distのどこにも出ていないこと（2026-09-29に削除した開発確認用fixtureの残骸も検査する）。
// 3. xlsx読取依存（exceljs）がbuild成果物に含まれていないこと。
// 4. SVG: 全型ページ（published・hold）について、同じページに並ぶ placement: problem assetを
//    表示時と同じ規則で名前空間化したうえで、重複id・参照切れがないこと
//    （参考として、名前空間化しなかった場合に衝突するidも報告する）。
//
// 使い方: npm run build && npm run audit-type-pages

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPE_PAGE_UNITS, TYPE_PAGE_PUBLICATION_GROUPS, typePageUrl, unitUrl } from '../src/data/type-page-units.ts';
import { namespaceSvgIds, auditSvgIdReferences } from '../src/utils/svgIdNamespace.ts';
import { TYPE_PAGE_GROUP_PUBLICATION_APPROVED } from '../src/data/type-page-publication.ts';
import { dbSubjectNav } from '../src/data/subjects.ts';
import { NAVIGATOR_SUBJECTS } from '../src/data/navigator-config.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(repoRoot, 'dist');
const snapshot = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/type-pages.generated.json'), 'utf-8'));
const markdownDir = path.join(repoRoot, 'src/content/typePages');
const errors = [];
const fail = (msg) => errors.push(msg);

if (!existsSync(path.join(dist, 'sitemap.xml'))) {
  console.error('dist/sitemap.xml がありません。先に npm run build を実行してください。');
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function frontmatter(md) {
  return md.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

// 問題Markdownのassets配列から file と placement だけを読む最小パーサー。
function problemAssets(md) {
  const fm = frontmatter(md).split(/\r?\n/);
  const start = fm.findIndex((l) => /^assets:/.test(l));
  if (start === -1 || /^assets:\s*\[\s*\]/.test(fm[start])) return [];
  const assets = [];
  for (const line of fm.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    const file = line.match(/^\s*-\s*file:\s*(.+)$/);
    if (file) assets.push({ file: file[1].trim().replace(/^["']|["']$/g, ''), placement: undefined });
    const placement = line.match(/^\s+placement:\s*(\S+)/);
    if (placement && assets.length > 0) assets[assets.length - 1].placement = placement[1];
  }
  return assets;
}

const scalar = (md, key) => frontmatter(md).split(/\r?\n/).find((l) => l.startsWith(`${key}:`))?.slice(key.length + 1).trim();

// --- 1. 公開集合 ---
const published = snapshot.typePages.filter((t) => t.status === 'published');
const hold = snapshot.typePages.filter((t) => t.status !== 'published');
const markdownFiles = existsSync(markdownDir)
  ? readdirSync(markdownDir).filter((f) => /^[A-Z]{2}-T\d{2}\.md$/.test(f))
  : [];
const unitOf = (t) => TYPE_PAGE_UNITS.find((u) => u.unitId === t.unitId);
const groupStates = TYPE_PAGE_PUBLICATION_GROUPS.map((group) => {
  const pages = published.filter((t) => unitOf(t).publicationGroup === group.id);
  const markdownCount = pages.filter((t) => markdownFiles.includes(`${t.id}.md`)).length;
  const isComplete = pages.length === group.expectedPublishedCount && markdownCount === pages.length;
  const approved = TYPE_PAGE_GROUP_PUBLICATION_APPROVED[group.id];
  if (approved && !isComplete) {
    fail(`${group.label}: 公開承認済みですが、型Markdownが${markdownCount}/${group.expectedPublishedCount}件です（グループ内の一部だけの公開は禁止）。`);
  }
  return { group, pages, markdownCount, approved, isPublished: approved && isComplete };
});
const publicPages = groupStates.filter((s) => s.isPublished).flatMap((s) => s.pages);
const unpublishedPages = groupStates.filter((s) => !s.isPublished).flatMap((s) => s.pages);
const unpublishedUnits = TYPE_PAGE_UNITS.filter(
  (u) => !groupStates.find((s) => s.group.id === u.publicationGroup).isPublished,
);
// ゲート未通過グループの型Markdownのdescriptionがbuild成果物に出ていないこと（本文流出の検査）。
const unpublishedDescriptions = unpublishedPages
  .filter((t) => markdownFiles.includes(`${t.id}.md`))
  .map((t) => readFileSync(path.join(markdownDir, `${t.id}.md`), 'utf-8').match(/^description:\s*"?(.*?)"?\s*$/m)?.[1])
  .filter((d) => d && d.length >= 8);

const sitemapUrls = [...readFileSync(path.join(dist, 'sitemap.xml'), 'utf-8').matchAll(/<loc>https:\/\/math-navi\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemapにURLの重複があります。');

// 固定ページ6件（TOP・4×4ナビ設定画面・このサイトについて・Privacy・Disclaimer・Contact）。
const expectedBase = ['/', '/navigator/', '/about/', '/privacy/', '/disclaimer/', '/contact/'];
let problemCount = 0;
// 問題DBの全単元（型ページの無い数学A等を含む）。単元トップURLはdbSubjectNav、collectionは4×4ナビ設定から引く。
const dbUnits = NAVIGATOR_SUBJECTS.flatMap((subject) => subject.units).map((unit) => ({
  collection: unit.collection,
  href: dbSubjectNav.flatMap((subject) => subject.units).find((u) => u.id === unit.dbUnitId)?.href,
}));
for (const unit of dbUnits) {
  expectedBase.push(unit.href);
  const dir = path.join(repoRoot, 'src/content', unit.collection);
  for (const f of readdirSync(dir).filter((name) => /^M[1A]-[A-Z]{2}-\d{3}\.md$/.test(name))) {
    if (scalar(readFileSync(path.join(dir, f), 'utf-8'), 'verification_status') === '独立検算済み') {
      expectedBase.push(`${unit.href}${f.replace(/\.md$/, '')}/`);
      problemCount += 1;
    }
  }
}
const typeUrl = (t) => typePageUrl(unitOf(t), t.slug);
const expectedUrls = [...expectedBase, ...publicPages.map(typeUrl)];
const missingUrls = expectedUrls.filter((u) => !sitemapUrls.includes(u));
const extraUrls = sitemapUrls.filter((u) => !expectedUrls.includes(u));
if (missingUrls.length > 0) fail(`sitemapに欠けているURL: ${missingUrls.join(', ')}`);
if (extraUrls.length > 0) fail(`sitemapに想定外のURL: ${extraUrls.join(', ')}`);
for (const url of expectedUrls) {
  if (url.endsWith('/') && url !== '/' && !existsSync(path.join(dist, url, 'index.html'))) fail(`distにページがありません: ${url}`);
}

const htmlFiles = walk(dist).filter((f) => f.endsWith('.html'));
const builtFiles = walk(dist).filter((f) => /\.(html|js|css|xml|json|mjs)$/.test(f));
const typePagesInDist = published.filter((t) => existsSync(path.join(dist, typeUrl(t), 'index.html')));
const leaked = typePagesInDist.filter((t) => unpublishedPages.includes(t));
if (leaked.length > 0) fail(`公開ゲート未通過のグループの型ページがdistにあります: ${leaked.map((t) => t.id).join(', ')}`);
const publicInDist = typePagesInDist.filter((t) => publicPages.includes(t));
if (publicInDist.length !== publicPages.length) fail(`公開グループの型ページのうち${publicInDist.length}/${publicPages.length}件しかdistにありません。`);

// 公開前グループの単元のHTML（単元トップ・個別問題）には、切替・型一覧navが出ていないこと。
const unpublishedUnitDirs = unpublishedUnits.map((u) => path.join(dist, unitUrl(u)));
let switchPages = 0;
let unpublishedSwitchPages = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf-8');
  const hasSwitch = html.includes('data-list-view-switch') || html.includes('db-type-link');
  if (hasSwitch) switchPages += 1;
  if (hasSwitch && unpublishedUnitDirs.some((dir) => file.startsWith(dir))) unpublishedSwitchPages += 1;
  for (const t of unpublishedPages) {
    if (html.includes(`href="${typeUrl(t)}"`)) fail(`公開ゲート未通過の型 ${t.id} へのリンクが ${path.relative(dist, file)} に出ています。`);
  }
  // --- 2. hold型・fixture ---
  for (const t of hold) {
    if (html.includes(`href="${typeUrl(t)}"`) || html.includes(t.name)) {
      // 公開名は問題文中に偶然含まれうるため、型一覧リンク（db-type-link）内だけを厳密に判定する。
      if (html.includes(`href="${typeUrl(t)}"`) || new RegExp(`db-type-link[^>]*>${t.name}<`).test(html)) {
        fail(`hold型 ${t.id} が ${path.relative(dist, file)} に出ています。`);
      }
    }
  }
}
if (unpublishedSwitchPages > 0) fail(`公開ゲート未通過のグループの単元で「問題タイプ」切替・型一覧navが${unpublishedSwitchPages}ページに出ています。`);
for (const t of hold) {
  if (existsSync(path.join(dist, typeUrl(t)))) fail(`hold型 ${t.id} のrouteがdistにあります。`);
  if (sitemapUrls.includes(typeUrl(t))) fail(`hold型 ${t.id} がsitemapにあります。`);
}

// --- 2/3. 旧fixtureの残骸・exceljsの混入 ---
const forbiddenStrings = ['開発確認用', 'dev-fixtures', 'typePageFixture', 'DEV_TYPE_PAGE_FIXTURE', 'exceljs', 'ExcelJS'];
for (const file of builtFiles) {
  const text = readFileSync(file, 'utf-8');
  for (const s of forbiddenStrings) {
    if (text.includes(s)) fail(`build成果物 ${path.relative(dist, file)} に「${s}」が含まれています。`);
  }
  for (const d of unpublishedDescriptions) {
    if (text.includes(d)) fail(`公開ゲート未通過の型Markdownのdescriptionが ${path.relative(dist, file)} に出ています。`);
  }
}

// --- 4. SVG監査 ---
const svgReport = [];
for (const page of snapshot.typePages) {
  const unit = TYPE_PAGE_UNITS.find((u) => u.unitId === page.unitId);
  const raw = [];
  const namespaced = [];
  for (const ref of page.problems) {
    const md = readFileSync(path.join(repoRoot, 'src/content', unit.collection, `${ref.problemId}.md`), 'utf-8');
    problemAssets(md)
      .filter((a) => a.placement === 'problem')
      .forEach((asset, index) => {
        const svg = readFileSync(path.join(repoRoot, unit.assetsRoot, ref.problemId, asset.file), 'utf-8');
        raw.push(svg);
        namespaced.push(namespaceSvgIds(svg, `tp-${ref.problemId.toLowerCase()}-a${index + 1}-`));
      });
  }
  const after = auditSvgIdReferences(namespaced.join('\n'));
  const before = auditSvgIdReferences(raw.join('\n'));
  if (after.duplicateIds.length > 0 || after.danglingRefs.length > 0) {
    fail(`型ページ ${page.id}: SVG重複id ${after.duplicateIds.join(', ') || 'なし'} / 参照切れ ${after.danglingRefs.join(', ') || 'なし'}`);
  }
  svgReport.push({ id: page.id, assets: raw.length, rawDuplicates: before.duplicateIds });
}

// --- 結果 ---
const withAssets = svgReport.filter((r) => r.assets > 0);
for (const s of groupStates) {
  console.log(
    `公開状態 ${s.group.label}: ${s.isPublished ? '公開（全件完了＋公開承認）' : '公開前'}` +
      `（型Markdown ${s.markdownCount}/${s.group.expectedPublishedCount}件、公開承認 ${s.approved ? 'あり' : 'なし'}）`,
  );
}
console.log(`sitemap: ${sitemapUrls.length} URL（既存 ${expectedBase.length}＝単元トップ${dbUnits.length}＋問題${problemCount}＋固定6、型 ${publicPages.length}）`);
console.log(`型ページ in dist: ${typePagesInDist.length}件 / 切替・型一覧navを含むHTML: ${switchPages}件`);
console.log(`SVG監査: 全${svgReport.length}型、problem assetを持つ型 ${withAssets.length}件（${withAssets.map((r) => `${r.id}:${r.assets}`).join(' ')}）`);
const rawCollisions = svgReport.filter((r) => r.rawDuplicates.length > 0);
console.log(
  rawCollisions.length > 0
    ? `  名前空間化しなかった場合の衝突: ${rawCollisions.map((r) => `${r.id}(${r.rawDuplicates.join(',')})`).join(' ')}`
    : '  名前空間化しなかった場合の衝突: なし',
);
if (errors.length > 0) {
  for (const e of errors) console.error(`[error] ${e}`);
  console.error(`\n型ページ監査に失敗しました（${errors.length}件）。`);
  process.exit(1);
}
console.log('型ページ監査: OK');
