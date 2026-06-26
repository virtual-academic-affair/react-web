import React from "react";

// ── Grid Skeleton ──────────────────────────────────────────────────────────────

export const GridSkeleton: React.FC = () => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4 pb-5">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="dark:bg-navy-800 flex min-w-0 flex-col gap-3 rounded-2xl bg-white p-4"
      >
        <div className="dark:bg-navy-700 h-12 w-12 animate-pulse rounded-2xl bg-gray-100" />
        <div className="space-y-2">
          <div className="dark:bg-navy-700 h-3 animate-pulse rounded bg-gray-100" />
          <div className="dark:bg-navy-700 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

// ── List Skeleton ──────────────────────────────────────────────────────────────

export const ListSkeleton: React.FC = () => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="dark:bg-navy-800 flex items-center gap-4 rounded-2xl bg-white px-4 py-3"
      >
        <div className="dark:bg-navy-700 h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="dark:bg-navy-700 h-3 animate-pulse rounded bg-gray-100" />
          <div className="dark:bg-navy-700 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);
