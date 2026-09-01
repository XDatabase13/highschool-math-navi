// 問題データ横断（数学I・数学Aなど科目をまたいで）使う共通の型。
// ラベル(優先度・難易度等)と「考え方」フローのステップ形状を定義する。
// 元は data/math1/shared.ts にあったが、数学A追加に伴い科目非依存の場所へ移動した。

export interface ProblemLabel {
  key: string;
  name: string;
  value: string;
}

export interface ThinkingTextStep {
  kind: 'text';
  id: string;
  /** ①②③ などの見出し文言 */
  label: string;
  /** ★重要ステップとして軽く強調するか */
  highlight?: boolean;
  /** ステップの考え方本文 */
  body: string;
  /** 常時表示する短い補足（アドバイス等） */
  note?: string;
  /** 「途中結果を見る」で開く途中式 */
  intermediateResult: string;
}

export interface GraphCase {
  key: string;
  /** 例: 頂点が定義域より左 */
  label: string;
  /** 例: a < 0 */
  condition: string;
  /** グラフ上での頂点の代表x座標（QuadraticCaseGraphSetに渡すdomainMin/domainMaxと同じ縮尺） */
  vertexX: number;
}

export interface ThinkingGraphCompareStep {
  kind: 'graph-compare';
  id: string;
  label: string;
  highlight?: boolean;
  body: string;
  note?: string;
  cases: GraphCase[];
  /** 定義域の左端・右端（省略時はQuadraticCaseGraphSet側の既定値[0,2]）。 */
  domainMin?: number;
  domainMax?: number;
}

/**
 * 円に内接する四角形など、途中結果が数式ではなく「図の変化」そのもの
 * であるステップ用。variant で「補助線追加前後」を切り替える。
 * 汎用化はせず、この問題1件分の最小限の型として持つ。
 */
export interface ThinkingFigureStep {
  kind: 'figure';
  id: string;
  label: string;
  highlight?: boolean;
  body: string;
  note?: string;
  figureVariant: 'quad-initial' | 'quad-with-diagonal';
}

/** 表の1行分。label が行見出し（x, y, x−x̄ など）、values が各列の値。 */
export interface TableRow {
  label: string;
  values: string[];
}

/**
 * 相関係数の計算表など、途中結果が数式ではなく「表そのもの」であるステップ用。
 * 6問検証中につき、汎用の表エンジンにはせず、
 * 「列見出し＋行の配列」という最小限の形だけを持つ。
 */
export interface ThinkingTableStep {
  kind: 'table';
  id: string;
  label: string;
  highlight?: boolean;
  body: string;
  note?: string;
  table: {
    columnHeaders: string[];
    rows: TableRow[];
  };
}

/**
 * メネラウスの定理など、途中結果が数式ではなく「図の上のルート」そのもの
 * であるステップ用。showRoute で「ルート矢印の有無」を切り替える。
 * 汎用化はせず、この問題1件分の最小限の型として持つ。
 */
export interface ThinkingMenelausRouteStep {
  kind: 'menelaus-route';
  id: string;
  label: string;
  highlight?: boolean;
  body: string;
  note?: string;
  showRoute: boolean;
}

export type ThinkingFlowStep =
  | ThinkingTextStep
  | ThinkingGraphCompareStep
  | ThinkingFigureStep
  | ThinkingTableStep
  | ThinkingMenelausRouteStep;
