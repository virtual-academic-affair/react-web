import { inquiriesService } from "@/services/inquiry";
import type { InquiryStats, InquiryType } from "@/types/inquiry";
import { InquiryTypeColors, InquiryTypeLabels } from "@/types/inquiry";
import type { ApexOptions } from "apexcharts";
import { message as toast } from "antd";
import React from "react";
import LineChart from "@/components/charts/LineChart";
import balanceImg from "@/assets/img/dashboards/balanceImg.png";
import fakeGraph from "@/assets/img/dashboards/fakeGraph.png";
import { MdInsights, MdQuestionAnswer } from "react-icons/md";

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

const InquiryStatisticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = React.useState<TimeRangeType>("this_week");
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<InquiryStats>({});

  const fetchStats = React.useCallback(async (range: TimeRangeType) => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const result = await inquiriesService.getStats({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setStats(result);
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
    let totalInquiries = 0;
    const byType: Record<InquiryType, number> = {
      graduation: 0,
      training: 0,
      procedure: 0,
    };

    Object.values(stats || {}).forEach((val) => {
      if (typeof val === "number") {
        totalInquiries += val;
      } else {
        totalInquiries += val.total || 0;
        byType.graduation += val.graduation || 0;
        byType.training += val.training || 0;
        byType.procedure += val.procedure || 0;
      }
    });

    const totalStats = byType.graduation + byType.training + byType.procedure;

    return { total: totalInquiries, totalStats, ...byType };
  }, [stats]);

  const peakDay = React.useMemo(() => {
    let max = -1;
    let peakDate = "";

    Object.keys(stats || {}).forEach((key) => {
      const val = stats[key];
      const totalCount = typeof val === "number" ? val : val.total || 0;
      if (totalCount > max) {
        max = totalCount;
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
  }, [stats]);

  const chartData = React.useMemo(() => {
    const { from, to } = getDateRange(timeRange);
    const categories: string[] = [];
    const series: number[] = [];

    const current = new Date(from);
    current.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    let overallMax = 0;
    while (current <= end) {
      const key = current.toISOString().split("T")[0];
      const categoryLabel = `${current.getDate()}/${current.getMonth() + 1}`;
      categories.push(categoryLabel);
      const val = stats[key];
      const count = typeof val === "number" ? val : val?.total || 0;
      series.push(count);
      overallMax = Math.max(overallMax, count);
      current.setDate(current.getDate() + 1);
    }

    return {
      options: {
        chart: { toolbar: { show: false } },
        stroke: { curve: "smooth", width: 4 },
        xaxis: {
          categories,
          labels: { style: { colors: "#A3AED0", fontSize: "12px" } },
        },
        yaxis: { show: false, max: overallMax > 0 ? overallMax * 1.3 : 10 },
        colors: ["#4318FF"],
        grid: { show: false },
        tooltip: { theme: "dark" },
      } as ApexOptions,
      series: [{ name: "Số lượng thắc mắc", data: series }],
    };
  }, [stats, timeRange]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Main Chart */}
        <div className="lg:col-span-3">
          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 rounded-4xl bg-white p-6 dark:shadow-none">
            <h2 className="text-navy-700 text-3xl font-bold dark:text-white">
              {summary.total}
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              Tổng số thắc mắc
            </p>
            <div className="h-80 w-full pt-4">
              {!loading ? (
                <LineChart
                  chartOptions={chartData.options}
                  chartData={chartData.series}
                />
              ) : (
                <div className="flex h-full items-center justify-center">Đang tải...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Widgets */}
        <div className="flex flex-col gap-5 lg:col-span-1">
          <select
            className="dark:border-navy-600 dark:bg-navy-900 rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none dark:text-white"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
          >
            <option value="this_week">Tuần này</option>
            <option value="last_1_week">Tuần trước</option>
            <option value="last_2_weeks">2 tuần qua</option>
            <option value="last_1_month">Tháng này</option>
          </select>

          <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
            <div
              className="relative mb-6 rounded-3xl bg-[#11047A] p-6 text-white"
              style={{ backgroundImage: `url(${balanceImg})`, backgroundSize: 'cover' }}
            >
              <h4 className="text-base font-medium">Tổng thắc mắc</h4>
              <div className="mt-4 flex items-center justify-between">
                <h2 className="text-4xl font-bold">{summary.total}</h2>
                <img src={fakeGraph} alt="" className="h-5 opacity-80" />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-navy-700 text-lg font-bold dark:text-white">Chi tiết theo loại</h4>
              {(["graduation", "training", "procedure"] as const).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="dark:bg-navy-700 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <MdQuestionAnswer className="h-5 w-5" style={{ color: InquiryTypeColors[type].hex }} />
                    </div>
                    <div>
                      <h5 className="text-navy-700 text-sm font-bold dark:text-white">{InquiryTypeLabels[type]}</h5>
                      <p className="text-xs text-gray-500">
                        {summary.totalStats > 0 ? ((summary[type] / summary.totalStats) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                  <span className="text-navy-700 font-bold dark:text-white">{summary[type]}</span>
                </div>
              ))}
            </div>
          </div>

          {peakDay && (
            <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 rounded-3xl bg-white p-5 dark:shadow-none">
              <h4 className="text-navy-700 mb-3 text-lg font-bold dark:text-white">{peakDay.formattedDate}</h4>
              <div className="flex items-center justify-between rounded-3xl bg-linear-to-br from-brand-400 to-brand-600 p-6 text-white">
                <MdInsights className="h-10 w-10" />
                <div className="text-right">
                  <h2 className="text-4xl font-bold">{peakDay.total}</h2>
                  <p className="text-sm opacity-80">Thắc mắc cao nhất</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InquiryStatisticsPage;
