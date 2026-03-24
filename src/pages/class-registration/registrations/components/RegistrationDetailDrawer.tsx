import Drawer from "@/components/drawer/Drawer";
import Switch from "@/components/switch";
import {
  cancelReasonsService,
  classRegistrationItemsService,
  classRegistrationsService,
} from "@/services/class-registration";
import type {
  ClassRegistration,
  ClassRegistrationItem,
  CreateClassRegistrationItemDto,
  ItemStatus,
  MessageStatus,
} from "@/types/classRegistration";
import {
  ItemStatusColors,
  ItemStatusLabels,
  type UpdateClassRegistrationDto,
} from "@/types/classRegistration";
import { formatDate } from "@/utils/date";
import { message as toast } from "antd";
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdOutlineRateReview,
  MdSave,
  MdUndo,
} from "react-icons/md";
import ReactQuill from "react-quill-new";
import { useSearchParams } from "react-router-dom";
import MessageStatusSelector from "@/components/selector/MessageStatusSelector";
import RichTextEditor from "@/components/fields/RichTextEditor";
import Tooltip from "@/components/tooltip/Tooltip.tsx";

interface RegistrationDetailDrawerProps {
  registrationId: number | null;
  onClose: () => void;
  onRegistrationChanged: (next: ClassRegistration) => void;
  onRegistrationDeleted?: (id: number) => void;
  onPreviewReply?: (id: number) => void;
}

