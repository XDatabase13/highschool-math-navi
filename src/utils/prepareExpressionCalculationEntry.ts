import type { CollectionEntry } from 'astro:content';
import { parseMarkdownSections, findSection, type MarkdownSection } from './markdownSections';
import { readProblemAssetSvg } from './readProblemAsset';
import { flowAssetKey } from './prepareQuadratic27Entry';

// expressionCalculation（M1-EC-001〜、数と式「式の計算」）1件分を、Web表示に必要な形へ
// 分解する処理。prepareDataAnalysisEntry.ts等と同じ構造の分解ロジックだが、Astroの
// コレクション型（CollectionEntry<'expressionCalculation'>）は別ものなので、asset振り分けの
// 薄いswitch部分だけをこのファイルに複製している。見出しパーサー・flowAssetKey・
// parseStepTitle・verifyStepNumberMatchesIndexは複製せず、既存の汎用実装をそのまま使う。

export type ExpressionCalculationAssetEntry = {
  asset: CollectionEntry<'expressionCalculation'>['data']['assets'][number];
  svg: string;
};

export interface PreparedExpressionCalculationEntry {
  entry: CollectionEntry<'expressionCalculation'>;
  problem: MarkdownSection | undefined;
  priorKnowledge: MarkdownSection | undefined;
  paraphrase: MarkdownSection | undefined;
  problemMeta: MarkdownSection | undefined;
  solutionMeta: MarkdownSection | undefined;
  thinkingFlow: MarkdownSection | undefined;
  finalAnswer: MarkdownSection | undefined;
  problemAssets: ExpressionCalculationAssetEntry[];
  finalAnswerAssets: ExpressionCalculationAssetEntry[];
  flowAssetsByKey: Map<string, ExpressionCalculationAssetEntry[]>;
}

const EXPRESSION_CALCULATION_ASSETS_ROOT = 'src/content/expressionCalculation-assets';

export async function prepareExpressionCalculationEntry(
  entry: CollectionEntry<'expressionCalculation'>,
): Promise<PreparedExpressionCalculationEntry> {
  const sections = await parseMarkdownSections(entry.body ?? '');
  const assets = entry.data.assets;

  const problemAssets: ExpressionCalculationAssetEntry[] = [];
  const finalAnswerAssets: ExpressionCalculationAssetEntry[] = [];
  const flowAssetsByKey = new Map<string, ExpressionCalculationAssetEntry[]>();

  for (const asset of assets) {
    const resolved = {
      asset,
      svg: readProblemAssetSvg(entry.data.problem_id, asset.file, EXPRESSION_CALCULATION_ASSETS_ROOT),
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
    priorKnowledge: findSection(sections, '事前知識・使用公式'),
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
