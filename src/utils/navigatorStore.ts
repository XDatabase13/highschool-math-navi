// 4×4ナビゲーションのブラウザ内保存（localStorage）と、初期状態の復元優先順位。
// アカウント・サーバー・外部DBは使わない。保存するのは「条件」（範囲トークン＋セル）だけで、
// 問題ID一覧・学習履歴・正誤は保存しない（開くたびに、その時点の公開問題から再計算する）。
//
// Storageは引数で受け取る（ブラウザではlocalStorage、テストでは偽物）。利用不可・容量超過・
// 壊れたJSONでも例外を外へ出さず、結果の reason で呼び出し側へ伝える（ナビ操作は継続できる）。
//
// Nodeの型除去だけで読める構文に限定する（scripts/test-navigator.mjs から直接importする）。

import {
  autoSettingName,
  emptyState,
  encodeCells,
  encodeRange,
  normalizeState,
  parseStateString,
  serializeState,
  type NavIndex,
  type NavState,
  type ParseResult,
} from './navigatorCore.ts';

export const NAV_STORAGE_KEY = 'mathnavi.navigator';
export const NAV_STORAGE_VERSION = 1;
export const MAX_SAVED_SETTINGS = 30;
export const MAX_SETTING_NAME_LENGTH = 40;

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

// 保存する条件。r＝範囲トークン、c＝セル（encodeRange / encodeCells の出力）。
type StoredCondition = { r: string[]; c: string[] };
type StoredSetting = StoredCondition & { id: string; name: string; createdAt: string; updatedAt: string };
type StoredMark = StoredCondition & { at: string };
type StoredData = {
  v: number;
  saved: StoredSetting[];
  // 結果画面へ進んだ時点の条件（前回使用設定）。
  last: StoredMark | null;
  // ナビ操作中の下書き。
  draft: StoredMark | null;
};

// ok: 読み書きできる / unavailable: localStorageが使えない /
// unreadable: 保存データが壊れている / newer: 新しい形式のデータ（このバージョンでは扱えない）。
// unreadable・newer のときは元データを上書きしない（利用者が明示的にリセットするまで書き込まない）。
export type StoreStatus = 'ok' | 'unavailable' | 'unreadable' | 'newer';

export type WriteFailure = 'unavailable' | 'unreadable' | 'newer' | 'write-failed';

export type SavedSettingView = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  // 現在の公開データで正規化した条件。
  state: NavState;
  // serializeState(state)。空文字列＝現在は適用できる範囲が残っていない。
  stateString: string;
};

export type SaveResult =
  | { ok: true; setting: SavedSettingView }
  | { ok: false; reason: WriteFailure | 'duplicate' | 'limit' | 'empty'; existing?: SavedSettingView };

export type MutateResult = { ok: true } | { ok: false; reason: WriteFailure | 'not-found' | 'empty-name' };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isCondition(value: unknown): value is StoredCondition {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return isStringArray(v.r) && isStringArray(v.c);
}

function isSetting(value: unknown): value is StoredSetting {
  if (!isCondition(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.name === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string'
  );
}

function isMark(value: unknown): value is StoredMark {
  return isCondition(value) && typeof (value as Record<string, unknown>).at === 'string';
}

function emptyData(): StoredData {
  return { v: NAV_STORAGE_VERSION, saved: [], last: null, draft: null };
}

// 設定名の整形：制御文字・改行を空白にし、前後の空白を除き、長さを制限する。
// 表示は常にtextContentで行う（HTMLとして解釈しない）。
export function cleanSettingName(name: unknown): string {
  if (typeof name !== 'string') return '';
  return name
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SETTING_NAME_LENGTH);
}

export type NavStoreOptions = {
  now?: () => string;
  makeId?: () => string;
};

