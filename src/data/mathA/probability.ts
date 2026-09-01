import type { ProblemLabel, ThinkingFlowStep } from '../shared';

export interface ProbabilityProblem {
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

// Phase 5: 6分野6問検証のうち「場合の数と確率｜反復試行」代表問題。
// 数値設定は6問検証用の暫定値（本番教材では再調整予定）。
export const probabilityProblems: ProbabilityProblem[] = [
  {
    slug: 'repeated-trials',
    unit: '場合の数と確率',
    title: '反復試行',
    labels: [
      { key: 'priority', name: '優先度', value: '高' },
      { key: 'difficulty', name: '難易度', value: '普通' },
      { key: 'position', name: '位置づけ', value: '6問検証用サンプル（数値は最終確定ではない）' },
    ],
    statement:
      '1個のさいころを5回投げる。「1または2の目が出る」回数がちょうど2回となる確率を求めなさい。',
    impressionPositioning:
      '確率では、まず文章を読んで「どのパターンの問題なのか」を見抜くことが最初の壁になる。この問題では、最初に「反復試行の問題だ」と気づけるかが重要で、そこが意外と難しい。公式の見た目も少し複雑なので、公式を丸暗記して数字を当てはめるだけだとかえって混乱しやすい。一方で反復試行は出題される可能性がかなり高く、基本形なら大きくひねられずに出ることも多い。そのため、標準的な反復試行まではかなり押さえておきたい。その先の複雑な反復試行まで進むかは、学校や目標によって判断が分かれる。',
    impressionAdvice:
      '「同じことを何回も繰り返す問題」だと気づいたら、全体の回数・その事象が起こる回数・1回でその事象が起こる確率・起こらない確率の4つを抜き出す。この4つが分かれば、あとは式を作って計算するだけ。反復試行の公式は、数式だけで丸暗記するより、「全体の回数C その事象が起こる回数」×「(起こる確率)^(起こる回数)」×「(起こらない確率)^(起こらない回数)」という日本語の構造で覚える方が分かりやすい。',
    steps: [
      {
        kind: 'text',
        id: 'step1',
        label: '① 全体の回数と、その事象が起こる回数を読み取る',
        body:
          '「1個のさいころを5回投げる」から全体の回数を、「ちょうど2回」から、その事象が起こる回数を読み取る。',
        intermediateResult: '全体の回数 = 5\nその事象が起こる回数 = 2',
      },
      {
        kind: 'text',
        id: 'step2',
        label: '② 1回でその事象が起こる確率と、起こらない確率を読み取る',
        body:
          '「1または2の目が出る」確率と、それ以外の目が出る（その事象が起こらない）確率を、それぞれ読み取る。',
        intermediateResult: '起こる確率 = 2/6 = 1/3\n起こらない確率 = 1 − 1/3 = 2/3',
      },
      {
        kind: 'text',
        id: 'step3',
        label: '③ 反復試行の式を作る',
        highlight: true,
        body: '①②で読み取った4つの値を、反復試行の公式に当てはめて式を作る。',
        note:
          '「全体の回数C起こる回数」×「(起こる確率)^(起こる回数)」×「(起こらない確率)^(起こらない回数)」という構造で覚えると分かりやすい。',
        intermediateResult: '5C2 × (1/3)² × (2/3)³',
      },
      {
        kind: 'text',
        id: 'step4',
        label: '④ 計算する',
        body: '③で作った式を計算する。',
        intermediateResult: '5C2 × (1/3)² × (2/3)³\n= 10 × 1/9 × 8/27\n= 80/243',
      },
    ],
    answer: '5C2 × (1/3)² × (2/3)³ = 80/243',
  },
];

export function getProbabilityProblem(slug: string): ProbabilityProblem | undefined {
  return probabilityProblems.find((problem) => problem.slug === slug);
}
