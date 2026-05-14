import { CopyableText } from "@/components/copyable/CopyableText";
import Tooltip from "@/components/tooltip/Tooltip";
import { useDynamicData } from "@/hooks/useDynamicData";
import {
  CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
  classRegistrationItemsService,
} from "@/services/class-registration";
import type {
  ClassRegistrationItem,
  OverviewSubjectGroup,
} from "@/types/classRegistration";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { SiGmail } from "react-icons/si";
import type { TimeRangeType } from "../utils/dateRange";
import { getDateRange } from "../utils/dateRange";

function getItemStudentCode(row: ClassRegistrationItem): string {
  const parentMessageStudentCode = (
    row as ClassRegistrationItem & {
      parent?: { message?: { studentCode?: string | null } | null } | null;
    }
  ).parent?.message?.studentCode;
  return parentMessageStudentCode?.trim() || row.studentCode?.trim() || "—";
}

function getItemGmailMessageId(row: ClassRegistrationItem): string | null {
  const id = (
    row as ClassRegistrationItem & {
      parent?: {
        message?: { gmailMessageId?: string | null } | null;
      } | null;
    }
  ).parent?.message?.gmailMessageId?.trim();
  return id || null;
}

function buildGmailMessageOpenUrl(
  superEmail: string | undefined,
  gmailMessageId: string,
): string {
  const auth = superEmail?.trim();
  const base = auth
    ? `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(auth)}`
    : "https://mail.google.com/mail/u/0";
  return `${base}#all/${gmailMessageId}`;
}

interface AcceptedOpenClassesCardProps {
  timeRange: TimeRangeType;
}

/** Giống `IFRAME_CLASS_REG_MESSAGE_STATUSES` trong DeeplinkIframeNoThreadDashboard. */
const MESSAGE_STATUSES_IFRAME = ["staged"] as const;

const SUPER_EMAIL_SETTING_KEY = ["email.superEmail"] as const;

