export const ALL_YEARS_SENTINEL_MIN = 0;
export const ALL_YEARS_SENTINEL_MAX = 9999;

export interface YearRangeStrings {
  fromYear: string;
  toYear: string;
}

export interface YearRangeNumbers {
  fromYear: number;
  toYear: number;
}

/** Normalize a year value — treat 0, null, empty, or 9999+ as "all years". */
export function normalizeYear(
  y: number | string | null | undefined,
): number | null {
  if (y === "" || y == null) return null;
  const n = typeof y === "string" ? parseInt(y, 10) : y;
  if (
    Number.isNaN(n) ||
    n <= ALL_YEARS_SENTINEL_MIN ||
    n >= ALL_YEARS_SENTINEL_MAX
  ) {
    return null;
  }
  return n;
}

/** Format a year range for display. Empty / all → `allLabel` (default "Tất cả"). */
export function formatYearRange(
  range:
    | { fromYear?: number | string | null; toYear?: number | string | null }
    | null
    | undefined,
  allLabel = "Tất cả",
): string {
  if (!range) return allLabel;
  const from = normalizeYear(range.fromYear);
  const to = normalizeYear(range.toYear);
  if (from === null && to === null) return allLabel;
  if (from !== null && to !== null && from === to) return String(from);
  if (from === null) return `Đến ${to}`;
  if (to === null) return `Từ ${from}`;
  return `${from} – ${to}`;
}

export function formatYearRangeStrings(
  value: YearRangeStrings,
  allLabel = "Tất cả",
): string {
  return formatYearRange(
    {
      fromYear: value.fromYear.trim() || null,
      toYear: value.toYear.trim() || null,
    },
    allLabel,
  );
}

export function yearRangeToStrings(
  range: YearRangeNumbers,
): YearRangeStrings {
  const from = normalizeYear(range.fromYear);
  const to = normalizeYear(range.toYear);
  return {
    fromYear: from == null ? "" : String(from),
    toYear: to == null ? "" : String(to),
  };
}

export function yearRangeFromStrings(
  value: YearRangeStrings,
): YearRangeNumbers {
  const fromTrim = value.fromYear.trim();
  const toTrim = value.toYear.trim();
  return {
    fromYear: fromTrim
      ? parseInt(fromTrim, 10)
      : ALL_YEARS_SENTINEL_MIN,
    toYear: toTrim ? parseInt(toTrim, 10) : ALL_YEARS_SENTINEL_MAX,
  };
}

export const EMPTY_YEAR_RANGE_STRINGS: YearRangeStrings = {
  fromYear: "",
  toYear: "",
};
