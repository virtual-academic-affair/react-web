import { PageTitle } from "@/components/layouts/PageTitle";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Switch from "@/components/switch";
import Tag from "@/components/tag/Tag";
import DocumentDetailDrawer from "@/pages/documents/components/DocumentDetailDrawer";
import {
  DOCUMENT_TYPE_COLOR_MAP,
  DOCUMENT_TYPE_MAP,
  DOCUMENT_TYPES,
} from "@/pages/documents/components/UploadDrawer";
import FAQDetailDrawer from "@/pages/documents/faqs/components/FAQDetailDrawer";
import FileIcon from "@/pages/user/documents/components/FileIcon";
import FilterGroup from "@/pages/user/documents/components/FilterGroup";
import LecturerOnlyFilter from "@/pages/user/documents/components/LecturerOnlyFilter";
import YearRangeFilter, {
  type YearRange,
} from "@/pages/user/documents/components/YearRangeFilter";
import { corpusService } from "@/services/documents/corpus.service";
import type {
  CorpusPayloadKind,
  CorpusPayloadRef,
  CorpusTreeNodeWithParent,
} from "@/types/corpus";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import { EMPTY_YEAR_RANGE_STRINGS, formatYearRange } from "@/utils/yearRange";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import {
  Fragment,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { HiMiniDocumentCheck } from "react-icons/hi2";
import { LuFolderTree } from "react-icons/lu";
import { MdChevronRight, MdFolder, MdFolderOpen } from "react-icons/md";
import { useSearchParams } from "react-router-dom";

import {
  CreateFolderModal,
  EmptyColumnMenu,
  FolderContextMenu,
  FolderPickerPopup,
} from "./CorpusMenus";
import TopicDetailDrawer from "./components/TopicDetailDrawer";
import CorpusTreeSearch from "./components/CorpusTreeSearch";
import {
  annotateTreeWithParents,
  candidateIdentityKey,
  collectSelfAndDescendantKeys,
  findNode,
  findPayloadLocations,
  getAncestorKeys,
  toAntdFolderPickerData,
} from "./treeUtils";

const EMPTY_YEAR_RANGE: YearRange = EMPTY_YEAR_RANGE_STRINGS;
/** Columns visible without scroll; extra columns enable horizontal scroll. */
const MAX_VISIBLE_COLUMNS = 3;
const MIN_COL_WIDTH = 260;
const MAX_COL_WIDTH = 720;
const DEFAULT_COL_WIDTH = 340;

const FilePreviewModal = lazy(
  () => import("@/pages/documents/components/FilePreviewModal"),
);

const DOC_TYPE_FILTER_OPTIONS = DOCUMENT_TYPES.map((t) => ({
  value: t.value,
  displayName: t.label,
  color: t.color,
}));

type FolderMenuState = {
  nodeKey: string;
  title: string;
  x: number;
  y: number;
};

type OrganizeState = {
  kind: CorpusPayloadKind;
  id: string;
  name: string;
  x: number;
  y: number;
  checkedKeys: string[];
};

type MoveState = {
  nodeKey: string;
  title: string;
  selectedParentKey: string | null;
  x: number;
  y: number;
};

type DeleteState = {
  nodeKey: string;
  title: string;
};

type CreateFolderState = {
  parentKey: string | null;
  parentLabel: string;
};

type EmptyMenuState = {
  parentKey: string | null;
  parentLabel: string;
  x: number;
  y: number;
};

type PreviewState = {
  kind: CorpusPayloadKind;
  payload: CorpusPayloadRef;
  parentKey: string;
};

type ListColumn = {
  type: "list";
  parentKey: string | null;
  folders: CorpusTreeNodeWithParent[];
  files: CorpusPayloadRef[];
  faqs: CorpusPayloadRef[];
  /** Absolute depth: 0 = roots. */
  depth: number;
};

type PreviewColumn = {
  type: "preview";
  preview: PreviewState;
};

type BrowserColumn = ListColumn | PreviewColumn;

function buildListColumns(
  tree: CorpusTreeNodeWithParent[],
  pathKeys: string[],
): ListColumn[] {
  const columns: ListColumn[] = [
    {
      type: "list",
      parentKey: null,
      folders: tree,
      files: [],
      faqs: [],
      depth: 0,
    },
  ];

  let currentFolders = tree;
  for (let i = 0; i < pathKeys.length; i++) {
    const selected = currentFolders.find((f) => f.nodeKey === pathKeys[i]);
    if (!selected) break;
    const nextFolders = selected.children ?? [];
    columns.push({
      type: "list",
      parentKey: selected.nodeKey,
      folders: nextFolders,
      files: selected.directFiles ?? [],
      faqs: selected.directFaqs ?? [],
      depth: i + 1,
    });
    currentFolders = nextFolders;
  }

  return columns;
}

function CandidatePreviewPane({
  preview,
  onOpenDetail,
  onOpenFilePreview,
}: {
  preview: PreviewState;
  onOpenDetail: () => void;
  onOpenFilePreview?: () => void;
}) {
  const { kind, payload } = preview;
  const typeKey = payload.metadata?.type ?? undefined;
  const typeLabel = typeKey ? (DOCUMENT_TYPE_MAP[typeKey] ?? typeKey) : "—";
  const title =
    payload.name ||
    `(${kind === "file" ? "file" : "faq"} ${payload.id.slice(0, 8)}…)`;

  const rows: { label: string; value: ReactNode }[] = [
    ...(kind === "file"
      ? [
          {
            label: "Loại tài liệu",
            value: typeKey ? (
              <Tag
                color={DOCUMENT_TYPE_COLOR_MAP[typeKey] ?? "#94a3b8"}
                className="text-[10px]"
                interactive={false}
              >
                {typeLabel}
              </Tag>
            ) : (
              <span>—</span>
            ),
          },
        ]
      : []),
    {
      label: "Chỉ giảng viên",
      value: (
        <Switch
          checked={Boolean(payload.lecturerOnly)}
          disabled
          readOnly
          onChange={() => undefined}
        />
      ),
    },
    {
      label: "Khóa tuyển sinh",
      value: formatYearRange(payload.metadata?.enrollmentYear, "Tất cả"),
    },
    {
      label: "Năm học",
      value: formatYearRange(payload.metadata?.academicYear, "Tất cả"),
    },
    {
      label: "Sửa lần cuối",
      value: payload.updatedAt ? formatDate(payload.updatedAt) : "—",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-3 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        {kind === "file" ? (
          <FileIcon
            filename={payload.originalFilename || payload.name || "file"}
            size="lg"
            plain
          />
        ) : (
          <HiMiniDocumentCheck className="h-12 w-12 shrink-0 text-purple-500" />
        )}
        <p className="text-navy-700 line-clamp-2 text-[14px] font-medium dark:text-white">
          {title}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3"
          >
            <span className="shrink-0 text-gray-400">{row.label}</span>
            <span className="text-navy-700 min-w-0 text-right font-medium dark:text-white">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-start gap-1.5 italic">
        {kind === "file" && onOpenFilePreview ? (
          <button
            type="button"
            onClick={onOpenFilePreview}
            className="text-brand-500 hover:text-brand-600 text-xs font-medium"
          >
            Xem tài liệu
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenDetail}
          className="text-brand-500 hover:text-brand-600 text-xs font-medium"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

export default function CorpusTreePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const detailKind =
    (searchParams.get("kind") as CorpusPayloadKind | null) ?? null;
  const detailId = searchParams.get("id") || null;

  const [typeFilter, setTypeFilter] = useState<string[]>(() => {
    const raw = searchParams.get("type");
    return raw ? raw.split(",").filter(Boolean) : [];
  });
  const [lecturerOnlyFilter, setLecturerOnlyFilter] = useState(
    () => searchParams.get("lecturerOnly") === "true",
  );
  const [enrollmentYear, setEnrollmentYear] = useState<YearRange>(() => ({
    fromYear: searchParams.get("enrollFrom") ?? "",
    toYear: searchParams.get("enrollTo") ?? "",
  }));
  const [academicYear, setAcademicYear] = useState<YearRange>(() => ({
    fromYear: searchParams.get("acadFrom") ?? "",
    toYear: searchParams.get("acadTo") ?? "",
  }));

  const [pathKeys, setPathKeys] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [highlightIdentity, setHighlightIdentity] = useState<string | null>(
    null,
  );

  const [folderMenu, setFolderMenu] = useState<FolderMenuState | null>(null);
  const [organize, setOrganize] = useState<OrganizeState | null>(null);
  const [editTopicKey, setEditTopicKey] = useState<string | null>(null);
  const [moveFolder, setMoveFolder] = useState<MoveState | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<DeleteState | null>(null);
  const [createFolder, setCreateFolder] = useState<CreateFolderState | null>(
    null,
  );
  const [emptyMenu, setEmptyMenu] = useState<EmptyMenuState | null>(null);
  const [dragFolderKey, setDragFolderKey] = useState<string | null>(null);
  const [filePreviewId, setFilePreviewId] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const resizeRef = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const lecturerOnlyArg = lecturerOnlyFilter ? true : undefined;

  const metadataFilterArg = useMemo(() => {
    const result: Record<string, unknown> = {};
    if (typeFilter.length > 0) result.type = typeFilter;
    if (enrollmentYear.fromYear || enrollmentYear.toYear) {
      const obj: Record<string, number> = {};
      if (enrollmentYear.fromYear)
        obj.fromYear = Number(enrollmentYear.fromYear);
      if (enrollmentYear.toYear) obj.toYear = Number(enrollmentYear.toYear);
      result.enrollmentYear = obj;
    }
    if (academicYear.fromYear || academicYear.toYear) {
      const obj: Record<string, number> = {};
      if (academicYear.fromYear) obj.fromYear = Number(academicYear.fromYear);
      if (academicYear.toYear) obj.toYear = Number(academicYear.toYear);
      result.academicYear = obj;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [typeFilter, enrollmentYear, academicYear]);

  const hasFilters =
    typeFilter.length > 0 ||
    lecturerOnlyFilter ||
    Boolean(enrollmentYear.fromYear || enrollmentYear.toYear) ||
    Boolean(academicYear.fromYear || academicYear.toYear);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (typeFilter.length > 0) next.set("type", typeFilter.join(","));
        else next.delete("type");
        if (lecturerOnlyArg !== undefined)
          next.set("lecturerOnly", String(lecturerOnlyArg));
        else next.delete("lecturerOnly");
        if (enrollmentYear.fromYear)
          next.set("enrollFrom", enrollmentYear.fromYear);
        else next.delete("enrollFrom");
        if (enrollmentYear.toYear) next.set("enrollTo", enrollmentYear.toYear);
        else next.delete("enrollTo");
        if (academicYear.fromYear) next.set("acadFrom", academicYear.fromYear);
        else next.delete("acadFrom");
        if (academicYear.toYear) next.set("acadTo", academicYear.toYear);
        else next.delete("acadTo");
        return next;
      },
      { replace: true },
    );
  }, [
    typeFilter,
    lecturerOnlyArg,
    enrollmentYear,
    academicYear,
    setSearchParams,
  ]);

  const treeQuery = useQuery({
    queryKey: ["corpus-tree", lecturerOnlyArg, metadataFilterArg],
    queryFn: () =>
      corpusService.getTree({
        lecturerOnly: lecturerOnlyArg,
        metadataFilter: metadataFilterArg,
      }),
  });

  const tree = useMemo(
    () => annotateTreeWithParents(treeQuery.data?.tree ?? []),
    [treeQuery.data?.tree],
  );

  const folderPickerData = useMemo(() => toAntdFolderPickerData(tree), [tree]);

  const allColumns: BrowserColumn[] = useMemo(() => {
    const listCols = buildListColumns(tree, pathKeys);
    if (!preview) return listCols;
    return [...listCols, { type: "preview", preview } satisfies PreviewColumn];
  }, [tree, pathKeys, preview]);

  const columnsScrollRef = useRef<HTMLDivElement>(null);

  const columnSlots: (BrowserColumn | null)[] = useMemo(() => {
    const slotCount = Math.max(MAX_VISIBLE_COLUMNS, allColumns.length);
    const slots: (BrowserColumn | null)[] = [];
    for (let i = 0; i < slotCount; i++) {
      slots.push(allColumns[i] ?? null);
    }
    return slots;
  }, [allColumns]);

  useEffect(() => {
    const el = columnsScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [allColumns.length]);

  useEffect(() => {
    setColumnWidths((prev) => {
      const count = columnSlots.length;
      const next = [...prev];
      while (next.length < count) {
        next.push(DEFAULT_COL_WIDTH);
      }
      return next.slice(0, count);
    });
  }, [columnSlots.length]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const { index, startX, startWidth } = resizeRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.min(
        MAX_COL_WIDTH,
        Math.max(MIN_COL_WIDTH, startWidth + delta),
      );
      setColumnWidths((prev) => {
        const next = [...prev];
        next[index] = newWidth;
        return next;
      });
    };
    const onUp = () => {
      resizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startColumnResize = useCallback(
    (index: number, e: ReactMouseEvent) => {
      e.preventDefault();
      resizeRef.current = {
        index,
        startX: e.clientX,
        startWidth: columnWidths[index] ?? DEFAULT_COL_WIDTH,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [columnWidths],
  );

  type BreadcrumbCrumb = {
    label: string;
    /** Keep pathKeys of this length; null = preview (no navigate). */
    pathLength: number | null;
  };

  const breadcrumbCrumbs = useMemo((): BreadcrumbCrumb[] => {
    const crumbs: BreadcrumbCrumb[] = [
      { label: "Corpus Tree", pathLength: 0 },
      ...pathKeys.map((key, index) => ({
        label: findNode(tree, key)?.title || key,
        pathLength: index + 1,
      })),
    ];
    if (preview?.payload.name) {
      crumbs.push({
        label: preview.payload.name,
        pathLength: null,
      });
    }
    return crumbs;
  }, [pathKeys, preview, tree]);

  const headerTitle = "Corpus Tree";

  const currentItemCount = useMemo(() => {
    for (let i = allColumns.length - 1; i >= 0; i--) {
      const col = allColumns[i];
      if (col?.type === "list") {
        return col.folders.length + col.files.length + col.faqs.length;
      }
    }
    return 0;
  }, [allColumns]);

  const navigateBreadcrumb = useCallback((pathLength: number) => {
    setPathKeys((prev) => prev.slice(0, pathLength));
    setPreview(null);
    setHighlightIdentity(null);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setTypeFilter([]);
    setLecturerOnlyFilter(false);
    setEnrollmentYear(EMPTY_YEAR_RANGE);
    setAcademicYear(EMPTY_YEAR_RANGE);
  }, []);

  const openDetail = useCallback(
    (kind: CorpusPayloadKind, id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("kind", kind);
        next.set("id", id);
        return next;
      });
    },
    [setSearchParams],
  );

  const closeDetail = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("kind");
      next.delete("id");
      return next;
    });
  }, [setSearchParams]);

  const selectFolderAtDepth = useCallback((depth: number, nodeKey: string) => {
    setPathKeys((prev) => [...prev.slice(0, depth), nodeKey]);
    setPreview(null);
    setHighlightIdentity(null);
  }, []);

  const selectCandidateAtDepth = useCallback(
    (
      depth: number,
      kind: CorpusPayloadKind,
      payload: CorpusPayloadRef,
      parentKey: string,
    ) => {
      setPathKeys((prev) => prev.slice(0, depth));
      setPreview({ kind, payload, parentKey });
      setHighlightIdentity(candidateIdentityKey(kind, payload.id));
    },
    [],
  );

  const moveMutation = useMutation({
    mutationFn: ({
      nodeKey,
      parentKey,
    }: {
      nodeKey: string;
      parentKey: string | null;
    }) => corpusService.updateTopic(nodeKey, { parentKey }),
    onSuccess: () => {
      toast.success("Đã di chuyển thư mục.");
      setMoveFolder(null);
      queryClient.invalidateQueries({ queryKey: ["corpus-tree"] });
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (nodeKey: string) => corpusService.deleteTopic(nodeKey),
    onSuccess: (_data, nodeKey) => {
      toast.success("Đã xóa thư mục.");
      setDeleteFolder(null);
      setPathKeys((prev) => {
        const idx = prev.indexOf(nodeKey);
        return idx >= 0 ? prev.slice(0, idx) : prev;
      });
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["corpus-tree"] });
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const createMutation = useMutation({
    mutationFn: ({
      title,
      parentKey,
    }: {
      title: string;
      parentKey: string | null;
    }) => {
      const slug = title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return corpusService.createTopic({
        slug: slug || `folder-${Date.now()}`,
        title,
        parentKey,
      });
    },
    onSuccess: () => {
      toast.success("Đã tạo chủ đề.");
      setCreateFolder(null);
      queryClient.invalidateQueries({ queryKey: ["corpus-tree"] });
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const organizeMutation = useMutation({
    mutationFn: async ({
      kind,
      id,
      nodeKeys,
    }: {
      kind: CorpusPayloadKind;
      id: string;
      nodeKeys: string[];
    }) => {
      if (kind === "file") {
        return corpusService.updateFileTopics(id, nodeKeys);
      }
      return corpusService.updateFaqTopics(id, nodeKeys);
    },
    onSuccess: () => {
      toast.success("Đã cập nhật thư mục của candidate.");
      setOrganize(null);
      queryClient.invalidateQueries({ queryKey: ["corpus-tree"] });
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const openOrganize = useCallback(
    (
      kind: CorpusPayloadKind,
      id: string,
      name: string,
      x: number,
      y: number,
    ) => {
      setFolderMenu(null);
      setOrganize({
        kind,
        id,
        name,
        x,
        y,
        checkedKeys: findPayloadLocations(tree, kind, id),
      });
    },
    [tree],
  );

  const openFolderMenu = useCallback(
    (folder: CorpusTreeNodeWithParent, x: number, y: number) => {
      setOrganize(null);
      setEmptyMenu(null);
      setFolderMenu({
        nodeKey: folder.nodeKey,
        title: folder.title,
        x,
        y,
      });
    },
    [],
  );

  const openEmptyColumnMenu = useCallback(
    (parentKey: string | null, parentLabel: string, x: number, y: number) => {
      setFolderMenu(null);
      setOrganize(null);
      setEmptyMenu({ parentKey, parentLabel, x, y });
    },
    [],
  );

  const moveDisabledKeys = useMemo(() => {
    if (!moveFolder) return [];
    return collectSelfAndDescendantKeys(tree, moveFolder.nodeKey);
  }, [moveFolder, tree]);

  const handleDropOntoFolder = useCallback(
    (targetFolder: CorpusTreeNodeWithParent) => {
      if (!dragFolderKey) return;
      if (dragFolderKey === targetFolder.nodeKey) return;

      const dragNode = findNode(tree, dragFolderKey);
      if (!dragNode) return;

      let cursor: CorpusTreeNodeWithParent | null = targetFolder;
      while (cursor) {
        if (cursor.nodeKey === dragFolderKey) {
          toast.error(
            "Không thể di chuyển thư mục vào chính nó hoặc thư mục con.",
          );
          setDragFolderKey(null);
          return;
        }
        cursor = cursor.parentKey ? findNode(tree, cursor.parentKey) : null;
      }

      if (dragNode.parentKey === targetFolder.nodeKey) {
        toast.info("Thư mục đã ở vị trí này.");
        setDragFolderKey(null);
        return;
      }

      moveMutation.mutate({
        nodeKey: dragFolderKey,
        parentKey: targetFolder.nodeKey,
      });
      setDragFolderKey(null);
    },
    [dragFolderKey, moveMutation, tree],
  );

  const handleDropToRoot = useCallback(() => {
    if (!dragFolderKey) return;
    const dragNode = findNode(tree, dragFolderKey);
    if (!dragNode) return;
    if (dragNode.parentKey === null) {
      toast.info("Thư mục đã ở gốc.");
      setDragFolderKey(null);
      return;
    }
    moveMutation.mutate({ nodeKey: dragFolderKey, parentKey: null });
    setDragFolderKey(null);
  }, [dragFolderKey, moveMutation, tree]);

  const invalidateTree = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["corpus-tree"] });
  }, [queryClient]);

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col gap-4">
      <PageTitle
        title={headerTitle}
        tabTitle={headerTitle}
        icon={LuFolderTree}
      />

      <div className="flex shrink-0 flex-col gap-2">
        <CorpusTreeSearch
          tree={tree}
          onSelectFolder={(nodeKey) => {
            const ancestors = getAncestorKeys(tree, nodeKey);
            setPathKeys([...ancestors, nodeKey]);
            setPreview(null);
            setHighlightIdentity(null);
          }}
          onSelectPayload={(kind, payload, parentKey) => {
            const ancestors = getAncestorKeys(tree, parentKey);
            setPathKeys([...ancestors, parentKey]);
            setPreview({ kind, payload, parentKey });
            setHighlightIdentity(candidateIdentityKey(kind, payload.id));
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterGroup
            label="Loại tài liệu"
            typeKey="type"
            options={DOC_TYPE_FILTER_OPTIONS}
            selected={typeFilter}
            onChange={setTypeFilter}
          />
          <LecturerOnlyFilter
            checked={lecturerOnlyFilter}
            onChange={setLecturerOnlyFilter}
          />
          <YearRangeFilter
            label="Khóa tuyển sinh"
            value={enrollmentYear}
            onChange={setEnrollmentYear}
          />
          <YearRangeFilter
            label="Năm học"
            value={academicYear}
            onChange={setAcademicYear}
          />
          {hasFilters ? (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-action-link ml-2 text-xs"
            >
              Xóa tất cả
            </button>
          ) : null}
        </div>
      </div>

      <div className="dark:bg-navy-800 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/10">
        {treeQuery.isLoading ? (
          <p className="min-h-0 flex-1 px-4 py-10 text-center text-sm text-gray-400">
            Đang tải corpus tree…
          </p>
        ) : treeQuery.isError ? (
          <p className="min-h-0 flex-1 px-4 py-10 text-center text-sm text-red-500">
            {parseError(treeQuery.error)}
          </p>
        ) : (
          <div
            ref={columnsScrollRef}
            className="corpus-cols flex min-h-0 flex-1 overflow-x-auto overflow-y-hidden"
          >
            {columnSlots.map((column, slotIndex) => {
              const colWidth = columnWidths[slotIndex] ?? DEFAULT_COL_WIDTH;
              const slotStyle = {
                width: colWidth,
                minWidth: MIN_COL_WIDTH,
                maxWidth: MAX_COL_WIDTH,
              };

              const renderSlot = () => {
                if (!column) {
                  return (
                    <div
                      key={`slot-${slotIndex}`}
                      style={slotStyle}
                      className="corpus-col-slot shrink-0"
                      aria-hidden
                    />
                  );
                }

                if (column.type === "preview") {
                  return (
                    <div
                      key={`slot-${slotIndex}`}
                      style={slotStyle}
                      className="corpus-col-slot flex min-h-0 shrink-0 flex-col"
                    >
                      <CandidatePreviewPane
                        preview={column.preview}
                        onOpenDetail={() =>
                          openDetail(
                            column.preview.kind,
                            column.preview.payload.id,
                          )
                        }
                        onOpenFilePreview={
                          column.preview.kind === "file"
                            ? () => setFilePreviewId(column.preview.payload.id)
                            : undefined
                        }
                      />
                    </div>
                  );
                }

                const selectedKey = pathKeys[column.depth] ?? null;
                const isRootColumn = column.depth === 0;
                const empty =
                  column.folders.length === 0 &&
                  column.files.length === 0 &&
                  column.faqs.length === 0;
                const selectedCandidateId =
                  preview && preview.parentKey === column.parentKey
                    ? preview.payload.id
                    : null;

                return (
                  <div
                    key={`slot-${slotIndex}`}
                    style={slotStyle}
                    className="corpus-col-slot flex min-h-0 shrink-0 flex-col"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const parentLabel = column.parentKey
                        ? findNode(tree, column.parentKey)?.title ||
                          column.parentKey
                        : "Corpus Tree";
                      openEmptyColumnMenu(
                        column.parentKey,
                        parentLabel,
                        e.clientX,
                        e.clientY,
                      );
                    }}
                    onDragOver={(e) => {
                      if (!dragFolderKey || !isRootColumn) return;
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (!isRootColumn) return;
                      e.preventDefault();
                      handleDropToRoot();
                    }}
                  >
                    <div className="min-h-0 flex-1 overflow-y-auto py-1">
                      {empty ? (
                        <p className="px-3 py-6 text-center text-xs text-gray-400">
                          {hasFilters && tree.length === 0
                            ? "Không khớp bộ lọc"
                            : "Trống"}
                        </p>
                      ) : null}

                      {column.folders.map((folder) => {
                        const active = selectedKey === folder.nodeKey;
                        const hasNext =
                          (folder.children?.length ?? 0) > 0 ||
                          (folder.directFiles?.length ?? 0) > 0 ||
                          (folder.directFaqs?.length ?? 0) > 0;
                        return (
                          <button
                            key={folder.nodeKey}
                            type="button"
                            draggable
                            onMouseDown={(e) => e.preventDefault()}
                            onDragStart={() => setDragFolderKey(folder.nodeKey)}
                            onDragEnd={() => setDragFolderKey(null)}
                            onDragOver={(e) => {
                              if (
                                !dragFolderKey ||
                                dragFolderKey === folder.nodeKey
                              )
                                return;
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDropOntoFolder(folder);
                            }}
                            onClick={() =>
                              selectFolderAtDepth(column.depth, folder.nodeKey)
                            }
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openFolderMenu(folder, e.clientX, e.clientY);
                            }}
                            className={`corpus-col-item flex h-9 w-full items-center gap-2 px-3 text-left ${
                              active ? "bg-brand-500/10" : ""
                            }`}
                          >
                            {active ? (
                              <MdFolderOpen className="text-brand-500 h-4 w-4 shrink-0" />
                            ) : (
                              <MdFolder className="h-4 w-4 shrink-0 text-amber-500" />
                            )}
                            <span className="text-navy-700 min-w-0 flex-1 truncate text-sm font-medium dark:text-white">
                              {folder.title}
                            </span>
                            {hasNext ? (
                              <MdChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-300" />
                            ) : (
                              <span className="ml-auto h-3.5 w-3.5 shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {column.files.map((file) => {
                        const identity = candidateIdentityKey("file", file.id);
                        const active =
                          selectedCandidateId === file.id ||
                          highlightIdentity === identity;
                        const name =
                          file.name || `(file ${file.id.slice(0, 8)}…)`;
                        return (
                          <button
                            key={`file:${file.id}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              if (!column.parentKey) return;
                              selectCandidateAtDepth(
                                column.depth,
                                "file",
                                file,
                                column.parentKey,
                              );
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openOrganize(
                                "file",
                                file.id,
                                file.name || name,
                                e.clientX,
                                e.clientY,
                              );
                            }}
                            className={`corpus-col-item flex h-9 w-full items-center gap-2 px-3 text-left ${
                              active ? "bg-brand-500/15" : ""
                            }`}
                          >
                            <FileIcon
                              filename={
                                file.originalFilename || file.name || "file"
                              }
                              size="xs"
                              plain
                            />
                            <span className="text-navy-700 min-w-0 flex-1 truncate text-sm font-medium dark:text-white">
                              {name}
                            </span>
                          </button>
                        );
                      })}

                      {column.faqs.map((faq) => {
                        const identity = candidateIdentityKey("faq", faq.id);
                        const active =
                          selectedCandidateId === faq.id ||
                          highlightIdentity === identity;
                        const name = faq.name || `(faq ${faq.id.slice(0, 8)}…)`;
                        return (
                          <button
                            key={`faq:${faq.id}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              if (!column.parentKey) return;
                              selectCandidateAtDepth(
                                column.depth,
                                "faq",
                                faq,
                                column.parentKey,
                              );
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openOrganize(
                                "faq",
                                faq.id,
                                faq.name || name,
                                e.clientX,
                                e.clientY,
                              );
                            }}
                            className={`corpus-col-item flex h-9 w-full items-center gap-2 px-3 text-left ${
                              active ? "bg-brand-500/15" : ""
                            }`}
                          >
                            <HiMiniDocumentCheck className="h-4 w-4 shrink-0 text-purple-500" />
                            <span className="text-navy-700 min-w-0 flex-1 truncate text-sm font-medium dark:text-white">
                              {name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              };

              return (
                <Fragment key={`slot-group-${slotIndex}`}>
                  {renderSlot()}
                  {slotIndex < columnSlots.length - 1 ? (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      className="corpus-col-resizer shrink-0"
                      onMouseDown={(e) => startColumnResize(slotIndex, e)}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 px-3 py-2 dark:border-white/5">
          <div className="text-navy-700 flex min-w-0 flex-1 items-center truncate text-[11px] font-medium dark:text-gray-300">
            {breadcrumbCrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbCrumbs.length - 1;
              const canNavigate = crumb.pathLength != null && !isLast;
              return (
                <span key={`${crumb.label}-${index}`} className="contents">
                  {index > 0 ? (
                    <span className="mx-1.5 shrink-0 text-gray-300 dark:text-gray-600">
                      /
                    </span>
                  ) : null}
                  {canNavigate ? (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => navigateBreadcrumb(crumb.pathLength!)}
                      className="corpus-col-item hover:text-brand-500 max-w-[10rem] truncate text-gray-400"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className={`max-w-[10rem] truncate ${
                        isLast ? "text-brand-500" : "text-gray-400"
                      }`}
                    >
                      {crumb.label}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <span className="shrink-0 text-[11px] text-gray-400">
            {currentItemCount} mục
          </span>
        </div>
      </div>

      <style>{`
        .corpus-col-slot {
          flex-shrink: 0;
          border-right: 1px solid rgb(243 244 246 / 0.9);
        }
        .dark .corpus-col-slot {
          border-right-color: rgb(255 255 255 / 0.08);
        }
        .corpus-col-resizer {
          width: 5px;
          margin: 0 -2px;
          cursor: col-resize;
          position: relative;
          z-index: 2;
        }
        .corpus-col-resizer:hover {
          background: rgb(203 213 225 / 0.35);
        }
        .dark .corpus-col-resizer:hover {
          background: rgb(255 255 255 / 0.08);
        }
        .corpus-col-item {
          -webkit-tap-highlight-color: transparent;
          outline: none !important;
          box-shadow: none !important;
        }
        .corpus-col-item:focus,
        .corpus-col-item:focus-visible,
        .corpus-col-item:active {
          outline: none !important;
          box-shadow: none !important;
        }
        .corpus-folder-picker .ant-tree-node-content-wrapper:hover,
        .corpus-folder-picker .ant-tree-node-content-wrapper:focus,
        .corpus-folder-picker .ant-tree-node-content-wrapper:active {
          background: transparent !important;
        }
      `}</style>

      <FolderContextMenu
        open={!!folderMenu}
        x={folderMenu?.x ?? 0}
        y={folderMenu?.y ?? 0}
        onClose={() => setFolderMenu(null)}
        onEdit={() => {
          if (!folderMenu) return;
          setEditTopicKey(folderMenu.nodeKey);
        }}
        onRemove={() => {
          if (!folderMenu) return;
          setDeleteFolder({
            nodeKey: folderMenu.nodeKey,
            title: folderMenu.title,
          });
        }}
        onMove={() => {
          if (!folderMenu) return;
          const node = findNode(tree, folderMenu.nodeKey);
          setMoveFolder({
            nodeKey: folderMenu.nodeKey,
            title: folderMenu.title,
            selectedParentKey: node?.parentKey ?? null,
            x: folderMenu.x,
            y: folderMenu.y,
          });
        }}
      />

      <EmptyColumnMenu
        open={!!emptyMenu}
        x={emptyMenu?.x ?? 0}
        y={emptyMenu?.y ?? 0}
        onClose={() => setEmptyMenu(null)}
        onCreateFolder={() => {
          if (!emptyMenu) return;
          setCreateFolder({
            parentKey: emptyMenu.parentKey,
            parentLabel: emptyMenu.parentLabel,
          });
        }}
      />

      <FolderPickerPopup
        open={!!organize}
        anchor={organize ? { x: organize.x, y: organize.y } : null}
        title={organize?.name ?? ""}
        subtitle={`${organize?.checkedKeys.length ?? 0} được chọn`}
        folderTree={folderPickerData}
        mode="multiple"
        checkedKeys={organize?.checkedKeys ?? []}
        saving={organizeMutation.isPending}
        onCheck={(keys) => {
          setOrganize((prev) => (prev ? { ...prev, checkedKeys: keys } : prev));
        }}
        onClose={() => setOrganize(null)}
        onSave={() => {
          if (!organize) return;
          organizeMutation.mutate({
            kind: organize.kind,
            id: organize.id,
            nodeKeys: organize.checkedKeys,
          });
        }}
      />

      <FolderPickerPopup
        open={!!moveFolder}
        anchor={moveFolder ? { x: moveFolder.x, y: moveFolder.y } : null}
        title={moveFolder?.title ?? ""}
        subtitle="Chọn thư mục đích"
        folderTree={folderPickerData}
        mode="single"
        selectedKey={moveFolder?.selectedParentKey ?? null}
        disabledKeys={moveDisabledKeys}
        showRootOption
        saving={moveMutation.isPending}
        saveLabel="Di chuyển"
        onSelect={(key) => {
          setMoveFolder((prev) =>
            prev ? { ...prev, selectedParentKey: key } : prev,
          );
        }}
        onClose={() => setMoveFolder(null)}
        onSave={() => {
          if (!moveFolder) return;
          const node = findNode(tree, moveFolder.nodeKey);
          if (node?.parentKey === moveFolder.selectedParentKey) {
            toast.info("Thư mục đã ở vị trí này.");
            setMoveFolder(null);
            return;
          }
          moveMutation.mutate({
            nodeKey: moveFolder.nodeKey,
            parentKey: moveFolder.selectedParentKey,
          });
        }}
      />

      <TopicDetailDrawer
        nodeKey={editTopicKey}
        isOpen={!!editTopicKey}
        onClose={() => setEditTopicKey(null)}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["corpus-tree"] });
        }}
      />

      <CreateFolderModal
        open={!!createFolder}
        parentLabel={createFolder?.parentLabel ?? "Corpus Tree"}
        saving={createMutation.isPending}
        onClose={() => setCreateFolder(null)}
        onSave={(title) => {
          if (!createFolder || !title) return;
          createMutation.mutate({
            title,
            parentKey: createFolder.parentKey,
          });
        }}
      />

      {filePreviewId ? (
        <Suspense fallback={null}>
          <FilePreviewModal
            fileId={filePreviewId}
            fileName={
              preview?.kind === "file" && preview.payload.id === filePreviewId
                ? preview.payload.name || "Tài liệu"
                : "Tài liệu"
            }
            isOpen
            onClose={() => setFilePreviewId(null)}
          />
        </Suspense>
      ) : null}

      <ConfirmModal
        open={!!deleteFolder}
        onCancel={() => setDeleteFolder(null)}
        onConfirm={() => {
          if (!deleteFolder) return;
          deleteMutation.mutate(deleteFolder.nodeKey);
        }}
        title="Xóa chủ đề?"
        subTitle={
          deleteFolder
            ? `Xóa “${deleteFolder.title}” khỏi Corpus Tree. Thao tác không thể hoàn tác.`
            : undefined
        }
        confirmText={deleteMutation.isPending ? "Đang xóa…" : "Xóa"}
        loading={deleteMutation.isPending}
        danger
      />

      <DocumentDetailDrawer
        fileId={detailKind === "file" ? detailId : null}
        isOpen={detailKind === "file" && !!detailId}
        onClose={closeDetail}
        onDeleted={() => {
          invalidateTree();
          closeDetail();
        }}
        onUpdated={invalidateTree}
      />

      <FAQDetailDrawer
        id={detailKind === "faq" ? (detailId ?? undefined) : undefined}
        open={detailKind === "faq" && !!detailId}
        onClose={closeDetail}
        onFAQChanged={() => invalidateTree()}
        onFAQDeleted={() => {
          invalidateTree();
          closeDetail();
        }}
      />
    </div>
  );
}
