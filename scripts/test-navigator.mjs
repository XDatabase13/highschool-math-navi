#!/usr/bin/env node
// 4×4ナビゲーションのロジックテスト（buildなしで実行できる。正本フォルダは不要）。
//
//   npm run test-navigator
//
// repo内の公開用スナップショット（src/content/<collection>/*.md のfrontmatter）を読み、
// ページと同じ純粋関数（src/utils/navigatorCore.ts・navigatorStore.ts・navigatorLink.ts）で
// 候補データ・範囲集計・16マス・抽出・並び順・状態のencode/decode・保存を検証する。
// 期待値は、このファイル内でfrontmatterから別途数え直したものと突き合わせる。
// build後の成果物（sitemap・canonical・robots等）は scripts/audit-navigator.mjs が検査する。

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbSubjectNav } from '../src/data/subjects.ts';
import { NAVIGATOR_SUBJECTS } from '../src/data/navigator-config.ts';
import {
  ALL_CELLS,
  IMPORTANCE_LEVELS,
  autoSettingName,
  buildDbModeView,
  buildNavData,
  canExtract,
  candidateProblems,
  cellKey,
  cellsSummary,
  countCells,
  createNavIndex,
  emptyState,
  encodeCells,
  encodeRange,
  extractProblems,
  firstResultHref,
  normalizeState,
  parseStateString,
  problemHref,
  rangeSummary,
  resolveDbModeStart,
  selectCells,
  serializeState,
  setSectionSelected,
  setSubjectSelected,
  setUnitSelected,
  toggleCell,
  unitBreakdown,
  withSections,
} from '../src/utils/navigatorCore.ts';
import {
  MAX_SAVED_SETTINGS,
  MAX_SETTING_NAME_LENGTH,
  NAV_STORAGE_KEY,
  cleanSettingName,
  createNavStore,
  resolveInitialState,
} from '../src/utils/navigatorStore.ts';
import { isNavModeEntry, isStateStringShape, looksLikeNavFragment, navEditHref } from '../src/utils/navigatorLink.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
let passes = 0;

