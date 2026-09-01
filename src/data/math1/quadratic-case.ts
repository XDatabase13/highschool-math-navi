import type { ProblemLabel, ThinkingFlowStep } from '../shared';

export interface AnswerBranch {
  condition: string;
  result: string;
}

export interface QuadraticCaseProblem {
  slug: string;
  unit: string;
  title: string;
  labels: ProblemLabel[];
  statement: string;
  impressionPositioning: string;
  impressionAdvice: string;
  steps: ThinkingFlowStep[];
  answerBranches: AnswerBranch[];
}

// Phase 3: 6分野6問検証のうち「二次関数｜文字を含む最大・最小」代表問題。
// 既存の quadraticProblems（q001など）とは別データとして扱い、混同しない。
export const quadraticCaseProblems: QuadraticCaseProblem[] = [
  {
    slug: 'case-min-max',
    unit: '二次関数',
    title: '文字を含む最大・最小の場合分け',
    labels: [
      { key: 'priority', name: '優先度', value: '高' },
      { key: 'difficulty', name: '難易度', value: '高' },
      { key: 'position', name: '位置づけ', value: '6問検証用サンプル（数値は最終確定ではない）' },
    ],
    statement:
      '関数\n\ny = x² − 2ax + 3\n\nについて、0≦x≦2 における最小値を求めなさい。',
    impressionPositioning:
      '高校数学で最初に出てくる大きな鬼門の一つ。まずは文字を含まない二次関数の最大・最小をやってみて、それが余裕なら挑戦したい。難しい問題なので、一度全体を眺めて「言っていることは分かるけど難しいな」くらいなら、時間をかけて取り組む価値がある。逆に「何をやっているのか全然分からない」という状態なら、今はスルーするのもあり。学校の授業で扱われていたり、試験範囲として指定されているなら優先度は上がる。',
    impressionAdvice:
      'a が入ることでグラフの位置が決まらなくなるのが、この問題の難しいところ。考えるときは横方向の動きだけを見る。縦方向の動きは一切気にしなくていい。',
    steps: [
      {
        kind: 'text',
        id: 'step1',
        label: '① 平方完成する',
        body: 'y = x² − 2ax + 3 を平方完成し、頂点の座標が分かる形に変形する。',
        intermediateResult: 'y = (x−a)² + 3 − a²',
      },
      {
        kind: 'text',
        id: 'step2',
        label: '② 頂点を確認し、グラフを描く',
        body: '①の式から頂点の座標を読み取り、上に開いた放物線のグラフをイメージする。',
        note: '推奨：x軸、y軸は書かない',
        intermediateResult: '頂点：(a, 3−a²)',
      },
      {
        kind: 'graph-compare',
        id: 'step3',
        label: '③ ②で描いたグラフに、定義域 0≦x≦2 を縦線で書き込む',
        highlight: true,
        body:
          'グラフに x=0 と x=2 の縦線を書き込み、頂点がその範囲の左・中・右のどこにあるかで、定義域の中でのグラフの見え方がどう変わるかを比べる。',
        cases: [
          { key: 'A', label: '頂点が定義域より左', condition: 'a < 0', vertexX: -1 },
          { key: 'B', label: '頂点が定義域の中', condition: '0 ≦ a ≦ 2', vertexX: 1 },
          { key: 'C', label: '頂点が定義域より右', condition: 'a > 2', vertexX: 3 },
        ],
      },
      {
        kind: 'text',
        id: 'step4',
        label: '④ ③の3パターンを数式化する',
        highlight: true,
        body:
          '③で確認した3つの位置関係を、aの範囲による場合分けとして数式にする。頂点が定義域の外にあるときは、定義域の端（x=0またはx=2）で最小になることに注意する。',
        intermediateResult:
          'a≦0 のとき：3\n0<a<2 のとき：3−a²\n2≦a のとき：7−4a',
      },
    ],
    answerBranches: [
      { condition: 'a≦0 のとき', result: '最小値 3' },
      { condition: '0<a<2 のとき', result: '最小値 3−a²' },
      { condition: '2≦a のとき', result: '最小値 7−4a' },
    ],
  },
];

export function getQuadraticCaseProblem(slug: string): QuadraticCaseProblem | undefined {
  return quadraticCaseProblems.find((problem) => problem.slug === slug);
}
