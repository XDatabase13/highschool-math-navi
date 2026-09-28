#!/usr/bin/env node
// 型ページ（問題タイプ）の構造・本文を、正本（隣接フォルダ math_db_quadratic_working/）から
// Web公開用スナップショットへ同期・検証するスクリプト（仕様: type_page_implementation_spec_v1.1）。
//
// 入力（正本。読み込むだけで一切書き換えない）
//   - problem_master/*_problem_master.xlsx の「型ページ管理」「公開問題管理」
//   - type_pages/<型ページID>.md（公開本文・人間承認済みdescriptionの正本）
//   - problems/*.md（問題IDの存在・検算状態の確認用）
// 出力（Web repo内。直接編集禁止の生成物）
//   - src/data/type-pages.generated.json（正規化済み型構造）
//   - src/content/typePages/*.md ＋ README.md（型Markdownスナップショット）
//
// - xlsxはこのNode同期処理だけで読む（exceljsはdevDependency。Astro component・
//   client script・公開runtimeからはimportしない）。GitHub Actionsでは実行しない。
// - すべての検査が通った場合だけ、一時ディレクトリへ生成してから置換する
//   （途中失敗で既存の正常スナップショットを消さない）。
// - 出力はdeterministic（timestamp等は入れない）。
// - 型Markdownは0〜37件のどの状態でも（制作途中でも）検査に通ったものを同期する。
//   同期は公開を決めない。productionで型route・nav・sitemapを出すのは「published全37件の
//   Markdown」かつ「人間の公開承認（src/data/type-page-publication.ts）」がそろったときだけで、
//   その判定はbuild側（src/utils/typePages.ts）と監査（scripts/audit-type-pages.mjs）で行う。
//
// 使い方: npm run sync-type-pages（npm run sync-content からも問題同期の後に呼ばれる）

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import {
  TYPE_PAGE_UNITS,
  EXPECTED_PUBLISHED_TYPE_PAGE_COUNT,
  TYPE_PAGE_SNAPSHOT_SCHEMA_VERSION,
  TYPE_PAGE_SLUG_PATTERN,
  typePageUrl,
} from '../src/data/type-page-units.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
// SYNC_TYPE_PAGES_CANONICAL_ROOT / SYNC_TYPE_PAGES_OUT_ROOT は、異常系fixtureで同期が
// 失敗すること（および成功時の出力）を、正本・repoのスナップショットを
// 触らずに検証するためのテスト専用の上書き。通常運用では指定しない。
const canonicalRoot = path.resolve(
  process.env.SYNC_TYPE_PAGES_CANONICAL_ROOT ?? path.resolve(repoRoot, '../math_db_quadratic_working'),
);
const outRoot = path.resolve(process.env.SYNC_TYPE_PAGES_OUT_ROOT ?? repoRoot);
const canonicalMasterDir = path.join(canonicalRoot, 'problem_master');
const canonicalProblems = path.join(canonicalRoot, 'problems');
const canonicalTypePages = path.join(canonicalRoot, 'type_pages');

const outJson = path.join(outRoot, 'src/data/type-pages.generated.json');
const outMarkdownDir = path.join(outRoot, 'src/content/typePages');
// 置換前の一時出力先。node_modules/.cache はgit管理外かつ同一ドライブ（renameが使える）。
const tmpRoot = path.join(outRoot, 'node_modules/.cache/sync-type-pages');

const TYPE_SHEET = '型ページ管理';
const PROBLEM_SHEET = '公開問題管理';
const HEADER_ROW = 4;
const STATUS_MAP = { 採用: 'published', 保留: 'hold' };
const TYPE_ID_PATTERN = /^([A-Z]{2})-T(\d{2})$/;
const PROBLEM_ID_PATTERN = /^M1-([A-Z]{2})-\d{3}$/;
const PROBLEM_ID_IN_TEXT = /M1-[A-Z]{2}-\d{3}/;
const NO_TYPE_PAGE = 'なし';

