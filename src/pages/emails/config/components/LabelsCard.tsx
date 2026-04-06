import Card from "@/components/card";
import Tag from "@/components/tag/Tag";
import { getLabelColor, getLabelVi } from "@/pages/emails/message/labelUtils";
import { labelsService } from "@/services/email";
import type {
  GmailLabel,
  LabelMappingDto,
  UpdateLabelsDto,
} from "@/types/email.ts";
import type { SystemLabelEnumData } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React, { useMemo, useState } from "react";
import { MdAutoAwesome, MdEdit, MdLabel, MdSave } from "react-icons/md";

interface LabelsCardProps {
  systemLabelEnum?: SystemLabelEnumData | null;
}

const LabelsCard: React.FC<LabelsCardProps> = ({ systemLabelEnum }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LabelMappingDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoCreating, setAutoCreating] = useState(false);

  const {
    data: mapping = null,
    isLoading: loadingMapping,
    refetch: refetchLabels,
  } = useQuery<LabelMappingDto>({
    queryKey: ["email-labels"],
    queryFn: () => labelsService.getLabels(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: gmailLabels = [], isLoading: loadingGmail } = useQuery<
    GmailLabel[]
  >({
    queryKey: ["email-gmail-labels"],
    queryFn: () => labelsService.getGmailLabels(),
    staleTime: 60 * 1000,
  });

  const loading = loadingMapping || loadingGmail;

  const mappingKeys = useMemo(() => {
    // Preferred order: the order defined by systemLabelEnum from backend
    const enumKeys = Object.keys(
      systemLabelEnum ?? {},
    ) as (keyof LabelMappingDto)[];
    if (enumKeys.length) {
      return enumKeys;
    }

    // Fallback 1: keys present in current mapping response (if any)
    const mappingObjKeys = Object.keys(
      mapping ?? {},
    ) as (keyof LabelMappingDto)[];
    if (mappingObjKeys.length) {
      return mappingObjKeys;
    }

    // Fallback 2: static default order
    return [
      "classRegistration",
      "task",
      "inquiry",
      "other",
    ] as (keyof LabelMappingDto)[];
  }, [mapping, systemLabelEnum]);

  const handleEdit = () => {
    refetchLabels();
    setDraft(mapping ? { ...mapping } : null);
    setEditing(true);
  };

  const handleCancel = () => setEditing(false);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const dto: UpdateLabelsDto = { ...draft };
      await labelsService.updateLabels(dto);
      queryClient.setQueryData(["email-labels"], draft);
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
      const result = await labelsService.autoCreateLabels();
      queryClient.setQueryData(["email-labels"], result);
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
        Ánh xạ từng nhãn hệ thống sang nhãn Gmail tương ứng.
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
        <div className="flex flex-col gap-3">
          {mappingKeys.map((key) => {
            const currentValue = editing ? draft?.[key] : mapping?.[key];
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
              >
                <span className="w-40 shrink-0">
                  <Tag
                    color={getLabelColor(key, systemLabelEnum)}
                    interactive={false}
                  >
                    {getLabelVi(key, systemLabelEnum)}
                  </Tag>
                </span>
                {editing ? (
                  <Tag
                    variant="selection"
                    value={draft?.[key] ?? ""}
                    options={gmailLabels.map((gl) => ({
                      value: gl.value,
                      label: gl.label,
                    }))}
                    onChange={(v) =>
                      setDraft((prev) =>
                        prev ? { ...prev, [key]: v || null } : prev,
                      )
                    }
                    className="flex-1"
                  >
                    {draft?.[key]
                      ? (gmailLabels.find((g) => g.value === draft?.[key])
                          ?.label ?? draft?.[key])
                      : "—"}
                  </Tag>
                ) : (
                  <div className="flex-1">
                    {currentValue ? (
                      <Tag interactive={false}>
                        {gmailLabels.find((g) => g.value === currentValue)
                          ?.label ?? currentValue}
                      </Tag>
                    ) : (
                      <span className="text-sm text-gray-400 italic dark:text-gray-500">
                        —
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default LabelsCard;
