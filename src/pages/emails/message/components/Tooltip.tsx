import type { ReactNode } from "react";
import React from "react";

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ label, children, className }) => {
  const wrapperClass =
    "group relative inline-flex " + (className ? className : "");

  return (
    <div className={wrapperClass}>
      {children}
      <div className="text-navy-700 dark:bg-navy-900 pointer-events-none invisible absolute top-full left-1/2 z-50 mt-1 w-max max-w-md -translate-x-1/2 rounded-2xl border border-white bg-white px-3 py-1 text-left text-xs whitespace-normal opacity-0 shadow-lg group-hover:visible group-hover:opacity-100 dark:border-transparent dark:text-white">
        {label}
      </div>
    </div>
  );
};

export default Tooltip;
