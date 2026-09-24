// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// 問題Markdownの数式処理（remark-math / rehype-katex）はAstro標準のMarkdown設定ではなく、
// 独自パーサー src/utils/markdownSections.ts が直接行う（render()/<Content>は使っていない）。
export default defineConfig({
  // 独自ドメイン(math-navi.com)のルートで配信する前提。GitHub Pagesのプロジェクト
  // サブパス配信ではないため、baseは設定しない。
  site: 'https://math-navi.com',
});
