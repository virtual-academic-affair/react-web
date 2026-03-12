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

export function formatDate(iso: string | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

