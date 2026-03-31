import React from "react";
import { MdClose } from "react-icons/md";
import type { DocumentFilters } from "@/pages/documents/components/AdvancedFilterModal";

interface MetadataTypeDef {
  key: string;
  displayName: string;
  allowedValues?: Array<{ value: string; displayName: string; color?: string }>;
}

interface ActiveFilterChipsProps {
  filters: DocumentFilters;
  metadataTypes: MetadataTypeDef[];
  onRemove: (typeKey: string, value: string) => void;
  onClearAll: () => void;
}

const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  metadataTypes,
  onRemove,
  onClearAll,
}) => {
  const chips: Array<{
    typeKey: string;
    typeLabel: string;
    value: string;
    label: string;
    color?: string;
  }> = [];

  Object.entries(filters).forEach(([typeKey, values]) => {
    if (!Array.isArray(values) || values.length === 0) return;
    const typeDef = metadataTypes.find((t) => t.key === typeKey);
    const typeLabel = typeDef?.displayName || typeKey;
    values.forEach((v) => {
      const valDef = typeDef?.allowedValues?.find((av) => av.value === v);
      chips.push({
        typeKey,
        typeLabel,
        value: v,
        label: valDef?.displayName || v,
        color: valDef?.color,
      });
    });
  });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <span className="text-xs font-medium text-gray-400">Đang lọc:</span>
      {chips.map((chip) => (
        <button
          key={`${chip.typeKey}:${chip.value}`}
          type="button"
          onClick={() => onRemove(chip.typeKey, chip.value)}
          className="flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600 transition-all hover:bg-brand-500/20 dark:text-brand-400"
        >
          <span className="text-[10px] font-normal opacity-60">
            {chip.typeLabel}:
          </span>
          {chip.label}
          <MdClose className="h-3 w-3 opacity-60" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
      >
        Xóa tất cả
      </button>
    </div>
  );
};

export default ActiveFilterChips;
