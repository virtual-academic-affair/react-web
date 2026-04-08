import Tag from "@/components/tag/Tag";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import RegistrationDetailDrawer from "@/pages/class-registration/registrations/components/RegistrationDetailDrawer";
import { getLabelColor, getLabelVi } from "@/pages/emails/message/labelUtils";
import InquiryDetailDrawer from "@/pages/inquiry/inquiries/components/InquiryDetailDrawer";
import AssigneeManager from "@/pages/tasks/components/AssigneeManager";
import TaskDetailDrawer from "@/pages/tasks/list/components/TaskDetailDrawer";
import { classRegistrationsService } from "@/services/class-registration";
import { inquiriesService } from "@/services/inquiry";
import { dynamicDataService } from "@/services/shared";
import { tasksService } from "@/services/tasks";
import type { ClassRegistration } from "@/types/classRegistration";
import type { Message } from "@/types/email";
import {
  InquiryTypeColors,
  InquiryTypeLabels,
  type Inquiry,
  type InquiryType,
} from "@/types/inquiry";
import {
  MessageStatusColors,
  MessageStatusLabels,
  type MessageStatus,
} from "@/types/messageStatus";
import type {
  DynamicDataParams,
  DynamicDataResponse,
  SystemLabelEnumData,
} from "@/types/shared";
import type { Task } from "@/types/task";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MdArrowOutward } from "react-icons/md";

interface Props {
  message: Message;
  threadId?: string | null;
  onBack: () => void;
}

type BusinessType = "inquiry" | "class-registration" | "task";

interface BusinessItem {
  id: number;
  type: BusinessType;
  title: string;
}

