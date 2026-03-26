import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import Switch from "@/components/switch";
import Tooltip from "@/components/tooltip/Tooltip";
import { MetadataService } from "@/services/documents.service";
import { RoleColors, RoleLabels } from "@/types/users";
import { parseError } from "@/utils/parseError";
import { toSnakeCase } from "@/utils/snakeCase";
import { message as toast } from "antd";
import React from "react";
import { MdAdd, MdDeleteOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import MetadataProcessSteps from "./components/ProcessSteps";

interface ValueDraft {
  key: string;
  value: string;
  displayName: string;
  isActive: boolean;
  color: string;
  visibleRoles: string[];
}

const ALL_ROLES = ["student", "lecture"] as const;

const emptyValue = (): ValueDraft => ({
  key: Math.random().toString(36).slice(2),
  value: "",
  displayName: "",
  isActive: true,
  color: "",
  visibleRoles: [],
});

const MetadataTypeCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(1);

  // Label info (step 1)
  const [key, setKey] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  // Values (step 2) - list of editable items
  const [values, setValues] = React.useState<ValueDraft[]>([emptyValue()]);
  const [submitting, setSubmitting] = React.useState(false);

  const validateStep1 = () => {
    if (!key.trim()) {
      toast.error("Vui lòng nhập code.");
      return false;
    }
    if (!displayName.trim()) {
      toast.error("Vui lòng nhập tên hiển thị.");
      return false;
    }
    return true;
  };

  const updateValue = (
    itemKey: string,
    field: keyof ValueDraft,
    newValue: string | boolean | string[],
  ) => {
    setValues((prev) =>
      prev.map((item) =>
        item.key === itemKey ? { ...item, [field]: newValue } : item,
      ),
    );
  };

  // Check if value code is duplicate within current list
  const isValueDuplicate = (
    checkKey: string,
    checkItemKey: string,
  ): boolean => {
    return values.some(
      (v) =>
        v.key !== checkItemKey &&
        v.value.toLowerCase() !== "" &&
        v.value.toLowerCase() === checkKey.toLowerCase(),
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    // Validate duplicate values
    const valueCodes = values
      .map((v) => v.value.toLowerCase().trim())
      .filter(Boolean);
    const duplicates = valueCodes.filter(
      (code, idx) => valueCodes.indexOf(code) !== idx,
    );
    if (duplicates.length > 0) {
      toast.error(`Code trùng lặp: ${[...new Set(duplicates)].join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create type first
      const dto = {
        key: key.trim(),
        displayName: displayName.trim(),
        description: description.trim(),
        isActive,
      };
      const created = await MetadataService.createType(dto);
      toast.success("Tạo nhãn thành công.");

      // 2. Add all values that have value and displayName
      const validValues = values.filter(
        (v) => v.value.trim() && v.displayName.trim(),
      );
      for (const v of validValues) {
        try {
          await MetadataService.addValue(created.key, {
            value: v.value.trim(),
            displayName: v.displayName.trim(),
            isActive: v.isActive,
            color: v.color || undefined,
            visibleRoles: ["admin", ...v.visibleRoles],
          });
        } catch (err) {
          console.error(`Failed to add value ${v.value}:`, err);
          toast.error(`Lỗi khi thêm giá trị "${v.value}": ${parseError(err)}`);
        }
      }

      if (validValues.length > 0) {
        toast.success(`Đã thêm ${validValues.length} giá trị.`);
      }

      navigate("/admin/documents/metadata");
    } catch (err: unknown) {
      toast.error(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CreatePageLayout
      title="Tạo nhãn tài liệu"
      processSteps={<MetadataProcessSteps currentStep={currentStep} />}
    >
      {/* Step 1: Create Label */}
      {currentStep === 1 && (
        <>
          <div className="flex items-start gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Code
              </p>
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newVal = toSnakeCase(e.target.value);
                  setKey(newVal);
                }}
                placeholder="Nhập code"
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:text-white"
              />
              <p className="absolute mt-1 text-xs text-red-500 dark:text-gray-400">
                Code không thể chỉnh sửa sau khi tạo
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-6">
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
                placeholder="Nhập tên hiển thị"
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-6 flex items-start gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Mô tả
              </p>
            </div>
            <div className="flex-1">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Mô tả thông tin thêm..."
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-6">
            <div className="w-40 shrink-0">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Trạng thái hiển thị
              </p>
            </div>
            <div className="flex-1">
              <Switch
                checked={isActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setIsActive(e.target.checked)
                }
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/documents/metadata")}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              Tiếp tục
            </button>
          </div>
        </>
      )}

      {/* Step 2: Create Values */}
      {currentStep === 2 && (
        <>
          <div className="flex flex-col gap-4">
            {values.map((item, idx) => (
              <div
                key={item.key}
                className="dark:bg-navy-700/40 hover:border-brand-500/20 rounded-2xl border border-transparent bg-gray-50 p-4 transition-colors dark:border-white/10"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-navy-700 text-base font-medium dark:text-white">
                    Giá trị #{idx + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setValues((prev) =>
                        prev.length === 1
                          ? prev
                          : prev.filter((x) => x.key !== item.key),
                      )
                    }
                    className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <MdDeleteOutline className="h-4 w-4" />
                    Xóa
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Code */}
                  <div className="flex items-center gap-6 md:col-span-2">
                    <label className="w-40 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Code
                    </label>
                    <div className="relative w-full pb-2">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => {
                          const newVal = toSnakeCase(e.target.value);
                          updateValue(item.key, "value", newVal);
                        }}
                        placeholder="Nhập code"
                        className={`dark:bg-navy-800 focus:border-brand-500 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none dark:border-white/10 ${
                          isValueDuplicate(item.value, item.key)
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}
                      />
                      {isValueDuplicate(item.value, item.key) ? (
                        <p className="absolute mt-1 text-xs text-red-500">
                          Code đã tồn tại trong danh sách
                        </p>
                      ) : (
                        <p className="absolute mt-1 text-xs text-red-500">
                          Code không thể chỉnh sửa sau khi tạo.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tên hiển thị */}
                  <div className="flex items-center gap-6 md:col-span-2">
                    <label className="w-40 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={item.displayName}
                      onChange={(e) =>
                        updateValue(item.key, "displayName", e.target.value)
                      }
                      placeholder="Nhập tên hiển thị"
                      className="dark:bg-navy-800 focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10"
                    />
                  </div>

                  {/* Quyền xem */}
                  <div className="flex items-center md:col-span-2">
                    <label className="w-40 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Quyền xem
                    </label>
                    <div className="flex items-center gap-2">
                      {ALL_ROLES.map((role) => {
                        const checked = item.visibleRoles.includes(role);
                        const colors = RoleColors[role];
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              const next = checked
                                ? item.visibleRoles.filter((r) => r !== role)
                                : [...item.visibleRoles, role];
                              updateValue(item.key, "visibleRoles", next);
                            }}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
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

                  {/* Hiển thị */}
                  <div className="flex items-center">
                    <label className="w-40 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Hiển thị
                    </label>
                    <div className="flex items-center">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <Switch
                          checked={item.isActive}
                          onChange={() => {
                            updateValue(item.key, "isActive", !item.isActive);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Màu sắc */}
                  <div className="flex items-center">
                    <label className="w-40 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Màu sắc
                    </label>
                    <div className="flex items-center gap-3">
                      <Tooltip label="Chọn màu">
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(
                              `color-input-${item.key}`,
                            ) as HTMLInputElement;
                            if (input) input.click();
                          }}
                          className="focus:ring-brand-500 dark:focus:ring-offset-navy-900 focus:ring-1.5 h-10 w-10 shrink-0 cursor-pointer rounded-full border-2 border-gray-200 bg-transparent transition-all focus:ring-offset-2 focus:outline-none dark:border-white/10"
                          style={{
                            backgroundColor: item.color || "#432afc",
                          }}
                        />
                      </Tooltip>
                      <input
                        id={`color-input-${item.key}`}
                        type="color"
                        value={item.color || "#432afc"}
                        onChange={(e) =>
                          updateValue(item.key, "color", e.target.value)
                        }
                        className="pointer-events-none absolute opacity-0"
                        style={{ width: 0, height: 0, padding: 0, border: 0 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new button */}
            <button
              type="button"
              onClick={() => setValues((prev) => [...prev, emptyValue()])}
              className="hover:border-brand-500 hover:text-brand-500 dark:hover:border-brand-400 dark:hover:text-brand-400 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-400 transition-colors dark:border-white/10"
            >
              <MdAdd className="h-5 w-5" />
              Thêm giá trị mới
            </button>
          </div>

          <div className="mt-8 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="rounded-2xl border border-gray-100 px-6 py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="rounded-2xl bg-green-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-600 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Đang xử lý..." : "Hoàn tất"}
            </button>
          </div>
        </>
      )}
    </CreatePageLayout>
  );
};

export default MetadataTypeCreatePage;
