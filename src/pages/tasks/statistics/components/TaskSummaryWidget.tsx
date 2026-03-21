import balanceImg from "@/assets/img/dashboards/balanceImg.png";
import fakeGraph from "@/assets/img/dashboards/fakeGraph.png";
import React from "react";
import {
  MdAssignmentTurnedIn,
  MdOutlineAssignment,
  MdPendingActions,
} from "react-icons/md";

interface TaskSummaryWidgetProps {
  summary: {
    total: number;
    done: number;
    doing: number;
    todo: number;
  };
}

const TaskSummaryWidget: React.FC<TaskSummaryWidgetProps> = ({ summary }) => {
  const pct = (val: number) =>
    summary.total > 0 ? ((val / summary.total) * 100).toFixed(1) : 0;

  return (
    <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
      {/* Purple total card */}
      <div
        className="relative mb-6 flex flex-col justify-between rounded-3xl bg-[#11047A] bg-cover bg-no-repeat p-6 dark:bg-[#1b264b]"
        style={{ backgroundImage: `url(${balanceImg})` }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-white">Tổng công việc</h4>
        </div>
        <div className="mt-4 flex flex-row items-center justify-between">
          <h2 className="text-4xl font-bold text-white">{summary.total}</h2>
          <img src={fakeGraph} alt="graph" className="h-5 w-auto opacity-80" />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="flex flex-col gap-4">
        <h4 className="text-navy-700 text-lg font-bold dark:text-white">
          Trạng thái
        </h4>

        {/* Done */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <MdAssignmentTurnedIn className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h5 className="text-navy-700 text-sm font-bold dark:text-white">
                Đã hoàn thành
              </h5>
              <p className="text-xs font-medium text-gray-500">
                {pct(summary.done)}%
              </p>
            </div>
          </div>
          <p className="text-navy-700 text-sm font-bold dark:text-white">
            {summary.done}
          </p>
        </div>

        {/* Doing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <MdPendingActions className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h5 className="text-navy-700 text-sm font-bold dark:text-white">
                Đang thực hiện
              </h5>
              <p className="text-xs font-medium text-gray-500">
                {pct(summary.doing)}%
              </p>
            </div>
          </div>
          <p className="text-navy-700 text-sm font-bold dark:text-white">
            {summary.doing}
          </p>
        </div>

        {/* Todo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MdOutlineAssignment className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <h5 className="text-navy-700 text-sm font-bold dark:text-white">
                Cần làm
              </h5>
              <p className="text-xs font-medium text-gray-500">
                {pct(summary.todo)}%
              </p>
            </div>
          </div>
          <p className="text-navy-700 text-sm font-bold dark:text-white">
            {summary.todo}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskSummaryWidget;
