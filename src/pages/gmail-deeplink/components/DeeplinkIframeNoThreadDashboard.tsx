import { CopyableText } from "@/components/copyable/CopyableText";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip";
import {
  CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
  classRegistrationItemsService,
  classRegistrationsService,
} from "@/services/class-registration";
import { messagesService } from "@/services/email";
import { inquiriesService } from "@/services/inquiry";
import type {
  ClassRegistrationItem,
  ItemStatus,
  RegistrationAction,
} from "@/types/classRegistration";
import {
  ItemStatusColors,
  ItemStatusLabels,
  RegistrationActionColors,
  RegistrationActionLabels,
} from "@/types/classRegistration";
import {
  ReplyPluckEntity,
  type Message,
  type ReplyPluckEntity as ReplyPluckEntityValue,
} from "@/types/email";
import {
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/messageStatus";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MdCheck } from "react-icons/md";
import { deeplinkBtnSecondary } from "./deeplinkButtonClasses";
import GmailAccessBlocked from "./GmailAccessBlocked";
import RegistrationActionTag from "./RegistrationActionTag";

/** Chuẩn extension: `2026/4/20` (năm/tháng/ngày). */
function normUrlParam(s: string | null): string | null {
  if (s == null || String(s).trim() === "") return null;
  return String(s).trim();
}

function parseSlashYmdToDate(s: string): Date | null {
  const m = s.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  const dt = new Date(y, mo - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function slashYmdToDayStartIso(s: string | null): string | undefined {
  const n = normUrlParam(s);
  if (!n) return undefined;
  const d = parseSlashYmdToDate(n);
  if (!d) return undefined;
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    0,
    0,
    0,
    0,
  ).toISOString();
}

function slashYmdToDayEndIso(s: string | null): string | undefined {
  const n = normUrlParam(s);
  if (!n) return undefined;
  const d = parseSlashYmdToDate(n);
  if (!d) return undefined;
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999,
  ).toISOString();
}

/** Hiển thị vi-VN nếu đúng `YYYY/M/D`; sai định dạng thì hiện nguyên chuỗi (chỉ đọc). */
function formatDisplaySlashParam(s: string | null): string | null {
  const n = normUrlParam(s);
  if (!n) return null;
  const d = parseSlashYmdToDate(n);
  if (d) return d.toLocaleDateString("vi-VN");
  return n;
}

const ITEM_STATUSES: ItemStatus[] = ["pending", "approved", "rejected"];

const itemStatusOptions = ITEM_STATUSES.map((value) => ({
  value,
  label: ItemStatusLabels[value],
}));

const ITEM_STATUS_HEX: Record<ItemStatus, string> = {
  pending: ItemStatusColors.pending.hex,
  approved: ItemStatusColors.approved.hex,
  rejected: ItemStatusColors.rejected.hex,
};

const pillRowBtnSecondary =
  `${deeplinkBtnSecondary} min-w-0 flex-1 justify-center !rounded-full px-2 text-xs font-medium`.trim();

const iframeListBaseKey = ["gmail-iframe-dashboard"] as const;

/** Overview + chi tiết theo môn trong iframe Gmail chỉ lấy phiếu tin nhắn `staged`. */
const IFRAME_CLASS_REG_MESSAGE_STATUSES = ["staged"] as const;

const ITEM_FILTERS_COOKIE = "vaa_gmail_iframe_class_reg_item_filters";
const ITEM_FILTERS_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

const REGISTRATION_ACTIONS: RegistrationAction[] = [
  "register",
  "cancel",
  "requestOpen",
];

const REPLY_PLUCK_ENTITY_OPTIONS: Array<{
  value: ReplyPluckEntityValue;
  label: string;
}> = [
  { value: ReplyPluckEntity.Inquiry, label: "Thắc mắc" },
  { value: ReplyPluckEntity.ClassRegistration, label: "Đăng kí lớp" },
];

type ItemListFilters = {
  actions: RegistrationAction[];
  statuses: ItemStatus[];
};

function isItemStatus(v: unknown): v is ItemStatus {
  return v === "pending" || v === "approved" || v === "rejected";
}

function isRegistrationAction(v: unknown): v is RegistrationAction {
  return v === "register" || v === "cancel" || v === "requestOpen";
}

function readItemListFiltersCookie(): ItemListFilters {
  const empty: ItemListFilters = { actions: [], statuses: [] };
  if (typeof document === "undefined") return empty;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ITEM_FILTERS_COOKIE}=`));
  if (!raw) return empty;
  const encoded = raw.slice(ITEM_FILTERS_COOKIE.length + 1);
  if (!encoded) return empty;
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded)) as unknown;
    if (!parsed || typeof parsed !== "object") return empty;
    const o = parsed as { actions?: unknown; statuses?: unknown };
    const actions = Array.isArray(o.actions)
      ? o.actions.filter(isRegistrationAction)
      : [];
    const statuses = Array.isArray(o.statuses)
      ? o.statuses.filter(isItemStatus)
      : [];
    return { actions, statuses };
  } catch {
    return empty;
  }
}

function writeItemListFiltersCookie(filters: ItemListFilters) {
  if (typeof document === "undefined") return;
  const payload = JSON.stringify({
    actions: filters.actions,
    statuses: filters.statuses,
  });
  document.cookie = `${ITEM_FILTERS_COOKIE}=${encodeURIComponent(payload)};path=/;max-age=${ITEM_FILTERS_COOKIE_MAX_AGE};SameSite=Lax`;
}

function ColFilterIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-3.5 w-3.5 shrink-0 ${
        active
          ? "text-brand-600 dark:text-brand-400"
          : "text-gray-400 dark:text-gray-500"
      }`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M2 5h16v1.5H2V5zm2.5 4.25h11v1.5h-11v-1.5zm2.5 4.25h6v1.5H7v-1.5z" />
    </svg>
  );
}

