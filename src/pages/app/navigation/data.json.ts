import type { APIRoute } from 'astro';
import { loadNavigatorData } from '../../../utils/navigatorData';

// 4×4ナビゲーションの候補データ（/navigator/ に埋め込んでいるものと同じ内容）。
// 問題DBの各ページは、URL fragmentに4×4の条件が付いているとき（抽出モード）だけこれを取得する。
// 通常の来訪では読み込まれず、個別問題ページの静的HTMLにも含めない。
export const GET: APIRoute = async () => {
  const { data } = await loadNavigatorData();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
