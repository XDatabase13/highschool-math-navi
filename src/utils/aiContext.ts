import type { CollectionEntry } from 'astro:content';
import { parseMarkdownSectionsRaw, findRawSection, type RawMarkdownSection } from './rawMarkdownSections';
import { flowAssetKey, parseStepTitle, verifyStepNumberMatchesIndex } from './prepareQuadratic27Entry';

// ThinkingFlow単位のAI質問機能に向けた、AI-context JSON生成の本番用ロジック。
// DOM/生成HTMLは一切参照せず、公開Markdownスナップショット（quadratic27・trig4、
// どちらも独立検算済みの問題のみ）と、既存表示パイプラインと同じ見出し分割
// アルゴリズム（rawMarkdownSections.ts）・同じFlowキー/☆マーク処理
// （prepareQuadratic27Entry.tsのflowAssetKey/parseStepTitle）を再利用して組み立てる。
//
// 通常Flow・小問付きFlow・asset付きFlow・「## 問題の言い換え」・Markdown table・
// 生HTMLはすべて同じ処理を通り、問題ID別の分岐は持たない。
//
// 出力はsrc/pages/ai-context/[id].json.tsから、npm run build時に1問題1JSONとして
// distへ書き出される（このモジュール自体はAstroのpage/endpointではない）。

export type AiContextCollection = 'quadratic27' | 'trig4';

export interface AiContextAsset {
  file: string | null;
  placement: string | null;
  part: number | null;
  flow: number | null;
  type: string | null;
  purpose: string | null;
  must_show: string[];
  must_not_show: string[];
}

export interface AiContextTextPart {
  part: number | null;
  raw_title: string;
  text: string;
}

export interface AiContextTextBlock {
  text: string;
  parts: AiContextTextPart[];
}

export interface AiContextFlow {
  // 問題内でThinkingFlowの表示順に振った通し番号（"f1","f2",...）。
  // part/flowは教材構造・asset対応のための既存キーとして残すが、M1-TR-021のように
  // "(n)"形式でないグループ分け（主Flow／補助Flow等）ではpart+flowだけでは
  // 一意にならない場合があるため、AI機能側の主識別子はこちらを使う。
  context_key: string;
  part: number | null;
  flow: number;
  flow_key: string;
  part_raw_title?: string;
  part_title?: string;
  part_highlighted?: boolean;
  raw_title: string;
  title: string;
  highlighted: boolean;
  text: string;
  assets: AiContextAsset[];
}

export interface AiContext {
  problem_id: string;
  subject: string;
  unit: string;
  section: string;
  problem: AiContextTextBlock;
  paraphrase: AiContextTextBlock | null;
  thinking_flow: AiContextFlow[];
  final_answer: AiContextTextBlock;
  assets_problem: AiContextAsset[];
  assets_final_answer: AiContextAsset[];
  source_file: string;
}

// 元Markdownファイルは変更せず、AI-context生成時（メモリ上の文字列）だけ
// CRLF/CRをLFへ正規化する。rawMarkdownSectionsのoffsetも正規化後の文字列に
// 対して取るため、スライス結果とも整合する。
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

interface RawAssetLike {
  file: string;
  placement: string;
  part?: number;
  flow?: number;
  type: string;
  purpose?: string;
  must_show?: string[];
  must_not_show?: string[];
}

function normalizeAsset(a: RawAssetLike): AiContextAsset {
  return {
    file: a.file ?? null,
    placement: a.placement ?? null,
    part: a.part ?? null,
    flow: a.flow ?? null,
    type: a.type ?? null,
    purpose: a.purpose || null,
    must_show: a.must_show ?? [],
    must_not_show: a.must_not_show ?? [],
  };
}

function buildTextBlock(section: RawMarkdownSection | undefined): AiContextTextBlock {
  if (!section) return { text: '', parts: [] };
  return {
    text: section.rawText,
    parts: section.subsections.map((s) => ({
      part: s.partNumber ?? null,
      raw_title: s.title,
      text: s.rawText,
    })),
  };
}

