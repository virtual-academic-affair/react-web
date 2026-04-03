import Drawer from "@/components/drawer/Drawer";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Switch from "@/components/switch";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip.tsx";
import MetadataValueItem from "@/pages/documents/metadata/components/MetadataValueItem";
import { MetadataService } from "@/services/documents";
import { RoleColors, RoleLabels } from "@/types/users";
import { formatDate } from "@/utils/date";
import { parseError } from "@/utils/parseError";
import { toSnakeCase } from "@/utils/snakeCase";
import { message as toast } from "antd";
import React from "react";
import { MdAdd, MdClose, MdDeleteOutline, MdSave } from "react-icons/md";

interface MetadataTypeDrawerProps {
  typeCode: string | null;
  initialType: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (type: any, mode: "create" | "edit") => void;
}

interface ValueForm {
  value: string;
  displayName: string;
  isActive: boolean;
  color: string;
  visibleRoles: string[];
  totalFiles: number;
}

interface DraftValueForm {
  value: string;
  displayName: string;
  isActive: boolean;
  color: string;
  visibleRoles: string[];
}

const ALL_ROLES = ["student", "lecture"] as const;

const MetadataTypeDrawer: React.FC<MetadataTypeDrawerProps> = ({
  typeCode,
  initialType,
  isOpen,
  onClose,
  onSaved,
}) => {
  const isEdit = Boolean(typeCode);
  const [key, setKey] = React.useState(initialType?.key ?? "");
  const [displayName, setDisplayName] = React.useState(
    initialType?.displayName ?? "",
  );
  const [description, setDescription] = React.useState(
    initialType?.description ?? "",
  );
  const [isActive, setIsActive] = React.useState<boolean>(
    initialType?.isActive ?? true,
  );
  const [saving, setSaving] = React.useState(false);
  const [savingValues, setSavingValues] = React.useState<Set<string>>(
    new Set(),
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // Value forms: keyed by value key
  const [valueForms, setValueForms] = React.useState<Record<string, ValueForm>>(
    {},
  );
  const [originalValues, setOriginalValues] = React.useState<
    Record<string, ValueForm>
  >({});
  const [draftValue, setDraftValue] = React.useState<DraftValueForm | null>(
    null,
  );
  React.useEffect(() => {
    setKey(initialType?.key ?? "");
    setDisplayName(initialType?.displayName ?? "");
    setDescription(initialType?.description ?? "");
    setIsActive(initialType?.isActive ?? true);
    // Initialize value forms
    const forms: Record<string, ValueForm> = {};
    const original: Record<string, ValueForm> = {};
    (initialType?.allowedValues ?? []).forEach((v: any) => {
      const form: ValueForm = {
        value: v.value,
        displayName: v.displayName,
        isActive: v.isActive,
        color: v.color ?? "",
        visibleRoles: v.visibleRoles ?? ["admin"],
        totalFiles: v.totalFiles ?? 0,
      };
      forms[v.value] = form;
      original[v.value] = { ...form };
    });
    setValueForms(forms);
    setOriginalValues(original);
    setDraftValue(null);
  }, [initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Vui lòng nhập tên hiển thị.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && typeCode) {
        const updated = await MetadataService.updateType(typeCode, {
          displayName: displayName.trim(),
          description: description.trim(),
          isActive,
        });
        toast.success("Cập nhật thành công.");
        onSaved(updated, "edit");
      } else {
        if (!key.trim()) {
          toast.error("Vui lòng nhập code.");
          setSaving(false);
          return;
        }
        const dto = {
          key: key.trim(),
          displayName: displayName.trim(),
          description: description.trim(),
          isActive,
        };
        const created = await MetadataService.createType(dto);
        toast.success("Tạo nhãn tài liệu thành công.");
        onSaved(created, "create");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(parseError(err));
    } finally {
      setSaving(false);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!isEdit) {
      return (
        key.trim() !== "" ||
        displayName.trim() !== "" ||
        description.trim() !== "" ||
        isActive !== true
      );
    }
    return (
      displayName !== (initialType?.displayName ?? "") ||
      description !== (initialType?.description ?? "") ||
      isActive !== (initialType?.isActive ?? true)
    );
  }, [isEdit, key, displayName, description, isActive, initialType]);

  // Value CRUD
  const updateValueField = async (
    originalValue: string,
    updates: Partial<ValueForm>,
  ) => {
    if (!typeCode) return;

    const current = valueForms[originalValue];
    if (!current) return;

    const next: ValueForm = { ...current, ...updates };

    // Optimistic update
    setValueForms((prev) => ({ ...prev, [originalValue]: next }));
    setSavingValues((prev) => new Set(prev).add(originalValue));

    try {
      const updated = await MetadataService.updateValue(
        typeCode,
        originalValue,
        {
          displayName: next.displayName,
          isActive: next.isActive,
          color: next.color || undefined,
          visibleRoles: next.visibleRoles,
        },
      );

      // Merge updated values back (backend may have changed something)
      setValueForms((prev) => ({
        ...prev,
        [originalValue]: {
          ...next,
          ...(updated.allowedValues?.find(
            (v: any) => v.value === originalValue,
          ) ?? {}),
        },
      }));
      setOriginalValues((prev) => ({
        ...prev,
        [originalValue]: {
          ...next,
          ...(updated.allowedValues?.find(
            (v: any) => v.value === originalValue,
          ) ?? {}),
        },
      }));

      // Update parent
      onSaved(updated, "edit");
      toast.success("Cập nhật giá trị thành công.");
    } catch (err: unknown) {
      // Rollback
      setValueForms((prev) => ({ ...prev, [originalValue]: current }));
      toast.error(parseError(err));
    } finally {
      setSavingValues((prev) => {
        const next = new Set(prev);
        next.delete(originalValue);
        return next;
      });
    }
  };

  const handleDeleteValue = async (value: string) => {
    if (!typeCode) return;
    const item = valueForms[value];
    if (!item) return;

    if (!window.confirm(`Xóa giá trị "${item.displayName}" (${item.value})?`)) {
      return;
    }

    setSavingValues((prev) => new Set(prev).add(value));
    try {
      const updated = await MetadataService.deleteValue(typeCode, value);
      const nextForms = { ...valueForms };
      delete nextForms[value];
      setValueForms(nextForms);
      const nextOriginal = { ...originalValues };
      delete nextOriginal[value];
      setOriginalValues(nextOriginal);
      onSaved(updated, "edit");
      toast.success("Đã xóa giá trị.");
    } catch (err: unknown) {
      toast.error(parseError(err));
    } finally {
      setSavingValues((prev) => {
        const next = new Set(prev);
        next.delete(value);
        return next;
      });
    }
  };

  const handleCreateValue = async (closeAfter = false) => {
    if (!typeCode || !draftValue) return;
    if (!draftValue.value.trim()) {
      toast.error("Vui lòng nhập giá trị (value).");
      return;
    }
    if (!draftValue.displayName.trim()) {
      toast.error("Vui lòng nhập tên hiển thị.");
      return;
    }
    const isDuplicate = Object.values(valueForms).some(
      (v) => v.value.toLowerCase() === draftValue.value.toLowerCase(),
    );
    if (isDuplicate) {
      toast.error("Code đã tồn tại trong danh sách.");
      return;
    }

    setSavingValues((prev) => new Set(prev).add("__new__"));
    try {
      const updated = await MetadataService.addValue(typeCode, {
        value: draftValue.value.trim(),
        displayName: draftValue.displayName.trim(),
        isActive: draftValue.isActive,
        color: draftValue.color || undefined,
        visibleRoles: ["admin", ...draftValue.visibleRoles],
      });

      // Add to local state
      const newValue =
        updated.allowedValues?.find(
          (v: any) => v.value === draftValue.value.trim(),
        ) ?? {};
      const savedForm: ValueForm = {
        ...draftValue,
        value: draftValue.value.trim(),
        visibleRoles: ["admin", ...draftValue.visibleRoles],
        totalFiles: newValue.totalFiles ?? 0,
      };
      setValueForms((prev) => ({
        ...prev,
        [draftValue.value.trim()]: savedForm,
      }));
      setOriginalValues((prev) => ({
        ...prev,
        [draftValue.value.trim()]: savedForm,
      }));

      onSaved(updated, "edit");
      toast.success("Đã thêm giá trị mới.");

      if (closeAfter) {
        setDraftValue(null);
      } else {
        // Reset for next entry
        setDraftValue({
          value: "",
          displayName: "",
          isActive: true,
          color: "",
          visibleRoles: ["admin"],
        });
      }
    } catch (err: unknown) {
      toast.error(parseError(err));
    } finally {
      setSavingValues((prev) => {
        const next = new Set(prev);
        next.delete("__new__");
        return next;
      });
    }
  };

  const footerLeft = isEdit && (
    <div className="flex items-center gap-2">
      {/* Delete nhãn tài liệu button */}
      {initialType && (
        <Tooltip
          label={
            initialType.totalFiles > 0 || initialType.isSystem
              ? "Nhãn mặc định hoặc có tệp được gán"
              : "Xóa nhãn tài liệu"
          }
        >
          <button
            type="button"
            disabled={saving || initialType.totalFiles > 0}
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MdDeleteOutline className="h-4 w-4" />
          </button>
        </Tooltip>
      )}
    </div>
  );

  const footerRight =
    isDirty && !draftValue ? (
      <>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            if (isEdit && initialType) {
              setDisplayName(initialType.displayName);
              setDescription(initialType.description);
              setIsActive(initialType.isActive);
            } else {
              setKey("");
              setDisplayName("");
              setDescription("");
              setIsActive(true);
            }
          }}
          className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSubmit as any}
          className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          <MdSave className="h-4 w-4" />
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </>
    ) : null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Chi tiết nhãn tài liệu" : "Tạo nhãn tài liệu mới"}
      footerLeft={footerLeft}
      footerRight={footerRight}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Key (read-only text) */}
        <div className="flex items-start gap-6">
          <div className="w-40 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Code
            </p>
          </div>
          <div className="flex-1">
            {isEdit ? (
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                #{key}
              </p>
            ) : (
              <>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(toSnakeCase(e.target.value))}
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                  placeholder="Nhập code"
                />
                <p className="absolute mt-1 text-xs text-red-500 dark:text-gray-400">
                  Code không thể chỉnh sửa sau khi tạo
                </p>
              </>
            )}
          </div>
        </div>

        {/* Tên hiển thị */}
        <div className="flex items-start gap-6">
          <div className="w-40 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Tên hiển thị
            </p>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              placeholder="ví dụ: Phạm vi truy cập"
            />
          </div>
        </div>

        {/* Mô tả */}
        <div className="flex items-start gap-6">
          <div className="w-40 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Mô tả
            </p>
          </div>
          <div className="flex-1">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              placeholder="Thông tin thêm..."
            />
          </div>
        </div>

        {/* SL tài liệu */}
        <div className="flex items-start gap-6">
          <div className="w-40 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              SL tài liệu
            </p>
          </div>
          <div className="flex-1">
            <p className="text-navy-700 text-base dark:text-white">
              {initialType?.totalFiles ?? 0}
            </p>
          </div>
        </div>

        {/* Trạng thái hiển thị */}
        <div className="flex items-center gap-6">
          <div className="w-40 shrink-0">
            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Trạng thái hiển thị
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setIsActive(e.target.checked)
                }
              />
            </div>
          </div>
        </div>
      </form>

      {/* Values section - only show when editing */}
      {isEdit && initialType && (
        <div className="mt-5 border-t border-gray-100 pt-5 dark:border-white/10">
          {/* SL tài liệu moved above values */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <p className="text-navy-700 text-xs font-semibold tracking-wide uppercase dark:text-white">
                Các giá trị
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {Object.entries(valueForms).map(([valueKey, form]) => {
              const original = originalValues[valueKey];
              const saving = savingValues.has(valueKey);

              return (
                <MetadataValueItem
                  key={valueKey}
                  meta={key}
                  valueKey={valueKey}
                  form={form}
                  original={original}
                  saving={saving}
                  onFormChange={(updates) =>
                    setValueForms((prev) => ({
                      ...prev,
                      [valueKey]: { ...prev[valueKey], ...updates },
                    }))
                  }
                  onSave={() => {
                    updateValueField(valueKey, {
                      displayName: form.displayName,
                      isActive: form.isActive,
                      color: form.color,
                      visibleRoles: form.visibleRoles,
                    });
                    setOriginalValues((prev) => ({
                      ...prev,
                      [valueKey]: { ...form },
                    }));
                  }}
                  onDelete={() => handleDeleteValue(valueKey)}
                />
              );
            })}

            {/* Draft value form */}
            {draftValue !== null ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-transparent p-4 dark:border-gray-600">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-navy-700 text-base font-medium dark:text-white">
                      Thêm mới
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={savingValues.has("__new__")}
                    onClick={() => setDraftValue(null)}
                    className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Hủy"
                  >
                    <MdClose className="h-4 w-4" />
                    Hủy
                  </button>
                </div>

                {/* Fields - grid layout */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Code - full width */}
                  <div className="col-span-2 flex items-center gap-6">
                    <div className="w-32 shrink-0">
                      <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                        Code
                      </p>
                    </div>
                    <div className="relative mb-4 flex-1">
                      {(() => {
                        const isDuplicate = Object.values(valueForms).some(
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
                                setDraftValue({ ...draftValue, value: newVal });
                              }}
                              disabled={savingValues.has("__new__")}
                              className={`w-full rounded-2xl border bg-transparent px-3 py-2 text-sm outline-none dark:text-white ${
                                isDuplicate
                                  ? "border-red-500"
                                  : "border-gray-200 dark:border-white/10"
                              }`}
                              placeholder="ví dụ: gia_tri_1"
                            />
                            {isDuplicate ? (
                              <p className="absolute mt-1 text-xs text-red-500 dark:text-gray-400">
                                Code đã tồn tại trong danh sách
                              </p>
                            ) : (
                              <p className="absolute mt-1 text-xs text-red-500 dark:text-gray-400">
                                Code không thể chỉnh sửa sau khi tạo
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

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
                        value={draftValue.displayName}
                        onChange={(e) =>
                          setDraftValue({
                            ...draftValue,
                            displayName: e.target.value,
                          })
                        }
                        disabled={savingValues.has("__new__")}
                        className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                        placeholder="Nhập tên hiển thị"
                      />
                    </div>
                  </div>

                  {/* Quyền xem - full width */}
                  <div className="flex items-start gap-6 md:col-span-2">
                    <div className="w-32 shrink-0 pt-1">
                      <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                        Quyền xem
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {ALL_ROLES.map((role) => {
                          const checked =
                            draftValue.visibleRoles.includes(role);
                          const colors = RoleColors[role];
                          return (
                            <Tag
                              key={role}
                              color={colors.hex}
                              onClick={() => {
                                if (savingValues.has("__new__")) return;
                                const newRoles = checked
                                  ? draftValue.visibleRoles.filter(
                                      (r) => r !== role,
                                    )
                                  : [...draftValue.visibleRoles, role];
                                setDraftValue({
                                  ...draftValue,
                                  visibleRoles: newRoles,
                                });
                              }}
                              className={`cursor-pointer ${checked ? "" : "opacity-40"} ${savingValues.has("__new__") ? "cursor-not-allowed" : ""}`}
                            >
                              {RoleLabels[role]}
                            </Tag>
                          );
                        })}
                      </div>
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
                      <Switch
                        checked={draftValue.isActive}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDraftValue({
                            ...draftValue,
                            isActive: e.target.checked,
                          })
                        }
                        disabled={savingValues.has("__new__")}
                      />
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
                      <Tooltip label="Chọn màu">
                        <button
                          type="button"
                          disabled={savingValues.has("__new__")}
                          onClick={() => {
                            const input = document.getElementById(
                              `draft-color-input`,
                            ) as HTMLInputElement;
                            if (input) input.click();
                          }}
                          className="focus:ring-brand-500 dark:focus:ring-offset-navy-900 focus:ring-1.5 h-10 w-10 shrink-0 cursor-pointer rounded-full border-2 border-gray-200 bg-transparent transition-all focus:ring-offset-2 focus:outline-none dark:border-white/10"
                          style={{
                            backgroundColor: draftValue.color || "#432afc",
                          }}
                        />
                      </Tooltip>
                      <input
                        id="draft-color-input"
                        type="color"
                        value={draftValue.color || "#cccccc"}
                        onChange={(e) =>
                          setDraftValue({
                            ...draftValue,
                            color: e.target.value,
                          })
                        }
                        disabled={savingValues.has("__new__")}
                        className="pointer-events-none absolute opacity-0"
                        style={{ width: 0, height: 0, padding: 0, border: 0 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                  <button
                    type="button"
                    disabled={
                      savingValues.has("__new__") ||
                      !draftValue.value.trim() ||
                      !draftValue.displayName.trim()
                    }
                    onClick={() => handleCreateValue(false)}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
                    title="Lưu và thêm mới"
                  >
                    <MdSave className="h-4 w-4" />
                    Lưu và thêm mới
                  </button>
                  <button
                    type="button"
                    disabled={
                      savingValues.has("__new__") ||
                      !draftValue.value.trim() ||
                      !draftValue.displayName.trim()
                    }
                    onClick={() => handleCreateValue(true)}
                    className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                    title="Lưu"
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
                  setDraftValue({
                    value: "",
                    displayName: "",
                    isActive: true,
                    color: "",
                    visibleRoles: ["admin"],
                  })
                }
                className="flex items-center justify-center gap-1 rounded-xl bg-gray-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-600"
              >
                <MdAdd className="h-4 w-4" />
                Thêm mới
              </button>
            )}
          </div>
        </div>
      )}

      {/* Technical info */}
      {isEdit && initialType && (
        <div className="mt-5 border-t border-gray-100 pt-5 dark:border-white/10">
          <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
            Thông số kỹ thuật
          </p>
          <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  ID
                </p>
              </div>
              <div className="flex-1">
                <p className="text-navy-700 text-base dark:text-white">
                  {initialType.metadataId || initialType.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Cập nhật lần cuối
                </p>
              </div>
              <div className="flex-1">
                <p className="text-navy-700 text-base dark:text-white">
                  {formatDate(initialType.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (!initialType) return;
          setDeleteConfirmOpen(false);
          setSaving(true);
          try {
            await MetadataService.deleteType(initialType.key);
            toast.success("Đã xóa nhãn tài liệu.");
            onSaved(null as any, "edit");
            onClose();
          } catch (err: unknown) {
            toast.error(parseError(err));
          } finally {
            setSaving(false);
          }
        }}
        title="Xóa nhãn tài liệu"
        subTitle={`Bạn có chắc chắn muốn xóa nhãn tài liệu "${initialType?.key}" không? Hành động này không thể hoàn tác.`}
        loading={saving}
      />
    </Drawer>
  );
};

export default MetadataTypeDrawer;
