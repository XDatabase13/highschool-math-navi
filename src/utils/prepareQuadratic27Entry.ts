import type { CollectionEntry } from 'astro:content';
import { parseMarkdownSections, findSection, type MarkdownSection } from './markdownSections';
import { readProblemAssetSvg } from './readProblemAsset';

// quadratic27（正本Markdown）1件分を、Web表示に必要な形へ分解する共通処理。
// [slug].astro（単体ページ）と app/index.astro（DB型UI）の両方から使う。
// Markdown自体は書き換えず、分割・asset対応付けだけをここで行う。

export type AssetEntry = {
  asset: CollectionEntry<'quadratic27'>['data']['assets'][number];
  svg: string;
};

export interface PreparedQuadratic27Entry {
  entry: CollectionEntry<'quadratic27'>;
  problem: MarkdownSection | undefined;
  problemMeta: MarkdownSection | undefined;
  solutionMeta: MarkdownSection | undefined;
  thinkingFlow: MarkdownSection | undefined;
  finalAnswer: MarkdownSection | undefined;
  problemAssets: AssetEntry[];
  finalAnswerAssets: AssetEntry[];
  flowAssetsByKey: Map<string, AssetEntry[]>;
}

export function flowAssetKey(part: number | undefined, flow: number): string {
  return part !== undefined ? `${part}:${flow}` : `${flow}`;
}

export async function prepareQuadratic27Entry(
  entry: CollectionEntry<'quadratic27'>,
): Promise<PreparedQuadratic27Entry> {
  const sections = await parseMarkdownSections(entry.body ?? '');
  const assets = entry.data.assets;

  const problemAssets: AssetEntry[] = [];
  const finalAnswerAssets: AssetEntry[] = [];
  const flowAssetsByKey = new Map<string, AssetEntry[]>();

  for (const asset of assets) {
    const resolved = { asset, svg: readProblemAssetSvg(entry.data.problem_id, asset.file) };
    // placementはcontent.config.tsのschemaで 'problem' | 'flow' | 'final_answer' に
    // 限定済み（'flow'ならflowも必須）。ここでは各値を明示的に振り分けるだけで、
    // 未知の値・項目欠落を問題文assetへ暗黙フォールバックさせることはしない。
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
    problemMeta: findSection(sections, '問題メタ'),
    solutionMeta: findSection(sections, '解法メタ'),
    thinkingFlow: findSection(sections, 'ThinkingFlow'),
    finalAnswer: findSection(sections, '最終解答'),
    problemAssets,
    finalAnswerAssets,
    flowAssetsByKey,
  };
}

// ThinkingFlow見出しの先頭にある強調マーク（☆☆ / ☆ / （技）☆）を検出し、
// 表示用タイトルからは取り除く。マークの有無を highlight として返す。
// 対応語彙は problems/_TEMPLATE_for_page_generation.md と揃えてある。
const MARKER_PATTERN = /^(\d+\.\s*)(☆☆|☆|（技）☆)\s*(.*)$/;

export function parseStepTitle(title: string): { displayTitle: string; highlighted: boolean } {
  const match = title.match(MARKER_PATTERN);
  if (!match) return { displayTitle: title, highlighted: false };
  const [, prefix, , rest] = match;
  return { displayTitle: `${prefix}${rest}`, highlighted: true };
}

// asset配置（flowAssetKey）は「配列位置（index + 1）」をFlow番号として扱っている。
// これはThinkingFlow見出しの番号（例："2. ☆ グラフ化"の"2"）と一致している前提に依存する。
// 前提が崩れた（見出しの並び順とFlow番号がずれた）場合に asset が静かに誤配置されるのを防ぐため、
// 見出しから読み取ったFlow番号と配列位置を突き合わせ、不一致ならビルドを止める。
const STEP_NUMBER_PATTERN = /^(\d+)\./;

export function verifyStepNumberMatchesIndex(
  problemId: string,
  contextLabel: string,
  title: string,
  expectedNumber: number,
): void {
  const match = title.match(STEP_NUMBER_PATTERN);
  const actualNumber = match ? Number(match[1]) : undefined;
  if (actualNumber !== expectedNumber) {
    throw new Error(
      `[${problemId}] ${contextLabel}: ThinkingFlow見出しのFlow番号(${actualNumber ?? '読み取れません'})が` +
        `配列位置から期待される番号(${expectedNumber})と一致しません（見出し: "${title}"）。` +
        `asset配置（flowAssetKey）が誤配置になる可能性があるため停止しました。`,
    );
  }
}
