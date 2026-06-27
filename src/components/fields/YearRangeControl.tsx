import { formInputClass } from "@/components/fields/formInputClass";
import {
  formatYearRangeStrings,
  type YearRangeStrings,
} from "@/utils/yearRange";

const compactInputClass =
  "dark:bg-navy-800 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 dark:border-white/10 dark:text-white dark:placeholder:text-white/30";

export interface YearRangeControlProps {
  value: YearRangeStrings;
  onChange?: (next: YearRangeStrings) => void;
  /** Hiện ô nhập from/to. Mặc định true. */
  showInput?: boolean;
  /** Hiện dòng tóm tắt phạm vi áp dụng bên dưới. Mặc định true. */
  showSummary?: boolean;
  disabled?: boolean;
  allLabel?: string;
  /** Input gọn hơn (dropdown filter). */
  compact?: boolean;
  className?: string;
}

export default function YearRangeControl({
  value,
  onChange,
  showInput = true,
  showSummary = true,
  disabled = false,
  allLabel = "Tất cả",
  compact = false,
  className,
}: YearRangeControlProps) {
  const inputClass = compact ? compactInputClass : formInputClass;
  const summary = formatYearRangeStrings(value, allLabel);
  const editable = showInput && onChange != null && !disabled;

  const setField = (field: keyof YearRangeStrings, next: string) => {
    onChange?.({ ...value, [field]: next });
  };

  return (
    <div className={`flex w-full min-w-0 flex-col gap-1.5 ${className ?? ""}`}>
      {editable ? (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <input
            type="number"
            value={value.fromYear}
            onChange={(e) => setField("fromYear", e.target.value)}
            placeholder="Từ năm"
            min={2000}
            max={2099}
            disabled={disabled}
            className={inputClass}
          />
          <span className="shrink-0 text-sm text-gray-400">—</span>
          <input
            type="number"
            value={value.toYear}
            onChange={(e) => setField("toYear", e.target.value)}
            placeholder="Đến năm"
            min={2000}
            max={2099}
            disabled={disabled}
            className={inputClass}
          />
        </div>
      ) : null}
      {showSummary ? (
        showInput ? (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Phạm vi áp dụng: {summary}
          </p>
        ) : (
          <p className="text-navy-700 text-sm dark:text-white">{summary}</p>
        )
      ) : null}
    </div>
  );
}
