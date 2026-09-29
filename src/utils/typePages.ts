import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { z } from 'astro/zod';
import snapshotJson from '../data/type-pages.generated.json';
import {
  EXPECTED_PUBLISHED_TYPE_PAGE_COUNT,
  TYPE_PAGE_SLUG_PATTERN,
  TYPE_PAGE_SNAPSHOT_SCHEMA_VERSION,
  TYPE_PAGE_UNITS,
  problemUrl,
  typePageUnitById,
  typePageUrl,
  type TypePageProblemCollection,
  type TypePageUnitConfig,
  type TypePageUnitId,
} from '../data/type-page-units';
import { TYPE_PAGES_PUBLICATION_APPROVED } from '../data/type-page-publication';
import { getVerifiedCollection } from './verifiedCollection';
import { parseMarkdownSections, findSection } from './markdownSections';
import { prepareProblemPreview, type ProblemPreview } from './prepareProblemPreview';
import { assertSvgIdReferences } from './svgIdNamespace';

// 型ページ（問題タイプ）のWebデータ層。入力はcommit済みの2つのスナップショットだけ
// （src/data/type-pages.generated.json と typePages Content Collection）で、xlsxは読まない。
//
// 公開ゲート（仕様v1.1の一括公開ゲートを2026-09-28に改訂）：
// - 型Markdownは0〜38件のどの状態でも保存・同期・ローカル確認してよい。
// - productionで型route・型一覧nav・sitemapを出すのは「published全38件のMarkdownがそろっている」
//   かつ「人間が公開を明示承認した（src/data/type-page-publication.ts が true）」ときだけで、
//   38件を一括で出す。それ以外は1件も出さない（現行189 URLのまま）。
// - 承認済みなのに38件そろっていない、orphan・hold型のMarkdownがある … buildエラー。
// 開発時（astro dev）は公開前でも、Markdownがある型を同じroute・component経由で
// ローカル確認できる（noindex付き。productionには出さない）。

// ---------------------------------------------------------------------------
// 構造スナップショット（type-pages.generated.json）の型と検証
// ---------------------------------------------------------------------------

export type TypePageStatus = 'published' | 'hold';
export type TypeMembership = 'primary' | 'secondary';

export type TypeProblemRef = {
  problemId: string;
  membership: TypeMembership;
  role: string;
};

export type TypePageRecord = {
  id: string;
  unitId: TypePageUnitId;
  name: string;
  slug: string;
  status: TypePageStatus;
  displayOrder: number;
  primaryKeyword: string;
  problems: TypeProblemRef[];
};

export type TypePageSnapshot = {
  schemaVersion: 1;
  typePages: TypePageRecord[];
};

const unitIds = TYPE_PAGE_UNITS.map((u) => u.unitId) as [TypePageUnitId, ...TypePageUnitId[]];

const snapshotSchema = z
  .object({
    schemaVersion: z.literal(TYPE_PAGE_SNAPSHOT_SCHEMA_VERSION),
    typePages: z.array(
      z
        .object({
          id: z.string().regex(/^[A-Z]{2}-T\d{2}$/),
          unitId: z.enum(unitIds),
          name: z.string().min(1),
          slug: z.string().regex(TYPE_PAGE_SLUG_PATTERN),
          status: z.enum(['published', 'hold']),
          displayOrder: z.number().int().positive(),
          primaryKeyword: z.string().min(1),
          problems: z
            .array(
              z
                .object({
                  problemId: z.string().regex(/^M1-[A-Z]{2}-\d{3}$/),
                  membership: z.enum(['primary', 'secondary']),
                  role: z.string().min(1),
                })
                .strict(),
            )
            .min(1),
        })
        .strict(),
    ),
  })
  .strict();

