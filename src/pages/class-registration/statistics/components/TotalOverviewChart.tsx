import React from "react";
import type { ApexOptions } from "apexcharts";
import LineChart from "@/components/charts/LineChart";

interface TotalOverviewChartProps {
  loading: boolean;
  total: number;
  chartOptions: ApexOptions;
  chartData: { name: string; data: number[] }[];
}

const TotalOverviewChart: React.FC<TotalOverviewChartProps> = ({
  loading,
  total,
  chartOptions,
  chartData,
}) => {
  const hasData =
    chartOptions.xaxis?.categories &&
    (chartOptions.xaxis.categories as string[]).length > 0;

  return (
    <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 relative flex w-full flex-col rounded-4xl bg-white p-6 dark:shadow-none">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <h2 className="text-navy-700 text-3xl font-bold dark:text-white">
            {total}
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
          hasData ? (
            <LineChart chartOptions={chartOptions} chartData={chartData} />
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

export default TotalOverviewChart;
