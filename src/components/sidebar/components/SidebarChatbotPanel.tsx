import Tooltip from "@/components/tooltip/Tooltip.tsx";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { useMemo, useState, type JSX } from "react";
import {
  MdAdd,
  MdChat,
  MdChatBubbleOutline,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { Link, useLocation } from "react-router-dom";

const CHATBOT_HREF = "/admin/chatbot";

const sidebarChildLink = (active: boolean) =>
  `mt-1 ml-1 block max-w-full truncate rounded-lg py-0.5 text-base transition-colors ${
    active
      ? "font-medium text-navy-700 dark:text-white"
      : "font-normal text-gray-600 dark:text-gray-300"
  } `;

const threadListContainerClass = (listOpen: boolean) =>
  `mt-1.5 ml-4 flex flex-col overflow-hidden transition-all duration-200 ease-in-out ${
    listOpen
      ? "mt-1 max-h-[4800px] gap-1 opacity-100"
      : "mt-0 max-h-0 gap-0 opacity-0"
  }`;

function SidebarChatbotThreadList({ listOpen }: { listOpen: boolean }) {
  return (
    <ThreadListPrimitive.Root className="contents">
      <div
        id="sidebar-chatbot-thread-list"
        className={threadListContainerClass(listOpen)}
      >
        <div className="min-w-0 pr-4">
          <ThreadListPrimitive.New className="flex w-full cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-left text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10">
            <MdAdd
              className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400"
              aria-hidden
            />
            <span>Cuộc trò chuyện mới</span>
          </ThreadListPrimitive.New>
        </div>
        <ThreadListPrimitive.Items>
          {({ threadListItem }) => (
            <div key={threadListItem.id} className="relative min-w-0 pr-4">
              <ThreadListItemPrimitive.Root>
                <ThreadListItemPrimitive.Trigger className="mt-1 ml-1 flex w-full max-w-full cursor-pointer items-start gap-2 truncate rounded-lg py-0.5 text-left text-base font-normal text-gray-600 transition-colors hover:bg-gray-50 data-[active=true]:font-medium data-[active=true]:text-navy-700 dark:text-gray-300 dark:hover:bg-white/5 dark:data-[active=true]:text-white">
                  <MdChatBubbleOutline
                    className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">
                    <ThreadListItemPrimitive.Title
                      fallback={threadListItem.title ?? "Không có tiêu đề"}
                    />
                  </span>
                </ThreadListItemPrimitive.Trigger>
              </ThreadListItemPrimitive.Root>
            </div>
          )}
        </ThreadListPrimitive.Items>
      </div>
    </ThreadListPrimitive.Root>
  );
}

export function SidebarChatbotPanel(props: {
  collapsed?: boolean;
}): JSX.Element {
  const { collapsed = false } = props;
  const location = useLocation();

  const onChatbotPath = useMemo(
    () =>
      location.pathname === CHATBOT_HREF ||
      location.pathname.startsWith(`${CHATBOT_HREF}/`),
    [location.pathname],
  );

  const sectionActive = onChatbotPath;

  const [listOpen, setListOpen] = useState(true);

  if (collapsed) {
    return (
      <li className="mb-4">
        <Tooltip label="Chatbot" className="block w-full">
          <Link
            to={CHATBOT_HREF}
            className={`my-0.75 flex w-full items-center justify-center px-1 py-1 text-center text-[11px] leading-tight ${
              onChatbotPath
                ? "text-brand-500 font-medium dark:text-white"
                : "font-normal text-gray-600 dark:text-gray-300"
            }`}
          >
            Chat
            <br />
            bot
          </Link>
        </Tooltip>
      </li>
    );
  }

  return (
    <li className="mb-4">
      <button
        type="button"
        onClick={() => setListOpen((o) => !o)}
        className="my-0.75 flex w-full items-center px-4 py-0.5 text-left"
        aria-expanded={listOpen}
        aria-controls="sidebar-chatbot-thread-list"
      >
        <span
          className={`inline-flex shrink-0 [&>svg]:h-5 [&>svg]:w-5 ${
            sectionActive
              ? "text-brand-500 dark:text-white"
              : "font-medium text-gray-600"
          }`}
        >
          <MdChat className="h-6 w-6" aria-hidden />
        </span>
        <p
          className={`ml-4 flex flex-1 text-base leading-1 font-medium ${
            sectionActive
              ? "text-navy-700 dark:text-white"
              : "font-medium text-gray-600"
          }`}
        >
          DS hội thoại
        </p>
        <span
          className={`ml-auto shrink-0 text-gray-500 transition-transform duration-200 ease-in-out dark:text-gray-300 ${
            listOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <MdKeyboardArrowDown className="h-5 w-5" aria-hidden />
        </span>
      </button>

      {onChatbotPath ? (
        <SidebarChatbotThreadList listOpen={listOpen} />
      ) : (
        <div
          id="sidebar-chatbot-thread-list"
          className={threadListContainerClass(listOpen)}
        >
          <div className="min-w-0 pr-4">
            <Link to={CHATBOT_HREF} className={sidebarChildLink(false)}>
              Mở trang Chatbot để xem và tạo hội thoại
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

export default SidebarChatbotPanel;
