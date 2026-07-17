import FileIcon from "@/pages/user/documents/components/FileIcon";
import type {
  CorpusPayloadKind,
  CorpusPayloadRef,
  CorpusTreeNodeWithParent,
} from "@/types/corpus";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HiMiniDocumentCheck } from "react-icons/hi2";
import { MdFolder, MdSearch } from "react-icons/md";

import {
  hasCorpusSearchHits,
  searchCorpusTree,
  type CorpusSearchHit,
  type CorpusSearchPayloadHit,
  type CorpusSearchResults,
} from "../treeUtils";

type CorpusTreeSearchProps = {
  tree: CorpusTreeNodeWithParent[];
  onSelectFolder: (nodeKey: string) => void;
  onSelectPayload: (
    kind: CorpusPayloadKind,
    payload: CorpusPayloadRef,
    parentKey: string,
  ) => void;
};

/** Always prefix with Corpus Tree, e.g. "Corpus Tree / Đào tạo / Học phí". */
function formatCorpusPath(labels: string[]) {
  if (!labels.length) return "Corpus Tree";
  return `Corpus Tree / ${labels.join(" / ")}`;
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="py-1">
      <p className="px-3 py-1.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function ResultRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
    >
      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-navy-700 block truncate text-sm font-medium dark:text-white">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[10px] leading-snug text-gray-400 dark:text-gray-500">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

export default function CorpusTreeSearch({
  tree,
  onSelectFolder,
  onSelectPayload,
}: CorpusTreeSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const rootRef = useRef<HTMLDivElement>(null);

  const results: CorpusSearchResults = useMemo(
    () => searchCorpusTree(tree, deferredQuery),
    [deferredQuery, tree],
  );

  const showPanel =
    open && deferredQuery.trim().length > 0 && hasCorpusSearchHits(results);
  const showEmpty =
    open &&
    deferredQuery.trim().length > 0 &&
    !hasCorpusSearchHits(results);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const handleSelect = (hit: CorpusSearchHit) => {
    if (hit.kind === "folder") {
      onSelectFolder(hit.nodeKey);
    } else {
      onSelectPayload(hit.kind, hit.payload, hit.parentKey);
    }
    setQuery("");
    setOpen(false);
  };

  const renderPayloadHits = (hits: CorpusSearchPayloadHit[], label: string) => {
    if (!hits.length) return null;
    return (
      <ResultSection title={label}>
        {hits.map((hit) => (
          <ResultRow
            key={`${hit.kind}-${hit.payload.id}-${hit.parentKey}`}
            icon={
              hit.kind === "file" ? (
                <FileIcon
                  filename={
                    hit.payload.originalFilename || hit.payload.name || "file"
                  }
                  size="xs"
                  plain
                />
              ) : (
                <HiMiniDocumentCheck
                  className="h-4 w-4 shrink-0 text-purple-500"
                  aria-hidden
                />
              )
            }
            title={hit.payload.name || hit.payload.id}
            subtitle={formatCorpusPath(hit.pathLabels)}
            onClick={() => handleSelect(hit)}
          />
        ))}
      </ResultSection>
    );
  };

  return (
    <div ref={rootRef} className="relative w-full">
      {/* Match TableLayout / user-documents search bar styling */}
      <div className="dark:bg-navy-800 flex w-full items-center gap-2 rounded-2xl bg-white px-3 py-2">
        <MdSearch
          className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
          aria-hidden
        />
        <input
          type="text"
          name="corpus-keyword"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Tìm thư mục, tài liệu, câu hỏi…"
          className="w-full bg-transparent py-1 text-sm text-gray-700 outline-none placeholder:text-gray-500 dark:bg-transparent dark:text-white dark:placeholder:text-gray-400"
          aria-label="Tìm trong corpus tree"
          aria-expanded={showPanel || showEmpty}
          aria-controls="corpus-tree-search-results"
        />
      </div>

      {showPanel || showEmpty ? (
        <div
          id="corpus-tree-search-results"
          role="listbox"
          className="dark:bg-navy-800 absolute top-[calc(100%+6px)] left-0 z-50 max-h-80 w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-xl dark:border-white/10"
        >
          {showEmpty ? (
            <p className="px-3 py-4 text-center text-xs text-gray-400">
              Không tìm thấy kết quả
            </p>
          ) : (
            <>
              {results.folders.length ? (
                <ResultSection title="Thư mục">
                  {results.folders.map((hit) => (
                    <ResultRow
                      key={`folder-${hit.nodeKey}`}
                      icon={
                        <MdFolder
                          className="h-4 w-4 shrink-0 text-amber-500"
                          aria-hidden
                        />
                      }
                      title={hit.title}
                      subtitle={formatCorpusPath(hit.pathLabels)}
                      onClick={() => handleSelect(hit)}
                    />
                  ))}
                </ResultSection>
              ) : null}
              {renderPayloadHits(results.files, "Tài liệu")}
              {renderPayloadHits(results.faqs, "Câu hỏi")}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
