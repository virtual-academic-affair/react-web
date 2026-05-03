import { CopyableText } from "@/components/copyable/CopyableText";
import Tag from "@/components/tag/Tag";
import {
  CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
  classRegistrationItemsService,
  classRegistrationsService,
} from "@/services/class-registration";
import { inquiriesService } from "@/services/inquiry";
import type {
  ClassRegistrationItem,
  ItemStatus,
} from "@/types/classRegistration";
import {
  ItemStatusColors,
  ItemStatusLabels,
  RegistrationActionColors,
} from "@/types/classRegistration";
import {
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/messageStatus";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import {
  Fragment,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { deeplinkBtnSecondary } from "./deeplinkButtonClasses";
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
    const hasTừ = afterVn != null;
    const hasĐến = beforeVn != null;
    if (!hasTừ && !hasĐến) return null;
    if (hasĐến && !hasTừ) return `đến ${beforeVn}`;
    if (hasTừ && !hasĐến) return `từ ${afterVn}`;
    return `${beforeVn} - ${afterVn}`;
  }, [afterVn, beforeVn]);

  const { data: inqNew } = useQuery({
    queryKey: [...iframeListBaseKey, "inquiry", "new", listParams],
    queryFn: () =>
      inquiriesService.getList({
        ...listParams,
        messageStatuses: ["new"],
      }),
  });

  const { data: inqStaged } = useQuery({
    queryKey: [...iframeListBaseKey, "inquiry", "staged", listParams],
    queryFn: () =>
      inquiriesService.getList({
        ...listParams,
        messageStatuses: ["staged"],
      }),
  });

  const { data: regNew } = useQuery({
    queryKey: [...iframeListBaseKey, "classReg", "new", listParams],
    queryFn: () =>
      classRegistrationsService.getList({
        ...listParams,
        messageStatuses: ["new"],
      }),
  });

  const { data: regStaged } = useQuery({
    queryKey: [...iframeListBaseKey, "classReg", "staged", listParams],
    queryFn: () =>
      classRegistrationsService.getList({
        ...listParams,
        messageStatuses: ["staged"],
      }),
  });

  const { data: overview = [], isLoading: overviewLoading } = useQuery({
    queryKey: [...iframeListBaseKey, "overview", sentFrom ?? "", sentTo ?? ""],
    queryFn: () =>
      classRegistrationItemsService.overview(
        CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
        {
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

  const { data: itemsPageData, isLoading: itemsLoading } = useQuery({
    queryKey: [
      ...iframeListBaseKey,
      "items",
      openSubject,
      sentFrom,
      sentTo,
      itemsPage,
    ],
    enabled: !!openSubject,
    queryFn: () =>
      classRegistrationItemsService.findAll(
        CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
        {
          subjectName: openSubject ?? undefined,
          ...(sentFrom != null ? { sentFrom } : {}),
          ...(sentTo != null ? { sentTo } : {}),
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
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-2">
      <DeeplinkSectionShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] table-fixed text-center text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="w-[40%] px-2 py-2 font-normal text-gray-500 dark:text-gray-400" />
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
      </DeeplinkSectionShell>

      <DeeplinkSectionShell title="DS đăng kí lớp đã duyệt">
        {overviewLoading ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Đang tải…
          </p>
        ) : overview.length === 0 || !overviewHasClassRows ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Không có dữ liệu.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-xs">
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
                        className={`text-navy-900 px-3 py-2.5 text-center align-middle text-sm dark:text-white ${
                          sec.subjectName ? "cursor-pointer" : ""
                        }`}
                        title={
                          sec.subjectName
                            ? "Bấm để mở chi tiết theo môn"
                            : undefined
                        }
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
                      </td>
                    </tr>
                    {sec.rows.map((row) => (
                      <tr
                        key={row.key}
                        className="border-b border-gray-100 last:border-b-0 dark:border-white/10"
                      >
                        <td className="text-navy-900 max-w-[min(220px,45vw)] px-3 py-2 align-middle dark:text-gray-100">
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

      {openSubject ? (
        <section className="dark:bg-navy-950/40 border-brand-500/25 rounded-2xl border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3 dark:border-white/10">
            <div className="border-brand-500 flex min-w-0 flex-1 items-center gap-2 border-l-4 pl-3">
              <h2 className="text-navy-900 min-w-0 text-base font-semibold tracking-tight uppercase dark:text-white">
                Chi tiết
              </h2>
              <span className="text-brand-600 dark:text-brand-400 truncate text-sm font-semibold normal-case">
                {openSubject}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpenSubject(null);
                setSelectedIds([]);
              }}
              className={`${pillRowBtnSecondary} max-w-[120px] shrink-0`}
            >
              Đóng
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Gán trạng thái hàng loạt ({selectedIds.length} đã chọn)
            </span>
            <div className="flex flex-wrap gap-2">
              {ITEM_STATUSES.map((s) => (
                <Tag
                  key={s}
                  color={ITEM_STATUS_HEX[s]}
                  interactive={
                    !bulkMutation.isPending && selectedIds.length > 0
                  }
                  className="!px-3 !py-1 text-xs font-medium"
                  onClick={() => {
                    if (selectedIds.length === 0) {
                      toast.warning("Chọn ít nhất một dòng.");
                      return;
                    }
                    bulkMutation.mutate(s);
                  }}
                >
                  {ItemStatusLabels[s]}
                </Tag>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-white/10 dark:text-gray-400">
                  <th className="w-10 py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAllOnPage}
                      aria-label="Chọn tất cả trang"
                      className="text-brand-600 h-3.5 w-3.5 rounded border-gray-300"
                    />
                  </th>
                  <th className="py-2 pr-2 font-medium">Lớp</th>
                  <th className="py-2 pr-2 font-medium">Thao tác</th>
                  <th className="py-2 pr-2 font-medium">Trạng thái</th>
                  <th className="py-2 font-medium">Phiếu #</th>
                </tr>
              </thead>
              <tbody>
                {itemsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Đang tải…
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
                          className="border-b border-gray-100 dark:border-white/10"
                        >
                          <td className="py-2 pr-2 align-middle">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(row.id)}
                              onChange={(e) =>
                                toggleSelected(row.id, e.target.checked)
                              }
                              className="text-brand-600 h-3.5 w-3.5 rounded border-gray-300"
                            />
                          </td>
                          <td className="text-navy-800 max-w-[120px] truncate py-2 pr-2 align-middle dark:text-gray-100">
                            {row.className?.trim() || "—"}
                          </td>
                          <td className="py-2 pr-2 align-middle">
                            <RegistrationActionTag value={row.action} />
                          </td>
                          <td className="py-2 pr-2 align-middle">
                            <Tag
                              variant="selection"
                              value={row.status}
                              color={ITEM_STATUS_HEX[row.status]}
                              options={itemStatusOptions}
                              optionColors={ITEM_STATUS_HEX}
                              disabled={statusBusy}
                              className="shrink-0"
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
                          <td className="py-2 align-middle text-gray-500 dark:text-gray-400">
                            {row.parentId ?? "—"}
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
        </section>
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
