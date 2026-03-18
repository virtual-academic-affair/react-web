import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import Switch from "@/components/switch";
import React from "react";

export interface CancelReasonFilters {
  enableIsActiveFilter: boolean; // Checkbox để bật/tắt filter
  isActive: boolean; // true = hiển thị, false = không hiển thị (chỉ dùng khi enableIsActiveFilter = true)
}

interface AdvancedFilterModalProps {
  open: boolean;
  value: CancelReasonFilters;
  onChange: (next: CancelReasonFilters) => void;
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
      // Khi bật filter, mặc định set là true (hiển thị)
      onChange({ ...value, enableIsActiveFilter: true, isActive: true });
    } else {
      // Khi tắt filter, set về false (tất cả - không filter)
      onChange({ ...value, enableIsActiveFilter: false, isActive: true });
    }
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
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-500 focus:ring-brand-500"
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

export default AdvancedFilterModal;
