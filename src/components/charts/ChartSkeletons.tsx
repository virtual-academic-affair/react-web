const LINE_HEIGHTS = [30, 55, 42, 70, 60, 85, 65, 90, 72, 80, 58, 45];
const BAR_HEIGHTS = [55, 80, 45, 90, 65, 70, 40, 85];

/** Skeleton loading cho line chart (ApexCharts LineChart). */
export function LineChartSkeleton() {
  return (
    <div
      className="flex h-full w-full flex-col justify-end gap-2 pb-4"
      aria-hidden
    >
      <div className="flex h-full w-full gap-3">
        {/* Y-axis ticks */}
        <div className="flex w-8 shrink-0 flex-col justify-between pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-2.5 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10"
            />
          ))}
        </div>
        {/* Chart area */}
        <div className="relative flex-1">
          {/* Horizontal grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-dashed border-gray-100 dark:border-white/5"
              style={{ top: `${i * 25}%` }}
            />
          ))}
          {/* Fake line curve via varying-height columns */}
          <div className="gap-3p absolute bottom-0 flex w-full items-end px-1">
            {LINE_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse rounded-t-sm bg-gray-200 dark:bg-white/10"
                style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* X-axis labels */}
      <div className="ml-11 flex justify-between gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-white/10"
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton loading cho bar chart (ApexCharts BarChart). */
export function BarChartSkeleton() {
  return (
    <div
      className="flex h-full w-full flex-col justify-end gap-2 pb-4"
      aria-hidden
    >
      <div className="flex h-full w-full gap-3">
        {/* Y-axis ticks */}
        <div className="flex w-8 shrink-0 flex-col justify-between pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-2.5 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10"
            />
          ))}
        </div>
        {/* Chart area */}
        <div className="relative flex-1">
          {/* Horizontal grid lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-dashed border-gray-100 dark:border-white/5"
              style={{ top: `${i * 25}%` }}
            />
          ))}
          {/* Bar columns */}
          <div className="absolute bottom-0 flex w-full items-end justify-around px-2">
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="w-8p animate-pulse rounded-t bg-gray-200 dark:bg-white/10"
                style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* X-axis labels */}
      <div className="ml-11 flex justify-around gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-2.5 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-white/10"
          />
        ))}
      </div>
    </div>
  );
}
