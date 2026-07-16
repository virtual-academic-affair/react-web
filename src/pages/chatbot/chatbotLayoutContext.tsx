import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { CorpusTraversalModalViewState } from "./components/CorpusTraversalModal";
import { emptyCorpusTraversal } from "./corpusTraversalUtils";
import type { ChatCorpusTraversal } from "./types";
import {
  getChatbotBasePath,
  getChatbotInfoPanelFromPath,
} from "./chatbotInfoRoutes";

export type ChatbotInfoPanelType = "documents" | "forms";

export type FaqDrawerDraft = {
  question: string;
  answer: string;
  onCreated?: () => void;
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
  corpusTraversalModal: CorpusTraversalModalViewState;
  syncCorpusTraversalModal: (
    patch: Partial<CorpusTraversalModalViewState> & {
      traversal?: ChatCorpusTraversal;
    },
  ) => void;
  openCorpusTraversalReview: (traversal: ChatCorpusTraversal) => void;
  closeCorpusTraversalModal: () => void;
  setCorpusTraversalPreviewStepIndex: (index: number | null) => void;
  setCorpusTraversalReplay: (isReplaying: boolean) => void;
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
  const [corpusTraversalModal, setCorpusTraversalModal] =
    useState<CorpusTraversalModalViewState>({
      open: false,
      mode: "review",
      traversal: emptyCorpusTraversal(),
      previewStepIndex: null,
      isReplaying: false,
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

  const syncCorpusTraversalModal = useCallback(
    (
      patch: Partial<CorpusTraversalModalViewState> & {
        traversal?: ChatCorpusTraversal;
      },
    ) => {
      setCorpusTraversalModal((current) => ({
        ...current,
        ...patch,
        traversal: patch.traversal ?? current.traversal,
      }));
    },
    [],
  );

  const openCorpusTraversalReview = useCallback(
    (traversal: ChatCorpusTraversal) => {
      setCorpusTraversalModal({
        open: true,
        mode: "review",
        traversal,
        previewStepIndex: null,
        isReplaying: false,
      });
    },
    [],
  );

  const closeCorpusTraversalModal = useCallback(() => {
    setCorpusTraversalModal((current) => ({
      ...current,
      open: false,
      previewStepIndex: null,
      isReplaying: false,
    }));
  }, []);

  const setCorpusTraversalPreviewStepIndex = useCallback(
    (index: number | null) => {
      setCorpusTraversalModal((current) => ({
        ...current,
        previewStepIndex: index,
      }));
    },
    [],
  );

  const setCorpusTraversalReplay = useCallback((isReplaying: boolean) => {
    setCorpusTraversalModal((current) => ({
      ...current,
      isReplaying,
    }));
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
        corpusTraversalModal,
        syncCorpusTraversalModal,
        openCorpusTraversalReview,
        closeCorpusTraversalModal,
        setCorpusTraversalPreviewStepIndex,
        setCorpusTraversalReplay,
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