function validateSnapshot(raw: unknown): TypePageSnapshot {
  const snapshot = snapshotSchema.parse(raw) as TypePageSnapshot;
  const errors: string[] = [];
  const ids = new Set<string>();
  const urls = new Set<string>();
  const slugsByUnit = new Set<string>();
  const ordersByUnit = new Set<string>();
  for (const page of snapshot.typePages) {
    const unit = typePageUnitById(page.unitId);
    if (!page.id.startsWith(`${unit.problemPrefix}-`)) errors.push(`${page.id}: 単元 ${page.unitId} の型ページIDではありません。`);
    if (ids.has(page.id)) errors.push(`${page.id}: 型ページIDが重複しています。`);
    ids.add(page.id);
    const url = typePageUrl(unit, page.slug);
    if (urls.has(url)) errors.push(`${page.id}: URL ${url} が重複しています。`);
    urls.add(url);
    const slugKey = `${page.unitId}/${page.slug}`;
    if (slugsByUnit.has(slugKey)) errors.push(`${page.id}: slug ${page.slug} が単元内で重複しています。`);
    slugsByUnit.add(slugKey);
    const orderKey = `${page.unitId}/${page.displayOrder}`;
    if (ordersByUnit.has(orderKey)) errors.push(`${page.id}: 表示順 ${page.displayOrder} が単元内で重複しています。`);
    ordersByUnit.add(orderKey);
    const problemIds = new Set<string>();
    for (const ref of page.problems) {
      if (!ref.problemId.startsWith(`M1-${unit.problemPrefix}-`)) errors.push(`${page.id}: ${ref.problemId} は単元外の問題です。`);
      if (problemIds.has(ref.problemId)) errors.push(`${page.id}: ${ref.problemId} が重複登録されています。`);
      problemIds.add(ref.problemId);
    }
    if (!page.problems.some((ref) => ref.membership === 'primary')) errors.push(`${page.id}: primary問題がありません。`);
  }
  const publishedCount = snapshot.typePages.filter((p) => p.status === 'published').length;
  if (publishedCount !== EXPECTED_PUBLISHED_TYPE_PAGE_COUNT) {
    errors.push(`published型ページが${publishedCount}件です（初版は${EXPECTED_PUBLISHED_TYPE_PAGE_COUNT}件固定）。`);
  }
  if (errors.length > 0) throw new Error(`type-pages.generated.json の検証に失敗しました:\n${errors.join('\n')}`);
  return snapshot;
}

const snapshot = validateSnapshot(snapshotJson);

function typePageRecordById(id: string): TypePageRecord {
  const record = snapshot.typePages.find((p) => p.id === id);
  if (!record) throw new Error(`型ページ ${id} が type-pages.generated.json にありません。`);
  return record;
}

// ---------------------------------------------------------------------------
// 公開ゲート（型Markdown collection・公開承認フラグとの結合）
// ---------------------------------------------------------------------------

type TypePageMarkdownEntry = CollectionEntry<'typePages'>;

interface TypePagePublication {
  // 同期済みの型Markdown（0〜38件。制作途中の保存・同期・ローカル確認は可）。
  markdownById: Map<string, TypePageMarkdownEntry>;
  // productionで型route・nav・sitemapを出すか（38件完了 かつ 公開承認済みのときだけtrue）。
  isPublic: boolean;
}

// content.config.tsのtypePages loaderと同じ判定。0件のcollectionに対してgetCollectionを
// 呼ぶとAstroが「does not exist or is empty」警告を出すため、0件のときは呼ばない。
function hasTypePageMarkdownSnapshot(): boolean {
  const dir = path.resolve(process.cwd(), 'src/content/typePages');
  return existsSync(dir) && readdirSync(dir).some((f) => /^[A-Z]{2}-T\d{2}\.md$/.test(f));
}

async function loadPublication(): Promise<TypePagePublication> {
  const entries = hasTypePageMarkdownSnapshot() ? await getCollection('typePages') : [];
  const errors: string[] = [];
  const markdownById = new Map<string, TypePageMarkdownEntry>();
  for (const entry of entries) {
    const record = snapshot.typePages.find((p) => p.id === entry.id);
    if (!record) errors.push(`型Markdown ${entry.id} に対応する型ページがありません（orphan）。`);
    else if (record.status !== 'published') errors.push(`hold型 ${entry.id} のMarkdownがスナップショットに混入しています。`);
    if ((entry.body ?? '').trim() === '') errors.push(`型Markdown ${entry.id} の本文が空です。`);
    markdownById.set(entry.id, entry);
  }
  const missing = snapshot.typePages
    .filter((p) => p.status === 'published' && !markdownById.has(p.id))
    .map((p) => p.id);
  const isComplete = missing.length === 0 && markdownById.size === EXPECTED_PUBLISHED_TYPE_PAGE_COUNT;
  if (TYPE_PAGES_PUBLICATION_APPROVED && !isComplete) {
    errors.push(
      `公開承認済み（TYPE_PAGES_PUBLICATION_APPROVED = true）ですが、型Markdownが` +
        `${markdownById.size}/${EXPECTED_PUBLISHED_TYPE_PAGE_COUNT}件です（1〜37件だけの公開はしません）。不足: ${missing.join(', ')}`,
    );
  }
  if (errors.length > 0) throw new Error(`型ページの公開ゲート検証に失敗しました:\n${errors.join('\n')}`);
  return { markdownById, isPublic: TYPE_PAGES_PUBLICATION_APPROVED && isComplete };
}

