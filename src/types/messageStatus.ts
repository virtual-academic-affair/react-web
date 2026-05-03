/**
 * Khớp `nest-api/src/email/enums/belongs-to-message-status.enum.ts`
 * (`MessageStatus`: New, Staged, Replied, Old).
 */
export const MESSAGE_STATUSES = ["new", "staged", "replied", "old"] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const MessageStatusLabels: Record<MessageStatus, string> = {
  new: "Mới",
  staged: "Chờ gửi",
  replied: "Đã trả lời",
  old: "Đã kết thúc",
};

export const MessageStatusColors: Record<
  MessageStatus,
  { bg: string; text: string; hex: string }
> = {
  new: { bg: "bg-amber-100", text: "text-amber-800", hex: "#d97706" },
  staged: { bg: "bg-blue-100", text: "text-blue-800", hex: "#2563eb" },
  replied: { bg: "bg-green-100", text: "text-green-800", hex: "#16a34a" },
  old: { bg: "bg-slate-200", text: "text-slate-800", hex: "#64748b" },
};

const LEGACY_STATUS_MAP: Record<string, MessageStatus> = {
  opened: "staged",
  closed: "old",
};

export function isMessageStatus(v: string | null | undefined): v is MessageStatus {
  return v != null && (MESSAGE_STATUSES as readonly string[]).includes(v);
}

/** Chuẩn hóa giá trị từ API / cache cũ (`opened` / `closed`). */
export function coerceMessageStatus(
  raw: string | null | undefined,
): MessageStatus | null {
  if (raw == null || raw === "") return null;
  if (isMessageStatus(raw)) return raw;
  return LEGACY_STATUS_MAP[raw] ?? null;
}
