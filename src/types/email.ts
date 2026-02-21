/**
 * Email module types
 */

import type { ResourceQueryDto } from "./common";

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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for fetching emails
 */
export interface GetMessagesParams extends ResourceQueryDto {
  systemLabels?: SystemLabel[];
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
  task: string | null;
  inquiry: string | null;
  other: string | null;
}

/**
 * Update labels DTO
 */
export interface UpdateLabelsDto {
  classRegistration?: string | null;
  task?: string | null;
  inquiry?: string | null;
  other?: string | null;
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
}
