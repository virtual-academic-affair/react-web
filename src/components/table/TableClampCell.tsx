import { useEffect, useRef, useState, type ReactNode } from "react";

const LINE_CLAMP_CLASS: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
};

type TableClampCellProps = {
  className?: string;
  lines?: number;
  children?: ReactNode;
  html?: string;
};

const toggleButtonClass = "text-action-link shrink-0 text-sm";

export default function TableClampCell({
  className = "",
  lines = 5,
  children,
  html,
}: TableClampCellProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) return;

    const element = ref.current;
    if (!element) return;

    const measure = () => {
      setOverflows(element.scrollHeight > element.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) {
      observer.observe(element.firstElementChild);
    }

    return () => observer.disconnect();
  }, [expanded, children, html, lines]);

  const clampClass = expanded
    ? ""
    : (LINE_CLAMP_CLASS[lines] ?? "line-clamp-5");

  const contentProps = html
    ? { dangerouslySetInnerHTML: { __html: html } }
    : { children };

  if (expanded) {
    return (
      <div className="min-w-0">
        <div
          className={`${className} whitespace-normal`.trim()}
          {...contentProps}
        />
        {overflows ? (
          <>
            {" "}
            <button
              type="button"
              className={toggleButtonClass}
              onClick={(event) => {
                event.stopPropagation();
                setExpanded(false);
              }}
            >
              Thu gọn
            </button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="inline-flex max-w-full min-w-0 flex-wrap items-baseline gap-x-1">
      <div
        ref={ref}
        className={`${className} ${clampClass} min-w-0 whitespace-normal`.trim()}
        {...contentProps}
      />
      {overflows ? (
        <button
          type="button"
          className={toggleButtonClass}
          onClick={(event) => {
            event.stopPropagation();
            setExpanded(true);
          }}
        >
          Xem thêm
        </button>
      ) : null}
    </div>
  );
}
