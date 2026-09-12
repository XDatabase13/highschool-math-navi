import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Root, RootContent, Heading } from 'mdast';

// markdownSections.ts と同じ見出し階層の分割アルゴリズム（##→###→####の再帰分割、
// "(1)"のようなpart番号抽出）を使い回すが、KaTeX適用後のHTMLではなく、
// remark-parseのposition（開始・終了offset）で元Markdownソースをそのままスライスした
// 生テキスト（生LaTeX・GFM表記・生HTMLを含む）を返す。
//
// ThinkingFlow単位のAI-context生成（src/utils/aiContext.ts）専用。
// 既存の表示パイプライン（markdownSections.ts / Quadratic27Detail.astro）は
// 変更しない。

export interface RawMarkdownSection {
  /** 見出しのテキスト（例："1. 代入する"、"(1) 最大値"） */
  title: string;
  /** 見出しの深さ（##=2, ###=3, ####=4） */
  depth: number;
  /** このセクション直下（見出し自体・下位見出しは含まない）の生Markdownテキスト */
  rawText: string;
  /** さらに深い見出しがあれば、そのセクションを再帰的に分割したもの。無ければ空配列。 */
  subsections: RawMarkdownSection[];
  /** 見出しが "(1) ..." のように小問番号で始まる場合の数値。小問でなければundefined。 */
  partNumber?: number;
}

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

interface RawGroup {
  title: string;
  nodes: RootContent[];
}

function groupByDepth(nodes: RootContent[], depth: number): RawGroup[] {
  const groups: RawGroup[] = [];
  let current: RawGroup | null = null;
  for (const node of nodes) {
    if (node.type === 'heading' && node.depth === depth) {
      current = { title: headingText(node), nodes: [] };
      groups.push(current);
    } else if (current) {
      current.nodes.push(node);
    }
  }
  return groups;
}

// ノード列に対応する元ソース区間をそのままスライスする。html化を経由しないため、
// 生LaTeX（$...$/$$...$$）・GFMパイプ表・生HTMLタグがすべて元の記法のまま残る。
function rawTextOf(nodes: RootContent[], source: string): string {
  if (nodes.length === 0) return '';
  const start = nodes[0].position?.start.offset;
  const end = nodes[nodes.length - 1].position?.end.offset;
  if (start === undefined || end === undefined) return '';
  return source.slice(start, end).trim();
}

function buildRawSections(nodes: RootContent[], depth: number, source: string): RawMarkdownSection[] {
  const groups = groupByDepth(nodes, depth);
  return groups.map((group) => {
    const deeperHeadingIndex = group.nodes.findIndex(
      (n) => n.type === 'heading' && n.depth === depth + 1,
    );
    const hasDeeper = deeperHeadingIndex !== -1;
    const ownNodes = hasDeeper ? group.nodes.slice(0, deeperHeadingIndex) : group.nodes;
    const subsections = hasDeeper ? buildRawSections(group.nodes, depth + 1, source) : [];
    const partMatch = group.title.match(/^\((\d+)\)/);
    return {
      title: group.title,
      depth,
      rawText: rawTextOf(ownNodes, source),
      subsections,
      partNumber: partMatch ? Number(partMatch[1]) : undefined,
    };
  });
}

/**
 * 正本Markdown本文（frontmatterを除いた部分）を、##見出し単位のセクションへ分割する。
 * 呼び出し側で改行コードをLFへ正規化した文字列を渡すこと（そのままoffsetの基準になる）。
 */
export async function parseMarkdownSectionsRaw(markdown: string): Promise<RawMarkdownSection[]> {
  const tree = mdastProcessor.parse(markdown) as Root;
  await mdastProcessor.run(tree);
  return buildRawSections(tree.children, 2, markdown);
}

/** セクション配列から、見出しテキストが一致するものを1件取り出す。 */
export function findRawSection(
  sections: RawMarkdownSection[],
  title: string,
): RawMarkdownSection | undefined {
  return sections.find((s) => s.title === title);
}
