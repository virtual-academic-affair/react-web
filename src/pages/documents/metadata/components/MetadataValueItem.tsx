import Switch from "@/components/switch";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip";
import { RoleColors, RoleLabels } from "@/types/users";
import React from "react";
import { MdDeleteOutline, MdSave, MdUndo } from "react-icons/md";

interface ValueForm {
  value: string;
  displayName: string;
  isActive: boolean;
  color: string;
  visibleRoles: string[];
  totalFiles: number;
}

interface MetadataValueItemProps {
  meta: string;
  valueKey: string;
  form: ValueForm;
  original: ValueForm | undefined;
  saving: boolean;
  /** Không cho sửa hiển thị + không tính vào thay đổi (nhãn/giá trị hệ thống). */
  isActiveLocked?: boolean;
  isActiveLockedReason?: string;
  onFormChange: (updates: Partial<ValueForm>) => void;
  onSave: () => void;
  onDelete: () => void;
}

const ALL_ROLES = ["student", "lecture"] as const;

const MetadataValueItem: React.FC<MetadataValueItemProps> = ({
  meta,
  valueKey,
  form,
  original,
  saving,
  isActiveLocked = false,
  isActiveLockedReason = "Không thể thay đổi trạng thái hiển thị.",
  onFormChange,
  onSave,
  onDelete,
}) => {
  let hasFiles = (form.totalFiles ?? 0) > 0;

  if (valueKey === "all" && (meta === "academic_year" || meta === "cohort")) {
    hasFiles = true;
  }
  const isActiveChanged =
    !isActiveLocked &&
    form.isActive !== (original?.isActive ?? true);

  const hasChanges =
    form.displayName !== (original?.displayName ?? "") ||
    isActiveChanged ||
    form.color !== (original?.color ?? "") ||
    JSON.stringify(form.visibleRoles) !==
      JSON.stringify(original?.visibleRoles ?? []);

  return (
    <div className="dark:bg-navy-700/40 rounded-2xl bg-gray-50 p-4 dark:border-white/10">
      {/* Header with value key, SL file, and delete button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-navy-700 text-base font-medium dark:text-white">
            #{valueKey}
          </p>
        </div>
        <Tooltip
          label={
            hasFiles
              ? "Giá trị mặc định hoặc có tệp được gán"
              : "Xóa giá trị này"
          }
        >
          <button
            type="button"
            disabled={saving || hasFiles}
            onClick={onDelete}
            className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MdDeleteOutline className="h-4 w-4" />
            Xóa
          </button>
        </Tooltip>
      </div>

      {/* Fields - grid 2 columns */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Tên hiển thị - full width */}
        <div className="col-span-2 flex items-center gap-6">
          <div className="w-32 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Tên hiển thị
            </p>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => onFormChange({ displayName: e.target.value })}
              disabled={saving}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              placeholder="Tên hiển thị"
            />
          </div>
        </div>

        {/* Quyền xem - full width */}
        <div className="flex items-start gap-6">
          <div className="w-32 shrink-0 pt-1">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Quyền xem
            </p>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {ALL_ROLES.map((role) => {
                const checked = form.visibleRoles.includes(role);
                const colors = RoleColors[role];
                return (
                  <Tag
                    key={role}
                    color={checked ? colors.hex : "gray"}
                    onClick={() => {
                      if (saving) return;
                      const next = checked
                        ? form.visibleRoles.filter((r) => r !== role)
                        : [...form.visibleRoles, role];
                      onFormChange({ visibleRoles: next });
                    }}
                    className={`cursor-pointer ${checked ? "" : "opacity-50"} ${saving ? "cursor-not-allowed" : ""}`}
                  >
                    {RoleLabels[role]}
                  </Tag>
                );
              })}
            </div>
          </div>
        </div>

        {/* SL tài liệu - full width */}
        <div className="flex items-start gap-6">
          <div className="w-32 shrink-0 pt-1">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              SL tài liệu
            </p>
          </div>
          <div className="flex-1">
            <p className="text-navy-700 text-base dark:text-white">
              {form.totalFiles}
            </p>
          </div>
        </div>

        {/* Trạng thái hiển thị */}
        <div className="flex items-center gap-6">
          <div className="w-32 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Hiển thị
            </p>
          </div>
          <div className="flex-1">
            {isActiveLocked ? (
              <Tooltip label={isActiveLockedReason}>
                <span className="inline-flex">
                  <Switch
                    checked={form.isActive}
                    onChange={() => {}}
                    disabled
                  />
                </span>
              </Tooltip>
            ) : (
              <Switch
                checked={form.isActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onFormChange({ isActive: e.target.checked })
                }
                disabled={saving}
              />
            )}
          </div>
        </div>

        {/* Màu sắc */}
        <div className="flex items-center gap-6">
          <div className="w-32 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Màu sắc
            </p>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                const input = document.getElementById(
                  `color-input-${valueKey}`,
                ) as HTMLInputElement;
                if (input) input.click();
              }}
              className="focus:ring-brand-500 dark:focus:ring-offset-navy-900 focus:ring-1.5 h-10 w-10 shrink-0 cursor-pointer rounded-full border-2 border-gray-200 bg-transparent transition-all focus:ring-offset-2 focus:outline-none dark:border-white/10"
              style={{ backgroundColor: form.color || "#432afc" }}
            />
            <input
              id={`color-input-${valueKey}`}
              type="color"
              value={form.color || "#cccccc"}
              onChange={(e) => onFormChange({ color: e.target.value })}
              disabled={saving}
              className="pointer-events-none absolute opacity-0"
              style={{ width: 0, height: 0, padding: 0, border: 0 }}
            />
          </div>
        </div>
      </div>

      {/* Actions row - shown only when has changes */}
      {hasChanges && (
        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
          <Tooltip label="Hủy">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                // Rollback to original
                if (original) {
                  onFormChange({ ...original });
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
            >
              <MdUndo className="h-4 w-4" />
            </button>
          </Tooltip>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
          >
            <MdSave className="h-4 w-4" />
            Lưu
          </button>
        </div>
      )}
    </div>
  );
};

export default MetadataValueItem;
