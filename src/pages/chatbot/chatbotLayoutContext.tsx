import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getChatbotBasePath,
  getChatbotInfoPanelFromPath,
} from "./chatbotInfoRoutes";

export type ChatbotInfoPanelType = "documents" | "forms";

export type FaqDrawerDraft = {
  question: string;
  answer: string;
};

type ChatbotLayoutContextValue = {
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
  sidebarOpen?: boolean;
  sidebarCollapsed?: boolean;
  registerOpenSearch: (handler: (() => void) | null) => void;
  openSearch: () => void;
  infoPanel: ChatbotInfoPanelType | null;
  closeInfoPanel: () => void;
  infoPanelAudience: "user" | "admin";
  faqDrawerOpen: boolean;
  faqInitialDraft: FaqDrawerDraft;
  openFaqDrawer: (draft: FaqDrawerDraft) => void;
  closeFaqDrawer: () => void;
};

const ChatbotLayoutContext = createContext<ChatbotLayoutContextValue | null>(
  null,
);

export function ChatbotLayoutProvider({
  onToggleSidebar,
  onCloseSidebar,
  sidebarOpen = false,
  sidebarCollapsed = false,
  infoPanelAudience,
  children,
}: {
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
  sidebarOpen?: boolean;
  sidebarCollapsed?: boolean;
  infoPanelAudience: "user" | "admin";
  children: ReactNode;
}) {
  const openSearchRef = useRef<(() => void) | null>(null);
  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);
  const [faqInitialDraft, setFaqInitialDraft] = useState<FaqDrawerDraft>({
    question: "",
    answer: "",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const infoPanel = getChatbotInfoPanelFromPath(location.pathname);

  const registerOpenSearch = useCallback((handler: (() => void) | null) => {
    openSearchRef.current = handler;
  }, []);

  const openSearch = useCallback(() => {
    openSearchRef.current?.();
  }, []);

  const closeInfoPanel = useCallback(() => {
    const base = getChatbotBasePath(infoPanelAudience);
    if (infoPanel !== null) {
      navigate({ pathname: base, search: "" });
    }
  }, [infoPanel, infoPanelAudience, navigate]);

  const openFaqDrawer = useCallback((draft: FaqDrawerDraft) => {
    setFaqInitialDraft(draft);
    setFaqDrawerOpen(true);
  }, []);

  const closeFaqDrawer = useCallback(() => {
    setFaqDrawerOpen(false);
  }, []);

  return (
    <ChatbotLayoutContext.Provider
      value={{
        onToggleSidebar,
        onCloseSidebar,
        sidebarOpen,
        sidebarCollapsed,
        registerOpenSearch,
        openSearch,
        infoPanel,
        closeInfoPanel,
        infoPanelAudience,
        faqDrawerOpen,
        faqInitialDraft,
        openFaqDrawer,
        closeFaqDrawer,
      }}
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

export function useChatbotLayoutOptional() {
  return useContext(ChatbotLayoutContext);
}
