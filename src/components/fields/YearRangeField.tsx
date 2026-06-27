import YearRangeControl from "@/components/fields/YearRangeControl";
import {
  yearRangeFromStrings,
  yearRangeToStrings,
  type YearRangeNumbers,
} from "@/utils/yearRange";

interface YearRangeFieldProps {
  value: YearRangeNumbers;
  onChange: (value: YearRangeNumbers) => void;
  disabled?: boolean;
  showInput?: boolean;
  showSummary?: boolean;
}

export default function YearRangeField({
  value,
  onChange,
  disabled,
  showInput = true,
  showSummary = true,
}: YearRangeFieldProps) {
  return (
    <YearRangeControl
      value={yearRangeToStrings(value)}
      onChange={(next) => onChange(yearRangeFromStrings(next))}
      disabled={disabled}
      showInput={showInput}
      showSummary={showSummary}
    />
  );
}
