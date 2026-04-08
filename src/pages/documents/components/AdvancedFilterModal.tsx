import { Role, RoleColors } from "@/types/users";
import React from "react";
import { MdExpandMore } from "react-icons/md";

import AdvancedFilterModalBase from "@/components/filter/AdvancedFilterModal";
import Tag from "@/components/tag/Tag";
import MetadataSelector from "./MetadataSelector";

export interface DocumentFilters {
  accessScope?: string[];
  academicYear?: string[];
  cohort?: string[];
  [key: string]: string[] | undefined;
}

interface AccessScopeFilterProps {
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

const ACCESS_SCOPE_OPTIONS = [
  { value: "student", label: "Sinh viên", color: RoleColors[Role.Student].hex },
  {
    value: "lecture",
    label: "Giảng viên",
    color: RoleColors[Role.Lecture].hex,
  },
] as const;

const AccessScopeFilter: React.FC<AccessScopeFilterProps> = ({
  selectedValues,
  onChange,
}) => {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        event.target instanceof Node &&
        !pickerRef.current.contains(event.target)
      ) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div ref={pickerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1">
        {selectedValues.length > 0 ? (
          selectedValues.map((v) => {
            const opt = ACCESS_SCOPE_OPTIONS.find((o) => o.value === v);
            return (
              <Tag key={v} color={opt?.color || "#9ca3af"}>
                {opt?.label || v}
              </Tag>
            );
          })
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
        <button
          type="button"
          title="Chọn phạm vi truy cập"
          onClick={() => setPickerOpen((prev) => !prev)}
          className="dark:bg-navy-800 ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
        >
          <MdExpandMore className="h-3.5 w-3.5" />
        </button>
      </div>

      {pickerOpen && (
        <div className="dark:bg-navy-900 absolute top-full left-0 z-20 mt-1 w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10">
          <p className="mb-2 pl-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
            Phạm vi truy cập
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCESS_SCOPE_OPTIONS.map((opt) => {
              const isActive = selectedValues.includes(opt.value);
              return (
                <Tag
                  key={opt.value}
                  color={isActive ? opt.color : "#9ca3af"}
                  onClick={() => toggle(opt.value)}
                  className={
                    isActive
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                  }
                >
                  {opt.label}
                </Tag>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterRow: React.FC<{
  label: string;
  selectedValues: string[];
  options: Array<{ value: string; displayName: string; color?: string }>;
  onChange: (next: string[]) => void;
}> = ({ label, selectedValues, options, onChange }) => {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        event.target instanceof Node &&
        !pickerRef.current.contains(event.target)
      ) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={pickerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1">
        {selectedValues.length ? (
          selectedValues.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <Tag key={v} color={opt?.color || "#6366f1"}>
                {opt?.displayName || v}
              </Tag>
            );
          })
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
        <button
          type="button"
          title={`Chọn ${label}`}
          onClick={() => setPickerOpen((prev) => !prev)}
          className="dark:bg-navy-800 ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white"
        >
          <MdExpandMore className="h-3.5 w-3.5" />
        </button>
      </div>

      {pickerOpen && (
        <div className="dark:bg-navy-900 absolute top-full left-0 z-20 mt-1 w-[280px] max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10">
          <p className="mb-2 pl-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
            {label}
          </p>
          <MetadataSelector
            value={selectedValues}
            onChange={(next) => {
              onChange(next);
              if (next.length === 0) setPickerOpen(false);
            }}
            options={options}
            className="custom-scrollbar flex max-h-44 flex-wrap gap-2 overflow-y-auto p-1"
          />
        </div>
      )}
    </div>
  );
};

const AdvancedFilterModal: React.FC<{
  open: boolean;
  value: DocumentFilters;
  metadataTypes: Array<{
    key: string;
    displayName: string;
    isActive?: boolean;
    allowedValues?: Array<{
      value: string;
      displayName: string;
      isActive?: boolean;
      color?: string;
    }>;
  }>;
  onChange: (next: DocumentFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onRequestClose: () => void;
}> = ({
  open,
  value,
  metadataTypes,
  onChange,
  onApply,
  onClear,
  onRequestClose,
}) => {
  // Filter metadata types: only active types with at least 1 active value
  const filterableTypes = React.useMemo(() => {
    return metadataTypes.filter((type) => {
      if (!type.isActive) return false;
      const activeValues = type.allowedValues?.filter((v) => v.isActive) || [];
      return activeValues.length > 0;
    });
  }, [metadataTypes]);

  // Access scope options
  const accessScopeOptions = React.useMemo(() => {
    const scopeType = filterableTypes.find((t) => t.key === "access_scope");
    return (scopeType?.allowedValues || [])
      .filter((opt) => opt.isActive)
      .map((opt) => ({
        value: opt.value,
        displayName: opt.displayName || opt.value,
      }));
  }, [filterableTypes]);

  const showAccessScope = accessScopeOptions.length > 0;

  // Academic year
  const academicYearType = filterableTypes.find(
    (t) => t.key === "academic_year",
  );
  const academicYearOptions = (academicYearType?.allowedValues || [])
    .filter((opt) => opt.isActive)
    .map((opt) => ({
      value: opt.value,
      displayName: opt.displayName || opt.value,
      color: opt.color,
    }));
  const showAcademicYear = academicYearOptions.length > 0;

  // Cohort
  const cohortType = filterableTypes.find((t) => t.key === "cohort");
  const cohortOptions = (cohortType?.allowedValues || [])
    .filter((opt) => opt.isActive)
    .map((opt) => ({
      value: opt.value,
      displayName: opt.displayName || opt.value,
      color: opt.color,
    }));
  const showCohort = cohortOptions.length > 0;

  // Other filters (exclude system types)
  const otherFilters = filterableTypes.filter(
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
      {showAccessScope && (
        <>
          <div className="col-span-1">
            <p className="text-navy-700 font-medium dark:text-white">
              Phạm vi truy cập
            </p>
          </div>
          <div className="col-span-3">
            <AccessScopeFilter
              selectedValues={value.accessScope || []}
              onChange={(next) => onChange({ ...value, accessScope: next })}
            />
          </div>
        </>
      )}

      {/* Academic Year */}
      {showAcademicYear && (
        <>
          <div className="col-span-1">
            <p className="text-navy-700 font-medium dark:text-white">Năm học</p>
          </div>
          <div className="col-span-3">
            <FilterRow
              selectedValues={value.academicYear || []}
              options={academicYearOptions}
              onChange={(next) => onChange({ ...value, academicYear: next })}
              label="Năm học"
            />
          </div>
        </>
      )}

      {/* Cohort */}
      {showCohort && (
        <>
          <div className="col-span-1">
            <p className="text-navy-700 font-medium dark:text-white">Khóa</p>
          </div>
          <div className="col-span-3">
            <FilterRow
              selectedValues={value.cohort || []}
              options={cohortOptions}
              onChange={(next) => onChange({ ...value, cohort: next })}
              label="Khóa"
            />
          </div>
        </>
      )}

      {/* Other metadata filters */}
      {otherFilters.map((type) => {
        const opts = (type.allowedValues || [])
          .filter((opt) => opt.isActive)
          .map((opt) => ({
            value: opt.value,
            displayName: opt.displayName || opt.value,
            color: opt.color,
          }));
        if (opts.length === 0) return null;

        return (
          <React.Fragment key={type.key}>
            <div className="col-span-1">
              <p className="text-navy-700 font-medium dark:text-white">
                {type.displayName || type.key}
              </p>
            </div>
            <div className="col-span-3">
              <FilterRow
                selectedValues={value[type.key] || []}
                options={opts}
                onChange={(next) => onChange({ ...value, [type.key]: next })}
                label={type.displayName || type.key}
              />
            </div>
          </React.Fragment>
        );
      })}
    </AdvancedFilterModalBase>
  );
};

export default AdvancedFilterModal;
