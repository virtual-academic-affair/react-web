import type { SourceMessagePartProps } from "@assistant-ui/react";
import type { ReactNode } from "react";
import { MdOpenInNew, MdPictureAsPdf } from "react-icons/md";

type SourceMeta = {
  citationId?: number;
  fileName?: string;
  pages?: string[];
  markdownUrl?: string;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function getPageLabel(pages?: string[]) {
  if (!pages?.length) return "";
  return pages.length === 1 ? `Trang ${pages[0]}` : `Trang ${pages.join(", ")}`;
}

export function Sources({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold tracking-wide text-[#5f6368] uppercase dark:text-gray-400">
        Tài liệu tham khảo
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Source(props: SourceMessagePartProps) {
  const { url, title } = props;
  const meta = props as SourceMessagePartProps & SourceMeta;
  const fileName = meta.fileName?.trim();
  const label = title?.trim() || fileName || url;
  const pageLabel = getPageLabel(meta.pages);
  const hostname = getHostname(url);
  const citationLabel =
    typeof meta.citationId === "number" ? `#${meta.citationId}` : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 items-start gap-3 rounded-2xl border border-[#dadce0] bg-[#f8fafd] px-3 py-3 text-[#1f1f1f] no-underline transition hover:border-[#1a73e8]/45 hover:bg-[#f1f6ff] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:border-[#a8c7fa]/45 dark:hover:bg-white/[0.07]"
    >
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1f3760]/60 dark:text-[#a8c7fa]"
        aria-hidden
      >
        <MdPictureAsPdf className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          {citationLabel ? (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#062e6f] ring-1 ring-[#d3e3fd] dark:bg-white/10 dark:text-[#d3e3fd] dark:ring-white/10">
              {citationLabel}
            </span>
          ) : null}
          <span className="truncate text-sm font-semibold leading-5">
            {fileName || label}
          </span>
        </span>

        {fileName && label !== fileName ? (
          <span className="mt-0.5 block text-sm leading-5 text-[#444746] dark:text-gray-300">
            {label}
          </span>
        ) : null}

        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5f6368] dark:text-gray-400">
          {pageLabel ? <span>{pageLabel}</span> : null}
          {pageLabel && hostname ? <span aria-hidden>·</span> : null}
          {hostname ? <span>{hostname}</span> : null}
        </span>
      </span>

      <MdOpenInNew
        className="mt-1 h-4 w-4 shrink-0 text-[#5f6368] transition group-hover:text-[#1a73e8] dark:text-gray-400 dark:group-hover:text-[#a8c7fa]"
        aria-hidden
      />
    </a>
  );
}
