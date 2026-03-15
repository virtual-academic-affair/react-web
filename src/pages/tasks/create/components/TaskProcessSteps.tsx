import React from "react";

interface TaskProcessStepsProps {
  currentStep: number;
}

const TaskProcessSteps: React.FC<TaskProcessStepsProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: "Thông tin" },
    { number: 2, label: "Mô tả công việc" },
    { number: 3, label: "Phân công" },
  ];

  return (
    <div className="mb-8 flex items-center justify-center gap-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {/* Step circle */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                currentStep >= step.number
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-300 bg-transparent text-gray-400 dark:border-gray-600 dark:text-gray-500"
              }`}
            >
              {currentStep > step.number ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span className={`text-xs font-medium text-white dark:text-white`}>
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-16 bg-gray-300 transition-all dark:bg-gray-600`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default TaskProcessSteps;
