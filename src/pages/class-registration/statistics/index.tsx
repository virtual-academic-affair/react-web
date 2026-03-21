import { classRegistrationsService } from "@/services/class-registration";
import {
  type ClassRegistrationStatsItem,
  RegistrationActionLabels,
  RegistrationActionColors,
} from "@/types/classRegistration";
import type { ApexOptions } from "apexcharts";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import balanceImg from "@/assets/img/dashboards/balanceImg.png";
import fakeGraph from "@/assets/img/dashboards/fakeGraph.png";
import {
  MdAppRegistration,
  MdOutlineCancel,
  MdOutlineOpenInBrowser,
  MdInsights,
} from "react-icons/md";

type TimeRangeType =
  | "this_week"
  | "last_1_week"
  | "last_2_weeks"
  | "last_1_month";

function getStartOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getEndOfWeek(date: Date) {
  const start = getStartOfWeek(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
}

function getDateRange(range: TimeRangeType) {
  const now = new Date();
  switch (range) {
    case "this_week": {
      const from = getStartOfWeek(new Date(now));
      from.setHours(0, 0, 0, 0);
      const to = getEndOfWeek(new Date(now));
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last_1_week": {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last_2_weeks": {
      const from = new Date(now);
      from.setDate(now.getDate() - 14);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last_1_month": {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    default:
      return { from: now, to: now };
  }
}

const ClassRegistrationStatisticsPage: React.FC = () => {
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeType>("this_week");

  const { from, to } = React.useMemo(() => getDateRange(timeRange), [timeRange]);

  const { data: summaryData = {}, isLoading: loadingSummary } = useQuery({
    queryKey: ["class-registration-stats", "summary", timeRange],
    queryFn: () => classRegistrationsService.getStats({
      from: from.toISOString(),
      to: to.toISOString(),
      isDetail: false,
    }) as Promise<Record<string, ClassRegistrationStatsItem>>,
    staleTime: 5 * 60 * 1000,
  });

  const { data: detailData = {}, isLoading: loadingDetail } = useQuery({
    queryKey: ["class-registration-stats", "detail", timeRange],
    queryFn: () => classRegistrationsService.getStats({
      from: from.toISOString(),
      to: to.toISOString(),
      isDetail: true,
    }) as Promise<Record<string, ClassRegistrationStatsItem>>,
    staleTime: 5 * 60 * 1000,
  });

  const loading = loadingSummary || loadingDetail;

  const summary = React.useMemo(() => {
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

  const peakDay = React.useMemo(() => {
    let max = -1;
    let peakDate = "";

    Object.keys(detailData).forEach((key) => {
      const total = detailData[key].total || 0;
      if (total > max) {
        max = total;
        peakDate = key;
      } else {
        if (total === max && max !== -1) {
          if (new Date(key) > new Date(peakDate)) {
            peakDate = key;
          }
        }
      }
    });

    if (!peakDate || max <= 0) {
      return null;
    }
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

  const areaChartData = React.useMemo(() => {
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
        chart: {
          toolbar: { show: false },
        },
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
        yaxis: {
          show: false,
          max: overallMax > 0 ? overallMax * 1.3 : 10,
        },
        grid: {
          show: false,
          strokeDashArray: 5,
          padding: {
            top: 50,
            bottom: 0,
            left: 10,
            right: 10,
          },
        },
        colors: ["#4318FF"],
      } as ApexOptions,
      series: [
        {
          name: "Tổng yêu cầu",
          data: totalSeries,
        },
      ],
    };
  }, [summaryData, timeRange]);

  const barChartData = React.useMemo(() => {
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
        chart: {
          stacked: true,
          toolbar: { show: false },
        },
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
        yaxis: {
          show: false,
          max: stackedMax > 0 ? stackedMax * 1.3 : 10,
        },
        grid: {
          show: false,
          padding: {
            top: 50,
            bottom: 0,
            left: 10,
            right: 10,
          },
        },
        legend: {
          show: true,
          position: "bottom",
          horizontalAlign: "center",
          fontSize: "14px",
          fontWeight: 700,
          labels: {
            colors: "#A3AED0",
          },
          itemMargin: {
            horizontal: 15,
            vertical: 10,
          },
          markers: {
            size: 6,
            shape: "circle",
            strokeWidth: 0,
          },
        },
        colors: [
          RegistrationActionColors.register.hex,
          RegistrationActionColors.cancel.hex,
          RegistrationActionColors.requestOpen.hex,
        ],
      } as ApexOptions,
      series: [
        {
          name: RegistrationActionLabels.register,
          data: registerSeries,
        },
        {
          name: RegistrationActionLabels.cancel,
          data: cancelSeries,
        },
        {
          name: RegistrationActionLabels.requestOpen,
          data: openSeries,
        },
      ],
    };
  }, [detailData, timeRange]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header Dropdown */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Left Side: Charts (3/4 width) */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          {/* Total Overview Chart */}
          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 relative flex w-full flex-col rounded-4xl bg-white p-6 dark:shadow-none">
            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h2 className="text-navy-700 text-3xl font-bold dark:text-white">
                  {summary.total}
                </h2>
                <div className="flex flex-col items-start gap-1">
                  <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Tổng yêu cầu
                  </p>
                </div>
              </div>
            </div>

            <div className="h-62.5 w-full pt-4">
              {!loading ? (
                areaChartData.options.xaxis?.categories &&
                areaChartData.options.xaxis.categories.length > 0 ? (
                  <LineChart
                    chartOptions={areaChartData.options as ApexOptions}
                    chartData={areaChartData.series}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    Không có dữ liệu
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Đang tải...
                </div>
              )}
            </div>
          </div>

          {/* Detailed Stats Chart */}
          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 relative flex w-full flex-col rounded-4xl bg-white p-6 dark:shadow-none">
            <div className="flex flex-row items-start justify-between">
              <div className="flex flex-col">
                <h2 className="text-navy-700 text-lg font-bold dark:text-white">
                  Chi tiết yêu cầu
                </h2>
              </div>
            </div>

            <div className="h-75 w-full pt-4">
              {!loading ? (
                barChartData.options.xaxis?.categories &&
                barChartData.options.xaxis.categories.length > 0 ? (
                  <BarChart
                    key={`bar-chart-${timeRange}`}
                    chartOptions={barChartData.options as ApexOptions}
                    chartData={barChartData.series}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    Không có dữ liệu
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Đang tải...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Widgets (1/4 width) */}
        <div className="flex flex-col gap-5 lg:col-span-1">
          <select
            className="dark:border-navy-600 dark:bg-navy-900 rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none dark:text-white"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
            disabled={loading}
          >
            <option value="last_1_month">Tháng này</option>
            <option value="last_2_weeks">2 tuần qua</option>
            <option value="last_1_week">Tuần trước</option>
            <option value="this_week">Tuần này</option>
          </select>

          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
            {/* Top part: Purple rounded container */}
            <div
              className="relative mb-6 flex flex-col justify-between rounded-3xl bg-[#11047A] bg-cover bg-no-repeat p-6 dark:bg-[#1b264b]"
              style={{ backgroundImage: `url(${balanceImg})` }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-medium text-white">
                  Tổng yêu cầu
                </h4>
              </div>
              <div className="mt-4 flex flex-row items-center justify-between">
                <h2 className="text-4xl font-bold text-white">
                  {summary.total}
                </h2>
                <img
                  src={fakeGraph}
                  alt="graph"
                  className="h-[20px] w-auto opacity-80"
                />
              </div>
            </div>

            {/* Bottom part: Recent list */}
            <div className="flex flex-col">
              <h4 className="text-navy-700 mb-4 text-lg font-bold dark:text-white">
                Chi tiết
              </h4>

              {/* Item 1: Register */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FE]">
                    <MdAppRegistration
                      className="h-6 w-6"
                      style={{ color: RegistrationActionColors.register.hex }}
                    />
                  </div>
                  <div>
                    <h5 className="text-navy-700 text-base font-bold dark:text-white">
                      {RegistrationActionLabels.register}
                    </h5>
                    <p className="text-sm font-medium text-gray-500">
                      {summary.total > 0
                        ? ((summary.register / summary.total) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <p className="text-navy-700 text-base font-bold dark:text-white">
                  {summary.register}
                </p>
              </div>

              {/* Item 2: Cancel */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FE]">
                    <MdOutlineCancel
                      className="h-6 w-6"
                      style={{ color: RegistrationActionColors.cancel.hex }}
                    />
                  </div>
                  <div>
                    <h5 className="text-navy-700 text-base font-bold dark:text-white">
                      {RegistrationActionLabels.cancel}
                    </h5>
                    <p className="text-sm font-medium text-gray-500">
                      {summary.total > 0
                        ? ((summary.cancel / summary.total) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <p className="text-navy-700 text-base font-bold dark:text-white">
                  {summary.cancel}
                </p>
              </div>

              {/* Item 3: Request Open */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FE]">
                    <MdOutlineOpenInBrowser
                      className="h-6 w-6"
                      style={{
                        color: RegistrationActionColors.requestOpen.hex,
                      }}
                    />
                  </div>
                  <div>
                    <h5 className="text-navy-700 text-base font-bold dark:text-white">
                      {RegistrationActionLabels.requestOpen}
                    </h5>
                    <p className="text-sm font-medium text-gray-500">
                      {summary.total > 0
                        ? ((summary.requestOpen / summary.total) * 100).toFixed(
                            1,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <p className="text-navy-700 text-base font-bold dark:text-white">
                  {summary.requestOpen}
                </p>
              </div>
            </div>
          </div>

          {/* Peak Day Card */}
          {peakDay && (
            <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
              <h4 className="text-navy-700 mb-3 text-lg font-bold dark:text-white">
                {peakDay.formattedDate}
              </h4>
              <div className="bg-peak-day-gradient flex flex-col rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <MdInsights className="text-brand-500 h-10 w-10" />
                  <div className="text-right">
                    <p className="text-navy-700 text-sm font-bold dark:text-white">
                      Cao nhất
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      {dateRangeLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col">
                  <h2 className="text-navy-700 text-4xl font-bold dark:text-white">
                    {peakDay.total}
                  </h2>
                  <p className="text-navy-700 mt-1 text-lg font-medium dark:text-white">
                    số lượng yêu cầu
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassRegistrationStatisticsPage;
