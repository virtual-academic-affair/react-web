import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import type { SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import React from "react";
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
        <SystemLabelSelector
          value={value}
          onChange={onChange}
          systemLabelEnum={systemLabelEnum}
          className="flex flex-wrap gap-2"
        />
      </div>
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;
