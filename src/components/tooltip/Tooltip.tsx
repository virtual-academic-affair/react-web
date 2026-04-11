import { Tooltip as AntdTooltip } from "antd";
import type { TooltipPlacement } from "antd/es/tooltip";
import type { ReactNode } from "react";
import React from "react";

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  parentClassName?: string;
  /** Ant Design placement — use "topLeft" when wrapping full-width truncated text so the bubble anchors to the text start rather than the center of the trigger. */
  placement?: TooltipPlacement;
  /** When true, long text wraps to multiple lines instead of overflowing on one line. */
  wrap?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  label,
  children,
  className,
  parentClassName,
  placement = "top",
  wrap = false,
}) => {
  const wrapperClass = className !== undefined ? className : "inline-flex";

  return (
    <AntdTooltip
      title={
        <div
          className={`font-momo dark:bg-navy-900 text-navy-700 rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-xs shadow-xl dark:border-white/10 dark:text-white ${
            wrap
              ? "break-word max-w-[280px] whitespace-normal"
              : "w-max max-w-none whitespace-nowrap"
          } ${parentClassName ?? ""}`}
        >
          {label}
        </div>
      }
      placement={placement}
      color="transparent"
      zIndex={99999}
      arrow={false}
      overlayStyle={{ maxWidth: wrap ? "280px" : "none" }}
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
