import type { AiContext, AiContextFlow, QuestionType } from './types';
import { stripHtmlForPrompt } from './stripHtml';

const QUESTION_TYPE_INSTRUCTION: Record<QuestionType, string> = {
  detail: '現在指定されているThinkingFlow（対象Flow）の内容を、生徒が理解しやすいように、もう少し詳しく説明してください。',
  knowledge: '現在指定されているThinkingFlow（対象Flow）で使われている公式・定理・前提知識について説明してください。',
  custom: '生徒からの次の質問に、現在指定されているThinkingFlow（対象Flow）の範囲を超えない形で答えてください。',
};

// 固定プロンプト（方針）。question_typeによって末尾の指示だけを差し替える。
function buildSystemInstruction(questionType: QuestionType): string {
  return [
    'あなたは高校数学を学習する生徒の学習を補助するAIです。以下の制約を必ず守ってください。',
    '- 目的は、現在指定されているThinkingFlow（対象Flow）の理解を助けることだけです。',
    '- 対象Flowより後のFlowや最終解答の内容を、先取りして説明しないでください。',
    '- 問題全体を最初から解き直さないでください。',
    '- 生徒から質問された範囲だけに答えてください。',
    '- 提供された教材contextの内容と数学的に矛盾しない説明をしてください。',
    '- 高校生にとって自然な日本語で、簡潔に答えてください（目安200〜400字程度）。',
    QUESTION_TYPE_INSTRUCTION[questionType],
  ].join('\n');
}

function formatTextBlock(block: { text: string; parts: { raw_title: string; text: string }[] }): string {
  const lines: string[] = [];
  if (block.text) lines.push(stripHtmlForPrompt(block.text));
  for (const part of block.parts) {
    lines.push(`${part.raw_title}\n${stripHtmlForPrompt(part.text)}`);
  }
  return lines.join('\n\n');
}

function formatFlowList(flows: AiContextFlow[]): string {
  return flows
    .map((f) => `[${f.context_key}] ${stripHtmlForPrompt(f.raw_title)}\n${stripHtmlForPrompt(f.text)}`)
    .join('\n\n');
}

function formatAssetMetadata(assets: AiContextFlow['assets']): string {
  if (assets.length === 0) return 'なし';
  return assets
    .map((a, i) => {
      const lines = [`asset${i + 1}: type=${a.type ?? '不明'}`];
      if (a.purpose) lines.push(`  purpose: ${a.purpose}`);
      if (a.must_show.length > 0) lines.push(`  must_show: ${a.must_show.join(' / ')}`);
      if (a.must_not_show.length > 0) lines.push(`  must_not_show: ${a.must_not_show.join(' / ')}`);
      return lines.join('\n');
    })
    .join('\n');
}

export interface BuiltPrompt {
  systemInstruction: string;
  userContent: string;
}

export function buildPrompt(
  context: AiContext,
  targetFlow: AiContextFlow,
  questionType: QuestionType,
  freeText: string | null,
): BuiltPrompt {
  const sections: string[] = [];

  sections.push(`【問題文】\n${formatTextBlock(context.problem)}`);

  if (context.paraphrase) {
    sections.push(`【問題の言い換え】\n${formatTextBlock(context.paraphrase)}`);
  }

  sections.push(`【ThinkingFlow全体（参考。対象Flow以外の内容は先取りして説明しないこと）】\n${formatFlowList(context.thinking_flow)}`);

  sections.push(`【最終解答（参考。先取りして説明しないこと）】\n${formatTextBlock(context.final_answer)}`);

  sections.push(
    `【現在の対象Flow】\ncontext_key: ${targetFlow.context_key}\nタイトル: ${stripHtmlForPrompt(targetFlow.raw_title)}\n本文:\n${stripHtmlForPrompt(targetFlow.text)}`,
  );

  sections.push(`【対象Flowのasset情報】\n${formatAssetMetadata(targetFlow.assets)}`);

  if (questionType === 'custom' && freeText) {
    sections.push(`【生徒の質問】\n${freeText}`);
  }

  return {
    systemInstruction: buildSystemInstruction(questionType),
    userContent: sections.join('\n\n'),
  };
}
