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
    <div className={className ?? "flex flex-wrap gap-2"}>
      {(Object.keys(systemLabelEnum ?? {}) as SystemLabel[]).map((sl) => {
        const active = value.includes(sl);
        const color = getLabelColor(sl, systemLabelEnum);
        return (
          <button
            key={sl}
            type="button"
            onClick={() => toggle(sl)}
            style={active ? labelPillStyle(color) : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              active
                ? "border-transparent"
                : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
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

