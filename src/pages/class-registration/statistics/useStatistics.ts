import React from "react";
import type { ApexOptions } from "apexcharts";
import { message as toast } from "antd";
import { classRegistrationsService } from "@/services/class-registration";
import {
  type ClassRegistrationStatsItem,
  RegistrationActionLabels,
  RegistrationActionColors,
} from "@/types/classRegistration";
import { type TimeRangeType, getDateRange } from "./utils/dateRange";

interface Summary {
  total: number;
  cancel: number;
  requestOpen: number;
  register: number;
}

interface PeakDay {
  date: Date;
  total: number;
  formattedDate: string;
}

interface AreaChartData {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
}

interface BarChartData {
  options: ApexOptions;
  series: { name: string; data: number[] }[];
}

interface UseStatisticsReturn {
  timeRange: TimeRangeType;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRangeType>>;
  loading: boolean;
  summary: Summary;
  peakDay: PeakDay | null;
  dateRangeLabel: string;
  areaChartData: AreaChartData;
  barChartData: BarChartData;
}

export function useStatistics(): UseStatisticsReturn {
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeType>("this_week");
  const [loading, setLoading] = React.useState(false);
  const [summaryData, setSummaryData] = React.useState<
    Record<string, ClassRegistrationStatsItem | number>
  >({});
  const [detailData, setDetailData] = React.useState<
    Record<string, ClassRegistrationStatsItem>
  >({});

  const fetchStats = React.useCallback(async (range: TimeRangeType) => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const [summaryRes, detailRes] = await Promise.all([
        classRegistrationsService.getStats({
          from: from.toISOString(),
          to: to.toISOString(),
          isDetail: false,
        }),
        classRegistrationsService.getStats({
          from: from.toISOString(),
          to: to.toISOString(),
          isDetail: true,
        }),
      ]);
      setSummaryData(summaryRes as Record<string, ClassRegistrationStatsItem>);
      setDetailData(detailRes as Record<string, ClassRegistrationStatsItem>);
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

  const summary = React.useMemo((): Summary => {
    let total = 0;
    let cancel = 0;
    let requestOpen = 0;
    let register = 0;

    Object.values(detailData).forEach((item) => {
      total += item.total || 0;
      if (item.detail) {
        cancel += item.detail.cancel?.total || 0;
        requestOpen += item.detail.requestOpen?.total || 0;
        register += item.detail.register?.total || 0;
      }
    });

    return { total, cancel, requestOpen, register };
  }, [detailData]);

  const peakDay = React.useMemo((): PeakDay | null => {
    let max = -1;
    let peakDate = "";

    Object.keys(detailData).forEach((key) => {
      const total = detailData[key].total || 0;
      if (total > max) {
        max = total;
        peakDate = key;
      } else if (total === max && max !== -1) {
        if (new Date(key) > new Date(peakDate)) {
          peakDate = key;
        }
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
  }, [detailData]);

  const dateRangeLabel = React.useMemo(() => {
    const { from, to } = getDateRange(timeRange);
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `từ ${fmt(from)} đến ${fmt(to)}`;
  }, [timeRange]);

  const areaChartData = React.useMemo((): AreaChartData => {
    const { from, to } = getDateRange(timeRange);

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    const categories: string[] = [];
    const totalSeries: number[] = [];

    const dataByLocalDate = new Map<string, number>();
    Object.keys(summaryData).forEach((key) => {
      const d = new Date(key);
      const localKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const val = summaryData[key];
      const total = typeof val === "number" ? val : val?.total || 0;
      dataByLocalDate.set(localKey, total);
    });

    let overallMax = 0;
    const current = new Date(start);
    while (current <= end) {
      categories.push(`${current.getDate()}/${current.getMonth() + 1}`);
      const localKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      const val = dataByLocalDate.get(localKey) || 0;
      totalSeries.push(val);
      overallMax = Math.max(overallMax, val);
      current.setDate(current.getDate() + 1);
    }

    return {
      options: {
        chart: { toolbar: { show: false } },
        tooltip: {
          theme: "dark",
          custom: function ({
            series,
            seriesIndex,
            dataPointIndex,
          }: {
            series: number[][];
            seriesIndex: number;
            dataPointIndex: number;
          }) {
            const val = series[seriesIndex][dataPointIndex];
            return `
              <div style="padding: 10px 14px; display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">Tổng yêu cầu</div>
                <div style="font-size: 13px; display: flex; justify-content: space-between;">
                  <span>Số lượng:</span> <span style="color: white; font-weight: 600;">${val || 0}</span>
                </div>
              </div>
            `;
          },
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 4 },
        xaxis: {
          categories,
          labels: {
            style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { show: false, max: overallMax > 0 ? overallMax * 1.3 : 10 },
        grid: {
          show: false,
          strokeDashArray: 5,
          padding: { top: 50, bottom: 0, left: 10, right: 10 },
        },
        colors: ["#4318FF"],
      } as ApexOptions,
      series: [{ name: "Tổng yêu cầu", data: totalSeries }],
    };
  }, [summaryData, timeRange]);

  const barChartData = React.useMemo((): BarChartData => {
    const { from, to } = getDateRange(timeRange);

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    const categories: string[] = [];
    const registerSeries: number[] = [];
    const cancelSeries: number[] = [];
    const openSeries: number[] = [];

    const dataByLocalDate = new Map<string, ClassRegistrationStatsItem>();
    Object.keys(detailData).forEach((key) => {
      const d = new Date(key);
      const localKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      dataByLocalDate.set(localKey, detailData[key]);
    });

    const rawDetails: Array<ClassRegistrationStatsItem["detail"] | undefined> =
      [];

    let stackedMax = 0;
    const current = new Date(start);
    while (current <= end) {
      categories.push(`${current.getDate()}/${current.getMonth() + 1}`);
      const localKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      const item = dataByLocalDate.get(localKey);

      const r = item?.detail?.register?.total || 0;
      const c = item?.detail?.cancel?.total || 0;
      const o = item?.detail?.requestOpen?.total || 0;

      registerSeries.push(r);
      cancelSeries.push(c);
      openSeries.push(o);
      rawDetails.push(item?.detail);

      const dayTotal = r + c + o;
      stackedMax = Math.max(stackedMax, dayTotal);
      current.setDate(current.getDate() + 1);
    }

    return {
      options: {
        chart: { stacked: true, toolbar: { show: false } },
        tooltip: {
          theme: "dark",
          shared: false,
          intersect: true,
          custom: function ({
            seriesIndex,
            dataPointIndex,
          }: {
            seriesIndex: number;
            dataPointIndex: number;
          }) {
            const detail = rawDetails[dataPointIndex];
            const actionKey =
              seriesIndex === 0
                ? "register"
                : seriesIndex === 1
                  ? "cancel"
                  : "requestOpen";
            const stats = detail?.[actionKey];
            const label =
              RegistrationActionLabels[
                actionKey as keyof typeof RegistrationActionLabels
              ];
            if (!stats) {
              return `<div style="padding: 8px 12px; font-size: 13px;">Không có dữ liệu (${label})</div>`;
            }
            return `
              <div style="padding: 10px 14px; display: flex; flex-direction: column; gap: 4px; min-width: 140px;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${label}</div>
                <div style="font-size: 12px; display: flex; justify-content: space-between;">
                  <span>Đã duyệt:</span> <span style="color: #10b981; font-weight: 500;">${stats.approved || 0}</span>
                </div>
                <div style="font-size: 12px; display: flex; justify-content: space-between;">
                  <span>Từ chối:</span> <span style="color: #ef4444; font-weight: 500;">${stats.rejected || 0}</span>
                </div>
                <div style="font-size: 12px; display: flex; justify-content: space-between;">
                  <span>Đang chờ:</span> <span style="color: #f59e0b; font-weight: 500;">${stats.pending || 0}</span>
                </div>
                <div style="font-size: 13px; font-weight: 600; margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.2); display: flex; justify-content: space-between;">
                  <span>Tổng cộng:</span> <span>${stats.total || 0}</span>
                </div>
              </div>
            `;
          },
        },
        dataLabels: { enabled: false },
        plotOptions: {
          bar: {
            borderRadius: 4,
            borderRadiusApplication: "end",
            borderRadiusWhenStacked: "last",
            columnWidth: "15px",
          },
        },
        xaxis: {
          categories,
          labels: {
            style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { show: false, max: stackedMax > 0 ? stackedMax * 1.3 : 10 },
        grid: {
          show: false,
          padding: { top: 50, bottom: 0, left: 10, right: 10 },
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
          RegistrationActionColors.register.hex,
          RegistrationActionColors.cancel.hex,
          RegistrationActionColors.requestOpen.hex,
        ],
      } as ApexOptions,
      series: [
        { name: RegistrationActionLabels.register, data: registerSeries },
        { name: RegistrationActionLabels.cancel, data: cancelSeries },
        { name: RegistrationActionLabels.requestOpen, data: openSeries },
      ],
    };
  }, [detailData, timeRange]);

  return {
    timeRange,
    setTimeRange,
    loading,
    summary,
    peakDay,
    dateRangeLabel,
    areaChartData,
    barChartData,
  };
}
