import React from "react";
import { tasksService } from "@/services/tasks.service";
import {
  type TaskStats,
  TaskPriority,
  TaskPriorityLabels,
  TaskPriorityColors,
  TaskStatus,
  TaskStatusLabels,
  TaskStatusColors,
} from "@/types/task";
import { message as toast } from "antd";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";
import balanceImg from "@/assets/img/dashboards/balanceImg.png";
import fakeGraph from "@/assets/img/dashboards/fakeGraph.png";
import { MdInsights } from "react-icons/md";

type TimeRangeType = "last_7_days" | "last_14_days" | "last_1_month";

const getDateRange = (range: TimeRangeType) => {
  const to = new Date();
  const from = new Date();
  if (range === "last_7_days") from.setDate(to.getDate() - 7);
  else if (range === "last_14_days") from.setDate(to.getDate() - 14);
  else if (range === "last_1_month") from.setMonth(to.getMonth() - 1);
  return { from, to };
};

const TaskStatisticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = React.useState<TimeRangeType>("last_1_month");
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
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi lấy thống kê.";
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
    const statusCounts = { todo: 0, doing: 0, done: 0, cancelled: 0 };

    Object.values(data).forEach((item) => {
      if (typeof item !== "number") {
        total += item.total || 0;
        if (item.detail) {
          Object.values(item.detail).forEach((d) => {
            statusCounts.todo += d.todo || 0;
            statusCounts.doing += d.doing || 0;
            statusCounts.done += d.done || 0;
            statusCounts.cancelled += d.cancelled || 0;
          });
        }
      }
    });

    return { total, ...statusCounts };
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

  const lineChartData = React.useMemo(() => {
    const { from, to } = getDateRange(timeRange);
    const categories: string[] = [];
    const totalSeries: number[] = [];
    const dataByLocalDate = new Map<string, number>();

    Object.keys(data).forEach((key) => {
      const d = new Date(key);
      const localKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const item = data[key];
      dataByLocalDate.set(localKey, typeof item === "number" ? item : item.total || 0);
    });

    const current = new Date(from);
    while (current <= to) {
      categories.push(`${current.getDate()}/${current.getMonth() + 1}`);
      const localKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      totalSeries.push(dataByLocalDate.get(localKey) || 0);
      current.setDate(current.getDate() + 1);
    }

    return {
      options: {
        chart: { toolbar: { show: false } },
        stroke: { curve: "smooth", width: 4 },
        xaxis: {
          categories,
          labels: { style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" } },
        },
        yaxis: { show: false },
        grid: { show: false },
        colors: ["#4318FF"],
      },
      series: [{ name: "Tổng công việc", data: totalSeries }],
    };
  }, [data, timeRange]);

  const barChartData = React.useMemo(() => {
    const { from, to } = getDateRange(timeRange);
    const categories: string[] = [];
    const seriesData: Record<string, number[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };

    const dataByLocalDate = new Map<string, any>();
    Object.keys(data).forEach((key) => {
      const d = new Date(key);
      const localKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      dataByLocalDate.set(localKey, data[key]);
    });

    const current = new Date(from);
    while (current <= to) {
      categories.push(`${current.getDate()}/${current.getMonth() + 1}`);
      const localKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      const item = dataByLocalDate.get(localKey);
      
      Object.keys(seriesData).forEach(p => {
        const priorityStats = (item && typeof item !== 'number' && item.detail) ? item.detail[p] : null;
        seriesData[p].push(priorityStats?.total || 0);
      });

      current.setDate(current.getDate() + 1);
    }

    return {
      options: {
        chart: { stacked: true, toolbar: { show: false } },
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
          labels: { style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" } },
        },
        yaxis: { show: false },
        grid: { show: false },
        legend: { show: false },
        colors: [
          TaskPriorityColors.urgent.hex,
          TaskPriorityColors.high.hex,
          TaskPriorityColors.medium.hex,
          TaskPriorityColors.low.hex,
        ],
      },
      series: [
        { name: TaskPriorityLabels.urgent, data: seriesData.urgent },
        { name: TaskPriorityLabels.high, data: seriesData.high },
        { name: TaskPriorityLabels.medium, data: seriesData.medium },
        { name: TaskPriorityLabels.low, data: seriesData.low },
      ],
    };
  }, [data, timeRange]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-navy-700 text-2xl font-bold dark:text-white">
          Thống kê công việc
        </h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
          className="text-navy-700 rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium outline-none dark:border-white/10 dark:bg-navy-800 dark:text-white"
        >
          <option value="last_7_days">7 ngày qua</option>
          <option value="last_14_days">14 ngày qua</option>
          <option value="last_1_month">1 tháng qua</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="flex flex-col gap-5 lg:col-span-3">
          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 relative flex w-full flex-col rounded-4xl bg-white p-6 dark:shadow-none">
            <h2 className="text-navy-700 text-3xl font-bold dark:text-white">
              {summary.total}
            </h2>
            <p className="text-gray-600 text-sm font-medium">Tổng công việc</p>
            <div className="h-64 w-full pt-4">
              <LineChart chartOptions={lineChartData.options} chartData={lineChartData.series} />
            </div>
          </div>

          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 relative flex w-full flex-col rounded-4xl bg-white p-6 dark:shadow-none">
            <h2 className="text-navy-700 text-lg font-bold dark:text-white">Độ ưu tiên</h2>
            <div className="h-75 w-full pt-4">
              <BarChart chartOptions={barChartData.options} chartData={barChartData.series} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-xl bg-white p-4 dark:shadow-none">
            <div className="relative flex h-48 w-full flex-col overflow-hidden rounded-xl bg-indigo-600 p-4">
              <img src={balanceImg} className="absolute right-0 top-0 h-full w-full object-cover opacity-20" alt="" />
              <div className="relative z-10 flex flex-col justify-between h-full text-white">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium opacity-80">Tổng số công việc</p>
                    <h2 className="text-3xl font-bold">{summary.total}</h2>
                  </div>
                  <img src={fakeGraph} className="h-10 w-20" alt="" />
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <p className="text-xs opacity-70">Xong</p>
                    <p className="font-bold">{summary.done}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs opacity-70">Đang làm</p>
                    <p className="font-bold">{summary.doing}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {peakDay && (
            <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-xl bg-white p-4 dark:shadow-none">
              <h4 className="text-navy-700 mb-3 text-lg font-bold dark:text-white">{peakDay.formattedDate}</h4>
              <div className="bg-peak-day-gradient flex flex-col rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <MdInsights className="text-brand-500 h-10 w-10" />
                  <div className="text-right">
                    <p className="text-navy-700 text-sm font-bold dark:text-white">Cao nhất</p>
                    <p className="text-xs font-medium text-gray-500">{dateRangeLabel}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-navy-700 text-4xl font-bold dark:text-white">{peakDay.total}</h2>
                  <p className="text-navy-700 mt-1 text-lg font-medium dark:text-white">số lượng công việc</p>
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
