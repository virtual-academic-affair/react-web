import React from "react";

interface DetailFormLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  labelWidthClassName?: string;
  className?: string;
  required?: boolean;
  /** Căn label + control theo mép trên (vd. textarea nhiều dòng). */
  alignTop?: boolean;
  /** Khoảng cách label–field gọn (vd. Gmail deeplink). */
  dense?: boolean;
}

interface DetailFormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DetailFormLayout: React.FC<DetailFormLayoutProps> = ({
  children,
  className,
}) => {
  return <div className={`flex flex-col gap-4 ${className ?? ""}`}>{children}</div>;
};

export const FormRow: React.FC<FormRowProps> = ({
  label,
  children,
  labelWidthClassName = "w-40",
  className,
  required = false,
  alignTop = false,
  dense = false,
}) => {
  return (
    <div
      className={`flex ${dense ? "gap-3" : "gap-6"} ${alignTop ? "items-start" : "items-center"} ${className ?? ""}`}
    >
      <div
        className={`${labelWidthClassName} shrink-0 ${alignTop ? "pt-1.5" : ""}`}
      >
        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};

export const DetailFormSection: React.FC<DetailFormSectionProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <div className={`mt-4 border-t border-gray-100 pt-4 dark:border-white/10 ${className ?? ""}`}>
      <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
        {title}
      </p>
      {children}
    </div>
  );
};

export default DetailFormLayout;
