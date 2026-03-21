import React from "react";
import { MdQuestionAnswer } from "react-icons/md";
import type { InquiryType } from "@/types/inquiry";
import { InquiryTypeLabels, InquiryTypeColors } from "@/types/inquiry";
import balanceImg from "@/assets/img/dashboards/balanceImg.png";
import fakeGraph from "@/assets/img/dashboards/fakeGraph.png";

const INQUIRY_TYPES = ["graduation", "training", "procedure"] as const;

interface InquirySummaryWidgetProps {
  summary: {
    total: number;
    totalTypes: number;
  } & Record<InquiryType, number>;
}

const InquirySummaryWidget: React.FC<InquirySummaryWidgetProps> = ({
  summary,
}) => {
  const pct = (val: number) =>
    summary.totalTypes > 0
      ? ((val / summary.totalTypes) * 100).toFixed(1)
      : 0;

  return (
    <div className="shadow-3xl shadow-shadow-500 dark:bg-navy-800 flex flex-col rounded-3xl bg-white p-5 dark:shadow-none">
      {/* Purple total card */}
      <div
        className="relative mb-6 flex flex-col justify-between rounded-3xl bg-[#11047A] bg-cover bg-no-repeat p-6 dark:bg-[#1b264b]"
        style={{ backgroundImage: `url(${balanceImg})` }}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium text-white">Tổng thắc mắc</h4>
        </div>
        <div className="mt-4 flex flex-row items-center justify-between">
          <h2 className="text-4xl font-bold text-white">{summary.total}</h2>
          <img src={fakeGraph} alt="graph" className="h-5 w-auto opacity-80" />
        </div>
      </div>

      {/* Breakdown by type */}
      <div className="flex flex-col gap-4">
        <h4 className="text-navy-700 text-lg font-bold dark:text-white">
          Chi tiết theo loại
        </h4>
        {INQUIRY_TYPES.map((type) => (
          <div key={type} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                  backgroundColor: InquiryTypeColors[type].hex + "20",
                }}
              >
                <MdQuestionAnswer
                  className="h-6 w-6"
                  style={{ color: InquiryTypeColors[type].hex }}
                />
              </div>
              <div>
                <h5 className="text-navy-700 text-sm font-bold dark:text-white">
                  {InquiryTypeLabels[type]}
                </h5>
                <p className="text-xs font-medium text-gray-500">
                  {pct(summary[type])}%
                </p>
              </div>
            </div>
            <p className="text-navy-700 text-sm font-bold dark:text-white">
              {summary[type]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InquirySummaryWidget;