function check(name, condition, detail = '') {
  if (condition) passes += 1;
  else failures += 1;
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function throws(fn, pattern) {
  try {
    fn();
    return false;
  } catch (error) {
    return pattern ? pattern.test(String(error.message)) : true;
  }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------------------------------------------------------
// frontmatterの読込（ページ側は astro:content 経由。ここでは同じ項目を最小パーサーで読む）
// ---------------------------------------------------------------------------
const EXPECTED_PROBLEMS = 180;
const EXPECTED_UNITS = 5;
const EXPECTED_SECTIONS = 22;

function readFrontmatter(file) {
  const text = readFileSync(file, 'utf-8');
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const data = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return data;
}

function loadEntries() {
  const entries = [];
  for (const subject of NAVIGATOR_SUBJECTS) {
    for (const unit of subject.units) {
      const dir = path.join(repoRoot, 'src/content', unit.collection);
      for (const file of readdirSync(dir).filter((name) => /^M1-[A-Z]{2}-\d{3}\.md$/.test(name)).sort()) {
        const fm = readFrontmatter(path.join(dir, file));
        if (fm.verification_status !== '独立検算済み') continue;
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
  }
  return entries;
}

const entries = loadEntries();
const data = buildNavData(NAVIGATOR_SUBJECTS, dbSubjectNav, entries);
const index = createNavIndex(data);
const entryById = new Map(entries.map((entry) => [entry.id, entry]));

// frontmatterだけから数え直す、独立した期待値（navigatorCoreの関数を使わない）。
const unitOrder = dbSubjectNav.flatMap((subject) => subject.units.map((unit) => unit.name));
const sectionIdOf = (entry) =>
  NAVIGATOR_SUBJECTS.flatMap((s) => s.units)
    .find((u) => u.collection === entry.collection)
    .sections.find((s) => s.section === entry.section)?.id;
function expectedIds(sectionIds, cells) {
  const sections = new Set(sectionIds);
  const cellSet = cells ? new Set(cells) : null;
  return entries
    .filter((e) => sections.has(sectionIdOf(e)))
    .filter((e) => !cellSet || cellSet.has(`${e.importance}${e.difficulty}`))
    .sort((a, b) => unitOrder.indexOf(a.unit) - unitOrder.indexOf(b.unit) || a.display_order - b.display_order)
    .map((e) => e.id);
}

// 決定的な擬似乱数（テストを再現可能にする）。
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
const random = rng(20260930);
const pick = (list, probability) => list.filter(() => random() < probability);

// ---------------------------------------------------------------------------
// 1. 候補データ
// ---------------------------------------------------------------------------
{
  const ids = index.problems.map((p) => p.id);
  check('候補: 公開180問が一度ずつ読み込まれる', ids.length === EXPECTED_PROBLEMS && new Set(ids).size === EXPECTED_PROBLEMS, `${ids.length}問`);
  check('候補: すべてM1-XX-999形式の問題ID', ids.every((id) => /^M1-[A-Z]{2}-\d{3}$/.test(id)));

  const units = index.subjects.flatMap((s) => s.units);
  check('候補: 5単元・22 section', units.length === EXPECTED_UNITS && index.sectionIds.length === EXPECTED_SECTIONS, `${units.length}単元・${index.sectionIds.length} section`);
  check(
    '候補: 単元順がdbSubjectNavと一致する',
    same(units.map((u) => u.name), unitOrder) && same(units.map((u) => u.href), dbSubjectNav.flatMap((s) => s.units.map((u) => u.href))),
  );

  // 全問題が5単元・22 sectionのいずれか1つに属し、sectionごとの合計が180になる。
  const perSection = index.sectionIds.map((id) => candidateProblems(index, [id]).length);
  check('候補: sectionごとの合計が180問', perSection.reduce((a, b) => a + b, 0) === EXPECTED_PROBLEMS && perSection.every((n) => n > 0));
  check('候補: 全問題が設定済みのsectionに属する', index.problems.every((p) => index.sectionInfo.has(p.sectionId) && index.unitInfo.has(p.unitId)));

  // ナビ設定のsectionが、現行frontmatterのsection（collectionごと）と過不足なく一致する。
  const frontmatterSections = new Set(entries.map((e) => `${e.collection}|${e.section}`));
  const configSections = new Set(NAVIGATOR_SUBJECTS.flatMap((s) => s.units.flatMap((u) => u.sections.map((sec) => `${u.collection}|${sec.section}`))));
  check('候補: ナビ設定の22 sectionが現行frontmatterと一致する', frontmatterSections.size === EXPECTED_SECTIONS && same([...frontmatterSections].sort(), [...configSections].sort()));

  // sectionの並びが、各単元のdisplay_orderでの初出順と一致する。
  const firstAppearance = NAVIGATOR_SUBJECTS.flatMap((s) => s.units).map((u) => {
    const ordered = entries.filter((e) => e.collection === u.collection).sort((a, b) => a.display_order - b.display_order);
    return [...new Set(ordered.map((e) => e.section))];
  });
  check('候補: sectionの並びがdisplay_orderの初出順と一致する', same(firstAppearance, NAVIGATOR_SUBJECTS.flatMap((s) => s.units).map((u) => u.sections.map((sec) => sec.section))));

  // 重要度・難易度は正本frontmatterの値そのまま（4×4側で上書きしない）。
  check(
    '候補: 重要度・難易度・sectionがfrontmatterと一致する',
    index.problems.every((p) => {
      const e = entryById.get(p.id);
      return e.importance === p.importance && e.difficulty === p.difficulty && sectionIdOf(e) === p.sectionId && p.cell === cellKey(e.importance, e.difficulty);
    }),
  );
}

// ---------------------------------------------------------------------------
// 2. 不正データの検出
// ---------------------------------------------------------------------------
{
  const base = entries[0];
  const withEntry = (patch) => () => buildNavData(NAVIGATOR_SUBJECTS, dbSubjectNav, [{ ...base, ...patch }, ...entries.slice(1)]);
  check('不正値: 重要度5を検出', throws(withEntry({ importance: 5 }), /重要度/));
  check('不正値: 重要度0を検出', throws(withEntry({ importance: 0 }), /重要度/));
  check('不正値: 重要度2.5を検出', throws(withEntry({ importance: 2.5 }), /重要度/));
  check('不正値: 重要度NaNを検出', throws(withEntry({ importance: Number.NaN }), /重要度/));
  check('不正値: 重要度ラベルの不一致を検出', throws(withEntry({ importance_label: base.importance_label === '余力' ? '土台' : '余力' }), /重要度ラベル/));
  check('不正値: 未知の重要度ラベルを検出', throws(withEntry({ importance_label: '最重要' }), /重要度ラベル/));
  check('不正値: 難易度0を検出', throws(withEntry({ difficulty: 0 }), /難易度/));
  check('不正値: 難易度5を検出', throws(withEntry({ difficulty: 5 }), /難易度/));
  check('不正値: 難易度1.5を検出', throws(withEntry({ difficulty: 1.5 }), /難易度/));
  check('不正値: 未知のsectionを検出', throws(withEntry({ section: '存在しないsection' }), /section/));
  check('不正値: 単元名の不一致を検出', throws(withEntry({ unit: '別の単元' }), /科目・単元/));
  check('不正値: 未知のcollectionを検出', throws(withEntry({ collection: 'unknown' }), /collection/));
  check('不正値: 問題IDの重複を検出', throws(() => buildNavData(NAVIGATOR_SUBJECTS, dbSubjectNav, [...entries, entries[0]]), /重複/));

  const cloneConfig = () => JSON.parse(JSON.stringify(NAVIGATOR_SUBJECTS));
  const withConfig = (mutate) => () => {
    const config = cloneConfig();
    mutate(config);
    return buildNavData(config, dbSubjectNav, entries);
  };
  check('設定: IDの重複を検出', throws(withConfig((c) => { c[0].units[1].sections[0].id = c[0].units[0].sections[0].id; }), /重複/));
  check('設定: 不正な形式のIDを検出', throws(withConfig((c) => { c[0].units[0].sections[0].id = 'EC-1'; }), /使えません/));
  check('設定: 予約語allのIDを検出', throws(withConfig((c) => { c[0].units[0].id = 'all'; }), /使えません/));
  check('設定: 問題が0件のsectionを検出', throws(withConfig((c) => { c[0].units[0].sections.push({ id: 'ec9', section: '空のsection' }); }), /問題がありません/));
  check('設定: 単元の不足を検出', throws(withConfig((c) => { c[0].units.pop(); }), /対応する設定がありません|collection/));
  check('設定: dbSubjectNavにない単元を検出', throws(withConfig((c) => { c[0].units[0].dbUnitId = 'unknown-unit'; }), /dbSubjectNav/));
  check('設定: dbSubjectNavにない科目を検出', throws(withConfig((c) => { c.push({ id: 'ma', name: '数学A', units: [] }); }), /dbSubjectNav/));
}

// ---------------------------------------------------------------------------
// 3. 範囲集計と16マス
// ---------------------------------------------------------------------------
const allSections = index.sectionIds;
const rangesToTest = [
  [],
  allSections,
  ...allSections.map((id) => [id]),
  ...index.subjects.flatMap((s) => s.units.map((u) => u.sections.map((sec) => sec.id))),
  ...Array.from({ length: 200 }, () => pick(allSections, 0.1 + random() * 0.8)),
];
{
  let sumOk = true;
  let candidateOk = true;
  for (const range of rangesToTest) {
    const candidates = candidateProblems(index, range);
    const counts = countCells(candidates);
    const total = ALL_CELLS.reduce((sum, cell) => sum + counts[cell], 0);
    if (total !== candidates.length) sumOk = false;
    if (!same(candidates.map((p) => p.id), expectedIds(range))) candidateOk = false;
  }
  check(`範囲集計: 16マスの合計が候補問題数と一致する（${rangesToTest.length}通りの範囲）`, sumOk);
  check('範囲集計: 候補問題がfrontmatterからの数え直しと一致する', candidateOk);
  check('範囲集計: 範囲が空なら全マス0問', ALL_CELLS.every((cell) => countCells(candidateProblems(index, []))[cell] === 0));
  const allCounts = countCells(candidateProblems(index, allSections));
  const expectedAll = {};
  for (const cell of ALL_CELLS) expectedAll[cell] = entries.filter((e) => `${e.importance}${e.difficulty}` === cell).length;
  check('範囲集計: 全範囲の16マスがfrontmatterからの数え直しと一致する', same(allCounts, expectedAll));
  check('範囲集計: 16マスは重要度4→1×難易度1→4', ALL_CELLS.length === 16 && ALL_CELLS[0] === '41' && ALL_CELLS[3] === '44' && ALL_CELLS[15] === '14' && same(IMPORTANCE_LEVELS.map((l) => l.label), ['土台', '本命', '次点', '余力']));
}

// ---------------------------------------------------------------------------
// 4. 抽出と並び順
// ---------------------------------------------------------------------------
{
  let extractOk = true;
  let sumOk = true;
  let uniqueOk = true;
  let orderOk = true;
  for (const range of rangesToTest) {
    const counts = countCells(candidateProblems(index, range));
    for (let i = 0; i < 4; i += 1) {
      const cells = pick(ALL_CELLS, 0.15 + random() * 0.7).filter((cell) => counts[cell] > 0);
      const result = extractProblems(index, { sections: range, cells });
      const ids = result.map((p) => p.id);
      if (!same(ids, expectedIds(range, cells))) extractOk = false;
      if (ids.length !== cells.reduce((sum, cell) => sum + counts[cell], 0)) sumOk = false;
      if (new Set(ids).size !== ids.length) uniqueOk = false;
      for (let k = 1; k < result.length; k += 1) if (result[k - 1].pos >= result[k].pos) orderOk = false;
    }
  }
  check('抽出: 結果がfrontmatterからの数え直しと一致する（範囲×セルの組合せ）', extractOk);
  check('抽出: 選択セルの件数の和と結果件数が一致する', sumOk);
  check('抽出: 結果に問題IDの重複がない', uniqueOk);
  check('並び順: 科目 → dbSubjectNavの単元順 → display_order', orderOk);

  // 複数単元・複数sectionを跨ぐ抽出（集合と論証 全体＋二次関数の3 section）。
  const cross = ['sl1', 'sl2', 'qf1', 'qf3', 'qf7'];
  const crossCells = ['41', '42', '43', '31', '32', '33'];
  const crossResult = extractProblems(index, normalizeState(index, cross, crossCells).state);
  const crossExpected = expectedIds(cross, crossCells);
  check('抽出: 集合と論証＋二次関数の横断選択', crossResult.length > 0 && same(crossResult.map((p) => p.id), crossExpected), `${crossResult.length}問`);
  check(
    '並び順: 横断選択で集合と論証が二次関数より先・単元内はdisplay_order昇順',
    crossResult.findLastIndex((p) => p.unitId === 'sl') < crossResult.findIndex((p) => p.unitId === 'qf') &&
      ['sl', 'qf'].every((unitId) => {
        const orders = crossResult.filter((p) => p.unitId === unitId).map((p) => p.order);
        return orders.every((order, i) => i === 0 || orders[i - 1] < order);
      }),
  );
  check('並び順: 範囲の指定順に依存しない', same(extractProblems(index, normalizeState(index, [...cross].reverse(), [...crossCells].reverse()).state).map((p) => p.id), crossExpected));
  check('抽出: 同じsectionを重ねて指定しても重複しない', same(extractProblems(index, normalizeState(index, ['qf', 'qf1', 'qf1', 'm1'], ['all', '41']).state).map((p) => p.id), expectedIds(allSections)));

  const breakdown = unitBreakdown(index, crossResult);
  check('抽出: 単元ごとの内訳の合計が結果件数と一致する', breakdown.reduce((sum, row) => sum + row.count, 0) === crossResult.length && same(breakdown.map((r) => r.unitId), ['sl', 'qf']));
}

// 将来の数学A（科目追加・科目横断）を、同じ関数が設定の追加だけで扱えること。
{
  const futureDb = [...dbSubjectNav, { name: '数学A', units: [{ id: 'probability', name: '場合の数と確率', href: '/mathA/probability/' }] }];
  const futureConfig = [
    ...NAVIGATOR_SUBJECTS,
    { id: 'ma', name: '数学A', units: [{ id: 'pr', dbUnitId: 'probability', collection: 'probability', sections: [{ id: 'pr1', section: '場合の数' }, { id: 'pr2', section: '確率' }] }] },
  ];
  const futureEntries = [
    ...entries,
    { collection: 'probability', id: 'MA-PR-002', subject: '数学A', unit: '場合の数と確率', section: '確率', display_order: 2, importance: 3, importance_label: '本命', difficulty: 2 },
    { collection: 'probability', id: 'MA-PR-001', subject: '数学A', unit: '場合の数と確率', section: '場合の数', display_order: 1, importance: 4, importance_label: '土台', difficulty: 1 },
  ];
  const futureIndex = createNavIndex(buildNavData(futureConfig, futureDb, futureEntries));
  const state = normalizeState(futureIndex, ['ma', 'sl'], ['all']).state;
  const result = extractProblems(futureIndex, state).map((p) => p.id);
  check('拡張: 数学I＋数学Aの同時選択で科目順に並ぶ', same(result, [...expectedIds(['sl1', 'sl2']), 'MA-PR-001', 'MA-PR-002']));
  check('拡張: 科目を足しても既存の共有URLは同じ範囲を指す', same(parseStateString(futureIndex, 'v=1&r=sl,qf1&c=41').state, parseStateString(index, 'v=1&r=sl,qf1&c=41').state));
  check('拡張: 科目全体のトークンはその科目だけを指す', serializeState(futureIndex, state).startsWith('v=1&r=sl,ma&c=') && rangeSummary(futureIndex, state.sections) === '集合と論証 全体＋数学A 全体');
}

// ---------------------------------------------------------------------------
// 5. 0問セルの無効化と自動解除
// ---------------------------------------------------------------------------
{
  // 集合と論証だけの範囲で問題がある／ないセルを求める。
  const slCounts = countCells(candidateProblems(index, ['sl1', 'sl2']));
  const qfCounts = countCells(candidateProblems(index, ['qf1', 'qf2', 'qf3', 'qf4', 'qf5', 'qf6', 'qf7']));
  const onlyQf = ALL_CELLS.find((cell) => qfCounts[cell] > 0 && slCounts[cell] === 0);
  const both = ALL_CELLS.find((cell) => qfCounts[cell] > 0 && slCounts[cell] > 0);
  check('0問セル: テスト用のセルが見つかる', Boolean(onlyQf && both), `二次関数だけ=${onlyQf} 両方=${both}`);

  let state = normalizeState(index, ['sl', 'qf'], [onlyQf, both]).state;
  check('0問セル: 問題のあるセルは選択できる', same(state.cells, ALL_CELLS.filter((c) => c === onlyQf || c === both)));

  // 二次関数を範囲から外す → onlyQfは0問になり自動解除、bothは維持。
  const narrowed = setUnitSelected(index, state, 'qf', false);
  check('自動解除: 0問になった選択セルだけが解除される', same(narrowed.removedCells, [onlyQf]) && same(narrowed.state.cells, [both]));
  check('自動解除: 解除後の抽出件数が再計算される', extractProblems(index, narrowed.state).length === slCounts[both]);

  // 範囲を戻しても、解除されたセルは自動再選択されない。
  const widened = setUnitSelected(index, narrowed.state, 'qf', true);
  check('自動解除: 範囲を広げても自動再選択しない', same(widened.state.cells, [both]) && widened.removedCells.length === 0);

  // 0問のセルは選択できない（無効）。
  const slOnly = normalizeState(index, ['sl'], []).state;
  check('0問セル: toggleCellで選択できない', same(toggleCell(index, slOnly, onlyQf).cells, []));
  check('0問セル: 「すべて選択」は1問以上のマスだけを選ぶ', same(selectCells(index, slOnly, ALL_CELLS).cells, ALL_CELLS.filter((c) => slCounts[c] > 0)));
  check('0問セル: 保存・共有データ内の0問セルも正規化で解除される', same(normalizeState(index, ['sl'], [onlyQf, both]).removedCells, [onlyQf]));

  // 全選択セルが0問になる → すべて解除され、結果画面へ進めない。
  state = normalizeState(index, ['qf'], [onlyQf]).state;
  const emptied = withSections(index, state, ['sl1', 'sl2']);
  check('自動解除: 全選択セルが0問ならすべて解除され抽出不可', emptied.state.cells.length === 0 && !canExtract(index, emptied.state));

  // 範囲が0問 → 4×4全体が0件。
  const cleared = setSubjectSelected(index, normalizeState(index, ['m1'], ['all']).state, 'm1', false);
  check('自動解除: 範囲が空なら全セル解除・抽出不可', cleared.state.sections.length === 0 && cleared.state.cells.length === 0 && cleared.removedCells.length > 0 && !canExtract(index, cleared.state));

  // 0件のとき抽出ボタンは無効（canExtractがfalse）。
  check('0件: 範囲・セルとも未選択なら抽出不可', !canExtract(index, emptyState()));
  check('0件: 範囲だけ選びセル未選択なら抽出不可', !canExtract(index, normalizeState(index, ['m1'], []).state));
  check('0件: 1問以上なら抽出可', canExtract(index, normalizeState(index, ['sl'], [both]).state));

  // section単位の選択・解除と、セルのトグル。
  const one = setSectionSelected(index, emptyState(), 'qf3', true).state;
  check('範囲: sectionの選択と解除', same(one.sections, ['qf3']) && setSectionSelected(index, one, 'qf3', false).state.sections.length === 0);
  const toggled = toggleCell(index, normalizeState(index, ['sl'], []).state, both);
  check('セル: トグルで選択・解除できる', same(toggled.cells, [both]) && toggleCell(index, toggled, both).cells.length === 0);

  // 将来のプリセット「土台＋本命、難易度1〜3」は、同じ選択セル状態へ設定するだけで足せる。
  const preset = ['41', '42', '43', '31', '32', '33'];
  const presetState = selectCells(index, normalizeState(index, ['m1'], []).state, preset);
  const allCounts = countCells(candidateProblems(index, allSections));
  check('プリセット: セル集合をselectCellsへ渡すだけで同じ抽出経路に乗る', presetState.cells.length > 0 && same(presetState.cells, preset.filter((c) => allCounts[c] > 0)) && same(extractProblems(index, presetState).map((p) => p.id), expectedIds(allSections, preset)));
}

// ---------------------------------------------------------------------------
// 6. URL状態（encode / decode / 正規化）
// ---------------------------------------------------------------------------
{
  let roundTrip = true;
  let deterministic = true;
  let shape = true;
  const seen = new Map();
  for (const range of rangesToTest) {
    const cells = pick(ALL_CELLS, random());
    const state = normalizeState(index, range, cells).state;
    const text = serializeState(index, state);
    if (state.sections.length === 0) {
      if (text !== '' || parseStateString(index, text).kind !== 'none') roundTrip = false;
      continue;
    }
    const parsed = parseStateString(index, `#${text}`);
    if (parsed.kind !== 'ok' || !same(parsed.state, state) || parsed.ignored !== 0 || parsed.removedCells.length !== 0) roundTrip = false;
    if (parsed.kind === 'ok' && serializeState(index, parsed.state) !== text) deterministic = false;
    // 同じ設定は、指定順が違っても同じ正規化URLになる。
    if (serializeState(index, normalizeState(index, [...range].reverse(), [...cells].reverse()).state) !== text) deterministic = false;
    if (!isStateStringShape(text)) shape = false;
    const key = JSON.stringify(state);
    if (seen.has(text) && seen.get(text) !== key) deterministic = false;
    seen.set(text, key);
  }
  check('URL: 生成→読込のround-tripで同じ条件になる', roundTrip);
  check('URL: 同じ設定は同じ正規化URLになる（決定的）', deterministic);
  check('URL: 出力が問題DB側の形式判定（抽出モードの起動条件）を通る', shape);

  check('URL: 単元全体・科目全体・全マスの省略表現', serializeState(index, normalizeState(index, ['sl1', 'sl2', 'qf1', 'qf2'], ['41']).state) === 'v=1&r=sl,qf1,qf2&c=41' && serializeState(index, normalizeState(index, allSections, ALL_CELLS.filter((c) => countCells(candidateProblems(index, allSections))[c] > 0)).state).startsWith('v=1&r=m1&c='));
  check('URL: 範囲トークンの展開（科目・単元・section）', same(normalizeState(index, ['m1'], []).state.sections, allSections) && same(normalizeState(index, ['qf'], []).state.sections, ['qf1', 'qf2', 'qf3', 'qf4', 'qf5', 'qf6', 'qf7']));
  check('URL: セルを選んでいない条件も読める', same(parseStateString(index, 'v=1&r=sl').state, { sections: ['sl1', 'sl2'], cells: [] }));

  // 未知ID：その値だけ無視し、残りを正規化する。
  const unknown = parseStateString(index, 'v=1&r=sl,zz9,qf1,xx&c=41,99,ab,31');
  check('URL: 未知のsection・セルはその値だけ無視する', unknown.kind === 'ok' && same(unknown.state.sections, ['sl1', 'sl2', 'qf1']) && unknown.ignored === 4);
  check('URL: 重複IDを無視する', parseStateString(index, 'v=1&r=sl,sl1,qf1,qf1&c=41,41').ignored === 3 && same(parseStateString(index, 'v=1&r=sl,sl1,qf1,qf1&c=41,41').state.sections, ['sl1', 'sl2', 'qf1']));
  check('URL: 将来追加されるキーは無視して読める', same(parseStateString(index, 'v=1&r=sl&c=41&x=1').state, parseStateString(index, 'v=1&r=sl&c=41').state));

  // 欠損。
  check('URL: fragmentなしは状態なし', parseStateString(index, '').kind === 'none' && parseStateString(index, '#').kind === 'none' && parseStateString(index, undefined).kind === 'none');
  check('URL: 状態ではないアンカーは状態なし', parseStateString(index, '#saved').kind === 'none');
  check('URL: versionだけ（範囲なし）は状態なし', parseStateString(index, 'v=1').kind === 'none');
  check('URL: versionの欠損は無効', parseStateString(index, 'r=sl&c=41').kind === 'invalid');
  check('URL: 範囲の欠損（セルだけ）は無効', parseStateString(index, 'v=1&c=41').kind === 'invalid');
  check('URL: すべて無効なら新規設定へ戻す', parseStateString(index, 'v=1&r=zz,yy&c=99').kind === 'invalid');

  // 壊れたfragment。どんな入力でも例外を出さず、ok以外ではstateを持たない。
  const broken = [
    'v=1&r=%E0%A4%A&c=41',
    'v=1&r=<script>alert(1)</script>&c=41',
    'v=1&r="onmouseover="x&c=41',
    'v=abc&r=sl',
    'v=-1&r=sl',
    'v=0&r=sl',
    'v=1.5&r=sl',
    'v=&r=sl',
    '&&&===',
    'v=1&r=,,,,&c=,,',
    'v=1&r=SL,QF1&c=41',
    'v=1&r=sl;qf1',
    `v=1&r=${'sl,'.repeat(2000)}`,
    `v=1&r=${'a'.repeat(5000)}`,
    '\u0000￿',
    'javascript:alert(1)',
  ];
  let brokenOk = true;
  for (const text of broken) {
    try {
      const result = parseStateString(index, text);
      if (result.kind === 'ok') {
        // okになる場合も、状態は設定済みIDと16マスだけで構成される。
        if (!result.state.sections.every((id) => index.sectionInfo.has(id)) || !result.state.cells.every((c) => ALL_CELLS.includes(c))) brokenOk = false;
      }
    } catch {
      brokenOk = false;
    }
  }
  check(`URL: 壊れたfragment ${broken.length}種で例外を出さず安全に処理する`, brokenOk);
  check('URL: タグを含む値は状態に入らない', parseStateString(index, 'v=1&r=<script>alert(1)</script>&c=41').kind === 'invalid');
  check('URL: 長すぎるfragmentは無効', parseStateString(index, `v=1&r=${'sl,'.repeat(2000)}`).kind === 'invalid');
  for (let i = 0; i < 300; i += 1) {
    const chars = 'v=1&r,c#%<>"\'abcmqslf0123456789 ';
    const text = Array.from({ length: Math.floor(random() * 60) }, () => chars[Math.floor(random() * chars.length)]).join('');
    try {
      const result = parseStateString(index, text);
      if (result.kind === 'ok' && serializeState(index, result.state) === '') brokenOk = false;
    } catch {
      brokenOk = false;
    }
  }
  check('URL: ランダムな300個の文字列でも例外を出さない', brokenOk);

  // 将来version。
  check('URL: 将来version（v=2）は適用しない', parseStateString(index, 'v=2&r=sl&c=41').kind === 'unsupported' && parseStateString(index, 'v=99&r=zz').kind === 'unsupported');

  // 戻り導線の形式検査。
  check('抽出モード: 条件の形をしていないfragmentでは起動しない', [null, undefined, '', 'saved', 'v=2&r=sl', 'v=1', 'v=1&c=41', 'v=1&r=sl&c=41"><script>', 'v=1&r=sl#x', 'javascript:alert(1)', 'v=1&r=SL'].every((v) => !isStateStringShape(v)));
}

// ---------------------------------------------------------------------------
// 6b. 問題DBの抽出モード（既存の個別問題ページを抽出した集合の中で見て回る）
// ---------------------------------------------------------------------------
{
  // 個別問題URLは、既存の静的URL（単元トップURL＋問題ID）そのもの。
  const routeOf = { expressionCalculation: '/math1/suto-shiki/', setLogic: '/math1/set-logic/', quadratic27: '/math1/quadratic/', trig4: '/math1/trig/', dataAnalysis: '/math1/data-analysis/' };
  check('抽出モード: 個別問題URLが既存の静的URLと一致する（180問）', index.problems.every((p) => problemHref(index, p) === `${routeOf[entryById.get(p.id).collection]}${p.id}/`));

  const state = normalizeState(index, ['sl', 'qf1', 'qf3'], ['41', '42', '31']).state;
  const expected = expectedIds(['sl1', 'sl2', 'qf1', 'qf3'], ['41', '42', '31']);
  const hrefOf = (id) => `${routeOf[entryById.get(id).collection]}${id}/`;
  const expectedHrefs = expected.map(hrefOf);
  check('抽出モード: 「問題データベースで見る」の移動先は抽出した先頭の問題', firstResultHref(index, state) === expectedHrefs[0] && firstResultHref(index, normalizeState(index, ['sl'], []).state) === null && firstResultHref(index, emptyState()) === null);

  // 抽出した問題を開いても、同じ集合・同じ順序のまま（科目 → 単元 → display_order）。
  let keepOk = true;
  let moveOk = true;
  expectedHrefs.forEach((href, i) => {
    const view = buildDbModeView(index, state, href);
    if (!same(view.hrefs, expectedHrefs) || view.current !== i) keepOk = false;
    if (view.prevHref !== (expectedHrefs[i - 1] ?? null) || view.nextHref !== (expectedHrefs[i + 1] ?? null)) moveOk = false;
  });
  check('抽出モード: どの抽出問題を開いても一覧は同じ抽出集合・同じ並び順', keepOk, `${expectedHrefs.length}問`);
  check('抽出モード: 前後の移動は抽出集合の中だけで行い、単元をまたぐ', moveOk && expectedHrefs.some((href, i) => i > 0 && href.split('/')[2] !== expectedHrefs[i - 1].split('/')[2]));

  // 次の問題を辿り続けると、抽出した全問題をちょうど1回ずつ通る。
  const walked = [];
  for (let href = firstResultHref(index, state); href; href = buildDbModeView(index, state, href).nextHref) walked.push(href);
  check('抽出モード: 「次の問題」を辿ると抽出した全問題を1回ずつ通る', same(walked, expectedHrefs));

  // 単元ナビ：抽出した問題がある単元だけ。行き先はその単元の最初の抽出問題。
  const view = buildDbModeView(index, state, expectedHrefs[0]);
  const slFirst = expectedHrefs.find((href) => href.startsWith('/math1/set-logic/'));
  const qfFirst = expectedHrefs.find((href) => href.startsWith('/math1/quadratic/'));
  check(
    '抽出モード: 単元ナビは抽出した問題がある単元だけ（行き先はその単元の最初の抽出問題）',
    same([...view.units.keys()], ['/math1/set-logic/', '/math1/quadratic/']) &&
      view.units.get('/math1/set-logic/').href === slFirst &&
      view.units.get('/math1/quadratic/').href === qfFirst &&
      [...view.units.values()].reduce((sum, unit) => sum + unit.count, 0) === expectedHrefs.length,
  );

  // 抽出対象外のページ（単元トップ・対象外の問題・型ページ）では、現在位置なし・次＝先頭。
  const outside = buildDbModeView(index, state, '/math1/trig/M1-TR-001/');
  const unitTop = buildDbModeView(index, state, '/math1/quadratic');
  check('抽出モード: 対象外のページでは現在位置なし・次は先頭の問題', outside.current === -1 && outside.prevHref === null && outside.nextHref === expectedHrefs[0] && unitTop.current === -1 && same(outside.hrefs, expectedHrefs));
  check('抽出モード: 0件の条件では移動先がない', buildDbModeView(index, normalizeState(index, ['sl'], []).state, slFirst).hrefs.length === 0);

  // --- 抽出モードを始められないとき（全問題一覧へ黙って戻さず、案内を出す） ---
  // 条件らしいfragmentには、形が壊れていても・新しい形式でも反応する（通常のアンカーには反応しない）。
  check(
    '抽出モード: 条件らしいfragment（v=<数字>…）は、壊れていても・新しい形式でも検出する',
    ['v=1&r=sl&c=41', 'v=2&r=sl', 'v=1', 'v=1&c=41', 'v=1&r=SL', 'v=1&r=sl&c=41"><script>', 'v=1&r=zz&c=99', 'v=99'].every((v) => looksLikeNavFragment(v)) &&
      [null, undefined, '', 'saved', 'top', 'javascript:alert(1)', 'r=sl&c=41', 'version', 'v=', 'x&v=1'].every((v) => !looksLikeNavFragment(v)),
  );
  const startOk = resolveDbModeStart(index, '#v=1&r=sl,qf1,qf3&c=41,42,31');
  check('抽出モード開始: 正常な条件はok（正規化した状態を返す）', startOk.kind === 'ok' && same(startOk.state, state));
  check(
    '抽出モード開始: 読めない条件・条件のないfragmentはinvalid',
    ['v=1&r=zz&c=41', 'v=1&r=SL', 'v=1&c=41', 'v=1', 'v=0&r=sl', 'v=abc&r=sl', 'v=1&r=' + 'sl,'.repeat(2000)].every(
      (v) => resolveDbModeStart(index, v).kind === 'invalid',
    ),
  );
  check('抽出モード開始: 新しい形式（v=2）はunsupported', resolveDbModeStart(index, 'v=2&r=sl&c=41').kind === 'unsupported');
  check(
    '抽出モード開始: 範囲だけ・0問のマスだけの条件はempty',
    resolveDbModeStart(index, 'v=1&r=sl').kind === 'empty' && resolveDbModeStart(index, 'v=1&r=sl&c=14').kind === (extractProblems(index, normalizeState(index, ['sl'], ['14']).state).length === 0 ? 'empty' : 'ok'),
  );
  check(
    '抽出モード開始: okになるのは抽出結果が1問以上のときだけ',
    ['v=1&r=sl&c=41', 'v=1&r=m1&c=all', 'v=1&r=sl', 'v=1&r=da5&c=44', 'v=1&r=zz', 'v=2&r=sl&c=41'].every((v) => {
      const start = resolveDbModeStart(index, v);
      const parsed = parseStateString(index, v);
      const count = parsed.kind === 'ok' ? extractProblems(index, parsed.state).length : 0;
      return (start.kind === 'ok') === (count > 0);
    }),
  );
  // 「問題再選定」の行き先：条件を可能な範囲で引き継ぐ。条件に使わない文字を含むものは引き継がない。
  check(
    '抽出モード失敗時: 問題再選定は条件を引き継いで設定画面へ（危険な文字列は引き継がない）',
    navEditHref('v=1&r=sl,qf1&c=41,42') === '/navigator/#v=1&r=sl,qf1&c=41,42' &&
      navEditHref('v=2&r=sl') === '/navigator/#v=2&r=sl' &&
      ['v=1&r=sl&c=41"><script>', 'v=1&r=sl#x', 'v=1&r=sl c=1', 'v=1&r=sl/../x', 'v=1&r=' + 'a'.repeat(1000), '', null, undefined].every((v) => navEditHref(v) === '/navigator/'),
  );
  check(
    '抽出モード失敗時: 引き継いだ条件は設定画面で読める部分だけ反映される',
    parseStateString(index, navEditHref('v=1&r=sl,zz&c=41').split('#')[1]).kind === 'ok' &&
      parseStateString(index, navEditHref('v=2&r=sl').split('#')[1]).kind === 'unsupported',
  );

  // --- navigator_result_view を送るのは、抽出モードへ入ったときだけ ---
  const origin = 'https://math-navi.com';
  check(
    '計測: 設定画面・共有URLの入口・外部・直接のURLから入ったときは送る',
    isNavModeEntry(`${origin}/navigator/`, origin, 'navigate') &&
      isNavModeEntry(`${origin}/navigator/#v=1&r=sl&c=41`, origin, 'navigate') &&
      isNavModeEntry(`${origin}/app/navigation/`, origin, 'navigate') &&
      isNavModeEntry('', origin, 'navigate') &&
      isNavModeEntry('https://example.com/x', origin, 'navigate') &&
      isNavModeEntry('not a url', origin, 'navigate'),
  );
  check(
    '計測: 抽出モードのまま問題DB内を移動したとき・再読み込み・戻る／進むでは送らない',
    !isNavModeEntry(`${origin}/math1/set-logic/M1-SL-001/`, origin, 'navigate') &&
      !isNavModeEntry(`${origin}/math1/quadratic/`, origin, 'navigate') &&
      !isNavModeEntry(`${origin}/app/`, origin, 'navigate') &&
      !isNavModeEntry(`${origin}/navigator/`, origin, 'reload') &&
      !isNavModeEntry('', origin, 'back_forward'),
  );
}

// ---------------------------------------------------------------------------
// 7. 表示用の要約
// ---------------------------------------------------------------------------
{
  check('要約: 範囲（単元全体＋一部section）', rangeSummary(index, ['sl1', 'sl2', 'qf1', 'qf3', 'qf7']) === '集合と論証 全体＋二次関数 3項目');
  check('要約: 科目全体', rangeSummary(index, allSections) === '数学I 全体' && rangeSummary(index, []) === '');
  check('要約: セル', cellsSummary(['41', '42', '43', '31', '32']) === '土台：難易度1・2・3／本命：難易度1・2' && cellsSummary(ALL_CELLS) === 'すべてのマス' && cellsSummary([]) === '');
  check('要約: 設定の初期名は範囲から自動生成し、長すぎる場合は切り詰める', autoSettingName(index, normalizeState(index, ['sl', 'qf1'], []).state) === '集合と論証 全体＋二次関数 1項目' && autoSettingName(index, normalizeState(index, ['ec1', 'sl1', 'qf1', 'tr1', 'da1'], []).state).length <= MAX_SETTING_NAME_LENGTH);
  check('要約: encodeの出力', same(encodeRange(index, ['sl1', 'sl2', 'qf1']), ['sl', 'qf1']) && same(encodeCells(ALL_CELLS), ['all']) && same(encodeCells(['31', '41']), ['41', '31']));
}

// ---------------------------------------------------------------------------
// 8. 保存・復元（localStorage相当）
// ---------------------------------------------------------------------------
function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function testStore(storage) {
  let tick = 0;
  let id = 0;
  return createNavStore(storage, {
    now: () => `2026-09-30T00:00:${String((tick += 1)).padStart(2, '0')}.000Z`,
    makeId: () => `t${(id += 1)}`,
  });
}

const stateA = normalizeState(index, ['sl', 'qf1', 'qf3'], ['41', '42', '31']).state;
const stateB = normalizeState(index, ['tr'], ['41']).state;
const stateC = normalizeState(index, ['ec1', 'da'], ['all']).state;

{
  const storage = memoryStorage();
  const store = testStore(storage);
  check('保存: 初期状態は空で読める', store.status() === 'ok' && store.listSettings(index).length === 0 && store.lastState(index) === null && store.draftState(index) === null);

  const a = store.saveSetting(index, stateA);
  const b = store.saveSetting(index, stateB, '  期末\n範囲  ');
  check('保存: 複数の設定を保存でき、初期名は範囲から自動生成される', a.ok && b.ok && store.listSettings(index).length === 2 && a.setting.name === '集合と論証 全体＋二次関数 2項目' && b.setting.name === '期末 範囲');

  // 保存→再読み込み（新しいstoreインスタンス）→復元で同じ条件になる。
  const reloaded = testStore(memoryStorage(Object.fromEntries(storage.map)));
  const restored = reloaded.listSettings(index);
  check('保存: 再読み込み後に同じ条件へ復元できる', same(restored.map((s) => s.state), [stateA, stateB]) && restored[0].stateString === serializeState(index, stateA));

  // 保存するのは条件だけで、問題IDのスナップショットではない。
  const raw = storage.map.get(NAV_STORAGE_KEY);
  check('保存: 保存対象は条件で、問題IDを含まない', !/M1-[A-Z]{2}-\d{3}/.test(raw) && JSON.parse(raw).v === 1 && same(JSON.parse(raw).saved[0].r, ['sl', 'qf1', 'qf3']));

  const dup = store.saveSetting(index, normalizeState(index, ['qf3', 'qf1', 'sl2', 'sl1'], ['31', '42', '41']).state);
  check('保存: 同じ条件の重複保存を防ぐ', !dup.ok && dup.reason === 'duplicate' && dup.existing.id === a.setting.id && store.listSettings(index).length === 2);

  const sameName = store.saveSetting(index, stateC, a.setting.name);
  check('保存: 同名の設定には連番を付ける', sameName.ok && sameName.setting.name === `${a.setting.name}（2）`);

  check('保存: 名前変更', store.renameSetting(a.setting.id, ' 中間テスト ').ok && store.listSettings(index)[0].name === '中間テスト');
  check('保存: 空の名前・存在しないIDは変更しない', store.renameSetting(a.setting.id, '   ').reason === 'empty-name' && store.renameSetting('nope', 'x').reason === 'not-found' && store.listSettings(index)[0].name === '中間テスト');
  check('保存: 名前は長さを制限し制御文字を除く', cleanSettingName(`${'あ'.repeat(100)}`).length === MAX_SETTING_NAME_LENGTH && cleanSettingName('a\u0000b\tc\r\nd') === 'a b c d' && cleanSettingName(42) === '');
  check('保存: 削除', store.deleteSetting(b.setting.id).ok && same(store.listSettings(index).map((s) => s.id), [a.setting.id, sameName.setting.id]) && store.deleteSetting(b.setting.id).reason === 'not-found');
  check('保存: 範囲が空の条件は保存しない', store.saveSetting(index, emptyState()).reason === 'empty');

  // 前回使用設定・下書き。
  store.setDraft(index, stateB);
  store.setLast(index, stateC);
  check('保存: 前回使用設定と下書きを記録・復元できる', same(store.lastState(index), stateC) && same(store.draftState(index), stateB));
  store.setDraft(index, emptyState());
  check('保存: 範囲が空の下書きは残さない', store.draftState(index) === null);

  // 上限。
  const limitStore = testStore(memoryStorage());
  let limitOk = true;
  const sectionsForLimit = index.sectionIds;
  for (let i = 0; i < MAX_SAVED_SETTINGS; i += 1) {
    const s = normalizeState(index, [sectionsForLimit[i % sectionsForLimit.length], sectionsForLimit[(i * 7 + 3) % sectionsForLimit.length], sectionsForLimit[Math.floor(i / sectionsForLimit.length)]], []).state;
    const r = limitStore.saveSetting(index, s, `設定${i}`);
    if (!r.ok && r.reason !== 'duplicate') limitOk = false;
  }
  const count = limitStore.listSettings(index).length;
  for (let i = 0; count + i < MAX_SAVED_SETTINGS; i += 1) limitStore.saveSetting(index, normalizeState(index, ['m1'], [ALL_CELLS[i % 16], ALL_CELLS[(i + 1 + Math.floor(i / 16)) % 16]]).state, `追加${i}`);
  check('保存: 件数の上限を超えて保存しない', limitOk && limitStore.listSettings(index).length <= MAX_SAVED_SETTINGS && (limitStore.listSettings(index).length < MAX_SAVED_SETTINGS || limitStore.saveSetting(index, normalizeState(index, ['da5'], ['all']).state).reason === 'limit'));
}

// URL状態がlocal保存より優先され、開いただけでは受信者の保存を上書きしない。
{
  const storage = memoryStorage();
  const store = testStore(storage);
  store.saveSetting(index, stateA, '自分の設定');
  store.setLast(index, stateA);
  store.setDraft(index, stateB);
  const before = storage.map.get(NAV_STORAGE_KEY);

  const shared = resolveInitialState(index, `#${serializeState(index, stateC)}`, store);
  check('復元: URLの条件が保存済み・前回・下書きより優先される', shared.source === 'url' && same(shared.state, stateC) && shared.offer === null);
  check('復元: 共有URLを開いただけでは保存データを変更しない', storage.map.get(NAV_STORAGE_KEY) === before && same(store.lastState(index), stateA) && same(store.draftState(index), stateB) && store.listSettings(index).length === 1);
  check('復元: 共有された条件は自分の条件と区別できる', !store.isOwnCondition(index, stateC) && store.isOwnCondition(index, stateA) && store.isOwnCondition(index, stateB));

  // 受信者が「この条件で学習する」を選んだ後にだけ記録する。
  store.setLast(index, stateC);
  check('復元: 受信者が採用した後に前回設定として記録される', same(store.lastState(index), stateC) && store.isOwnCondition(index, stateC) && store.listSettings(index).length === 1);

  // URLに条件がない → 前回設定を自動適用せず、候補として提示する。
  const fresh = resolveInitialState(index, '', store);
  check('復元: URLなしでは前回設定を自動適用せず候補として提示する', fresh.source === 'new' && same(fresh.state, emptyState()) && fresh.offer.kind === 'last' && same(fresh.offer.state, stateC));

  const draftOnlyStore = testStore(memoryStorage());
  draftOnlyStore.setDraft(index, stateB);
  const draftOnly = resolveInitialState(index, '#saved', draftOnlyStore);
  check('復元: 前回設定がなければ下書きを候補にする', draftOnly.source === 'new' && draftOnly.offer.kind === 'draft' && same(draftOnly.offer.state, stateB));
  check('復元: 何もなければ新規設定', resolveInitialState(index, '', testStore(memoryStorage())).offer === null);

  // 無効・将来versionのURLは適用せず、保存側の候補へ戻る（保存は変更しない）。
  const afterAdopt = storage.map.get(NAV_STORAGE_KEY);
  const future = resolveInitialState(index, '#v=2&r=sl&c=41', store);
  const invalid = resolveInitialState(index, '#v=1&r=zz&c=99', store);
  check('復元: 将来version・無効なURLは適用しない', future.source === 'new' && future.url.kind === 'unsupported' && invalid.source === 'new' && invalid.url.kind === 'invalid' && storage.map.get(NAV_STORAGE_KEY) === afterAdopt);

  // 保存後に公開データからsectionが消えても、保存データは壊さず、残る範囲だけで復元する。
  const staleStorage = memoryStorage({
    [NAV_STORAGE_KEY]: JSON.stringify({ v: 1, saved: [{ id: 'x1', name: '古い設定', r: ['sl', 'old9'], c: ['41', '77'], createdAt: 'a', updatedAt: 'a' }, { id: 'x2', name: '全滅', r: ['old1'], c: ['41'], createdAt: 'a', updatedAt: 'a' }], last: { r: ['old1'], c: [], at: 'a' }, draft: null }),
  });
  const staleStore = testStore(staleStorage);
  const stale = staleStore.listSettings(index);
  check('復元: 古い保存設定は残る範囲だけで正規化し、画面を壊さない', same(stale[0].state.sections, ['sl1', 'sl2']) && stale[1].stateString === '' && staleStore.lastState(index) === null && resolveInitialState(index, '', staleStore).offer === null);
}

// localStorageが利用不可・容量超過・壊れたJSONでも主要操作が継続できる。
{
  const mainFlow = () => {
    // 保存に依存しない主要操作：範囲選択→セル選択→抽出→共有URL生成→URLから復元。
    let state = setUnitSelected(index, emptyState(), 'sl', true).state;
    state = selectCells(index, state, ALL_CELLS);
    const text = serializeState(index, state);
    return extractProblems(index, state).length === 18 && same(parseStateString(index, text).state, state);
  };

  // 1) localStorage自体がない。
  const none = createNavStore(null);
  let ok = true;
  try {
    ok = none.status() === 'unavailable' && none.listSettings(index).length === 0 && none.saveSetting(index, stateA).reason === 'unavailable' && none.setLast(index, stateA).reason === 'unavailable' && none.setDraft(index, stateA).ok === false && none.renameSetting('a', 'b').ok === false && none.deleteSetting('a').ok === false && none.isOwnCondition(index, stateA) === false && none.reset().ok === false && resolveInitialState(index, `#${serializeState(index, stateA)}`, none).source === 'url' && resolveInitialState(index, '', none).source === 'new' && mainFlow();
  } catch {
    ok = false;
  }
  check('保存不可: localStorageがなくても主要操作が継続する', ok);

  // 2) アクセスするだけで例外（プライベートモード・無効化）。
  const throwing = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('SecurityError'); }, removeItem: () => { throw new Error('SecurityError'); } };
  ok = true;
  try {
    const store = createNavStore(throwing);
    ok = store.status() === 'unavailable' && store.saveSetting(index, stateA).ok === false && store.setDraft(index, stateA).ok === false && store.lastState(index) === null && store.reset().ok === false && resolveInitialState(index, `#${serializeState(index, stateB)}`, store).source === 'url' && mainFlow();
  } catch {
    ok = false;
  }
  check('保存不可: 読み書きが例外を投げても主要操作が継続する', ok);

  // 3) 容量超過（読めるが書けない）。
  const quota = memoryStorage();
  const seeded = testStore(quota);
  seeded.saveSetting(index, stateA, '既存');
  quota.setItem = () => { throw new Error('QuotaExceededError'); };
  ok = true;
  try {
    const store = testStore(quota);
    const saved = store.saveSetting(index, stateB);
    ok = saved.ok === false && saved.reason === 'write-failed' && store.setLast(index, stateB).reason === 'write-failed' && store.setDraft(index, stateB).reason === 'write-failed' && store.renameSetting(store.listSettings(index)[0].id, 'x').reason === 'write-failed' && store.listSettings(index).length === 1 && store.listSettings(index)[0].name === '既存' && mainFlow();
  } catch {
    ok = false;
  }
  check('保存不可: 容量超過でも既存データを保ち主要操作が継続する', ok);

  // 4) 壊れたJSON・想定外の形：元データを破壊せず、適用できない旨（unreadable）を返す。
  const corruptValues = ['{not json', '[]', 'null', '"text"', '{"saved":[]}', '{"v":"1","saved":[]}', '{"v":0,"saved":[]}'];
  ok = true;
  for (const value of corruptValues) {
    const storage = memoryStorage({ [NAV_STORAGE_KEY]: value });
    try {
      const store = testStore(storage);
      const resolved = resolveInitialState(index, '', store);
      if (store.status() !== 'unreadable' || resolved.storeStatus !== 'unreadable' || resolved.source !== 'new' || store.listSettings(index).length !== 0) ok = false;
      if (store.saveSetting(index, stateA).reason !== 'unreadable' || store.setLast(index, stateA).reason !== 'unreadable' || store.setDraft(index, stateA).reason !== 'unreadable') ok = false;
      if (storage.map.get(NAV_STORAGE_KEY) !== value) ok = false; // 元データを上書きしない
      if (resolveInitialState(index, `#${serializeState(index, stateA)}`, store).source !== 'url' || !mainFlow()) ok = false;
      // 利用者が明示的にリセットした後は、再び保存できる。
      if (!store.reset().ok || store.status() !== 'ok' || !store.saveSetting(index, stateA).ok) ok = false;
    } catch {
      ok = false;
    }
  }
  check(`保存不可: 壊れた保存データ ${corruptValues.length}種で元データを上書きせず継続する`, ok);

  // 5) 新しい形式の保存データ（将来version）：上書きしない。
  const newerValue = JSON.stringify({ v: 2, saved: [{ future: true }] });
  const newerStorage = memoryStorage({ [NAV_STORAGE_KEY]: newerValue });
  const newerStore = testStore(newerStorage);
  check('保存不可: 新しい形式の保存データは上書きしない', newerStore.status() === 'newer' && newerStore.saveSetting(index, stateA).reason === 'newer' && newerStore.setDraft(index, stateA).reason === 'newer' && newerStorage.map.get(NAV_STORAGE_KEY) === newerValue && mainFlow());

  // 6) 形は正しいが中身の一部が壊れている：壊れた項目だけ読み飛ばす。
  const partial = memoryStorage({
    [NAV_STORAGE_KEY]: JSON.stringify({ v: 1, saved: [null, 'x', { id: 'ok1', name: '<b>name</b>', r: ['sl'], c: ['41'], createdAt: 'a', updatedAt: 'a' }, { id: '', name: 'x', r: [], c: [], createdAt: 'a', updatedAt: 'a' }, { id: 'bad', name: 'x', r: 'sl', c: [], createdAt: 'a', updatedAt: 'a' }], last: 'oops', draft: { r: [1, 2], c: [], at: 'a' } }),
  });
  const partialStore = testStore(partial);
  const partialList = partialStore.listSettings(index);
  check('保存不可: 一部が壊れた保存データは有効な項目だけ読む', partialStore.status() === 'ok' && partialList.length === 1 && partialList[0].id === 'ok1' && partialList[0].name === '<b>name</b>' && partialStore.lastState(index) === null && partialStore.draftState(index) === null);
}

console.log(`\n${passes + failures}件中 ${passes}件成功、${failures}件失敗。`);
if (failures > 0) {
  console.error('4×4ナビのテストに失敗しました。');
  process.exit(1);
}
console.log('4×4ナビのテスト: OK');
