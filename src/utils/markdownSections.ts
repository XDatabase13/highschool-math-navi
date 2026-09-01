import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import type { Root, RootContent, Heading } from 'mdast';

// 正本Markdown（## 問題 / ## 問題メタ / ... / ### 1. ... / #### ...）の見出し階層を
// そのまま構造として扱うためのパーサー。Markdown自体は書き換えず、Web側で解析するだけ。
// 深い見出し（(1)/(2) → #### のような分岐）が現れても、depthを1つ増やして
// 再帰的に呼び出すだけで対応できるようにしてある。

export interface MarkdownSection {
  /** 見出しのテキスト（例："1. 代入する"、"(1) 最大値"） */
  title: string;
  /** 見出しの深さ（##=2, ###=3, ####=4） */
  depth: number;
  /** このセクション直下（見出し自体・下位見出しは含まない）のレンダリング済みHTML */
  html: string;
  /** さらに深い見出しがあれば、そのセクションを再帰的に分割したもの。無ければ空配列（＝末端ステップ）。 */
  subsections: MarkdownSection[];
  /** 見出しが "(1) ..." のように小問番号で始まる場合の数値。小問でなければundefined。 */
  partNumber?: number;
}

const mdastProcessor = unified().use(remarkParse).use(remarkMath);
const toHtmlProcessor = unified().use(remarkRehype).use(rehypeKatex).use(rehypeStringify);

function headingText(node: Heading): string {
  let text = '';
  const walk = (n: any) => {
    if (n.type === 'text' || n.type === 'inlineMath') text += n.value;
    else if (n.children) n.children.forEach(walk);
  };
  node.children.forEach(walk);
  return text.trim();
}

async function nodesToHtml(nodes: RootContent[]): Promise<string> {
  const root: Root = { type: 'root', children: nodes };
  const hastTree = await toHtmlProcessor.run(root);
  return toHtmlProcessor.stringify(hastTree as never) as string;
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
    // 最初の見出しより前のノードは、この問題データの想定上は現れない前提。
  }
  return groups;
}

async function buildSections(nodes: RootContent[], depth: number): Promise<MarkdownSection[]> {
  const groups = groupByDepth(nodes, depth);
  const sections: MarkdownSection[] = [];
  for (const group of groups) {
    const deeperHeadingIndex = group.nodes.findIndex(
      (n) => n.type === 'heading' && n.depth === depth + 1,
    );
    const hasDeeper = deeperHeadingIndex !== -1;
    const ownNodes = hasDeeper ? group.nodes.slice(0, deeperHeadingIndex) : group.nodes;
    const subsections = hasDeeper ? await buildSections(group.nodes, depth + 1) : [];
    const partMatch = group.title.match(/^\((\d+)\)/);
    sections.push({
      title: group.title,
      depth,
      html: await nodesToHtml(ownNodes),
      subsections,
      partNumber: partMatch ? Number(partMatch[1]) : undefined,
    });
  }
  return sections;
}

/** 正本Markdown本文（frontmatterを除いた部分）を、##見出し単位のセクションへ分割する。 */
export async function parseMarkdownSections(markdown: string): Promise<MarkdownSection[]> {
  const tree = mdastProcessor.parse(markdown) as Root;
  await mdastProcessor.run(tree);
  return buildSections(tree.children, 2);
}

/** セクション配列から、見出しテキストが一致するものを1件取り出す。 */
export function findSection(sections: MarkdownSection[], title: string): MarkdownSection | undefined {
  return sections.find((s) => s.title === title);
}