export function createNavStore(storage: StorageLike | null | undefined, options: NavStoreOptions = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const makeId =
    options.makeId ?? (() => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);

  function read(): { status: StoreStatus; data: StoredData } {
    if (!storage) return { status: 'unavailable', data: emptyData() };
    let raw: string | null;
    try {
      raw = storage.getItem(NAV_STORAGE_KEY);
    } catch {
      return { status: 'unavailable', data: emptyData() };
    }
    if (raw === null) return { status: 'ok', data: emptyData() };
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { status: 'unreadable', data: emptyData() };
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { status: 'unreadable', data: emptyData() };
    }
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.v !== 'number') return { status: 'unreadable', data: emptyData() };
    if (obj.v > NAV_STORAGE_VERSION) return { status: 'newer', data: emptyData() };
    if (obj.v !== NAV_STORAGE_VERSION) return { status: 'unreadable', data: emptyData() };
    return {
      status: 'ok',
      data: {
        v: NAV_STORAGE_VERSION,
        saved: Array.isArray(obj.saved) ? obj.saved.filter(isSetting) : [],
        last: isMark(obj.last) ? obj.last : null,
        draft: isMark(obj.draft) ? obj.draft : null,
      },
    };
  }

  function write(mutate: (data: StoredData) => void): { ok: true } | { ok: false; reason: WriteFailure } {
    const current = read();
    if (current.status !== 'ok') return { ok: false, reason: current.status };
    mutate(current.data);
    try {
      storage!.setItem(NAV_STORAGE_KEY, JSON.stringify(current.data));
    } catch {
      // 容量超過・プライベートモード等。保存できなくてもナビ・共有・DB利用は続けられる。
      return { ok: false, reason: 'write-failed' };
    }
    return { ok: true };
  }

  const toCondition = (index: NavIndex, state: NavState): StoredCondition => ({
    r: encodeRange(index, state.sections),
    c: encodeCells(state.cells),
  });

  const toView = (index: NavIndex, setting: StoredSetting): SavedSettingView => {
    const state = normalizeState(index, setting.r, setting.c).state;
    return {
      id: setting.id,
      name: cleanSettingName(setting.name) || '学習設定',
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
      state,
      stateString: serializeState(index, state),
    };
  };

  const markState = (index: NavIndex, mark: StoredMark | null): NavState | null => {
    if (!mark) return null;
    const state = normalizeState(index, mark.r, mark.c).state;
    return state.sections.length > 0 ? state : null;
  };

  return {
    status(): StoreStatus {
      return read().status;
    },

    listSettings(index: NavIndex): SavedSettingView[] {
      return read().data.saved.map((setting) => toView(index, setting));
    },

    lastState(index: NavIndex): NavState | null {
      return markState(index, read().data.last);
    },

    draftState(index: NavIndex): NavState | null {
      return markState(index, read().data.draft);
    },

    // 条件を新しい設定として保存する。同じ条件がすでに保存されている場合は保存せず、
    // 既存の設定を返す（重複防止）。
    saveSetting(index: NavIndex, state: NavState, name?: string): SaveResult {
      const stateString = serializeState(index, state);
      if (stateString === '') return { ok: false, reason: 'empty' };
      const current = read();
      if (current.status !== 'ok') return { ok: false, reason: current.status };
      const views = current.data.saved.map((setting) => toView(index, setting));
      const existing = views.find((view) => view.stateString === stateString);
      if (existing) return { ok: false, reason: 'duplicate', existing };
      if (current.data.saved.length >= MAX_SAVED_SETTINGS) return { ok: false, reason: 'limit' };

      const baseName = cleanSettingName(name) || autoSettingName(index, state, MAX_SETTING_NAME_LENGTH);
      const names = new Set(views.map((view) => view.name));
      let finalName = baseName;
      for (let n = 2; names.has(finalName); n += 1) {
        const suffix = `（${n}）`;
        finalName = `${baseName.slice(0, MAX_SETTING_NAME_LENGTH - suffix.length)}${suffix}`;
      }
      const timestamp = now();
      const setting: StoredSetting = {
        id: makeId(),
        name: finalName,
        ...toCondition(index, state),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const result = write((data) => {
        data.saved.push(setting);
      });
      return result.ok ? { ok: true, setting: toView(index, setting) } : result;
    },

    renameSetting(id: string, name: string): MutateResult {
      const cleaned = cleanSettingName(name);
      if (cleaned === '') return { ok: false, reason: 'empty-name' };
      let found = false;
      const result = write((data) => {
        const setting = data.saved.find((s) => s.id === id);
        if (setting) {
          found = true;
          setting.name = cleaned;
          setting.updatedAt = now();
        }
      });
      if (!result.ok) return result;
      return found ? { ok: true } : { ok: false, reason: 'not-found' };
    },

    deleteSetting(id: string): MutateResult {
      let found = false;
      const result = write((data) => {
        const before = data.saved.length;
        data.saved = data.saved.filter((s) => s.id !== id);
        found = data.saved.length !== before;
      });
      if (!result.ok) return result;
      return found ? { ok: true } : { ok: false, reason: 'not-found' };
    },

    // 結果画面へ進んだ（またはこの条件で学習すると決めた）時点で、前回使用設定として記録する。
    setLast(index: NavIndex, state: NavState) {
      return write((data) => {
        data.last = { ...toCondition(index, state), at: now() };
      });
    },

    setDraft(index: NavIndex, state: NavState) {
      return write((data) => {
        data.draft = state.sections.length > 0 ? { ...toCondition(index, state), at: now() } : null;
      });
    },

    // 指定した条件が、この端末の前回設定・下書き・保存済み設定のいずれかと同じか。
    // 共有URLを開いただけの条件（＝利用者がまだ採用していない条件）と区別するために使う。
    isOwnCondition(index: NavIndex, state: NavState): boolean {
      const stateString = serializeState(index, state);
      if (stateString === '') return false;
      const { data } = read();
      const marks = [data.last, data.draft]
        .map((mark) => markState(index, mark))
        .filter((s): s is NavState => s !== null)
        .map((s) => serializeState(index, s));
      return (
        marks.includes(stateString) ||
        data.saved.some((setting) => toView(index, setting).stateString === stateString)
      );
    },

    // 壊れた・新しい形式の保存データを、利用者の明示操作で消去する。
    reset(): { ok: boolean } {
      if (!storage) return { ok: false };
      try {
        storage.removeItem(NAV_STORAGE_KEY);
        return { ok: true };
      } catch {
        return { ok: false };
      }
    },
  };
}

