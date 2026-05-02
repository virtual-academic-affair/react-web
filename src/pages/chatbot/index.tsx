import { streamChat } from "@/services/chatbot/chatbot.service";
import React from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import ChatInput from "./components/ChatInput";
import ChatMessage from "./components/ChatMessage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import {
  ASSISTANT_ERROR_FALLBACK,
  CHAT_INPUT_PLACEHOLDER,
  CHAT_LAYOUT_CLASSNAME,
  CHAT_SUGGESTIONS,

  CHATBOT_PAGE_SUBTITLE,
  CHATBOT_PAGE_TITLE,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  NEW_CHAT_TITLE,
} from "./constants";
import type { ChatMessage as ChatMessageType, ChatSourceItem } from "./types";

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = React.useState<ChatMessageType[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [chatTitle, setChatTitle] = React.useState(NEW_CHAT_TITLE);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [conversations, setConversations] = React.useState(INITIAL_CONVERSATIONS);

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const messageSequenceRef = React.useRef(1);
  const lastUserPromptRef = React.useRef("");

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const handleCopy = React.useCallback(async (content: string) => {
    await navigator.clipboard.writeText(content);
  }, []);

  const syncConversationTitle = React.useCallback((title: string) => {
    setConversations((prev) => [{ ...prev[0], title, updatedAt: new Date().toISOString() }, ...prev.slice(1)]);
  }, []);

  const handleNewChat = React.useCallback(() => {
    setChatTitle(NEW_CHAT_TITLE);
    setMessages(INITIAL_MESSAGES);
    setInputValue("");
    lastUserPromptRef.current = "";
    syncConversationTitle(NEW_CHAT_TITLE);
  }, [syncConversationTitle]);

  const handleSend = React.useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? inputValue).trim();
      if (!text || sending) return;

      lastUserPromptRef.current = text;
      const resolvedTitle = chatTitle === NEW_CHAT_TITLE ? text.slice(0, 48) : chatTitle;
      if (chatTitle === NEW_CHAT_TITLE) {
        setChatTitle(resolvedTitle);
        syncConversationTitle(resolvedTitle);
      }

      messageSequenceRef.current += 1;
      const userMessage: ChatMessageType = {
        id: `user-${messageSequenceRef.current}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };

      messageSequenceRef.current += 1;
      const assistantMessageId = `assistant-${messageSequenceRef.current}`;

      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      setInputValue("");
      setSending(true);

      try {
        await streamChat(
          {
            question: text,
            chatHistory: messages.map((item) => ({
              role: item.role,
              content: item.content,
              timestamp: item.createdAt,
            })),

          },
          (event) => {
            const eventType = (event as { type?: string }).type;
            if (eventType === "text") {
              const chunk = (event as { content?: string }).content ?? "";
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantMessageId ? { ...item, content: `${item.content}${chunk}` } : item,
                ),
              );
              return;
            }

            if ((event as { done?: boolean }).done) {
              const rawSources = (event as { sources?: unknown[] }).sources ?? [];
              const sources: ChatSourceItem[] = rawSources
                .map((source) => {
                  if (!source || typeof source !== "object") return null;
                  const candidate = source as Record<string, unknown>;
                  const urlRaw = candidate.url ?? candidate.link ?? candidate.source_url ?? candidate.file_url;
                  if (typeof urlRaw !== "string" || !urlRaw.trim()) return null;
                  const titleRaw = candidate.title ?? candidate.name ?? candidate.filename;
                  return {
                    title: typeof titleRaw === "string" && titleRaw.trim() ? titleRaw : urlRaw,
                    url: urlRaw,
                  };
                })
                .filter((item): item is ChatSourceItem => item !== null);

              if (sources.length > 0) {
                setMessages((prev) =>
                  prev.map((item) => (item.id === assistantMessageId ? { ...item, sources } : item)),
                );
              }
            }
          },
        );
      } catch (error) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantMessageId
              ? { ...item, content: `${ASSISTANT_ERROR_FALLBACK} (${String(error)})` }
              : item,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [chatTitle, inputValue, messages, sending, syncConversationTitle],
  );

  return (
    <div className={CHAT_LAYOUT_CLASSNAME}>
      <div className="flex h-full w-full">
        <Sidebar
          open={sidebarOpen}
          activeTitle={chatTitle}
          conversations={conversations}
          onNewChat={handleNewChat}
          onClose={() => setSidebarOpen(false)}
        />
        {sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            aria-label="Đóng sidebar"
          />
        )}

        <section className="relative z-10 flex min-w-0 flex-1 flex-col">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col border-x border-gray-200/70 bg-white/70 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-navy-900/60">
            <Header
              title={CHATBOT_PAGE_TITLE}
              subtitle={CHATBOT_PAGE_SUBTITLE}
              onToggleSidebar={() => setSidebarOpen(true)}
            />

            <div
              ref={listRef}
              onScroll={(event) => {
                const target = event.currentTarget;
                setShowScrollButton(target.scrollHeight - target.scrollTop - target.clientHeight > 160);
              }}
              className="flex-1 space-y-4 overflow-y-auto px-3 py-4 md:px-6"
            >
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={sending && message.id === messages[messages.length - 1]?.id}
                  onCopy={handleCopy}
                  onRegenerate={() => handleSend(lastUserPromptRef.current)}
                />
              ))}

              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2">
                  {CHAT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSend(suggestion)}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition hover:border-brand-300 hover:text-brand-500 dark:border-white/15 dark:bg-white/5 dark:text-gray-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ChatInput
              value={inputValue}
              sending={sending}
              placeholder={CHAT_INPUT_PLACEHOLDER}
              onChange={setInputValue}
              onSend={() => handleSend()}
            />

          </div>

          {showScrollButton && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              className="absolute bottom-24 right-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-lg transition hover:border-brand-300 hover:text-brand-500 dark:border-white/10 dark:bg-navy-800 dark:text-gray-300"
              aria-label="Cuộn xuống dưới"
            >
              <MdKeyboardArrowDown className="h-5 w-5" />
            </button>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatbotPage;

