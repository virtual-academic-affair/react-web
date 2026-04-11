import SelectField, {
  type SelectOption,
} from "@/components/fields/SelectField";
import React from "react";
import InquiryLineChart from "./components/InquiryLineChart";
import InquiryPeakDayCard from "./components/InquiryPeakDayCard";
import InquirySummaryWidget from "./components/InquirySummaryWidget";
import { useInquiryStatistics } from "./useInquiryStatistics";
import type { TimeRangeType } from "./utils/dateRange";

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

  const TIME_RANGE_OPTIONS: SelectOption<TimeRangeType>[] = [
    { value: "last_2_weeks", label: "2 tuần qua" },
    { value: "last_1_week", label: "Tuần vừa qua" },
    { value: "this_week", label: "Tuần này" },
    { value: "last_1_month", label: "Tháng này" },
  ];

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
          <SelectField
            value={timeRange}
            options={TIME_RANGE_OPTIONS}
            onChange={setTimeRange}
            disabled={loading}
            label="Chọn khoảng thời gian"
          />

          <InquirySummaryWidget summary={summary} />

          <InquiryPeakDayCard
            peakDay={peakDay}
            dateRangeLabel={dateRangeLabel}
          />
        </div>
      </div>
    </div>
  );
};

export default InquiryStatisticsPage;
