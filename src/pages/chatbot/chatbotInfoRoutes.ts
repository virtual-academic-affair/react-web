import type { ChatbotInfoPanelType } from "./chatbotLayoutContext";

export function getChatbotBasePath(audience: "user" | "admin"): string {
  return audience === "user" ? "/user/chatbot" : "/admin/chatbot";
}

export function getChatbotInfoPath(
  audience: "user" | "admin",
  type: ChatbotInfoPanelType,
): string {
  return `${getChatbotBasePath(audience)}/${type}`;
}

export function getChatbotInfoPanelFromPath(
  pathname: string,
): ChatbotInfoPanelType | null {
  if (/\/chatbot\/documents(?:\/|$)/.test(pathname)) return "documents";
  if (/\/chatbot\/forms(?:\/|$)/.test(pathname)) return "forms";
  return null;
}
