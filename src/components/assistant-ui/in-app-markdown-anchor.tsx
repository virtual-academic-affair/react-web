import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { resolveMarkdownPreviewLink } from "@/utils/resolveMarkdownPreviewLink";

import { useSourcePreviewOptional } from "./source-preview-context";

export const SourcePreviewScrollContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function extractMarkdownLinkText(children: ReactNode): string {
  if (typeof children === "string") return children.trim();
  if (Array.isArray(children)) {
    return children
      .map((child) => (typeof child === "string" ? child : ""))
      .join("")
      .trim();
  }
  return "";
}

export function buildInAppPreviewKey(
  parts: {
    markdownUrl?: string;
    fileName?: string;
    fileId?: string;
    pages?: string[];
  },
  url: string,
  selectedTitle: string,
) {
  return [
    parts.markdownUrl || url || parts.fileName || selectedTitle,
    parts.pages?.join(",") || "",
    selectedTitle,
  ].join(":");
}

const defaultLinkClass =
  "text-[#1a73e8] underline underline-offset-2 hover:text-[#1558b0] dark:text-[#a8c7fa]";

export function InAppMarkdownAnchor({
  href,
  children,
  className,
  target: _target,
  rel: _rel,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const sourcePreview = useSourcePreviewOptional();
  const scrollContainerRef = useContext(SourcePreviewScrollContext);

  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href || !sourcePreview) return;

    const resolved = resolveMarkdownPreviewLink(
      href,
      sourcePreview.preview?.markdownUrl,
    );
    if (resolved.kind === "external") return;

    event.preventDefault();
    const linkTitle = extractMarkdownLinkText(children);
    const { openPreview, openFilePreview, preview } = sourcePreview;

    if (resolved.kind === "anchor") {
      const root = scrollContainerRef?.current;
      const anchorId = resolved.id;
      const byId =
        (anchorId
          ? root?.querySelector(`#${CSS.escape(anchorId)}`) ??
            document.getElementById(anchorId)
          : null) ?? null;
      if (byId) {
        byId.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (linkTitle && root) {
        const heading = Array.from(
          root.querySelectorAll("h1,h2,h3,h4,h5,h6"),
        ).find((node) =>
          node.textContent?.toLowerCase().includes(linkTitle.toLowerCase()),
        );
        heading?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (resolved.kind === "file") {
      openFilePreview({
        fileId: resolved.fileId,
        fileName: resolved.fileName || "Tài liệu",
      });
      return;
    }

    if (resolved.kind === "remote-file") {
      openFilePreview({
        fileUrl: resolved.url,
        fileName: linkTitle || resolved.fileName || "Tài liệu",
      });
      return;
    }

    if (resolved.kind === "fetch-markdown") {
      const { DocumentsService } = await import("@/services/documents");
      const detail = await DocumentsService.getFileDetail(resolved.fileId);
      const markdownUrl = String(detail.markdownFileUrl || "").trim();
      const fileName =
        detail.originalFilename || detail.displayName || "Tài liệu";
      if (markdownUrl) {
        openPreview({
          key: buildInAppPreviewKey(
            { markdownUrl, fileName, fileId: resolved.fileId },
            markdownUrl,
            linkTitle || fileName,
          ),
          title: linkTitle || undefined,
          fileName,
          fileId: resolved.fileId,
          markdownUrl,
          pdfUrl: detail.fileUrl,
        });
        return;
      }
      openFilePreview({ fileId: resolved.fileId, fileName });
      return;
    }

    if (resolved.kind === "preview") {
      openPreview({
        key: buildInAppPreviewKey(
          {
            markdownUrl: resolved.markdownUrl,
            fileName: resolved.fileName,
            fileId: resolved.fileId,
          },
          resolved.markdownUrl,
          linkTitle || resolved.fileName || resolved.markdownUrl,
        ),
        title: linkTitle || undefined,
        fileName: resolved.fileName || preview?.fileName,
        fileId: resolved.fileId || preview?.fileId,
        markdownUrl: resolved.markdownUrl,
        pdfUrl: preview?.pdfUrl,
      });
    }
  };

  return (
    <a
      {...props}
      href={href}
      onClick={(event) => void handleClick(event)}
      className={`${defaultLinkClass} ${className ?? ""}`.trim()}
    >
      {children}
    </a>
  );
}
