import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import type { SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import React from "react";
import { MdExpandMore } from "react-icons/md";
import { getLabelColor, getLabelVi, labelPillStyle } from "../labelUtils";
import SystemLabelSelector from "./SystemLabelSelector";

interface AdvancedFilterModalProps {
  open: boolean;
  value: SystemLabel[];
  onChange: (next: SystemLabel[]) => void;
  systemLabelEnum?: SystemLabelEnumData | null;
  onClear: () => void;
  onApply: () => void;
  onRequestClose: () => void;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  open,
  value,
  onChange,
  systemLabelEnum,
  onClear,
  onApply,
  onRequestClose,
}) => {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        event.target instanceof Node &&
        !pickerRef.current.contains(event.target)
      ) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <AdvancedFilterModalBase
      open={open}
      onClear={onClear}
      onApply={onApply}
      onRequestClose={onRequestClose}
    >
      <div>
        <p className="text-navy-700 font-medium dark:text-white">
          Nhãn hệ thống
        </p>
      </div>
      <div className="col-span-3">
        <div ref={pickerRef} className="relative">
          <div className="flex flex-wrap items-center gap-1">
            {value.length ? (
              value.map((sl) => (
                <span
                  key={sl}
                  style={labelPillStyle(getLabelColor(sl, systemLabelEnum))}
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  {getLabelVi(sl, systemLabelEnum)}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">—</span>
            )}
            <button
              type="button"
              title="Chọn nhãn hệ thống"
              onClick={() => setPickerOpen((prev) => !prev)}
              className="dark:bg-navy-800 ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
            >
              <MdExpandMore className="h-3.5 w-3.5" />
            </button>
          </div>

          {pickerOpen && (
            <div className="dark:bg-navy-900 absolute top-full left-0 z-20 mt-1 w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10">
              <p className="mb-2 pl-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Nhãn hệ thống
              </p>
              <SystemLabelSelector
                value={value}
                onChange={onChange}
                systemLabelEnum={systemLabelEnum}
                className="flex max-h-44 flex-wrap gap-2 overflow-y-auto p-1"
              />
            </div>
          )}
        </div>
      </div>
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;
