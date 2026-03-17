import Card from "@/components/card";
import React from "react";

interface CreatePageLayoutProps {
  title: string;
  children: React.ReactNode;
  processSteps?: React.ReactNode;
}

const CreatePageLayout: React.FC<CreatePageLayoutProps> = ({
  title,
  children,
  processSteps,
}) => {
  return (
    <div className="relative flex min-h-[84vh] w-full flex-col items-center pt-[25vh] pb-10">
      {/* Background gradient */}
      <div
        className="absolute top-0 h-[45vh] w-full rounded-[20px]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--color-brand-400), var(--color-brand-600))",
        }}
      />

      {/* Process Steps - Outside card, above (optional) */}
      {processSteps && (
        <div className="absolute top-[calc(25vh-120px)] z-10 w-[850px] max-w-[calc(100vw-48px)]">
          {processSteps}
        </div>
      )}

      {/* Card */}
      <Card extra="relative z-10 w-[850px] max-w-[calc(100vw-48px)] p-8">
        {/* Fixed header */}
        <div>
          <h2 className="text-navy-700 mb-6 text-2xl font-bold dark:text-white">
            {title}
          </h2>
        </div>

        {/* Form content */}
        {children}
      </Card>
    </div>
  );
};

export default CreatePageLayout;
