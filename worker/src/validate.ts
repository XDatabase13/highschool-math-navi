import type { AskRequestBody, QuestionType } from './types';

// ブラウザから受け取るpayloadの検証。ここを通過しないリクエストはGeminiへ
// 到達させない（教材contextの取得もしない）。

const PROBLEM_ID_PATTERN = /^M1-(QF|TR)-\d{3}$/;
const CONTEXT_KEY_PATTERN = /^f\d+$/;
const QUESTION_TYPES: readonly QuestionType[] = ['detail', 'knowledge', 'custom'];
const FREE_TEXT_MAX_LENGTH = 500;

export type ValidationResult =
  | { ok: true; value: AskRequestBody }
  | { ok: false; error: string };

export function validateAskRequestBody(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'リクエストボディがJSONオブジェクトではありません' };
  }
  const body = input as Record<string, unknown>;

  const problemId = body.problem_id;
  if (typeof problemId !== 'string' || !PROBLEM_ID_PATTERN.test(problemId)) {
    return { ok: false, error: 'problem_idの形式が不正です（例: M1-QF-001）' };
  }

  const contextKey = body.context_key;
  if (typeof contextKey !== 'string' || !CONTEXT_KEY_PATTERN.test(contextKey)) {
    return { ok: false, error: 'context_keyの形式が不正です（例: f1）' };
  }

  const questionType = body.question_type;
  if (typeof questionType !== 'string' || !QUESTION_TYPES.includes(questionType as QuestionType)) {
    return { ok: false, error: 'question_typeはdetail/knowledge/customのいずれかである必要があります' };
  }

  let freeText: string | null = null;
  if (questionType === 'custom') {
    if (typeof body.free_text !== 'string' || body.free_text.trim().length === 0) {
      return { ok: false, error: 'question_type=customの場合はfree_textが必須です' };
    }
    const trimmed = body.free_text.trim();
    if (trimmed.length > FREE_TEXT_MAX_LENGTH) {
      return { ok: false, error: `free_textは${FREE_TEXT_MAX_LENGTH}文字以内にしてください` };
    }
    freeText = trimmed;
  } else if (body.free_text !== null && body.free_text !== undefined) {
    return { ok: false, error: 'question_typeがdetail/knowledgeの場合、free_textはnullにしてください' };
  }

  return {
    ok: true,
    value: {
      problem_id: problemId,
      context_key: contextKey,
      question_type: questionType as QuestionType,
      free_text: freeText,
    },
  };
}

export function isProblemEnabled(problemId: string, env: { ENABLED_PROBLEM_IDS: string }): boolean {
  const enabled = env.ENABLED_PROBLEM_IDS.split(',').map((s) => s.trim());
  return enabled.includes(problemId);
}
