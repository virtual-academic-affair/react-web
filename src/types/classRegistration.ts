import type { ResourceQueryDto } from "./common";

export type MessageStatus = "opened" | "replied" | "closed";
export type ItemStatus = "pending" | "approved" | "rejected";
export type RegistrationAction = "register" | "cancel";

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

export interface ClassRegistrationStats {
  total: number;
  opened?: number;
  replied?: number;
  closed?: number;

  [key: string]: unknown;
}

export interface PreviewReplyDto {
  html: string;
  note?: string;
}

export interface ReplyDto {
  html: string;
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
