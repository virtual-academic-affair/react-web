import React from "react";

interface TagProps {
  /** Hex color string, e.g. "#ff0000" */
  color?: string;
  children: React.ReactNode;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ color, children, className }) => {
  // Apply opacity to background while keeping text full color
  if (!color) {
    color = "#4225ff";
  }
  const bgWithOpacity = `${color}20`;

  return (
    <span
      style={{ backgroundColor: bgWithOpacity, color, borderColor: color }}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${className ?? ""}`}
    >
      {children}
    </span>
  );
};

export default Tag;
