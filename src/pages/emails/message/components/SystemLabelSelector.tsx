import Tag from "@/components/tag/Tag";
import type { SystemLabel } from "@/types/email";
import type { SystemLabelEnumData } from "@/types/shared";
import React from "react";
import { getLabelColor, getLabelVi } from "../labelUtils";

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
    <div className={className ?? "z-100000 flex flex-wrap gap-2"}>
      {(Object.keys(systemLabelEnum ?? {}) as SystemLabel[]).map((sl) => {
        const active = value.includes(sl);
        return (
          <Tag
            key={sl}
            color={active ? getLabelColor(sl, systemLabelEnum) : "gray"}
            onClick={() => toggle(sl)}
            className={`system-label-tag-${sl}`}
          >
            {getLabelVi(sl, systemLabelEnum)}
          </Tag>
        );
      })}
    </div>
  );
};

export default SystemLabelSelector;
