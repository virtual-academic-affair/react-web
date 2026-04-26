import Card from "@/components/card";
import SelectField, { type SelectOption } from "@/components/fields/SelectField";
import { labelsService } from "@/services/email";
import { settingsService } from "@/services/shared";
import type {
  GmailLabel,
  LabelMappingDto,
} from "@/types/email.ts";
import { useQuery } from "@tanstack/react-query";
import { message as toast } from "antd";
import React, { useMemo, useState } from "react";
import { MdAutoAwesome, MdEdit, MdLabel, MdSave } from "react-icons/md";

interface LabelsCardProps {
  mapping: LabelMappingDto | null;
  onRefresh: () => Promise<void>;
}

const LABEL_KEYS = [
  "classRegistration",
  "training",
  "graduation",
] as const satisfies ReadonlyArray<keyof LabelMappingDto>;

const LABEL_META: Record<
  (typeof LABEL_KEYS)[number],
  { vi: string; color: string }
> = {
  classRegistration: { vi: "Đăng ký lớp", color: "#9b59b6" },
  training: { vi: "Đào tạo", color: "#3498db" },
  graduation: { vi: "Tốt nghiệp", color: "#2ecc71" },
};

const LabelsCard: React.FC<LabelsCardProps> = ({
  mapping,
  onRefresh,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LabelMappingDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoCreating, setAutoCreating] = useState(false);

  const { data: gmailLabels = [], isLoading: loadingGmail } = useQuery<
    GmailLabel[]
  >({
    queryKey: ["email-gmail-labels"],
    queryFn: () => labelsService.getGmailLabels(),
    staleTime: 60 * 1000,
  });

  const loading = loadingGmail;

  const mappingKeys = useMemo(
    () => LABEL_KEYS as ReadonlyArray<keyof LabelMappingDto>,
    [],
  );
  const labelOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: "— Chưa gán —" },
      ...gmailLabels.map((gl) => ({ value: gl.value, label: gl.label })),
    ],
    [gmailLabels],
  );

  const handleEdit = () => {
    setDraft(mapping ? { ...mapping } : null);
    setEditing(true);
  };

  const handleCancel = () => setEditing(false);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload: LabelMappingDto = {
        classRegistration: draft.classRegistration ?? null,
        training: draft.training ?? null,
        graduation: draft.graduation ?? null,
      };
      await settingsService.update("email.labels", payload);
      await onRefresh();
      setEditing(false);
      toast.success("Cập nhật thành công.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lưu nhãn thất bại.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoCreate = async () => {
    setAutoCreating(true);
    try {
      await labelsService.autoCreateLabels();
      await onRefresh();
      toast.success("Tự động tạo nhãn thành công.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Tự động tạo nhãn thất bại.";
      toast.error(msg);
    } finally {
      setAutoCreating(false);
    }
  };

  return (
    <Card extra="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdLabel className="text-brand-500 h-5 w-5 shrink-0" />
          <h3 className="text-navy-700 text-xl font-bold dark:text-white">
            Ánh xạ nhãn Gmail
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button
                onClick={handleAutoCreate}
                disabled={autoCreating || loading}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/10"
                title="Tự động tạo nhãn còn thiếu trong Gmail"
              >
                <MdAutoAwesome className="h-4 w-4" />
                {autoCreating ? "Đang tạo..." : "Tự động"}
              </button>
              <button
                onClick={handleEdit}
                disabled={loading}
                className="text-brand-500 hover:text-brand-600 flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <MdEdit className="h-4 w-4" />
                Chỉnh sửa
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                <MdSave className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
        Ánh xạ  nhãn hệ thống sang nhãn Gmail tương ứng.
      </p>

      {/* Mapping rows */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="dark:bg-navy-700 h-10 animate-pulse rounded-xl bg-gray-200"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {mappingKeys.map((key) => {
            const currentValue = editing ? draft?.[key] : mapping?.[key];
            return (
              <div
                key={key}
                className="flex items-center rounded-xl py-2.5"
              >
                <span
                  className="w-40 shrink-0 text-sm font-semibold"
                  style={{ color: LABEL_META[key].color }}
                >
                  {LABEL_META[key].vi}
                </span>
                <div className="flex-1">
                  <SelectField
                    value={currentValue ?? ""}
                    options={labelOptions}
                    onChange={(v) => {
                      if (!editing) return;
                      setDraft((prev) =>
                        prev ? { ...prev, [key]: v || null } : prev,
                      );
                    }}
                    disabled={!editing}
                    label={`Gmail label for ${LABEL_META[key].vi}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default LabelsCard;
