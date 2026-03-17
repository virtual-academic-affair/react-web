import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import type { Role } from "@/types/users.ts";
import React from "react";
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
        <RoleFilterSelector value={value} onChange={onChange} />
      </div>
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;
