import type { ProblemLabel, ThinkingFlowStep } from '../shared';
import type { AnswerBranch } from './quadratic-case';

// 比較実験用ページ専用データ。
//
// 正本は math_db_quadratic_working/problems/M1-QF-018.md（見出し・数式・最終解答は確定済み・検算済み）。
// このファイルはその正本を書き換えず、ThinkingFlow各段階の「本文」だけを
// 生徒が読んで次の一手が分かる密度に書き直したもの。見出しの意味・数式・最終解答の値はすべて正本と同じ。
// 問題メタ・解法メタは正本の文章をそのまま転記し、一切書き換えない。
//
// 目的：quadraticCaseProblems（6問検証サンプル）と同じ構造化コンポーネント（ThinkingFlow.astro /
// QuadraticCaseGraphSet.astro）に載せたときの完成度・制作コストを、既存の[slug].astro
//（正本Markdownをそのまま流し込むだけの実装）と比較すること。
// 27問の正本パイプラインには接続しない、独立した比較用ページ専用データとする。

export interface QuadraticSamplePart {
  partLabel: string;
  steps: ThinkingFlowStep[];
  answerBranches: AnswerBranch[];
}

export interface Quadratic018Sample {
  problemId: string;
  title: string;
  labels: ProblemLabel[];
  statement: string;
  // 正本の「問題メタ」「解法メタ」をそのまま転記（書き換えない）。
  problemMeta: string;
  solutionMeta: string;
  parts: QuadraticSamplePart[];
}