// productionでは1回だけ読む。devでは型Markdownの追加・編集を反映するため毎回読む。
let publicationPromise: Promise<TypePagePublication> | undefined;
function getPublication(): Promise<TypePagePublication> {
  if (import.meta.env.DEV) return loadPublication();
  publicationPromise ??= loadPublication();
  return publicationPromise;
}

// route・navに出す型ページ（hold型は常に含めない）。
// - 公開（38件完了＋公開承認）: published全件。production・devとも同じ。
// - 公開前のproduction: 0件（1〜38件のMarkdownがあっても出さない）。
// - 公開前のdev（includeLocalPreview指定時）: Markdownがある型（ローカル確認用）。
async function listRoutableTypePages(unitId: TypePageUnitId, includeLocalPreview: boolean): Promise<TypePageRecord[]> {
  const publication = await getPublication();
  const inUnit = (p: TypePageRecord) => p.unitId === unitId && p.status === 'published';
  let pages: TypePageRecord[] = [];
  if (publication.isPublic) {
    pages = snapshot.typePages.filter(inUnit);
  } else if (includeLocalPreview && import.meta.env.DEV) {
    pages = snapshot.typePages.filter((p) => inUnit(p) && publication.markdownById.has(p.id));
  }
  return [...pages].sort((a, b) => a.displayOrder - b.displayOrder);
}

// ---------------------------------------------------------------------------
// route・nav・sitemap向けの公開API
// ---------------------------------------------------------------------------

export interface TypeNavItem {
  id: string;
  name: string;
  href: string;
}

export interface TypePageRoute {
  id: string;
  slug: string;
}

// 型一覧nav（PC中央列・スマホdialogの「問題タイプ」）。masterの表示順昇順。
export async function getTypeNavItems(unitId: TypePageUnitId): Promise<TypeNavItem[]> {
  const unit = typePageUnitById(unitId);
  return (await listRoutableTypePages(unitId, true)).map((page) => ({
    id: page.id,
    name: page.name,
    href: typePageUrl(unit, page.slug),
  }));
}

// 各単元 [slug].astro の getStaticPaths 用。既存問題slug（問題ID）との衝突もここで検査する。
export async function getTypePageRoutes(unitId: TypePageUnitId, problemSlugs: string[]): Promise<TypePageRoute[]> {
  const pages = await listRoutableTypePages(unitId, true);
  const problemSlugSet = new Set(problemSlugs.map((s) => s.toLowerCase()));
  for (const page of pages) {
    if (problemSlugSet.has(page.slug.toLowerCase())) {
      throw new Error(`型ページ ${page.id} のslug「${page.slug}」が既存問題のURLと衝突します。`);
    }
  }
  return pages.map((page) => ({ id: page.id, slug: page.slug }));
}

// sitemap用。公開（38件完了＋公開承認）のときだけpublished全件。承認前のローカル確認用の型は
// 開発時でも含めない。
export async function getPublishedTypePagePaths(): Promise<Map<TypePageUnitId, string[]>> {
  const result = new Map<TypePageUnitId, string[]>();
  for (const unit of TYPE_PAGE_UNITS) {
    const pages = await listRoutableTypePages(unit.unitId, false);
    result.set(unit.unitId, pages.map((page) => typePageUrl(unit, page.slug)));
  }
  return result;
}

// ---------------------------------------------------------------------------
// 型内問題の並び順（presentation/order layer）
// ---------------------------------------------------------------------------

type VerifiedProblemEntry = CollectionEntry<TypePageProblemCollection>;

// 初版は既存問題の display_order 昇順だけ。将来の推薦順はこのcontextに新しいmodeを
// 追加して実装する（master・型Markdown・問題データには順序情報を持たせない）。
export type ProblemOrderingContext = { mode: 'number' };

export type OrderedTypeProblem = {
  problemId: string;
};

export function orderTypeProblems(
  candidates: TypeProblemRef[],
  problemEntries: VerifiedProblemEntry[],
  context: ProblemOrderingContext,
): OrderedTypeProblem[] {
  if (context.mode !== 'number') throw new Error(`未対応の並び順です: ${String(context.mode)}`);
  const byId = new Map(problemEntries.map((entry) => [entry.id, entry]));
  const seen = new Set<string>();
  const rows = candidates.map((ref) => {
    if (seen.has(ref.problemId)) throw new Error(`同じ問題 ${ref.problemId} が型へ重複登録されています。`);
    seen.add(ref.problemId);
    const entry = byId.get(ref.problemId);
    if (!entry) throw new Error(`型ページの問題 ${ref.problemId} が独立検算済みの問題データにありません。`);
    return { problemId: ref.problemId, displayOrder: entry.data.display_order };
  });
  rows.sort((a, b) => a.displayOrder - b.displayOrder || a.problemId.localeCompare(b.problemId));
  return rows.map(({ problemId }) => ({ problemId }));
}

