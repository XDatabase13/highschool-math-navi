#!/usr/bin/env node
// 型ページの同期・公開ゲートのテスト（ローカル専用。正本フォルダが必要）。
//
//   node scripts/test-type-pages.mjs sync
//     テスト用の一時正本（node_modules/.cache/test-type-pages/ 配下にコピー）で sync-type-pages を実行し、
//     制作途中のMarkdownが同期できること、不正なMarkdown・masterが失敗すること、
//     失敗時に既存スナップショットが保持されることを確認する。正本・repoのスナップショットは触らない。
//     数学A（MA-CP）の問題ID・副所属・本文の問題番号、masterの所属の不整合も扱う。
//
//   node scripts/test-type-pages.mjs gate
//     src/content/typePages/ と src/data/type-page-publication.ts を一時的に書き換えて
//     production buildと監査（audit-type-pages）を実行し、公開グループ（数学I 38型／数学A 場合の数・確率
//     18型）ごとの公開ゲートを確認する。終了時（失敗時も）に元へ戻す。
//       - 数学Iが未承認または38件未満 → 数学Iの型ページ 0件
//       - 数学I 38件＋承認 → 数学Iの38型一括（CPが未承認・本文不足でも影響しない）
//       - CP 18件＋承認 → CPの18型一括（数学Iの状態に依存しない）
//       - 承認ありで件数不足（数学I 37件・CP 17件）→ buildエラー
//     sitemapは型ページなし258件（TOP・4×4ナビ設定画面 /navigator/・このサイトについて /about/・
//     数学Iの単元トップ5・問題180・数学A 場合の数・確率の単元トップ1・問題66・Privacy/Disclaimer/Contact）
//     ＋公開グループの型数（数学Iだけ296、CPだけ276、両方314）。
//     distは上書きされるため、最後に現状（元の状態）で再buildする。

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalRoot = path.resolve(repoRoot, '../math_db_quadratic_working');
const work = path.join(repoRoot, 'node_modules/.cache/test-type-pages');
const snapshot = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/type-pages.generated.json'), 'utf-8'));
const publishedIds = snapshot.typePages.filter((t) => t.status === 'published').map((t) => t.id);
const holdIds = snapshot.typePages.filter((t) => t.status !== 'published').map((t) => t.id);
// 公開グループ別のpublished型ID（数学I 5単元／数学A 場合の数・確率）。
const m1Ids = publishedIds.filter((id) => !id.startsWith('CP-'));
const cpIds = publishedIds.filter((id) => id.startsWith('CP-'));
const CP_MASTER = 'counting_probability_problem_master.xlsx';
let failures = 0;

function typeMarkdown(id, { description = `テスト用description（${id}）`, body = 'テスト用の文です。二文目です。' } = {}) {
  return `---\ntype_page_id: ${id}\ndescription: "${description}"\n---\n\n## 型の概要\n\n${body}\n`;
}

// 引数はすべてこのファイル内の固定文字列（外部入力を含まない）。
function run(cmd, args, env = {}) {
  const result = spawnSync([cmd, ...args].join(' '), { cwd: repoRoot, env: { ...process.env, ...env }, encoding: 'utf-8', shell: true });
  return { ok: result.status === 0, out: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

// テスト用にコピーしたmaster xlsxのXML内の文字列を置き換える（所属の不整合を作る異常系用）。
async function patchMaster(file, from, to) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  let found = 0;
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml')) continue;
    const xml = await zip.file(name).async('string');
    if (!xml.includes(from)) continue;
    found += xml.split(from).length - 1;
    zip.file(name, xml.split(from).join(to));
  }
  if (found !== 1) throw new Error(`patchMaster: 「${from}」が${found}件です（1件のはず）。`);
  writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer' }));
}

function check(name, condition, detail = '') {
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures += 1;
}

