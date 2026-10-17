import type { CollectionEntry } from 'astro:content';
import { parseMarkdownSections, findSection, type MarkdownSection } from './markdownSections';
import { readProblemAssetSvg } from './readProblemAsset';
import { flowAssetKey } from './prepareQuadratic27Entry';
import { injectInlineAssets, verifyNoStrayMarkers } from './prepareSetLogicEntry';

// countingProbability（MA-CP-001〜034、数学A「場合の数・確率」）1件分を、Web表示に必要な形へ
// 分解する処理。prepareSetLogicEntry.tsと同じ構造で、Astroのコレクション型
// （CollectionEntry<'countingProbability'>）が別ものなので、asset振り分けの薄いswitch部分だけを
// このファイルに複製している。見出しパーサー・flowAssetKey、問題メタ・解法メタ本文中の
// `[asset: <file>]` マーカー処理（injectInlineAssets・verifyNoStrayMarkers）は既存実装をそのまま使う。
// placementは6値（problem / flow / final_answer / prior_knowledge / problem_meta / solution_meta）
// すべてに対応する。

export type CountingProbabilityAssetEntry = {
  asset: CollectionEntry<'countingProbability'>['data']['assets'][number];
  svg: string;
};

export interface PreparedCountingProbabilityEntry {
  entry: CollectionEntry<'countingProbability'>;
  problem: MarkdownSection | undefined;
  priorKnowledge: MarkdownSection | undefined;
  paraphrase: MarkdownSection | undefined;
  problemMeta: MarkdownSection | undefined;
  solutionMeta: MarkdownSection | undefined;
  thinkingFlow: MarkdownSection | undefined;
  finalAnswer: MarkdownSection | undefined;
  problemAssets: CountingProbabilityAssetEntry[];
  finalAnswerAssets: CountingProbabilityAssetEntry[];
  priorKnowledgeAssets: CountingProbabilityAssetEntry[];
  flowAssetsByKey: Map<string, CountingProbabilityAssetEntry[]>;
}

const COUNTING_PROBABILITY_ASSETS_ROOT = 'src/content/countingProbability-assets';

export async function prepareCountingProbabilityEntry(
  entry: CollectionEntry<'countingProbability'>,
): Promise<PreparedCountingProbabilityEntry> {
  const sections = await parseMarkdownSections(entry.body ?? '');
  const assets = entry.data.assets;
  const problemId = entry.data.problem_id;

  const problemAssets: CountingProbabilityAssetEntry[] = [];
  const finalAnswerAssets: CountingProbabilityAssetEntry[] = [];
  const priorKnowledgeAssets: CountingProbabilityAssetEntry[] = [];
  const problemMetaAssets: CountingProbabilityAssetEntry[] = [];
  const solutionMetaAssets: CountingProbabilityAssetEntry[] = [];
  const flowAssetsByKey = new Map<string, CountingProbabilityAssetEntry[]>();

  for (const asset of assets) {
    const resolved = {
      asset,
      svg: readProblemAssetSvg(problemId, asset.file, COUNTING_PROBABILITY_ASSETS_ROOT),
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
