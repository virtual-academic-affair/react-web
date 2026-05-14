import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export type ChatbotShellContextValue = {
  errorMessage: string | null;
  clearError: () => void;
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
