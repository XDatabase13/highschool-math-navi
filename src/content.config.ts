import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// astro:content の z は非推奨（同じzod/v4をastro/zodから直接importする形が現行の推奨）。
import { z } from 'astro/zod';

// 正本Markdownは highschool_math_db の外、隣接フォルダ math_db_quadratic_working/problems/ にある
// （唯一の正本。ここでは一切書き換えない）。
// GitHub Actions等、正本フォルダが存在しない環境でもbuildできるよう、Web公開対象問題だけを
// repo内 src/content/<collection>/ へコピーした「公開用スナップショット」をここでは読み込む。
// スナップショットは npm run sync-content（scripts/sync-quadratic-content.mjs）で
// 正本から再生成する派生データであり、人が直接編集する対象ではない。

// 正本Markdownのasset仕様をそのまま受け取る共通スキーマ。placement/part/flow/typeが表示制御の正本。
// ファイル名からは何も推測しない。purpose/must_show/must_not_showは未記載でよい。
// placementは 'problem' | 'flow' | 'final_answer' | 'prior_knowledge' | 'problem_meta' | 'solution_meta'
// の6値のみ許可する。
// prior_knowledgeは「事前知識・使用公式」セクション内へのasset配置専用（M1-EC-016で初採用）。
// problem_meta / solution_metaは「問題メタ」「解法メタ」本文中へのasset配置専用（M1-SL-*で初採用）。
// 本文中の表示位置は、そのセクション内の単独段落 `[asset: <file>]` で示す
// （現状この2値を処理するのはprepareSetLogicEntry.tsのみ。他コレクションのprepare*Entry側では
// 未知のplacementとしてビルド時エラーになる）。
// これ以外の値や必須項目の欠落はここで弾き、prepare*Entry側で
// 問題文assetへ暗黙フォールバックさせない（不正データはビルド時エラーにする）。
// quadratic27・trig4・dataAnalysis・expressionCalculation・setLogicの5コレクションで共通利用する。
const problemAssetSchema = z
  .array(
    z.object({
      file: z.string(),
      placement: z.enum(['problem', 'flow', 'final_answer', 'prior_knowledge', 'problem_meta', 'solution_meta']),
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
          code: 'custom',
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

// 数学I「集合と論証」（M1-SL-001〜018）用コレクション。他の4コレクションとは
// コレクションを分離しているが、公開契約（index対象・sitemap掲載・canonicalは各URL自身）は同格とする。
const setLogic = defineCollection({
  loader: glob({
    pattern: 'M1-SL-*.md',
    base: './src/content/setLogic',
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

// 型ページ（問題タイプ）本文の公開用スナップショット。正本は教材側の
// type_pages/<型ページID>.md で、npm run sync-type-pages（scripts/sync-type-pages.mjs）が
// 検査に通ったpublished型の分をコピーする（制作途中の0〜37件も同期される）。
// productionで公開するかは src/utils/typePages.ts の公開ゲート（38件完了＋公開承認）が決める。
// 型の構造（公開名・slug・状態・表示順・所属問題）は src/data/type-pages.generated.json 側にあり、
// ここにはtitle・slug・問題ID等を重複させない（frontmatterは2keyだけのstrict schema）。
const TYPE_PAGES_BASE = './src/content/typePages';
const TYPE_PAGE_FILE_PATTERN = /^[A-Z]{2}-T\d{2}\.md$/;
const typePagesGlob = glob({
  pattern: '[A-Z][A-Z]-T[0-9][0-9].md',
  base: TYPE_PAGES_BASE,
  generateId: ({ entry, data }) => {
    const id = String(data.type_page_id);
    if (entry !== `${id}.md`) {
      throw new Error(`型ページMarkdown ${entry} の type_page_id（${id}）がファイル名と一致しません。`);
    }
    return id;
  },
});

const typePages = defineCollection({
  // 型Markdownが0件（README.mdだけ）の間はglob loaderを呼ばず空のcollectionにする
  // （globは一致ファイル0件でbuild警告を出すため）。1件以上あれば通常のglob loaderそのもの。
  loader: {
    name: 'type-pages-loader',
    load: async (context) => {
      const dir = path.resolve(process.cwd(), TYPE_PAGES_BASE);
      const hasMarkdown = existsSync(dir) && readdirSync(dir).some((f) => TYPE_PAGE_FILE_PATTERN.test(f));
      if (hasMarkdown) {
        await typePagesGlob.load(context);
        return;
      }
      context.store.clear();
      // dev（astro dev）では0件の状態から型Markdownが同期されてきたら、その時点で
      // 通常のglob loaderへ切り替える（以後の追加・変更・削除はglob loader自身が監視する）。
      if (context.watcher) {
        let started = false;
        context.watcher.add(dir);
        context.watcher.on('add', async (changedPath) => {
          if (started || path.dirname(path.resolve(changedPath)) !== dir) return;
          if (!TYPE_PAGE_FILE_PATTERN.test(path.basename(changedPath))) return;
          started = true;
          await typePagesGlob.load(context);
        });
      }
    },
  },
  schema: z
    .object({
      type_page_id: z.string().regex(/^[A-Z]{2}-T\d{2}$/),
      description: z.string().trim().min(1),
    })
    .strict(),
});

export const collections = {
  quadratic27,
  trig4,
  dataAnalysis,
  expressionCalculation,
  setLogic,
  typePages,
};
