import { useAui, useAuiState } from "@assistant-ui/react";
import { MdAdd } from "react-icons/md";

export function ChatbotThreadToolbar() {
  const aui = useAui();
  const mainThreadId = useAuiState((s) => s.threads.mainThreadId);
  const threadItems = useAuiState((s) => s.threads.threadItems);

  const selectable = threadItems.filter(
    (it) => it.status === "regular" || it.status === "new",
  );

  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="chatbot-thread-select">
        Chọn hội thoại
      </label>
      <select
        id="chatbot-thread-select"
        className="min-w-0 max-w-full flex-1 rounded-xl border border-[#e3e3e3] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 dark:border-[#3c4043] dark:bg-[#1e1f20] dark:text-[#e3e3e3]"
        value={mainThreadId}
        onChange={(e) => {
          aui.threads().switchToThread(e.target.value);
        }}
      >
        {selectable.map((it) => (
          <option key={it.id} value={it.id}>
            {it.title?.trim() || "Không có tiêu đề"}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e3e3e3] bg-white px-3 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-gray-50 dark:border-[#3c4043] dark:bg-[#1e1f20] dark:text-[#e3e3e3] dark:hover:bg-[#2d2f31]"
        onClick={() => {
          void aui.threads().switchToNewThread();
        }}
      >
        <MdAdd className="h-4 w-4" aria-hidden />
        Cuộc mới
      </button>
    </div>
  );
}
