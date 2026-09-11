export interface NavUnit {
  // 3ペインDB UI（ProblemDbShell）で、現在表示中の単元をハイライトするための識別子。
  id: string;
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
      { id: 'suto-shiki', name: '数と式', href: '/math1/suto-shiki/factorization/', sampleOnly: true },
      { id: 'quadratic', name: '二次関数', href: '/math1/quadratic/' },
      { id: 'trig', name: '三角比', href: '/math1/trig/cyclic-quadrilateral/', sampleOnly: true },
      { id: 'data-analysis', name: 'データの分析', href: '/math1/data-analysis/correlation-coefficient/', sampleOnly: true },
    ],
  },
  {
    name: '数学A',
    units: [
      { id: 'probability', name: '場合の数と確率', href: '/mathA/probability/repeated-trials/', sampleOnly: true },
      { id: 'geometry', name: '図形の性質', href: '/mathA/geometry/menelaus/', sampleOnly: true },
    ],
  },
  { name: '数学II', units: [] },
  { name: '数学B', units: [] },
  { name: '数学III', units: [] },
  { name: '数学C', units: [] },
];

// sampleOnly単元（6問検証サンプル）を除いた、一般公開向けのナビゲーション。
// Nav.astro（TOPページ等、通常Webページ側の左サイドナビ）で使う。
// TOPページからのリンクはそのままクロール対象になるため、まだ本番公開contractに
// 昇格していない単元（三角比を含む）はここには出さない。
export const publicSubjectNav: NavSubject[] = subjectNav.map((subject) => ({
  name: subject.name,
  units: subject.units.filter((unit) => !unit.sampleOnly),
}));

// 3ペインDB UI（ProblemDbShell＝/app/・/math1/quadratic/*・/math1/trig/*）専用の単元ナビ。
// publicSubjectNav（TOPページ等のNav.astro）とは意図的に別管理にしている：
// 二次関数・三角比はどちらもDB UI自体は実装・レビュー済みで、個別問題ページを
// 相互に行き来できる必要があるが、三角比はTOPページ等からの一般導線・sitemap掲載は
// まだ行わない（CLAUDE.md「三角比の現在地」参照）。そのためpublicSubjectNavの
// sampleOnlyフィルタとは別に、DB UI側だけで見せる単元をここに列挙する。
// 新しい単元をDB UIへ追加するときはこの配列だけを更新すればよく、
// QF・TR個別のroute側に単元一覧をハードコードしない。
export const dbSubjectNav: NavSubject[] = [
  {
    name: '数学I',
    units: [
      { id: 'quadratic', name: '二次関数', href: '/math1/quadratic/' },
      { id: 'trig', name: '三角比', href: '/math1/trig/' },
    ],
  },
];
