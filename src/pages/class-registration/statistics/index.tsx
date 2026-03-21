import React from "react";
import DetailedStatsChart from "./components/DetailedStatsChart";
import PeakDayCard from "./components/PeakDayCard";
import SummaryWidget from "./components/SummaryWidget";
import TotalOverviewChart from "./components/TotalOverviewChart";
import { useStatistics } from "./useStatistics";

const ClassRegistrationStatisticsPage: React.FC = () => {
  const {
    timeRange,
    setTimeRange,
    loading,
    summary,
    peakDay,
    dateRangeLabel,
    areaChartData,
    barChartData,
  } = useStatistics();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Left Side: Charts (3/4 width) */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          <TotalOverviewChart
            loading={loading}
            total={summary.total}
            chartOptions={areaChartData.options}
            chartData={areaChartData.series}
          />
          <DetailedStatsChart
            loading={loading}
            timeRange={timeRange}
            chartOptions={barChartData.options}
            chartData={barChartData.series}
          />
        </div>

        {/* Right Side: Widgets (1/4 width) */}
        <div className="flex flex-col gap-5 lg:col-span-1">
          <select
            className="dark:border-navy-600 dark:bg-navy-900 rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none dark:text-white"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            disabled={loading}
          >
            <option value="last_1_month">Tháng này</option>
            <option value="last_2_weeks">2 tuần qua</option>
            <option value="last_1_week">Tuần trước</option>
            <option value="this_week">Tuần này</option>
          </select>

          <SummaryWidget summary={summary} />

          <PeakDayCard peakDay={peakDay} dateRangeLabel={dateRangeLabel} />
        </div>
      </div>
    </div>
  );
};

export default ClassRegistrationStatisticsPage;
