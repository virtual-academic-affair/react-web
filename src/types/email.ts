/**
 * Email module types
 */

import type { ResourceQueryDto } from "./common";
import type { ClassRegistration } from "./classRegistration";
import type { Inquiry } from "./inquiry";

/**
 * System label values
 */
export const SystemLabel = {
  ClassRegistration: "classRegistration",
  Task: "task",
  Inquiry: "inquiry",
  Other: "other",
} as const;

export type SystemLabel = (typeof SystemLabel)[keyof typeof SystemLabel];

/**
 * Email message entity
 */
export interface Message {
  id: number;
  gmailMessageId: string;
  headerMessageId: string;
  threadId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  sentAt: Date;
  labelIds: string[];
  systemLabels: SystemLabel[];
  content?: string;
  /** ID các công tác gắn tin nhắn */
  taskIds?: number[];
  inquiryId?: number | null;
  classRegistrationId?: number | null;
  isProcessing?: boolean;
  /** MSSV gắn tin (nếu khớp danh sách SV) */
  studentCode?: string | null;
  student?: {
    studentCode?: string;
    studentName?: string;
    enrollmentYear?: number;
    major?: string | null;
  } | null;
  /** Có khi GET /email/messages/:id (join) */
  classRegistration?: ClassRegistration | null;
  inquiry?: Inquiry | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for fetching emails
 */
export interface GetMessagesParams extends ResourceQueryDto {
  systemLabels?: SystemLabel[];
  gmailMessageId?: string;
  threadId?: string;
  /** true = chỉ bản ghi isCurrent trong thread (đúng thread view) */
  threadView?: boolean;
  /** true = có inquiry/class registration conflict; false = không conflict */
  hasConflict?: boolean;
}

export const ReplyPluckEntity = {
  Inquiry: "inquiry",
  ClassRegistration: "classRegistration",
} as const;

export type ReplyPluckEntity =
  (typeof ReplyPluckEntity)[keyof typeof ReplyPluckEntity];

export interface ReplyPluckDto {
  sentFrom?: string;
  sentTo?: string;
  entities?: ReplyPluckEntity[];
}

export interface ReplyPluckResult {
  total: number;
  success: number;
  failed: number;
  inquiry: { total: number; success: number; failed: number };
  classRegistration: { total: number; success: number; failed: number };
  failures: Array<{
    type: ReplyPluckEntity;
    id: number;
    reason: string;
  }>;
}

/**
 * Update message label DTO
 */
export interface UpdateMessageLabelDto {
  messageId: number;
  systemLabel: SystemLabel;
  isRemove: boolean;
}

/**
 * Update all system labels for a specific message (replaces the full list)
 */
export interface UpdateMessageSystemLabelsDto {
  systemLabels: SystemLabel[];
  deleteTasks?: boolean;
}

/**
 * Gmail label structure
 */
export interface GmailLabel {
  label: string;
  value: string;
}

/**
 * Label mapping between system labels and Gmail label IDs
 */
export interface LabelMappingDto {
  classRegistration: string | null;
  training: string | null;
  graduation: string | null;
}

/**
 * Update labels DTO
 */
export interface UpdateLabelsDto {
  classRegistration?: string | null;
  training?: string | null;
  graduation?: string | null;
}

/**
 * Update allowed domains DTO
 */
export interface UpdateAllowedDomainsDto {
  domains: string[];
}

/**
 * OAuth code DTO
 */
export interface CodeDto {
  code: string;
  redirectUrl: string;
}
