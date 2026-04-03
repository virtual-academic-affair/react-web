import type { ReactNode } from "react";
import React from "react";
import { Tooltip as AntdTooltip } from "antd";

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ label, children, className }) => {
  const wrapperClass = className !== undefined ? className : "inline-flex";

  return (
    <AntdTooltip
      title={
        <div className="w-max max-w-none font-momo rounded-full border border-gray-100 dark:border-white/10 bg-white dark:bg-navy-900 text-navy-700 dark:text-white px-3 py-1.5 text-xs shadow-xl whitespace-nowrap">
          {label}
        </div>
      }
      color="transparent"
      zIndex={99999}
      arrow={false}
      overlayStyle={{ maxWidth: "none" }}
      overlayInnerStyle={{ padding: 0, boxShadow: "none", backgroundColor: "transparent" }}
    >
      <span className={wrapperClass}>{children}</span>
    </AntdTooltip>
  );
};

export default Tooltip;
