import type { ResourceQueryDto } from "./common";

export type MessageStatus = "opened" | "replied" | "closed";
export type ItemStatus = "pending" | "approved" | "rejected";
export type RegistrationAction = "register" | "cancel" | "requestOpen";

export const RegistrationActionLabels: Record<RegistrationAction, string> = {
  register: "Đăng ký thêm",
  cancel: "Hủy môn",
  requestOpen: "Mở môn",
};

export const RegistrationActionColors: Record<RegistrationAction, { bg: string; text: string; hex: string }> = {
  register: { bg: "bg-indigo-100", text: "text-indigo-800", hex: "#6366f1" },
  cancel: { bg: "bg-red-100", text: "text-red-800", hex: "#ef4444" },
  requestOpen: { bg: "bg-blue-100", text: "text-blue-800", hex: "#3b82f6" },
};

export const MessageStatusLabels: Record<MessageStatus, string> = {
  opened: "Đang mở",
  replied: "Đã trả lời",
  closed: "Đã đóng",
};

export const MessageStatusColors: Record<
  MessageStatus,
  { bg: string; text: string }
> = {
  opened: { bg: "bg-blue-100", text: "text-blue-800" },
  replied: { bg: "bg-green-100", text: "text-green-800" },
  closed: { bg: "bg-gray-100", text: "text-gray-800" },
};

export const ItemStatusLabels: Record<ItemStatus, string> = {
  pending: "Đang chờ",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export const ItemStatusColors: Record<
  ItemStatus,
  { bg: string; text: string }
> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  approved: { bg: "bg-green-100", text: "text-green-800" },
  rejected: { bg: "bg-red-100", text: "text-red-800" },
};

export interface ClassRegistrationItem {
  id: number;
  classRegistrationId: number;
  action: RegistrationAction;
  subjectName: string;
  subjectCode?: string;
  className?: string;
  slotInfo?: string;
  isInCurriculum?: boolean;
  status: ItemStatus;
  rejectReasons?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRegistration {
  id: number;
  studentCode: string;
  studentName: string;
  academicYear: number;
  note?: string | null;
  messageId?: number | null;
  messageStatus?: MessageStatus | null;
  itemsCount?: number;
  items?: ClassRegistrationItem[];
  createdAt: string;
  updatedAt: string;
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
}

export interface CreateClassRegistrationItemDto {
  action: RegistrationAction;
  subjectName: string;
  subjectCode?: string;
  className?: string;
  slotInfo?: string;
  isInCurriculum?: boolean;
}

export interface CreateClassRegistrationDto {
  studentCode: string;
  studentName: string;
  academicYear: number;
  note?: string;
  messageId?: number;
  items: CreateClassRegistrationItemDto[];
}

export interface UpdateClassRegistrationDto {
  studentCode?: string;
  studentName?: string;
  academicYear?: number;
  note?: string;
  messageStatus?: MessageStatus | null;
}

export interface UpdateClassRegistrationItemDto {
  status?: ItemStatus;
  rejectReasons?: string[];
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
