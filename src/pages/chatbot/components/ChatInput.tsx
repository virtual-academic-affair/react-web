import React from "react";
import { MdSend } from "react-icons/md";

interface ChatInputProps {
  value: string;
  sending: boolean;
  placeholder: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, sending, placeholder, onChange, onSend }) => {
  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    const element = textAreaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <div className="sticky bottom-0 border-t border-gray-200/80 bg-white/85 p-3 backdrop-blur dark:border-white/10 dark:bg-navy-900/80 md:p-4">
      <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/5">
        <textarea
          ref={textAreaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          className="max-h-50 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-400"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || sending}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          aria-label="Gửi tin nhắn"
        >
          <MdSend className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;

