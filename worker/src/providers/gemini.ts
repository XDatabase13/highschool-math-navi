import type { Env } from '../types';
import type { BuiltPrompt } from '../prompt';

// Gemini固有のAPI呼び出し部分だけを薄く分離する。将来OpenAI/Anthropicへ
// 差し替える場合は、この関数と同じ形（prompt → 回答文字列）の関数を用意すればよい。
// 過剰なprovider抽象化（共通interfaceの型階層など）は今回作らない。

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

export async function generateWithGemini(prompt: BuiltPrompt, env: Env): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new GeminiApiError('GEMINI_API_KEYが設定されていません', 500);
  }

  const url = `${GEMINI_API_BASE}/models/${env.GEMINI_MODEL}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 公式ドキュメント推奨のヘッダー方式（クエリ文字列の?key=は使わない。
      // URLがログ等に残った際にAPIキーが漏れるのを避けるため）。
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: prompt.systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt.userContent }],
        },
      ],
      generationConfig: {
        // thinkingモデル（gemini-3.6-flash）は既定で内部思考にもmaxOutputTokensの
        // 枠を消費し、可視の回答が短くても目一杯に達して途中で切れることがある
        // （finishReason: MAX_TOKENS。実測でthoughtsTokenCountが600〜1600程度に
        // 達するケースを確認した）。thinkingBudget: 0はこのモデルでは
        // INVALID_ARGUMENT（400）になり使えないため、thinkingBudgetを控えめな
        // 値に制限しつつ、それでも超過した場合に備えてmaxOutputTokens自体も
        // 十分な余裕（thinking上限512＋可視回答の目安200〜400字分）を持たせる。
        maxOutputTokens: 2048,
        temperature: 0.4,
        thinkingConfig: {
          thinkingBudget: 512,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new GeminiApiError(`Gemini APIエラー（status=${response.status}）: ${errorBody.slice(0, 500)}`, 502);
  }

  const data = (await response.json()) as {
    candidates?: {
      finishReason?: string;
      content?: { parts?: { text?: string; thought?: boolean }[] };
    }[];
  };

  // thinkingモデルは、可視の回答本文とは別に「thought」パートを返すことがある。
  // 回答として使うのはthought以外のテキスト部分だけを連結したもの。
  const candidate = data.candidates?.[0];
  const text =
    candidate?.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text ?? '')
      .join('') ?? '';
  if (!text) {
    throw new GeminiApiError('Gemini APIから回答テキストを取得できませんでした', 502);
  }

  return text.trim();
}
