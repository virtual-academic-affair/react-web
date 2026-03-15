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
      {/* Tooltip Content Wrapper */}
      <div className="invisible absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
        <div className="text-navy-700 dark:bg-navy-900 w-max max-w-md rounded-2xl border border-white bg-white px-3 py-2 text-left text-xs whitespace-normal shadow-lg dark:border-transparent dark:text-white">
          {label}
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
