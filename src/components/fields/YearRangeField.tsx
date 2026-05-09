

interface YearRange {
  fromYear: number;
  toYear: number;
}

interface YearRangeFieldProps {
  label?: string;
  value: YearRange;
  onChange: (value: YearRange) => void;
  disabled?: boolean;
}

export default function YearRangeField({
  label,
  value,
  onChange,
  disabled,
}: YearRangeFieldProps) {
  const handleChange = (field: keyof YearRange, val: string) => {
    const numVal = val === "" ? (field === "fromYear" ? 0 : 9999) : parseInt(val);
    onChange({ ...value, [field]: numVal });
  };

  const displayVal = (val: number | undefined) =>
    val === undefined || val === 0 || val === 9999 ? "" : val.toString();

  const inputCls = `w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white text-sm`;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500 ml-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Từ năm"
          value={displayVal(value?.fromYear)}
          onChange={(e) => handleChange("fromYear", e.target.value)}
          disabled={disabled}
          className={inputCls}
        />
        <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">đến</span>
        <input
          type="number"
          placeholder="Đến năm"
          value={displayVal(value?.toYear)}
          onChange={(e) => handleChange("toYear", e.target.value)}
          disabled={disabled}
          className={inputCls}
        />
      </div>
    </div>
  );
}
