import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

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