export const quadratic018Sample: Quadratic018Sample = {
  problemId: 'M1-QF-018',
  title: '軸が文字で動く固定区間の最大・最小',
  labels: [
    { key: 'importance', name: '重要度', value: '本命' },
    { key: 'difficulty', name: '難易度', value: '3' },
    { key: 'position', name: '位置づけ', value: '比較実験用サンプル（正本M1-QF-018のFlow本文を書き直したもの）' },
  ],
  statement:
    'a を実数とする。関数\n\ny = x² − 2ax + 1 （0≦x≦4）\n\nについて、次の問いに答えよ。\n\n(1) 最大値を求めよ。\n(2) 最小値を求めよ。',
  problemMeta:
    'この問題に取り組んでいる人は問題017も同時に取り組んでいると思われる。017では範囲に文字が入っていたが、本問題では式に文字が含まれている。範囲もしくは式の位置が確定せず、どちらかが動くイメージを持つこととなるが、相対的にやってることは同じであるため、どちらかを習得すればもう片方の習得も容易となりやすい。どちらの問題も"境目"を意識することが大事。境目の具体的な説明は解法メタで。',
  solutionMeta:
    '例にもれず平方完成からのグラフ化となる。017とまったく同じ手順である。頭の中でも紙面上でもよいが、範囲を固定化し、左から右に向かってグラフを動かしてみて欲しい。(1)であれば範囲の左端に最大値がある状態から、右の端に移る瞬間がある。この瞬間が場合分けの"境目"であり、aの範囲を記述するときにキーとなる数字となる。この"境目"では、最大値・最小値をとる場所が切り替わる。境目の数字が見つかったら、その前後でグラフのどこが最大・最小になっているかを確認すると、場合分けを整理しやすい。',
  parts: [
    {
      partLabel: '(1) 最大値',
      steps: [
        {
          kind: 'text',
          id: 'p1-step1',
          label: '① 平方完成する',
          body: 'y = x²−2ax+1 を平方完成すると、頂点の座標が (a, −a²+1) であることが分かる。この形にすることで、グラフの位置が文字aによってどう決まるかを扱えるようになる。次は、この頂点（軸x=a）が定義域 0≦x≦4 に対してどこにあるかを考える。',
          intermediateResult: 'y = (x−a)² − a² + 1\n頂点：(a, −a²+1)',
        },
        {
          kind: 'graph-compare',
          id: 'p1-step2',
          label: '② グラフ化（3パターン）',
          highlight: true,
          domainMin: 0,
          domainMax: 4,
          body:
            '軸 x=a の位置を、定義域 0≦x≦4 に対して左・内側・右と動かしながら、上に開いた放物線をイメージする。最大値を求めたいので、グラフの中で一番高い点がどこに来るかに注目する。軸がどこにあっても、最大値の候補は定義域の両端 x=0 と x=4 のどちらかであり、そのうち軸から遠い方が高くなる。「軸からの距離」で両端点を比べればよい、という見方に切り替える。',
          cases: [
            { key: 'A', label: '軸が定義域の中で左寄り', condition: '右端(x=4)の方が軸から遠い', vertexX: 1 },
            { key: 'B', label: '軸がちょうど真ん中', condition: '両端が軸から同じ距離', vertexX: 2 },
            { key: 'C', label: '軸が定義域の中で右寄り', condition: '左端(x=0)の方が軸から遠い', vertexX: 3 },
          ],
        },
        {
          kind: 'graph-compare',
          id: 'p1-step3',
          label: '③ 3つのパターンに対応するaの範囲',
          highlight: true,
          domainMin: 0,
          domainMax: 4,
          body:
            '軸 x=a から左端 x=0 までの距離は a、右端 x=4 までの距離は 4−a である。この2つの距離を比べるために a と 4−a の大小を比較すると、境目は a=4−a すなわち a=2 で見つかる。境目より小さいか大きいかで、どちらの端点が遠いかが入れ替わる。',
          cases: [
            { key: 'A', label: '頂点が2より左', condition: 'a < 2', vertexX: 1 },
            { key: 'B', label: '頂点がちょうど2', condition: 'a = 2', vertexX: 2 },
            { key: 'C', label: '頂点が2より右', condition: '2 < a', vertexX: 3 },
          ],
        },
        {
          kind: 'text',
          id: 'p1-step4',
          label: '④ それぞれにおける最大値',
          body: '見つけた境目 a=2 を基準に、軸からより遠い端点の方が最大値を与える、という③の関係を当てはめると、次のように整理できる。',
          intermediateResult: 'a<2 のとき、x=4 で最大\na=2 のとき、x=0,4 で最大\na>2 のとき、x=0 で最大',
        },
      ],
      answerBranches: [
        { condition: 'a<2 のとき', result: '最大値 17−8a（x=4）' },
        { condition: 'a=2 のとき', result: '最大値 1（x=0,4）' },
        { condition: '2<a のとき', result: '最大値 1（x=0）' },
      ],
    },
    {
      partLabel: '(2) 最小値',
      steps: [
        {
          kind: 'text',
          id: 'p2-step1',
          label: '① 平方完成する',
          body: '式は共通なので、頂点は同じく (a, −a²+1) である。今度は最小値を考えるので、上に開いた放物線の頂点（一番低い点）が定義域 0≦x≦4 の中に入っているかどうかに注目が移る。',
          intermediateResult: 'y = (x−a)² − a² + 1\n頂点：(a, −a²+1)',
        },
        {
          kind: 'graph-compare',
          id: 'p2-step2',
          label: '② グラフ化（3パターン）',
          highlight: true,
          domainMin: 0,
          domainMax: 4,
          body:
            '頂点（軸x=a）が定義域の中に入っていれば、そこがそのまま最小値になる。頂点が定義域の外（左側または右側）にあるときは、定義域内でグラフは単調に増加または減少しているだけなので、定義域に近い方の端点が最小値になる。「軸が定義域の中に入っているか、外に出ているか」で場合を分ける、という見方をする。',
          cases: [
            { key: 'A', label: '軸が定義域より左', condition: '定義域の外（左）', vertexX: -1 },
            { key: 'B', label: '軸が定義域の中', condition: '定義域の内側', vertexX: 2 },
            { key: 'C', label: '軸が定義域より右', condition: '定義域の外（右）', vertexX: 5 },
          ],
        },
        {
          kind: 'graph-compare',
          id: 'p2-step3',
          label: '③ 3つのパターンに対応するaの範囲',
          highlight: true,
          domainMin: 0,
          domainMax: 4,
          body:
            '定義域の左端は x=0、右端は x=4 なので、軸 x=a がこの範囲に入るかどうかは a を 0 と 4 に比べればよい。a が 0 より小さければ軸は定義域より左、4 より大きければ軸は定義域より右、その間であれば軸は定義域の中に入っている。',
          cases: [
            { key: 'A', label: '軸が定義域より左', condition: 'a < 0', vertexX: -1 },
            { key: 'B', label: '軸が定義域の中', condition: '0 ≦ a ≦ 4', vertexX: 2 },
            { key: 'C', label: '軸が定義域より右', condition: 'a > 4', vertexX: 5 },
          ],
        },
        {
          kind: 'text',
          id: 'p2-step4',
          label: '④ それぞれにおける最小値',
          body: '③で分けた3つの場合に、②で確認した「軸が中にあれば頂点、外にあれば近い端点」という関係を当てはめると、次のようになる。',
          intermediateResult: 'a<0 のとき、x=0 で最小\n0≦a≦4 のとき、x=a で最小\na>4 のとき、x=4 で最小',
        },
      ],
      answerBranches: [
        { condition: 'a<0 のとき', result: '最小値 1（x=0）' },
        { condition: '0≦a≦4 のとき', result: '最小値 −a²+1（x=a）' },
        { condition: '4<a のとき', result: '最小値 17−8a（x=4）' },
      ],
    },
  ],
};
