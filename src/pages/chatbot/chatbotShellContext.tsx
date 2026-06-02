import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { ChatThreadSession } from "./types";

export type ChatbotShellContextValue = {
  errorMessage: string | null;
  clearError: () => void;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  sessions: ChatThreadSession[];
  activeThreadId: string;
  activeSessionStatus: ChatThreadSession["status"] | null;
  switchToThread: (threadId: string) => void;
  viewArchivedThread: (session: ChatThreadSession) => Promise<void>;
  switchToNewThread: () => void;
  renameThread: (threadId: string, title: string) => Promise<void>;
  archiveThread: (threadId: string) => Promise<void>;
  unarchiveThread: (session: ChatThreadSession) => Promise<void>;
  deleteThread: (session: ChatThreadSession) => Promise<void>;
};

const ChatbotShellContext = createContext<ChatbotShellContextValue | null>(
  null,
);

export function ChatbotShellProvider({
  value,
  children,
}: {
  value: ChatbotShellContextValue;
  children: ReactNode;
}) {
  return (
    <ChatbotShellContext.Provider value={value}>
      {children}
    </ChatbotShellContext.Provider>
  );
}

export function useChatbotShell() {
  const ctx = useContext(ChatbotShellContext);
  if (!ctx) {
    throw new Error("useChatbotShell must be used within ChatbotShellProvider");
  }
  return ctx;
}
