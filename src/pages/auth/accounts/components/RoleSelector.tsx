import Tag from "@/components/tag/Tag.tsx";
import type { Role } from "@/types/users.ts";
import { RoleLabels } from "@/types/users.ts";
import React from "react";

interface RoleSelectorProps {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
  className?: string;
}

const ALL_ROLES: Role[] = ["student", "admin", "lecture"];

const RoleHexColors: Record<Role, string> = {
  student: "#3b82f6",
  admin: "#ef4444",
  lecture: "#eab308",
};

const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const options = ALL_ROLES.map((role) => ({
    value: role,
    label: RoleLabels[role],
  }));

  return (
    <Tag
      variant="selection"
      color={RoleHexColors[value]}
      value={value}
      options={options}
      onChange={(v) => onChange(v as Role)}
      disabled={disabled}
      className={className}
    >
      {RoleLabels[value]}
    </Tag>
  );
};

export default RoleSelector;
