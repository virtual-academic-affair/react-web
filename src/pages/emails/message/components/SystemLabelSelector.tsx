import type { SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import React from "react";
import { getLabelColor, getLabelVi, labelPillStyle } from "../labelUtils";

interface SystemLabelSelectorProps {
  value: SystemLabel[];
  onChange: (next: SystemLabel[]) => void;
  systemLabelEnum?: SystemLabelEnumData | null;
  className?: string;
}

const SystemLabelSelector: React.FC<SystemLabelSelectorProps> = ({
  value,
  onChange,
  systemLabelEnum,
  className,
}) => {
  const toggle = (label: SystemLabel) => {
    onChange(
      value.includes(label)
        ? value.filter((l) => l !== label)
        : [...value, label],
    );
  };

  return (
    <div className={className ?? "z-[100000] flex flex-wrap gap-2"}>
      {(Object.keys(systemLabelEnum ?? {}) as SystemLabel[]).map((sl) => {
        const active = value.includes(sl);
        return (
          <button
            key={sl}
            type="button"
            onClick={() => toggle(sl)}
            style={
              active
                ? labelPillStyle(getLabelColor(sl, systemLabelEnum))
                : undefined
            }
            className={`px-2 py-0.5 text-xs font-medium transition-colors ${
              active
                ? "rounded-full"
                : "rounded-full text-gray-600 outline outline-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:outline-white/10 dark:hover:bg-white/10"
            }`}
          >
            {getLabelVi(sl, systemLabelEnum)}
          </button>
        );
      })}
    </div>
  );
};

export default SystemLabelSelector;
