import { ChatbotNavLogo } from "@/components/navbar/ChatbotNavLogo";
import { TopNavLinks } from "@/components/navbar/TopNavLinks";
import { MOBILE_MENU_BUTTON_CLASS } from "@/constants/mobileLayout";
import { useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import { LuX } from "react-icons/lu";
import { MdHistory } from "react-icons/md";
import { useLocation } from "react-router-dom";

type TopNavbarProps = {
  routes: RoutesType[];
  homeHref?: string;
  chatbotHref?: string;
  onNavigateStart?: () => void;
  includeChatbotLink?: boolean;
  showHistoryToggle?: boolean;
  historyOpen?: boolean;
  onToggleHistory?: () => void;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
};

const glassClass =
  "border border-white/70 bg-white/80 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.28),0_4px_18px_-8px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/15 dark:bg-navy-900/82 dark:shadow-[0_14px_48px_-14px_rgba(0,0,0,0.72),0_6px_22px_-10px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.1)]";

const navPillClass = `flex h-12 w-fit max-w-[min(100%,calc(100vw-8rem))] items-center overflow-visible rounded-full px-4 ${glassClass}`;

/** Fixed navbar height (pt-3 + h-12 + pb-2) */
export const TOP_NAVBAR_HEIGHT = "4.25rem";

/** Page content padding below fixed navbar */
export const TOP_NAVBAR_PAGE_PADDING_CLASS = "pt-[5.5rem]";
export const TOP_NAVBAR_CHATBOT_PADDING_CLASS = "pt-[5.25rem]";

const mobileNavRowClass =
  "pointer-events-auto fixed top-3 left-3 z-[60] flex flex-row items-center gap-2 lg:hidden";

export function TopNavbar({
  routes,
  chatbotHref = "/admin/chatbot",
  onNavigateStart,
  includeChatbotLink = false,
  showHistoryToggle = false,
  historyOpen = false,
  onToggleHistory,
  mobileMenuOpen: mobileMenuOpenProp,
  onToggleMobileMenu,
}: TopNavbarProps) {
  const location = useLocation();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const isMenuControlled = onToggleMobileMenu !== undefined;
  const mobileMenuOpen = isMenuControlled
    ? (mobileMenuOpenProp ?? false)
    : internalMenuOpen;

  useEffect(() => {
    if (isMenuControlled) return;
    setInternalMenuOpen(false);
  }, [isMenuControlled, location.pathname]);

  const handleToggleMobileMenu = () => {
    if (onToggleMobileMenu) {
      onToggleMobileMenu();
      return;
    }
    setInternalMenuOpen((current) => !current);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center overflow-visible bg-transparent px-4 pt-3 pb-2">
        <div className={mobileNavRowClass}>
          <button
            type="button"
            onClick={handleToggleMobileMenu}
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileMenuOpen}
            className={MOBILE_MENU_BUTTON_CLASS}
          >
            {mobileMenuOpen ? (
              <LuX className="h-5 w-5" />
            ) : (
              <FiMenu className="h-5 w-5" />
            )}
          </button>

          <ChatbotNavLogo
            chatbotHref={chatbotHref}
            onNavigateStart={onNavigateStart}
            variant="toolbar"
          />
        </div>

        <div className="pointer-events-auto relative hidden w-full max-w-full flex-col items-center overflow-visible lg:flex">
          {showHistoryToggle ? (
          <button
            type="button"
            onClick={onToggleHistory}
            aria-label={historyOpen ? "Đóng lịch sử chat" : "Mở lịch sử chat"}
            className={`absolute top-1/2 left-0 -translate-y-1/2 ${MOBILE_MENU_BUTTON_CLASS}`}
          >
            <MdHistory className="h-5 w-5" />
          </button>
          ) : null}

          <div className="flex items-center gap-5">
          <div className={navPillClass}>
            <nav className="min-w-0 items-center overflow-visible">
              <TopNavLinks
                routes={routes}
                embedded
                onNavigateStart={onNavigateStart}
                includeChatbotLink={includeChatbotLink}
              />
            </nav>
          </div>

          <ChatbotNavLogo
            chatbotHref={chatbotHref}
            onNavigateStart={onNavigateStart}
          />
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
