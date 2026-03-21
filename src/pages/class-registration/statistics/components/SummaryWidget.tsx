import React from "react";
import {
  MdAppRegistration,
  MdOutlineCancel,
  MdOutlineOpenInBrowser,
} from "react-icons/md";
import {
  RegistrationActionLabels,
  RegistrationActionColors,
} from "@/types/classRegistration";
import balanceImg from "@/assets/img/dashboards/balanceImg.png";
import fakeGraph from "@/assets/img/dashboards/fakeGraph.png";

interface SummaryWidgetProps {
  summary: {
    total: number;
    register: number;
    cancel: number;
    requestOpen: number;
  };
}

const SummaryWidget: React.FC<SummaryWidgetProps> = ({ summary }) => {
  const pct = (val: number) =>
    summary.total > 0 ? ((val / summary.total) * 100).toFixed(1) : 0;

  return (
    <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
      {/* Top part: Purple rounded container */}
      <div
        className="relative mb-6 flex flex-col justify-between rounded-3xl bg-[#11047A] bg-cover bg-no-repeat p-6 dark:bg-[#1b264b]"
        style={{ backgroundImage: `url(${balanceImg})` }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-white">Tổng yêu cầu</h4>
        </div>
        <div className="mt-4 flex flex-row items-center justify-between">
          <h2 className="text-4xl font-bold text-white">{summary.total}</h2>
          <img
            src={fakeGraph}
            alt="graph"
            className="h-[20px] w-auto opacity-80"
          />
        </div>
      </div>

      {/* Bottom part: Action breakdown */}
      <div className="flex flex-col">
        <h4 className="text-navy-700 mb-4 text-lg font-bold dark:text-white">
          Chi tiết
        </h4>

        {/* Register */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FE]">
              <MdAppRegistration
                className="h-6 w-6"
                style={{ color: RegistrationActionColors.register.hex }}
              />
            </div>
            <div>
              <h5 className="text-navy-700 text-base font-bold dark:text-white">
                {RegistrationActionLabels.register}
              </h5>
              <p className="text-sm font-medium text-gray-500">
                {pct(summary.register)}%
              </p>
            </div>
          </div>
          <p className="text-navy-700 text-base font-bold dark:text-white">
            {summary.register}
          </p>
        </div>

        {/* Cancel */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FE]">
              <MdOutlineCancel
                className="h-6 w-6"
                style={{ color: RegistrationActionColors.cancel.hex }}
              />
            </div>
            <div>
              <h5 className="text-navy-700 text-base font-bold dark:text-white">
                {RegistrationActionLabels.cancel}
              </h5>
              <p className="text-sm font-medium text-gray-500">
                {pct(summary.cancel)}%
              </p>
            </div>
          </div>
          <p className="text-navy-700 text-base font-bold dark:text-white">
            {summary.cancel}
          </p>
        </div>

        {/* Request Open */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="dark:bg-navy-700 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7FE]">
              <MdOutlineOpenInBrowser
                className="h-6 w-6"
                style={{ color: RegistrationActionColors.requestOpen.hex }}
              />
            </div>
            <div>
              <h5 className="text-navy-700 text-base font-bold dark:text-white">
                {RegistrationActionLabels.requestOpen}
              </h5>
              <p className="text-sm font-medium text-gray-500">
                {pct(summary.requestOpen)}%
              </p>
            </div>
          </div>
          <p className="text-navy-700 text-base font-bold dark:text-white">
            {summary.requestOpen}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryWidget;
