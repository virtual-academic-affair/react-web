import Tooltip from "@/components/tooltip/Tooltip";
import vaaIcon from "@/assets/img/logo/vaa-icon.png";
import { setChatbotReturnPath } from "@/utils/chatbotReturn.util";
import { Link, useLocation } from "react-router-dom";

type ChatbotNavLogoProps = {
  chatbotHref?: string;
  onNavigateStart?: () => void;
};

export function ChatbotNavLogo({
  chatbotHref = "/admin/chatbot",
  onNavigateStart,
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
        className={`chatbot-nav-logo ${onChatbotPath ? "chatbot-nav-logo-active" : ""}`}
        aria-label="Chatbot"
        aria-current={onChatbotPath ? "page" : undefined}
      >
        <img src={vaaIcon} alt="" className="chatbot-nav-logo-icon" />
      </Link>
    </Tooltip>
  );
}

export default ChatbotNavLogo;
