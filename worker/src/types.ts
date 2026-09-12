export interface Env {
  AI_CONTEXT_BASE_URL: string;
  ALLOWED_ORIGINS: string;
  GEMINI_MODEL: string;
  GEMINI_API_KEY: string;
}

export type QuestionType = 'detail' | 'knowledge' | 'custom';

export interface AskRequestBody {
  problem_id: string;
  context_key: string;
  question_type: QuestionType;
  free_text: string | null;
}

// src/utils/aiContext.ts（Astro側）が生成するAI-context JSONの、
// このWorkerが実際に使うフィールドだけの構造的な型。
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
  context_key: string;
  part: number | null;
  flow: number;
  flow_key: string;
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
