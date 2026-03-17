import type { Role } from "@/types/users.ts";
import { RoleColors, RoleLabels } from "@/types/users.ts";
import React from "react";
import { MdExpandMore } from "react-icons/md";

interface RoleSelectorProps {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
  className?: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const roles: Role[] = ["student", "admin", "lecture"];
  const currentColors = RoleColors[value];
  const isFullWidth = className?.includes("w-full");

  return (
    <div className={className ?? "relative inline-flex"}>
      {/* Visible tag */}
      <span
        className={`${
          isFullWidth ? "flex" : "inline-flex"
        } items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
          currentColors.bg
        } ${currentColors.text} ${
          disabled ? "cursor-not-allowed opacity-50" : "border-transparent"
        } ${isFullWidth ? "w-full justify-between" : ""}`}
      >
        <span>{RoleLabels[value]}</span>
        <MdExpandMore className="h-3.5 w-3.5 text-inherit" />
      </span>

      {/* Native browser select overlaid on top (fully transparent) */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Role)}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {RoleLabels[role]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RoleSelector;
