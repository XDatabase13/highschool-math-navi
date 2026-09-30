// 4×4ナビゲーションの純粋ロジック（候補データ・範囲集計・16マス・抽出・並び順・
// 状態のencode/decode・正規化）。DOM・localStorage・astro:content に依存しない。
//
// - ページ（src/pages/navigator/・src/pages/app/navigation/）のclient scriptと、
//   scripts/test-navigator.mjs（Node）が同じ関数を使う。UI側に別の抽出・正規化ロジックを作らない。
// - 4×4は候補問題を残すフィルターで、推薦スコア・難易度順・重要度順の並び替えはしない。
//   結果は常に「科目順 → dbSubjectNavの単元順 → display_order昇順」。
// - 将来のプリセット（例：土台・本命×難易度1〜3）は selectCells() へセル集合を渡すだけで足せる。
//   プリセット専用の抽出ロジックは作らない。
// - Nodeの型除去だけで読める構文に限定する（enum・namespace・import無し）。

export const NAV_STATE_VERSION = 1;

// 縦軸＝重要度（内部値4→1）。ラベルは正本frontmatterの importance_label と一致していなければ
// buildNavData がエラーにする（4×4側で重要度の意味・値を上書きしない）。
export const IMPORTANCE_LEVELS = [
  { value: 4, label: '土台' },
  { value: 3, label: '本命' },
  { value: 2, label: '次点' },
  { value: 1, label: '余力' },
] as const;

// 横軸＝難易度1〜4。
export const DIFFICULTY_LEVELS = [1, 2, 3, 4] as const;

// セルID＝重要度の内部値＋難易度（例：土台×難易度2 → "42"）。
export function cellKey(importance: number, difficulty: number): string {
  return `${importance}${difficulty}`;
}

// 16マスの正規順（重要度4→1、各行で難易度1→4）。
export const ALL_CELLS: readonly string[] = IMPORTANCE_LEVELS.flatMap((level) =>
  DIFFICULTY_LEVELS.map((difficulty) => cellKey(level.value, difficulty)),
);

const ID_PATTERN = /^[a-z][a-z0-9]{0,7}$/;
const CELL_PATTERN = /^[1-4][1-4]$/;
const ALL_TOKEN = 'all';
const MAX_STATE_STRING_LENGTH = 1000;
const MAX_TOKENS = 200;

// ---------------------------------------------------------------------------
// 候補データ（build時に生成し、ページへJSONで埋め込む形）
// ---------------------------------------------------------------------------

export type NavSection = { id: string; name: string };
export type NavUnit = { id: string; name: string; href: string; sections: NavSection[] };
export type NavSubject = { id: string; name: string; units: NavUnit[] };
// [問題ID, sectionのID, display_order, 重要度(1〜4), 難易度(1〜4)]
export type NavProblemTuple = [string, string, number, number, number];
export type NavData = { subjects: NavSubject[]; problems: NavProblemTuple[] };

export type NavSubjectConfigInput = {
  id: string;
  name: string;
  units: readonly {
    id: string;
    dbUnitId: string;
    collection: string;
    sections: readonly { id: string; section: string }[];
  }[];
};

export type NavDbSubjectInput = {
  name: string;
  units: readonly { id: string; name: string; href: string }[];
};

// 各Content Collectionのfrontmatterから渡す、1問ぶんの入力。
export type NavProblemInput = {
  collection: string;
  id: string;
  subject: string;
  unit: string;
  section: string;
  display_order: number;
  importance: number;
  importance_label: string;
  difficulty: number;
};

function isLevel(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4;
}

