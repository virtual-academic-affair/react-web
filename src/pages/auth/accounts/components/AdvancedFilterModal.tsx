import Card from "@/components/card";
import type { Role } from "@/types/users.ts";
import React from "react";
import { MdSearch } from "react-icons/md";
import RoleFilterSelector from "./RoleFilterSelector.tsx";

interface AdvancedFilterModalProps {
  open: boolean;
  value: Role[];
  onChange: (next: Role[]) => void;
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
  if (!open) {
    return null;
  }

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
                  Vai trò
                </p>
              </div>
              <div className="col-span-3">
                <RoleFilterSelector value={value} onChange={onChange} />
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
