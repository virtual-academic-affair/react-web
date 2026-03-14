import Drawer from "@/components/drawer/Drawer";
import Switch from "@/components/switch";
import {
  cancelReasonsService,
  classRegistrationItemsService,
  classRegistrationsService,
} from "@/services/class-registration";
import type {
  CancelReason,
  ClassRegistration,
  ClassRegistrationItem,
  ItemStatus,
  MessageStatus,
} from "@/types/classRegistration";
import {
  ItemStatusColors,
  ItemStatusLabels,
  MessageStatusColors,
  MessageStatusLabels,
  type UpdateClassRegistrationDto,
} from "@/types/classRegistration";
import { formatDate } from "@/utils/date";
import { message as toast } from "antd";
import React from "react";
import {
  MdCheckCircle,
  MdClose,
  MdDeleteOutline,
  MdSave,
  MdUndo,
  MdAdd,
} from "react-icons/md";
import MessageStatusSelector from "./MessageStatusSelector";
import RichTextEditor from "./RichTextEditor";

interface RegistrationDetailDrawerProps {
  registrationId: number | null;
  onClose: () => void;
  onRegistrationChanged: (next: ClassRegistration) => void;
}

const RegistrationDetailDrawer: React.FC<RegistrationDetailDrawerProps> = ({
  registrationId,
  onClose,
  onRegistrationChanged,
}) => {
  const [detail, setDetail] = React.useState<ClassRegistration | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [updatingItemIds, setUpdatingItemIds] = React.useState<Set<number>>(
    new Set(),
  );
  const [savingInfo, setSavingInfo] = React.useState(false);
  const [form, setForm] = React.useState<{
    studentCode: string;
    studentName: string;
    academicYear: string;
    note: string;
    messageStatus: MessageStatus | null;
  } | null>(null);
  const [cancelReasons, setCancelReasons] = React.useState<CancelReason[]>([]);
  const [itemForms, setItemForms] = React.useState<
    Record<
      number,
      {
        rejectReasons: string[];
        isInCurriculum: boolean;
      }
    >
  >({});

  React.useEffect(() => {
    if (registrationId == null) {
      setDetail(null);
      return;
    }
    setLoading(true);
    classRegistrationsService
      .getById(registrationId)
      .then(setDetail)
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Không thể tải chi tiết.";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [registrationId]);

  React.useEffect(() => {
    if (!detail) {
      setForm(null);
      setItemForms({});
      return;
    }
    setForm({
      studentCode: detail.studentCode,
      studentName: detail.studentName,
      academicYear: String(detail.academicYear),
      note: detail.note ?? "",
      messageStatus: detail.messageStatus ?? null,
    });
    // Initialize item forms
    const forms: Record<
      number,
      { rejectReasons: string[]; isInCurriculum: boolean }
    > = {};
    (detail.items ?? []).forEach((item) => {
      forms[item.id] = {
        rejectReasons: item.rejectReasons ?? [],
        isInCurriculum: item.isInCurriculum ?? false,
      };
    });
    setItemForms(forms);
  }, [detail]);

  // Load cancel reasons
  React.useEffect(() => {
    cancelReasonsService
      .getList({ isActive: true, limit: 100 })
      .then((resp) => setCancelReasons(resp.items))
      .catch(() => {
        // Silent fail
      });
  }, []);

  const updateItemStatus = async (
    item: ClassRegistrationItem,
    status: ItemStatus,
    rejectReasons?: string[],
  ) => {
    if (!detail) {
      return;
    }

    setUpdatingItemIds((prev) => new Set(prev).add(item.id));
    try {
      const itemForm = itemForms[item.id];
      const updated = await classRegistrationItemsService.update(
        detail.id,
        item.id,
        {
          status,
          rejectReasons: rejectReasons ?? itemForm?.rejectReasons,
          isInCurriculum: itemForm?.isInCurriculum,
        },
      );

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              items: (prev.items ?? []).map((i) =>
                i.id === item.id ? updated : i,
              ),
            }
          : prev,
      );

      onRegistrationChanged({
        ...detail,
        items: (detail.items ?? []).map((i) =>
          i.id === item.id ? updated : i,
        ),
      });
      toast.success("Cập nhật trạng thái lớp con thành công.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cập nhật trạng thái thất bại.";
      toast.error(msg);
    } finally {
      setUpdatingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const updateItemField = async (
    item: ClassRegistrationItem,
    field: "isInCurriculum" | "rejectReasons",
  ) => {
    if (!detail) {
      return;
    }

    setUpdatingItemIds((prev) => new Set(prev).add(item.id));
    try {
      const itemForm = itemForms[item.id];
      const dto: any = {
        [field]: itemForm?.[field],
      };
      const updated = await classRegistrationItemsService.update(
        detail.id,
        item.id,
        dto,
      );

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              items: (prev.items ?? []).map((i) =>
                i.id === item.id ? updated : i,
              ),
            }
          : prev,
      );

      onRegistrationChanged({
        ...detail,
        items: (detail.items ?? []).map((i) =>
          i.id === item.id ? updated : i,
        ),
      });
      toast.success("Cập nhật thông tin lớp thành công.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cập nhật thông tin thất bại.";
      toast.error(msg);
    } finally {
      setUpdatingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleReject = async (item: ClassRegistrationItem) => {
    const reasons = itemForms[item.id]?.rejectReasons ?? [];
    if (reasons.length === 0) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    await updateItemStatus(item, "rejected", reasons);
  };

  const handleRemoveItem = async (item: ClassRegistrationItem) => {
    if (!detail) return;
    if (
      !window.confirm(
        `Xóa lớp "${item.subjectName}${item.className ? ` - ${item.className}` : ""}"?`,
      )
    ) {
      return;
    }
    setUpdatingItemIds((prev) => new Set(prev).add(item.id));
    try {
      await classRegistrationItemsService.remove(detail.id, item.id);
      const updatedItems = (detail.items ?? []).filter((i) => i.id !== item.id);
      const updated = { ...detail, items: updatedItems };
      setDetail(updated);
      onRegistrationChanged(updated);
      toast.success("Đã xóa lớp.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Xóa lớp thất bại.";
      toast.error(msg);
    } finally {
      setUpdatingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const updateItemForm = (
    itemId: number,
    field: "rejectReasons" | "isInCurriculum",
    value: string[] | boolean,
  ) => {
    setItemForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleFieldChange = (
    field: "studentCode" | "studentName" | "academicYear" | "note",
    value: string,
  ) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleMessageStatusChange = (status: MessageStatus | null) => {
    setForm((prev) => (prev ? { ...prev, messageStatus: status } : prev));
  };

  const handleResetForm = () => {
    if (!detail) {
      return;
    }
    setForm({
      studentCode: detail.studentCode,
      studentName: detail.studentName,
      academicYear: String(detail.academicYear),
      note: detail.note ?? "",
      messageStatus: detail.messageStatus ?? null,
    });
    // Reset item forms
    const forms: Record<
      number,
      { rejectReasons: string[]; isInCurriculum: boolean }
    > = {};
    (detail.items ?? []).forEach((item) => {
      forms[item.id] = {
        rejectReasons: item.rejectReasons ?? [],
        isInCurriculum: item.isInCurriculum ?? false,
      };
    });
    setItemForms(forms);
  };

  const handleSaveInfo = async () => {
    if (!detail || !form) {
      return;
    }

    const academicYearNumber = Number(form.academicYear) || detail.academicYear;

    const dto: UpdateClassRegistrationDto = {
      studentCode: form.studentCode.trim() || detail.studentCode,
      studentName: form.studentName.trim() || detail.studentName,
      academicYear: academicYearNumber,
      note: form.note.trim() || undefined,
      messageStatus: form.messageStatus,
    };

    setSavingInfo(true);
    try {
      const updated = await classRegistrationsService.update(detail.id, dto);
      setDetail(updated);
      onRegistrationChanged(updated);
      toast.success("Cập nhật thông tin đăng ký lớp thành công.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Cập nhật thông tin thất bại.";
      toast.error(msg);
    } finally {
      setSavingInfo(false);
    }
  };

  const isOpen = registrationId != null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Chi tiết đăng kí lớp">
      {loading || !form ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      ) : !detail ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Không có dữ liệu.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Student info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  MSSV
                </p>
              </div>
              <div className="flex-1">
                <input
                  value={form.studentCode}
                  onChange={(e) =>
                    handleFieldChange("studentCode", e.target.value)
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Họ tên
                </p>
              </div>
              <div className="flex-1">
                <input
                  value={form.studentName}
                  onChange={(e) =>
                    handleFieldChange("studentName", e.target.value)
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Năm học
                </p>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={form.academicYear}
                  onChange={(e) =>
                    handleFieldChange("academicYear", e.target.value)
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Trạng thái email
                </p>
              </div>
              <div className="flex-1">
                <MessageStatusSelector
                  value={form.messageStatus}
                  onChange={handleMessageStatusChange}
                  disabled={savingInfo}
                />
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-40 shrink-0">
                <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Ghi chú
                </p>
              </div>
              <div className="flex-1">
                <RichTextEditor
                  value={form.note}
                  onChange={(html) => handleFieldChange("note", html)}
                />
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                disabled={savingInfo}
                onClick={handleResetForm}
                className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingInfo}
                onClick={handleSaveInfo}
                className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                <MdSave className="h-4 w-4" />
                {savingInfo ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>

          {/* Child items - kết quả đăng ký */}
          <div className="mt-2 border-t border-gray-100 pt-4 dark:border-white/10">
            <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
              Danh sách đăng ký
            </p>
            <div className="flex flex-col gap-4">
                  {(detail.items ?? []).map((item) => {
                    const updating = updatingItemIds.has(item.id);
                const itemForm = itemForms[item.id] ?? {
                  rejectReasons: item.rejectReasons ?? [],
                  isInCurriculum: item.isInCurriculum ?? false,
                };
                    return (
                  <div
                        key={item.id}
                    className="dark:bg-navy-700/40 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10"
                  >
                    {/* Header with remove button */}
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-navy-700 text-base font-medium dark:text-white">
                        Lớp #{item.id}
                      </p>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => handleRemoveItem(item)}
                        className="text-red-500 hover:text-red-600 flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <MdDeleteOutline className="h-4 w-4" />
                        Xóa
                      </button>
                    </div>

                    {/* Item details */}
                    <div className="flex flex-col gap-3">
                      {/* Lớp HP */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Lớp HP
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-navy-700 text-sm dark:text-white">
                            {item.className || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Tên MH */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Tên MH
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-navy-700 text-sm dark:text-white">
                          {item.subjectName}
                          </p>
                        </div>
                      </div>

                      {/* Mã MH */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Mã MH
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-navy-700 text-sm dark:text-white">
                            {item.subjectCode || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Thông tin lớp */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Thông tin lớp
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-navy-700 text-sm dark:text-white">
                            {item.slotInfo || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Trong CTDT */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Trong CTDT
                          </p>
                        </div>
                        <div className="flex-1">
                          <Switch
                            checked={itemForm.isInCurriculum}
                            onChange={() => {}}
                            disabled={true}
                            color="green"
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Trạng thái
                          </p>
                        </div>
                        <div className="flex-1">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${ItemStatusColors[item.status].bg} ${ItemStatusColors[item.status].text}`}
                          >
                            {ItemStatusLabels[item.status]}
                          </span>
                        </div>
                      </div>

                      {/* Ghi chú (rejectReasons) */}
                      <div className="flex items-start gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Ghi chú
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={itemForm.rejectReasons.join(", ")}
                              onChange={(e) => {
                                const reasons = e.target.value
                                  .split(",")
                                  .map((x) => x.trim())
                                  .filter(Boolean);
                                updateItemForm(item.id, "rejectReasons", reasons);
                              }}
                              onBlur={() => {
                                // Auto save on blur
                                updateItemField(item, "rejectReasons");
                              }}
                              placeholder="Nhập lý do từ chối (phân tách bằng dấu phẩy)"
                              className="flex-1 rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                              disabled={updating}
                            />
                            {cancelReasons.length > 0 && (
                              <div className="relative">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const newReasons = [
                                        ...itemForm.rejectReasons,
                                        e.target.value,
                                      ];
                                      updateItemForm(
                                        item.id,
                                        "rejectReasons",
                                        newReasons,
                                      );
                                      e.target.value = "";
                                      // Chỉ thêm vào mảng local, không auto save
                                    }
                                  }}
                                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                  disabled={updating}
                                >
                                  <option value="">Chọn lý do hủy nhanh...</option>
                                  {cancelReasons.map((reason) => (
                                    <option key={reason.id} value={reason.content}>
                                      {reason.content}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={updating}
                                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-transparent text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                                  title="Chọn lý do hủy nhanh"
                                >
                                  <MdAdd className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                            {item.status === "pending" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={updating}
                                  onClick={() => handleReject(item)}
                            className="bg-red-500 hover:bg-red-600 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                                >
                            <MdClose className="h-4 w-4" />
                            Từ chối
                                </button>
                                <button
                                  type="button"
                                  disabled={updating}
                            onClick={() => updateItemStatus(item, "approved")}
                            className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                                >
                            <MdCheckCircle className="h-4 w-4" />
                            Duyệt
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={updating}
                          onClick={() => updateItemStatus(item, "pending")}
                          className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                        >
                          <MdUndo className="h-4 w-4" />
                          Đưa về chờ
                              </button>
                            )}
                          </div>
                  </div>
                    );
                  })}
            </div>
          </div>

          {/* Technical info */}
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
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
                    {detail.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Ngày tạo
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {formatDate(detail.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-40 shrink-0">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Cập nhật gần nhất
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {formatDate(detail.updatedAt)}
                  </p>
                </div>
              </div>
              {detail.messageId != null && (
                <div className="flex items-center gap-6">
                  <div className="w-40 shrink-0">
                    <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                      Message ID
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-700 text-base dark:text-white">
                      {detail.messageId}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default RegistrationDetailDrawer;