const AcceptedOpenClassesCard: React.FC<AcceptedOpenClassesCardProps> = ({
  timeRange,
}) => {
  const { data: dynamicData } = useDynamicData(SUPER_EMAIL_SETTING_KEY);
  const superEmail = dynamicData?.settings?.["email.superEmail"]?.email;

  const { from, to } = useMemo(() => getDateRange(timeRange), [timeRange]);
  const sentFrom = from.toISOString();
  const sentTo = to.toISOString();

  const [selected, setSelected] = useState<{
    subjectName: string;
  } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSelected(null);
    setPage(1);
  }, [timeRange, sentFrom, sentTo]);

  const overviewParams = useMemo(
    () => ({
      messageStatuses: [...MESSAGE_STATUSES_IFRAME],
      sentFrom,
      sentTo,
    }),
    [sentFrom, sentTo],
  );

  const { data: overview = [], isLoading: overviewLoading } = useQuery({
    queryKey: ["class-reg-stats", "accepted-open-overview", overviewParams],
    queryFn: () =>
      classRegistrationItemsService.overview(
        CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
        overviewParams,
      ),
  });

  const sections = useMemo(() => {
    return overview
      .map((grp: OverviewSubjectGroup, gIdx: number) => {
        const requestOpenTotal = grp.classes.reduce(
          (sum, c) => sum + (c.byAction?.requestOpen ?? 0),
          0,
        );
        return {
          sectionKey: `${gIdx}|${grp.subjectName}`,
          subjectCode: grp.subjectCode?.trim() ?? "",
          subjectName: grp.subjectName,
          requestOpenTotal,
        };
      })
      .filter((s) => s.requestOpenTotal > 0)
      .sort((a, b) =>
        a.subjectName.localeCompare(b.subjectName, "vi", {
          sensitivity: "base",
        }),
      );
  }, [overview]);

  const { data: itemsPage, isLoading: itemsLoading } = useQuery({
    queryKey: [
      "class-reg-stats",
      "accepted-open-items",
      selected,
      page,
      overviewParams,
    ],
    enabled: !!selected,
    queryFn: () =>
      classRegistrationItemsService.findAll(
        CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID,
        {
          subjectName: selected!.subjectName,
          actions: ["requestOpen"],
          messageStatuses: [...MESSAGE_STATUSES_IFRAME],
          sentFrom,
          sentTo,
          page,
          limit: 20,
          orderCol: "createdAt",
          orderDir: "DESC",
        },
      ),
  });

  return (
    <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
      <h3 className="text-navy-700 mb-1 text-lg font-bold dark:text-white">
        DS yêu cầu mở lớp
      </h3>

      <div className="flex min-h-[200px] flex-col lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1 overflow-x-auto pb-1 lg:pr-6 lg:pb-0">
          {overviewLoading ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Đang tải…
            </p>
          ) : sections.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Không có dữ liệu.
            </p>
          ) : (
            <ul className="mt-5 flex min-w-[280px] flex-col gap-2.5">
              {sections.map((sec) => {
                const isSel = selected?.subjectName === sec.subjectName;
                return (
                  <li
                    key={sec.sectionKey}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelected({ subjectName: sec.subjectName });
                      setPage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected({ subjectName: sec.subjectName });
                        setPage(1);
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isSel
                        ? "bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/15"
                        : "border-gray-100 bg-white hover:bg-gray-50/90 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/10"
                    } cursor-pointer`}
                  >
                    <div className="text-navy-900 flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1 dark:text-white">
                      {sec.subjectCode ? (
                        <>
                          <CopyableText
                            text={sec.subjectCode}
                            variant="field"
                            tooltip="Sao chép mã môn"
                          />
                          <span className="shrink-0 text-gray-400 dark:text-gray-500">
                            -
                          </span>
                          <CopyableText
                            text={sec.subjectName}
                            variant="field"
                            className="min-w-0"
                            tooltip="Sao chép tên môn"
                          />
                        </>
                      ) : (
                        <CopyableText
                          text={sec.subjectName}
                          variant="field"
                          className="min-w-0"
                          tooltip="Sao chép tên môn"
                        />
                      )}
                    </div>
                    <Tooltip label="Mở lớp (tổng các lớp)" className="shrink-0">
                      <span className="text-navy-800 font-semibold whitespace-nowrap tabular-nums dark:text-gray-200">
                        {sec.requestOpenTotal}
                      </span>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col border-t border-gray-200 pt-4 max-lg:mt-1 lg:max-w-sm lg:border-t-0 lg:border-l lg:border-gray-200 lg:pt-0 lg:pl-6 dark:border-white/10">
          {!selected ? (
            <p className="m-auto text-center text-xs text-gray-500 dark:text-gray-400">
              Chọn một môn bên trái để xem danh sách MSSV.
            </p>
          ) : (
            <>
              {itemsLoading ? (
                <p className="text-center text-xs text-gray-500">Đang tải…</p>
              ) : (
                <ul className="max-h-[320px] space-y-1 overflow-y-auto text-sm">
                  {(itemsPage?.items ?? []).map((it) => {
                    const gmailMessageId = getItemGmailMessageId(it);
                    const gmailUrl =
                      gmailMessageId != null
                        ? buildGmailMessageOpenUrl(superEmail, gmailMessageId)
                        : null;
                    return (
                      <li
                        key={it.id}
                        className="text-navy-800 flex items-center justify-between gap-2 dark:text-gray-100"
                      >
                        <CopyableText
                          text={getItemStudentCode(it)}
                          emptyLabel="—"
                          variant="plain"
                          tooltip="Sao chép MSSV"
                          className="min-w-0 shrink"
                        />
                        {gmailUrl ? (
                          <a
                            href={gmailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 inline-flex shrink-0 items-center gap-1 rounded-md p-0.5 transition-colors"
                            aria-label="Mở tin nhắn Gmail xem yêu cầu"
                            title="Mở Gmail"
                          >
                            <SiGmail className="h-3.5 w-3.5" aria-hidden />
                            <span className="font-sans text-[10px] font-medium">
                              Gmail
                            </span>
                          </a>
                        ) : (
                          <span className="shrink-0 font-sans text-[10px] text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {itemsPage && itemsPage.pagination.totalPages > 1 ? (
                <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full border border-gray-300 px-2 py-1 disabled:opacity-50 dark:border-white/20"
                  >
                    Trước
                  </button>
                  <span className="text-gray-500 tabular-nums">
                    {page}/{itemsPage.pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= itemsPage.pagination.totalPages}
                    onClick={() =>
                      setPage((p) =>
                        Math.min(itemsPage.pagination.totalPages, p + 1),
                      )
                    }
                    className="rounded-full border border-gray-300 px-2 py-1 disabled:opacity-50 dark:border-white/20"
                  >
                    Sau
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptedOpenClassesCard;