// ---------------------------------------------------------------------------
// sync
// ---------------------------------------------------------------------------
async function syncTests() {
  const cp08 = (body) => ({ 'CP-T08.md': typeMarkdown('CP-T08', { body }) });
  const cases = [
    { name: '0件', expect: 'ok', count: 0 },
    { name: '1件（制作途中）', expect: 'ok', count: 1, files: { 'QF-T03.md': typeMarkdown('QF-T03') } },
    { name: `${publishedIds.length - 1}件（制作途中）`, expect: 'ok', count: publishedIds.length - 1, all: true, remove: ['QF-T03.md'] },
    { name: `全${publishedIds.length}件（数学I ${m1Ids.length}＋CP ${cpIds.length}）`, expect: 'ok', count: publishedIds.length, all: true },
    { name: 'CPだけ17件（CP制作途中）', expect: 'ok', count: cpIds.length - 1, cpOnly: true, remove: ['CP-T18.md'] },
    // CP-T08の所属はMA-CP-022(副)・023・029。本文の番号は主・副を合わせた集合で照合する。
    { name: 'CP: 主・副所属の番号（warningのみ）', expect: 'ok', count: 1, files: cp08('MA-CP-022と023・029を比べる。b。') },
    { name: 'CP: 所属外の番号', expect: 'fail', files: cp08('023と024を比べる。b。') },
    { name: 'CP: 所属外の問題ID', expect: 'fail', files: cp08('MA-CP-030を見る。b。') },
    { name: 'CP: 本文に数学Iの問題ID', expect: 'fail', files: cp08('M1-QF-023を見る。b。') },
    { name: '数学I: 本文に数学Aの問題ID', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T03', { body: 'MA-CP-013を見る。b。' }) } },
    { name: 'CP master: 対象問題IDの(副)が欠けた主副不一致', expect: 'fail', patch: [CP_MASTER, 'MA-CP-022(副)', 'MA-CP-022'] },
    { name: 'CP master: 型ページ管理側だけ副所属がない', expect: 'fail', patch: [CP_MASTER, 'MA-CP-022(副)\nMA-CP-023', 'MA-CP-023'] },
    { name: 'CP master: 副所属の型ページIDが存在しない', expect: 'fail', patch: [CP_MASTER, 'CP-T08：', 'CP-T99：'] },
    // hold型がmasterにあるときだけ（2026-09-29のQF-T10採用後はhold 0件）。
    ...(holdIds.length > 0
      ? [{ name: `${publishedIds.length}件＋hold型Markdown（同期対象外）`, expect: 'ok', count: publishedIds.length, all: true, files: { [`${holdIds[0]}.md`]: typeMarkdown(holdIds[0]) } }]
      : []),
    { name: '_TEMPLATE.mdは無視', expect: 'ok', count: 1, files: { '_TEMPLATE.md': 'x', 'QF-T03.md': typeMarkdown('QF-T03') } },
    { name: '空description', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T03', { description: '' }) } },
    { name: '空本文', expect: 'fail', files: { 'QF-T03.md': '---\ntype_page_id: QF-T03\ndescription: "d"\n---\n' } },
    { name: 'orphan', expect: 'fail', files: { 'QF-T99.md': typeMarkdown('QF-T99') } },
    { name: 'filenameとID不一致', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T04') } },
    { name: '余分なfrontmatter key', expect: 'fail', files: { 'QF-T03.md': '---\ntype_page_id: QF-T03\ndescription: "d"\ntitle: x\n---\n\n## 型の概要\n\na。b。\n' } },
    { name: '箇条書き', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T03', { body: '- 箇条書き' }) } },
    { name: '追加見出し', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T03', { body: 'a。b。\n\n### 追加' }) } },
    // 所属問題のID・3桁番号はwarning（spec §3.2・§3.4、2026-09-29改訂）。所属外・別単元だけエラー。
    { name: '所属問題のID・番号（warningのみ）', expect: 'ok', count: 1, files: { 'QF-T03.md': typeMarkdown('QF-T03', { body: 'M1-QF-013〜016を見る。019・020、$x=100$、180°。' }) } },
    { name: '所属外の問題番号', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T03', { body: 'M1-QF-013を見る。017も見る。' }) } },
    { name: '所属外の範囲', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T03', { body: 'M1-QF-013〜017を見る。b。' }) } },
    { name: '別単元の問題ID', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T03', { body: 'M1-TR-013を見る。b。' }) } },
    { name: '生HTML', expect: 'fail', files: { 'QF-T03.md': typeMarkdown('QF-T03', { body: '<div>x</div>' }) } },
  ];
  for (const c of cases) {
    const dir = path.join(work, 'sync');
    rmSync(dir, { recursive: true, force: true });
    const canon = path.join(dir, 'canon');
    const out = path.join(dir, 'out');
    mkdirSync(path.join(canon, 'type_pages'), { recursive: true });
    mkdirSync(path.join(out, 'src/data'), { recursive: true });
    mkdirSync(path.join(out, 'src/content/typePages'), { recursive: true });
    cpSync(path.join(canonicalRoot, 'problem_master'), path.join(canon, 'problem_master'), { recursive: true });
    cpSync(path.join(canonicalRoot, 'problems'), path.join(canon, 'problems'), { recursive: true });
    writeFileSync(path.join(out, 'src/content/typePages/SENTINEL.md'), 'previous snapshot');
    if (c.patch) await patchMaster(path.join(canon, 'problem_master', c.patch[0]), c.patch[1], c.patch[2]);
    const initial = c.all ? publishedIds : c.cpOnly ? cpIds : [];
    for (const id of initial) writeFileSync(path.join(canon, 'type_pages', `${id}.md`), typeMarkdown(id));
    for (const [file, text] of Object.entries(c.files ?? {})) writeFileSync(path.join(canon, 'type_pages', file), text);
    for (const file of c.remove ?? []) rmSync(path.join(canon, 'type_pages', file));

    const result = run('node', ['scripts/sync-type-pages.mjs'], {
      SYNC_TYPE_PAGES_CANONICAL_ROOT: canon,
      SYNC_TYPE_PAGES_OUT_ROOT: out,
    });
    const outFiles = readdirSync(path.join(out, 'src/content/typePages'));
    const synced = outFiles.filter((f) => /^[A-Z]{2}-T\d{2}\.md$/.test(f)).length;
    if (c.expect === 'ok') {
      check(`sync: ${c.name}`, result.ok && synced === c.count && !outFiles.includes('SENTINEL.md') && !holdIds.some((id) => outFiles.includes(`${id}.md`)), `同期${synced}件`);
    } else {
      const reason = result.out.split('\n').find((l) => l.startsWith('[error]')) ?? '';
      check(`sync: ${c.name} は失敗する`, !result.ok && outFiles.includes('SENTINEL.md'), `既存スナップショット保持 ${reason}`);
    }
  }
}

// ---------------------------------------------------------------------------
// gate
// ---------------------------------------------------------------------------
const markdownDir = path.join(repoRoot, 'src/content/typePages');
const flagFile = path.join(repoRoot, 'src/data/type-page-publication.ts');

function setState({ m1, m1Approved, cp, cpApproved }) {
  for (const f of readdirSync(markdownDir)) if (/^[A-Z]{2}-T\d{2}\.md$/.test(f)) rmSync(path.join(markdownDir, f));
  for (const id of [...m1Ids.slice(0, m1), ...cpIds.slice(0, cp)]) writeFileSync(path.join(markdownDir, `${id}.md`), typeMarkdown(id));
  const flag = readFileSync(flagFile, 'utf-8')
    .replace(/\bTYPE_PAGES_PUBLICATION_APPROVED: boolean = (true|false)/, `TYPE_PAGES_PUBLICATION_APPROVED: boolean = ${m1Approved}`)
    .replace(/\bCP_TYPE_PAGES_PUBLICATION_APPROVED: boolean = (true|false)/, `CP_TYPE_PAGES_PUBLICATION_APPROVED: boolean = ${cpApproved}`);
  writeFileSync(flagFile, flag);
}

function sitemapCount() {
  return (readFileSync(path.join(repoRoot, 'dist/sitemap.xml'), 'utf-8').match(/<loc>/g) ?? []).length;
}

function htmlCount(dir = path.join(repoRoot, 'dist')) {
  return readdirSync(dir, { withFileTypes: true }).reduce(
    (n, e) => n + (e.isDirectory() ? htmlCount(path.join(dir, e.name)) : e.name.endsWith('.html') ? 1 : 0),
    0,
  );
}

// 単元ディレクトリ直下の型route（問題ID・index.html以外）の件数。
const typeRouteCount = (unitDir, problemPrefix) =>
  readdirSync(path.join(repoRoot, 'dist', unitDir)).filter((d) => !d.startsWith(problemPrefix) && d !== 'index.html').length;

function gateTests() {
  const backupDir = path.join(work, 'gate-backup');
  rmSync(backupDir, { recursive: true, force: true });
  mkdirSync(backupDir, { recursive: true });
  cpSync(markdownDir, path.join(backupDir, 'typePages'), { recursive: true });
  const flagBackup = readFileSync(flagFile, 'utf-8');
  const scenarios = [
    { name: '数学I 1件・未承認／CP 0件・未承認', m1: 1, m1Approved: false, cp: 0, cpApproved: false, sitemap: 258, pages: 261 },
    { name: '数学I 37件・未承認／CP 18件・未承認', m1: 37, m1Approved: false, cp: 18, cpApproved: false, sitemap: 258, pages: 261 },
    { name: '数学I 38件・未承認／CP 18件・未承認', m1: 38, m1Approved: false, cp: 18, cpApproved: false, sitemap: 258, pages: 261 },
    { name: '数学I 38件・承認／CP 18件・未承認', m1: 38, m1Approved: true, cp: 18, cpApproved: false, sitemap: 296, pages: 299 },
    { name: '数学I 38件・承認／CP 17件・未承認（CP本文不足は数学Iを止めない）', m1: 38, m1Approved: true, cp: 17, cpApproved: false, sitemap: 296, pages: 299 },
    { name: '数学I 38件・承認／CP 18件・承認（現状。2026-10-26公開承認）', m1: 38, m1Approved: true, cp: 18, cpApproved: true, sitemap: 314, pages: 317 },
    { name: '数学I 38件・未承認／CP 18件・承認（グループは独立）', m1: 38, m1Approved: false, cp: 18, cpApproved: true, sitemap: 276, pages: 279 },
    { name: '数学I 37件・承認（部分公開は禁止）', m1: 37, m1Approved: true, cp: 18, cpApproved: false, build: false },
    { name: 'CP 17件・承認（部分公開は禁止）', m1: 38, m1Approved: true, cp: 17, cpApproved: true, build: false },
  ];
  try {
    for (const s of scenarios) {
      setState(s);
      const build = run('npm', ['run', 'build']);
      if (s.build === false) {
        check(`gate: ${s.name} → buildエラー`, !build.ok && build.out.includes('グループ内の一部だけの公開はしません'));
        continue;
      }
      const audit = build.ok ? run('node', ['scripts/audit-type-pages.mjs']) : { ok: false, out: build.out.slice(-800) };
      const count = build.ok ? sitemapCount() : -1;
      const pages = build.ok ? htmlCount() : -1;
      const qfTypes = build.ok ? typeRouteCount('math1/quadratic', 'M1-') : -1;
      const cpTypes = build.ok ? typeRouteCount('math-a/counting-probability', 'MA-') : -1;
      const m1Public = s.m1Approved && s.m1 === m1Ids.length;
      const cpPublic = s.cpApproved && s.cp === cpIds.length;
      check(
        `gate: ${s.name} → sitemap ${s.sitemap}件・${s.pages}ページ`,
        build.ok && audit.ok && count === s.sitemap && pages === s.pages &&
          qfTypes === (m1Public ? 10 : 0) && cpTypes === (cpPublic ? cpIds.length : 0),
        `build ${build.ok ? 'OK' : 'NG'} / audit ${audit.ok ? 'OK' : 'NG'} / sitemap ${count} / HTML ${pages} / 二次関数の型route ${qfTypes}件 / CPの型route ${cpTypes}件`,
      );
      if (!audit.ok) console.log(audit.out);
    }
  } finally {
    for (const f of readdirSync(markdownDir)) rmSync(path.join(markdownDir, f));
    cpSync(path.join(backupDir, 'typePages'), markdownDir, { recursive: true });
    writeFileSync(flagFile, flagBackup);
    const rebuild = run('npm', ['run', 'build']);
    console.log(`元の状態へ復元し、再build: ${rebuild.ok ? 'OK' : 'NG'}`);
  }
}

const mode = process.argv[2];
if (mode === 'sync') await syncTests();
else if (mode === 'gate') gateTests();
else {
  console.error('使い方: node scripts/test-type-pages.mjs sync|gate');
  process.exit(2);
}
rmSync(path.join(work, 'sync'), { recursive: true, force: true });
if (failures > 0) {
  console.error(`\n${failures}件のテストが失敗しました。`);
  process.exit(1);
}
console.log('\nすべてのテストが通りました。');
