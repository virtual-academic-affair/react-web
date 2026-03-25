import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import Switch from "@/components/switch";
import React from "react";

export interface MetadataFilters {
  enableActiveOnlyFilter: boolean;
  activeOnly: boolean;
}

interface AdvancedFilterModalProps {
  open: boolean;
  value: MetadataFilters;
  onChange: (next: MetadataFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onRequestClose: () => void;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  open,
  value,
  onChange,
  onApply,
  onClear,
  onRequestClose,
}) => {
  const handleToggleEnableFilter = (checked: boolean) => {
    if (checked) {
      onChange({ ...value, enableActiveOnlyFilter: true, activeOnly: true });
    } else {
      onChange({ ...value, enableActiveOnlyFilter: false, activeOnly: true });
    }
  };

  const handleToggleActiveOnly = (checked: boolean) => {
    onChange({ ...value, activeOnly: checked });
  };

  return (
    <AdvancedFilterModalBase
      open={open}
      onClear={onClear}
      onApply={onApply}
      onRequestClose={onRequestClose}
    >
      <div>
        <p className="text-navy-700 font-medium dark:text-white">
          Trạng thái hoạt động
        </p>
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={value.enableActiveOnlyFilter}
              onChange={(e) => handleToggleEnableFilter(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-navy-700 text-sm dark:text-white">
              Lọc theo trạng thái hoạt động
            </span>
          </label>
          {value.enableActiveOnlyFilter && (
            <div className="flex items-center gap-2">
              <Switch
                checked={value.activeOnly}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleToggleActiveOnly(e.target.checked)
                }
              />
              <span className="text-navy-700 text-sm dark:text-white">
                {value.activeOnly ? "Hoạt động" : "Tạm dừng"}
              </span>
            </div>
          )}
        </div>
      </div>
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;
