import Tag from "@/components/tag/Tag";
import {
  RegistrationActionColors,
  type RegistrationAction,
} from "@/types/classRegistration";
import type { FC } from "react";

/** Cùng nhãn badge ngắn với danh sách yêu cầu đăng ký (Gmail deeplink). */
export const REGISTRATION_ACTION_SHORT_LABEL: Record<
  RegistrationAction,
  string
> = {
  register: "Đăng ký",
  cancel: "Hủy",
  requestOpen: "Mở lớp",
};

const ALL_ACTIONS: RegistrationAction[] = ["register", "cancel", "requestOpen"];

function optionColorsFor(
  actions: RegistrationAction[],
): Record<string, string> {
  const m: Record<string, string> = {};
  for (const a of actions) {
    m[a] = RegistrationActionColors[a].hex;
  }
  return m;
}

interface RegistrationActionTagProps {
  value: RegistrationAction;
  onChange?: (action: RegistrationAction) => void;
  /** Mặc định cả 3 loại; form thêm mới thường truyền `['register','cancel']`. */
  allowedActions?: RegistrationAction[];
  className?: string;
  disabled?: boolean;
}

const RegistrationActionTag: FC<RegistrationActionTagProps> = ({
  value,
  onChange,
  allowedActions = ALL_ACTIONS,
  className,
  disabled,
}) => {
  const options = allowedActions.map((a) => ({
    value: a,
    label: REGISTRATION_ACTION_SHORT_LABEL[a],
  }));
  const optionColors = optionColorsFor(allowedActions);

  if (!onChange) {
    return (
      <Tag
        color={RegistrationActionColors[value].hex}
        interactive={false}
        className={className}
      >
        {REGISTRATION_ACTION_SHORT_LABEL[value]}
      </Tag>
    );
  }

  return (
    <Tag
      variant="selection"
      value={value}
      color={RegistrationActionColors[value].hex}
      options={options}
      optionColors={optionColors}
      disabled={disabled}
      className={className}
      onChange={(v) => onChange(v as RegistrationAction)}
    >
      {REGISTRATION_ACTION_SHORT_LABEL[value]}
    </Tag>
  );
};

export default RegistrationActionTag;
