import type { AiContext, Env } from './types';
import { corsHeaders, resolveAllowedOrigin } from './cors';
import { validateAskRequestBody } from './validate';
import { buildPrompt } from './prompt';
import { generateWithGemini, GeminiApiError } from './providers/gemini';

// ThinkingFlow単位のAI質問機能用serverless proxy（ローカルプロトタイプ）。
// ブラウザ → このWorker → Gemini API という1本の中継だけを行う。
// 会話履歴・DB・ログ保存・認証・レート制限は今回実装しない（別工程）。

function jsonResponse(body: unknown, status: number, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

type FetchAiContextResult =
  | { status: 'ok'; context: AiContext }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

// problem_idは事前にvalidate.tsの正規表現（M1-(QF|TR)-数字3桁）を通過済み。
// AI_CONTEXT_BASE_URLは固定のserver側設定値（クライアント入力の影響を受けない）で、
// problem_idはこの形式チェック済みの値だけをパス末尾に連結するため、
// 任意の外部URLへfetchできる構造にはならない。
// 「どの問題をAI質問機能の対象にするか」は許可リストの手動管理ではなく、
// このURL上に対応するAI-context JSONが実在するかどうかで判定する
// （npm run buildで生成される95件のJSONと常に1:1で一致する）。
async function fetchAiContext(problemId: string, env: Env): Promise<FetchAiContextResult> {
  const url = `${env.AI_CONTEXT_BASE_URL}/ai-context/${problemId}.json`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }
  if (res.status === 404) {
    return { status: 'not_found' };
  }
  if (!res.ok) {
    return { status: 'error', message: `AI-context取得失敗（status=${res.status}）` };
  }
  return { status: 'ok', context: (await res.json()) as AiContext };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = resolveAllowedOrigin(request, env);
    const cors = corsHeaders(allowedOrigin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // 許可外Originからのリクエストは、CORSヘッダーを付けずに拒否する
    // （ブラウザ側では読み取れないが、サーバー側でも明示的に弾いておく）。
    const origin = request.headers.get('Origin');
    if (origin && !allowedOrigin) {
      return jsonResponse({ error: '許可されていないOriginです' }, 403);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'POSTのみ対応しています' }, 405, cors);
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return jsonResponse({ error: 'リクエストボディがJSONとして不正です' }, 400, cors);
    }

    const validation = validateAskRequestBody(rawBody);
    if (!validation.ok) {
      return jsonResponse({ error: validation.error }, 400, cors);
    }
    const { problem_id, context_key, question_type, free_text } = validation.value;

    const fetchResult = await fetchAiContext(problem_id, env);
    if (fetchResult.status === 'not_found') {
      return jsonResponse(
        { error: `problem_id=${problem_id} はAI質問機能の対象外です` },
        404,
        cors,
      );
    }
    if (fetchResult.status === 'error') {
      // 自由質問本文（free_text）はログへ出さない。エラー内容自体にも含めない。
      console.error('AI-context取得失敗', { problem_id, message: fetchResult.message });
      return jsonResponse({ error: 'AI-contextの取得に失敗しました' }, 502, cors);
    }
    const context = fetchResult.context;

    const targetFlow = context.thinking_flow.find((f) => f.context_key === context_key);
    if (!targetFlow) {
      return jsonResponse(
        { error: `context_key=${context_key} に対応するFlowが見つかりません` },
        400,
        cors,
      );
    }

    const prompt = buildPrompt(context, targetFlow, question_type, free_text);

    try {
      const answer = await generateWithGemini(prompt, env);
      return jsonResponse({ answer }, 200, cors);
    } catch (e) {
      if (e instanceof GeminiApiError) {
        console.error('Gemini API呼び出し失敗', { problem_id, context_key, question_type, status: e.status });
        return jsonResponse({ error: 'AIからの回答取得に失敗しました' }, 502, cors);
      }
      console.error('予期しないエラー', { problem_id, context_key, question_type });
      return jsonResponse({ error: '予期しないエラーが発生しました' }, 500, cors);
    }
  },
};