export type NavStore = ReturnType<typeof createNavStore>;

export type InitialResolution = {
  // url: URLの共有・引き継ぎ条件を適用 / new: 新規設定（空）から始める
  source: 'url' | 'new';
  state: NavState;
  url: ParseResult;
  // URLに条件がないとき、利用者へ提示する復元候補（勝手には適用しない）。
  // 前回使用設定があればそれを、なければ操作途中の下書きを提示する。
  offer: { kind: 'last' | 'draft'; state: NavState } | null;
  storeStatus: StoreStatus;
};

// 初期状態の復元優先順位（仕様§8.3）。
//   1. URLに有効な条件がある → それを適用する（保存済み設定・前回設定・下書きより優先）。
//   2. 利用者が明示的に開いた保存設定 → 保存一覧の「開く」はURLへ条件を載せて遷移するため、1と同じ経路。
//   3. 前回使用設定 → 自動適用せず、「前回の設定を続ける／新しく設定する」の候補として返す。
//   4. 操作途中の下書き → 前回使用設定がないときだけ、同じく候補として返す。
//   5. 新規設定。
// この関数は読み取りだけで、保存データへは一切書き込まない（共有URLを開いただけでは
// 受信者の保存設定・前回設定・下書きを上書きしない）。
export function resolveInitialState(index: NavIndex, hash: unknown, store: NavStore): InitialResolution {
  const url = parseStateString(index, hash);
  const storeStatus = store.status();
  if (url.kind === 'ok') {
    return { source: 'url', state: url.state, url, offer: null, storeStatus };
  }
  const last = store.lastState(index);
  const draft = store.draftState(index);
  const offer = last
    ? ({ kind: 'last', state: last } as const)
    : draft
      ? ({ kind: 'draft', state: draft } as const)
      : null;
  return { source: 'new', state: emptyState(), url, offer, storeStatus };
}
