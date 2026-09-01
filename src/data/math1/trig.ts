import type { ProblemLabel, ThinkingFlowStep } from '../shared';

export interface TrigProblem {
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

// Phase 3: 6分野6問検証のうち「三角比｜円に内接する四角形」代表問題。
// 数値設定は6問検証用の暫定値（本番教材では再調整予定）。
export const trigProblems: TrigProblem[] = [
  {
    slug: 'cyclic-quadrilateral',
    unit: '三角比',
    title: '円に内接する四角形',
    labels: [
      { key: 'priority', name: '優先度', value: '高' },
      { key: 'difficulty', name: '難易度', value: '普通' },
      { key: 'position', name: '位置づけ', value: '6問検証用サンプル（数値は最終確定ではない）' },
    ],
    statement:
      '円に内接する四角形ABCDにおいて、\n\nAB = 3\nAD = 5\nBC = 2\n∠BAD = 60°\n\nとする。四角形ABCDの面積を求めなさい。',
    impressionPositioning:
      '応用問題っぽく見えるが、手順が長いだけで、一つ一つの処理はそれほど難しくない。円に内接する四角形は出題されやすく、この問題を通して、対角の性質・余弦定理・三角形の面積など、それまでに勉強した基本事項の復習にもなる。到達しやすさ、出題されやすさ、復習効果のバランスがよく、応用寄りの問題の中では安心して取り組んでよい。仮にテストで最後まで取り切れなくても、途中で使う処理は他の問題でも使うので無駄になりにくい。授業や試験範囲に「円に内接する四角形」という言葉が出ているなら、授業でまったく同じ形式を解いていなくても、取り組んでよい候補。',
    impressionAdvice:
      '円に内接する四角形は、2つの三角形に分けて考える。そのために自分で対角線を1本引く。そこからは、それぞれの三角形に対して今まで覚えた性質や公式を順番に使っていけばよい。',
    steps: [
      {
        kind: 'text',
        id: 'step1',
        label: '① 対角の関係を使う',
        body:
          '円に内接する四角形は、向かい合う角（対角）の和が180°になる。∠BAD=60°から、∠BCDが求まる。',
        intermediateResult: '∠BCD = 180° − 60° = 120°',
      },
      {
        kind: 'figure',
        id: 'step2',
        label: '② 対角線BDを引き、2つの三角形に分ける',
        highlight: true,
        body:
          '四角形ABCDに対角線BDを1本引き、△ABDと△BCDの2つの三角形に分けて考える。ここから先は、四角形ではなく2つの三角形として処理していく。',
        note: 'このステップの途中結果は数式ではなく「図の変化」。四角形の見え方から、2つの三角形の見え方に切り替わる。',
        figureVariant: 'quad-with-diagonal',
      },
      {
        kind: 'text',
        id: 'step3',
        label: '③ △ABDで余弦定理を使い、BDを求める',
        body: '△ABDにおいて、AB・AD・∠BADが分かっているので、余弦定理でBDが求まる。',
        intermediateResult: 'BD² = 3² + 5² − 2・3・5・cos60° = 19\nBD = √19',
      },
      {
        kind: 'text',
        id: 'step4',
        label: '④ △BCDで余弦定理を使い、CDを求める',
        highlight: true,
        body:
          '△BCDにおいて、BD（③で求めた値）・BC・∠BCD（①で求めた値）が分かっているので、CD=xとして余弦定理から方程式を立てて解く。',
        intermediateResult: '19 = 2² + x² − 2・2・x・cos120°\nこれを解いて CD = x = 3',
      },
      {
        kind: 'text',
        id: 'step5',
        label: '⑤ 2つの三角形の面積を求めて足す',
        body: '△ABDと△BCDのそれぞれの面積を求め、足し合わせると四角形ABCDの面積になる。',
        intermediateResult:
          '△ABD = 1/2・3・5・sin60° = 15√3/4\n△BCD = 1/2・2・3・sin120° = 3√3/2\n\n四角形ABCD = 15√3/4 + 3√3/2 = 21√3/4',
      },
    ],
    answer: '21√3 / 4',
  },
];

export function getTrigProblem(slug: string): TrigProblem | undefined {
  return trigProblems.find((problem) => problem.slug === slug);
}
