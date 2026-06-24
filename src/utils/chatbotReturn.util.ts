const CHATBOT_RETURN_PATH_KEY = "chatbot_return_path";

export function setChatbotReturnPath(path: string) {
  if (path.includes("/chatbot")) return;
  sessionStorage.setItem(CHATBOT_RETURN_PATH_KEY, path);
}

export function getChatbotReturnPath(
  fallback = "/admin/email/config",
): string {
  const saved = sessionStorage.getItem(CHATBOT_RETURN_PATH_KEY);
  if (!saved || saved.includes("/chatbot")) return fallback;
  return saved;
}

export function getChatbotReturnLabel(path: string): string {
  if (path.includes("/auth/students")) return "DS Sinh viên";
  if (path.includes("/email/config")) return "Dashboard";
  if (path.includes("/class-registration")) return "Thống kê đăng kí lớp";
  if (path.includes("/inquiry")) return "Thống kê thắc mắc";
  if (path.includes("/documents")) return "Tài liệu";
  if (path.includes("/auth/accounts")) return "DS tài khoản";
  return "Quay lại";
}
