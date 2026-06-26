import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CHAT_PATH_MARKER = "/chatbot";

export function getChatbotBasePath(pathname: string) {
  const markerIndex = pathname.indexOf(CHAT_PATH_MARKER);
  if (markerIndex < 0) return "/admin/chatbot";
  return pathname.slice(0, markerIndex + CHAT_PATH_MARKER.length);
}

export function getThreadIdFromPath(pathname: string) {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function useChatbotRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  const chatbotBasePath = useMemo(
    () => getChatbotBasePath(location.pathname),
    [location.pathname],
  );
  const routeThreadId = useMemo(
    () => getThreadIdFromPath(location.pathname),
    [location.pathname],
  );

  const navigateToThread = useCallback(
    (threadId: string, options?: { replace?: boolean }) => {
      navigate(
        {
          pathname: `${chatbotBasePath}/chat/${encodeURIComponent(threadId)}`,
          search: "",
        },
        { replace: options?.replace },
      );
    },
    [chatbotBasePath, navigate],
  );

  const navigateToChatbotRoot = useCallback(
    (options?: { replace?: boolean }) => {
      navigate({ pathname: chatbotBasePath, search: "" }, {
        replace: options?.replace,
      });
    },
    [chatbotBasePath, navigate],
  );

  return {
    routeThreadId,
    navigateToThread,
    navigateToChatbotRoot,
  };
}
