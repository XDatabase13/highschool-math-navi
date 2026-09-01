import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 正本Markdownは highschool_math_db の外、隣接フォルダ math_db_quadratic_working/problems/ にある。
// problem.md はここでは一切書き換えない。読み込むだけ。
const quadratic27 = defineCollection({
  loader: glob({
    // 段階的な試験実装（001→006→017→003）が完了し、事前監査でも27問全件に
    // 構造的な問題がないことを確認できたため、M1-QF-001〜027を一括対象とする。
    pattern: 'M1-QF-*.md',
    base: '../math_db_quadratic_working/problems',
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
    // 正本Markdownのasset仕様をそのまま受け取る。placement/part/flow/typeが表示制御の正本。
    // ファイル名からは何も推測しない。purpose/must_show/must_not_showは未記載でよい。
    // placementは 'problem' | 'flow' | 'final_answer' の3値のみ許可する。
    // これ以外の値や必須項目の欠落はここで弾き、prepareQuadratic27Entry側で
    // 問題文assetへ暗黙フォールバックさせない（不正データはビルド時エラーにする）。
    assets: z
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
      }),
  }),
});

export const collections = {
  quadratic27,
};
