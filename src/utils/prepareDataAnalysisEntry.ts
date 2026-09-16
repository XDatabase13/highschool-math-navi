import type { CollectionEntry } from 'astro:content';
import { parseMarkdownSections, findSection, type MarkdownSection } from './markdownSections';
import { readProblemAssetSvg } from './readProblemAsset';
import { flowAssetKey } from './prepareQuadratic27Entry';

// dataAnalysis（M1-DA-001〜023、データの分析の試験バッチ）1件分を、Web表示に必要な形へ
// 分解する処理。prepareTrigEntry.tsと同じ構造の分解ロジックだが、Astroのコレクション型
// （CollectionEntry<'dataAnalysis'>）は別ものなので、asset振り分けの薄いswitch部分だけを
// このファイルに複製している。見出しパーサー・flowAssetKey・parseStepTitle・
// verifyStepNumberMatchesIndexは複製せず、既存の汎用実装をそのまま使う。

export type DataAnalysisAssetEntry = {
  asset: CollectionEntry<'dataAnalysis'>['data']['assets'][number];
  svg: string;
};

export interface PreparedDataAnalysisEntry {
  entry: CollectionEntry<'dataAnalysis'>;
  problem: MarkdownSection | undefined;
  paraphrase: MarkdownSection | undefined;
  problemMeta: MarkdownSection | undefined;
  solutionMeta: MarkdownSection | undefined;
  thinkingFlow: MarkdownSection | undefined;
  finalAnswer: MarkdownSection | undefined;
  problemAssets: DataAnalysisAssetEntry[];
  finalAnswerAssets: DataAnalysisAssetEntry[];
  flowAssetsByKey: Map<string, DataAnalysisAssetEntry[]>;
}

const DATA_ANALYSIS_ASSETS_ROOT = 'src/content/dataAnalysis-assets';

export async function prepareDataAnalysisEntry(
  entry: CollectionEntry<'dataAnalysis'>,
): Promise<PreparedDataAnalysisEntry> {
  const sections = await parseMarkdownSections(entry.body ?? '');
  const assets = entry.data.assets;

  const problemAssets: DataAnalysisAssetEntry[] = [];
  const finalAnswerAssets: DataAnalysisAssetEntry[] = [];
  const flowAssetsByKey = new Map<string, DataAnalysisAssetEntry[]>();

  for (const asset of assets) {
    const resolved = {
      asset,
      svg: readProblemAssetSvg(entry.data.problem_id, asset.file, DATA_ANALYSIS_ASSETS_ROOT),
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
      default:
        throw new Error(
          `[${entry.data.problem_id}] asset (${asset.file}) の placement が不正です: ${asset.placement}`,
        );
    }
  }

  return {
    entry,
    problem: findSection(sections, '問題'),
    paraphrase: findSection(sections, '問題の言い換え'),
    problemMeta: findSection(sections, '問題メタ'),
    solutionMeta: findSection(sections, '解法メタ'),
    thinkingFlow: findSection(sections, 'ThinkingFlow'),
    finalAnswer: findSection(sections, '最終解答'),
    problemAssets,
    finalAnswerAssets,
    flowAssetsByKey,
  };
}
