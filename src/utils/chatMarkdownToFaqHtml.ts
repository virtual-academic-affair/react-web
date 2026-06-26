import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

const trailingEmptyBlockPattern =
  /(?:\s*<(?:p|div|h[1-6]|blockquote)(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/(?:p|div|h[1-6]|blockquote)>)+$/i;

/** Removes trailing blank lines TipTap/markdown may treat as an extra paragraph. */
export function normalizeFaqRichTextHtml(html: string): string {
  let result = html.trim();
  if (!result) return "";

  result = result.replace(/(<br\s*\/?>\s*)+(<\/p>)/gi, "$2");
  result = result.replace(/(<br\s*\/?>\s*)+(<\/li>)/gi, "$2");

  while (trailingEmptyBlockPattern.test(result)) {
    result = result.replace(trailingEmptyBlockPattern, "").trimEnd();
  }

  return result;
}

/** Converts chatbot assistant markdown into HTML for the FAQ rich-text editor. */
export function chatMarkdownToFaqHtml(markdown: string): string {
  const trimmed = markdown.trim().replace(/(?:\n[ \t]*)+$/g, "");
  if (!trimmed) return "";
  return normalizeFaqRichTextHtml(marked.parse(trimmed) as string);
}
