import { getCollection, type CollectionEntry } from 'astro:content';

// 公開対象は「独立検算済み」の問題だけに限定する（QF/TR/DA/EC/SL/CP共通基準）。
// getCollection() をそのまま呼ぶと未検算問題でも条件次第でページ・一覧・sitemapに
// 入りうるため、quadratic27・trig4・dataAnalysis・expressionCalculation・setLogic・countingProbabilityを読むすべての箇所は
// このヘルパー経由に統一する。verification_statusの許可値はcontent.config.tsで列挙型として制限している。
const VERIFICATION_STATUS_PUBLISHED = '独立検算済み';

// ローカルレビュー専用：環境変数 REVIEW_INCLUDE_PROBLEM_IDS（カンマ区切りの問題ID）を明示したbuildだけ、
// 独立検算済みでない問題も表示対象に加える（例：要図照合中の問題を実画面でレビューする）。
// 正本の verification_status・masterの判定は変えない。未指定の通常build（GitHub Actionsを含む）は従来どおり。
// 本番成果物へ混ざらないよう、CI上で指定されていたらbuildエラーにする。
// 例：REVIEW_INCLUDE_PROBLEM_IDS=MA-CP-054 npx astro build --outDir dist-review
const REVIEW_INCLUDE_IDS = new Set(
  (process.env.REVIEW_INCLUDE_PROBLEM_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
);
if (REVIEW_INCLUDE_IDS.size > 0 && (process.env.CI || process.env.GITHUB_ACTIONS)) {
  throw new Error('REVIEW_INCLUDE_PROBLEM_IDS はローカルレビュー専用です。CIでは指定しないでください。');
}

export async function getVerifiedCollection<
  C extends 'quadratic27' | 'trig4' | 'dataAnalysis' | 'expressionCalculation' | 'setLogic' | 'countingProbability',
>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  return getCollection(
    collection,
    ({ data }) =>
      data.verification_status === VERIFICATION_STATUS_PUBLISHED || REVIEW_INCLUDE_IDS.has(data.problem_id),
  );
}
