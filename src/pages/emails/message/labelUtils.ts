import type { SystemLabelEnumData } from "@/types/shared";
import type React from "react";

const DEFAULT_LABEL_META: Record<string, { vi: string; color: string }> = {
  classRegistration: { vi: "Đăng ký lớp", color: "#9b59b6" },
  training: { vi: "Đào tạo", color: "#3498db" },
  graduation: { vi: "Tốt nghiệp", color: "#2ecc71" },
  inquiry: { vi: "Thắc mắc", color: "#f39c12" },
  task: { vi: "Công tác", color: "#16a34a" },
};

export function getLabelVi(
  sl: string,
  enumData?: SystemLabelEnumData | null,
): string {
  return enumData?.[sl]?.vi ?? DEFAULT_LABEL_META[sl]?.vi ?? sl;
}

export function getLabelColor(
  sl: string,
  enumData?: SystemLabelEnumData | null,
): string {
  return enumData?.[sl]?.color ?? DEFAULT_LABEL_META[sl]?.color ?? "#888";
}

export function labelPillStyle(color: string): React.CSSProperties {
  return { backgroundColor: color + "20", color };
}

import { formatDate } from "@/utils/date";

export { formatDate };

