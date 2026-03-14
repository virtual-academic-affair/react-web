import React from "react";

interface TagProps {
  /** Hex color string, e.g. "#ff0000" */
  color: string;
  children: React.ReactNode;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ color, children, className }) => {
  // Apply opacity to background while keeping text full color
  const bgWithOpacity = `${color}20`;

  return (
    <span
      style={{ backgroundColor: bgWithOpacity, color }}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className ?? ""}`}
    >
      {children}
    </span>
  );
};

export default Tag;

