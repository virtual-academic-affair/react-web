/** Shared text/number input styling for drawers and form fields. */
export const formInputClass =
  "dark:bg-navy-800 w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-400 dark:border-white/10 dark:text-white dark:placeholder:text-white/30";

export function formInputClassWithError(error?: string) {
  return error
    ? `${formInputClass} border-red-400 dark:border-red-400`
    : formInputClass;
}
