import type { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts/core";

import "apexcharts/line";
import "apexcharts/features/legend";
import "apexcharts/features/toolbar";

type ChartProps = {
  chartData: any[];
  chartOptions: ApexOptions;
};

const LineChart: React.FC<ChartProps> = ({ chartData, chartOptions }) => {
  return (
    <ReactApexChart
      options={chartOptions}
      series={chartData}
      type="line"
      width="100%"
      height="100%"
    />
  );
};

export default LineChart;
