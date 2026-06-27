import type { ReactNode } from "react";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: ReactNode;
  title?: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  className?: string;
  fullWidth?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

const columnClassMap: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

function getTabClass(active: boolean) {
  return active
    ? "text-navy-700 dark:text-white"
    : "text-gray-600 hover:text-navy-700 dark:text-gray-300 dark:hover:text-white";
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className = "",
  fullWidth = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SegmentedControlProps<T>) {
  const columnClass = columnClassMap[options.length] ?? "grid-cols-2";
  const widthClass = fullWidth ? "w-full" : "w-max max-w-full";
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <div
      className={`rounded-full bg-gray-100 p-1 dark:bg-white/8 ${widthClass} ${className}`}
      role="tablist"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div className={`relative grid ${columnClass} ${widthClass} items-center`}>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out dark:bg-navy-700"
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={option.title}
              title={option.title}
              onClick={() => onChange(option.value)}
              className={`relative z-10 flex w-full items-center justify-center rounded-full px-3 py-2 text-xs leading-none font-semibold whitespace-nowrap transition-colors duration-200 ${getTabClass(active)}`}
            >
              <span className="inline-flex items-center justify-center">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
