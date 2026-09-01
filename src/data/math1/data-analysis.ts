import type { ProblemLabel, ThinkingFlowStep } from '../shared';

export interface DataAnalysisProblem {
  slug: string;
  unit: string;
  title: string;
  labels: ProblemLabel[];
  statement: string;
  impressionPositioning: string;
  impressionAdvice: string;
  steps: ThinkingFlowStep[];
  answer: string;
}

// Phase 4: 6分野6問検証のうち「データの分析｜相関係数」代表問題。
// 数値設定は6問検証用の暫定値（本番教材では再調整予定）。
export const dataAnalysisProblems: DataAnalysisProblem[] = [
  {
    slug: 'correlation-coefficient',
    unit: 'データの分析',
    title: '相関係数',
    labels: [
      { key: 'priority', name: '優先度', value: '高' },
      { key: 'difficulty', name: '難易度', value: '低〜普通' },
      { key: 'position', name: '位置づけ', value: '6問検証用サンプル（数値は最終確定ではない）' },
    ],
    statement: '次の5組のデータについて、xとyの相関係数を求めなさい。\n\nx : 1, 2, 3, 4, 5\ny : 2, 1, 4, 3, 5',
    impressionPositioning:
      '絶対に押さえておきたい問題。数学Iの最後に出てくる「データの分析」は、意外と得点を稼ぎやすい穴場でもある。教科書や問題集の解答を見ると、式の多さや計算量で難しそうに感じるかもしれないが、実際にやっていることはかなり算数に近い。ほぼ計算中心で、手順を覚えてしまえば再現しやすい。相関係数を表から1から計算できるようになるだけでも、この範囲ではかなり得点につながりやすい。',
    impressionAdvice:
      '文章だけで覚えるより、YouTubeなどで計算の流れを一度通して見るのもおすすめ。自分で解くときは、とにかく表をしっかり書く。一番怖いのは考え方より計算ミス。データの分析では、長い計算の最後に答えがきれいな形になったらひとまず安心材料にしてよい。逆に、途中の数値が急に複雑になったり、最後の答えが妙に汚くなったら、一度計算を見直す価値がある。',
    steps: [
      {
        kind: 'table',
        id: 'step1',
        label: '① 必要な表を完成させる',
        highlight: true,
        body:
          'まず x̄=3, ȳ=3 を求める。その上で、表に x−x̄、y−ȳ、(x−x̄)²、(y−ȳ)²、(x−x̄)(y−ȳ) を追加し、計算用の表を完成させる。',
        note: '表の列は増えるが、1列ずつ埋めていけば難しくない。x̄, ȳを先に出しておくのがコツ。',
        table: {
          columnHeaders: ['1', '2', '3', '4', '5', '合計'],
          rows: [
            { label: 'x', values: ['1', '2', '3', '4', '5', '15'] },
            { label: 'y', values: ['2', '1', '4', '3', '5', '15'] },
            { label: 'x−x̄', values: ['−2', '−1', '0', '1', '2', '0'] },
            { label: 'y−ȳ', values: ['−1', '−2', '1', '0', '2', '0'] },
            { label: '(x−x̄)²', values: ['4', '1', '0', '1', '4', '10'] },
            { label: '(y−ȳ)²', values: ['1', '4', '1', '0', '4', '10'] },
            { label: '(x−x̄)(y−ȳ)', values: ['2', '2', '0', '0', '4', '8'] },
          ],
        },
      },
      {
        kind: 'text',
        id: 'step2',
        label: '② 分散を求める',
        body:
          '①の表の(x−x̄)²の合計、(y−ȳ)²の合計を、それぞれデータ数（5個）で割ると、xとyの分散が求まる。',
        note: '分散は「ズレの2乗」の平均。表の合計をデータ数で割るだけ。',
        intermediateResult: 'xの分散 = 10/5 = 2\nyの分散 = 10/5 = 2',
      },
      {
        kind: 'text',
        id: 'step3',
        label: '③ 標準偏差と共分散を求める',
        body:
          '分散の平方根が標準偏差。共分散は、①の(x−x̄)(y−ȳ)の合計をデータ数（5個）で割って求める。',
        note: '標準偏差は分散の平方根、共分散は「ズレ同士の積」の平均。',
        intermediateResult: 'xの標準偏差 = √2\nyの標準偏差 = √2\n共分散 = 8/5',
      },
      {
        kind: 'text',
        id: 'step4',
        label: '④ 相関係数を求める',
        highlight: true,
        body: '共分散を、xの標準偏差とyの標準偏差の積で割ると、相関係数が求まる。',
        note: '最後にきれいな数（0.8）になったら、計算が合っている可能性が高い。',
        intermediateResult: 'r = (8/5) / (√2 × √2)\n= (8/5) / 2\n= 4/5\n= 0.8',
      },
    ],
    answer: 'r = 0.8',
  },
];

export function getDataAnalysisProblem(slug: string): DataAnalysisProblem | undefined {
  return dataAnalysisProblems.find((problem) => problem.slug === slug);
}
