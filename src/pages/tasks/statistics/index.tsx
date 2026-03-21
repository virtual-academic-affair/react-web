import React from "react";
import { useTaskStatistics } from "./useTaskStatistics";
import TaskLineChart from "./components/TaskLineChart";
import TaskSummaryWidget from "./components/TaskSummaryWidget";
import TaskPeakDayCard from "./components/TaskPeakDayCard";

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
          <select
            className="dark:border-navy-600 dark:bg-navy-900 rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none dark:text-white"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            disabled={loading}
          >
            <option value="this_week">Tuần này</option>
            <option value="next_month">Tháng sau</option>
            <option value="last_1_month">Tháng này</option>
            <option value="last_1_week">Tuần vừa qua</option>
            <option value="last_2_weeks">2 tuần qua</option>
          </select>

          <TaskSummaryWidget summary={summary} />

          <TaskPeakDayCard peakDay={peakDay} dateRangeLabel={dateRangeLabel} />
        </div>
      </div>
    </div>
  );
};

export default TaskStatisticsPage;