// ナビ設定（navigator-config.ts）・dbSubjectNav・各問題のfrontmatterを突き合わせ、
// 候補データを作る。食い違いはすべてErrorにする（buildエラー）。
export function buildNavData(
  config: readonly NavSubjectConfigInput[],
  dbSubjects: readonly NavDbSubjectInput[],
  entries: readonly NavProblemInput[],
): NavData {
  const usedIds = new Set<string>();
  const claimId = (id: string, what: string) => {
    if (!ID_PATTERN.test(id) || id === ALL_TOKEN) {
      throw new Error(`4×4ナビ設定: ${what}のID「${id}」は使えません（英小文字で始まる英数字8文字以内）。`);
    }
    if (usedIds.has(id)) throw new Error(`4×4ナビ設定: ID「${id}」が重複しています。`);
    usedIds.add(id);
  };

  const publicDbSubjects = dbSubjects.filter((subject) => subject.units.length > 0);
  for (const subjectConfig of config) {
    if (!publicDbSubjects.some((subject) => subject.name === subjectConfig.name)) {
      throw new Error(`4×4ナビ設定: 科目「${subjectConfig.name}」がdbSubjectNavにありません。`);
    }
  }

  const subjects: NavSubject[] = [];
  // collection名 → { 単元, section名→sectionのID }
  const collectionMap = new Map<string, { unitPos: number; sectionIds: Map<string, string>; subjectName: string; unitName: string }>();
  const sectionProblemCount = new Map<string, number>();
  let unitPos = 0;

  for (const dbSubject of publicDbSubjects) {
    const subjectConfig = config.find((c) => c.name === dbSubject.name);
    if (!subjectConfig) {
      throw new Error(`4×4ナビ設定: dbSubjectNavの科目「${dbSubject.name}」に対応する設定がありません。`);
    }
    claimId(subjectConfig.id, `科目「${subjectConfig.name}」`);
    for (const unitConfig of subjectConfig.units) {
      if (!dbSubject.units.some((unit) => unit.id === unitConfig.dbUnitId)) {
        throw new Error(`4×4ナビ設定: 単元「${unitConfig.dbUnitId}」がdbSubjectNavの「${dbSubject.name}」にありません。`);
      }
    }
    const units: NavUnit[] = [];
    for (const dbUnit of dbSubject.units) {
      const unitConfig = subjectConfig.units.find((c) => c.dbUnitId === dbUnit.id);
      if (!unitConfig) {
        throw new Error(`4×4ナビ設定: dbSubjectNavの単元「${dbUnit.name}」に対応する設定がありません。`);
      }
      claimId(unitConfig.id, `単元「${dbUnit.name}」`);
      if (collectionMap.has(unitConfig.collection)) {
        throw new Error(`4×4ナビ設定: collection「${unitConfig.collection}」が複数の単元に割り当てられています。`);
      }
      const sectionIds = new Map<string, string>();
      const sections: NavSection[] = [];
      for (const sectionConfig of unitConfig.sections) {
        claimId(sectionConfig.id, `section「${sectionConfig.section}」`);
        if (sectionIds.has(sectionConfig.section)) {
          throw new Error(`4×4ナビ設定: 単元「${dbUnit.name}」のsection「${sectionConfig.section}」が重複しています。`);
        }
        sectionIds.set(sectionConfig.section, sectionConfig.id);
        sectionProblemCount.set(sectionConfig.id, 0);
        sections.push({ id: sectionConfig.id, name: sectionConfig.section });
      }
      collectionMap.set(unitConfig.collection, {
        unitPos,
        sectionIds,
        subjectName: dbSubject.name,
        unitName: dbUnit.name,
      });
      unitPos += 1;
      units.push({ id: unitConfig.id, name: dbUnit.name, href: dbUnit.href, sections });
    }
    subjects.push({ id: subjectConfig.id, name: dbSubject.name, units });
  }

  const seenProblemIds = new Set<string>();
  const rows: { tuple: NavProblemTuple; unitPos: number }[] = [];
  for (const entry of entries) {
    const unit = collectionMap.get(entry.collection);
    if (!unit) throw new Error(`4×4ナビ: 問題 ${entry.id} のcollection「${entry.collection}」がナビ設定にありません。`);
    if (seenProblemIds.has(entry.id)) throw new Error(`4×4ナビ: 問題ID ${entry.id} が重複しています。`);
    seenProblemIds.add(entry.id);
    if (entry.subject !== unit.subjectName || entry.unit !== unit.unitName) {
      throw new Error(
        `4×4ナビ: 問題 ${entry.id} の科目・単元（${entry.subject}／${entry.unit}）がナビ設定（${unit.subjectName}／${unit.unitName}）と一致しません。`,
      );
    }
    const sectionId = unit.sectionIds.get(entry.section);
    if (!sectionId) {
      throw new Error(`4×4ナビ: 問題 ${entry.id} のsection「${entry.section}」がナビ設定（navigator-config.ts）にありません。`);
    }
    if (!isLevel(entry.importance)) {
      throw new Error(`4×4ナビ: 問題 ${entry.id} の重要度「${entry.importance}」が1〜4の整数ではありません。`);
    }
    const level = IMPORTANCE_LEVELS.find((l) => l.value === entry.importance);
    if (!level || level.label !== entry.importance_label) {
      throw new Error(
        `4×4ナビ: 問題 ${entry.id} の重要度ラベル「${entry.importance_label}」が重要度${entry.importance}（${level?.label}）と一致しません。`,
      );
    }
    if (!isLevel(entry.difficulty)) {
      throw new Error(`4×4ナビ: 問題 ${entry.id} の難易度「${entry.difficulty}」が1〜4の整数ではありません。`);
    }
    if (typeof entry.display_order !== 'number' || !Number.isFinite(entry.display_order)) {
      throw new Error(`4×4ナビ: 問題 ${entry.id} のdisplay_orderが数値ではありません。`);
    }
    sectionProblemCount.set(sectionId, (sectionProblemCount.get(sectionId) ?? 0) + 1);
    rows.push({
      tuple: [entry.id, sectionId, entry.display_order, entry.importance, entry.difficulty],
      unitPos: unit.unitPos,
    });
  }

  for (const [sectionId, count] of sectionProblemCount) {
    if (count === 0) {
      throw new Error(`4×4ナビ設定: section ID「${sectionId}」に公開対象の問題がありません（空のsectionは設定に置かない）。`);
    }
  }

  rows.sort((a, b) => a.unitPos - b.unitPos || a.tuple[2] - b.tuple[2] || a.tuple[0].localeCompare(b.tuple[0]));
  return { subjects, problems: rows.map((row) => row.tuple) };
}

