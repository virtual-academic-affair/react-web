import { DocumentsService } from "@/services/documents";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";

export type InquiryReferenceFileItem = {
  id: string;
  label: string;
  fileId: string;
};

export type InquiryReferenceSuggestionItem = {
  id: string;
  label: string;
  insertHtml: string;
};

export type InquiryReferenceSuggestionListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

type Props = SuggestionProps<
  InquiryReferenceFileItem,
  InquiryReferenceSuggestionItem
>;

type FileDetailLike = {
  fileUrl?: string;
  tableOfContents?: string[];
};

const slugifyAnchor = (input: string) => {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

const InquiryReferenceSuggestionList = forwardRef<
  InquiryReferenceSuggestionListHandle,
  Props
>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);
  const [selectedFile, setSelectedFile] = useState<InquiryReferenceFileItem | null>(
    null,
  );
  const [fileDetail, setFileDetail] = useState<FileDetailLike | null>(null);
  const [loadingToc, setLoadingToc] = useState(false);

  useEffect(() => {
    setSelected(0);
    setSelectedFile(null);
    setFileDetail(null);
    setLoadingToc(false);
  }, [items]);

  useEffect(() => {
    if (!selectedFile) return;
    let mounted = true;
    setLoadingToc(true);
    DocumentsService.getFileDetail(selectedFile.fileId)
      .then((detail) => {
        if (!mounted) return;
        setFileDetail({
          fileUrl: detail?.fileUrl,
          tableOfContents: Array.isArray(detail?.tableOfContents)
            ? detail.tableOfContents
            : [],
        });
      })
      .finally(() => {
        if (mounted) setLoadingToc(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedFile]);

  const tocItems = useMemo(() => {
    if (!selectedFile) return [];
    const toc = fileDetail?.tableOfContents ?? [];
    const fileUrl = fileDetail?.fileUrl;
    if (!fileUrl) return [];

    return toc
      .map((tocText, index) => {
        const heading = tocText?.trim();
        if (!heading) return null;
        const anchor = slugifyAnchor(heading);
        const href = `${fileUrl}${anchor ? `#${anchor}` : ""}`;
        return {
          id: `${selectedFile.fileId}-${index}`,
          label: heading,
          insertHtml: `<a href="${href}" target="_blank" rel="noreferrer" class="text-brand-600 underline cursor-pointer hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300" title="Mở tài liệu tại mục này">${heading}</a>`,
        } as InquiryReferenceSuggestionItem;
      })
      .filter(Boolean) as InquiryReferenceSuggestionItem[];
  }, [selectedFile, fileDetail]);

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }) => {
        const activeItems = selectedFile ? tocItems : items;

        if (event.key === "Escape" && selectedFile) {
          event.preventDefault();
          setSelectedFile(null);
          setFileDetail(null);
          setSelected(0);
          return true;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelected((i) => (activeItems.length ? (i + 1) % activeItems.length : 0));
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelected((i) =>
            activeItems.length ? (i - 1 + activeItems.length) % activeItems.length : 0,
          );
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          if (!selectedFile) {
            const file = activeItems[selected] as InquiryReferenceFileItem | undefined;
            if (file) {
              setSelectedFile(file);
              setSelected(0);
            }
            return true;
          }
          const toc = activeItems[selected] as InquiryReferenceSuggestionItem | undefined;
          if (toc) command(toc);
          return true;
        }
        return false;
      },
    }),
    [items, selected, selectedFile, tocItems, command],
  );

  const activeItems = selectedFile ? tocItems : items;

  return (
    <div className="max-h-64 max-w-[420px] min-w-[260px] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-gray-900">
      <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
        {selectedFile ? (
          <button
            type="button"
            className="mr-2 rounded px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-white/10"
            onClick={() => {
              setSelectedFile(null);
              setFileDetail(null);
              setSelected(0);
            }}
          >
            ← Quay lại
          </button>
        ) : null}
        {selectedFile ? `Mục lục: ${selectedFile.label}` : "Chọn tài liệu"}
      </div>

      {loadingToc ? (
        <div className="px-3 py-2 text-sm text-gray-500">Đang tải mục lục...</div>
      ) : activeItems.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500">Không có lựa chọn</div>
      ) : (
        activeItems.map((item, index) => {
          const selectedCls =
            index === selected
              ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
              : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10";
          return (
            <button
              key={item.id}
              type="button"
              className={`w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors ${selectedCls}`}
              onClick={() => {
                if (!selectedFile) {
                  setSelectedFile(item as InquiryReferenceFileItem);
                  setSelected(0);
                  return;
                }
                command(item as InquiryReferenceSuggestionItem);
              }}
            >
              {item.label}
            </button>
          );
        })
      )}
    </div>
  );
});

InquiryReferenceSuggestionList.displayName = "InquiryReferenceSuggestionList";

export default InquiryReferenceSuggestionList;

