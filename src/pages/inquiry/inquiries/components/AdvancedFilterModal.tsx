import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import type { MessageStatus } from "@/types/messageStatus";
import type { InquiryType } from "@/types/inquiry";
import React from "react";
import InquiryTypeSelector from "@/components/selector/InquiryTypeSelector";
import MessageStatusTagSelector from "@/components/selector/MessageStatusTagSelector";

export interface InquiryFilters {
  types: InquiryType[];
  messageStatuses: MessageStatus[];
}

interface AdvancedFilterModalProps {
  open: boolean;
  value: InquiryFilters;
  onChange: (next: InquiryFilters) => void;
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
  return (
    <AdvancedFilterModalBase
      open={open}
      onClear={onClear}
      onApply={onApply}
      onRequestClose={onRequestClose}
    >
      <div>
        <p className="text-navy-700 font-medium dark:text-white">Loại thắc mắc</p>
      </div>
      <div className="col-span-3">
        <InquiryTypeSelector
          value={value.types}
          onChange={(types) => onChange({ ...value, types })}
        />
      </div>

      <div>
        <p className="text-navy-700 font-medium dark:text-white">
          Trạng thái xử lý
        </p>
      </div>
      <div className="col-span-3">
        <MessageStatusTagSelector
          value={value.messageStatuses}
          onChange={(messageStatuses) => onChange({ ...value, messageStatuses })}
        />
      </div>
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;