// ---------------------------------------------------------------------------
// 索引
// ---------------------------------------------------------------------------

export type NavProblem = {
  id: string;
  sectionId: string;
  unitId: string;
  subjectId: string;
  order: number;
  importance: number;
  difficulty: number;
  cell: string;
  // 科目順 → 単元順 → display_order の通し位置。
  pos: number;
};

export type NavIndex = {
  subjects: NavSubject[];
  // 全sectionのID（科目順 → 単元順 → 設定順）。
  sectionIds: string[];
  sectionInfo: Map<string, { section: NavSection; unit: NavUnit; subject: NavSubject; pos: number }>;
  unitInfo: Map<string, { unit: NavUnit; subject: NavSubject; pos: number }>;
  subjectInfo: Map<string, NavSubject>;
  // 全問題（結果の並び順）。
  problems: NavProblem[];
};

export function createNavIndex(data: NavData): NavIndex {
  const sectionIds: string[] = [];
  const sectionInfo: NavIndex['sectionInfo'] = new Map();
  const unitInfo: NavIndex['unitInfo'] = new Map();
  const subjectInfo: NavIndex['subjectInfo'] = new Map();
  let unitPos = 0;
  for (const subject of data.subjects) {
    subjectInfo.set(subject.id, subject);
    for (const unit of subject.units) {
      unitInfo.set(unit.id, { unit, subject, pos: unitPos });
      unitPos += 1;
      for (const section of unit.sections) {
        sectionInfo.set(section.id, { section, unit, subject, pos: sectionIds.length });
        sectionIds.push(section.id);
      }
    }
  }

  const seen = new Set<string>();
  const problems: NavProblem[] = [];
  for (const [id, sectionId, order, importance, difficulty] of data.problems) {
    const info = sectionInfo.get(sectionId);
    // 問題IDで重複排除する。設定にないsection・不正な評価値の行は候補にしない。
    if (!info || seen.has(id) || !isLevel(importance) || !isLevel(difficulty)) continue;
    seen.add(id);
    problems.push({
      id,
      sectionId,
      unitId: info.unit.id,
      subjectId: info.subject.id,
      order,
      importance,
      difficulty,
      cell: cellKey(importance, difficulty),
      pos: 0,
    });
  }
  const unitPosOf = (problem: NavProblem) => unitInfo.get(problem.unitId)?.pos ?? 0;
  problems.sort((a, b) => unitPosOf(a) - unitPosOf(b) || a.order - b.order || a.id.localeCompare(b.id));
  problems.forEach((problem, pos) => {
    problem.pos = pos;
  });

  return { subjects: data.subjects, sectionIds, sectionInfo, unitInfo, subjectInfo, problems };
}

