import type { CollectionEntry } from 'astro:content';
import { parseMarkdownSections, findSection, type MarkdownSection } from './markdownSections';
import { readProblemAssetSvg } from './readProblemAsset';
import { flowAssetKey } from './prepareQuadratic27Entry';

// setLogic（M1-SL-001〜018、数学I「集合と論証」）1件分を、Web表示に必要な形へ
// 分解する処理。prepareExpressionCalculationEntry.tsと同じ構造の分解ロジックだが、Astroの
// コレクション型（CollectionEntry<'setLogic'>）は別ものなので、asset振り分けの
// 薄いswitch部分だけをこのファイルに複製している。見出しパーサー・flowAssetKey・
// parseStepTitle・verifyStepNumberMatchesIndexは複製せず、既存の汎用実装をそのまま使う。
//
// 集合と論証で新しく使うplacement（problem_meta / solution_meta）だけはこのファイルで処理する。
// 問題メタ・解法メタは「以下の図…」「上の図では…」のように本文の途中で図を参照するため、
// セクション末尾ではなく、本文中の単独段落 `[asset: <file>]` の位置へfigureを差し込む。
// 表示位置のマーカーとfrontmatterの宣言（file + placement）は1対1で対応していなければならず、
// 余ったマーカー・対応するマーカーの無い宣言はどちらもビルド時エラーにする。

export type SetLogicAssetEntry = {
  asset: CollectionEntry<'setLogic'>['data']['assets'][number];
  svg: string;
};

export interface PreparedSetLogicEntry {
  entry: CollectionEntry<'setLogic'>;
  problem: MarkdownSection | undefined;
  priorKnowledge: MarkdownSection | undefined;
  paraphrase: MarkdownSection | undefined;
  problemMeta: MarkdownSection | undefined;
  solutionMeta: MarkdownSection | undefined;
  thinkingFlow: MarkdownSection | undefined;
  finalAnswer: MarkdownSection | undefined;
  problemAssets: SetLogicAssetEntry[];
  finalAnswerAssets: SetLogicAssetEntry[];
  priorKnowledgeAssets: SetLogicAssetEntry[];
  flowAssetsByKey: Map<string, SetLogicAssetEntry[]>;
}

const SET_LOGIC_ASSETS_ROOT = 'src/content/setLogic-assets';

// markdownSections.tsがレンダリングした後のHTML上で、単独段落のマーカーを探す。
const INLINE_ASSET_MARKER = /<p>\[asset:\s*([^\]]+?)\s*\]<\/p>/g;

function injectInlineAssets(
  problemId: string,
  sectionTitle: string,
  section: MarkdownSection | undefined,
  assets: SetLogicAssetEntry[],
): MarkdownSection | undefined {
  if (!section) {
    if (assets.length > 0) {
      throw new Error(
        `[${problemId}] 「${sectionTitle}」へのasset (${assets.map((a) => a.asset.file).join(', ')}) が` +
          `宣言されていますが、セクションが存在しません。`,
      );
    }
    return section;
  }
  const byFile = new Map(assets.map((a) => [a.asset.file, a]));
  const used = new Set<string>();
  const html = section.html.replace(INLINE_ASSET_MARKER, (_, file: string) => {
    const resolved = byFile.get(file);
    if (!resolved) {
      throw new Error(
        `[${problemId}] 「${sectionTitle}」内のマーカー [asset: ${file}] に対応するassetが` +
          `frontmatterで宣言されていません。`,
      );
    }
    if (used.has(file)) {
      throw new Error(`[${problemId}] 「${sectionTitle}」内でマーカー [asset: ${file}] が重複しています。`);
    }
    used.add(file);
    return `<figure class="problem-asset-figure">${resolved.svg}</figure>`;
  });
  for (const file of byFile.keys()) {
    if (!used.has(file)) {
      throw new Error(
        `[${problemId}] 「${sectionTitle}」へのasset (${file}) に対応するマーカー [asset: ${file}] が` +
          `本文にありません。assetが表示されないため停止しました。`,
      );
    }
  }
  return { ...section, html };
}

// 置き換えられずに残ったマーカー（位置指定に対応しないセクションへ書かれたもの、
// 宣言の無いもの）は本文にそのまま文字として表示されてしまうため、全セクションを走査して止める。
function verifyNoStrayMarkers(problemId: string, sections: MarkdownSection[]): void {
  for (const section of sections) {
    if (/\[asset:/.test(section.html)) {
      throw new Error(
        `[${problemId}] 「${section.title}」に処理されないasset指定（[asset: ...]）が残っています。`,
      );
    }
    verifyNoStrayMarkers(problemId, section.subsections);
  }
}

export async function prepareSetLogicEntry(
  entry: CollectionEntry<'setLogic'>,
): Promise<PreparedSetLogicEntry> {
  const sections = await parseMarkdownSections(entry.body ?? '');
  const assets = entry.data.assets;
  const problemId = entry.data.problem_id;

  const problemAssets: SetLogicAssetEntry[] = [];
  const finalAnswerAssets: SetLogicAssetEntry[] = [];
  const priorKnowledgeAssets: SetLogicAssetEntry[] = [];
  const problemMetaAssets: SetLogicAssetEntry[] = [];
  const solutionMetaAssets: SetLogicAssetEntry[] = [];
  const flowAssetsByKey = new Map<string, SetLogicAssetEntry[]>();

  for (const asset of assets) {
    const resolved = {
      asset,
      svg: readProblemAssetSvg(problemId, asset.file, SET_LOGIC_ASSETS_ROOT),
    };
    switch (asset.placement) {
      case 'final_answer':
        finalAnswerAssets.push(resolved);
        break;
      case 'flow': {
        const key = flowAssetKey(asset.part, asset.flow as number);
        const list = flowAssetsByKey.get(key) ?? [];
        list.push(resolved);
        flowAssetsByKey.set(key, list);
        break;
      }
      case 'problem':
        problemAssets.push(resolved);
        break;
      case 'prior_knowledge':
        priorKnowledgeAssets.push(resolved);
        break;
      case 'problem_meta':
        problemMetaAssets.push(resolved);
        break;
      case 'solution_meta':
        solutionMetaAssets.push(resolved);
        break;
      default:
        throw new Error(
          `[${problemId}] asset (${asset.file}) の placement が不正です: ${asset.placement}`,
        );
    }
  }

  const problemMeta = injectInlineAssets(problemId, '問題メタ', findSection(sections, '問題メタ'), problemMetaAssets);
  const solutionMeta = injectInlineAssets(problemId, '解法メタ', findSection(sections, '解法メタ'), solutionMetaAssets);
  verifyNoStrayMarkers(
    problemId,
    sections
      .filter((s) => s.title !== '問題メタ' && s.title !== '解法メタ')
      .concat([problemMeta, solutionMeta].filter((s): s is MarkdownSection => s !== undefined)),
  );

  return {
    entry,
    problem: findSection(sections, '問題'),
    priorKnowledge: findSection(sections, '事前知識・使用公式'),
    paraphrase: findSection(sections, '問題の言い換え'),
    problemMeta,
    solutionMeta,
    thinkingFlow: findSection(sections, 'ThinkingFlow'),
    finalAnswer: findSection(sections, '最終解答'),
    problemAssets,
    finalAnswerAssets,
    priorKnowledgeAssets,
    flowAssetsByKey,
  };
}