const FILTER_DROPDOWN_MAX_H = 280;

type ItemFilterDropdownOption = {
  value: string;
  label: string;
  color: string;
};

function ItemFilterDropdown({
  active,
  ariaLabel,
  panelTitle,
  options,
  selected,
  onToggle,
  onClear,
  clearLinkLabel,
}: {
  active: boolean;
  ariaLabel: string;
  panelTitle: string;
  options: ItemFilterDropdownOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  clearLinkLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  }>({ left: 0 });

  const updatePos = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const panelW = 260;
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - panelW - 8),
    );
    if (spaceBelow < FILTER_DROPDOWN_MAX_H && spaceAbove > spaceBelow) {
      setDropdownPos({
        bottom: window.innerHeight - rect.top + 4,
        left,
      });
    } else {
      setDropdownPos({ top: rect.bottom + 4, left });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePos, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, { capture: true });
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    updatePos();
    setOpen(true);
  };

  return (
    <>
      <span ref={triggerRef} className="inline-flex shrink-0">
        <button
          type="button"
          aria-label={ariaLabel}
          aria-expanded={open}
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
            active
              ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/15"
              : "border-transparent hover:bg-gray-100 dark:hover:bg-white/10"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleOpen();
          }}
        >
          <ColFilterIcon active={active} />
        </button>
      </span>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-200"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div
              style={{
                top: dropdownPos.top,
                bottom: dropdownPos.bottom,
                left: dropdownPos.left,
              }}
              className="dark:bg-navy-900 fixed z-210 max-h-[280px] w-[min(260px,calc(100vw-16px))] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2.5 shadow-xl dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              role="dialog"
              aria-label={panelTitle}
            >
              <p className="text-navy-700 mb-2 text-xs font-medium dark:text-gray-300">
                {panelTitle}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => {
                  const isOn = selected.includes(opt.value);
                  const softBg = `${opt.color}20`;
                  const hoverBg = `${opt.color}15`;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onToggle(opt.value)}
                      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 pl-2 text-left text-xs font-medium transition-all duration-150 select-none ${
                        isOn
                          ? "shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                      }`}
                      style={
                        isOn
                          ? {
                              backgroundColor: softBg,
                              color: opt.color,
                              borderColor: opt.color,
                            }
                          : undefined
                      }
                      onMouseEnter={(e) => {
                        if (!isOn) {
                          e.currentTarget.style.backgroundColor = hoverBg;
                          e.currentTarget.style.borderColor = opt.color;
                          e.currentTarget.style.color = opt.color;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOn) {
                          e.currentTarget.style.backgroundColor = "";
                          e.currentTarget.style.borderColor = "";
                          e.currentTarget.style.color = "";
                        }
                      }}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="min-w-0 truncate">{opt.label}</span>
                      {isOn ? (
                        <MdCheck
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: opt.color }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {selected.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="text-brand-600 dark:text-brand-400 mt-2.5 text-left text-xs font-medium hover:underline"
                >
                  {clearLinkLabel}
                </button>
              ) : null}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function DeeplinkSectionShell({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="dark:bg-navy-950/40 rounded-2xl bg-white p-4">
      {title ? (
        <header className="flex flex-col gap-3">
          <div className="border-brand-500 flex min-w-0 flex-1 items-center gap-2 border-l-4 pl-3">
            <h2 className="text-navy-900 min-w-0 text-base font-semibold tracking-tight uppercase dark:text-white">
              {title}
            </h2>
          </div>
        </header>
      ) : null}
      {children}
    </section>
  );
}

export interface DeeplinkIframeNoThreadDashboardProps {
  /** Query `after=YYYY/M/D` từ extension (href Gmail); không có → null */
  afterParam: string | null;
  /** Query `before=YYYY/M/D` */
  beforeParam: string | null;
}

const DeeplinkIframeNoThreadDashboard: React.FC<
  DeeplinkIframeNoThreadDashboardProps
> = ({ afterParam, beforeParam }) => {
  const queryClient = useQueryClient();

  const sentFrom = useMemo(
    () => slashYmdToDayStartIso(afterParam),
    [afterParam],
  );
  const sentTo = useMemo(() => slashYmdToDayEndIso(beforeParam), [beforeParam]);

  const listParams = useMemo(() => {
    const p: {
      sentFrom?: string;
      sentTo?: string;
      page: number;
      limit: number;
    } = { page: 1, limit: 1 };
    if (sentFrom != null) p.sentFrom = sentFrom;
    if (sentTo != null) p.sentTo = sentTo;
    return p;
  }, [sentFrom, sentTo]);

  const afterVn = useMemo(
    () => formatDisplaySlashParam(afterParam),
    [afterParam],
  );
  const beforeVn = useMemo(
    () => formatDisplaySlashParam(beforeParam),
    [beforeParam],
  );

  const gmailRangeLine = useMemo(() => {
    const hasTo = afterVn != null;
    const hasFrom = beforeVn != null;
    if (!hasTo && !hasFrom) return null;
    if (hasFrom && !hasTo) return `đến ${beforeVn}`;
    if (hasTo && !hasFrom) return `từ ${afterVn}`;
    return `${afterVn} - ${beforeVn} `;
  }, [afterVn, beforeVn]);

  const { data: inqNew, isLoading: inqNewLoading } = useQuery({
    queryKey: [...iframeListBaseKey, "inquiry", "new", listParams],
    queryFn: () =>
      inquiriesService.getList({
        ...listParams,
        messageStatuses: ["new"],
      }),
  });

  const { data: inqStaged, isLoading: inqStagedLoading } = useQuery({
    queryKey: [...iframeListBaseKey, "inquiry", "staged", listParams],
    queryFn: () =>
      inquiriesService.getList({
        ...listParams,
        messageStatuses: ["staged"],
      }),
  });

  const { data: regNew, isLoading: regNewLoading } = useQuery({
    queryKey: [...iframeListBaseKey, "classReg", "new", listParams],
    queryFn: () =>
      classRegistrationsService.getList({
        ...listParams,
        messageStatuses: ["new"],
      }),
  });

  const { data: regStaged, isLoading: regStagedLoading } = useQuery({
    queryKey: [...iframeListBaseKey, "classReg", "staged", listParams],
    queryFn: () =>
      classRegistrationsService.getList({
        ...listParams,
        messageStatuses: ["staged"],
      }),
  });

  const { data: conflictMessages = [], isLoading: conflictMessagesLoading } =
    useQuery({
      queryKey: [...iframeListBaseKey, "messages", "conflict"],
      queryFn: () =>
        messagesService.getMessages({
          hasConflict: true,
          page: 1,
          limit: 20,
          orderCol: "sentAt",
          orderDir: "DESC",
        }),
      select: (res) => res.items,
    });

  const { data: overview = [] } = useQuery({
    queryKey: [
      ...iframeListBaseKey,
      "overview",
      sentFrom ?? "",
      sentTo ?? "",
      IFRAME_CLASS_REG_MESSAGE_STATUSES,
    ],
    queryFn: () =>
      classRegistrationItemsService.overview(
        CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
        {
          messageStatuses: [...IFRAME_CLASS_REG_MESSAGE_STATUSES],
          ...(sentFrom != null ? { sentFrom } : {}),
          ...(sentTo != null ? { sentTo } : {}),
        },
      ),
    select: (rows) =>
      rows.map((g) => ({
        ...g,
        classes: [...g.classes].sort((a, b) =>
          (a.className ?? "").localeCompare(b.className ?? "", "vi"),
        ),
      })),
  });

  const overviewTableSections = useMemo(() => {
    type ClassRow = {
      key: string;
      copyClassText: string;
      register: number;
      cancel: number;
      requestOpen: number;
      pending: number;
    };
    type Section = {
      sectionKey: string;
      subjectCode: string;
      subjectName: string;
      rows: ClassRow[];
    };
    return overview.map((grp, gIdx): Section => {
      const code = grp.subjectCode?.trim() ?? "";
      const name = grp.subjectName?.trim() ?? "";
      const rows: ClassRow[] = grp.classes.map((c, idx) => {
        const register = c.byAction?.register ?? 0;
        const cancel = c.byAction?.cancel ?? 0;
        const rawClass = c.className?.trim() ?? "";
        return {
          key: `${gIdx}-${idx}`,
          copyClassText: rawClass,
          register,
          cancel,
          requestOpen: c.byAction?.requestOpen ?? 0,
          pending: c.byStatus?.pending ?? 0,
        };
      });
      return {
        sectionKey: `${gIdx}|${name}|${code}`,
        subjectCode: code,
        subjectName: name,
        rows,
      };
    });
  }, [overview]);

  const overviewHasClassRows = useMemo(
    () => overviewTableSections.some((s) => s.rows.length > 0),
    [overviewTableSections],
  );

  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [itemsPage, setItemsPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [replyPickerOpen, setReplyPickerOpen] = useState(false);
  const [replyEntities, setReplyEntities] = useState<ReplyPluckEntityValue[]>([
    ReplyPluckEntity.Inquiry,
    ReplyPluckEntity.ClassRegistration,
  ]);
  const [bulkSelectedStatus, setBulkSelectedStatus] =
    useState<ItemStatus | null>(null);
  const [itemListFilters, setItemListFiltersState] = useState<ItemListFilters>(
    readItemListFiltersCookie,
  );

  const toggleItemActionFilter = useCallback((a: RegistrationAction) => {
    setItemListFiltersState((prev) => {
      const actions = prev.actions.includes(a)
        ? prev.actions.filter((x) => x !== a)
        : [...prev.actions, a];
      const next = { ...prev, actions };
      writeItemListFiltersCookie(next);
      return next;
    });
    setItemsPage(1);
  }, []);

  const toggleItemStatusFilter = useCallback((s: ItemStatus) => {
    setItemListFiltersState((prev) => {
      const statuses = prev.statuses.includes(s)
        ? prev.statuses.filter((x) => x !== s)
        : [...prev.statuses, s];
      const next = { ...prev, statuses };
      writeItemListFiltersCookie(next);
      return next;
    });
    setItemsPage(1);
  }, []);

  const clearItemActionFilters = useCallback(() => {
    setItemListFiltersState((prev) => {
      const next = { ...prev, actions: [] };
      writeItemListFiltersCookie(next);
      return next;
    });
    setItemsPage(1);
  }, []);

  const clearItemStatusFilters = useCallback(() => {
    setItemListFiltersState((prev) => {
      const next = { ...prev, statuses: [] };
      writeItemListFiltersCookie(next);
      return next;
    });
    setItemsPage(1);
  }, []);

  const actionFilterActive = itemListFilters.actions.length > 0;
  const statusFilterActive = itemListFilters.statuses.length > 0;
  const inquiryNewTotal = inqNew?.pagination.total ?? 0;
  const inquiryStagedTotal = inqStaged?.pagination.total ?? 0;
  const classRegistrationNewTotal = regNew?.pagination.total ?? 0;
  const classRegistrationStagedTotal = regStaged?.pagination.total ?? 0;
  const showNothingState =
    !inqNewLoading &&
    !inqStagedLoading &&
    !regNewLoading &&
    !regStagedLoading &&
    !conflictMessagesLoading &&
    inquiryNewTotal === 0 &&
    inquiryStagedTotal === 0 &&
    classRegistrationNewTotal === 0 &&
    classRegistrationStagedTotal === 0 &&
    conflictMessages.length === 0;
  const replyEntityDisabled = useMemo<Record<ReplyPluckEntityValue, boolean>>(
    () => ({
      [ReplyPluckEntity.Inquiry]: inquiryStagedTotal <= 0,
      [ReplyPluckEntity.ClassRegistration]: classRegistrationStagedTotal <= 0,
    }),
    [inquiryStagedTotal, classRegistrationStagedTotal],
  );
  const showReplyNowButton =
    inquiryStagedTotal > 0 || classRegistrationStagedTotal > 0;
  const availableReplyEntities = useMemo(
    () =>
      REPLY_PLUCK_ENTITY_OPTIONS.filter(
        (opt) => !replyEntityDisabled[opt.value],
      ).map((opt) => opt.value),
    [replyEntityDisabled],
  );
  const selectedReplyEntities = useMemo(
    () => replyEntities.filter((v) => availableReplyEntities.includes(v)),
    [replyEntities, availableReplyEntities],
  );

  const { data: itemsPageData, isLoading: itemsLoading } = useQuery({
    queryKey: [
      ...iframeListBaseKey,
      "items",
      openSubject,
      sentFrom,
      sentTo,
      IFRAME_CLASS_REG_MESSAGE_STATUSES,
      itemsPage,
      itemListFilters.actions,
      itemListFilters.statuses,
    ],
    enabled: !!openSubject,
    queryFn: () =>
      classRegistrationItemsService.findAll(
        CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
        {
          subjectName: openSubject ?? undefined,
          messageStatuses: [...IFRAME_CLASS_REG_MESSAGE_STATUSES],
          ...(sentFrom != null ? { sentFrom } : {}),
          ...(sentTo != null ? { sentTo } : {}),
          ...(itemListFilters.actions.length > 0
            ? { actions: itemListFilters.actions }
            : {}),
          ...(itemListFilters.statuses.length > 0
            ? { statuses: itemListFilters.statuses }
            : {}),
          page: itemsPage,
          limit: 20,
          orderCol: "createdAt",
          orderDir: "DESC",
        },
      ),
  });

  const invalidateLists = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...iframeListBaseKey] });
  }, [queryClient]);

  const bulkMutation = useMutation({
    mutationFn: (status: ItemStatus) =>
      classRegistrationItemsService.bulkUpdateStatus(
        CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
        { ids: selectedIds, status },
      ),
    onSuccess: (res) => {
      toast.success(`Đã cập nhật ${res.updated}/${res.requested} dòng.`);
      setSelectedIds([]);
      invalidateLists();
    },
    onError: () => toast.error("Cập nhật hàng loạt thất bại."),
  });

  const replyPluckMutation = useMutation({
    mutationFn: () =>
      messagesService.replyPluck({
        ...(sentFrom != null ? { sentFrom } : {}),
        ...(sentTo != null ? { sentTo } : {}),
        entities: selectedReplyEntities,
      }),
    onSuccess: (res) => {
      toast.success(
        `Đã phản hồi ${res.success}/${res.total} hồ sơ (${res.failed} lỗi).`,
      );
      setReplyPickerOpen(false);
      invalidateLists();
    },
    onError: () => toast.error("Phản hồi tự động thất bại."),
  });

  const rowStatusMutation = useMutation({
    mutationFn: (p: { parentId: number; itemId: number; status: ItemStatus }) =>
      classRegistrationItemsService.update(p.parentId, p.itemId, {
        status: p.status,
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái.");
      invalidateLists();
    },
    onError: () => toast.error("Cập nhật thất bại."),
  });

  const toggleSelected = (id: number, on: boolean) => {
    setSelectedIds((prev) => {
      if (on) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const pageIds = (itemsPageData?.items ?? []).map((i) => i.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleAllOnPage = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const openDetail = (subjectName: string) => {
    setOpenSubject(subjectName);
    setItemsPage(1);
    setSelectedIds([]);
    setBulkSelectedStatus(null);
  };

  const toggleReplyEntity = useCallback(
    (value: ReplyPluckEntityValue) => {
      if (replyEntityDisabled[value]) return;
      setReplyEntities((prev) =>
        prev.includes(value)
          ? prev.filter((x) => x !== value)
          : [...prev, value],
      );
    },
    [replyEntityDisabled],
  );

  const openConflictMessage = useCallback((msg: Message) => {
    if (!msg.threadId) return;
    const parentOrigin = (() => {
      try {
        return new URL(document.referrer).origin || "https://mail.google.com";
      } catch {
        return "https://mail.google.com";
      }
    })();
    // Điều hướng qua bridge của extension để Gmail parent đổi thread.
    window.parent.postMessage(
      {
        type: "vaa-extension-navigate",
        threadId: msg.threadId,
      },
      parentOrigin,
    );
  }, []);

  const getItemStudentCode = (row: ClassRegistrationItem): string => {
    const parentMessageStudentCode = (
      row as ClassRegistrationItem & {
        parent?: { message?: { studentCode?: string | null } | null } | null;
      }
    ).parent?.message?.studentCode;
    return parentMessageStudentCode?.trim() || row.studentCode?.trim() || "—";
  };

  const openSubjectMeta = useMemo(() => {
    if (!openSubject) return { subjectCode: "", subjectName: "" };
    const sec = overviewTableSections.find(
      (s) => s.subjectName === openSubject,
    );
    if (!sec) return { subjectCode: "", subjectName: openSubject };
    return {
      subjectCode: sec.subjectCode ?? "",
      subjectName: sec.subjectName ?? openSubject,
    };
  }, [openSubject, overviewTableSections]);

  if (showNothingState) {
    return (
      <GmailAccessBlocked
        title="Danh sách trống"
        message="Không còn tin nhắn mới hay hồ sơ nào cần xử lý"
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-2">
      <DeeplinkSectionShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] table-fixed text-center text-sm">
            <colgroup>
              <col style={{ width: "52%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "24%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="px-2 py-2 font-normal text-gray-500 dark:text-gray-400" />
                <th className="px-2 py-2 align-middle">
                  <div className="flex justify-center">
                    <Tag
                      color={MessageStatusColors.new.hex}
                      interactive={false}
                      className="w-fit shrink-0"
                    >
                      {MessageStatusLabels.new}
                    </Tag>
                  </div>
                </th>
                <th className="px-2 py-2 align-middle">
                  <div className="flex justify-center">
                    <Tag
                      color={MessageStatusColors.staged.hex}
                      interactive={false}
                      className="w-fit shrink-0"
                    >
                      {MessageStatusLabels.staged}
                    </Tag>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="text-navy-900 px-2 py-3 text-left font-semibold dark:text-white">
                  Thắc mắc
                </td>
                <td className="text-navy-900 px-2 py-3 font-normal tabular-nums dark:text-white">
                  {inqNew?.pagination.total ?? "—"}
                </td>
                <td className="text-navy-900 px-2 py-3 font-normal tabular-nums dark:text-white">
                  {inqStaged?.pagination.total ?? "—"}
                </td>
              </tr>
              <tr>
                <td className="text-navy-900 px-2 py-3 text-left font-semibold dark:text-white">
                  Đăng ký lớp
                </td>
                <td className="text-navy-900 px-2 py-3 font-normal tabular-nums dark:text-white">
                  {regNew?.pagination.total ?? "—"}
                </td>
                <td className="text-navy-900 px-2 py-3 font-normal tabular-nums dark:text-white">
                  {regStaged?.pagination.total ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {showReplyNowButton ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setReplyPickerOpen((prev) => !prev)}
              disabled={replyPluckMutation.isPending}
              className="bg-brand-500 hover:bg-brand-600 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Phản hồi ngay
            </button>

            {replyPickerOpen ? (
              <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-navy-900 text-xs font-semibold dark:text-white">
                  Chọn hồ sơ cần gửi phản hồi
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {REPLY_PLUCK_ENTITY_OPTIONS.map((opt) => {
                    const disabled = replyEntityDisabled[opt.value];
                    const checked =
                      !disabled && selectedReplyEntities.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className={`inline-flex items-center gap-2 text-xs ${
                          disabled
                            ? "cursor-not-allowed text-gray-400 dark:text-gray-500"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleReplyEntity(opt.value)}
                          className="text-brand-600 h-3.5 w-3.5 rounded border-gray-300"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyPickerOpen(false)}
                    disabled={replyPluckMutation.isPending}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => replyPluckMutation.mutate()}
                    disabled={
                      selectedReplyEntities.length === 0 ||
                      replyPluckMutation.isPending
                    }
                    className="bg-brand-500 hover:bg-brand-600 inline-flex flex-1 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {replyPluckMutation.isPending
                      ? "Đang gửi..."
                      : "Gửi phản hồi"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </DeeplinkSectionShell>

      {openSubject || overviewHasClassRows ? (
        <DeeplinkSectionShell title="DS đăng kí lớp tiếp nhận">
          {openSubject ? (
            <>
              <div className="mt-4 border-b border-gray-100 pb-3 dark:border-white/10">
                <div className="relative flex min-h-7 items-center justify-center pr-8">
                  <div className="text-brand-600 dark:text-brand-400 flex min-w-0 items-center justify-center gap-1 text-center text-sm font-semibold normal-case">
                    {openSubjectMeta.subjectCode ? (
                      <>
                        <CopyableText
                          text={openSubjectMeta.subjectCode}
                          variant="field"
                          className="text-brand-700 dark:text-brand-300"
                          tooltip="Sao chép mã môn"
                        />
                        <span className="text-brand-700 dark:text-brand-300 shrink-0">
                          -
                        </span>
                      </>
                    ) : null}
                    <CopyableText
                      text={openSubjectMeta.subjectName}
                      variant="field"
                      className="text-brand-700 dark:text-brand-300 min-w-0"
                      tooltip="Sao chép tên môn"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubject(null);
                      setSelectedIds([]);
                      setBulkSelectedStatus(null);
                    }}
                    aria-label="Quay về danh sách đã duyệt"
                    className="text-navy-700 absolute top-1/2 right-0 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-xl leading-none font-semibold transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[380px] table-fixed border-collapse text-left text-xs">
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "25%" }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-400">
                      <th className="py-2 pr-1 align-middle">
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleAllOnPage}
                          aria-label="Chọn tất cả trang"
                          className="text-brand-600 h-3.5 w-3.5 rounded border-gray-300"
                        />
                      </th>
                      <th className="py-2 pr-1 align-middle font-medium">#</th>
                      <th className="py-2 pr-2 align-middle font-medium">
                        MSSV
                      </th>
                      <th className="py-2 pr-2 align-middle font-medium">
                        Lớp
                      </th>
                      <th className="py-2 pr-1 align-middle font-medium">
                        <div className="flex min-w-0 items-center justify-between gap-1">
                          <span className="min-w-0 truncate">Thao tác</span>
                          <ItemFilterDropdown
                            active={actionFilterActive}
                            ariaLabel="Lọc theo thao tác"
                            panelTitle="Lọc theo thao tác"
                            options={REGISTRATION_ACTIONS.map((a) => ({
                              value: a,
                              label: RegistrationActionLabels[a],
                              color: RegistrationActionColors[a].hex,
                            }))}
                            selected={itemListFilters.actions}
                            onToggle={(v) =>
                              toggleItemActionFilter(v as RegistrationAction)
                            }
                            onClear={clearItemActionFilters}
                            clearLinkLabel="Bỏ lọc thao tác"
                          />
                        </div>
                      </th>
                      <th className="py-2 pl-1 align-middle font-medium">
                        <div className="flex min-w-0 items-center justify-between gap-1">
                          <span className="min-w-0 truncate">Trạng thái</span>
                          <ItemFilterDropdown
                            active={statusFilterActive}
                            ariaLabel="Lọc theo trạng thái"
                            panelTitle="Lọc theo trạng thái"
                            options={ITEM_STATUSES.map((s) => ({
                              value: s,
                              label: ItemStatusLabels[s],
                              color: ITEM_STATUS_HEX[s],
                            }))}
                            selected={itemListFilters.statuses}
                            onToggle={(v) =>
                              toggleItemStatusFilter(v as ItemStatus)
                            }
                            onClear={clearItemStatusFilters}
                            clearLinkLabel="Bỏ lọc trạng thái"
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedIds.length > 0 ? (
                      <tr className="border-b border-gray-100 dark:border-white/10">
                        <td colSpan={6} className="py-3 pr-2">
                          <div className="flex w-full flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Tổng{" "}
                              <span className="font-bold">
                                {selectedIds.length} yêu cầu
                              </span>{" "}
                              đã chọn chuyển sang trạng thái
                            </span>
                            <Tag
                              variant="selection"
                              value={bulkSelectedStatus ?? "pending"}
                              color={
                                bulkSelectedStatus
                                  ? ITEM_STATUS_HEX[bulkSelectedStatus]
                                  : "#9ca3af"
                              }
                              options={itemStatusOptions}
                              optionColors={ITEM_STATUS_HEX}
                              disabled={bulkMutation.isPending}
                              className="ml-auto px-3! py-1! text-xs font-medium text-white"
                              onChange={(v) => {
                                const next = v as ItemStatus;
                                setBulkSelectedStatus(next);
                                bulkMutation.mutate(next, {
                                  onSuccess: () => {
                                    setBulkSelectedStatus(null);
                                  },
                                });
                              }}
                            >
                              Chọn trạng thái
                            </Tag>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    {itemsLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-center text-gray-500 dark:text-gray-400"
                        >
                          Đang tải…
                        </td>
                      </tr>
                    ) : (itemsPageData?.items ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-navy-800 py-8 text-center dark:text-gray-300"
                        >
                          Không có dữ liệu.
                        </td>
                      </tr>
                    ) : (
                      (itemsPageData?.items ?? []).map(
                        (row: ClassRegistrationItem) => {
                          const statusBusy =
                            rowStatusMutation.isPending &&
                            rowStatusMutation.variables?.itemId === row.id;
                          return (
                            <tr
                              key={row.id}
                              className={`border-b border-gray-100 dark:border-white/10 ${
                                selectedIds.includes(row.id)
                                  ? "bg-brand-50 dark:bg-brand-500/10"
                                  : ""
                              }`}
                            >
                              <td className="py-2 pr-1 align-middle">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(row.id)}
                                  onChange={(e) =>
                                    toggleSelected(row.id, e.target.checked)
                                  }
                                  className="text-brand-600 h-3.5 w-3.5 rounded border-gray-300"
                                />
                              </td>
                              <td className="truncate py-2 pr-1 align-middle text-gray-500 tabular-nums dark:text-gray-400">
                                {row.parentId ?? "—"}
                              </td>
                              <td className="text-navy-800 min-w-0 py-2 pr-2 align-middle dark:text-gray-100">
                                <CopyableText
                                  text={getItemStudentCode(row)}
                                  emptyLabel="—"
                                  variant="plain"
                                  className="truncate text-xs"
                                  tooltip="Sao chép MSSV"
                                />
                              </td>
                              <td className="text-navy-800 min-w-0 py-2 pr-2 align-middle dark:text-gray-100">
                                <CopyableText
                                  text={row.className?.trim() || ""}
                                  emptyLabel="—"
                                  variant="plain"
                                  className="truncate text-xs"
                                  tooltip="Sao chép tên lớp"
                                />
                              </td>
                              <td className="min-w-0 py-2 pr-1 align-middle">
                                <div className="min-w-0 truncate">
                                  <RegistrationActionTag value={row.action} />
                                </div>
                              </td>
                              <td className="min-w-0 py-2 pl-1 align-middle">
                                <Tag
                                  variant="selection"
                                  value={row.status}
                                  color={ITEM_STATUS_HEX[row.status]}
                                  options={itemStatusOptions}
                                  optionColors={ITEM_STATUS_HEX}
                                  disabled={statusBusy}
                                  className="max-w-full shrink-0 truncate"
                                  onChange={(v) => {
                                    const next = v as ItemStatus;
                                    if (next === row.status) return;
                                    const pid = row.parentId;
                                    if (pid == null) {
                                      toast.error(
                                        "Thiếu parentId — không cập nhật được.",
                                      );
                                      return;
                                    }
                                    rowStatusMutation.mutate({
                                      parentId: pid,
                                      itemId: row.id,
                                      status: next,
                                    });
                                  }}
                                >
                                  {ItemStatusLabels[row.status]}
                                </Tag>
                              </td>
                            </tr>
                          );
                        },
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {itemsPageData && itemsPageData.pagination.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={itemsPage <= 1}
                    onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                    className={`${pillRowBtnSecondary} max-w-[100px]`}
                  >
                    Trước
                  </button>
                  <span className="text-center text-xs text-gray-600 dark:text-gray-400">
                    Trang {itemsPage} / {itemsPageData.pagination.totalPages} (
                    {itemsPageData.pagination.total} dòng)
                  </span>
                  <button
                    type="button"
                    disabled={itemsPage >= itemsPageData.pagination.totalPages}
                    onClick={() =>
                      setItemsPage((p) =>
                        Math.min(itemsPageData.pagination.totalPages, p + 1),
                      )
                    }
                    className={`${pillRowBtnSecondary} max-w-[100px]`}
                  >
                    Sau
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[380px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <th className="text-navy-800 px-3 py-2.5 text-left font-medium dark:text-gray-300"></th>
                    <th className="px-0.5 py-2.5 text-center align-middle">
                      <div className="flex justify-center">
                        <Tag
                          color={RegistrationActionColors.register.hex}
                          interactive={false}
                          className="text-xs font-medium"
                        >
                          Đăng ký
                        </Tag>
                      </div>
                    </th>
                    <th className="px-0.5 py-2.5 text-center align-middle">
                      <div className="flex justify-center">
                        <Tag
                          color={RegistrationActionColors.cancel.hex}
                          interactive={false}
                          className="text-xs font-medium"
                        >
                          Hủy
                        </Tag>
                      </div>
                    </th>
                    <th className="px-0.5 py-2.5 text-center align-middle">
                      <div className="flex justify-center">
                        <Tag
                          color={RegistrationActionColors.requestOpen.hex}
                          interactive={false}
                          className="text-xs font-medium"
                        >
                          Mở lớp
                        </Tag>
                      </div>
                    </th>
                    <th className="px-0.5 py-2.5 text-center align-middle">
                      <div className="flex justify-center">
                        <Tag
                          color={ItemStatusColors.pending.hex}
                          interactive={false}
                          className="text-xs font-medium"
                        >
                          Chờ xử lý
                        </Tag>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overviewTableSections.map((sec) => (
                    <Fragment key={sec.sectionKey}>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <td
                          colSpan={5}
                          className={`text-navy-900 px-3 py-2.5 text-center align-middle text-sm transition-colors dark:text-white ${
                            sec.subjectName
                              ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                              : ""
                          }`}
                          onClick={() => {
                            if (sec.subjectName) openDetail(sec.subjectName);
                          }}
                          onKeyDown={(e) => {
                            if (
                              !sec.subjectName ||
                              (e.key !== "Enter" && e.key !== " ")
                            ) {
                              return;
                            }
                            e.preventDefault();
                            openDetail(sec.subjectName);
                          }}
                          {...(sec.subjectName
                            ? { role: "button", tabIndex: 0 }
                            : {})}
                        >
                          <Tooltip label="Xem yêu cầu" className="block w-full">
                            <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-1">
                              {sec.subjectCode ? (
                                <>
                                  <CopyableText
                                    text={sec.subjectCode}
                                    variant="field"
                                    tooltip="Sao chép mã môn"
                                    stopPropagation
                                  />
                                  <span className="shrink-0 text-gray-400 dark:text-gray-500">
                                    {" "}
                                    -{" "}
                                  </span>
                                  <CopyableText
                                    text={sec.subjectName}
                                    variant="field"
                                    className="min-w-0"
                                    tooltip="Sao chép tên môn"
                                    stopPropagation
                                  />
                                </>
                              ) : sec.subjectName ? (
                                <CopyableText
                                  text={sec.subjectName}
                                  variant="field"
                                  className="min-w-0"
                                  tooltip="Sao chép tên môn"
                                  stopPropagation
                                />
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">
                                  (Chưa rõ môn)
                                </span>
                              )}
                            </div>
                          </Tooltip>
                        </td>
                      </tr>
                      {sec.rows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-gray-100 last:border-b-0 dark:border-white/10"
                        >
                          <td className="text-navy-900 max-w-[min(120px,45vw)] px-3 py-2 align-middle dark:text-gray-100">
                            <CopyableText
                              text={row.copyClassText}
                              emptyLabel="—"
                              variant="plain"
                              className="text-xs"
                              tooltip="Sao chép tên lớp"
                            />
                          </td>
                          <td className="text-navy-800 px-0.5 py-2 text-center tabular-nums dark:text-gray-200">
                            {row.register}
                          </td>
                          <td className="text-navy-800 px-0.5 py-2 text-center tabular-nums dark:text-gray-200">
                            {row.cancel}
                          </td>
                          <td className="text-navy-800 px-0.5 py-2 text-center tabular-nums dark:text-gray-200">
                            {row.requestOpen}
                          </td>
                          <td className="text-navy-800 px-0.5 py-2 text-center tabular-nums dark:text-gray-200">
                            {row.pending}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DeeplinkSectionShell>
      ) : null}

      {!conflictMessagesLoading && conflictMessages.length > 0 ? (
        <DeeplinkSectionShell title="DS tin nhắn cần cập nhật">
          <p className="mt-2 mb-3 text-center text-xs leading-snug font-medium text-red-500 italic dark:text-rose-200/90">
            Có tin nhắn mới sau khi hồ sơ đã tiếp nhận.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {conflictMessages.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => openConflictMessage(msg)}
                disabled={!msg.threadId}
                className="w-full rounded-2xl bg-gray-100 px-3 py-2 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <p className="text-navy-900 truncate text-sm font-medium dark:text-white">
                  {msg.subject?.trim() || "(Không có tiêu đề)"}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  Từ: {msg.senderName?.trim() || "(Không rõ người gửi)"}
                </p>
              </button>
            ))}
          </div>
        </DeeplinkSectionShell>
      ) : null}

      {gmailRangeLine != null ? (
        <p className="mt-auto pt-2 text-center text-sm text-gray-600 tabular-nums dark:text-gray-400">
          ({gmailRangeLine})
        </p>
      ) : null}
    </div>
  );
};

export default DeeplinkIframeNoThreadDashboard;
