import Tag from "@/components/tag/Tag";
import React from "react";

interface MetadataSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: Array<{
    value: string;
    displayName: string;
    color?: string;
  }>;
  className?: string;
}

const MetadataSelector: React.FC<MetadataSelectorProps> = ({
  value,
  onChange,
  options,
  className,
}) => {
  const toggle = (optValue: string) => {
    onChange(
      value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue],
    );
  };

  return (
    <div className={className ?? "z-100000 flex flex-wrap gap-2"}>
      {options.map((opt) => {
        const active = value.includes(opt.value);
        const color = opt.color || "#6366f1";
        return (
          <Tag
            key={opt.value}
            color={active ? color : "gray"}
            onClick={() => toggle(opt.value)}
          >
            {opt.displayName || opt.value}
          </Tag>
        );
      })}
    </div>
  );
};

export default MetadataSelector;
