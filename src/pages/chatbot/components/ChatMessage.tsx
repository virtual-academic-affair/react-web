import React from "react";
import { MdCheck, MdContentCopy, MdRefresh } from "react-icons/md";
import type { ChatMessage as ChatMessageType } from "../types";
import { formatMessageTime, isImageMessage, isUrl, parseContentSegments, splitTextAndLinks } from "../utils";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming: boolean;
  onCopy: (content: string) => void;
  onRegenerate: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming, onCopy, onRegenerate }) => {
  const isAssistant = message.role === "assistant";
  const parsedSegments = parseContentSegments(message.content);
  const [copied, setCopied] = React.useState(false);

  const handleCopyClick = async () => {
    try {
      await onCopy(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article
      className={`chat-message-enter group flex ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-92p rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm md:max-w-80p lg:max-w-72p ${
          isAssistant
            ? "border border-gray-200/70 bg-white text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
            : "bg-brand-500 text-white"
        }`}
      >
        {isAssistant && isStreaming ? (
          <div className="space-y-2">
            {message.content ? (
              <p className="wrap-break-word whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="space-y-2">
                <div className="h-2 w-36 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
                <div className="h-2 w-56 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
              </div>
            )}
            <div className="h-2 w-28 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
          </div>
        ) : isImageMessage(message.content) ? (
          <img
            src={message.content.trim()}
            alt="chat content"
            className="max-h-80 rounded-xl object-cover"
          />
        ) : (
          <div className="space-y-3">
            {parsedSegments.map((segment, index) => {
              if (segment.type === "code") {
                return (
                  <pre
                    key={`code-${index}`}
                    className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-900/95 p-3 text-xs text-gray-100"
                  >
                    <code>{segment.content}</code>
                  </pre>
                );
              }

              return (
                <p key={`text-${index}`} className="wrap-break-word whitespace-pre-wrap">
                  {splitTextAndLinks(segment.content).map((part, partIndex) =>
                    isUrl(part) ? (
                      <a
                        key={`link-${partIndex}`}
                        href={part}
                        target="_blank"
                        rel="noreferrer"
                        className={`underline underline-offset-2 ${
                          isAssistant
                            ? "text-brand-500 hover:text-brand-600"
                            : "text-white/90 hover:text-white"
                        }`}
                      >
                        {part}
                      </a>
                    ) : (
                      <React.Fragment key={`span-${partIndex}`}>{part}</React.Fragment>
                    ),
                  )}
                </p>
              );
            })}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-3">
          <span
            className={`text-[11px] ${isAssistant ? "text-gray-400 dark:text-gray-400" : "text-white/80"}`}
          >
            {formatMessageTime(message.createdAt)}
          </span>

          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopyClick}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                copied
                  ? "border-green-200 bg-green-50 text-green-600 dark:border-green-500/40 dark:bg-green-500/15 dark:text-green-300"
                  : "border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/10 dark:hover:bg-white/10"
              }`}
              aria-label={copied ? "Đã sao chép" : "Sao chép nội dung"}
              title={copied ? "Đã sao chép" : "Sao chép"}
            >
              {copied ? <MdCheck className="h-3.5 w-3.5" /> : <MdContentCopy className="h-3.5 w-3.5" />}
            </button>
            {isAssistant && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-gray-500 transition hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/10 dark:hover:bg-white/10"
                aria-label="Tạo lại phản hồi"
              >
                <MdRefresh className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ChatMessage;