const BusinessCardsView: React.FC<Props> = ({ message }) => {
  const { admins } = useAdminUsers();
  const { data: dynamicData } = useQuery<DynamicDataResponse>({
    queryKey: ["dynamicData", "deeplink-systemLabel"],
    queryFn: () =>
      dynamicDataService.get({
        enums: ["shared.systemLabel"],
      } as DynamicDataParams),
    staleTime: 10 * 60 * 1000,
  });
  const systemLabelEnum = (dynamicData?.enums?.["shared.systemLabel"] ??
    undefined) as SystemLabelEnumData | null | undefined;

  const baseItems: BusinessItem[] = [
    ...(message.classRegistrationId
      ? [
          {
            id: message.classRegistrationId,
            type: "class-registration" as const,
            title: "Hồ sơ đăng ký lớp",
          },
        ]
      : []),
    ...(message.inquiryId
      ? [
          {
            id: message.inquiryId,
            type: "inquiry" as const,
            title: "Thắc mắc người gửi",
          },
        ]
      : []),
    ...((message.taskIds ?? []).map((taskId, idx) => ({
      id: taskId,
      type: "task" as const,
      title: `Công tác${(message.taskIds?.length ?? 0) > 1 ? ` #${idx + 1}` : ""}`,
    })) ?? []),
  ];

  const classRegQueries = useQueries({
    queries: baseItems
      .filter((item) => item.type === "class-registration")
      .map((item) => ({
        queryKey: ["deeplink-class-registration", item.id],
        queryFn: () => classRegistrationsService.getById(item.id),
        staleTime: 30 * 1000,
      })),
  });

  const inquiryQueries = useQueries({
    queries: baseItems
      .filter((item) => item.type === "inquiry")
      .map((item) => ({
        queryKey: ["deeplink-inquiry", item.id],
        queryFn: () => inquiriesService.getById(item.id),
        staleTime: 30 * 1000,
      })),
  });

  const taskQueries = useQueries({
    queries: baseItems
      .filter((item) => item.type === "task")
      .map((item) => ({
        queryKey: ["deeplink-task", item.id],
        queryFn: () => tasksService.getById(item.id),
        staleTime: 30 * 1000,
      })),
  });

  const classRegMap = new Map<number, ClassRegistration>();
  classRegQueries.forEach((q) => {
    if (q.data) classRegMap.set(q.data.id, q.data);
  });
  const inquiryMap = new Map<number, Inquiry>();
  inquiryQueries.forEach((q) => {
    if (q.data) inquiryMap.set(q.data.id, q.data);
  });
  const taskMap = new Map<number, Task>();
  taskQueries.forEach((q) => {
    if (q.data) taskMap.set(q.data.id, q.data);
  });

  const [selected, setSelected] = useState<BusinessItem | null>(null);

  const handleOpen = (item: BusinessItem) => setSelected(item);
  const handleClose = () => setSelected(null);
  const getSystemLabelKey = (type: BusinessType) =>
    type === "class-registration"
      ? "classRegistration"
      : type === "inquiry"
        ? "inquiry"
        : "task";

  return (
    <div className="min-h-screen bg-white p-3 px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4">
        {baseItems.length === 0 ? (
          <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <img
              src="/nothing.png"
              alt="Không có dữ liệu"
              className="mb-4 w-72"
            />
            <p className="mb-4 text-center text-base text-gray-500">
              Chưa có hồ sơ nào.
            </p>
            <button
              onClick={() =>
                window.open(
                  "https://vaa.hcmus.app",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-3 text-xs font-semibold text-white"
            >
              Quản lý Giáo vụ số
            </button>
          </div>
        ) : (
          <div className="mt-2 grid gap-4 md:grid-cols-2">
            {baseItems.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleOpen(item)}
                className="dark:bg-navy-800 group relative flex flex-col rounded-[20px] bg-white p-5 pb-7 text-left text-sm shadow-lg transition"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Tag
                    color={getLabelColor(
                      getSystemLabelKey(item.type),
                      systemLabelEnum,
                    )}
                    interactive={false}
                  >
                    {getLabelVi(getSystemLabelKey(item.type), systemLabelEnum)}
                  </Tag>
                  {(item.type === "class-registration" ||
                    item.type === "inquiry") &&
                  ((item.type === "class-registration"
                    ? classRegMap.get(item.id)?.messageStatus
                    : inquiryMap.get(item.id)?.messageStatus) as
                    | MessageStatus
                    | undefined) ? (
                    <Tag
                      color={
                        MessageStatusColors[
                          (item.type === "class-registration"
                            ? classRegMap.get(item.id)!.messageStatus
                            : inquiryMap.get(item.id)!
                                .messageStatus) as MessageStatus
                        ].hex
                      }
                      interactive={false}
                      className="w-fit"
                    >
                      {
                        MessageStatusLabels[
                          (item.type === "class-registration"
                            ? classRegMap.get(item.id)!.messageStatus
                            : inquiryMap.get(item.id)!
                                .messageStatus) as MessageStatus
                        ]
                      }
                    </Tag>
                  ) : null}
                </div>
                <p className="text-navy-700 mt-1 text-sm font-bold dark:text-white">
                  {item.title}
                </p>

                {item.type === "class-registration" && (
                  <div className="mt-2 grid grid-cols-[92px_minmax(0,1fr)] gap-x-2 gap-y-2 text-gray-600 dark:text-gray-300">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Sinh viên
                    </p>
                    <p className="font-semibold">
                      {classRegMap.get(item.id)?.studentName ?? "Đang tải..."}
                    </p>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      MSSV
                    </p>
                    <p className="font-semibold">
                      {classRegMap.get(item.id)?.studentCode ?? "Đang tải..."}
                    </p>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      SL yêu cầu
                    </p>
                    <p className="font-semibold">
                      {classRegMap.get(item.id)?.itemsCount ??
                        classRegMap.get(item.id)?.items?.length ??
                        "Đang tải..."}
                    </p>
                  </div>
                )}

                {item.type === "inquiry" && (
                  <div className="mt-2 grid grid-cols-[92px_minmax(0,1fr)] gap-x-2 gap-y-2 text-gray-600 dark:text-gray-300">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Loại
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(inquiryMap.get(item.id)?.types ?? []).length ? (
                        (inquiryMap.get(item.id)?.types ?? []).map((type) => (
                          <Tag
                            key={`${item.id}-${type}`}
                            color={InquiryTypeColors[type as InquiryType].hex}
                            interactive={false}
                          >
                            {InquiryTypeLabels[type as InquiryType]}
                          </Tag>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">
                          Đang tải loại câu hỏi...
                        </span>
                      )}
                    </div>
                    <p className="col-span-2 mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Câu hỏi
                    </p>
                    <div
                      className="col-span-2 mb-5 overflow-scroll rounded-3xl bg-gray-50 px-4 py-1.5 font-medium text-gray-700 dark:bg-white/5 dark:text-gray-200"
                      dangerouslySetInnerHTML={{
                        __html:
                          inquiryMap.get(item.id)?.question || "Đang tải...",
                      }}
                    />
                  </div>
                )}

                {item.type === "task" && (
                  <div className="mt-2 grid grid-cols-[92px_minmax(0,1fr)] gap-x-2 gap-y-2 text-gray-600 dark:text-gray-300">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Nội dung
                    </p>
                    <p className="line-clamp-2 font-semibold">
                      {taskMap.get(item.id)?.name || "Đang tải..."}
                    </p>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Thực hiện
                    </p>
                    {(taskMap.get(item.id)?.assignees?.length ?? 0) > 0 ? (
                      <div className="min-h-8">
                        <AssigneeManager
                          selectedIds={(
                            taskMap.get(item.id)?.assignees ?? []
                          ).map((a) => a.assigneeId)}
                          allUsers={admins}
                          disabled
                        />
                      </div>
                    ) : (
                      "--"
                    )}
                  </div>
                )}

                <span className="bg-brand-500 pointer-events-none absolute right-3 bottom-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-white">
                  <MdArrowOutward className="h-4 w-4 rotate-45 transition-transform duration-200 group-hover:rotate-0" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <RegistrationDetailDrawer
        registrationId={
          selected?.type === "class-registration" ? selected.id : null
        }
        onClose={handleClose}
        onRegistrationChanged={() => {}}
      />
      <InquiryDetailDrawer
        inquiryId={selected?.type === "inquiry" ? selected.id : null}
        onClose={handleClose}
        onInquiryChanged={() => {}}
      />
      <TaskDetailDrawer
        taskId={selected?.type === "task" ? selected.id : null}
        onClose={handleClose}
        onTaskChanged={() => {}}
      />
    </div>
  );
};

export default BusinessCardsView;
