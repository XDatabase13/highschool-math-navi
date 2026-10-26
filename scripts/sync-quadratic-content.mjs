#!/usr/bin/env node
// 正本（隣接フォルダ math_db_quadratic_working/）から、Web公開用スナップショット
// （src/content/{quadratic27,trig4,dataAnalysis,expressionCalculation,setLogic,countingProbability}
// と各 *-assets）へコピーするだけの単純なスクリプト。
//
// - 正本ファイルは一切書き換えない（読み込むだけ）。
// - スナップショット側は毎回作り直す（削除→コピー）ので、正本から消えたファイルが
//   スナップショット側に残り続けることはない。
// - 正本フォルダが存在しないローカル以外の環境（GitHub Actions等）では実行できないため、
//   このスクリプトはローカルで正本を更新した人が手動で実行し、生成された差分をcommitする運用。
//   （astro buildの一部として自動実行はしない）
// - 正本Markdownは単元ごとのサブフォルダ（problems/M1-QF/M1-QF-001.md 等）に置かれている。
//   旧配置（problems/M1-QF-001.md）も読めるようにしてあるが、同じ問題が両方にあればエラーで止める。
// - 公開対象かどうか（verification_status）はここでは判定しない。未検算の問題もスナップショットへ
//   コピーし、公開範囲はbuild時の getVerifiedCollection（src/utils/verifiedCollection.ts）だけが決める。
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

// 問題IDの接頭辞（正本のサブフォルダ名・asset フォルダ名の接頭辞）と、
// Content Collection（src/content.config.ts）ごとのスナップショット先の対応表。
// 単元を追加するときはここへ1行足す。
const UNITS = [
  { prefix: 'M1-QF', collection: 'quadratic27', label: 'quadratic27' },
  // 三角比（M1-TR-001〜041）
  { prefix: 'M1-TR', collection: 'trig4', label: 'trig4・試験バッチ' },
  // データの分析（M1-DA-001〜023）
  { prefix: 'M1-DA', collection: 'dataAnalysis', label: 'dataAnalysis・試験バッチ' },
  // 数と式（M1-EC-001〜044）
  { prefix: 'M1-EC', collection: 'expressionCalculation', label: 'expressionCalculation・数と式' },
  // 集合と論証（M1-SL-001〜018）
  { prefix: 'M1-SL', collection: 'setLogic', label: 'setLogic・集合と論証' },
  // 数学A 場合の数・確率（MA-CP-001〜066）
  { prefix: 'MA-CP', collection: 'countingProbability', label: 'countingProbability・場合の数・確率' },
];

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

// 正本Markdownの一覧（ファイル名→フルパス）。単元サブフォルダと旧配置（直下）の両方を見る。
function listCanonicalMarkdown(prefix) {
  const pattern = new RegExp(`^${prefix}-\\d+\\.md$`);
  const found = new Map();
  const dirs = [path.join(canonicalProblems, prefix), canonicalProblems];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((name) => pattern.test(name))) {
      if (found.has(f)) {
        console.error(`正本Markdown ${f} が複数の場所にあります: ${found.get(f)} / ${path.join(dir, f)}`);
        process.exit(1);
      }
      found.set(f, path.join(dir, f));
    }
  }
  return found;
}

function copyMarkdown({ prefix, collection }) {
  const dest = path.join(repoRoot, 'src/content', collection);
  resetDir(dest);
  const files = listCanonicalMarkdown(prefix);
  for (const [f, src] of files) copyFileSync(src, path.join(dest, f));
  writeFileSync(path.join(dest, 'README.md'), SNAPSHOT_NOTICE);
  return files.size;
}

// 存在するassetフォルダ（assets/<問題ID>/）だけを対象にする
// （正本側の問題数が増減しても、このスクリプト自体は変更不要）。
function copyAssets({ prefix, collection }) {
  const dest = path.join(repoRoot, 'src/content', `${collection}-assets`);
  resetDir(dest);
  const pattern = new RegExp(`^${prefix}-\\d+$`);
  const dirs = readdirSync(canonicalAssets).filter(
    (name) => pattern.test(name) && statSync(path.join(canonicalAssets, name)).isDirectory(),
  );
  let fileCount = 0;
  for (const d of dirs) {
    const srcDir = path.join(canonicalAssets, d);
    const destDir = path.join(dest, d);
    mkdirSync(destDir, { recursive: true });
    for (const f of readdirSync(srcDir)) {
      copyFileSync(path.join(srcDir, f), path.join(destDir, f));
      fileCount += 1;
    }
  }
  writeFileSync(path.join(dest, 'README.md'), SNAPSHOT_NOTICE);
  return fileCount;
}

// 先に全単元の正本Markdownが見つかることを確認してから書き込む
// （正本の配置が変わって0件になった単元のスナップショットを黙って空にしない）。
for (const unit of UNITS) {
  if (listCanonicalMarkdown(unit.prefix).size === 0) {
    console.error(`正本Markdown（${unit.prefix}-*.md）が1件も見つかりません。スナップショットは変更していません。`);
    process.exit(1);
  }
}

for (const unit of UNITS) {
  const mdCount = copyMarkdown(unit);
  const assetCount = copyAssets(unit);
  console.log(`同期完了: Markdown ${mdCount}件、asset ${assetCount}件（${unit.label}）`);
}
console.log('git status / git diff で差分を確認し、必要なら commit してください。');
