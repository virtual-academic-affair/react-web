import type { ApexOptions } from "apexcharts";
import React from "react";
import Chart from "react-apexcharts";

type ChartProps = {
  chartData: any[]; // Data can be dynamic, any is often necessary here but we can use any[]
  chartOptions: ApexOptions;
};

const ColumnChart: React.FC<ChartProps> = ({ chartData, chartOptions }) => {
  return (
    <Chart
      options={chartOptions}
      series={chartData}
      type="bar"
      width="100%"
      height="100%"
    />
  );
};

export default ColumnChart;
