import type { SystemLabelEnumData } from "@/types/shared";
import type React from "react";

export function getLabelVi(
  sl: string,
  enumData?: SystemLabelEnumData | null,
): string {
  return enumData?.[sl]?.vi ?? sl;
}

export function getLabelColor(
  sl: string,
  enumData?: SystemLabelEnumData | null,
): string {
  return enumData?.[sl]?.color ?? "#888";
}

export function labelPillStyle(color: string): React.CSSProperties {
  return { backgroundColor: color + "20", color };
}

import { formatDate } from "@/utils/date";

export { formatDate };

