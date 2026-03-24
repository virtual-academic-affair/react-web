import Card from "@/components/card";
import React from "react";

interface CreatePageLayoutProps {
  title: string;
  children: React.ReactNode;
  processSteps?: React.ReactNode;
  sideContent?: React.ReactNode;
}

const CreatePageLayout: React.FC<CreatePageLayoutProps> = ({
  title,
  children,
  processSteps,
  sideContent,
}) => {
  const cardWidth = sideContent ? "w-[1250px]" : "w-[850px]";

  return (
    <div className="relative flex min-h-[84vh] w-full flex-col items-center pt-[25vh] pb-10">
      {/* Background gradient */}
      <div
        className="absolute top-0 h-[45vh] w-full rounded-[40px]"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--color-brand-400), var(--color-brand-600))",
        }}
      />

      {/* Process Steps - Outside card, above (optional) */}
      {processSteps && (
        <div
          className={`absolute top-[calc(25vh-120px)] z-10 ${cardWidth} max-w-[calc(100vw-48px)] transition-all duration-300`}
        >
          {processSteps}
        </div>
      )}

      {/* Card */}
      <Card
        extra={`relative z-10 ${cardWidth} max-w-[calc(100vw-48px)] p-8 transition-all duration-300`}
      >
        <div className={sideContent ? "flex h-full flex-col" : ""}>
          <div className="mb-6">
            <h2 className="text-navy-700 text-2xl font-bold dark:text-white">
              {title}
            </h2>
          </div>

          {sideContent ? (
            <div className="grid h-[55vh] grid-cols-12 gap-0 border-t border-gray-100 dark:border-white/5">
              {/* Left Scroll Panel */}
              <div className="custom-scrollbar col-span-7 h-full overflow-y-auto border-r border-gray-100 pt-6 pr-8 dark:border-white/5">
                {children}
              </div>

              {/* Right Scroll Panel */}
              <div className="custom-scrollbar col-span-5 h-full overflow-y-auto pt-6 pl-8">
                {sideContent}
              </div>
            </div>
          ) : (
            <div>{children}</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CreatePageLayout;
