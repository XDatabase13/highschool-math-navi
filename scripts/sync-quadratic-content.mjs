#!/usr/bin/env node
// 正本（隣接フォルダ math_db_quadratic_working/）から、Web公開用スナップショット
// （src/content/quadratic27, src/content/quadratic27-assets）へコピーするだけの単純なスクリプト。
//
// - 正本ファイルは一切書き換えない（読み込むだけ）。
// - スナップショット側は毎回作り直す（削除→コピー）ので、正本から消えたファイルが
//   スナップショット側に残り続けることはない。
// - 正本フォルダが存在しないローカル以外の環境（GitHub Actions等）では実行できないため、
//   このスクリプトはローカルで正本を更新した人が手動で実行し、生成された差分をcommitする運用。
//   （astro buildの一部として自動実行はしない）
//
// 使い方: npm run sync-content

import { existsSync, mkdirSync, readdirSync, rmSync, copyFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const canonicalRoot = path.resolve(repoRoot, '../math_db_quadratic_working');
const canonicalProblems = path.join(canonicalRoot, 'problems');
const canonicalAssets = path.join(canonicalRoot, 'assets');

const snapshotProblems = path.join(repoRoot, 'src/content/quadratic27');
const snapshotAssets = path.join(repoRoot, 'src/content/quadratic27-assets');

// 三角比（M1-TR-001〜004）試験バッチ用スナップショット先。quadratic27とは別コレクション
// （src/content.config.tsのtrig4）なので、格納先ディレクトリも分離する。
const snapshotTrigProblems = path.join(repoRoot, 'src/content/trig4');
const snapshotTrigAssets = path.join(repoRoot, 'src/content/trig4-assets');

const SNAPSHOT_NOTICE =
  '# 自動生成スナップショット（編集禁止）\n\n' +
  'このディレクトリの中身は、正本 `math_db_quadratic_working/`（highschool_math_db の外）から\n' +
  '`npm run sync-content`（scripts/sync-quadratic-content.mjs）でコピーしたものです。\n\n' +
  '直接編集しないでください。編集は正本側で行い、その後このコマンドで再同期してください。\n';

if (!existsSync(canonicalProblems) || !existsSync(canonicalAssets)) {
  console.error(`正本フォルダが見つかりません: ${canonicalRoot}`);
  console.error('このスクリプトは正本が存在するローカル環境専用です（GitHub Actions等では実行不要）。');
  process.exit(1);
}

function resetDir(dir) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

function copyMarkdown() {
  resetDir(snapshotProblems);
  const files = readdirSync(canonicalProblems).filter((f) => /^M1-QF-\d+\.md$/.test(f));
  for (const f of files) {
    copyFileSync(path.join(canonicalProblems, f), path.join(snapshotProblems, f));
  }
  writeFileSync(path.join(snapshotProblems, 'README.md'), SNAPSHOT_NOTICE);
  return files.length;
}

function copyAssets() {
  resetDir(snapshotAssets);
  const dirs = readdirSync(canonicalAssets).filter((name) => {
    const full = path.join(canonicalAssets, name);
    return /^M1-QF-\d+$/.test(name) && statSync(full).isDirectory();
  });
  let fileCount = 0;
  for (const d of dirs) {
    const srcDir = path.join(canonicalAssets, d);
    const destDir = path.join(snapshotAssets, d);
    mkdirSync(destDir, { recursive: true });
    for (const f of readdirSync(srcDir)) {
      copyFileSync(path.join(srcDir, f), path.join(destDir, f));
      fileCount += 1;
    }
  }
  writeFileSync(path.join(snapshotAssets, 'README.md'), SNAPSHOT_NOTICE);
  return fileCount;
}

// 三角比試験バッチ（M1-TR-001〜004）用。存在するファイルだけを対象にする
// （量産中で正本側の問題数が増減しても、このスクリプト自体は変更不要）。
function copyTrigMarkdown() {
  resetDir(snapshotTrigProblems);
  const files = readdirSync(canonicalProblems).filter((f) => /^M1-TR-\d+\.md$/.test(f));
  for (const f of files) {
    copyFileSync(path.join(canonicalProblems, f), path.join(snapshotTrigProblems, f));
  }
  writeFileSync(path.join(snapshotTrigProblems, 'README.md'), SNAPSHOT_NOTICE);
  return files.length;
}

function copyTrigAssets() {
  resetDir(snapshotTrigAssets);
  if (!existsSync(canonicalAssets)) return 0;
  const dirs = readdirSync(canonicalAssets).filter((name) => {
    const full = path.join(canonicalAssets, name);
    return /^M1-TR-\d+$/.test(name) && statSync(full).isDirectory();
  });
  let fileCount = 0;
  for (const d of dirs) {
    const srcDir = path.join(canonicalAssets, d);
    const destDir = path.join(snapshotTrigAssets, d);
    mkdirSync(destDir, { recursive: true });
    for (const f of readdirSync(srcDir)) {
      copyFileSync(path.join(srcDir, f), path.join(destDir, f));
      fileCount += 1;
    }
  }
  writeFileSync(path.join(snapshotTrigAssets, 'README.md'), SNAPSHOT_NOTICE);
  return fileCount;
}

const mdCount = copyMarkdown();
const assetCount = copyAssets();
const trigMdCount = copyTrigMarkdown();
const trigAssetCount = copyTrigAssets();
console.log(`同期完了: Markdown ${mdCount}件、asset ${assetCount}件（quadratic27）`);
console.log(`同期完了: Markdown ${trigMdCount}件、asset ${trigAssetCount}件（trig4・試験バッチ）`);
console.log('git status / git diff で差分を確認し、必要なら commit してください。');