const SNAPSHOT_NOTICE =
  '# 自動生成スナップショット（編集禁止）\n\n' +
  'このディレクトリの中身は、正本 `math_db_quadratic_working/type_pages/`（highschool_math_db の外）から\n' +
  '`npm run sync-type-pages`（scripts/sync-type-pages.mjs）でコピーしたものです。\n' +
  '同じ同期で `src/data/type-pages.generated.json`（型構造。正本はmaster xlsx）も生成されます。\n\n' +
  '直接編集しないでください。編集は正本側で行い、その後このコマンドで再同期してください。\n' +
  '制作途中（0〜36件）の型Markdownも同期されますが、productionで型ページを公開するのは\n' +
  '「published全37件がそろう」かつ「src/data/type-page-publication.ts で公開承認」のときだけです。\n';

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ---------------------------------------------------------------------------
// xlsx読取
// ---------------------------------------------------------------------------

// exceljsのセル値（文字列・数値・rich text・数式結果）を素のテキストへ。
function cellText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value.richText)) return value.richText.map((r) => r.text).join('');
  if ('result' in value) return cellText(value.result);
  if ('text' in value) return cellText(value.text);
  return String(value);
}

// ヘッダー行の見出し名で列を引く（列位置の暗黙依存をしない）。
function readSheetRows(workbook, sheetName, requiredHeaders, fileLabel) {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    fail(`${fileLabel}: シート「${sheetName}」がありません。`);
    return [];
  }
  const headerRow = sheet.getRow(HEADER_ROW);
  const columns = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const name = cellText(cell.value).trim();
    if (!name) return;
    if (name in columns) fail(`${fileLabel}「${sheetName}」: 見出し「${name}」が重複しています。`);
    columns[name] = col;
  });
  const missing = requiredHeaders.filter((h) => !(h in columns));
  if (missing.length > 0) {
    fail(`${fileLabel}「${sheetName}」: 見出し行(${HEADER_ROW}行目)に必須列がありません: ${missing.join('、')}`);
    return [];
  }
  const rows = [];
  for (let r = HEADER_ROW + 1; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    const record = { __row: r };
    let hasValue = false;
    for (const [name, col] of Object.entries(columns)) {
      const raw = row.getCell(col).value;
      record[name] = raw;
      if (cellText(raw).trim() !== '') hasValue = true;
    }
    if (hasValue) rows.push(record);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// 問題Markdown（正本・Webスナップショット）のfrontmatter確認
// ---------------------------------------------------------------------------

function readFrontmatterScalar(markdown, key) {
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return undefined;
  const line = fm[1].split(/\r?\n/).find((l) => l.startsWith(`${key}:`));
  if (!line) return undefined;
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
}

function problemFileState(dir, problemId) {
  const file = path.join(dir, `${problemId}.md`);
  if (!existsSync(file)) return { exists: false };
  const md = readFileSync(file, 'utf-8');
  return {
    exists: true,
    problemId: readFrontmatterScalar(md, 'problem_id'),
    verificationStatus: readFrontmatterScalar(md, 'verification_status'),
  };
}

// ---------------------------------------------------------------------------
// 型Markdownの検査（仕様 §3.4 自動エラー／warning）
// ---------------------------------------------------------------------------

const ALLOWED_FRONTMATTER_KEYS = ['type_page_id', 'description'];
const OVERVIEW_HEADING = '型の概要';
const markdownParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

// frontmatterは「key: 値」1行形式だけを受け付ける最小パーサー（複数行YAML・入れ子は不可）。
function parseTypeFrontmatter(markdown, label) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    fail(`${label}: frontmatter（--- で囲まれたブロック）がありません。`);
    return { data: {}, body: markdown };
  }
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) {
      fail(`${label}: frontmatterを解釈できない行があります（1行の「key: 値」形式にしてください）: ${line}`);
      continue;
    }
    const [, key, rawValue] = kv;
    let value = rawValue.trim();
    if (value.startsWith('"')) {
      try {
        value = JSON.parse(value);
      } catch {
        fail(`${label}: frontmatter「${key}」のダブルクォート文字列を解釈できません。`);
      }
    } else if (value.startsWith("'")) {
      if (!value.endsWith("'") || value.length < 2) fail(`${label}: frontmatter「${key}」のシングルクォートが閉じていません。`);
      value = value.slice(1, -1).replace(/''/g, "'");
    }
    if (key in data) fail(`${label}: frontmatter「${key}」が重複しています。`);
    data[key] = value;
  }
  const keys = Object.keys(data);
  const missing = ALLOWED_FRONTMATTER_KEYS.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !ALLOWED_FRONTMATTER_KEYS.includes(k));
  if (missing.length > 0) fail(`${label}: frontmatterに必須keyがありません: ${missing.join(', ')}`);
  if (extra.length > 0) fail(`${label}: frontmatterに許可されていないkeyがあります: ${extra.join(', ')}`);
  return { data, body: markdown.slice(match[0].length) };
}

