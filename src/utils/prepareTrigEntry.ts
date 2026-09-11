import type { CollectionEntry } from 'astro:content';
import { parseMarkdownSections, findSection, type MarkdownSection } from './markdownSections';
import { readProblemAssetSvg } from './readProblemAsset';
import { flowAssetKey } from './prepareQuadratic27Entry';

// trig4（M1-TR-001〜004、三角比の試験バッチ）1件分を、Web表示に必要な形へ分解する処理。
// prepareQuadratic27Entry.tsと同じ構造の分解ロジックだが、Astroのコレクション型
// （CollectionEntry<'quadratic27'> / CollectionEntry<'trig4'>）は別ものなので、
// asset振り分けの薄いswitch部分だけをこのファイルに複製している。
// 見出しパーサー（parseMarkdownSections/findSection）・flowAssetKey・
// parseStepTitle・verifyStepNumberMatchesIndexは複製せず、既存の汎用実装をそのまま使う。

export type TrigAssetEntry = {
  asset: CollectionEntry<'trig4'>['data']['assets'][number];
  svg: string;
};

export interface PreparedTrigEntry {
  entry: CollectionEntry<'trig4'>;
  problem: MarkdownSection | undefined;
  paraphrase: MarkdownSection | undefined;
  problemMeta: MarkdownSection | undefined;
  solutionMeta: MarkdownSection | undefined;
  thinkingFlow: MarkdownSection | undefined;
  finalAnswer: MarkdownSection | undefined;
  problemAssets: TrigAssetEntry[];
  finalAnswerAssets: TrigAssetEntry[];
  flowAssetsByKey: Map<string, TrigAssetEntry[]>;
}

const TRIG_ASSETS_ROOT = 'src/content/trig4-assets';

export async function prepareTrigEntry(entry: CollectionEntry<'trig4'>): Promise<PreparedTrigEntry> {
  const sections = await parseMarkdownSections(entry.body ?? '');
  const assets = entry.data.assets;

  const problemAssets: TrigAssetEntry[] = [];
  const finalAnswerAssets: TrigAssetEntry[] = [];
  const flowAssetsByKey = new Map<string, TrigAssetEntry[]>();

  for (const asset of assets) {
    const resolved = {
      asset,
      svg: readProblemAssetSvg(entry.data.problem_id, asset.file, TRIG_ASSETS_ROOT),
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
