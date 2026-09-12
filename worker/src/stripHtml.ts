// AI-context JSON内のテキストは公開Markdownの生テキスト（生LaTeX・GFM表記を含む）
// をそのまま保持しているため、生HTML（例：M1-TR-015の`<p style="...">警告文</p>`）が
// 含まれる場合がある。Geminiへ渡す直前に、タグ・style属性を取り除き、
// 意味のあるテキスト部分だけを残す。数式のLaTeX（$...$、$$...$$）やMarkdown表記は
// タグではないため、この処理では変化しない。
export function stripHtmlForPrompt(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}
