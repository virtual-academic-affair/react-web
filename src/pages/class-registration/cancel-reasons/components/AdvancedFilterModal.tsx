import Card from "@/components/card";
import Switch from "@/components/switch";
import React from "react";
import { MdSearch } from "react-icons/md";

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
  if (!open) {
    return null;
  }

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
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onRequestClose}
      />
      <div className="fixed top-20 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2">
        <Card extra="p-5 shadow-none border border-gray-200 dark:border-white/10">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                      onChange={(e) =>
                        handleToggleEnableFilter(e.target.checked)
                      }
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
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClear}
                className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={onApply}
                className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors"
              >
                <MdSearch className="h-4 w-4" />
                Tìm kiếm
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdvancedFilterModal;
