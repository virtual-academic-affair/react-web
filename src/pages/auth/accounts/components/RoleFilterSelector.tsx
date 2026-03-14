import type { Role } from "@/types/users.ts";
import { RoleColors, RoleLabels } from "@/types/users.ts";
import React from "react";

interface RoleFilterSelectorProps {
  value: Role[];
  onChange: (roles: Role[]) => void;
  className?: string;
}

const RoleFilterSelector: React.FC<RoleFilterSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const roles: Role[] = ["student", "admin", "lecture"];

  const toggle = (role: Role) => {
    onChange(
      value.includes(role) ? value.filter((r) => r !== role) : [...value, role],
    );
  };

  return (
    <div className={className ?? "flex flex-wrap gap-2"}>
      {roles.map((role) => {
        const active = value.includes(role);
        const colors = RoleColors[role];
        return (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              active
                ? `${colors.bg} ${colors.text} border-transparent`
                : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
            }`}
          >
            {RoleLabels[role]}
          </button>
        );
      })}
    </div>
  );
};

export default RoleFilterSelector;
