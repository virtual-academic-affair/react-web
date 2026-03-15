import Card from "@/components/card";
import {
  getLabelColor,
  getLabelVi,
  labelPillStyle,
} from "@/pages/emails/message/labelUtils";
import { labelsService } from "@/services/email";
import type {
  GmailLabel,
  LabelMappingDto,
  UpdateLabelsDto,
} from "@/types/email.ts";
import type { SystemLabelEnumData } from "@/types/shared";
import { message as toast } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import {
  MdAutoAwesome,
  MdEdit,
  MdExpandMore,
  MdLabel,
  MdSave,
} from "react-icons/md";

interface LabelsCardProps {
  systemLabelEnum?: SystemLabelEnumData | null;
}

const LabelsCard: React.FC<LabelsCardProps> = ({ systemLabelEnum }) => {
  const [mapping, setMapping] = useState<LabelMappingDto | null>(null);
  const [gmailLabels, setGmailLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LabelMappingDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoCreating, setAutoCreating] = useState(false);

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

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [m, g] = await Promise.all([
        labelsService.getLabels(),
        labelsService.getGmailLabels(),
      ]);
      setMapping(m);
      setGmailLabels(g);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tải nhãn thất bại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleEdit = () => {
    fetchAll();
    setDraft(mapping ? { ...mapping } : null);
    setEditing(true);
  };

  const handleCancel = () => setEditing(false);

  const handleSave = async () => {
    if (!draft) {
      return;
    }
    setSaving(true);
    try {
      const dto: UpdateLabelsDto = { ...draft };
      await labelsService.updateLabels(dto);
      setMapping(draft);
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
      setMapping(result);
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
                  <span
                    style={
                      systemLabelEnum
                        ? labelPillStyle(getLabelColor(key, systemLabelEnum))
                        : undefined
                    }
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-gray-700 dark:border-white/10 dark:text-gray-100"
                  >
                    {getLabelVi(key, systemLabelEnum)}
                  </span>
                </span>
                {editing ? (
                  <div className="relative flex-1">
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:border-white/10 dark:text-gray-100">
                      <span>
                        {draft?.[key]
                          ? (gmailLabels.find((g) => g.value === draft?.[key])
                              ?.label ?? draft?.[key])
                          : "—"}
                      </span>
                      <MdExpandMore className="h-3.5 w-3.5 text-gray-400" />
                    </span>
                    <select
                      value={draft?.[key] ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev
                            ? { ...prev, [key]: e.target.value || null }
                            : prev,
                        )
                      }
                      className="dark:bg-navy-700 absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none"
                    >
                      <option value="">—</option>
                      {gmailLabels.map((gl) => (
                        <option key={gl.value} value={gl.value}>
                          {gl.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex-1">
                    {currentValue ? (
                      <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:border-white/10 dark:text-gray-100">
                        {gmailLabels.find((g) => g.value === currentValue)
                          ?.label ?? currentValue}
                      </span>
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
