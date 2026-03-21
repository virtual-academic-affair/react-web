export type TimeRangeType =
  | "this_week"
  | "last_1_week"
  | "last_2_weeks"
  | "last_1_month"
  | "next_month";

function getStartOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getEndOfWeek(date: Date) {
  const start = getStartOfWeek(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
}

export function getDateRange(range: TimeRangeType) {
  const now = new Date();
  switch (range) {
    case "this_week": {
      const from = getStartOfWeek(new Date(now));
      from.setHours(0, 0, 0, 0);
      const to = getEndOfWeek(new Date(now));
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last_1_week": {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last_2_weeks": {
      const from = new Date(now);
      from.setDate(now.getDate() - 14);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last_1_month": {
      const from = new Date(now);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "next_month": {
      const from = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    default:
      return { from: now, to: now };
  }
}
