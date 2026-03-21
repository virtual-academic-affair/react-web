/**
 * Shared module types
 */

// ─── Setting types ────────────────────────────────────────────────────────────

import type { LabelMappingDto } from "./email";

/** Known setting keys for /shared/dynamic-data */
export type SettingKey =
  | "email.labels"
  | "email.superEmail"
  | "email.lastPullAt"
  | "email.allowedDomains";

/** Gmail account used for syncing */
export interface SuperEmailDto {
  email: string;
  refreshToken: string;
  name: string;
  picture: string;
}

/** Map of setting key → value (only requested keys are present) */
export interface SettingsMap {
  "email.labels"?: LabelMappingDto;
  "email.superEmail"?: SuperEmailDto;
  "email.lastPullAt"?: string;
  "email.allowedDomains"?: string[];
}

// ─── Enum types ───────────────────────────────────────────────────────────────

/** Known enum paths for /shared/dynamic-data */
export type EnumPath = "shared.systemLabel" | "authentication.role";

/** i18n + color entry for a single system label */
export interface SystemLabelLangItem {
  vi: string;
  en: string;
  color: string;
}

/** Shape returned for the "shared.systemLabel" enum path — flat record of label key → i18n+color */
export type SystemLabelEnumData = Record<string, SystemLabelLangItem>;

/** Role values */
export const Role = {
  Student: "student",
  Admin: "admin",
  Lecture: "lecture",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** Shape returned for the "authentication.role" enum path */
export interface RoleEnumData {
  Role: typeof Role;
}

/** Map of enum path → value (null if path not found in registry) */
export interface EnumsMap {
  "shared.systemLabel"?: SystemLabelEnumData | null;
  "authentication.role"?: RoleEnumData | null;
}

// ─── Request / Response ───────────────────────────────────────────────────────

/** Query params for GET /shared/dynamic-data */
export interface DynamicDataParams {
  settings?: readonly SettingKey[] | SettingKey[];
  enums?: readonly EnumPath[] | EnumPath[];
}

/** Response from GET /shared/dynamic-data */
export interface DynamicDataResponse {
  settings?: SettingsMap;
  enums?: EnumsMap;
}
