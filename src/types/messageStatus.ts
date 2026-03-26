export type MessageStatus = "opened" | "replied" | "closed";

export const MessageStatusLabels: Record<MessageStatus, string> = {
  opened: "Đang mở",
  replied: "Đã trả lời",
  closed: "Đã đóng",
};

export const MessageStatusColors: Record<
  MessageStatus,
  { bg: string; text: string }
> = {
  opened: { bg: "bg-blue-100", text: "text-blue-800" },
  replied: { bg: "bg-green-100", text: "text-green-800" },
  closed: { bg: "bg-red-100", text: "text-red-800" },
};
