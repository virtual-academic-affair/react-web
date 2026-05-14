import Tooltip from "@/components/tooltip/Tooltip.tsx";
import { type JSX } from "react";
import { MdChat } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";

const CHATBOT_HREF = "/admin/chatbot";

export function SidebarChatbotPanel(props: {
  collapsed?: boolean;
}): JSX.Element {
  const { collapsed = false } = props;
  const location = useLocation();

  const onChatbotPath =
    location.pathname === CHATBOT_HREF ||
    location.pathname.startsWith(`${CHATBOT_HREF}/`);

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
      <Link
        to={CHATBOT_HREF}
        className="my-0.75 flex w-full items-center px-4 py-0.5 text-left"
      >
        <span
          className={`inline-flex shrink-0 [&>svg]:h-5 [&>svg]:w-5 ${
            onChatbotPath
              ? "text-brand-500 dark:text-white"
              : "font-medium text-gray-600"
          }`}
        >
          <MdChat className="h-6 w-6" aria-hidden />
        </span>
        <p
          className={`ml-4 flex flex-1 text-base leading-1 font-medium ${
            onChatbotPath
              ? "text-navy-700 dark:text-white"
              : "font-medium text-gray-600"
          }`}
        >
          Chatbot
        </p>
      </Link>
    </li>
  );
}

export default SidebarChatbotPanel;
