import React from "react";
import type { ApexOptions } from "apexcharts";
import BarChart from "@/components/charts/BarChart";

interface DetailedStatsChartProps {
  loading: boolean;
  timeRange: string;
  chartOptions: ApexOptions;
  chartData: { name: string; data: number[] }[];
}

const DetailedStatsChart: React.FC<DetailedStatsChartProps> = ({
  loading,
  timeRange,
  chartOptions,
  chartData,
}) => {
  const hasData =
    chartOptions.xaxis?.categories &&
    (chartOptions.xaxis.categories as string[]).length > 0;

  return (
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
          hasData ? (
            <BarChart
              key={`bar-chart-${timeRange}`}
              chartOptions={chartOptions}
              chartData={chartData}
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
  );
};

export default DetailedStatsChart;
