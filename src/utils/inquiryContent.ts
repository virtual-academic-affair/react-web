const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const BULLET_PATTERN = /^\s*[\*-]\s+(.*)$/;

export function hasHtmlTags(value: string): boolean {
  return HTML_TAG_PATTERN.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function replaceReferenceMarkers(value: string): string {
  return value.replace(
    /\[\^(\d+)\]/g,
    '<sup style="color:#422afb;font-weight:600">[$1]</sup>',
  );
}

export function normalizeInquiryContent(
  value: string | null | undefined,
): string {
  if (!value?.trim()) {
    return "";
  }

  const normalized = value.replace(/\r\n?/g, "\n").trim();

  if (hasHtmlTags(normalized)) {
    return replaceReferenceMarkers(normalized);
  }

  const lines = normalized.split("\n");
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push(
      `<ul style="margin:0 0 12px 0;padding-left:24px;list-style:disc">${listItems
        .map((item) => `<li style="margin:4px 0">${item}</li>`)
        .join("")}</ul>`,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = line.match(BULLET_PATTERN);

    if (!trimmed) {
      flushList();
      continue;
    }

    if (bulletMatch) {
      listItems.push(replaceReferenceMarkers(escapeHtml(bulletMatch[1].trim())));
      continue;
    }

    flushList();
    blocks.push(
      `<p style="margin:0 0 12px 0">${replaceReferenceMarkers(escapeHtml(trimmed))}</p>`,
    );
  }

  flushList();

  return blocks.join("");
}
