import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 正本Markdownは highschool_math_db の外、隣接フォルダ math_db_quadratic_working/problems/ にある
// （唯一の正本。ここでは一切書き換えない）。
// GitHub Actions等、正本フォルダが存在しない環境でもbuildできるよう、Web公開対象問題だけを
// repo内 src/content/<collection>/ へコピーした「公開用スナップショット」をここでは読み込む。
// スナップショットは npm run sync-content（scripts/sync-quadratic-content.mjs）で
// 正本から再生成する派生データであり、人が直接編集する対象ではない。

// 正本Markdownのasset仕様をそのまま受け取る共通スキーマ。placement/part/flow/typeが表示制御の正本。
// ファイル名からは何も推測しない。purpose/must_show/must_not_showは未記載でよい。
// placementは 'problem' | 'flow' | 'final_answer' | 'prior_knowledge' の4値のみ許可する。
// prior_knowledgeは「事前知識・使用公式」セクション内へのasset配置専用（M1-EC-016で初採用）。
// これ以外の値や必須項目の欠落はここで弾き、prepare*Entry側で
// 問題文assetへ暗黙フォールバックさせない（不正データはビルド時エラーにする）。
// quadratic27・trig4・dataAnalysis・expressionCalculationの4コレクションで共通利用する。
const problemAssetSchema = z
  .array(
    z.object({
      file: z.string(),
      placement: z.enum(['problem', 'flow', 'final_answer', 'prior_knowledge']),
      // 小問(1)(2)...内のFlowを指すときのみ存在する。
      part: z.number().optional(),
      flow: z.number().optional(),
      type: z.string(),
      purpose: z.string().optional(),
      must_show: z.array(z.string()).optional(),
      must_not_show: z.array(z.string()).optional(),
    }),
  )
  .superRefine((assets, ctx) => {
    assets.forEach((asset, index) => {
      if (asset.placement === 'flow' && asset.flow === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'flow'],
          message: `placement: flow の asset (${asset.file}) には flow が必須です。`,
        });
      }
    });
  });

// verification_statusの許可値。公開対象の判定（verifiedCollection.ts）は「独立検算済み」だけを使う。
// 任意文字列を通すと、誤字や更新漏れがあってもbuildは成功し、その問題が一覧・個別ページ・
// sitemapから黙って消えるため、想定外の値はここでビルド時エラーにする。
// 「未検算」は正本で実際に使われる値（検算前・更新漏れ時）なので許可し、非公開として扱う。
const verificationStatusSchema = z.enum(['独立検算済み', '未検算']);

const quadratic27 = defineCollection({
  loader: glob({
    pattern: 'M1-QF-*.md',
    base: './src/content/quadratic27',
    // slugではなく、正本のproblem_id（不変キー）をそのままidにする。
    generateId: ({ data }) => String(data.problem_id),
  }),
  schema: z.object({
    problem_id: z.string(),
    version: z.number(),
    subject: z.string(),
    unit: z.string(),
    section: z.string(),
    display_order: z.number(),
    title: z.string(),
    difficulty: z.number().min(1).max(4),
    importance: z.number().min(1).max(4),
    importance_label: z.string(),
    reference_problem: z.string(),
    verification_status: verificationStatusSchema,
    assets: problemAssetSchema,
  }),
});

// 数学I「三角比」（M1-TR-001〜041）用コレクション。quadratic27とはコレクションを分離しているが、
// 公開契約（index対象・sitemap掲載・canonicalは各URL自身）はquadratic27と同格
// （AGENTS.md「三角比の現在地」参照）。
const trig4 = defineCollection({
  loader: glob({
    pattern: 'M1-TR-*.md',
    base: './src/content/trig4',
    generateId: ({ data }) => String(data.problem_id),
  }),
  schema: z.object({
    problem_id: z.string(),
    version: z.number(),
    subject: z.string(),
    unit: z.string(),
    section: z.string(),
    display_order: z.number(),
    title: z.string(),
    difficulty: z.number().min(1).max(4),
    importance: z.number().min(1).max(4),
    importance_label: z.string(),
    reference_problem: z.string(),
    verification_status: verificationStatusSchema,
    assets: problemAssetSchema,
  }),
});

// 数学I「データの分析」（M1-DA-001〜023）用コレクション。quadratic27・trig4とは
// コレクションを分離しているが、公開契約（index対象・sitemap掲載・canonicalは各URL自身）は
// 同格（AGENTS.md「データの分析の現在地」参照）。
const dataAnalysis = defineCollection({
  loader: glob({
    pattern: 'M1-DA-*.md',
    base: './src/content/dataAnalysis',
    generateId: ({ data }) => String(data.problem_id),
  }),
  schema: z.object({
    problem_id: z.string(),
    version: z.number(),
    subject: z.string(),
    unit: z.string(),
    section: z.string(),
    display_order: z.number(),
    title: z.string(),
    difficulty: z.number().min(1).max(4),
    importance: z.number().min(1).max(4),
    importance_label: z.string(),
    reference_problem: z.string(),
    verification_status: verificationStatusSchema,
    assets: problemAssetSchema,
  }),
});

// 数学I「数と式」（M1-EC-001〜044）用コレクション。quadratic27・trig4・dataAnalysisとは
// コレクションを分離しているが、公開契約（index対象・sitemap掲載・canonicalは各URL自身）は
// 同格（AGENTS.md「数と式の現在地」参照）。
const expressionCalculation = defineCollection({
  loader: glob({
    pattern: 'M1-EC-*.md',
    base: './src/content/expressionCalculation',
    generateId: ({ data }) => String(data.problem_id),
  }),
  schema: z.object({
    problem_id: z.string(),
    version: z.number(),
    subject: z.string(),
    unit: z.string(),
    section: z.string(),
    display_order: z.number(),
    title: z.string(),
    difficulty: z.number().min(1).max(4),
    importance: z.number().min(1).max(4),
    importance_label: z.string(),
    reference_problem: z.string(),
    verification_status: verificationStatusSchema,
    assets: problemAssetSchema,
  }),
});

export const collections = {
  quadratic27,
  trig4,
  dataAnalysis,
  expressionCalculation,
};
