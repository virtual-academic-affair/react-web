import Card from "@/components/card";
import type { JSX } from "react";

const Widget = (props: {
  icon: JSX.Element;
  title: string;
  subtitle: string;
}) => {
  const { icon, title, subtitle } = props;
  return (
    <Card extra="flex-row! grow items-center rounded-primary">
      <div className="ml-4.5 flex h-22.5 w-auto flex-row items-center">
        <div className="bg-lightPrimary dark:bg-navy-700 rounded-full p-3">
          <span className="text-brand-500 flex items-center dark:text-white">
            {icon}
          </span>
        </div>
      </div>

      <div className="ml-4 flex h-50 w-auto flex-col justify-center">
        <p className="font-dm text-sm font-medium text-gray-600">{title}</p>
        <h4 className="text-navy-700 text-xl font-bold dark:text-white">
          {subtitle}
        </h4>
      </div>
    </Card>
  );
};

export default Widget;
