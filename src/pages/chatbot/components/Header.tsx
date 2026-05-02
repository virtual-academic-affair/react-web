import React from "react";
import { MdMenu } from "react-icons/md";

interface HeaderProps {
  title: string;
  subtitle: string;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200/70 bg-white/85 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-navy-900/75 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-brand-300 hover:text-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 md:hidden"
          aria-label="Mở lịch sử trò chuyện"
        >
          <MdMenu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-navy-700 dark:text-white md:text-lg">{title}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

    </header>
  );
};

export default Header;

