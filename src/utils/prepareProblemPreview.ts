import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Root, Heading } from 'mdast';
import type { CollectionEntry } from 'astro:content';
import { parseMarkdownSections, findSection } from './markdownSections';
import { readProblemAssetSvg } from './readProblemAsset';
import { namespaceSvgIds } from './svgIdNamespace';
import type { TypePageProblemCollection, TypePageUnitConfig } from '../data/type-page-units';

// 型ページの問題preview用。既存問題1件から「## 問題」セクション（小問を含む）と
// placement: problem のassetだけを取り出す。問題の言い換え・事前知識・問題メタ・解法メタ・
// ThinkingFlow・最終解答・それ以外のplacementのassetは読まない
// （prepare*Entry.tsで全詳細をprepareしない。問題Markdown・assetは書き換えない）。

export interface ProblemPreviewAsset {
  // 表示分岐（type: table の開閉など）にだけ使う。Quadratic27Detailの問題文assetと同じ扱い。
  type: string;
  svg: string;
}

export interface ProblemPreview {
  problemId: string;
  problemHtml: string;
  parts: Array<{ title: string; html: string }>;
  assets: ProblemPreviewAsset[];
}

const PROBLEM_SECTION_TITLE = '問題';
const mdastProcessor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

function headingText(node: Heading): string {
  let text = '';
  const walk = (n: any) => {
    if (n.type === 'text' || n.type === 'inlineMath') text += n.value;
    else if (n.children) n.children.forEach(walk);
  };
  node.children.forEach(walk);
  return text.trim();
}

// 「## 問題」見出しから次の##見出しの直前までの元Markdownを切り出す
// （表示用HTML化は既存のparseMarkdownSectionsへそのまま渡し、問題ページと同じ描画にする）。
function sliceProblemSection(markdown: string, problemId: string): string {
  const tree = mdastProcessor.parse(markdown) as Root;
  const start = tree.children.findIndex(
    (n) => n.type === 'heading' && n.depth === 2 && headingText(n) === PROBLEM_SECTION_TITLE,
  );
  if (start === -1) throw new Error(`[${problemId}] 問題previewに必要な「## ${PROBLEM_SECTION_TITLE}」がありません。`);
  const end = tree.children.findIndex((n, i) => i > start && n.type === 'heading' && n.depth === 2);
  const startOffset = tree.children[start].position?.start.offset;
  const endOffset = end === -1 ? markdown.length : tree.children[end].position?.start.offset;
  if (startOffset === undefined || endOffset === undefined) {
    throw new Error(`[${problemId}] 「## ${PROBLEM_SECTION_TITLE}」の位置を特定できません。`);
  }
  return markdown.slice(startOffset, endOffset);
}

export async function prepareProblemPreview(
  entry: CollectionEntry<TypePageProblemCollection>,
  unit: TypePageUnitConfig,
): Promise<ProblemPreview> {
  const problemId = entry.data.problem_id;
  const sections = await parseMarkdownSections(sliceProblemSection(entry.body ?? '', problemId));
  const problem = findSection(sections, PROBLEM_SECTION_TITLE);
  if (!problem) throw new Error(`[${problemId}] 「## ${PROBLEM_SECTION_TITLE}」を解析できません。`);

  const parts = problem.subsections.map((part) => ({ title: part.title, html: part.html }));
  if ([problem.html, ...parts.map((p) => p.html)].some((html) => html.includes('[asset:'))) {
    throw new Error(`[${problemId}] 「## ${PROBLEM_SECTION_TITLE}」に処理されないasset指定（[asset: ...]）があります。`);
  }

  // 同一型ページ内で他問題のSVGとidが衝突しないよう、問題ID＋asset順の接頭辞で名前空間化する。
  const idPrefix = `tp-${problemId.toLowerCase()}`;
  const assets = entry.data.assets
    .filter((asset) => asset.placement === 'problem')
    .map((asset, index) => ({
      type: asset.type,
      svg: namespaceSvgIds(readProblemAssetSvg(problemId, asset.file, unit.assetsRoot), `${idPrefix}-a${index + 1}-`),
    }));

  return { problemId, problemHtml: problem.html, parts, assets };
}
