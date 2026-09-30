// 4×4ナビゲーション（/navigator/・/app/navigation/）専用の選択階層設定。
// subject → unit → section へ、URL共有・ブラウザ保存に使う「短く安定した内部ID」を割り当てる。
//
// - IDは日本語の表示名から実行時に推測しない。正本frontmatterへナビ専用IDも追加しない（Web側だけで保持）。
// - 科目名・単元名・単元順は src/data/subjects.ts の dbSubjectNav が唯一の情報源で、ここには書かない
//   （dbUnitIdで参照するだけ）。section名は正本frontmatterの `section` 値そのものをキーにする。
// - 重要度・難易度・所属sectionは各問題のfrontmatterから読む。ここへ問題一覧や評価値を書かない。
// - 一度公開したIDは変更・再利用しない（共有URL・保存済み設定が別の範囲を指してしまうため）。
//   sectionを追加するときは新しい番号を足す。IDは科目・単元・sectionを通して一意にする。
// - 設定とfrontmatterの食い違い（未知のsection・問題が0件のsection・単元の過不足）は
//   buildNavData（src/utils/navigatorCore.ts）がbuildエラーにする。
//
// scripts/test-navigator.mjs（Node）からも直接importするため、Nodeの型除去だけで
// 読める構文に限定する（enum・namespaceは使わない。相対importは拡張子 .ts を付ける）。

export type NavigatorSectionConfig = {
  id: string;
  // 正本frontmatterの `section` 値（画面の表示名にもそのまま使う）。
  section: string;
};

export type NavigatorUnitConfig = {
  id: string;
  // dbSubjectNav（src/data/subjects.ts）の単元id。
  dbUnitId: string;
  // Content Collection名（src/content.config.ts）。
  collection: string;
  sections: NavigatorSectionConfig[];
};

export type NavigatorSubjectConfig = {
  id: string;
  // dbSubjectNavの科目名（一致しない場合はbuildエラー）。
  name: string;
  units: NavigatorUnitConfig[];
};

// 数学Aを追加するときは、dbSubjectNavへ科目・単元を足したうえで、ここへ
// { id: 'ma', name: '数学A', units: [...] } を追加し、src/utils/navigatorData.ts の
// collection読込表へ新しいcollectionを足す（状態形式・抽出ロジック・UIは変更不要）。
export const NAVIGATOR_SUBJECTS: readonly NavigatorSubjectConfig[] = [
  {
    id: 'm1',
    name: '数学I',
    units: [
      {
        id: 'ec',
        dbUnitId: 'suto-shiki',
        collection: 'expressionCalculation',
        sections: [
          { id: 'ec1', section: '式の計算' },
          { id: 'ec2', section: '因数分解' },
          { id: 'ec3', section: '実数・平方根' },
          { id: 'ec4', section: '一次不等式' },
        ],
      },
      {
        id: 'sl',
        dbUnitId: 'set-logic',
        collection: 'setLogic',
        sections: [
          { id: 'sl1', section: '集合' },
          { id: 'sl2', section: '命題・論証' },
        ],
      },
      {
        id: 'qf',
        dbUnitId: 'quadratic',
        collection: 'quadratic27',
        sections: [
          { id: 'qf1', section: '関数とグラフ' },
          { id: 'qf2', section: 'グラフ' },
          { id: 'qf3', section: '最大・最小' },
          { id: 'qf4', section: '決定' },
          { id: 'qf5', section: '二次方程式' },
          { id: 'qf6', section: 'グラフと二次方程式' },
          { id: 'qf7', section: '二次不等式' },
        ],
      },
      {
        id: 'tr',
        dbUnitId: 'trig',
        collection: 'trig4',
        sections: [
          { id: 'tr1', section: '三角比の基本（0〜90°）' },
          { id: 'tr2', section: '三角比の拡張（0〜180°）' },
          { id: 'tr3', section: '平面図形と三角比' },
          { id: 'tr4', section: '空間図形と三角比' },
        ],
      },
      {
        id: 'da',
        dbUnitId: 'data-analysis',
        collection: 'dataAnalysis',
        sections: [
          { id: 'da1', section: '代表値と度数分布' },
          { id: 'da2', section: '四分位数と箱ひげ図' },
          { id: 'da3', section: '分散と標準偏差' },
          { id: 'da4', section: '散布図と相関' },
          { id: 'da5', section: '仮説検定' },
        ],
      },
    ],
  },
];
