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
  label: string;
}

/** Nút hàng footer deeplink — một dòng ellipsis. */
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
    <div className="flex min-w-0 flex-1">
      <button
        type="button"
        className={btnClass}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="block min-w-0 overflow-hidden text-center text-ellipsis whitespace-nowrap">
          {label}
        </span>
      </button>
    </div>
  );
};

export default DeeplinkPillActionButton;
