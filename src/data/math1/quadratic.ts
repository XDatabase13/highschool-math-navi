export interface AnswerStep {
  id: string;
  label: string;
  /** 「ここが分からない」で表示・コピーする、この段階だけに絞った質問プロンプト */
  prompt: string;
}

export interface QuadraticProblem {
  slug: string;
  number: string;
  title: string;
  importance: 1 | 2 | 3;
  difficulty: 1 | 2 | 3;
  note: string;
  statementIntro: string;
  statementItems: string[];
  steps: AnswerStep[];
}

// Phase 1 用のダミー問題。今後は配列に問題を追加するだけで一覧・詳細ページに反映される。
export const quadraticProblems: QuadraticProblem[] = [
  {
    slug: 'q001',
    number: '問1',
    title: '平方完成とグラフ',
    importance: 3,
    difficulty: 1,
    note: '二次関数の基本となる問題。このタイプは確実にできるようにしたい。',
    statementIntro: 'y = x² − 4x + 3 について、次のことを行いなさい。',
    statementItems: [
      '平方完成する',
      '軸を求める',
      '頂点を求める',
      'グラフの概形を確認する',
    ],
    steps: [
      {
        id: 'step1',
        label: '平方完成する',
        prompt: `高校数学の質問です。
次の二次関数について、平方完成する部分が分かりません。

y = x² - 4x + 3

数学が苦手な高校生向けに、
平方完成の操作を途中式を省略せず説明してください。
ただし、その後の軸・頂点・グラフについてはまだ説明しないでください。`,
      },
      {
        id: 'step2',
        label: '軸と頂点を確認する',
        prompt: `高校数学の質問です。
次の二次関数について、軸と頂点の求め方が分かりません。

y = x² - 4x + 3

平方完成した結果から軸と頂点を求める部分だけを、
数学が苦手な高校生向けに、途中式を省略せず説明してください。
ただし、平方完成の手順やグラフの概形についてはまだ説明しないでください。`,
      },
      {
        id: 'step3',
        label: 'グラフの向きを確認する',
        prompt: `高校数学の質問です。
次の二次関数について、グラフの向き（上に凸か下に凸か）の判断の仕方が分かりません。

y = x² - 4x + 3

x²の係数からグラフの向きを判断する考え方だけを、
数学が苦手な高校生向けに説明してください。
ただし、平方完成の手順や軸・頂点の求め方、グラフの概形についてはまだ説明しないでください。`,
      },
      {
        id: 'step4',
        label: 'グラフの概形を描く',
        prompt: `高校数学の質問です。
次の二次関数について、グラフの概形の描き方が分かりません。

y = x² - 4x + 3

軸・頂点・グラフの向きの情報をもとに、グラフの概形を描く手順を、
数学が苦手な高校生向けに説明してください。
ただし、平方完成や軸・頂点の求め方自体の説明は不要です。`,
      },
    ],
  },
];

export function getQuadraticProblem(slug: string): QuadraticProblem | undefined {
  return quadraticProblems.find((problem) => problem.slug === slug);
}
