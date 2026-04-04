import type { ResourceQueryDto } from "./common";
import type { MessageStatus } from "./classRegistration";

export type InquiryType = "graduation" | "training" | "procedure";

export const InquiryTypeLabels: Record<InquiryType, string> = {
  graduation: "Tốt nghiệp",
  training: "Đào tạo",
  procedure: "Thủ tục",
};

export const InquiryTypeColors: Record<InquiryType, { bg: string; text: string; hex: string }> = {
  graduation: { bg: "bg-indigo-100", text: "text-indigo-800", hex: "#6366f1" },
  training: { bg: "bg-blue-100", text: "text-blue-800", hex: "#3b82f6" },
  procedure: { bg: "bg-green-100", text: "text-green-800", hex: "#10b981" },
};

export function labelPillStyle(hex: string): React.CSSProperties {
  return { backgroundColor: hex + "20", color: hex };
}

export interface InquirySource {
  fileId: string;
  displayName: string;
  text: string;
}

export interface Inquiry {
  id: number;
  types: InquiryType[];
  question: string;
  answer: string | null;
  sources?: InquirySource[];
  messageId?: number | null;
  messageStatus?: MessageStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryStatEntry {
  total: number;
  types: Record<InquiryType, number>;
}

export interface InquiryStats {
  [date: string]: InquiryStatEntry;
}

/** Normalized shape used internally by the stats page (keyed by YYYY-MM-DD local date) */
export interface NormalizedInquiryStats {
  [localDate: string]: {
    total: number;
    graduation: number;
    training: number;
    procedure: number;
  };
}

export interface GetInquiriesParams extends ResourceQueryDto {
  types?: InquiryType[];
  messageId?: string | number;
  messageStatuses?: MessageStatus[];
}

export interface CreateInquiryDto {
  messageId?: number;
  types: InquiryType[];
  question: string;
  answer?: string;
}

export interface UpdateInquiryDto {
  types?: InquiryType[];
  question?: string;
  answer?: string;
  messageStatus?: MessageStatus | null;
}

export interface InquiryReplyDto {
  content: string;
  isClose?: boolean;
}

export interface InquiryPreviewReplyDto {
  content: string;
}