// ---------------------------------------------------------------------------
// 状態（選択section＋選択セル）
// ---------------------------------------------------------------------------

// sections・cellsとも常に正規順（sectionsは索引の順、cellsはALL_CELLSの順）・重複なしで持つ。
export type NavState = { sections: string[]; cells: string[] };

export function emptyState(): NavState {
  return { sections: [], cells: [] };
}

function canonicalSections(index: NavIndex, sections: Iterable<string>): string[] {
  const set = new Set(sections);
  return index.sectionIds.filter((id) => set.has(id));
}

function canonicalCells(cells: Iterable<string>): string[] {
  const set = new Set(cells);
  return ALL_CELLS.filter((cell) => set.has(cell));
}

// 試験範囲（選択section）に含まれる候補問題。結果の並び順で返す（問題IDの重複なし）。
export function candidateProblems(index: NavIndex, sections: readonly string[]): NavProblem[] {
  const set = new Set(sections);
  return index.problems.filter((problem) => set.has(problem.sectionId));
}

// 16マスそれぞれの問題数。
export function countCells(problems: readonly NavProblem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cell of ALL_CELLS) counts[cell] = 0;
  for (const problem of problems) counts[problem.cell] += 1;
  return counts;
}

// 選択中セルのうち、問題が1問以上あるものだけを残す。0問になったセルは解除する
// （後で範囲を広げて問題が戻っても、状態から消えているので自動再選択されない）。
export function reconcileCells(
  cells: readonly string[],
  counts: Record<string, number>,
): { cells: string[]; removed: string[] } {
  const canonical = canonicalCells(cells);
  return {
    cells: canonical.filter((cell) => (counts[cell] ?? 0) > 0),
    removed: canonical.filter((cell) => (counts[cell] ?? 0) === 0),
  };
}

// 抽出結果。科目順 → 単元順 → display_order（index.problemsの順のまま）。
export function extractProblems(index: NavIndex, state: NavState): NavProblem[] {
  const cells = new Set(state.cells);
  return candidateProblems(index, state.sections).filter((problem) => cells.has(problem.cell));
}

// 1マス以上が選択され、結果が1問以上あるときだけ結果画面へ進める。
export function canExtract(index: NavIndex, state: NavState): boolean {
  return extractProblems(index, state).length > 0;
}

export type StateChange = { state: NavState; removedCells: string[] };

// 範囲変更時の整合処理（仕様§6の順）：候補→16マス件数→選択セル∩1問以上→0問セル解除。
export function withSections(index: NavIndex, state: NavState, sections: Iterable<string>): StateChange {
  const nextSections = canonicalSections(index, sections);
  const counts = countCells(candidateProblems(index, nextSections));
  const { cells, removed } = reconcileCells(state.cells, counts);
  return { state: { sections: nextSections, cells }, removedCells: removed };
}

export function setSectionSelected(index: NavIndex, state: NavState, sectionId: string, selected: boolean): StateChange {
  const next = new Set(state.sections);
  if (selected) next.add(sectionId);
  else next.delete(sectionId);
  return withSections(index, state, next);
}

export function setUnitSelected(index: NavIndex, state: NavState, unitId: string, selected: boolean): StateChange {
  const next = new Set(state.sections);
  for (const section of index.unitInfo.get(unitId)?.unit.sections ?? []) {
    if (selected) next.add(section.id);
    else next.delete(section.id);
  }
  return withSections(index, state, next);
}

export function setSubjectSelected(index: NavIndex, state: NavState, subjectId: string, selected: boolean): StateChange {
  const next = new Set(state.sections);
  for (const unit of index.subjectInfo.get(subjectId)?.units ?? []) {
    for (const section of unit.sections) {
      if (selected) next.add(section.id);
      else next.delete(section.id);
    }
  }
  return withSections(index, state, next);
}

// セル集合をそのまま選択状態にする（0問のセルは選べない）。
// 「すべて選択」＝selectCells(ALL_CELLS)、「選択を解除」＝selectCells([])。
// 将来のプリセットも、定義済みのセル集合をここへ渡すだけで追加する。
export function selectCells(index: NavIndex, state: NavState, cells: Iterable<string>): NavState {
  const counts = countCells(candidateProblems(index, state.sections));
  return { sections: state.sections, cells: reconcileCells([...cells], counts).cells };
}

