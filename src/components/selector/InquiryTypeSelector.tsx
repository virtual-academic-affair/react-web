import type { InquiryType } from "@/types/inquiry";
import { InquiryTypeColors, InquiryTypeLabels } from "@/types/inquiry";
import React from "react";

interface InquiryTypeSelectorProps {
  value: InquiryType[];
  onChange: (types: InquiryType[]) => void;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
}

const InquiryTypeSelector: React.FC<InquiryTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  multiple = true,
}) => {
  const options: InquiryType[] = ["graduation", "training", "procedure"];

  const handleToggle = (type: InquiryType) => {
    if (multiple) {
      const next = value.includes(type)
        ? value.filter((t) => t !== type)
        : [...value, type];
      onChange(next);
    } else {
      onChange([type]);
    }
  };

  return (
    <div className={className ?? "relative inline-flex flex-wrap gap-1"}>
      {options.map((type) => {
        const active = value.includes(type);
        const colors = InquiryTypeColors[type];
        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(type)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              active
                ? `${colors.bg} ${colors.text} border-transparent`
                : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span>{InquiryTypeLabels[type]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default InquiryTypeSelector;
