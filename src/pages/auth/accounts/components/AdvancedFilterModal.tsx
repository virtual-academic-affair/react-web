import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import { FormRow } from "@/components/layouts/DetailFormLayout.tsx";
import Tag from "@/components/tag/Tag";
import type { Role } from "@/types/users.ts";
import { RoleColors, RoleLabels } from "@/types/users.ts";
import Switch from "@/components/switch";
import React from "react";

export interface AccountFilters {
  roles: Role[];
  enableIsActiveFilter: boolean;
  isActive: boolean;
}

interface AdvancedFilterModalProps {
  open: boolean;
  value: AccountFilters;
  onChange: (next: AccountFilters) => void;
  onClear: () => void;
  onApply: () => void;
  onRequestClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  open,
  value,
  onChange,
  onClear,
  onApply,
  onRequestClose,
  anchorRef,
}) => {
  const roles: Role[] = ["student", "admin", "lecture"];

  const handleToggleRole = (role: Role) => {
    const nextRoles = value.roles.includes(role)
      ? value.roles.filter((item) => item !== role)
      : [...value.roles, role];
    onChange({ ...value, roles: nextRoles });
  };

  const handleToggleEnableFilter = (checked: boolean) => {
    onChange({ ...value, enableIsActiveFilter: checked });
  };

  const handleToggleIsActive = (checked: boolean) => {
    onChange({ ...value, isActive: checked });
  };

  return (
    <AdvancedFilterModalBase
      open={open}
      onClear={onClear}
      onApply={onApply}
      onRequestClose={onRequestClose}
      anchorRef={anchorRef}
    >
      <FormRow label="Vai trò" className="md:col-span-4">
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => {
            const active = value.roles.includes(role);
            const colors = RoleColors[role];
            return (
              <Tag
                key={role}
                color={active ? colors.hex : "#6b7280"}
                onClick={() => handleToggleRole(role)}
                className={active ? "" : "opacity-80"}
              >
                {RoleLabels[role]}
              </Tag>
            );
          })}
        </div>
      </FormRow>

      <FormRow label="Trạng thái hoạt động" className="md:col-span-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={value.enableIsActiveFilter}
              onChange={(e) => handleToggleEnableFilter(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-navy-700 text-sm dark:text-white">
              Lọc theo trạng thái hoạt động
            </span>
          </label>
          {value.enableIsActiveFilter && (
            <div className="flex items-center gap-2">
              <Switch
                checked={value.isActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleToggleIsActive(e.target.checked)
                }
              />
              <span className="text-navy-700 text-sm dark:text-white">
                {value.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
              </span>
            </div>
          )}
        </div>
      </FormRow>
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;

