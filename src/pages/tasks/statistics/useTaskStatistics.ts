import { tasksService } from "@/services/tasks";
import {
  type TaskStatsItem,
  TaskPriorityColors,
  TaskPriorityLabels,
} from "@/types/task";
import { useQuery } from "@tanstack/react-query";
import type { ApexOptions } from "apexcharts";
import React from "react";
import { type TimeRangeType, getDateRange } from "./utils/dateRange";

interface Summary {
  total: number;
  done: number;
  doing: number;
  todo: number;
}

interface PeakDay {
  date: Date;
  total: number;
  formattedDate: string;
}

interface ChartData {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
}

interface UseTaskStatisticsReturn {
  timeRange: TimeRangeType;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRangeType>>;
  loading: boolean;
  summary: Summary;
  peakDay: PeakDay | null;
  dateRangeLabel: string;
  chartData: ChartData;
}

export function useTaskStatistics(): UseTaskStatisticsReturn {
  const [timeRange, setTimeRange] = React.useState<TimeRangeType>("this_week");

  const { data = {}, isLoading: loading } = useQuery({
    queryKey: ["task-stats", timeRange],
    queryFn: () => {
      const { from, to } = getDateRange(timeRange);
      return tasksService.getStats({
        from: from.toISOString(),
        to: to.toISOString(),
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const summary = React.useMemo((): Summary => {
    let total = 0;
    let done = 0;
    let doing = 0;
    let todo = 0;

    Object.values(data).forEach((item) => {
      if (typeof item !== "number") {
        total += item.total || 0;
        if (item.detail) {
          Object.values(item.detail).forEach((d) => {
            done += d.done || 0;
            doing += d.doing || 0;
            todo += d.todo || 0;
          });
        }
      }
    });

    return { total, done, doing, todo };
  }, [data]);

  const peakDay = React.useMemo((): PeakDay | null => {
    let max = -1;
    let peakDate = "";

    Object.keys(data).forEach((key) => {
      const item = data[key];
      const total = typeof item === "number" ? item : item.total || 0;
      if (total > max) {
        max = total;
        peakDate = key;
      }
    });

    if (!peakDate || max <= 0) return null;
    const d = new Date(peakDate);
    return {
      date: d,
      total: max,
      formattedDate: d.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "short",
      }),
    };
  }, [data]);

  const dateRangeLabel = React.useMemo(() => {
    const { from, to } = getDateRange(timeRange);
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `từ ${fmt(from)} đến ${fmt(to)}`;
  }, [timeRange]);

  const chartData = React.useMemo((): ChartData => {
    const { from, to } = getDateRange(timeRange);

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    const categories: string[] = [];
    const urgentData: number[] = [];
    const highData: number[] = [];
    const mediumData: number[] = [];
    const lowData: number[] = [];
    const tooltipMeta: Array<TaskStatsItem["detail"] | undefined> = [];

    const dataByLocalDate = new Map<string, TaskStatsItem>();
    Object.keys(data).forEach((key) => {
      const d = new Date(key);
      const localKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const val = data[key];
      if (typeof val !== "number") {
        dataByLocalDate.set(localKey, val);
      }
    });

    let overallMax = 0;

    const current = new Date(start);
    while (current <= end) {
      categories.push(`${current.getDate()}/${current.getMonth() + 1}`);
      const localKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      const item = dataByLocalDate.get(localKey);

      const u = item?.detail?.urgent?.total || 0;
      const h = item?.detail?.high?.total || 0;
      const m = item?.detail?.medium?.total || 0;
      const l = item?.detail?.low?.total || 0;

      urgentData.push(u);
      highData.push(h);
      mediumData.push(m);
      lowData.push(l);

      overallMax = Math.max(overallMax, u, h, m, l);
      tooltipMeta.push(item?.detail);

      current.setDate(current.getDate() + 1);
    }

    return {
      options: {
        chart: { toolbar: { show: false } },
        tooltip: {
          theme: "dark",
          shared: true,
          intersect: false,
          custom: function ({
            series,
            dataPointIndex,
          }: {
            series: number[][];
            dataPointIndex: number;
          }) {
            const detail = tooltipMeta[dataPointIndex];
            const prioritiesKeys = ["urgent", "high", "medium", "low"];
            const dateStr = categories[dataPointIndex];

            let content = `<div style="padding: 12px; min-width: 200px; background: #111c44; color: white; border-radius: 8px;">`;
            content += `<div style="font-weight: 800; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">Ngày ${dateStr}</div>`;

            prioritiesKeys.forEach((pKey, idx) => {
              const val = series[idx]?.[dataPointIndex] ?? 0;
              const stats = detail?.[pKey];
              const label =
                TaskPriorityLabels[pKey as keyof typeof TaskPriorityLabels];
              const color =
                TaskPriorityColors[pKey as keyof typeof TaskPriorityColors].hex;

              if (val > 0) {
                content += `
                  <div style="margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
                      <span style="font-weight: bold; font-size: 12px; color: ${color}; text-transform: uppercase;">${label}</span>
                    </div>
                    <div style="padding-left: 14px; display: flex; flex-direction: column; gap: 2px;">
                      <div style="font-size: 11px; display: flex; justify-content: space-between;">
                        <span>Đã xử lý:</span> <span style="color: #10b981; font-weight: 600;">${stats?.done || 0}</span>
                      </div>
                      <div style="font-size: 11px; display: flex; justify-content: space-between;">
                        <span>Chưa xử lý:</span> <span style="color: #f59e0b; font-weight: 600;">${(stats?.todo || 0) + (stats?.doing || 0)}</span>
                      </div>
                      <div style="font-size: 11px; display: flex; justify-content: space-between; opacity: 0.6;">
                        <span style="padding-left: 4px;">• Đang làm:</span> <span>${stats?.doing || 0}</span>
                      </div>
                      <div style="font-size: 11px; display: flex; justify-content: space-between; opacity: 0.6;">
                        <span style="padding-left: 4px;">• Cần làm:</span> <span>${stats?.todo || 0}</span>
                      </div>
                    </div>
                  </div>
                `;
              }
            });

            if (!detail || Object.values(detail).every((v) => v.total === 0)) {
              content += `<div style="font-size: 12px; opacity: 0.5; text-align: center; padding: 10px 0;">Không có dữ liệu</div>`;
            }

            content += `</div>`;
            return content;
          },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 4 },
        markers: { size: 0, hover: { size: 6 } },
        xaxis: {
          categories,
          labels: {
            style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          show: false,
          max: overallMax > 0 ? overallMax * 1.35 : 10,
        },
        grid: {
          show: true,
          borderColor: "rgba(163, 174, 208, 0.1)",
          strokeDashArray: 5,
          padding: { top: 60, bottom: 0, left: 10, right: 10 },
        },
        legend: {
          show: true,
          position: "bottom",
          horizontalAlign: "center",
          fontSize: "14px",
          fontWeight: 700,
          labels: { colors: "#A3AED0" },
          itemMargin: { horizontal: 15, vertical: 10 },
          markers: { size: 6, shape: "circle", strokeWidth: 0 },
        },
        colors: [
          TaskPriorityColors.urgent.hex,
          TaskPriorityColors.high.hex,
          TaskPriorityColors.medium.hex,
          TaskPriorityColors.low.hex,
        ],
      } as ApexOptions,
      series: [
        { name: TaskPriorityLabels.urgent, data: urgentData },
        { name: TaskPriorityLabels.high, data: highData },
        { name: TaskPriorityLabels.medium, data: mediumData },
        { name: TaskPriorityLabels.low, data: lowData },
      ],
    };
  }, [data, timeRange]);

  return {
    timeRange,
    setTimeRange,
    loading,
    summary,
    peakDay,
    dateRangeLabel,
    chartData,
  };
}
