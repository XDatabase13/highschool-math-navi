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
