import { Tooltip as AntdTooltip } from "antd";
import type { ReactNode } from "react";
import React from "react";

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  parentClassName?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  label,
  children,
  className,
  parentClassName,
}) => {
  const wrapperClass = className !== undefined ? className : "inline-flex";

  return (
    <AntdTooltip
      title={
        <div
          className={`font-momo dark:bg-navy-900 text-navy-700 w-max max-w-none rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs whitespace-nowrap shadow-xl dark:border-white/10 dark:text-white ${parentClassName}`}
        >
          {label}
        </div>
      }
      color="transparent"
      zIndex={99999}
      arrow={false}
      overlayStyle={{ maxWidth: "none" }}
      overlayInnerStyle={{
        padding: 0,
        boxShadow: "none",
        backgroundColor: "transparent",
      }}
    >
      <span className={wrapperClass}>{children}</span>
    </AntdTooltip>
  );
};

export default Tooltip;
