export interface NavUnit {
  name: string;
  href: string;
}

export interface NavSubject {
  name: string;
  units: NavUnit[];
}

// Phase 5: 6分野6問検証が完了。数学Iの4単元と数学Aの2単元、計6問分のみ実ページを持つ。
// 他科目・他単元は今後の拡張を見越したプレースホルダー（表示のみ）。
export const subjectNav: NavSubject[] = [
  {
    name: '数学I',
    units: [
      { name: '数と式', href: '/math1/suto-shiki/factorization/' },
      { name: '二次関数', href: '/math1/quadratic/' },
      { name: '三角比', href: '/math1/trig/cyclic-quadrilateral/' },
      { name: 'データの分析', href: '/math1/data-analysis/correlation-coefficient/' },
    ],
  },
  {
    name: '数学A',
    units: [
      { name: '場合の数と確率', href: '/mathA/probability/repeated-trials/' },
      { name: '図形の性質', href: '/mathA/geometry/menelaus/' },
    ],
  },
  { name: '数学II', units: [] },
  { name: '数学B', units: [] },
  { name: '数学III', units: [] },
  { name: '数学C', units: [] },
];
