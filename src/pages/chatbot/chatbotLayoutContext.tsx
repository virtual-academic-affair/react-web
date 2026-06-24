import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

type ChatbotLayoutContextValue = {
  onToggleSidebar?: () => void;
  registerOpenSearch: (handler: (() => void) | null) => void;
  openSearch: () => void;
};

const ChatbotLayoutContext = createContext<ChatbotLayoutContextValue | null>(
  null,
);

export function ChatbotLayoutProvider({
  onToggleSidebar,
  children,
}: {
  onToggleSidebar?: () => void;
  children: ReactNode;
}) {
  const openSearchRef = useRef<(() => void) | null>(null);

  const registerOpenSearch = useCallback((handler: (() => void) | null) => {
    openSearchRef.current = handler;
  }, []);

  const openSearch = useCallback(() => {
    openSearchRef.current?.();
  }, []);

  return (
    <ChatbotLayoutContext.Provider
      value={{ onToggleSidebar, registerOpenSearch, openSearch }}
    >
      {children}
    </ChatbotLayoutContext.Provider>
  );
}

export function useChatbotLayout() {
  const ctx = useContext(ChatbotLayoutContext);
  if (!ctx) {
    throw new Error(
      "useChatbotLayout must be used within ChatbotLayoutProvider",
    );
  }
  return ctx;
}
