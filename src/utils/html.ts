/** Lấy text thuần từ HTML (kiểm tra rỗng, preview bảng, nhãn gợi ý). */
export function plainTextFromHtml(html: string): string {
  if (!html?.trim()) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
}

const BLOCK_TAG =
  /^(P|DIV|H[1-6]|LI|BLOCKQUOTE|PRE|UL|OL|TABLE|TR|TD|TH|SECTION|ARTICLE)$/i;

function isBlockEl(el: Element): boolean {
  return BLOCK_TAG.test(el.tagName);
}

/**
 * Gộp rich text dạng nhiều khối (vd. &lt;p&gt;…&lt;/p&gt;) thành một chuỗi HTML **inline**
 * để Tiptap `insertContent` không tạo đoạn mới / xuống dòng thừa khi chèn giữa dòng.
 */
export function richHtmlAsSingleInlineInsert(html: string): string {
  const raw = html?.trim() ?? "";
  if (!raw) return "";
  if (!raw.includes("<")) return raw.replace(/\s+/g, " ").trim();

  const doc = new DOMParser().parseFromString(raw, "text/html");

  function inlineFromBlock(el: Element): string {
    const chunks: string[] = [];
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child.textContent ?? "";
        if (t.trim()) chunks.push(t);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const c = child as Element;
        if (c.tagName === "BR") {
          chunks.push(" ");
        } else if (isBlockEl(c)) {
          const inner = inlineFromBlock(c);
          if (inner) chunks.push(inner);
        } else {
          chunks.push((c as HTMLElement).outerHTML);
        }
      }
    }
    return chunks.join(" ").replace(/\s+/g, " ").trim();
  }

  const top: string[] = [];
  for (const node of Array.from(doc.body.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.trim();
      if (t) top.push(t);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.tagName === "BR") {
        top.push(" ");
      } else if (isBlockEl(el)) {
        const piece = inlineFromBlock(el);
        if (piece) top.push(piece);
      } else {
        top.push((el as HTMLElement).outerHTML);
      }
    }
  }

  const merged = top.join(" ").replace(/\s+/g, " ").trim();
  return merged || plainTextFromHtml(html);
}
