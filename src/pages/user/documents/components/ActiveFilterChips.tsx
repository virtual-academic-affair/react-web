import React from "react";
import { MdClose } from "react-icons/md";

interface MetadataTypeDef {
  key: string;
  displayName: string;
  allowedValues?: Array<{ value: string; displayName: string; color?: string }>;
}

type FiltersMap = Record<string, string[]>;

interface YearRangeChip {
  key: string;
  label: string;
  fromYear: string;
  toYear: string;
}

interface ActiveFilterChipsProps {
  filters: FiltersMap;
  metadataTypes: MetadataTypeDef[];
  /** Extra hardcoded filter groups not from metadataTypes (e.g. "type") */
  extraTypes?: MetadataTypeDef[];
  /** Active year range filters to display as chips */
  yearRanges?: YearRangeChip[];
  onRemove: (typeKey: string, value: string) => void;
  /** Called when a year range chip's × is clicked */
  onRemoveYearRange?: (key: string) => void;
  onClearAll: () => void;
}

/** Format a year range for chip display */
function formatYearRange(from: string, to: string): string {
  if (from && to) return `${from} – ${to}`;
  if (from) return `Từ ${from}`;
  return `Đến ${to}`;
}

const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  metadataTypes,
  extraTypes = [],
  yearRanges = [],
  onRemove,
  onRemoveYearRange,
  onClearAll,
}) => {
  const allTypes = [...metadataTypes, ...extraTypes];

  const chips: Array<{
    typeKey: string;
    typeLabel: string;
    value: string;
    label: string;
    color?: string;
  }> = [];

  Object.entries(filters).forEach(([typeKey, values]) => {
    if (!Array.isArray(values) || values.length === 0) return;
    const typeDef = allTypes.find((t) => t.key === typeKey);
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

  const hasAny = chips.length > 0 || yearRanges.length > 0;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-400">Đang lọc:</span>

      {/* Tag-based filter chips */}
      {chips.map((chip) => (
        <button
          key={`${chip.typeKey}:${chip.value}`}
          type="button"
          onClick={() => onRemove(chip.typeKey, chip.value)}
          className="border-brand-500/30 bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 dark:text-brand-400 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all"
        >
          <span className="text-[10px] font-normal opacity-60">
            {chip.typeLabel}:
          </span>
          {chip.label}
          <MdClose className="h-3 w-3 opacity-60" />
        </button>
      ))}

      {/* Year range chips */}
      {yearRanges.map((yr) => (
        <button
          key={yr.key}
          type="button"
          onClick={() => onRemoveYearRange?.(yr.key)}
          className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400"
        >
          <span className="text-[10px] font-normal opacity-60">
            {yr.label}:
          </span>
          {formatYearRange(yr.fromYear, yr.toYear)}
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