export function toggleCell(index: NavIndex, state: NavState, cell: string): NavState {
  const next = new Set(state.cells);
  if (next.has(cell)) next.delete(cell);
  else next.add(cell);
  return selectCells(index, state, next);
}

export function selectionCount(
  state: NavState,
  sections: readonly NavSection[],
): { selected: number; total: number } {
  const set = new Set(state.sections);
  return { selected: sections.filter((section) => set.has(section.id)).length, total: sections.length };
}

// ---------------------------------------------------------------------------
// encode / decode / 正規化
// ---------------------------------------------------------------------------

// 範囲トークン：科目全体は科目ID、単元全体は単元ID、それ以外はsectionのID。
// 同じ選択は必ず同じトークン列になる（決定的）。
export function encodeRange(index: NavIndex, sections: readonly string[]): string[] {
  const set = new Set(sections);
  const tokens: string[] = [];
  for (const subject of index.subjects) {
    const subjectSections = subject.units.flatMap((unit) => unit.sections);
    if (subjectSections.length > 0 && subjectSections.every((section) => set.has(section.id))) {
      tokens.push(subject.id);
      continue;
    }
    for (const unit of subject.units) {
      if (unit.sections.length > 0 && unit.sections.every((section) => set.has(section.id))) {
        tokens.push(unit.id);
      } else {
        for (const section of unit.sections) if (set.has(section.id)) tokens.push(section.id);
      }
    }
  }
  return tokens;
}

export function encodeCells(cells: readonly string[]): string[] {
  const canonical = canonicalCells(cells);
  return canonical.length === ALL_CELLS.length ? [ALL_TOKEN] : canonical;
}

export type NormalizeResult = {
  state: NavState;
  // 無視した値の数（不明なID・重複・不正な値）。
  ignored: number;
  // 範囲内に問題がなく解除したセル。
  removedCells: string[];
};

function asTokens(raw: unknown): { tokens: string[]; ignored: number } {
  if (raw === undefined || raw === null) return { tokens: [], ignored: 0 };
  if (!Array.isArray(raw)) return { tokens: [], ignored: 1 };
  const tokens: string[] = [];
  let ignored = 0;
  for (const value of raw.slice(0, MAX_TOKENS)) {
    if (typeof value === 'string') tokens.push(value);
    else ignored += 1;
  }
  ignored += Math.max(raw.length - MAX_TOKENS, 0);
  return { tokens, ignored };
}

// 保存データ・共有URLなど、信頼できない入力を安全な状態へ正規化する。
// 不明なID・重複・不正な値はその値だけ無視し、0問のセルは解除する。
export function normalizeState(index: NavIndex, rawRange: unknown, rawCells: unknown): NormalizeResult {
  const range = asTokens(rawRange);
  const cellTokens = asTokens(rawCells);
  let ignored = range.ignored + cellTokens.ignored;

  const sections = new Set<string>();
  const addSections = (ids: readonly string[]) => {
    let added = false;
    for (const id of ids) {
      if (!sections.has(id)) {
        sections.add(id);
        added = true;
      }
    }
    if (!added) ignored += 1; // 重複（すでに含まれている範囲）
  };
  for (const token of range.tokens) {
    const subject = index.subjectInfo.get(token);
    const unit = index.unitInfo.get(token);
    if (subject) addSections(subject.units.flatMap((u) => u.sections.map((s) => s.id)));
    else if (unit) addSections(unit.unit.sections.map((s) => s.id));
    else if (index.sectionInfo.has(token)) addSections([token]);
    else ignored += 1;
  }

  const cells = new Set<string>();
  for (const token of cellTokens.tokens) {
    if (token === ALL_TOKEN) {
      if (cells.size === ALL_CELLS.length) ignored += 1;
      for (const cell of ALL_CELLS) cells.add(cell);
    } else if (CELL_PATTERN.test(token)) {
      if (cells.has(token)) ignored += 1;
      cells.add(token);
    } else {
      ignored += 1;
    }
  }

  const change = withSections(index, { sections: [], cells: canonicalCells(cells) }, sections);
  return { state: change.state, ignored, removedCells: change.removedCells };
}

