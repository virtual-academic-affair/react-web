/**
 * Remove Vietnamese diacritics and replace spaces with underscores
 * Example: "Họ Tên" → "ho_ten", "hé lô" → "he_lo"
 */
export function toSnakeCase(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics (Vietnamese accents)
    .replace(/ /g, "_") // Replace spaces with underscores
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, ""); // Remove any remaining non-alphanumeric chars except underscore
}
