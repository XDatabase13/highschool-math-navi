// 4×4ナビゲーションの2ページ（/navigator/・/app/navigation/）で共有する、ブラウザAPIまわりの小さな部品
// （localStorageの取得・共有・GA4イベント）。DOMに依存するため、純粋ロジック（navigatorCore.ts）とは分ける。

import { NAV_RESULT_PATH } from './navigatorLink.ts';
import type { StorageLike, WriteFailure } from './navigatorStore.ts';

// localStorageが使えない（無効化・シークレットモードの制限等）ときはnull。
export function getLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// 共有するURL。常に抽出結果の入口（/app/navigation/）＋条件のfragmentで（開くと問題DBの抽出表示へ移動する）、
// 設定名・学習履歴・個人情報は含めない。
export function resultUrl(stateString: string): string {
  return new URL(`${NAV_RESULT_PATH}#${stateString}`, window.location.origin).toString();
}

// shared: OSの共有画面で共有した / copied: クリップボードへコピーした /
// cancelled: 利用者が共有画面を閉じた / manual: どちらも使えない（URLを表示して手動コピーしてもらう）
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'manual';

export async function shareUrl(url: string, title: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // それ以外の失敗は、クリップボードへのコピーへフォールバックする。
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'manual';
  }
}

// 共有の後始末。共有・コピーが済んだこと（共有完了）は画面へ出さず、どこにも記録しない。
// 画面へ出すのは、共有もコピーもできなかったとき（manual）の手動コピー用のURLだけで、
// それ以外のときは前の表示を消す。
export function showShareFallback(
  outcome: ShareOutcome,
  url: string,
  status: HTMLElement | null,
  fallback: HTMLElement | null,
) {
  const manual = outcome === 'manual';
  const input = fallback?.querySelector<HTMLInputElement>('input') ?? null;
  if (fallback) fallback.hidden = !manual;
  if (status) {
    status.textContent = manual ? 'URLを自動でコピーできませんでした。下のURLを選択してコピーしてください。' : '';
  }
  if (manual && input) {
    input.value = url;
    input.focus();
    input.select();
  }
}

export function saveFailureMessage(reason: WriteFailure): string {
  return reason === 'unreadable' || reason === 'newer'
    ? '保存済みデータを読み込めないため、保存できませんでした。4×4ナビゲーションの「学習設定」から初期化できます。'
    : 'このブラウザでは設定を保存できませんでした（シークレットモードや保存容量の制限など）。「条件を共有」でURLを控えておくと、同じ条件を開き直せます。';
}

// GA4イベント。既存のAnalytics.astro（BaseLayoutが1回だけ読み込む）のgtagをそのまま使い、
// ここでは追加のタグを読み込まない。送るのは件数と種別だけで、section名・設定名・問題ID・
// 条件の文字列は送らない。gtagが無い・失敗する場合も、ナビ操作は妨げない。
export type NavEventName =
  | 'navigator_open'
  | 'navigator_range_select'
  | 'navigator_cell_select'
  | 'navigator_extract'
  | 'navigator_result_view'
  | 'navigator_save'
  | 'navigator_share'
  | 'navigator_resume';

export function trackNavEvent(name: NavEventName, params: Record<string, string | number> = {}) {
  try {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') gtag('event', name, params);
  } catch {
    // 計測の失敗は無視する。
  }
}
