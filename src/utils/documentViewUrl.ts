export const VIEW_DOCUMENT_ID_PARAM = "viewDocumentId";
export const VIEW_DOCUMENT_FORMAT_PARAM = "viewDocumentFormat";
export const VIEW_DOCUMENT_FORMAT_MARKDOWN = "markdown";

export type ViewDocumentUrlOptions = {
  format?: typeof VIEW_DOCUMENT_FORMAT_MARKDOWN;
  pathname?: string;
};

const LEGACY_PREVIEW_PARAMS = [
  "preview",
  "previewTarget",
  "previewPage",
  "viewDocumentPage",
] as const;

export function clearLegacyPreviewParams(params: URLSearchParams) {
  for (const key of LEGACY_PREVIEW_PARAMS) {
    params.delete(key);
  }
}

export function clearViewDocumentParams(params: URLSearchParams) {
  params.delete(VIEW_DOCUMENT_ID_PARAM);
  params.delete(VIEW_DOCUMENT_FORMAT_PARAM);
  clearLegacyPreviewParams(params);
}

export function setViewDocumentParams(
  params: URLSearchParams,
  fileId: string,
  options?: ViewDocumentUrlOptions,
) {
  params.set(VIEW_DOCUMENT_ID_PARAM, fileId);

  if (options?.format === VIEW_DOCUMENT_FORMAT_MARKDOWN) {
    params.set(VIEW_DOCUMENT_FORMAT_PARAM, VIEW_DOCUMENT_FORMAT_MARKDOWN);
  } else {
    params.delete(VIEW_DOCUMENT_FORMAT_PARAM);
  }

  clearLegacyPreviewParams(params);
}

export function parseViewDocumentFromSearchParams(searchParams: URLSearchParams) {
  const viewDocumentId =
    searchParams.get(VIEW_DOCUMENT_ID_PARAM)?.trim() || null;
  const viewDocumentFormat = searchParams.get(VIEW_DOCUMENT_FORMAT_PARAM) || "";
  const isMarkdownView = viewDocumentFormat === VIEW_DOCUMENT_FORMAT_MARKDOWN;

  return { viewDocumentId, isMarkdownView };
}

function decodeUrlSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function fileIdFromDocumentUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) return null;

  let url: URL;
  try {
    url = new URL(
      trimmedUrl,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
  } catch {
    return null;
  }

  const { viewDocumentId } = parseViewDocumentFromSearchParams(
    url.searchParams,
  );
  if (viewDocumentId) return viewDocumentId;

  const pathMatch =
    url.pathname.match(/\/api\/files\/(?!progress\/)([^/?#]+)/i) ??
    url.pathname.match(/\/files\/(?!progress\/)([^/?#]+)/i);
  if (pathMatch?.[1]) return decodeUrlSegment(pathMatch[1]);

  return (
    url.searchParams.get("fileId")?.trim() ||
    url.searchParams.get("file_id")?.trim() ||
    null
  );
}

export function buildDocumentViewUrl(
  fileId: string,
  options?: ViewDocumentUrlOptions,
): string {
  const pathname = options?.pathname ?? window.location.pathname;
  const url = new URL(pathname || "/", window.location.origin);
  setViewDocumentParams(url.searchParams, fileId, options);
  return url.toString();
}

/** Preserve view-document query when redirecting between routes. */
export function viewDocumentLocationSearch(search: string): string {
  const { viewDocumentId, isMarkdownView } = parseViewDocumentFromSearchParams(
    new URLSearchParams(search),
  );
  if (!viewDocumentId) return "";

  const params = new URLSearchParams();
  setViewDocumentParams(params, viewDocumentId, {
    format: isMarkdownView ? VIEW_DOCUMENT_FORMAT_MARKDOWN : undefined,
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
