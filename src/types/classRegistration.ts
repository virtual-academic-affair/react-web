import type { ResourceQueryDto } from "./common";

import type { MessageStatus } from "./messageStatus";
import {
  MessageStatusLabels,
  MessageStatusColors,
  MESSAGE_STATUSES,
  coerceMessageStatus,
} from "./messageStatus";
export type { MessageStatus };
export {
  MessageStatusLabels,
  MessageStatusColors,
  MESSAGE_STATUSES,
  coerceMessageStatus,
};

export type ItemStatus = "pending" | "approved" | "rejected";
export type RegistrationAction = "register" | "cancel" | "requestOpen";

export const RegistrationActionLabels: Record<RegistrationAction, string> = {
  register: "Đăng ký thêm",
  cancel: "Hủy môn",
  requestOpen: "Mở môn",
};

export const RegistrationActionOptions = [
  { value: "register", label: "Đăng ký thêm" },
  { value: "cancel", label: "Hủy môn" },
  { value: "requestOpen", label: "Mở môn" },
];

export const RegistrationActionColors: Record<RegistrationAction, { bg: string; text: string; hex: string }> = {
  register: { bg: "bg-indigo-100", text: "text-indigo-800", hex: "#6366f1" },
  cancel: { bg: "bg-red-100", text: "text-red-800", hex: "#ef4444" },
  requestOpen: { bg: "bg-blue-100", text: "text-blue-800", hex: "#3b82f6" },
};

export const ItemStatusLabels: Record<ItemStatus, string> = {
  pending: "Đang chờ",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export const ItemStatusColors: Record<
  ItemStatus,
  { bg: string; text: string; hex: string }
> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", hex: "#eab308" },
  approved: { bg: "bg-green-100", text: "text-green-800", hex: "#10b981" },
  rejected: { bg: "bg-red-100", text: "text-red-800", hex: "#ef4444" },
};

/** Tin nhắn join khi GET chi tiết — thông tin SV lấy từ đây, không lưu trên entity đăng ký */
export interface ClassRegistrationLinkedMessage {
  id?: number;
  studentCode?: string | null;
  senderName?: string;
  student?: {
    studentCode?: string;
    studentName?: string;
    enrollmentYear?: number;
  } | null;
}

export interface ClassRegistrationItem {
  id: number;
  classRegistrationId?: number;
  /** API trả về `parentId` thay cho classRegistrationId */
  parentId?: number;
  /** GET items: join qua parent.message (MSSV) */
  studentCode?: string | null;
  action: RegistrationAction;
  subjectName: string;
  subjectCode?: string;
  className?: string;
  slotInfo?: string;
  isInCurriculum?: boolean;
  status: ItemStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRegistration {
  id: number;
  message?: ClassRegistrationLinkedMessage | null;
  studentCode?: string;
  studentName?: string;
  academicYear?: number;
  note?: string | null;
  messageId?: number | null;
  messageStatus?: MessageStatus | null;
  itemsCount?: number;
  items?: ClassRegistrationItem[];
  createdAt: string;
  updatedAt: string;
}

export function classRegistrationStudentDisplay(reg: ClassRegistration): {
  studentCode: string;
  studentName: string;
  academicYear: string;
} {
  const m = reg.message;
  const studentCode =
    m?.student?.studentCode?.trim() ||
    m?.studentCode?.trim() ||
    reg.studentCode?.trim() ||
    "";
  const studentName =
    m?.student?.studentName?.trim() ||
    m?.senderName?.trim() ||
    reg.studentName?.trim() ||
    "";
  const academicYear =
    m?.student?.enrollmentYear != null
      ? String(m.student.enrollmentYear)
      : reg.academicYear != null
        ? String(reg.academicYear)
        : "";
  return { studentCode, studentName, academicYear };
}

export interface ClassRegistrationStatsItem {
  date: string;
  total: number;
  detail?: {
    [action: string]: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
}

export type ClassRegistrationStats = Record<string, ClassRegistrationStatsItem | number>;

export interface PreviewReplyDto {
  content: string;
}

export interface ReplyDto {
  content: string;
  note?: string;
  closeAfterSend?: boolean;
}

export interface GetClassRegistrationsParams extends ResourceQueryDto {
  studentCode?: string;
  academicYear?: string | number;
  smartOrder?: string;
  messageId?: string | number;
  messageStatuses?: MessageStatus[];
  sentFrom?: string;
  sentTo?: string;
}

/** GET .../classRegistrations/:parentId/items */
export interface GetClassRegistrationItemsParams extends ResourceQueryDto {
  statuses?: ItemStatus[];
  actions?: RegistrationAction[];
  subjectName?: string;
  subjectCode?: string;
  messageId?: string | number;
  messageStatuses?: MessageStatus[];
  sentFrom?: string;
  sentTo?: string;
}

/** GET .../items/overview — nhóm môn → các lớp (bucket) */
export interface OverviewClassBucket {
  className: string | null;
  byStatus: Record<ItemStatus, number>;
  byAction: Record<RegistrationAction, number>;
}

export interface OverviewSubjectGroup {
  subjectName: string;
  subjectCode: string | null;
  classes: OverviewClassBucket[];
}

export interface CreateClassRegistrationItemDto {
  action: RegistrationAction;
  subjectName: string;
  subjectCode?: string;
  className?: string;
  slotInfo?: string;
  isInCurriculum?: boolean;
  status?: ItemStatus;
  note?: string;
}

export interface CreateClassRegistrationDto {
  messageId: number;
  messageStatus?: MessageStatus;
  note?: string;
  items: CreateClassRegistrationItemDto[];
}

export interface UpdateClassRegistrationDto {
  note?: string;
  messageStatus?: MessageStatus | null;
}

export interface UpdateClassRegistrationItemDto {
  action?: RegistrationAction;
  subjectName?: string;
  subjectCode?: string;
  className?: string;
  slotInfo?: string;
  status?: ItemStatus;
  note?: string;
  isInCurriculum?: boolean;
}

export interface GetStatsParams {
  from: string;
  to: string;
  isDetail?: boolean;
}

export interface CancelReason {
  id: number;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetCancelReasonsParams extends ResourceQueryDto {
  isActive?: boolean;
}

export interface CreateCancelReasonDto {
  content: string;
  isActive?: boolean;
}

export interface UpdateCancelReasonDto {
  content?: string;
  isActive?: boolean;
}
