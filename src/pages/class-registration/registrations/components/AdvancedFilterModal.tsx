import Card from "@/components/card";
import Switch from "@/components/switch";
import Tooltip from "@/components/tooltip/Tooltip";
import type { MessageStatus } from "@/types/classRegistration";
import {
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/classRegistration";
import React from "react";
import { MdInfoOutline, MdSearch } from "react-icons/md";

export interface RegistrationFilters {
  studentCode: string;
  academicYear: string;
  smartOrder: boolean;
  messageStatuses: MessageStatus[];
}

interface AdvancedFilterModalProps {
  open: boolean;
  value: RegistrationFilters;
  onChange: (next: RegistrationFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onRequestClose: () => void;
}

const MESSAGE_STATUS_OPTIONS: MessageStatus[] = ["opened", "replied", "closed"];

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

  const toggleStatus = (status: MessageStatus) => {
    const next = value.messageStatuses.includes(status)
      ? value.messageStatuses.filter((s) => s !== status)
      : [...value.messageStatuses, status];
    onChange({ ...value, messageStatuses: next });
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
                <div className="flex items-center gap-1">
                  <p className="text-navy-700 font-medium dark:text-white">
                    Sắp xếp ưu tiên
                  </p>
                  <Tooltip label="Ưu tiên sắp xếp theo các tiêu chí: (1) Năm học (SV năm cuối), (2) Môn thuộc CTĐT, (3) Thứ tự thời gian gửi đơn.">
                    <MdInfoOutline className="h-4 w-4 cursor-help text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                  </Tooltip>
                </div>
              </div>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={value.smartOrder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onChange({ ...value, smartOrder: e.target.checked })
                    }
                  />
                </div>
              </div>

              <div>
                <p className="text-navy-700 font-medium dark:text-white">
                  MSSV
                </p>
              </div>
              <div className="col-span-3">
                <input
                  value={value.studentCode}
                  onChange={(e) =>
                    onChange({ ...value, studentCode: e.target.value })
                  }
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
                />
              </div>

              <div>
                <p className="text-navy-700 font-medium dark:text-white">
                  Năm học
                </p>
              </div>
              <div className="col-span-3">
                <input
                  value={value.academicYear}
                  onChange={(e) =>
                    onChange({ ...value, academicYear: e.target.value })
                  }
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
                />
              </div>

              <div>
                <p className="text-navy-700 font-medium dark:text-white">
                  Trạng thái xử lý
                </p>
              </div>
              <div className="col-span-3">
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_STATUS_OPTIONS.map((status) => {
                    const active = value.messageStatuses.includes(status);
                    const colors = MessageStatusColors[status];
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleStatus(status)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          active
                            ? `${colors.bg} ${colors.text} border-transparent`
                            : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {MessageStatusLabels[status]}
                      </button>
                    );
                  })}
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
