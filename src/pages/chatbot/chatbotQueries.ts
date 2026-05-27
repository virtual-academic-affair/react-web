import { useQuery } from "@tanstack/react-query";

import {
  listSessionMessages,
  listSessions,
  type ChatSessionStatus,
} from "@/services/chatbot/chatSessions.service";

import { historyMessageToStore, sessionFromServer } from "./chatbotMappers";

export const CHATBOT_SESSIONS_PAGE = 1;
export const CHATBOT_SESSIONS_PAGE_SIZE = 50;
export const CHATBOT_MESSAGES_PAGE = 1;
export const CHATBOT_MESSAGES_PAGE_SIZE = 100;

export const chatbotQueryKeys = {
  all: ["chatbot"] as const,
  sessionsRoot: () => [...chatbotQueryKeys.all, "sessions"] as const,
  sessions: (statusFilter: ChatSessionStatus) =>
    [
      ...chatbotQueryKeys.sessionsRoot(),
      {
        page: CHATBOT_SESSIONS_PAGE,
        pageSize: CHATBOT_SESSIONS_PAGE_SIZE,
        statusFilter,
      },
    ] as const,
  messagesRoot: () => [...chatbotQueryKeys.all, "messages"] as const,
  messages: (sessionId: string) =>
    [
      ...chatbotQueryKeys.messagesRoot(),
      sessionId,
      {
        page: CHATBOT_MESSAGES_PAGE,
        pageSize: CHATBOT_MESSAGES_PAGE_SIZE,
      },
    ] as const,
};

export async function fetchChatbotSessions(statusFilter: ChatSessionStatus) {
  const data = await listSessions({
    page: CHATBOT_SESSIONS_PAGE,
    pageSize: CHATBOT_SESSIONS_PAGE_SIZE,
    statusFilter,
  });
  return data.items
    .filter((item) => item.status === statusFilter && !!item.sessionId)
    .map(sessionFromServer);
}

export async function fetchChatbotMessages(sessionId: string) {
  const data = await listSessionMessages(sessionId, {
    page: CHATBOT_MESSAGES_PAGE,
    pageSize: CHATBOT_MESSAGES_PAGE_SIZE,
  });
  const ordered = [...data.items].sort((a, b) => a.sequence - b.sequence);
  return ordered.map((item, idx) => historyMessageToStore(item, idx, sessionId));
}

export function useChatbotSessionsQuery(
  statusFilter: ChatSessionStatus,
  enabled = true,
) {
  return useQuery({
    queryKey: chatbotQueryKeys.sessions(statusFilter),
    queryFn: () => fetchChatbotSessions(statusFilter),
    enabled,
  });
}
