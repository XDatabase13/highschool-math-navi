import { readFileSync } from 'node:fs';
import path from 'node:path';

// asset実体は highschool_math_db の外、隣接フォルダ math_db_quadratic_working/assets/ にある。
// ここではファイルをそのまま読み込むだけで、Web側へのコピー・複製は行わない。
// content.config.ts の glob base と同じく、プロジェクトルート（cwd）からの相対で解決する
// （import.meta.url はビルド時のバンドル移動で位置がずれる可能性があるため使わない）。
export function readProblemAssetSvg(problemId: string, file: string): string {
  const filePath = path.resolve(process.cwd(), '../math_db_quadratic_working/assets', problemId, file);
  return readFileSync(filePath, 'utf-8');
}
