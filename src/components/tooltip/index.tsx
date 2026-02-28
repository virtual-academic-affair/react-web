import { Tooltip } from "@chakra-ui/tooltip";
import type { JSX } from "react";
const TooltipHorizon = (props: {
  extra: string;
  trigger: JSX.Element;
  content: JSX.Element;
  placement: "left" | "right" | "top" | "bottom";
}) => {
  const { extra, trigger, content, placement } = props;
  return (
    <Tooltip
      placement={placement}
      label={content}
      className={`shadow-shadow-500 dark:bg-navy-700! w-max rounded-xl bg-white px-4 py-3 text-sm shadow-xl dark:shadow-none ${extra}`}
    >
      {trigger}
    </Tooltip>
  );
};

export default TooltipHorizon;