function buildThinkingFlow(
  problemId: string,
  thinkingFlowSection: RawMarkdownSection | undefined,
): Omit<AiContextFlow, 'assets'>[] {
  if (!thinkingFlowSection) return [];

  const isNormal = thinkingFlowSection.subsections.every((s) => s.subsections.length === 0);
  const flows: Omit<AiContextFlow, 'assets'>[] = [];

  // context_keyは「表示順の通し番号」であり、part/flowの値とは独立に採番する
  // （M1-TR-021のように"(n)"形式でないグループ分けでpart/flowだけでは
  // 一意にならないケースでも、必ず1問題内で重複しない）。
  let contextIndex = 0;
  const nextContextKey = () => `f${(contextIndex += 1)}`;

  if (isNormal) {
    thinkingFlowSection.subsections.forEach((step, idx) => {
      const flowNum = idx + 1;
      verifyStepNumberMatchesIndex(problemId, '通常Flow', step.title, flowNum);
      const { displayTitle, highlighted } = parseStepTitle(step.title);
      flows.push({
        context_key: nextContextKey(),
        part: null,
        flow: flowNum,
        flow_key: flowAssetKey(undefined, flowNum),
        raw_title: step.title,
        title: displayTitle,
        highlighted,
        text: step.rawText,
      });
    });
  } else {
    thinkingFlowSection.subsections.forEach((part) => {
      const { displayTitle: partDisplayTitle, highlighted: partHighlighted } = parseStepTitle(part.title);
      part.subsections.forEach((step, idx) => {
        const flowNum = idx + 1;
        verifyStepNumberMatchesIndex(problemId, `小問Flow ${part.title}`, step.title, flowNum);
        const { displayTitle, highlighted } = parseStepTitle(step.title);
        flows.push({
          context_key: nextContextKey(),
          part: part.partNumber ?? null,
          flow: flowNum,
          flow_key: flowAssetKey(part.partNumber, flowNum),
          part_raw_title: part.title,
          part_title: partDisplayTitle,
          part_highlighted: partHighlighted,
          raw_title: step.title,
          title: displayTitle,
          highlighted,
          text: step.rawText,
        });
      });
    });
  }

  return flows;
}

function attachAssets(
  flows: Omit<AiContextFlow, 'assets'>[],
  assets: RawAssetLike[],
): AiContextFlow[] {
  return flows.map((f) => ({
    ...f,
    assets: assets
      .filter((a) => a.placement === 'flow' && (a.part ?? null) === f.part && a.flow === f.flow)
      .map(normalizeAsset),
  }));
}

export async function buildAiContext(
  entry: CollectionEntry<AiContextCollection>,
  collection: AiContextCollection,
): Promise<AiContext> {
  const body = normalizeLineEndings(entry.body ?? '');
  const sections = await parseMarkdownSectionsRaw(body);

  const problemSection = findRawSection(sections, '問題');
  // 「## 問題の言い換え」は存在する問題だけの任意セクション（本番UIのparaphraseと
  // 同じ扱い）。問題IDでの判定はせず、セクションの有無だけで含めるかを決める。
  const paraphraseSection = findRawSection(sections, '問題の言い換え');
  const thinkingFlowSection = findRawSection(sections, 'ThinkingFlow');
  const finalAnswerSection = findRawSection(sections, '最終解答');

  const assets = (entry.data.assets ?? []) as RawAssetLike[];
  const thinkingFlow = attachAssets(buildThinkingFlow(entry.data.problem_id, thinkingFlowSection), assets);

  return {
    problem_id: entry.data.problem_id,
    subject: entry.data.subject,
    unit: entry.data.unit,
    section: entry.data.section,
    problem: buildTextBlock(problemSection),
    paraphrase: paraphraseSection ? buildTextBlock(paraphraseSection) : null,
    thinking_flow: thinkingFlow,
    final_answer: buildTextBlock(finalAnswerSection),
    assets_problem: assets.filter((a) => a.placement === 'problem').map(normalizeAsset),
    assets_final_answer: assets.filter((a) => a.placement === 'final_answer').map(normalizeAsset),
    source_file: `src/content/${collection}/${entry.id}.md`,
  };
}
