import vaaIcon from "@/assets/img/logo/vaa-icon.png";
import Tooltip from "@/components/tooltip/Tooltip";
import { setChatbotReturnPath } from "@/utils/chatbotReturn.util";
import { Link, useLocation } from "react-router-dom";

type ChatbotNavLogoProps = {
  chatbotHref?: string;
  onNavigateStart?: () => void;
  variant?: "default" | "toolbar";
};

export function ChatbotNavLogo({
  chatbotHref = "/admin/chatbot",
  onNavigateStart,
  variant = "default",
}: ChatbotNavLogoProps) {
  const location = useLocation();

  const onChatbotPath =
    location.pathname === chatbotHref ||
    location.pathname.startsWith(`${chatbotHref}/`);

  const handleClick = () => {
    if (!onChatbotPath) {
      setChatbotReturnPath(
        `${location.pathname}${location.search}${location.hash}`,
      );
      onNavigateStart?.();
    }
  };

  return (
    <Tooltip label="Chatbot" placement="bottom">
      <Link
        to={chatbotHref}
        onClick={handleClick}
        className={`chatbot-nav-logo ${
          variant === "toolbar" ? "chatbot-nav-logo--toolbar" : ""
        } ${onChatbotPath ? "chatbot-nav-logo-active" : ""}`}
        aria-label="Chatbot"
        aria-current={onChatbotPath ? "page" : undefined}
      >
        <img
          src={vaaIcon}
          alt=""
          className={
            variant === "toolbar"
              ? "chatbot-nav-logo-icon chatbot-nav-logo-icon--toolbar"
              : "chatbot-nav-logo-icon"
          }
        />
      </Link>
    </Tooltip>
  );
}

export default ChatbotNavLogo;
