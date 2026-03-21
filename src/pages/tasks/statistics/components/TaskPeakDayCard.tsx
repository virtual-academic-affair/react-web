import React from "react";
import { MdInsights } from "react-icons/md";

interface PeakDay {
  formattedDate: string;
  total: number;
}

interface TaskPeakDayCardProps {
  peakDay: PeakDay | null;
  dateRangeLabel: string;
}

const TaskPeakDayCard: React.FC<TaskPeakDayCardProps> = ({
  peakDay,
  dateRangeLabel,
}) => {
  if (!peakDay) return null;

  return (
    <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
      <h4 className="text-navy-700 mb-3 text-lg font-bold dark:text-white">
        {peakDay.formattedDate}
      </h4>
      <div className="bg-peak-day-gradient flex flex-col rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <MdInsights className="text-brand-500 h-10 w-10" />
          <div className="text-right">
            <p className="text-navy-700 text-sm font-bold dark:text-white">
              Cao nhất
            </p>
            <p className="text-xs font-medium text-gray-500">
              {dateRangeLabel}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col">
          <h2 className="text-navy-700 text-4xl font-bold dark:text-white">
            {peakDay.total}
          </h2>
          <p className="text-navy-700 mt-1 text-lg font-medium dark:text-white">
            số lượng công việc
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskPeakDayCard;
