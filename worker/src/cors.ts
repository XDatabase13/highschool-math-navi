import type { Env } from './types';

// localhost（Astro dev server）と将来のmath-navi.comだけを許可する。
// 許可リストに無いOriginへは Access-Control-Allow-Origin を返さない
// （＝ブラウザ側でレスポンスがブロックされる）。
export function resolveAllowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  return allowed.includes(origin) ? origin : null;
}

export function corsHeaders(allowedOrigin: string | null): HeadersInit {
  if (!allowedOrigin) return {};
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}
