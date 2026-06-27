import { useEffect, type ComponentType } from "react";

const APP_TITLE = "Giáo vụ số";

function formatDocumentTitle(pageTitle: string): string {
  return `${pageTitle} - Giáo vụ số`;
}

export type PageTitleDisplay = "visible" | "tabOnly";

type PageIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}>;

interface PageTitleProps {
  title: string;
  /** Tab title when shorter than the visible heading. Defaults to `title`. */
  tabTitle?: string;
  description?: string;
  icon?: PageIcon;
  /** visible: show heading + set tab title. tabOnly: set tab title only. */
  display?: PageTitleDisplay;
  className?: string;
}

export function PageTitle({
  title,
  tabTitle,
  description,
  icon: Icon,
  display = "visible",
  className,
}: PageTitleProps) {
  const resolvedTabTitle = tabTitle ?? title;

  useEffect(() => {
    document.title = formatDocumentTitle(resolvedTabTitle);
    return () => {
      document.title = APP_TITLE;
    };
  }, [resolvedTabTitle]);

  if (display === "tabOnly") {
    return null;
  }

  return (
    <header
      className={["flex flex-col items-center gap-2 text-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon ? (
        <Icon
          className="text-navy-700 h-7 w-7 dark:text-white"
          strokeWidth={1}
          aria-hidden
        />
      ) : null}
      <h1 className="text-navy-700 mt-2 max-w-md text-2xl leading-snug font-thin dark:text-white">
        {title}
      </h1>
      {description ? (
        <p className="max-w-md text-sm text-gray-400 dark:text-gray-400">
          {description}
        </p>
      ) : null}
    </header>
  );
}
