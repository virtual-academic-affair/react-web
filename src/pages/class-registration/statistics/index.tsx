import Widget from "@/components/widget/Widget";
import { classRegistrationsService } from "@/services/class-registration";
import {
  type ClassRegistrationStatsItem,
  RegistrationActionLabels,
  RegistrationActionColors,
} from "@/types/classRegistration";
import { message as toast } from "antd";
import React from "react";
import Chart from "react-apexcharts";
import {
  MdAppRegistration,
  MdInsertChartOutlined,
  MdOutlineCancel,
  MdOutlineOpenInBrowser,
  MdBarChart,
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
    React.useState<TimeRangeType>("last_1_month");
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<
    Record<string, ClassRegistrationStatsItem>
  >({});

  const fetchStats = React.useCallback(async (range: TimeRangeType) => {
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const res = await classRegistrationsService.getStats({
        from: from.toISOString(),
        to: to.toISOString(),
        isDetail: true,
      });
      setData(res as Record<string, ClassRegistrationStatsItem>);
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
    let cancel = 0;
    let requestOpen = 0;
    let register = 0;

    Object.values(data).forEach((item) => {
      total += item.total || 0;
      if (item.detail) {
        cancel += item.detail.cancel?.total || 0;
        requestOpen += item.detail.requestOpen?.total || 0;
        register += item.detail.register?.total || 0;
      }
    });

    return { total, cancel, requestOpen, register };
  }, [data]);

  const areaChartData = React.useMemo(() => {
    const { from, to } = getDateRange(timeRange);

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    const categories: string[] = [];
    const totalSeries: number[] = [];

    const dataByLocalDate = new Map<string, number>();
    Object.keys(data).forEach((key) => {
      const d = new Date(key);
      const localKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      dataByLocalDate.set(localKey, data[key].total || 0);
    });

    const current = new Date(start);
    while (current <= end) {
      categories.push(`${current.getDate()}/${current.getMonth() + 1}`);
      const localKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      totalSeries.push(dataByLocalDate.get(localKey) || 0);
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
        stroke: { curve: "smooth", width: 3 },
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
        },
        grid: {
          show: false,
          strokeDashArray: 5,
        },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.9,
            stops: [0, 90, 100],
          },
        },
        colors: ["#4318FF"],
      },
      series: [
        {
          name: "Tổng yêu cầu",
          data: totalSeries,
        },
      ],
    };
  }, [data, timeRange]);

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
    Object.keys(data).forEach((key) => {
      const d = new Date(key);
      const localKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      dataByLocalDate.set(localKey, data[key]);
    });

    const rawDetails: Array<ClassRegistrationStatsItem["detail"] | undefined> =
      [];

    const current = new Date(start);
    while (current <= end) {
      categories.push(`${current.getDate()}/${current.getMonth() + 1}`);
      const localKey = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
      const item = dataByLocalDate.get(localKey);

      registerSeries.push(item?.detail?.register?.total || 0);
      cancelSeries.push(item?.detail?.cancel?.total || 0);
      openSeries.push(item?.detail?.requestOpen?.total || 0);
      rawDetails.push(item?.detail);

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
        },
        grid: {
          show: false,
        },
        legend: {
          show: false, // We'll hide it or show it depending on preference, hiding makes it look cleaner like image
        },
        colors: [
          RegistrationActionColors.register.hex,
          RegistrationActionColors.cancel.hex,
          RegistrationActionColors.requestOpen.hex,
        ],
      },
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
  }, [data, timeRange]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header Dropdown */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Left Side: Charts (3/4 width) */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          {/* Total Overview Chart */}
          <div className="rounded-primary shadow-3xl shadow-shadow-500 dark:bg-navy-800 relative flex w-full flex-col bg-white p-6 dark:shadow-none">
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
                  <Chart
                    options={areaChartData.options as ApexCharts.ApexOptions}
                    series={areaChartData.series}
                    type="area"
                    width="100%"
                    height="100%"
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
          <div className="rounded-primary shadow-3xl shadow-shadow-500 dark:bg-navy-800 relative flex w-full flex-col bg-white p-6 dark:shadow-none">
            <div className="mb-auto flex flex-row justify-between">
              <div className="flex flex-col">
                <h2 className="text-navy-700 text-lg font-bold dark:text-white">
                  Chi tiết yêu cầu
                </h2>
                <div className="mt-2 flex flex-row items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div
                      className={`h-2 w-2 rounded-full`}
                      style={{
                        backgroundColor: RegistrationActionColors.register.hex,
                      }}
                    ></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {RegistrationActionLabels.register}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`h-2 w-2 rounded-full`}
                      style={{
                        backgroundColor: RegistrationActionColors.cancel.hex,
                      }}
                    ></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {RegistrationActionLabels.cancel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`h-2 w-2 rounded-full`}
                      style={{
                        backgroundColor:
                          RegistrationActionColors.requestOpen.hex,
                      }}
                    ></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {RegistrationActionLabels.requestOpen}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-75 w-full pt-4">
              {!loading ? (
                barChartData.options.xaxis?.categories &&
                barChartData.options.xaxis.categories.length > 0 ? (
                  <Chart
                    options={barChartData.options as ApexCharts.ApexOptions}
                    series={barChartData.series}
                    type="bar"
                    width="100%"
                    height="100%"
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
          <Widget
            icon={<MdInsertChartOutlined className="text-brand-500 h-7 w-7" />}
            title="Tổng yêu cầu"
            subtitle={summary.total.toString()}
          />
          <Widget
            icon={
              <MdAppRegistration
                className={`h-7 w-7`}
                style={{ color: RegistrationActionColors.register.hex }}
              />
            }
            title={RegistrationActionLabels.register}
            subtitle={summary.register.toString()}
          />
          <Widget
            icon={
              <MdOutlineCancel
                className={`h-7 w-7`}
                style={{ color: RegistrationActionColors.cancel.hex }}
              />
            }
            title={RegistrationActionLabels.cancel}
            subtitle={summary.cancel.toString()}
          />
          <Widget
            icon={
              <MdOutlineOpenInBrowser
                className={`h-7 w-7`}
                style={{ color: RegistrationActionColors.requestOpen.hex }}
              />
            }
            title={RegistrationActionLabels.requestOpen}
            subtitle={summary.requestOpen.toString()}
          />
        </div>
      </div>
    </div>
  );
};

export default ClassRegistrationStatisticsPage;
