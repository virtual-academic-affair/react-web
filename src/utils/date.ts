
export function formatDate(iso: string | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";

  const pad = (n: number) => n.toString().padStart(2, "0");

  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function formatCalendarDate(iso: string | Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";

  const pad = (n: number) => n.toString().padStart(2, "0");
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatSessionActivityLabel(
  iso: string | Date | null | undefined,
): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (startOfDate.getTime() === startOfToday.getTime()) return "Hôm nay";
  if (startOfDate.getTime() === startOfYesterday.getTime()) return "Hôm qua";

  return formatCalendarDate(date);
}
