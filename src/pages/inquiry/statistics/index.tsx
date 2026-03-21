import React from "react";
import { useInquiryStatistics } from "./useInquiryStatistics";
import InquiryLineChart from "./components/InquiryLineChart";
import InquirySummaryWidget from "./components/InquirySummaryWidget";
import InquiryPeakDayCard from "./components/InquiryPeakDayCard";

const InquiryStatisticsPage: React.FC = () => {
  const {
    timeRange,
    setTimeRange,
    loading,
    summary,
    peakDay,
    dateRangeLabel,
    chartData,
  } = useInquiryStatistics();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Left Side: Chart (3/4 width) */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          <InquiryLineChart
            loading={loading}
            total={summary.total}
            timeRange={timeRange}
            chartOptions={chartData.options}
            chartData={chartData.series}
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
            <option value="this_week">Tuần này</option>
            <option value="last_1_week">Tuần vừa qua</option>
            <option value="last_2_weeks">2 tuần qua</option>
            <option value="last_1_month">Tháng này</option>
          </select>

          <InquirySummaryWidget summary={summary} />

          <InquiryPeakDayCard peakDay={peakDay} dateRangeLabel={dateRangeLabel} />
        </div>
      </div>
    </div>
  );
};

export default InquiryStatisticsPage;
