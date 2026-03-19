import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import type { Role } from "@/types/users.ts";
import Switch from "@/components/switch";
import React from "react";
import RoleFilterSelector from "./RoleFilterSelector.tsx";

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
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  open,
  value,
  onChange,
  onClear,
  onApply,
  onRequestClose,
}) => {
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
    >
      <div>
        <p className="text-navy-700 font-medium dark:text-white">Vai trò</p>
      </div>
      <div className="col-span-3">
        <RoleFilterSelector
          value={value.roles}
          onChange={(roles) => onChange({ ...value, roles })}
        />
      </div>

      <div className="mt-4">
        <p className="text-navy-700 font-medium dark:text-white">
          Trạng thái hoạt động
        </p>
      </div>
      <div className="col-span-3 mt-4">
        <div className="flex items-center gap-3">
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
      </div>
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;

