import React from "react";
import type { ApexOptions } from "apexcharts";
import LineChart from "@/components/charts/LineChart";

interface InquiryLineChartProps {
  loading: boolean;
  total: number;
  timeRange: string;
  chartOptions: ApexOptions;
  chartData: { name: string; data: number[] }[];
}

const InquiryLineChart: React.FC<InquiryLineChartProps> = ({
  loading,
  total,
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
          <h2 className="text-navy-700 text-3xl font-bold dark:text-white">
            {total}
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
            Tổng số thắc mắc
          </p>
        </div>
      </div>

      <div className="h-125 w-full pt-4">
        {!loading ? (
          hasData ? (
            <LineChart
              key={`line-chart-${timeRange}`}
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

export default InquiryLineChart;
