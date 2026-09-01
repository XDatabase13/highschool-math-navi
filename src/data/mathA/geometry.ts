import type { ProblemLabel, ThinkingFlowStep } from '../shared';

export interface GeometryProblem {
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

// Phase 5: 6分野6問検証のうち「図形の性質｜メネラウスの定理」代表問題。
// 数値設定は6問検証用の暫定値（本番教材では再調整予定）。
// メネラウスの定理だけを説明する独立ページは現時点では作らない。
export const geometryProblems: GeometryProblem[] = [
  {
    slug: 'menelaus',
    unit: '図形の性質',
    title: 'メネラウスの定理',
    labels: [
      { key: 'priority', name: '優先度', value: '高' },
      { key: 'difficulty', name: '難易度', value: '低' },
      { key: 'position', name: '位置づけ', value: '6問検証用サンプル（数値は最終確定ではない）' },
    ],
    statement:
      '三角形ABCにおいて、点Dは辺AB上、点Fは辺CA上にある。直線DFと、辺BCをC側へ延長した直線との交点をEとする。\n\nAD : DB = 2 : 3\nCF : FA = 4 : 5\n\nのとき、BE : ECを求めなさい。',
    impressionPositioning:
      '絶対に押さえておきたい問題。メネラウスの定理は、図の形から比較的見つけやすい。三角形から直線が突き抜けて、全体が「アイスのコーン」のような形になっていたら、まずメネラウスを疑ってよい。基本形は難易度が低く、形を見抜いてルートをたどれるようになれば、得点につなげやすい。注意したいのは、見た目はチェバの定理に見えるが、実際にはメネラウスを使うタイプがあること。',
    impressionAdvice:
      '文字だけで公式を覚え込むより、YouTubeなどの短い動画で「図のどこをどうたどるのか」を映像で一度見る方が理解しやすい。メネラウスでは、正解につながるルートが一つとは限らない。特定の式の並びを丸暗記するのではなく、「2回、直進またはバックして、1回曲がる」という動きを3回繰り返して一周するイメージで考える。条件を満たすルートであればよい。',
    steps: [
      {
        kind: 'menelaus-route',
        id: 'step1',
        label: '① ルールに基づいてルートを探す',
        highlight: true,
        body:
          '三角形の頂点と、辺の上（または延長線上）にある点を、「2回、直進またはバックして、1回曲がる」を3回繰り返して一周するようにたどり、使う線分比の順番を決める。',
        note: '今回はA→D→B→E→C→F→Aという順で一周するルートをたどる。',
        showRoute: true,
      },
      {
        kind: 'text',
        id: 'step2',
        label: '② ルートに基づいて計算式を立てる',
        body: '①でたどったルートの順番で、線分比を掛け合わせて1になる式を立てる。',
        intermediateResult: 'AD/DB × BE/EC × CF/FA = 1\n\n2/3 × BE/EC × 4/5 = 1',
      },
      {
        kind: 'text',
        id: 'step3',
        label: '③ 未知の比を求める',
        highlight: true,
        body: '②の式を、求めたい比BE/ECについて解く。',
        intermediateResult: 'BE/EC = 15/8\n\nBE : EC = 15 : 8',
      },
    ],
    answer: 'BE : EC = 15 : 8',
  },
];

export function getGeometryProblem(slug: string): GeometryProblem | undefined {
  return geometryProblems.find((problem) => problem.slug === slug);
}
