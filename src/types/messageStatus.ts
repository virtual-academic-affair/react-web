export type MessageStatus = "new" | "opened" | "replied" | "closed";

export const MessageStatusLabels: Record<MessageStatus, string> = {
  new: "Mới",
  opened: "Đang mở",
  replied: "Đã trả lời",
  closed: "Đã đóng",
};

export const MessageStatusColors: Record<
  MessageStatus,
  { bg: string; text: string; hex: string }
> = {
  new: { bg: "bg-amber-100", text: "text-amber-800", hex: "#d97706" },
  opened: { bg: "bg-blue-100", text: "text-blue-800", hex: "#2563eb" },
  replied: { bg: "bg-green-100", text: "text-green-800", hex: "#16a34a" },
  closed: { bg: "bg-red-100", text: "text-red-800", hex: "#dc2626" },
};
