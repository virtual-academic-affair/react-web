/**
 * Shared module types
 */

// ─── Setting types ────────────────────────────────────────────────────────────

import type { LabelMappingDto } from "./email";
import type { Role } from "./users";

/** Known setting keys for /shared/settings */
export type SettingKey =
  | "auth.roleDomains"
  | "email.labels"
  | "email.superEmail"
  | "email.lastPullAt"
  | "email.gmailHistoryId";

/** Gmail account used for syncing */
export interface SuperEmailDto {
  email: string;
  refreshToken: string;
  name: string;
  picture: string;
}

/** Map of setting key → value (only requested keys are present) */
export interface SettingsMap {
  "auth.roleDomains"?: Partial<Record<Role, string[]>>;
  "email.labels"?: LabelMappingDto;
  "email.superEmail"?: SuperEmailDto;
  "email.lastPullAt"?: string;
  "email.gmailHistoryId"?: string;
}

/** i18n + color entry for a single system label */
export interface SystemLabelLangItem {
  vi: string;
  en: string;
  color: string;
}

/** Shape returned for the "shared.systemLabel" enum path — flat record of label key → i18n+color */
export type SystemLabelEnumData = Record<string, SystemLabelLangItem>;

// ─── Request / Response ───────────────────────────────────────────────────────
export interface SharedSettingsParams {
  keys: readonly SettingKey[] | SettingKey[];
}

export interface DynamicDataResponse {
  settings?: SettingsMap;
}
