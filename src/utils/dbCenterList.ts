// ProblemDbShell（PC中央列）とスマホ用の問題一覧ダイアログの両方から使う、
// 中央ペイン問題一覧の共通データ形。ここを唯一の分類ロジックとし、
// PC・スマホで別の分類ロジックを作らない。

export interface DbCenterItem {
  id: string;
  href: string;
  title: string;
  chips: string[];
  // 中央ペインで「所属範囲」ごとにアコーディオン表示するためのグループ情報。
  // どの区分に属するかは呼び出し側（各問題データ）が正本として持ち、
  // ここでは問題IDやレンジで区分を判定しない。
  groupId: string;
  groupLabel: string;
}

export interface DbCenterGroup {
  groupId: string;
  groupLabel: string;
  items: DbCenterItem[];
}

// 中央一覧・問題詳細タイトルの両方で使う3桁表示番号。内部ID（例: "M1-QF-017"）を
// そのまま表示せず、末尾の数字部分だけを抜き出す。中央一覧（ProblemGroupList.astro）と
// 問題詳細（Quadratic27Detail.astro）が別々に同じ正規表現を持たないよう、ここに一本化する。
export function displayProblemNumber(id: string): string {
  return id.match(/(\d+)$/)?.[0] ?? '';
}

// centerItemsは呼び出し側で既に表示順（教科書ベースの順序）に並んでいる前提。
// 同じgroupIdが連続している区間をひとまとまりのグループとして扱うだけで、
// グループ名や境界をここでハードコードしない。
export function groupCenterItems(items: DbCenterItem[]): DbCenterGroup[] {
  const groups: DbCenterGroup[] = [];
  for (const item of items) {
    const current = groups[groups.length - 1];
    if (current && current.groupId === item.groupId) {
      current.items.push(item);
    } else {
      groups.push({ groupId: item.groupId, groupLabel: item.groupLabel, items: [item] });
    }
  }
  return groups;
}
