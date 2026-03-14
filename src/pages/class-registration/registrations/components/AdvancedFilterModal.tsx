import Card from "@/components/card";
import type { MessageStatus } from "@/types/classRegistration";
import { MessageStatusLabels } from "@/types/classRegistration";
import React from "react";
import { MdSearch } from "react-icons/md";

export interface RegistrationFilters {
  studentCode: string;
  academicYear: string;
  smartOrder: string;
  messageId: string;
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

const MESSAGE_STATUS_OPTIONS: MessageStatus[] = [
  "opened",
  "replied",
  "closed",
];

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
      <div className="fixed top-18 left-1/2 z-50 w-full max-w-3xl -translate-x-1/2">
        <Card extra="border border-gray-200 p-5 shadow-none dark:border-white/10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-navy-700 mb-2 ml-1 block text-sm font-bold dark:text-white">
                Student code
              </label>
              <input
                value={value.studentCode}
                onChange={(e) =>
                  onChange({ ...value, studentCode: e.target.value })
                }
                className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>

            <div>
              <label className="text-navy-700 mb-2 ml-1 block text-sm font-bold dark:text-white">
                Academic year
              </label>
              <input
                value={value.academicYear}
                onChange={(e) =>
                  onChange({ ...value, academicYear: e.target.value })
                }
                className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>

            <div>
              <label className="text-navy-700 mb-2 ml-1 block text-sm font-bold dark:text-white">
                Message ID
              </label>
              <input
                value={value.messageId}
                onChange={(e) =>
                  onChange({ ...value, messageId: e.target.value })
                }
                className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>

            <div>
              <label className="text-navy-700 mb-2 ml-1 block text-sm font-bold dark:text-white">
                Smart order
              </label>
              <input
                value={value.smartOrder}
                onChange={(e) =>
                  onChange({ ...value, smartOrder: e.target.value })
                }
                className="h-11 w-full rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-navy-700 mb-2 ml-1 block text-sm font-bold dark:text-white">
                Message status
              </label>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_STATUS_OPTIONS.map((status) => {
                  const active = value.messageStatuses.includes(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleStatus(status)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "bg-brand-100 text-brand-700 border-transparent"
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

          <div className="mt-5 flex justify-end gap-2">
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
              Tìm
            </button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdvancedFilterModal;