// 状態 → 文字列（URL fragment・保存の比較キー）。形式: v=1&r=<範囲>&c=<セル>
// 何も選択していない状態は空文字列。
export function serializeState(index: NavIndex, state: NavState): string {
  const range = encodeRange(index, state.sections);
  if (range.length === 0) return '';
  const parts = [`v=${NAV_STATE_VERSION}`, `r=${range.join(',')}`];
  const cells = encodeCells(state.cells);
  if (cells.length > 0) parts.push(`c=${cells.join(',')}`);
  return parts.join('&');
}

export type ParseResult =
  // 状態を含まない（fragmentなし、または状態ではないアンカー）。
  | { kind: 'none' }
  // 未知のversion。適用しない。
  | { kind: 'unsupported' }
  // 壊れている、または有効な値が1つもない。新規設定へ戻す。
  | { kind: 'invalid' }
  | { kind: 'ok'; state: NavState; ignored: number; removedCells: string[] };

// 文字列（URL fragment）→ 状態。値はIDとして照合するだけで、HTML・コードとして解釈しない。
export function parseStateString(index: NavIndex, input: unknown): ParseResult {
  if (typeof input !== 'string') return { kind: 'none' };
  const text = input.replace(/^#/, '');
  if (text === '') return { kind: 'none' };
  if (text.length > MAX_STATE_STRING_LENGTH) return { kind: 'invalid' };

  const params = new Map<string, string>();
  let ignored = 0;
  for (const part of text.split('&')) {
    const eq = part.indexOf('=');
    const key = eq === -1 ? part : part.slice(0, eq);
    const value = eq === -1 ? '' : part.slice(eq + 1);
    if (key !== 'v' && key !== 'r' && key !== 'c') continue; // 将来の追加キーは無視する
    if (params.has(key)) ignored += 1;
    else params.set(key, value);
  }

  const version = params.get('v');
  if (version === undefined) return params.size > 0 ? { kind: 'invalid' } : { kind: 'none' };
  if (!/^\d{1,4}$/.test(version)) return { kind: 'invalid' };
  if (Number(version) > NAV_STATE_VERSION) return { kind: 'unsupported' };
  if (Number(version) !== NAV_STATE_VERSION) return { kind: 'invalid' };

  const split = (value: string | undefined) => (value ? value.split(',') : []);
  const rangeTokens = split(params.get('r'));
  const cellTokens = split(params.get('c'));
  if (rangeTokens.length === 0 && cellTokens.length === 0) return { kind: 'none' };

  const result = normalizeState(index, rangeTokens, cellTokens);
  if (result.state.sections.length === 0) return { kind: 'invalid' };
  return { kind: 'ok', state: result.state, ignored: result.ignored + ignored, removedCells: result.removedCells };
}

// ---------------------------------------------------------------------------
// 表示用の要約
// ---------------------------------------------------------------------------

// 例: ['集合と論証 全体', '二次関数 3項目']。未選択は空配列。設定画面の範囲タグに使う。
export function rangeSummaryParts(index: NavIndex, sections: readonly string[]): string[] {
  const set = new Set(sections);
  const parts: string[] = [];
  for (const subject of index.subjects) {
    const subjectSections = subject.units.flatMap((unit) => unit.sections);
    if (subjectSections.length > 0 && subjectSections.every((section) => set.has(section.id))) {
      parts.push(`${subject.name} 全体`);
      continue;
    }
    for (const unit of subject.units) {
      const selected = unit.sections.filter((section) => set.has(section.id)).length;
      if (selected === 0) continue;
      parts.push(selected === unit.sections.length ? `${unit.name} 全体` : `${unit.name} ${selected}項目`);
    }
  }
  return parts;
}

// 例: 「集合と論証 全体＋二次関数 3項目」。未選択は空文字列。
export function rangeSummary(index: NavIndex, sections: readonly string[]): string {
  return rangeSummaryParts(index, sections).join('＋');
}

export function importanceLabel(importance: number): string {
  return IMPORTANCE_LEVELS.find((level) => level.value === importance)?.label ?? '';
}

// 例: 「土台：難易度1・2・3／本命：難易度1・2」。未選択は空文字列。
export function cellsSummary(cells: readonly string[]): string {
  const set = new Set(cells);
  if (ALL_CELLS.every((cell) => set.has(cell))) return 'すべてのマス';
  const rows: string[] = [];
  for (const level of IMPORTANCE_LEVELS) {
    const difficulties = DIFFICULTY_LEVELS.filter((difficulty) => set.has(cellKey(level.value, difficulty)));
    if (difficulties.length > 0) rows.push(`${level.label}：難易度${difficulties.join('・')}`);
  }
  return rows.join('／');
}

// 例: ['土台1・2', '本命1']（重要度ごとに、選択中の難易度を並べる）。未選択は空配列。
// 問題DBの抽出モード（スマホ幅）の条件タグに使う。
export function cellsSummaryParts(cells: readonly string[]): string[] {
  const set = new Set(cells);
  if (ALL_CELLS.every((cell) => set.has(cell))) return ['すべてのマス'];
  const parts: string[] = [];
  for (const level of IMPORTANCE_LEVELS) {
    const difficulties = DIFFICULTY_LEVELS.filter((difficulty) => set.has(cellKey(level.value, difficulty)));
    if (difficulties.length > 0) parts.push(`${level.label}${difficulties.join('・')}`);
  }
  return parts;
}

// 単元ごとの内訳（結果の並び順）。
export function unitBreakdown(index: NavIndex, problems: readonly NavProblem[]): { unitId: string; name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const problem of problems) counts.set(problem.unitId, (counts.get(problem.unitId) ?? 0) + 1);
  const rows: { unitId: string; name: string; count: number }[] = [];
  for (const subject of index.subjects) {
    for (const unit of subject.units) {
      const count = counts.get(unit.id) ?? 0;
      if (count > 0) rows.push({ unitId: unit.id, name: unit.name, count });
    }
  }
  return rows;
}