// ---------------------------------------------------------------------------
// 型ページ本文の組み立て（TypePageDetail用）
// ---------------------------------------------------------------------------

export interface TypePageProblemView {
  ref: TypeProblemRef;
  problemId: string;
  title: string;
  importanceLabel: string;
  difficulty: number;
  href: string;
  preview: ProblemPreview;
}

export interface TypePageView {
  id: string;
  unit: TypePageUnitConfig;
  name: string;
  url: string;
  description: string;
  overviewHtml: string;
  // 公開ゲート（38件完了＋公開承認）を通過したページならtrue。公開前のローカル確認
  // （devでの承認前Markdown）ではfalseで、noindexを付ける。
  isPublic: boolean;
  problems: TypePageProblemView[];
}

// 型ページ用のProblemDbShell head・パンくずprops（仕様 §7.3〜7.5）。
// title全文・canonical・breadcrumbは保存せず、公開名・単元設定・slugから生成する。
// 公開前のローカル確認ページにはnoindexを付ける（それらはproduction buildに出ない）。
export function typePageShellProps(view: TypePageView) {
  return {
    title: `${view.name} | ${view.unit.subjectName} ${view.unit.unitName} | 高校数学ナビ`,
    description: view.description,
    canonicalPath: view.url,
    breadcrumbItems: [
      { label: view.unit.subjectName },
      { label: view.unit.unitName, href: `/math1/${view.unit.routeBase}/` },
      { label: view.name },
    ],
    noindex: !view.isPublic,
  };
}

async function renderOverviewHtml(markdown: string, id: string): Promise<string> {
  const sections = await parseMarkdownSections(markdown);
  const overview = findSection(sections, '型の概要');
  if (sections.length !== 1 || !overview || overview.subsections.length > 0 || overview.html.trim() === '') {
    throw new Error(`型ページ ${id}: 本文は「## 型の概要」1つだけで、空であってはいけません。`);
  }
  return overview.html;
}

export async function buildTypePageView(typePageId: string): Promise<TypePageView> {
  const record = typePageRecordById(typePageId);
  if (record.status !== 'published') throw new Error(`hold型 ${record.id} のページは生成しません。`);
  const unit = typePageUnitById(record.unitId);
  const publication = await getPublication();

  const entry = publication.markdownById.get(record.id);
  if (!publication.isPublic && !import.meta.env.DEV) {
    throw new Error(`型ページ ${record.id} は公開前（38件完了＋公開承認の前）のため生成できません。`);
  }
  // 公開後、または公開前のdevでのローカル確認（承認前の正式Markdown）。
  if (!entry) throw new Error(`型ページ ${record.id} のMarkdownがありません。`);
  const description = entry.data.description;
  const overviewMarkdown = entry.body ?? '';

  const entries = await getVerifiedCollection(unit.collection);
  const byId = new Map<string, VerifiedProblemEntry>(entries.map((entry) => [entry.id, entry]));
  const ordered = orderTypeProblems(record.problems, entries, { mode: 'number' });
  const problems: TypePageProblemView[] = [];
  for (const { problemId } of ordered) {
    const entry = byId.get(problemId) as VerifiedProblemEntry;
    problems.push({
      ref: record.problems.find((ref) => ref.problemId === problemId) as TypeProblemRef,
      problemId,
      title: entry.data.title,
      importanceLabel: entry.data.importance_label,
      difficulty: entry.data.difficulty,
      href: problemUrl(unit, problemId),
      preview: await prepareProblemPreview(entry, unit),
    });
  }

  // 1ページに並ぶ全previewのインラインSVGを通しで監査（重複id・参照切れはbuildエラー）。
  assertSvgIdReferences(
    problems.flatMap((p) => p.preview.assets.map((asset) => asset.svg)).join('\n'),
    `型ページ ${record.id}`,
  );

  return {
    id: record.id,
    unit,
    name: record.name,
    url: typePageUrl(unit, record.slug),
    description,
    overviewHtml: await renderOverviewHtml(overviewMarkdown, record.id),
    isPublic: publication.isPublic,
    problems,
  };
}
