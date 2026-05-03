import Tooltip from "@/components/tooltip/Tooltip.tsx";
import type { FC } from "react";
import {
  deeplinkBtnPrimary,
  deeplinkBtnSecondary,
} from "./deeplinkButtonClasses";

const pillRowBtnBase =
  "min-w-0 flex-1 justify-center !rounded-full px-1 text-xs font-medium";

type Variant = "primary" | "secondary";

interface Props {
  variant: Variant;
  disabled?: boolean;
  onClick: () => void;
  /** Hiển thị + tooltip (đầy đủ khi bị cắt …). */
  label: string;
}

/** Nút hàng footer deeplink — một dòng ellipsis, hover xem đủ chữ. */
const DeeplinkPillActionButton: FC<Props> = ({
  variant,
  disabled,
  onClick,
  label,
}) => {
  const btnClass =
    variant === "primary"
      ? `${deeplinkBtnPrimary} ${pillRowBtnBase} w-full`
      : `${deeplinkBtnSecondary} ${pillRowBtnBase} w-full`;

  return (
    <Tooltip label={label} className="flex min-w-0 flex-1" placement="top" wrap>
      <button
        type="button"
        className={btnClass}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-center">
          {label}
        </span>
      </button>
    </Tooltip>
  );
};

export default DeeplinkPillActionButton;