const FORBIDDEN_NODE_TYPES = {
  list: '箇条書き',
  listItem: '箇条書き',
  table: '表',
  image: '画像',
  imageReference: '画像',
  html: '生HTML',
};
const ALLOWED_NODE_TYPES = new Set([
  'root', 'heading', 'paragraph', 'text', 'strong', 'emphasis', 'inlineMath', 'break',
]);

function validateTypeMarkdown(markdown, expectedId, label) {
  const { data, body } = parseTypeFrontmatter(markdown, label);
  if (data.type_page_id !== undefined && data.type_page_id !== expectedId) {
    fail(`${label}: filenameと type_page_id（${data.type_page_id}）が一致しません。`);
  }
  if (typeof data.description === 'string' && data.description.trim() === '') {
    fail(`${label}: description が空です。`);
  }
  if (body.trim() === '') fail(`${label}: 本文が空です。`);
  if (/\[asset:/.test(body)) fail(`${label}: asset記法（[asset: ...]）は使えません。`);
  if (PROBLEM_ID_IN_TEXT.test(body)) fail(`${label}: 本文に問題ID（M1-XX-999形式）が含まれています。`);

  const tree = markdownParser.parse(body);
  let overviewCount = 0;
  const reported = new Set();
  const walk = (node) => {
    if (node.type === 'heading') {
      const text = (node.children ?? []).map((c) => c.value ?? '').join('').trim();
      if (node.depth === 2 && text === OVERVIEW_HEADING) overviewCount += 1;
      else fail(`${label}: 「## ${OVERVIEW_HEADING}」以外の見出しがあります（H1・追加見出しは不可）: ${'#'.repeat(node.depth)} ${text}`);
    } else if (FORBIDDEN_NODE_TYPES[node.type]) {
      const name = FORBIDDEN_NODE_TYPES[node.type];
      if (!reported.has(name)) fail(`${label}: ${name}は使えません。`);
      reported.add(name);
    } else if (!ALLOWED_NODE_TYPES.has(node.type) && !reported.has(node.type)) {
      warn(`${label}: 基本外のMarkdown要素（${node.type}）があります。人間レビューで確認してください。`);
      reported.add(node.type);
    }
    (node.children ?? []).forEach(walk);
  };
  walk(tree);
  if (overviewCount === 0) fail(`${label}: 「## ${OVERVIEW_HEADING}」がありません。`);
  if (overviewCount > 1) fail(`${label}: 「## ${OVERVIEW_HEADING}」が重複しています。`);
  const firstHeadingIndex = tree.children.findIndex((n) => n.type === 'heading');
  if (firstHeadingIndex > 0) fail(`${label}: 「## ${OVERVIEW_HEADING}」より前に本文があります。`);

  // 文の数は句点カウントによる補助的なwarningのみ（最終判定は人間）。
  const overviewText = body.replace(/^##[^\n]*\n/m, '');
  const sentences = (overviewText.match(/。/g) ?? []).length;
  if (sentences < 2 || sentences > 4) {
    warn(`${label}: 型の概要の句点が${sentences}個です（目安2〜4文）。人間レビューで確認してください。`);
  }
  return { data, body };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  if (!existsSync(canonicalMasterDir) || !existsSync(canonicalProblems)) {
    console.error(`正本フォルダが見つかりません: ${canonicalRoot}`);
    console.error('このスクリプトは正本が存在するローカル環境専用です（GitHub Actions等では実行不要）。');
    process.exit(1);
  }

  const typePages = [];
  const urlOwners = new Map();

  for (const unit of TYPE_PAGE_UNITS) {
    const masterPath = path.join(canonicalMasterDir, unit.masterFile);
    const label = unit.masterFile;
    if (!existsSync(masterPath)) {
      fail(`${label}: masterファイルがありません。`);
      continue;
    }
    const workbook = new ExcelJS.Workbook();
    // 既存masterの一部はテーブル定義のrelsを絶対パス（/xl/tables/...）で持っており、
    // exceljsはそれを解決できずに読込自体が失敗する。型同期はテーブル定義を使わないため、
    // tablePartsだけを読み飛ばす（セル値の読取には影響しない。masterは書き換えない）。
    await workbook.xlsx.readFile(masterPath, { ignoreNodes: ['tableParts'] });

    const typeRows = readSheetRows(
      workbook,
      TYPE_SHEET,
      ['型ページID', '公開名', 'slug', '主検索キーワード', '対象問題ID', '状態', '表示順'],
      label,
    );
    const problemRows = readSheetRows(
      workbook,
      PROBLEM_SHEET,
      ['problem_id', '型ページID', '型ページ名', '型ページ内役割', '副所属型ページ（ID：役割）'],
      label,
    );

    // --- 公開問題管理（所属・役割の最終正本） ---
    const unitProblemIds = new Set();
    const membershipsFromProblems = new Map(); // typeId -> Map(problemId -> {membership, role, typeName})
    const addProblemSide = (typeId, problemId, entry, where) => {
      const map = membershipsFromProblems.get(typeId) ?? new Map();
      if (map.has(problemId)) fail(`${where}: ${problemId} が ${typeId} に重複して所属しています。`);
      map.set(problemId, entry);
      membershipsFromProblems.set(typeId, map);
    };
    for (const row of problemRows) {
      const where = `${label}「${PROBLEM_SHEET}」${row.__row}行目`;
      const problemId = cellText(row.problem_id).trim();
      if (!PROBLEM_ID_PATTERN.test(problemId) || problemId.split('-')[1] !== unit.problemPrefix) {
        fail(`${where}: problem_id「${problemId}」が単元（${unit.problemPrefix}）の問題ID形式ではありません。`);
        continue;
      }
      if (unitProblemIds.has(problemId)) fail(`${where}: problem_id ${problemId} が重複しています。`);
      unitProblemIds.add(problemId);

      const primaryTypeId = cellText(row['型ページID']).trim();
      if (primaryTypeId && primaryTypeId !== NO_TYPE_PAGE) {
        const role = cellText(row['型ページ内役割']).trim();
        if (!role) fail(`${where}: ${problemId} の型ページ内役割が空です。`);
        addProblemSide(
          primaryTypeId,
          problemId,
          { membership: 'primary', role, typeName: cellText(row['型ページ名']).trim() },
          where,
        );
      } else if (!primaryTypeId) {
        fail(`${where}: ${problemId} の型ページIDが空です（所属なしの場合は「${NO_TYPE_PAGE}」と記載）。`);
      }

      const secondaryText = cellText(row['副所属型ページ（ID：役割）']).trim();
      if (secondaryText) {
        for (const line of secondaryText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
          const m = line.match(/^([A-Z]{2}-T\d{2})：(.*)$/);
          if (!m) {
            fail(`${where}: 副所属「${line}」を「型ページID：役割」として解釈できません。`);
            continue;
          }
          const role = m[2].trim();
          if (!role) fail(`${where}: ${problemId} の副所属 ${m[1]} の役割が空です。`);
          addProblemSide(m[1], problemId, { membership: 'secondary', role, typeName: null }, where);
        }
      }
    }

    // --- 型ページ管理 ---
    const seenTypeIds = new Set();
    const slugs = new Map();
    const displayOrders = new Map();
    for (const row of typeRows) {
      const where = `${label}「${TYPE_SHEET}」${row.__row}行目`;
      const id = cellText(row['型ページID']).trim();
      const idMatch = id.match(TYPE_ID_PATTERN);
      if (!idMatch || idMatch[1] !== unit.problemPrefix) {
        fail(`${where}: 型ページID「${id}」が単元（${unit.problemPrefix}-Tnn）の形式ではありません。`);
        continue;
      }
      if (seenTypeIds.has(id)) fail(`${where}: 型ページID ${id} が重複しています。`);
      seenTypeIds.add(id);

      const name = cellText(row['公開名']).trim();
      if (!name) fail(`${where}: ${id} の公開名が空です。`);

      const slug = cellText(row.slug).trim();
      if (!TYPE_PAGE_SLUG_PATTERN.test(slug)) fail(`${where}: ${id} のslug「${slug}」が形式（小文字英数字と単一ハイフン）に合いません。`);
      if (slugs.has(slug)) fail(`${where}: slug「${slug}」が単元内で重複しています（${slugs.get(slug)}）。`);
      slugs.set(slug, id);
      // 型slugと既存問題slug（問題ID）・予約routeとの衝突
      if (/^m1-/i.test(slug) || slug === 'index') fail(`${where}: slug「${slug}」が既存問題URL・予約routeと衝突します。`);

      const statusRaw = cellText(row['状態']).trim();
      const status = STATUS_MAP[statusRaw];
      if (!status) fail(`${where}: ${id} の状態「${statusRaw}」は未知の値です（採用／保留のみ）。`);

      // 表示順：masterの明示値だけを使う（行順・IDから補完しない）。
      const orderRaw = row['表示順'];
      const orderText = cellText(orderRaw).trim();
      const displayOrder = typeof orderRaw === 'number' ? orderRaw : Number(orderText);
      if (orderText === '' || !Number.isInteger(displayOrder) || displayOrder <= 0) {
        fail(`${where}: ${id} の表示順「${orderText}」が正の整数ではありません（欠落・非整数は不可）。`);
      } else if (displayOrders.has(displayOrder)) {
        fail(`${where}: 表示順 ${displayOrder} が単元内で重複しています（${displayOrders.get(displayOrder)}）。`);
      } else {
        displayOrders.set(displayOrder, id);
      }

      const primaryKeyword = cellText(row['主検索キーワード']).trim();
      if (!primaryKeyword) fail(`${where}: ${id} の主検索キーワードが空です。`);

      // 対象問題ID（型ページ管理側）
      const typeSide = new Map();
      for (const token of cellText(row['対象問題ID']).split(/\r?\n/).map((t) => t.trim()).filter(Boolean)) {
        const m = token.match(/^(M1-[A-Z]{2}-\d{3})(\(副\))?$/);
        if (!m) {
          fail(`${where}: 対象問題ID「${token}」を解釈できません。`);
          continue;
        }
        if (typeSide.has(m[1])) fail(`${where}: 対象問題ID ${m[1]} が重複しています。`);
        typeSide.set(m[1], m[2] ? 'secondary' : 'primary');
      }

      // 双方向照合（型ページ管理 ⇔ 公開問題管理）
      const problemSide = membershipsFromProblems.get(id) ?? new Map();
      for (const [problemId, membership] of typeSide) {
        const other = problemSide.get(problemId);
        if (!other) {
          fail(`${where}: ${id} の対象問題 ${problemId}${membership === 'secondary' ? '(副)' : ''} が「${PROBLEM_SHEET}」側にありません。`);
        } else if (other.membership !== membership) {
          fail(`${where}: ${id} と ${problemId} の主副（型ページ管理: ${membership} / 公開問題管理: ${other.membership}）が一致しません。`);
        }
      }
      for (const [problemId, other] of problemSide) {
        if (!typeSide.has(problemId)) {
          fail(`${label}: 「${PROBLEM_SHEET}」で ${problemId} が ${id}（${other.membership}）に所属していますが、「${TYPE_SHEET}」の対象問題IDにありません。`);
        }
        if (other.membership === 'primary' && other.typeName !== name) {
          fail(`${label}: ${problemId} の型ページ名「${other.typeName}」が ${id} の公開名「${name}」と一致しません。`);
        }
        if (!unitProblemIds.has(problemId)) fail(`${label}: ${id} の対象問題 ${problemId} が「${PROBLEM_SHEET}」に存在しません。`);
      }

      const problems = [...problemSide.entries()]
        .filter(([problemId]) => typeSide.has(problemId))
        .map(([problemId, v]) => ({ problemId, membership: v.membership, role: v.role }))
        // JSON内の順序はdeterministicにするため問題ID昇順。表示順はbuild側でdisplay_orderから決める。
        .sort((a, b) => a.problemId.localeCompare(b.problemId));
      if (problems.length === 0) fail(`${where}: ${id} の所属問題が0件です。`);
      if (!problems.some((p) => p.membership === 'primary')) fail(`${where}: ${id} にprimary（主所属）問題がありません。`);

      // 問題の存在・検算状態（master・教材正本・Webスナップショット）
      for (const p of problems) {
        const canonical = problemFileState(canonicalProblems, p.problemId);
        const snapshot = problemFileState(path.join(repoRoot, 'src/content', unit.collection), p.problemId);
        if (!canonical.exists) fail(`${id}: 問題 ${p.problemId} の教材正本Markdownがありません。`);
        if (!snapshot.exists) fail(`${id}: 問題 ${p.problemId} のWeb問題スナップショット（src/content/${unit.collection}）がありません。`);
        if (status === 'published') {
          for (const [where2, state] of [['教材正本', canonical], ['Webスナップショット', snapshot]]) {
            if (state.exists && state.verificationStatus !== '独立検算済み') {
              fail(`${id}（published）: 問題 ${p.problemId} が${where2}で独立検算済みではありません（${state.verificationStatus}）。`);
            }
          }
        }
      }

      const url = typePageUrl(unit, slug);
      if (urlOwners.has(url)) fail(`${id}: URL ${url} が ${urlOwners.get(url)} と重複しています。`);
      urlOwners.set(url, id);

      typePages.push({
        id,
        unitId: unit.unitId,
        name,
        slug,
        status: status ?? 'hold',
        displayOrder,
        primaryKeyword,
        problems,
      });
    }

    // 公開問題管理にだけある型ページID（型ページ管理に行がない）
    for (const typeId of membershipsFromProblems.keys()) {
      if (!seenTypeIds.has(typeId)) fail(`${label}: 「${PROBLEM_SHEET}」が参照する型ページ ${typeId} が「${TYPE_SHEET}」にありません。`);
    }
  }

  // 型ページIDの全体一意性
  const allIds = new Set();
  for (const t of typePages) {
    if (allIds.has(t.id)) fail(`型ページID ${t.id} が全体で重複しています。`);
    allIds.add(t.id);
  }

  const published = typePages.filter((t) => t.status === 'published');
  if (published.length !== EXPECTED_PUBLISHED_TYPE_PAGE_COUNT) {
    fail(`published（採用）型ページが${published.length}件です（初版の一括公開監査では${EXPECTED_PUBLISHED_TYPE_PAGE_COUNT}件固定）。`);
  }

  // --- 型Markdown（正本） ---
  const markdownFiles = existsSync(canonicalTypePages)
    ? readdirSync(canonicalTypePages).filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    : [];
  const markdownById = new Map();
  for (const file of markdownFiles) {
    const label = `type_pages/${file}`;
    const id = file.replace(/\.md$/, '');
    const record = typePages.find((t) => t.id === id);
    if (!record) {
      fail(`${label}: masterに存在しない型ページIDのMarkdownです（orphan）。`);
      continue;
    }
    const markdown = readFileSync(path.join(canonicalTypePages, file), 'utf-8');
    validateTypeMarkdown(markdown, id, label);
    if (record.status === 'published') markdownById.set(id, markdown);
  }

  // 制作途中（0〜36件）でも同期してよい。完了状況は報告だけ（公開判定はbuild側）。
  const missing = published.filter((t) => !markdownById.has(t.id)).map((t) => t.id);

  for (const w of warnings) console.warn(`[warning] ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`[error] ${e}`);
    console.error(`\n型ページ同期を中止しました（エラー${errors.length}件）。既存のスナップショットは変更していません。`);
    process.exit(1);
  }

  // --- 生成（一時ディレクトリ → 成功時に置換） ---
  const unitOrder = new Map(TYPE_PAGE_UNITS.map((u, i) => [u.unitId, i]));
  typePages.sort((a, b) => unitOrder.get(a.unitId) - unitOrder.get(b.unitId) || a.displayOrder - b.displayOrder);
  const snapshot = { schemaVersion: TYPE_PAGE_SNAPSHOT_SCHEMA_VERSION, typePages };

  rmSync(tmpRoot, { recursive: true, force: true });
  const tmpMarkdownDir = path.join(tmpRoot, 'typePages');
  mkdirSync(tmpMarkdownDir, { recursive: true });
  const tmpJson = path.join(tmpRoot, 'type-pages.generated.json');
  writeFileSync(tmpJson, `${JSON.stringify(snapshot, null, 2)}\n`);
  writeFileSync(path.join(tmpMarkdownDir, 'README.md'), SNAPSHOT_NOTICE);
  for (const [id, markdown] of [...markdownById.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    writeFileSync(path.join(tmpMarkdownDir, `${id}.md`), markdown);
  }

  const backupDir = path.join(tmpRoot, 'typePages.previous');
  if (existsSync(outMarkdownDir)) renameSync(outMarkdownDir, backupDir);
  try {
    renameSync(tmpMarkdownDir, outMarkdownDir);
    renameSync(tmpJson, outJson);
  } catch (error) {
    // 置換途中で失敗した場合は元のMarkdownスナップショットを戻す（JSONは最後に置換するため未変更）。
    if (existsSync(outMarkdownDir)) rmSync(outMarkdownDir, { recursive: true, force: true });
    if (existsSync(backupDir)) renameSync(backupDir, outMarkdownDir);
    throw error;
  }
  rmSync(tmpRoot, { recursive: true, force: true });

  const holdCount = typePages.length - published.length;
  const relations = typePages.reduce((n, t) => n + t.problems.length, 0);
  const secondary = typePages.reduce((n, t) => n + t.problems.filter((p) => p.membership === 'secondary').length, 0);
  console.log(
    `型ページ同期完了: ${typePages.length}型（published ${published.length}・hold ${holdCount}）、` +
      `所属${relations}件（主${relations - secondary}・副${secondary}）`,
  );
  console.log(`型Markdown: ${markdownById.size}/${published.length}件を同期しました。`);
  console.log(
    missing.length === 0
      ? '  published全件そろっています。productionでの公開は、人間の公開承認（src/data/type-page-publication.ts）後だけです。'
      : `  未作成 ${missing.length}件（productionでは型ページを1件も公開しません。devではMarkdownがある型をローカル確認できます）。`,
  );
  const holdMarkdown = markdownFiles.filter((f) =>
    typePages.some((t) => `${t.id}.md` === f && t.status !== 'published'),
  );
  if (holdMarkdown.length > 0) console.log(`  hold型のMarkdown（同期対象外）: ${holdMarkdown.join(', ')}`);
  console.log('git status / git diff で差分を確認し、必要なら commit してください。');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
