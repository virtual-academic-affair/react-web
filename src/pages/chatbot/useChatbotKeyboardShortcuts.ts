import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function isNewChatShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  return (event.metaKey || event.ctrlKey) && event.shiftKey && key === "o";
}

function isSearchShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  return (event.metaKey || event.ctrlKey) && event.shiftKey && key === "k";
}

export function useChatbotKeyboardShortcuts({
  onNewChat,
  onOpenSearch,
}: {
  onNewChat: () => void;
  onOpenSearch: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isNewChatShortcut(event)) {
        event.preventDefault();
        onNewChat();
        return;
      }

      if (isSearchShortcut(event)) {
        if (isEditableTarget(event.target)) {
          const target = event.target as HTMLElement;
          if (target.closest("[data-chatbot-search-dialog]")) return;
        }
        event.preventDefault();
        onOpenSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNewChat, onOpenSearch]);
}
