// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  // 独自ドメイン(math-navi.com)のルートで配信する前提。GitHub Pagesのプロジェクト
  // サブパス配信ではないため、baseは設定しない。
  site: 'https://math-navi.com',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
