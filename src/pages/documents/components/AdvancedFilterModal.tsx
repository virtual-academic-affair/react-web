import React from "react";
import { RoleColors } from "@/types/users";

import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";

export interface DocumentFilters {
  accessScope?: string;
  academicYear?: string;
  cohort?: string;
}

interface AdvancedFilterModalProps {
  open: boolean;
  value: DocumentFilters;
  metadataTypes: Array<{
    key: string;
    displayName: string;
    allowedValues?: Array<{
      value: string;
      displayName: string;
      color?: string;
    }>;
  }>;
  onChange: (next: DocumentFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onRequestClose: () => void;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  open,
  value,
  metadataTypes,
  onChange,
  onApply,
  onClear,
  onRequestClose,
}) => {
  // Access scope options
  const accessScopeType = metadataTypes.find((t) => t.key === "access_scope");
  const accessScopeOptions = accessScopeType?.allowedValues || [];

  // Academic year options (from metadata if exists)
  const academicYearType = metadataTypes.find((t) => t.key === "academic_year");
  const academicYearOptions = academicYearType?.allowedValues || [];

  // Cohort options
  const cohortType = metadataTypes.find((t) => t.key === "cohort");
  const cohortOptions = cohortType?.allowedValues || [];

  // Other filterable metadata types
  const otherFilters = metadataTypes.filter(
    (t) => !["access_scope", "academic_year", "cohort"].includes(t.key),
  );

  return (
    <AdvancedFilterModalBase
      open={open}
      onClear={onClear}
      onApply={onApply}
      onRequestClose={onRequestClose}
    >
      {/* Access Scope */}
      {accessScopeOptions.length > 0 && (
        <div className="col-span-1">
          <p className="text-navy-700 mb-2 text-sm font-medium dark:text-white">
            Phạm vi truy cập
          </p>
          <div className="flex flex-wrap gap-2">
            {accessScopeOptions.map((opt) => {
              const isSelected = value.accessScope === opt.value;
              const colors = opt.value === "student" ? RoleColors.student : RoleColors.lecture;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      const next = { ...value };
                      delete next.accessScope;
                      onChange(next);
                    } else {
                      onChange({ ...value, accessScope: opt.value });
                    }
                  }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? `${colors.bg} ${colors.text} border-transparent`
                      : "border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-navy-800 dark:text-gray-400"
                  }`}
                >
                  {opt.displayName || opt.value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Academic Year */}
      {academicYearOptions.length > 0 && (
        <div className="col-span-1">
          <p className="text-navy-700 mb-2 text-sm font-medium dark:text-white">
            Năm học
          </p>
          <div className="flex flex-wrap gap-2">
            {academicYearOptions.map((opt) => {
              const isSelected = value.academicYear === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      const next = { ...value };
                      delete next.academicYear;
                      onChange(next);
                    } else {
                      onChange({ ...value, academicYear: opt.value });
                    }
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-transparent bg-brand-500 text-white"
                      : "border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-navy-800 dark:text-gray-400"
                  }`}
                >
                  {opt.displayName || opt.value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cohort */}
      {cohortOptions.length > 0 && (
        <div className="col-span-1">
          <p className="text-navy-700 mb-2 text-sm font-medium dark:text-white">
            Khóa
          </p>
          <div className="flex flex-wrap gap-2">
            {cohortOptions.map((opt) => {
              const isSelected = value.cohort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      const next = { ...value };
                      delete next.cohort;
                      onChange(next);
                    } else {
                      onChange({ ...value, cohort: opt.value });
                    }
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-transparent bg-brand-500 text-white"
                      : "border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-navy-800 dark:text-gray-400"
                  }`}
                >
                  {opt.displayName || opt.value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Other metadata filters */}
      {otherFilters.map((type) => (
        <div key={type.key} className="col-span-1">
          <p className="text-navy-700 mb-2 text-sm font-medium dark:text-white">
            {type.displayName || type.key}
          </p>
          <div className="flex flex-wrap gap-2">
            {type.allowedValues?.map((opt) => {
              const currentFilter = value[type.key as keyof DocumentFilters];
              const isSelected = currentFilter === opt.value;
              const color = opt.color || "#6366f1";
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      const next = { ...value };
                      delete next[type.key as keyof DocumentFilters];
                      onChange(next);
                    } else {
                      onChange({ ...value, [type.key]: opt.value });
                    }
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-transparent text-white"
                      : "border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-navy-800 dark:text-gray-400"
                  }`}
                  style={isSelected ? { backgroundColor: color } : {}}
                >
                  {opt.displayName || opt.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* If no metadata types available, show placeholder */}
      {metadataTypes.length === 0 && (
        <div className="col-span-4">
          <p className="text-sm text-gray-500">Chưa có nhãn nào được cấu hình.</p>
        </div>
      )}
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;
