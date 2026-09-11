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
// placementは 'problem' | 'flow' | 'final_answer' の3値のみ許可する。
// これ以外の値や必須項目の欠落はここで弾き、prepare*Entry側で
// 問題文assetへ暗黙フォールバックさせない（不正データはビルド時エラーにする）。
// quadratic27・trig4（三角比試験バッチ）で共通利用する。
const problemAssetSchema = z
  .array(
    z.object({
      file: z.string(),
      placement: z.enum(['problem', 'flow', 'final_answer']),
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
    verification_status: z.string(),
    assets: problemAssetSchema,
  }),
});

// 三角比（M1-TR-001〜004）の試験バッチ用コレクション。数学I「二次関数」の
// 公開契約（quadratic27）とは完全に分離し、このコレクションを増やしても
// 既存54問のbuild・sitemap・中央ペイン分類には一切影響しない。
// 本番公開・sitemap掲載は行わない（教材化・表示検証のみの試験用）。
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
    verification_status: z.string(),
    assets: problemAssetSchema,
  }),
});

export const collections = {
  quadratic27,
  trig4,
};
