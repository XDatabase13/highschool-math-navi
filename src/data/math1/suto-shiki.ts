import type { ProblemLabel, ThinkingTextStep } from '../shared';

export type { ProblemLabel };

export interface SutoShikiProblem {
  slug: string;
  unit: string;
  title: string;
  labels: ProblemLabel[];
  statement: string;
  impressionPositioning: string;
  impressionAdvice: string;
  steps: ThinkingTextStep[];
  answer: string;
}

// Phase 2: 数と式（因数分解）代表問題1問のみ。
// 6分野6問のうちの1問。他の5問は未実装。
export const sutoShikiProblems: SutoShikiProblem[] = [
  {
    slug: 'factorization',
    unit: '数と式',
    title: '因数分解',
    labels: [
      { key: 'priority', name: '優先度', value: '高' },
      { key: 'difficulty', name: '難易度', value: '★★☆' },
      { key: 'position', name: '位置づけ', value: '文字が複数ある式の因数分解の基本形' },
    ],
    statement: '次の式を因数分解せよ。\n\nx² + xy − 2y² − 5x − y + 6',
    impressionPositioning:
      '文字が2種類（x, y）ある式の因数分解は、どの文字に着目して整理するかで見通しが大きく変わる。この問題は「次数の低い文字について整理する」という基本方針を確認するのに適した一問。',
    impressionAdvice:
      '最初からx, y両方を同時に扱おうとせず、まず一方の文字（次数の低い方）について式を整理し、残りの部分を独立に因数分解してから全体を見る、という順番で進めるとよい。',
    steps: [
      {
        kind: 'text',
        id: 'step1',
        label: '① xについて整理する',
        body:
          'x, yの2種類の文字があるので、次数の低いxについて降べきの順に整理する。yを含む項はxの係数とみなす。',
        intermediateResult: 'x² + (y−5)x − 2y² − y + 6',
      },
      {
        kind: 'text',
        id: 'step2',
        label: '② 後ろの部分を因数分解する',
        body:
          'xの1次以下の部分（定数項にあたる −2y² − y + 6）を、yについて因数分解しておく。',
        intermediateResult: 'x² + (y−5)x + (−2y+3)(y+2)',
      },
      {
        kind: 'text',
        id: 'step3',
        label: '③ 全体で因数分解する',
        highlight: true,
        body:
          'たすき掛けの要領で、xの1次の項の係数と②で得た定数部分の組み合わせから、xを含む2つの因数に分ける。',
        intermediateResult: '(x+2y−3)(x−y−2)',
      },
    ],
    answer: '(x+2y−3)(x−y−2)',
  },
];

export function getSutoShikiProblem(slug: string): SutoShikiProblem | undefined {
  return sutoShikiProblems.find((problem) => problem.slug === slug);
}
