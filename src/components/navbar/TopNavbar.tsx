import { ChatbotNavLogo } from "@/components/navbar/ChatbotNavLogo";
import { TopNavLinks } from "@/components/navbar/TopNavLinks";
import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
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
};

const glassClass =
  "border border-white/70 bg-white/80 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.28),0_4px_18px_-8px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/15 dark:bg-navy-900/82 dark:shadow-[0_14px_48px_-14px_rgba(0,0,0,0.72),0_6px_22px_-10px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.1)]";

const navPillClass = `flex h-12 w-fit max-w-[min(100%,calc(100vw-8rem))] items-center overflow-visible rounded-full px-4 ${glassClass}`;

const mobileMenuPanelClass = `mt-2 w-fit max-w-[min(100%,calc(100vw-2rem))] rounded-3xl p-3 ${glassClass}`;

/** Fixed navbar height (pt-3 + h-12 + pb-2) */
export const TOP_NAVBAR_HEIGHT = "4.25rem";

/** Page content padding below fixed navbar */
export const TOP_NAVBAR_PAGE_PADDING_CLASS = "pt-[5.5rem]";
export const TOP_NAVBAR_CHATBOT_PADDING_CLASS = "pt-[5.25rem]";

export function TopNavbar({
  routes,
  chatbotHref = "/admin/chatbot",
  onNavigateStart,
  includeChatbotLink = false,
  showHistoryToggle = false,
  historyOpen = false,
  onToggleHistory,
}: TopNavbarProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center overflow-visible bg-transparent px-4 pt-3 pb-2">
      <div className="pointer-events-auto relative flex w-full max-w-full flex-col items-center overflow-visible">
        {showHistoryToggle ? (
          <button
            type="button"
            onClick={onToggleHistory}
            aria-label={historyOpen ? "Đóng lịch sử chat" : "Mở lịch sử chat"}
            className="hover:text-brand-500 dark:bg-navy-900/60 dark:hover:bg-navy-800/80 absolute top-1/2 left-0 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/60 text-gray-600 shadow-md backdrop-blur-xl transition-colors hover:bg-white/80 lg:hidden dark:border-white/10 dark:text-gray-300 dark:hover:text-white"
          >
            <MdHistory className="h-5 w-5" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
          className="hover:text-brand-500 dark:bg-navy-900/60 dark:hover:bg-navy-800/80 absolute top-1/2 right-0 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/60 text-gray-600 shadow-md backdrop-blur-xl transition-colors hover:bg-white/80 lg:hidden dark:border-white/10 dark:text-gray-300 dark:hover:text-white"
        >
          {mobileMenuOpen ? (
            <FiX className="h-5 w-5" />
          ) : (
            <FiMenu className="h-5 w-5" />
          )}
        </button>

        <div className="flex items-center gap-5">
          <div className={`${navPillClass} hidden lg:flex`}>
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

        {mobileMenuOpen ? (
          <div className={`${mobileMenuPanelClass} lg:hidden`}>
            <TopNavLinks
              routes={routes}
              variant="vertical"
              onNavigateStart={onNavigateStart}
              onNavigate={closeMobileMenu}
              includeChatbotLink={includeChatbotLink}
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default TopNavbar;
