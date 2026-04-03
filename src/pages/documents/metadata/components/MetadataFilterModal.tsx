import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import Switch from "@/components/switch";
import React from "react";

export interface MetadataFilters {
  enableIsActiveFilter: boolean;
  isActive: boolean;
}

interface MetadataFilterModalProps {
  open: boolean;
  value: MetadataFilters;
  onChange: (next: MetadataFilters) => void;
  onClear: () => void;
  onApply: () => void;
  onRequestClose: () => void;
}

const defaultFilters: MetadataFilters = {
  enableIsActiveFilter: false,
  isActive: true,
};

const MetadataFilterModal: React.FC<MetadataFilterModalProps> = ({
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
        <p className="text-navy-700 font-medium dark:text-white">
          Trạng thái hiển thị
        </p>
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={value.enableIsActiveFilter}
              onChange={(e) => handleToggleEnableFilter(e.target.checked)}
              className="text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer rounded border-gray-300"
            />
            <span className="text-navy-700 text-sm dark:text-white">
              Lọc theo trạng thái hiển thị
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
                {value.isActive ? "Hiển thị" : "Ẩn"}
              </span>
            </div>
          )}
        </div>
      </div>
    </AdvancedFilterModalBase>
  );
};

export { defaultFilters as metadataDefaultFilters };
export default MetadataFilterModal;
