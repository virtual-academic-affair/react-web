import React from "react";
import type { ApexOptions } from "apexcharts";
import { message as toast } from "antd";
import { inquiriesService } from "@/services/inquiry";
import type { InquiryStats, InquiryType } from "@/types/inquiry";
import { InquiryTypeLabels, InquiryTypeColors } from "@/types/inquiry";
import { type TimeRangeType, getDateRange } from "./utils/dateRange";

const INQUIRY_TYPES = ["graduation", "training", "procedure"] as const;

interface Summary {
  total: number;
  totalTypes: number;
  graduation: number;
  training: number;
  procedure: number;
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

interface UseInquiryStatisticsReturn {
  timeRange: TimeRangeType;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRangeType>>;
  loading: boolean;
  summary: Summary;
  peakDay: PeakDay | null;
  dateRangeLabel: string;
  chartData: ChartData;
}

export function useInquiryStatistics(): UseInquiryStatisticsReturn {
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeType>("this_week");
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<InquiryStats>({});

  const fetchStats = React.useCallback(async (range: TimeRangeType) => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const res = await inquiriesService.getStats({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setData(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi lấy thống kê.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange, fetchStats]);

  /**
   * Build a local-date-keyed map from raw API data.
   * API keys are ISO UTC strings (e.g. "2026-03-16T00:00:00.000Z"),
   * types counts are nested under a "types" object.
   */
  const dataByLocalDate = React.useMemo(() => {
    const map = new Map<
      string,
      { total: number; types: Record<InquiryType, number> }
    >();
    Object.entries(data || {}).forEach(([isoKey, val]) => {
      const d = new Date(isoKey);
      // Use local date components to avoid UTC-offset mismatch (e.g. UTC+7)
      const localKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      map.set(localKey, {
        total: val.total || 0,
        types: {
          graduation: val.types?.graduation || 0,
          training: val.types?.training || 0,
          procedure: val.types?.procedure || 0,
        },
      });
    });
    return map;
  }, [data]);

  const summary = React.useMemo((): Summary => {
    let total = 0;
    const byType: Record<InquiryType, number> = {
      graduation: 0,
      training: 0,
      procedure: 0,
    };

    dataByLocalDate.forEach((val) => {
      total += val.total;
      byType.graduation += val.types.graduation;
      byType.training += val.types.training;
      byType.procedure += val.types.procedure;
    });

    const totalTypes =
      byType.graduation + byType.training + byType.procedure;
    return { total, totalTypes, ...byType };
  }, [dataByLocalDate]);

  const peakDay = React.useMemo((): PeakDay | null => {
    let max = -1;
    let peakKey = "";

    dataByLocalDate.forEach((val, key) => {
      if (val.total > max) {
        max = val.total;
        peakKey = key;
      }
    });

    if (!peakKey || max <= 0) return null;
    // Append T00:00:00 to force local-timezone parsing (bare "YYYY-M-D" parses as UTC)
    const d = new Date(peakKey + "T00:00:00");
    return {
      date: d,
      total: max,
      formattedDate: d.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "short",
      }),
    };
  }, [dataByLocalDate]);

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
    const graduationData: number[] = [];
    const trainingData: number[] = [];
    const procedureData: number[] = [];
    const tooltipMeta: Array<Record<InquiryType, number> | undefined> = [];

    let overallMax = 0;

    const current = new Date(start);
    while (current <= end) {
      categories.push(`${current.getDate()}/${current.getMonth() + 1}`);
      const localKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      const item = dataByLocalDate.get(localKey);

      const g = item?.types.graduation || 0;
      const tr = item?.types.training || 0;
      const p = item?.types.procedure || 0;

      graduationData.push(g);
      trainingData.push(tr);
      procedureData.push(p);

      overallMax = Math.max(overallMax, g, tr, p);
      tooltipMeta.push(item?.types);

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
            const types = tooltipMeta[dataPointIndex];
            const dateStr = categories[dataPointIndex];
            const typeKeys = ["graduation", "training", "procedure"] as const;

            let content = `<div style="padding: 12px; min-width: 200px; background: #111c44; color: white; border-radius: 8px;">`;
            content += `<div style="font-weight: 800; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">Ngày ${dateStr}</div>`;

            typeKeys.forEach((tKey, idx) => {
              const val = series[idx]?.[dataPointIndex] ?? 0;
              const color = InquiryTypeColors[tKey].hex;
              const label = InquiryTypeLabels[tKey];

              if (val > 0) {
                content += `
                  <div style="margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
                      <span style="font-weight: bold; font-size: 12px; color: ${color}; text-transform: uppercase;">${label}</span>
                    </div>
                    <div style="padding-left: 14px; display: flex; flex-direction: column; gap: 2px;">
                      <div style="font-size: 11px; display: flex; justify-content: space-between;">
                        <span>Số thắc mắc:</span> <span style="color: ${color}; font-weight: 600;">${val}</span>
                      </div>
                    </div>
                  </div>
                `;
              }
            });

            if (!types || Object.values(types).every((v) => v === 0)) {
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
        colors: INQUIRY_TYPES.map((t) => InquiryTypeColors[t].hex),
      } as ApexOptions,
      series: [
        { name: InquiryTypeLabels.graduation, data: graduationData },
        { name: InquiryTypeLabels.training, data: trainingData },
        { name: InquiryTypeLabels.procedure, data: procedureData },
      ],
    };
  }, [dataByLocalDate, timeRange]);

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
