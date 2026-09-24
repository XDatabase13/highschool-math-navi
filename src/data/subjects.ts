export interface NavUnit {
  // 3ペインDB UI（ProblemDbShell）で、現在表示中の単元をハイライトするための識別子。
  id: string;
  name: string;
  href: string;
}

export interface NavSubject {
  name: string;
  units: NavUnit[];
}

// 3ペインDB UI（ProblemDbShell＝/app/・/math1/quadratic/*・/math1/trig/*・
// /math1/data-analysis/*・/math1/suto-shiki/*）専用の単元ナビ。サイト内で唯一の単元ナビで、
// 旧サンプル向けの左サイドナビ（Nav.astro・publicSubjectNav）は2026-09-24に削除した。
// 新しい単元をDB UIへ追加するときはこの配列だけを更新すればよく、
// QF・TR・DA個別のroute側に単元一覧をハードコードしない。
export const dbSubjectNav: NavSubject[] = [
  {
    name: '数学I',
    units: [
      { id: 'suto-shiki', name: '数と式', href: '/math1/suto-shiki/' },
      { id: 'quadratic', name: '二次関数', href: '/math1/quadratic/' },
      { id: 'trig', name: '三角比', href: '/math1/trig/' },
      { id: 'data-analysis', name: 'データの分析', href: '/math1/data-analysis/' },
    ],
  },
];