const RegistrationDetailDrawer: React.FC<RegistrationDetailDrawerProps> = ({
  registrationId,
  onClose,
  onRegistrationChanged,
  onRegistrationDeleted,
  onPreviewReply,
}) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const noteEditorRef = React.useRef<ReactQuill>(null);
  
  const { data: detail = null, isLoading: loadingDetail } = useQuery({
    queryKey: ["class-registration", registrationId],
    queryFn: () => classRegistrationsService.getById(registrationId!),
    enabled: registrationId != null,
    staleTime: 30 * 1000,
  });

  const { data: cancelReasonsData } = useQuery({
    queryKey: ["cancel-reasons"],
    queryFn: () => cancelReasonsService.getList({ isActive: true, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const cancelReasons = cancelReasonsData?.items || [];

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
  const [itemForms, setItemForms] = React.useState<
    Record<
      number,
      {
        rejectReasons: string[];
        isInCurriculum: boolean;
      }
    >
  >({});
  const [originalItemRejectReasons, setOriginalItemRejectReasons] =
    React.useState<Record<number, string[]>>({});
  const [draftItem, setDraftItem] =
    React.useState<CreateClassRegistrationItemDto | null>(null);

  React.useEffect(() => {
    if (!detail) {
      setForm(null);
      setItemForms({});
      setOriginalItemRejectReasons({});
      setDraftItem(null);
      return;
    }
    setForm({
      studentCode: detail.studentCode,
      studentName: detail.studentName,
      academicYear: String(detail.academicYear),
      note: detail.note ?? "",
      messageStatus: detail.messageStatus ?? null,
    });
    // Initialize item forms and original values
    const forms: Record<
      number,
      { rejectReasons: string[]; isInCurriculum: boolean }
    > = {};
    const original: Record<number, string[]> = {};
    (detail.items ?? []).forEach((item) => {
      const reasons = item.rejectReasons ?? [];
      // Ensure at least one empty input
      const reasonsWithEmpty =
        reasons.length === 0 || reasons[reasons.length - 1] !== ""
          ? [...reasons, ""]
          : reasons;
      forms[item.id] = {
        rejectReasons: reasonsWithEmpty,
        isInCurriculum: item.isInCurriculum ?? false,
      };
      original[item.id] = [...reasons];
    });
    setItemForms(forms);
    setOriginalItemRejectReasons(original);
  }, [detail]);

  // Focus on note editor when focus=note param is present
  React.useEffect(() => {
    const focusParam = searchParams.get("focus");
    if (focusParam === "note" && noteEditorRef.current && form) {
      // Remove focus param after focusing
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });

      // Focus on the editor after a short delay to ensure it's rendered
      setTimeout(() => {
        const editor = noteEditorRef.current?.getEditor();
        if (editor) {
          editor.focus();
        }
      }, 100);
    }
  }, [searchParams, form, setSearchParams]);

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

      queryClient.setQueryData(
        ["class-registration", registrationId],
        (prev: ClassRegistration | undefined) =>
          prev
            ? {
                ...prev,
                items: (prev.items ?? []).map((i) =>
                  i.id === item.id ? updated : i,
                ),
              }
            : prev
      );

      onRegistrationChanged({
        ...detail,
        items: (detail.items ?? []).map((i) =>
          i.id === item.id ? updated : i,
        ),
      });
      toast.success("Cập nhật thành công.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
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

      queryClient.setQueryData(
        ["class-registration", registrationId],
        (prev: ClassRegistration | undefined) =>
          prev
            ? {
                ...prev,
                items: (prev.items ?? []).map((i) =>
                  i.id === item.id ? updated : i,
                ),
              }
            : prev
      );

      onRegistrationChanged({
        ...detail,
        items: (detail.items ?? []).map((i) =>
          i.id === item.id ? updated : i,
        ),
      });
      toast.success("Cập nhật thành công.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
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
    if (!detail) {
      return;
    }
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
      
      queryClient.setQueryData(["class-registration", registrationId], updated);
      onRegistrationChanged(updated);
      toast.success("Đã xóa lớp.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa lớp thất bại.";
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
      queryClient.setQueryData(["class-registration", registrationId], updated);
      onRegistrationChanged(updated);
      toast.success("Cập nhật thành công.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
      toast.error(msg);
    } finally {
      setSavingInfo(false);
    }
  };

  const isDirty = React.useMemo(() => {
    if (!detail || !form) {
      return false;
    }
    return (
      form.studentCode !== detail.studentCode ||
      form.studentName !== detail.studentName ||
      form.academicYear !== String(detail.academicYear) ||
      form.note !== (detail.note ?? "") ||
      form.messageStatus !== (detail.messageStatus ?? null)
    );
  }, [detail, form]);

  const isOpen = registrationId != null;

  const footerLeft = detail && (
    <>
        <Tooltip label="Xem trước phản hồi">
          <button
             onClick={() => {
              if (detail) onPreviewReply?.(detail.id);
             }}
             className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <MdOutlineRateReview className="h-4 w-4" />
          </button>
        </Tooltip>

        <Tooltip label="Xóa">
          <button
            onClick={() => {
              if (detail) {
                onClose();
                onRegistrationDeleted?.(detail.id);
              }
            }}
            disabled={savingInfo}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
          >
            <MdDeleteOutline className="h-4 w-4" />
          </button>
        </Tooltip>
    </>
  );

  const footerRight = detail && isDirty && (
    <>
          <button
            type="button"
            disabled={savingInfo}
            onClick={handleResetForm}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={savingInfo}
            onClick={handleSaveInfo}
            className="bg-brand-500 hover:bg-brand-600 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            <MdSave className="h-4 w-4" />
            {savingInfo ? "Đang lưu..." : "Lưu"}
          </button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Chi tiết đăng kí lớp" footerLeft={footerLeft} footerRight={footerRight}>
      {loadingDetail || !form ? (
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
                  Trạng thái xử lý
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
                  ref={noteEditorRef}
                  value={form.note}
                  onChange={(html) => handleFieldChange("note", html)}
                />
              </div>
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
                    className="dark:bg-navy-700/40 rounded-2xl bg-gray-50 p-4 dark:border-white/10"
                  >
                    {/* Header with remove button */}
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-navy-700 text-base font-medium dark:text-white">
                        #{item.id}
                      </p>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => handleRemoveItem(item)}
                        className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                      >
                        <MdDeleteOutline className="h-4 w-4" />
                        Xóa
                      </button>
                    </div>

                    {/* Item details */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                    </div>

                    {/* Status and Ghi chú */}
                    <div className="mt-3 flex flex-col gap-3">
                      {/* Ghi chú (rejectReasons) */}
                      <div className="flex items-start gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Ghi chú
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col gap-2">
                            {/* List of input fields */}
                            {itemForm.rejectReasons.map((reason, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => {
                                      const newReasons = [
                                        ...itemForm.rejectReasons,
                                      ];
                                      newReasons[index] = e.target.value;

                                      // If the last input is filled, add a new empty one
                                      const isLastInput =
                                        index ===
                                        itemForm.rejectReasons.length - 1;
                                      if (
                                        isLastInput &&
                                        e.target.value.trim() !== ""
                                      ) {
                                        newReasons.push("");
                                      }

                                      updateItemForm(
                                        item.id,
                                        "rejectReasons",
                                        newReasons,
                                      );
                                    }}
                                    placeholder="Nhập lý do từ chối"
                                    className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 pr-10 text-sm outline-none dark:border-white/10 dark:text-white"
                                    disabled={updating}
                                  />
                                  {/* Quick select dropdown */}
                                  {cancelReasons.length > 0 && (
                                    <div className="absolute top-1/2 right-2 -translate-y-1/2">
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            const newReasons = [
                                              ...itemForm.rejectReasons,
                                            ];
                                            newReasons[index] = e.target.value;
                                            // If this was the last empty input and now filled, add new empty
                                            const isLastInput =
                                              index ===
                                              itemForm.rejectReasons.length - 1;
                                            if (isLastInput) {
                                              newReasons.push("");
                                            }
                                            updateItemForm(
                                              item.id,
                                              "rejectReasons",
                                              newReasons,
                                            );
                                            e.target.value = "";
                                          }
                                        }}
                                        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent opacity-0"
                                        disabled={updating}
                                      >
                                        <option value="">Chọn...</option>
                                        {cancelReasons.map((cancelReason) => (
                                          <option
                                            key={cancelReason.id}
                                            value={cancelReason.content}
                                          >
                                            {cancelReason.content}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        disabled={updating}
                                        className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400"
                                        tabIndex={-1}
                                      >
                                        <MdAdd className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={updating}
                                  onClick={() => {
                                    const newReasons =
                                      itemForm.rejectReasons.filter(
                                        (_, i) => i !== index,
                                      );
                                    // Ensure at least one empty input remains
                                    if (
                                      newReasons.length === 0 ||
                                      newReasons.every((r) => r.trim() !== "")
                                    ) {
                                      newReasons.push("");
                                    }
                                    updateItemForm(
                                      item.id,
                                      "rejectReasons",
                                      newReasons,
                                    );
                                  }}
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-transparent text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-red-500/10"
                                  title="Xóa lý do này"
                                >
                                  <MdClose className="h-4 w-4" />
                                </button>
                              </div>
                            ))}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              {/* Check if content has changed */}
                              {(() => {
                                const currentReasons =
                                  itemForm.rejectReasons.filter(
                                    (r) => r.trim().length > 0,
                                  );
                                const originalReasons =
                                  originalItemRejectReasons[item.id] ?? [];
                                const currentSorted = [...currentReasons]
                                  .sort()
                                  .join("\n");
                                const originalSorted = [...originalReasons]
                                  .sort()
                                  .join("\n");
                                const hasChanged =
                                  currentSorted !== originalSorted;

                                if (!hasChanged) {
                                  return null;
                                }

                                return (
                                  <>
                                    {/* Rollback button */}
                                    <Tooltip label="Hủy">
                                      <button
                                        type="button"
                                        disabled={updating}
                                        onClick={() => {
                                          // Rollback to original, ensure at least one empty input
                                          const rolledBackReasons = [
                                            ...originalReasons,
                                          ];
                                          if (
                                            rolledBackReasons.length === 0 ||
                                            rolledBackReasons[
                                              rolledBackReasons.length - 1
                                            ] !== ""
                                          ) {
                                            rolledBackReasons.push("");
                                          }
                                          updateItemForm(
                                            item.id,
                                            "rejectReasons",
                                            rolledBackReasons,
                                          );
                                        }}
                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                                      >
                                        <MdUndo className="h-4 w-4" />
                                      </button>
                                    </Tooltip>
                                    {/* Save button */}
                                    <button
                                      type="button"
                                      disabled={updating}
                                      onClick={() => {
                                        updateItemForm(
                                          item.id,
                                          "rejectReasons",
                                          currentReasons,
                                        );
                                        updateItemField(item, "rejectReasons");
                                        // Update original after save
                                        setOriginalItemRejectReasons(
                                          (prev) => ({
                                            ...prev,
                                            [item.id]: [...currentReasons],
                                          }),
                                        );
                                      }}
                                      className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                      title="Lưu các lý do"
                                    >
                                      <MdSave className="h-4 w-4" />
                                      Lưu
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
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
                            className="rounded-xl px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-white/10"
                          >
                            Từ chối
                          </button>
                          <button
                            type="button"
                            disabled={updating}
                            onClick={() => updateItemStatus(item, "approved")}
                            className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                          >
                            <MdSave className="h-4 w-4" />
                            Duyệt
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => updateItemStatus(item, "pending")}
                          className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          Đưa về chờ
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add new button */}
              {!draftItem && (
                <button
                  type="button"
                  disabled={loadingDetail || !detail}
                  onClick={() => {
                    setDraftItem({
                      action: "register",
                      subjectName: "",
                      subjectCode: "",
                      className: "",
                      slotInfo: "",
                      isInCurriculum: false,
                    });
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl bg-gray-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
                  title="Thêm lớp mới"
                >
                  <MdAdd className="h-4 w-4" />
                  Thêm mới
                </button>
              )}

              {/* Draft item form */}
              {draftItem && (
                <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-transparent p-4 dark:border-gray-600">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-navy-700 text-base font-medium dark:text-white">
                      Thêm mới
                    </p>
                    <button
                      type="button"
                      disabled={updatingItemIds.has(-1)}
                      onClick={() => setDraftItem(null)}
                      className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Hủy"
                    >
                      <MdClose className="h-4 w-4" />
                      Hủy
                    </button>
                  </div>

                  {/* Item details */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* Lớp HP */}
                    <div className="flex items-center gap-6">
                      <div className="w-32 shrink-0">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                          Lớp HP
                        </p>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={draftItem.className ?? ""}
                          onChange={(e) =>
                            setDraftItem({
                              ...draftItem,
                              className: e.target.value,
                            })
                          }
                          placeholder="Nhập lớp HP"
                          className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                          disabled={updatingItemIds.has(-1)}
                        />
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
                        <input
                          type="text"
                          value={draftItem.slotInfo ?? ""}
                          onChange={(e) =>
                            setDraftItem({
                              ...draftItem,
                              slotInfo: e.target.value,
                            })
                          }
                          placeholder="Nhập thông tin lớp"
                          className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                          disabled={updatingItemIds.has(-1)}
                        />
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
                        <input
                          type="text"
                          value={draftItem.subjectName}
                          onChange={(e) =>
                            setDraftItem({
                              ...draftItem,
                              subjectName: e.target.value,
                            })
                          }
                          placeholder="Nhập tên môn học"
                          className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                          disabled={updatingItemIds.has(-1)}
                        />
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
                        <input
                          type="text"
                          value={draftItem.subjectCode ?? ""}
                          onChange={(e) =>
                            setDraftItem({
                              ...draftItem,
                              subjectCode: e.target.value,
                            })
                          }
                          placeholder="Nhập mã môn học"
                          className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
                          disabled={updatingItemIds.has(-1)}
                        />
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
                          checked={draftItem.isInCurriculum ?? false}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setDraftItem({
                              ...draftItem,
                              isInCurriculum: e.target.checked,
                            })
                          }
                          disabled={updatingItemIds.has(-1)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                    <button
                      type="button"
                      disabled={
                        updatingItemIds.has(-1) || !draftItem.subjectName.trim()
                      }
                      onClick={async () => {
                        if (!detail || !draftItem.subjectName.trim()) {
                          return;
                        }
                        setUpdatingItemIds((prev) => new Set(prev).add(-1));
                        try {
                          const newItem =
                            await classRegistrationItemsService.create(
                              detail.id,
                              draftItem,
                            );
                          const updated = {
                            ...detail,
                            items: [...(detail.items ?? []), newItem],
                          };
                          queryClient.setQueryData(["class-registration", registrationId], updated);
                          onRegistrationChanged(updated);
                          // Reset form và giữ lại để thêm tiếp
                          setDraftItem({
                            action: "register",
                            subjectName: "",
                            subjectCode: "",
                            className: "",
                            slotInfo: "",
                            isInCurriculum: false,
                          });
                          toast.success("Đã thêm lớp mới.");
                        } catch (err: unknown) {
                          const msg =
                            err instanceof Error
                              ? err.message
                              : "Thêm lớp thất bại.";
                          toast.error(msg);
                        } finally {
                          setUpdatingItemIds((prev) => {
                            const next = new Set(prev);
                            next.delete(-1);
                            return next;
                          });
                        }
                      }}
                      className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
                      title="Lưu và thêm mới"
                    >
                      <MdSave className="h-4 w-4" />
                      Lưu và thêm mới
                    </button>
                    <button
                      type="button"
                      disabled={
                        updatingItemIds.has(-1) || !draftItem.subjectName.trim()
                      }
                      onClick={async () => {
                        if (!detail || !draftItem.subjectName.trim()) {
                          return;
                        }
                        setUpdatingItemIds((prev) => new Set(prev).add(-1));
                        try {
                          const newItem =
                            await classRegistrationItemsService.create(
                              detail.id,
                              draftItem,
                            );
                          const updated = {
                            ...detail,
                            items: [...(detail.items ?? []), newItem],
                          };
                          queryClient.setQueryData(["class-registration", registrationId], updated);
                          onRegistrationChanged(updated);
                          setDraftItem(null);
                          toast.success("Đã thêm lớp mới.");
                        } catch (err: unknown) {
                          const msg =
                            err instanceof Error
                              ? err.message
                              : "Thêm lớp thất bại.";
                          toast.error(msg);
                        } finally {
                          setUpdatingItemIds((prev) => {
                            const next = new Set(prev);
                            next.delete(-1);
                            return next;
                          });
                        }
                      }}
                      className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                      title="Lưu"
                    >
                      <MdSave className="h-4 w-4" />
                      Lưu
                    </button>
                  </div>
                </div>
              )}
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
                    Message ID
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {detail.messageId ?? "—"}
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
                    Cập nhật lần cuối
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-navy-700 text-base dark:text-white">
                    {formatDate(detail.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default RegistrationDetailDrawer;
