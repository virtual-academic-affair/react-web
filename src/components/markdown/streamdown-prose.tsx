import type { ComponentPropsWithoutRef } from "react";

function joinClass(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** List/bullet indentation — wrapped lines stay aligned with item text, not flush left. */
export const STREAMDOWN_LIST_PROSE_CLASS = [
  "[&_ul]:my-2 [&_ul]:list-outside [&_ul]:list-disc [&_ul]:ps-6",
  "[&_ol]:my-2 [&_ol]:list-outside [&_ol]:list-decimal [&_ol]:ps-6",
  "[&_li]:ps-1",
  "[&_li>p]:my-0 [&_li>p]:inline",
  "[&_li>p+p]:mt-2 [&_li>p+p]:block",
  "[&_li>ul]:mt-2 [&_li>ol]:mt-2",
].join(" ");

export const STREAMDOWN_LIST_COMPONENTS = {
  ul: ({ children, className, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul
      {...props}
      className={joinClass("my-2 list-outside list-disc ps-6", className)}
    >
      {children}
    </ul>
  ),
  ol: ({ children, className, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol
      {...props}
      className={joinClass("my-2 list-outside list-decimal ps-6", className)}
    >
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li
      {...props}
      className={joinClass(
        "ps-1 [&>p]:my-0 [&>p:first-child]:inline [&>p+p]:mt-2 [&>p+p]:block [&>ol]:mt-2 [&>ul]:mt-2",
        className,
      )}
    >
      {children}
    </li>
  ),
};

export function mergeStreamdownComponents<T extends Record<string, unknown>>(
  extra?: T,
) {
  return { ...STREAMDOWN_LIST_COMPONENTS, ...extra };
}

const sourcePreviewHeadingBaseClass =
  "my-2 text-sm leading-relaxed text-[#202124] dark:text-white";

/** TLTK markdown panel — uniform 14px; keep heading weight and table borders. */
export const SOURCE_PREVIEW_STREAMDOWN_CLASS = [
  "text-sm leading-relaxed text-[#24292f] dark:text-[#e6edf3]",
  "[&_strong]:font-semibold",
  "[&_em]:italic",
  STREAMDOWN_LIST_PROSE_CLASS,
].join(" ");

export const SOURCE_PREVIEW_STREAMDOWN_COMPONENTS = mergeStreamdownComponents({
  h1: ({ children, className, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1
      {...props}
      className={joinClass(sourcePreviewHeadingBaseClass, "font-bold", className)}
    >
      {children}
    </h1>
  ),
  h2: ({ children, className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      {...props}
      className={joinClass(sourcePreviewHeadingBaseClass, "font-semibold", className)}
    >
      {children}
    </h2>
  ),
  h3: ({ children, className, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3
      {...props}
      className={joinClass(sourcePreviewHeadingBaseClass, "font-semibold", className)}
    >
      {children}
    </h3>
  ),
  h4: ({ children, className, ...props }: ComponentPropsWithoutRef<"h4">) => (
    <h4
      {...props}
      className={joinClass(sourcePreviewHeadingBaseClass, "font-semibold", className)}
    >
      {children}
    </h4>
  ),
  h5: ({ children, className, ...props }: ComponentPropsWithoutRef<"h5">) => (
    <h5
      {...props}
      className={joinClass(sourcePreviewHeadingBaseClass, "font-semibold", className)}
    >
      {children}
    </h5>
  ),
  h6: ({ children, className, ...props }: ComponentPropsWithoutRef<"h6">) => (
    <h6
      {...props}
      className={joinClass(sourcePreviewHeadingBaseClass, "font-semibold", className)}
    >
      {children}
    </h6>
  ),
  table: ({ children, className, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-2 w-full overflow-x-auto">
      <table
        {...props}
        className={joinClass(
          "w-full min-w-max border-collapse text-left text-sm leading-relaxed",
          className,
        )}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, className, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead
      {...props}
      className={joinClass("bg-gray-100 dark:bg-white/[0.04]", className)}
    >
      {children}
    </thead>
  ),
  tbody: ({ children, className, ...props }: ComponentPropsWithoutRef<"tbody">) => (
    <tbody {...props} className={className}>
      {children}
    </tbody>
  ),
  tr: ({ children, className, ...props }: ComponentPropsWithoutRef<"tr">) => (
    <tr {...props} className={className}>
      {children}
    </tr>
  ),
  th: ({ children, className, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th
      {...props}
      className={joinClass(
        "border border-gray-300 px-3 py-2 text-left align-top text-sm leading-relaxed font-semibold text-[#202124] dark:border-white/20 dark:text-white",
        className,
      )}
    >
      {children}
    </th>
  ),
  td: ({ children, className, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td
      {...props}
      className={joinClass(
        "border border-gray-300 px-3 py-2 align-top text-sm leading-relaxed text-[#1f1f1f] dark:border-white/20 dark:text-[#e3e3e3]",
        className,
      )}
    >
      {children}
    </td>
  ),
});
