import Switch from "@/components/switch";
import Tooltip from "@/components/tooltip/Tooltip";
import { RoleColors, RoleLabels } from "@/types/users";
import { toSnakeCase } from "@/utils/snakeCase";
import React from "react";
import { MdAdd, MdClose, MdDeleteOutline, MdSave } from "react-icons/md";

interface ValueForm {
  value: string;
  displayName: string;
  isActive: boolean;
  color: string;
  visibleRoles: string[];
}

interface MetadataValueEditorProps {
  values: Record<string, ValueForm>;
  savingValues: Set<string>;
  draftValue: ValueForm | null;
  onValuesChange: (values: Record<string, ValueForm>) => void;
  onDraftValueChange: (value: ValueForm | null) => void;
  onSaveValue: (valueKey: string) => void;
  onDeleteValue: (valueKey: string) => void;
  onCreateValue: (closeAfter: boolean) => void;
}

const ALL_ROLES = ["student", "lecture"] as const;

const MetadataValueEditor: React.FC<MetadataValueEditorProps> = ({
  values,
  savingValues,
  draftValue,
  onValuesChange,
  onDraftValueChange,
  onSaveValue,
  onDeleteValue,
  onCreateValue,
}) => {
  const handleValueFieldChange = (
    valueKey: string,
    updates: Partial<ValueForm>,
  ) => {
    onValuesChange({
      ...values,
      [valueKey]: { ...values[valueKey], ...updates },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Danh sách giá trị đã tạo */}
      {Object.entries(values).map(([valueKey, form]) => {
        const saving = savingValues.has(valueKey);
        return (
          <div
            key={valueKey}
            className="dark:bg-navy-700/40 rounded-2xl bg-gray-50 p-4 dark:border-white/10"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: form.color || "#6b7280" }}
                />
                <p className="text-navy-700 text-base font-medium dark:text-white">
                  {form.displayName || valueKey}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onSaveValue(valueKey)}
                  className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  <MdSave className="h-3.5 w-3.5" />
                  Lưu
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onDeleteValue(valueKey)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-500/10"
                >
                  <MdDeleteOutline className="h-3.5 w-3.5" />
                  Xóa
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Code (readonly) */}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-gray-500 uppercase">
                  Code
                </span>
                <span className="dark:bg-navy-800 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                  {valueKey}
                </span>
              </div>

              {/* Tên hiển thị */}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-gray-500 uppercase">
                  Tên
                </span>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) =>
                    handleValueFieldChange(valueKey, {
                      displayName: e.target.value,
                    })
                  }
                  disabled={saving}
                  className="dark:bg-navy-800 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-white/10 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30"
                  placeholder="Tên hiển thị"
                />
              </div>

              {/* Quyền xem */}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-gray-500 uppercase">
                  Quyền xem
                </span>
                <div className="flex flex-wrap gap-1">
                  {ALL_ROLES.map((role) => {
                    const checked = form.visibleRoles.includes(role);
                    const colors = RoleColors[role];
                    return (
                      <button
                        key={role}
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          const next = checked
                            ? form.visibleRoles.filter((r) => r !== role)
                            : [...form.visibleRoles, role];
                          handleValueFieldChange(valueKey, {
                            visibleRoles: next,
                          });
                        }}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          checked
                            ? `${colors.bg} ${colors.text} border-transparent`
                            : "dark:bg-navy-800 border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:text-gray-400"
                        }`}
                      >
                        {RoleLabels[role]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hiển thị & Màu sắc */}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </span>
                <Switch
                  checked={form.isActive}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleValueFieldChange(valueKey, {
                      isActive: e.target.checked,
                    })
                  }
                  disabled={saving}
                />
                <Tooltip label="Màu">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      const input = document.getElementById(
                        `color-input-${valueKey}`,
                      ) as HTMLInputElement;
                      if (input) input.click();
                    }}
                    className="focus:ring-brand-500 h-7 w-7 shrink-0 cursor-pointer rounded-full border-2 border-gray-200 transition-all focus:ring-2 focus:ring-offset-1 focus:outline-none dark:border-white/10"
                    style={{
                      backgroundColor: form.color || "#6b7280",
                    }}
                  />
                </Tooltip>
                <input
                  id={`color-input-${valueKey}`}
                  type="color"
                  value={form.color || "#6b7280"}
                  onChange={(e) =>
                    handleValueFieldChange(valueKey, { color: e.target.value })
                  }
                  disabled={saving}
                  className="pointer-events-none absolute opacity-0"
                  style={{ width: 0, height: 0 }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Form thêm mới */}
      {draftValue !== null ? (
        <div className="border-brand-300 bg-brand-50/30 dark:border-brand-500/50 dark:bg-brand-500/5 rounded-2xl border-2 border-dashed p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MdAdd className="text-brand-500 h-4 w-4" />
              <p className="text-navy-700 text-sm font-medium dark:text-white">
                Thêm giá trị mới
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDraftValueChange(null)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
            >
              <MdClose className="h-3.5 w-3.5" />
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Code */}
            <div className="flex items-center gap-3 md:col-span-2">
              <span className="w-20 shrink-0 text-xs font-medium text-gray-500 uppercase">
                Code *
              </span>
              <div className="flex-1">
                {(() => {
                  const isDuplicate =
                    draftValue &&
                    Object.values(values).some(
                      (v) =>
                        v.value.toLowerCase() ===
                        draftValue.value.toLowerCase(),
                    );
                  return (
                    <>
                      <input
                        type="text"
                        value={draftValue.value}
                        onChange={(e) => {
                          const newVal = toSnakeCase(e.target.value);
                          onDraftValueChange({ ...draftValue, value: newVal });
                        }}
                        className={`dark:bg-navy-800 flex-1 rounded-xl border bg-white px-3 py-1.5 text-sm outline-none dark:border-white/10 dark:text-white ${
                          isDuplicate ? "border-red-500" : "border-gray-200"
                        }`}
                        placeholder="ví dụ: gia_tri_1"
                      />
                      <p
                        className={`mt-1 text-xs ${isDuplicate ? "text-red-500" : "text-gray-500"}`}
                      >
                        {isDuplicate
                          ? "Code đã tồn tại"
                          : "Code không thể chỉnh sửa sau khi tạo"}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Tên hiển thị */}
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-gray-500 uppercase">
                Tên *
              </span>
              <input
                type="text"
                value={draftValue.displayName}
                onChange={(e) =>
                  onDraftValueChange({
                    ...draftValue,
                    displayName: e.target.value,
                  })
                }
                className="dark:bg-navy-800 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-white/10 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30"
                placeholder="Tên hiển thị"
              />
            </div>

            {/* Quyền xem */}
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-gray-500 uppercase">
                Quyền xem
              </span>
              <div className="flex flex-wrap gap-1">
                {ALL_ROLES.map((role) => {
                  const checked = draftValue.visibleRoles.includes(role);
                  const colors = RoleColors[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        const newRoles = checked
                          ? draftValue.visibleRoles.filter((r) => r !== role)
                          : [...draftValue.visibleRoles, role];
                        onDraftValueChange({
                          ...draftValue,
                          visibleRoles: newRoles,
                        });
                      }}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        checked
                          ? `${colors.bg} ${colors.text} border-transparent`
                          : "dark:bg-navy-800 border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:text-gray-400"
                      }`}
                    >
                      {RoleLabels[role]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hiển thị & Màu sắc */}
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-gray-500 uppercase">
                Khác
              </span>
              <Switch
                checked={draftValue.isActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onDraftValueChange({
                    ...draftValue,
                    isActive: e.target.checked,
                  })
                }
              />
              <Tooltip label="Chọn màu">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById(
                      `draft-color-input`,
                    ) as HTMLInputElement;
                    if (input) input.click();
                  }}
                  className="focus:ring-brand-500 h-7 w-7 shrink-0 cursor-pointer rounded-full border-2 border-gray-200 transition-all hover:scale-110 focus:ring-2 focus:ring-offset-1 focus:outline-none dark:border-white/10"
                  style={{
                    backgroundColor: draftValue.color || "#432afc",
                  }}
                />
              </Tooltip>
              <input
                id="draft-color-input"
                type="color"
                value={draftValue.color || "#432afc"}
                onChange={(e) =>
                  onDraftValueChange({
                    ...draftValue,
                    color: e.target.value,
                  })
                }
                className="pointer-events-none absolute opacity-0"
                style={{ width: 0, height: 0 }}
              />
            </div>
          </div>

          {/* Nút hành động */}
          <div className="mt-4 flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-white/10">
            <button
              type="button"
              disabled={
                !draftValue.value.trim() || !draftValue.displayName.trim()
              }
              onClick={() => onCreateValue(false)}
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <MdSave className="h-4 w-4" />
              Lưu & Thêm
            </button>
            <button
              type="button"
              disabled={
                !draftValue.value.trim() || !draftValue.displayName.trim()
              }
              onClick={() => onCreateValue(true)}
              className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdSave className="h-4 w-4" />
              Lưu
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            onDraftValueChange({
              value: "",
              displayName: "",
              isActive: true,
              color: "",
              visibleRoles: [],
            })
          }
          className="hover:border-brand-500 hover:text-brand-500 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 transition-colors dark:border-white/20 dark:text-gray-400"
        >
          <MdAdd className="h-5 w-5" />
          Thêm giá trị mới
        </button>
      )}
    </div>
  );
};

export default MetadataValueEditor;
