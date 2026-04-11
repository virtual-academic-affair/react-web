import {
  DetailLinkedEmailDrawer,
  DetailLinkedMessageSwitch,
} from "@/components/detail/DetailLinkedEmailDrawer";
import Drawer from "@/components/drawer/Drawer";
import { type RichTextEditorHandle } from "@/components/fields/RichTextEditor";
import MessageStatusSelector from "@/components/selector/MessageStatusSelector";
import Switch from "@/components/switch";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip.tsx";
import { useClassRegistrationShowOnlyPendingItems } from "@/hooks/useClassRegistrationShowOnlyPendingItems";
import {
  resolveLinkedMessageId,
  useDetailLinkedMessagePanel,
} from "@/hooks/useDetailLinkedMessagePanel";
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
  UpdateClassRegistrationItemDto,
} from "@/types/classRegistration";
import {
  ItemStatusColors,
  ItemStatusLabels,
  RegistrationActionColors,
  RegistrationActionLabels,
  RegistrationActionOptions,
  type UpdateClassRegistrationDto,
} from "@/types/classRegistration";
import { formatDate } from "@/utils/date";
import { plainTextFromHtml } from "@/utils/html";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdOutlineRateReview,
  MdSave,
  MdSend,
  MdUndo,
} from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import RegistrationNoteRichTextEditor from "./RegistrationNoteRichTextEditor";

