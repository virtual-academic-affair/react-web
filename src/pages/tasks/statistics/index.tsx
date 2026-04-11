import SelectField, {
  type SelectOption,
} from "@/components/fields/SelectField";
import React from "react";
import TaskLineChart from "./components/TaskLineChart";
import TaskPeakDayCard from "./components/TaskPeakDayCard";
import TaskSummaryWidget from "./components/TaskSummaryWidget";
import { useTaskStatistics } from "./useTaskStatistics";
import { type TimeRangeType } from "./utils/dateRange";

const TIME_RANGE_OPTIONS: SelectOption<TimeRangeType>[] = [
  { value: "last_2_weeks", label: "2 tuần qua" },
  { value: "last_1_week", label: "Tuần vừa qua" },
  { value: "this_week", label: "Tuần này" },
  { value: "last_1_month", label: "Tháng này" },
  { value: "next_month", label: "Tháng sau" },
];

const TaskStatisticsPage: React.FC = () => {
  const {
    timeRange,
    setTimeRange,
    loading,
    summary,
    peakDay,
    dateRangeLabel,
    chartData,
  } = useTaskStatistics();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Left Side: Chart (3/4 width) */}
        <div className="flex flex-col gap-5 lg:col-span-3">
          <TaskLineChart
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

          <TaskSummaryWidget summary={summary} />

          <TaskPeakDayCard peakDay={peakDay} dateRangeLabel={dateRangeLabel} />
        </div>
      </div>
    </div>
  );
};

export default TaskStatisticsPage;
