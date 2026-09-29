#!/usr/bin/env node
// 型ページの同期・公開ゲートのテスト（ローカル専用。正本フォルダが必要）。
//
//   node scripts/test-type-pages.mjs sync
//     テスト用の一時正本（node_modules/.cache/test-type-pages/ 配下にコピー）で sync-type-pages を実行し、
//     制作途中（0〜38件）のMarkdownが同期できること、不正なMarkdown・masterが失敗すること、
//     失敗時に既存スナップショットが保持されることを確認する。正本・repoのスナップショットは触らない。
//
//   node scripts/test-type-pages.mjs gate
//     src/content/typePages/ と src/data/type-page-publication.ts を一時的に書き換えて
//     production buildと監査（audit-type-pages）を実行し、次を確認する。終了時（失敗時も）に元へ戻す。
//       1. 1〜37件のMarkdown → productionの型ページ 0件・sitemap 189件
//       2. 38件そろっても公開承認なし → 189件
//       3. 38件＋公開承認あり → 227件（38型一括）
//       4. 公開承認ありで37件 → buildエラー
//     distは上書きされるため、最後に現状（元の状態）で再buildする。

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalRoot = path.resolve(repoRoot, '../math_db_quadratic_working');
const work = path.join(repoRoot, 'node_modules/.cache/test-type-pages');
const snapshot = JSON.parse(readFileSync(path.join(repoRoot, 'src/data/type-pages.generated.json'), 'utf-8'));
const publishedIds = snapshot.typePages.filter((t) => t.status === 'published').map((t) => t.id);
const holdIds = snapshot.typePages.filter((t) => t.status !== 'published').map((t) => t.id);
let failures = 0;

function typeMarkdown(id, { description = `テスト用description（${id}）`, body = 'テスト用の文です。二文目です。' } = {}) {
  return `---\ntype_page_id: ${id}\ndescription: "${description}"\n---\n\n## 型の概要\n\n${body}\n`;
}

// 引数はすべてこのファイル内の固定文字列（外部入力を含まない）。
function run(cmd, args, env = {}) {
  const result = spawnSync([cmd, ...args].join(' '), { cwd: repoRoot, env: { ...process.env, ...env }, encoding: 'utf-8', shell: true });
  return { ok: result.status === 0, out: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

function check(name, condition, detail = '') {
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures += 1;
}

// ---------------------------------------------------------------------------
// sync
// ---------------------------------------------------------------------------
function syncTests() {
  const cases = [
    { name: '0件', expect: 'ok', count: 0 },
    { name: '1件（制作途中）', expect: 'ok', count: 1, files: { 'QF-T03.md': typeMarkdown('QF-T03') } },
    { name: '37件（制作途中）', expect: 'ok', count: 37, all: true, remove: ['QF-T03.md'] },
    { name: '38件', expect: 'ok', count: 38, all: true },
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
    if (c.all) for (const id of publishedIds) writeFileSync(path.join(canon, 'type_pages', `${id}.md`), typeMarkdown(id));
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
      check(`sync: ${c.name} は失敗する`, !result.ok && outFiles.includes('SENTINEL.md'), '既存スナップショット保持');
    }
  }
}

// ---------------------------------------------------------------------------
// gate
// ---------------------------------------------------------------------------
const markdownDir = path.join(repoRoot, 'src/content/typePages');
const flagFile = path.join(repoRoot, 'src/data/type-page-publication.ts');

function setState({ count, approved }) {
  for (const f of readdirSync(markdownDir)) if (/^[A-Z]{2}-T\d{2}\.md$/.test(f)) rmSync(path.join(markdownDir, f));
  for (const id of publishedIds.slice(0, count)) writeFileSync(path.join(markdownDir, `${id}.md`), typeMarkdown(id));
  const flag = readFileSync(flagFile, 'utf-8').replace(
    /TYPE_PAGES_PUBLICATION_APPROVED: boolean = (true|false)/,
    `TYPE_PAGES_PUBLICATION_APPROVED: boolean = ${approved}`,
  );
  writeFileSync(flagFile, flag);
}

function sitemapCount() {
  return (readFileSync(path.join(repoRoot, 'dist/sitemap.xml'), 'utf-8').match(/<loc>/g) ?? []).length;
}

function gateTests() {
  const backupDir = path.join(work, 'gate-backup');
  rmSync(backupDir, { recursive: true, force: true });
  mkdirSync(backupDir, { recursive: true });
  cpSync(markdownDir, path.join(backupDir, 'typePages'), { recursive: true });
  const flagBackup = readFileSync(flagFile, 'utf-8');
  const scenarios = [
    { name: '1件・承認なし', count: 1, approved: false, build: true, sitemap: 189 },
    { name: '37件・承認なし', count: 37, approved: false, build: true, sitemap: 189 },
    { name: '38件・承認なし', count: 38, approved: false, build: true, sitemap: 189 },
    { name: '38件・承認あり', count: 38, approved: true, build: true, sitemap: 227 },
    { name: '37件・承認あり（部分公開は禁止）', count: 37, approved: true, build: false },
  ];
  try {
    for (const s of scenarios) {
      setState(s);
      const build = run('npm', ['run', 'build']);
      if (!s.build) {
        check(`gate: ${s.name} → buildエラー`, !build.ok && build.out.includes('1〜37件だけの公開はしません'));
        continue;
      }
      const audit = build.ok ? run('node', ['scripts/audit-type-pages.mjs']) : { ok: false, out: build.out.slice(-800) };
      const count = build.ok ? sitemapCount() : -1;
      const typeDirs = build.ok ? readdirSync(path.join(repoRoot, 'dist/math1/quadratic')).filter((d) => !d.startsWith('M1-') && d !== 'index.html') : [];
      check(
        `gate: ${s.name} → sitemap ${s.sitemap}件`,
        build.ok && audit.ok && count === s.sitemap && typeDirs.length === (s.sitemap === 227 ? 10 : 0),
        `build ${build.ok ? 'OK' : 'NG'} / audit ${audit.ok ? 'OK' : 'NG'} / sitemap ${count} / 二次関数の型route ${typeDirs.length}件`,
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
if (mode === 'sync') syncTests();
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