// 保存設定の初期名（選択範囲から自動生成）。
export function autoSettingName(index: NavIndex, state: NavState, maxLength = 40): string {
  const summary = rangeSummary(index, state.sections) || '学習設定';
  return summary.length > maxLength ? `${summary.slice(0, maxLength - 1)}…` : summary;
}

// ---------------------------------------------------------------------------
// 問題DBの抽出モード（既存の個別問題ページを、抽出した問題集合の中で見て回る）
// ---------------------------------------------------------------------------

// 既存の静的な個別問題URL（単元トップURL＋問題ID）。
export function problemHref(index: NavIndex, problem: NavProblem): string {
  return `${index.unitInfo.get(problem.unitId)?.unit.href ?? '/'}${problem.id}/`;
}

// 抽出結果の先頭の問題URL（0件ならnull）。「問題データベースで見る」の移動先。
export function firstResultHref(index: NavIndex, state: NavState): string | null {
  const first = extractProblems(index, state)[0];
  return first ? problemHref(index, first) : null;
}

export type DbModeView = {
  // 抽出結果（科目順 → 単元順 → display_order）。
  results: NavProblem[];
  // 結果順の個別問題URL。
  hrefs: string[];
  // 単元トップURL → その単元の最初の抽出問題URL・件数（抽出問題のない単元は含まない）。
  units: Map<string, { href: string; count: number }>;
  // 表示中のページが抽出結果の何番目か（0始まり。抽出対象外のページは-1）。
  current: number;
  // 抽出結果の中での前後の問題URL（対象外のページでは、次＝先頭の問題）。
  prevHref: string | null;
  nextHref: string | null;
};

// 問題DBの1ページ（currentPath）を抽出モードで表示するための情報。
// 一覧の絞り込み・単元リンクの行き先・前後の移動は、すべてここから決める。
export function buildDbModeView(index: NavIndex, state: NavState, currentPath: string): DbModeView {
  const results = extractProblems(index, state);
  const hrefs = results.map((problem) => problemHref(index, problem));
  const units: DbModeView['units'] = new Map();
  results.forEach((problem, i) => {
    const unitHref = index.unitInfo.get(problem.unitId)?.unit.href;
    if (!unitHref) return;
    const entry = units.get(unitHref);
    if (entry) entry.count += 1;
    else units.set(unitHref, { href: hrefs[i], count: 1 });
  });
  const path = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;
  const current = hrefs.indexOf(path);
  return {
    results,
    hrefs,
    units,
    current,
    prevHref: current > 0 ? hrefs[current - 1] : null,
    nextHref: current === -1 ? (hrefs[0] ?? null) : (hrefs[current + 1] ?? null),
  };
}
