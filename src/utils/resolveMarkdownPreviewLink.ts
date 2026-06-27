import {
  parseViewDocumentFromSearchParams,
  VIEW_DOCUMENT_FORMAT_MARKDOWN,
} from "@/utils/documentViewUrl";

export type ResolvedMarkdownPreviewLink =
  | { kind: "external"; href: string }
  | { kind: "anchor"; id: string }
  | {
      kind: "preview";
      fileId: string;
      markdownUrl: string;
      pdfUrl?: string;
      fileName?: string;
    }
  | { kind: "fetch-markdown"; fileId: string; preferMarkdown: boolean }
  | { kind: "file"; fileId: string; fileName?: string }
  | { kind: "remote-file"; url: string; fileName?: string };

export function fileIdFromApiUrl(url: string) {
  const match = url.match(/\/files\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function looksLikeMarkdownUrl(url: URL) {
  const path = url.pathname.toLowerCase();
  return (
    /\.md($|[?#])/i.test(path) ||
    path.includes("/markdown") ||
    url.searchParams.get("format") === VIEW_DOCUMENT_FORMAT_MARKDOWN ||
    url.searchParams.get("viewDocumentFormat") === VIEW_DOCUMENT_FORMAT_MARKDOWN
  );
}

function fileNameFromUrl(url: URL) {
  const segment = url.pathname.split("/").pop() || "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function isInAppDocumentHost(url: URL) {
  if (url.origin === window.location.origin) return true;
  const host = url.hostname.toLowerCase();
  return host === "hcmus.app" || host.endsWith(".hcmus.app");
}

function looksLikeDocumentFileUrl(url: URL) {
  const path = url.pathname.toLowerCase();
  return /\.(pdf|docx?|md|txt)($|[?#])/i.test(path);
}

/** Resolve in-app markdown / file links for TLTK preview (stay on current page). */
export function resolveMarkdownPreviewLink(
  rawHref: string,
  baseHref?: string,
): ResolvedMarkdownPreviewLink {
  const href = rawHref.trim();
  if (!href) return { kind: "external", href };

  if (href.startsWith("#")) {
    return { kind: "anchor", id: href.slice(1) };
  }

  let url: URL;
  try {
    url = new URL(href, baseHref || window.location.origin);
  } catch {
    return { kind: "external", href };
  }

  const { viewDocumentId, isMarkdownView } = parseViewDocumentFromSearchParams(
    url.searchParams,
  );
  if (viewDocumentId) {
    return {
      kind: "fetch-markdown",
      fileId: viewDocumentId,
      preferMarkdown: isMarkdownView,
    };
  }

  const legacyFileId = url.searchParams.get("id")?.trim();
  if (
    legacyFileId &&
    url.origin === window.location.origin &&
    /\/documents/i.test(url.pathname)
  ) {
    return {
      kind: "fetch-markdown",
      fileId: legacyFileId,
      preferMarkdown: true,
    };
  }

  const fileId = fileIdFromApiUrl(url.href);
  if (fileId) {
    if (looksLikeMarkdownUrl(url)) {
      return {
        kind: "preview",
        fileId,
        markdownUrl: url.href,
        fileName: fileNameFromUrl(url),
      };
    }

    return {
      kind: "file",
      fileId,
      fileName: fileNameFromUrl(url),
    };
  }

  if (looksLikeMarkdownUrl(url)) {
    return {
      kind: "preview",
      fileId: fileNameFromUrl(url),
      markdownUrl: url.href,
      fileName: fileNameFromUrl(url),
    };
  }

  if (isInAppDocumentHost(url) && looksLikeDocumentFileUrl(url)) {
    return {
      kind: "remote-file",
      url: url.href,
      fileName: fileNameFromUrl(url),
    };
  }

  return { kind: "external", href: url.href };
}
