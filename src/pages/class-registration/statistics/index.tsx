import SelectField, {
  type SelectOption,
} from "@/components/fields/SelectField";
import { PageTitle } from "@/components/layouts/PageTitle";
import { LuChartColumn } from "react-icons/lu";
import React from "react";
import AcceptedOpenClassesCard from "./components/AcceptedOpenClassesCard";
import DetailedStatsChart from "./components/DetailedStatsChart";
import PeakDayCard from "./components/PeakDayCard";
import SummaryWidget from "./components/SummaryWidget";
import TotalOverviewChart from "./components/TotalOverviewChart";
import { useStatistics } from "./useStatistics";
import type { TimeRangeType } from "./utils/dateRange";

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

  const TIME_RANGE_OPTIONS: SelectOption<TimeRangeType>[] = [
    { value: "last_2_weeks", label: "2 tuần qua" },
    { value: "last_1_week", label: "Tuần vừa qua" },
    { value: "this_week", label: "Tuần này" },
    { value: "last_1_month", label: "Tháng này" },
  ];

  return (
    <div className="mb-5 flex flex-col gap-5">
      <PageTitle title="Thống kê đăng kí lớp" icon={LuChartColumn} />
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
          <AcceptedOpenClassesCard timeRange={timeRange} />
        </div>

        {/* Right Side: Widgets (1/4 width) */}
        <div className="mb-5 flex flex-col gap-5 lg:col-span-1">
          <SelectField
            value={timeRange}
            options={TIME_RANGE_OPTIONS}
            onChange={setTimeRange}
            disabled={loading}
            label="Chọn khoảng thời gian"
          />

          <SummaryWidget summary={summary} />

          <PeakDayCard peakDay={peakDay} dateRangeLabel={dateRangeLabel} />
        </div>
      </div>
    </div>
  );
};

export default ClassRegistrationStatisticsPage;
