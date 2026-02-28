import { Popover, PopoverContent, PopoverTrigger } from "@chakra-ui/popover";
import type { JSX } from "react";
const PopoverHorizon = (props: {
  trigger: JSX.Element;
  extra?: string;
  content: JSX.Element;
}) => {
  const { extra, trigger, content } = props;
  return (
    <Popover>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent
        className={`shadow-shadow-500 dark:bg-navy-700! w-max rounded-xl bg-white px-4 py-3 text-sm shadow-xl dark:shadow-none ${extra}`}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
};

export default PopoverHorizon;
