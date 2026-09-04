import { readFileSync } from 'node:fs';
import path from 'node:path';

// asset実体の正本は highschool_math_db の外、隣接フォルダ math_db_quadratic_working/assets/ にある。
// GitHub Actions等、正本フォルダが存在しない環境でもbuildできるよう、content.config.ts と同様に
// repo内 src/content/quadratic27-assets/ へコピーした公開用スナップショットを読み込む
// （npm run sync-content で正本から再生成。ここでは一切書き換えない）。
// プロジェクトルート（cwd）からの相対で解決する
// （import.meta.url はビルド時のバンドル移動で位置がずれる可能性があるため使わない）。
export function readProblemAssetSvg(problemId: string, file: string): string {
  const filePath = path.resolve(process.cwd(), 'src/content/quadratic27-assets', problemId, file);
  return readFileSync(filePath, 'utf-8');
}
