export interface NavUnit {
  name: string;
  href: string;
  // 初期検証用の6問サンプル（内部の設計・監査資産）。データは保持したまま、
  // 一般公開向けの通常導線（Nav等）からは外すためのフラグ。
  sampleOnly?: boolean;
}

export interface NavSubject {
  name: string;
  units: NavUnit[];
}

// Phase 5: 6分野6問検証が完了。数学Iの4単元と数学Aの2単元、計6問分のみ実ページを持つ。
// このうち二次関数はM1-QF-001〜054（54問）へ差し替え済みの一般公開対象。
// 他5単元は6問検証サンプルのまま（sampleOnly: true）で、一般公開の通常導線には出さない。
// 他科目・他単元は今後の拡張を見越したプレースホルダー（表示のみ）。
export const subjectNav: NavSubject[] = [
  {
    name: '数学I',
    units: [
      { name: '数と式', href: '/math1/suto-shiki/factorization/', sampleOnly: true },
      { name: '二次関数', href: '/math1/quadratic/' },
      { name: '三角比', href: '/math1/trig/cyclic-quadrilateral/', sampleOnly: true },
      { name: 'データの分析', href: '/math1/data-analysis/correlation-coefficient/', sampleOnly: true },
    ],
  },
  {
    name: '数学A',
    units: [
      { name: '場合の数と確率', href: '/mathA/probability/repeated-trials/', sampleOnly: true },
      { name: '図形の性質', href: '/mathA/geometry/menelaus/', sampleOnly: true },
    ],
  },
  { name: '数学II', units: [] },
  { name: '数学B', units: [] },
  { name: '数学III', units: [] },
  { name: '数学C', units: [] },
];

// sampleOnly単元（6問検証サンプル）を除いた、一般公開向けのナビゲーション。
// Nav.astro（通常Webページ側の左サイドナビ）と /app/（3ペインDB）の
// 科目・単元ペインの両方で、この一つの定義を共有する。
export const publicSubjectNav: NavSubject[] = subjectNav.map((subject) => ({
  name: subject.name,
  units: subject.units.filter((unit) => !unit.sampleOnly),
}));
