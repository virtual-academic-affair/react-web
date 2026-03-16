import type { ApexOptions } from "apexcharts";
import balanceImg from "@/assets/img/dashboards/balanceImg.png";
import fakeGraph from "@/assets/img/dashboards/fakeGraph.png";
import LineChart from "@/components/charts/LineChart";
import { tasksService } from "@/services/tasks.service";
import {
  type TaskStats,
  type TaskStatsItem,
  TaskPriorityColors,
  TaskPriorityLabels,
} from "@/types/task";
import { message as toast } from "antd";
import React from "react";
import {
  MdAssignmentTurnedIn,
  MdInsights,
  MdOutlineAssignment,
  MdPendingActions,
} from "react-icons/md";

type TimeRangeType =
  | "this_week"
  | "last_1_week"
  | "last_2_weeks"
  | "last_1_month"
  | "next_month";

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
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "next_month": {
      const from = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    default:
      return { from: now, to: now };
  }
}

const TaskStatisticsPage: React.FC = () => {
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeType>("this_week");
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<TaskStats>({});

  const fetchStats = React.useCallback(async (range: TimeRangeType) => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const res = await tasksService.getStats({
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

  const summary = React.useMemo(() => {
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

  const peakDay = React.useMemo(() => {
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
  }, [data]);

  const dateRangeLabel = React.useMemo(() => {
    const { from, to } = getDateRange(timeRange);
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `từ ${fmt(from)} đến ${fmt(to)}`;
  }, [timeRange]);

  const chartData = React.useMemo(() => {
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

    // For tooltip data
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
        chart: {
          toolbar: { show: false },
        },
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
              const val = series[idx][dataPointIndex];
              const stats = detail?.[pKey];
              const label =
                TaskPriorityLabels[pKey as keyof typeof TaskPriorityLabels];
              const color =
                TaskPriorityColors[pKey as keyof typeof TaskPriorityColors].hex;

              if (val > 0 || stats) {
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
        markers: {
          size: 0,
          hover: {
            size: 6,
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
          max: overallMax > 0 ? overallMax * 1.35 : 10,
        },
        grid: {
          show: true,
          borderColor: "rgba(163, 174, 208, 0.1)",
          strokeDashArray: 5,
          padding: {
            top: 60,
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
          TaskPriorityColors.urgent.hex,
          TaskPriorityColors.high.hex,
          TaskPriorityColors.medium.hex,
          TaskPriorityColors.low.hex,
        ],
      } as ApexOptions,
      series: [
        {
          name: TaskPriorityLabels.urgent,
          data: urgentData,
        },
        {
          name: TaskPriorityLabels.high,
          data: highData,
        },
        {
          name: TaskPriorityLabels.medium,
          data: mediumData,
        },
        {
          name: TaskPriorityLabels.low,
          data: lowData,
        },
      ],
    };
  }, [data, timeRange]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Left Side: Charts (3/4 width) */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          {/* Main Chart */}
          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 relative flex w-full flex-col rounded-4xl bg-white p-6 dark:shadow-none">
            <div className="flex flex-row items-start justify-between">
              <div className="flex flex-col">
                <h2 className="text-navy-700 text-3xl font-bold dark:text-white">
                  {summary.total}
                </h2>
                <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
                  Tổng số công việc
                </p>
              </div>
            </div>

            <div className="h-125 w-full pt-4">
              {!loading ? (
                chartData.options.xaxis?.categories &&
                chartData.options.xaxis.categories.length > 0 ? (
                  <LineChart
                    key={`line-chart-${timeRange}`}
                    chartOptions={chartData.options as ApexOptions}
                    chartData={chartData.series}
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
            <option value="this_week">Tuần này</option>
            <option value="next_month">Tháng sau</option>
            <option value="last_1_month">Tháng này</option>
            <option value="last_1_week">Tuần vừa qua</option>
            <option value="last_2_weeks">2 tuần qua</option>
          </select>

          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
            {/* Top part: Purple rounded container */}
            <div
              className="relative mb-6 flex flex-col justify-between rounded-3xl bg-[#11047A] bg-cover bg-no-repeat p-6 dark:bg-[#1b264b]"
              style={{ backgroundImage: `url(${balanceImg})` }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-medium text-white">
                  Tổng công việc
                </h4>
              </div>
              <div className="mt-4 flex flex-row items-center justify-between">
                <h2 className="text-4xl font-bold text-white">
                  {summary.total}
                </h2>
                <img
                  src={fakeGraph}
                  alt="graph"
                  className="h-5 w-auto opacity-80"
                />
              </div>
            </div>

            {/* Bottom part: Recent list */}
            <div className="flex flex-col gap-4">
              <h4 className="text-navy-700 text-lg font-bold dark:text-white">
                Trạng thái
              </h4>

              {/* Item: Done */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                    <MdAssignmentTurnedIn className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h5 className="text-navy-700 text-sm font-bold dark:text-white">
                      Đã hoàn thành
                    </h5>
                    <p className="text-xs font-medium text-gray-500">
                      {summary.total > 0
                        ? ((summary.done / summary.total) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <p className="text-navy-700 text-sm font-bold dark:text-white">
                  {summary.done}
                </p>
              </div>

              {/* Item: Doing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                    <MdPendingActions className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h5 className="text-navy-700 text-sm font-bold dark:text-white">
                      Đang thực hiện
                    </h5>
                    <p className="text-xs font-medium text-gray-500">
                      {summary.total > 0
                        ? ((summary.doing / summary.total) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <p className="text-navy-700 text-sm font-bold dark:text-white">
                  {summary.doing}
                </p>
              </div>

              {/* Item: Todo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <MdOutlineAssignment className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <h5 className="text-navy-700 text-sm font-bold dark:text-white">
                      Cần làm
                    </h5>
                    <p className="text-xs font-medium text-gray-500">
                      {summary.total > 0
                        ? ((summary.todo / summary.total) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
                <p className="text-navy-700 text-sm font-bold dark:text-white">
                  {summary.todo}
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
                    số lượng công việc
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

export default TaskStatisticsPage;