/** Tránh hiện Hủy/Lưu khi Tiptap chuẩn hóa HTML (vd. "" ↔ &lt;p&gt;&lt;/p&gt;) nhưng nội dung không đổi. */
function isItemNoteDirty(
  note: string,
  originalNote: string | undefined,
): boolean {
  return plainTextFromHtml(note) !== plainTextFromHtml(originalNote ?? "");
}

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
  const noteEditorRef = React.useRef<RichTextEditorHandle>(null);
  const initializedIdRef = React.useRef<number | null>(null);

  const { data: detail = null, isLoading: loadingDetail } = useQuery({
    queryKey: ["class-registration", registrationId],
    queryFn: () => classRegistrationsService.getById(registrationId!),
    enabled: registrationId != null,
    staleTime: 30 * 1000,
  });

  const { data: cancelReasonsData } = useQuery({
    queryKey: ["cancel-reasons", "suggestion"],
    queryFn: () => cancelReasonsService.getList({ isActive: true, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const cancelReasonSuggestionItems = React.useMemo(
    () =>
      (cancelReasonsData?.items ?? []).map((r) => ({
        id: String(r.id),
        label: plainTextFromHtml(r.content) || `#${r.id}`,
        insertHtml: r.content,
      })),
    [cancelReasonsData],
  );

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
    Record<number, { note: string; isInCurriculum: boolean }>
  >({});
  const [originalItemNotes, setOriginalItemNotes] = React.useState<
    Record<number, string>
  >({});
  const [draftItem, setDraftItem] =
    React.useState<CreateClassRegistrationItemDto | null>(null);
  const [showOnlyPendingItems, setShowOnlyPendingItems] =
    useClassRegistrationShowOnlyPendingItems();
  const [sendingReply, setSendingReply] = React.useState(false);

  const visibleItems = React.useMemo(() => {
    const items = detail?.items ?? [];
    if (!showOnlyPendingItems) return items;
    return items.filter((i) => i.status === "pending");
  }, [detail?.items, showOnlyPendingItems]);

  const itemPendingStats = React.useMemo(() => {
    const items = detail?.items ?? [];
    return {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
    };
  }, [detail?.items]);

  React.useEffect(() => {
    if (!detail) {
      setForm(null);
      setItemForms({});
      setOriginalItemNotes({});
      setDraftItem(null);
      initializedIdRef.current = null;
      return;
    }

    // Only do a full reset when opening a new registration, not on every cache update
    if (initializedIdRef.current === detail.id) return;
    initializedIdRef.current = detail.id;

    setForm({
      studentCode: detail.studentCode,
      studentName: detail.studentName,
      academicYear: String(detail.academicYear),
      note: detail.note ?? "",
      messageStatus: detail.messageStatus ?? null,
    });
    const forms: Record<number, { note: string; isInCurriculum: boolean }> = {};
    const original: Record<number, string> = {};
    (detail.items ?? []).forEach((item) => {
      forms[item.id] = {
        note: item.note ?? "",
        isInCurriculum: item.isInCurriculum ?? false,
      };
      original[item.id] = item.note ?? "";
    });
    setItemForms(forms);
    setOriginalItemNotes(original);
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
        noteEditorRef.current?.focus();
      }, 100);
    }
  }, [searchParams, form, setSearchParams]);

  const handleSendAndClose = async () => {
    if (!detail) return;
    setSendingReply(true);
    try {
      await classRegistrationsService.replyWithDefaultPreview(detail.id, true);
      toast.success("Đã gửi phản hồi và đóng.");
      queryClient.invalidateQueries({ queryKey: ["class-registrations"] });
      queryClient.invalidateQueries({
        queryKey: ["class-registration", detail.id],
      });
      onRegistrationChanged({
        ...detail,
        messageStatus: "closed",
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gửi phản hồi thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSendingReply(false);
    }
  };

  const updateItemStatus = async (
    item: ClassRegistrationItem,
    status: ItemStatus,
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
          note: itemForm?.note,
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
            : prev,
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
    field: "isInCurriculum" | "note",
  ) => {
    if (!detail) {
      return;
    }

    setUpdatingItemIds((prev) => new Set(prev).add(item.id));
    try {
      const itemForm = itemForms[item.id];
      const dto: UpdateClassRegistrationItemDto = {
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
            : prev,
      );

      setItemForms((prev) => ({
        ...prev,
        [item.id]: {
          note: updated.note ?? "",
          isInCurriculum: updated.isInCurriculum ?? false,
        },
      }));
      setOriginalItemNotes((prev) => ({
        ...prev,
        [item.id]: updated.note ?? "",
      }));
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
    await updateItemStatus(item, "rejected");
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
    field: "note" | "isInCurriculum",
    value: string | boolean,
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
    const forms: Record<number, { note: string; isInCurriculum: boolean }> = {};
    (detail.items ?? []).forEach((item) => {
      forms[item.id] = {
        note: item.note ?? "",
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
      plainTextFromHtml(form.note) !== plainTextFromHtml(detail.note ?? "") ||
      form.messageStatus !== (detail.messageStatus ?? null)
    );
  }, [detail, form]);

  const isOpen = registrationId != null;

  const footerLeft = detail && (
    <>
      <Tooltip label="Xem trước phản hồi">
        <button
          type="button"
          onClick={() => {
            if (detail) onPreviewReply?.(detail.id);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <MdOutlineRateReview className="h-4 w-4" />
        </button>
      </Tooltip>
      <Tooltip label="Gửi và đóng">
        <button
          type="button"
          disabled={sendingReply}
          onClick={handleSendAndClose}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-white transition-colors hover:bg-teal-600 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
        >
          <MdSend className="h-4 w-4" />
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

  const linkedMid = detail ? resolveLinkedMessageId(detail.messageId) : null;
  const [linkedPanelOpen] = useDetailLinkedMessagePanel();
  const bothDrawersOpen = linkedMid != null && linkedPanelOpen;

  return (
    <>
      <DetailLinkedEmailDrawer parentOpen={isOpen} messageId={linkedMid} />
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết đăng ký lớp"
        headerExtra={
          linkedMid != null ? <DetailLinkedMessageSwitch /> : undefined
        }
        footerLeft={footerLeft}
        footerRight={footerRight}
        width={bothDrawersOpen ? "max-w-[calc(50vw-36px)]" : "max-w-4xl"}
      >
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
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-6">
                <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    MSSV
                  </p>
                </div>
                <div className="w-full flex-1">
                  <input
                    value={form.studentCode}
                    onChange={(e) =>
                      handleFieldChange("studentCode", e.target.value)
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-6">
                <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Họ tên
                  </p>
                </div>
                <div className="w-full flex-1">
                  <input
                    value={form.studentName}
                    onChange={(e) =>
                      handleFieldChange("studentName", e.target.value)
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 outline-none dark:border-white/10 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-6">
                <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Năm học
                  </p>
                </div>
                <div className="w-full flex-1">
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
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-6">
                <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Trạng thái xử lý
                  </p>
                </div>
                <div className="w-full flex-1">
                  <MessageStatusSelector
                    value={form.messageStatus}
                    onChange={handleMessageStatusChange}
                    disabled={savingInfo}
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-start md:gap-6">
                <div className="w-full shrink-0 md:w-40">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                    Ghi chú
                  </p>
                </div>
                <div className="w-full flex-1">
                  <RegistrationNoteRichTextEditor
                    ref={noteEditorRef}
                    value={form.note}
                    onChange={(html) => handleFieldChange("note", html)}
                    suggestionItems={cancelReasonSuggestionItems}
                    placeholder="Gõ @ để chèn ghi chú nhanh"
                  />
                </div>
              </div>
            </div>

            {/* Child items - kết quả đăng ký */}
            <div className="mt-2 border-t border-gray-100 pt-4 dark:border-white/10">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-navy-700 text-xs font-semibold tracking-wide uppercase dark:text-white">
                  Danh sách đăng ký
                </p>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>{`Chỉ hiện yêu cầu chưa giải quyết (${itemPendingStats.pending}/${itemPendingStats.total})`}</span>
                  <Switch
                    checked={showOnlyPendingItems}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setShowOnlyPendingItems(e.target.checked)
                    }
                  />
                </label>
              </div>
              <div className="flex flex-col gap-4">
                {visibleItems.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {showOnlyPendingItems
                      ? "Không có lớp nào đang chờ xử lý."
                      : "Chưa có dòng đăng ký."}
                  </p>
                ) : null}
                {visibleItems.map((item) => {
                  const updating = updatingItemIds.has(item.id);
                  const itemForm = itemForms[item.id] ?? {
                    note: item.note ?? "",
                    isInCurriculum: item.isInCurriculum ?? false,
                  };
                  return (
                    <div
                      key={item.id}
                      className={`rounded-3xl bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5`}
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
                        {/* Loại yêu cầu */}
                        <div className="flex items-center gap-6">
                          <div className="w-32 shrink-0">
                            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                              Loại yêu cầu
                            </p>
                          </div>
                          <div className="flex-1">
                            <Tag
                              color={RegistrationActionColors[item.action].hex}
                            >
                              {RegistrationActionLabels[item.action]}
                            </Tag>
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
                            <Tag color={ItemStatusColors[item.status].hex}>
                              {ItemStatusLabels[item.status]}
                            </Tag>
                          </div>
                        </div>
                      </div>

                      {/* Ghi chú */}
                      <div className="mt-3">
                        <div className="flex flex-col items-start gap-6 md:flex-row">
                          <div className="w-32 shrink-0">
                            <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                              Ghi chú
                            </p>
                          </div>
                          <div className="flex-1">
                            <RegistrationNoteRichTextEditor
                              value={itemForm.note}
                              onChange={(html) =>
                                updateItemForm(item.id, "note", html)
                              }
                              disabled={updating}
                              suggestionItems={cancelReasonSuggestionItems}
                              placeholder="Gõ @ để chèn ghi chú nhanh"
                            />
                            {isItemNoteDirty(
                              itemForm.note,
                              originalItemNotes[item.id],
                            ) && (
                              <div className="mt-2 flex items-center gap-2">
                                <Tooltip label="Hủy thay đổi">
                                  <button
                                    type="button"
                                    disabled={updating}
                                    onClick={() =>
                                      updateItemForm(
                                        item.id,
                                        "note",
                                        originalItemNotes[item.id] ?? "",
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                                  >
                                    <MdUndo className="h-4 w-4" />
                                  </button>
                                </Tooltip>
                                <button
                                  type="button"
                                  disabled={updating}
                                  onClick={() => updateItemField(item, "note")}
                                  className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                >
                                  <MdSave className="h-4 w-4" />
                                  Lưu
                                </button>
                              </div>
                            )}
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
                    className="bg-brand-500 hover:bg-brand-600 flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 dark:bg-white/5"
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
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                              setDraftItem({
                                ...draftItem,
                                isInCurriculum: e.target.checked,
                              })
                            }
                            disabled={updatingItemIds.has(-1)}
                          />
                        </div>
                      </div>

                      {/* Loại yêu cầu */}

                      <div className="flex items-center gap-6">
                        <div className="w-32 shrink-0">
                          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                            Loại yêu cầu
                          </p>
                        </div>
                        <div className="flex-1">
                          <Tag
                            variant="selection"
                            color={
                              RegistrationActionColors[draftItem.action].hex
                            }
                            value={draftItem.action}
                            options={RegistrationActionOptions}
                            disabled={updatingItemIds.has(-1)}
                            onChange={(value) =>
                              setDraftItem({
                                ...draftItem,
                                action: value as typeof draftItem.action,
                              })
                            }
                          >
                            {RegistrationActionLabels[draftItem.action]}
                          </Tag>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
                      <button
                        type="button"
                        disabled={
                          updatingItemIds.has(-1) ||
                          !draftItem.subjectName.trim()
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
                            queryClient.setQueryData(
                              ["class-registration", registrationId],
                              updated,
                            );
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
                          updatingItemIds.has(-1) ||
                          !draftItem.subjectName.trim()
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
                            queryClient.setQueryData(
                              ["class-registration", registrationId],
                              updated,
                            );
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
    </>
  );
};

export default RegistrationDetailDrawer;
