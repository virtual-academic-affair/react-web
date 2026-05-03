import { CopyableText } from "@/components/copyable/CopyableText";
import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, {
  FormRow,
} from "@/components/layouts/DetailFormLayout";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Tag from "@/components/tag/Tag";
import {
  classRegistrationItemsService,
  classRegistrationsService,
} from "@/services/class-registration";
import type {
  ClassRegistration,
  ClassRegistrationItem,
  CreateClassRegistrationItemDto,
  ItemStatus,
  RegistrationAction,
  UpdateClassRegistrationItemDto,
} from "@/types/classRegistration";
import { ItemStatusColors, ItemStatusLabels } from "@/types/classRegistration";
import {
  coerceMessageStatus,
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/messageStatus";
import { useMutation } from "@tanstack/react-query";
import { Input, message } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdDeleteOutline, MdEdit, MdSave } from "react-icons/md";
import {
  deeplinkBtnPrimary,
  deeplinkBtnSecondary,
} from "./deeplinkButtonClasses";
import DeeplinkPillActionButton from "./DeeplinkPillActionButton";
import RegistrationActionTag from "./RegistrationActionTag";

const itemStatusOptions = (Object.keys(ItemStatusLabels) as ItemStatus[]).map(
  (value) => ({
    value,
    label: ItemStatusLabels[value],
  }),
);

const ITEM_STATUS_HEX: Record<ItemStatus, string> = {
  pending: ItemStatusColors.pending.hex,
  approved: ItemStatusColors.approved.hex,
  rejected: ItemStatusColors.rejected.hex,
};

const ITEM_STATUS_OPTION_COLORS: Record<string, string> = ITEM_STATUS_HEX;

const drawerFormLabelWidth = "min-w-[104px] w-[104px]";
const drawerInputClass =
  "min-h-[42px] w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-navy-800 outline-none transition-colors placeholder:text-gray-400 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-white/10 dark:bg-transparent dark:text-gray-100 dark:placeholder:text-gray-500";

function norm(s: string | undefined | null): string {
  return (s ?? "").trim().toUpperCase();
}

/** Chỉ gộp nhóm khi trùng cả mã môn và tên môn; thiếu một trong hai → mỗi yêu cầu một nhóm. */
function subjectGroupKey(item: ClassRegistrationItem): string {
  const code = norm(item.subjectCode);
  const name = norm(item.subjectName);
  if (code && name) return `${code}\x1e${name}`;
  return `solo:${item.id}`;
}

function coerceItemsArray(
  reg: ClassRegistration,
): (ClassRegistrationItem & Record<string, unknown>)[] {
  const raw = reg.items as unknown;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    return Object.values(raw) as (ClassRegistrationItem &
      Record<string, unknown>)[];
  }
  return [];
}

function normalizeItems(
  reg: ClassRegistration,
): (ClassRegistrationItem & { parentId?: number })[] {
  return coerceItemsArray(reg).map((raw) => {
    const it = raw as ClassRegistrationItem & {
      subject_code?: string;
      subject_name?: string;
      class_name?: string;
    };
    return {
      ...it,
      subjectCode: it.subjectCode ?? it.subject_code,
      subjectName: it.subjectName ?? it.subject_name,
      className: it.className ?? it.class_name,
      classRegistrationId: it.classRegistrationId ?? it.parentId ?? reg.id,
      status: it.status ?? "pending",
    };
  });
}

const registrationNoteTextAreaClass =
  "text-navy-800 resize-none !rounded-none !border-0 bg-transparent px-3 py-2 text-sm leading-snug shadow-none placeholder:text-gray-400 read-only:cursor-default focus:!shadow-none dark:text-gray-100 dark:placeholder:text-gray-500 max-h-[6.5rem] overflow-y-auto";

const RegistrationNoteBlock: React.FC<{
  note: string;
  onNoteChange: (value: string) => void;
  readOnly?: boolean;
}> = ({ note, onNoteChange, readOnly }) => (
  <div className="flex flex-col gap-2">
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-none transition-colors dark:border-white/10 dark:bg-white/[0.03]">
      <Input.TextArea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Ghi chú hồ sơ…"
        autoSize={{ minRows: 3, maxRows: 8 }}
        readOnly={readOnly}
        bordered={false}
        className={registrationNoteTextAreaClass}
      />
    </div>
  </div>
);

interface Props {
  registration: ClassRegistration;
  onChanged: () => void;
}

const DeeplinkClassRegistrationSection: React.FC<Props> = ({
  registration,
  onChanged,
}) => {
  const parentId = registration.id;
  const items = useMemo(() => normalizeItems(registration), [registration]);

  const groups = useMemo(() => {
    const map = new Map<string, ClassRegistrationItem[]>();
    for (const it of items) {
      const k = subjectGroupKey(it);
      const arr = map.get(k) ?? [];
      arr.push(it);
      map.set(k, arr);
    }
    return [...map.entries()].map(([key, groupItems]) => {
      const first = groupItems[0]!;
      const code = first.subjectCode?.trim() ?? "";
      const name = first.subjectName?.trim() ?? "";
      return {
        key,
        subjectCode: code,
        subjectName: name,
        items: groupItems.sort((a, b) => a.id - b.id),
      };
    });
  }, [items]);

  const messageStatusView =
    coerceMessageStatus(registration.messageStatus) ?? "new";
  const canEdit = messageStatusView === "new";

  const [note, setNote] = useState(() => registration.note ?? "");
  const noteBaselineRef = useRef(registration.note ?? "");
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    const n = registration.note ?? "";
    setNote(n);
    noteBaselineRef.current = n;
  }, [parentId, registration.note, registration.updatedAt]);

  const noteDirty = note.trim() !== (noteBaselineRef.current ?? "").trim();

  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteRegConfirmOpen, setDeleteRegConfirmOpen] = useState(false);
  const [deleteItemConfirmOpen, setDeleteItemConfirmOpen] = useState(false);
  const [revertStatusConfirmOpen, setRevertStatusConfirmOpen] = useState(false);
  const [pendingReplyWarningOpen, setPendingReplyWarningOpen] = useState(false);
  const pendingReplyFnRef = useRef<(() => void) | null>(null);
  const [formAction, setFormAction] = useState<RegistrationAction>("register");
  const [formSubjectCode, setFormSubjectCode] = useState("");
  const [formSubjectName, setFormSubjectName] = useState("");
  const [formClassName, setFormClassName] = useState("");
  const [formItemStatus, setFormItemStatus] = useState<ItemStatus>("pending");

  const openAdd = () => {
    setEditingId(null);
    setFormAction("register");
    setFormSubjectCode("");
    setFormSubjectName("");
    setFormClassName("");
    setFormItemStatus("pending");
    setItemDrawerOpen(true);
  };

  const openEdit = (it: ClassRegistrationItem) => {
    setEditingId(it.id);
    setFormAction(it.action);
    setFormSubjectCode(it.subjectCode ?? "");
    setFormSubjectName(it.subjectName ?? "");
    setFormClassName(it.className ?? "");
    setFormItemStatus(it.status ?? "pending");
    setItemDrawerOpen(true);
  };

  const closeItemDrawer = () => {
    setItemDrawerOpen(false);
    setDeleteItemConfirmOpen(false);
    setEditingId(null);
    setFormAction("register");
    setFormSubjectCode("");
    setFormSubjectName("");
    setFormClassName("");
    setFormItemStatus("pending");
  };

  useEffect(() => {
    if (canEdit) return;
    setItemDrawerOpen(false);
    setDeleteItemConfirmOpen(false);
    setEditingId(null);
    setFormAction("register");
    setFormSubjectCode("");
    setFormSubjectName("");
    setFormClassName("");
    setFormItemStatus("pending");
  }, [canEdit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const subjectName = formSubjectName.trim() || "—";
      const subjectCode = formSubjectCode.trim() || undefined;
      const className = formClassName.trim() || undefined;
      if (editingId == null) {
        const createDto: CreateClassRegistrationItemDto = {
          action: formAction,
          subjectName,
          subjectCode,
          className,
        };
        await classRegistrationItemsService.create(parentId, createDto);
      } else {
        const updateDto: UpdateClassRegistrationItemDto =
          formAction === "requestOpen"
            ? { action: formAction, subjectName, subjectCode, className }
            : {
                action: formAction,
                subjectName,
                subjectCode,
                className,
                status: formItemStatus,
              };
        await classRegistrationItemsService.update(
          parentId,
          editingId,
          updateDto,
        );
      }
    },
    onSuccess: () => {
      void message.success(
        editingId == null ? "Đã thêm yêu cầu" : "Đã cập nhật yêu cầu",
      );
      closeItemDrawer();
      onChanged();
    },
    onError: () => {
      void message.error("Không lưu được. Thử lại.");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await classRegistrationItemsService.remove(parentId, itemId);
    },
    onSuccess: () => {
      void message.success("Đã xóa yêu cầu");
      closeItemDrawer();
      onChanged();
    },
    onError: () => void message.error("Không xóa được yêu cầu."),
  });

  const deleteRegMutation = useMutation({
    mutationFn: async () => {
      await classRegistrationsService.remove(parentId);
    },
    onSuccess: () => {
      void message.success("Đã xóa hồ sơ đăng ký lớp");
      onChanged();
    },
    onError: () => void message.error("Không xóa được hồ sơ."),
  });

  /** Còn yêu cầu chờ duyệt — cảnh báo khi gửi phản hồi (không đổi trạng thái yêu cầu từ nút Duyệt hồ sơ). */
  const hasPendingItems = useMemo(
    () =>
      items.some((i) => i.action !== "requestOpen" && i.status === "pending"),
    [items],
  );

  const sendReplyOnlyMutation = useMutation({
    mutationFn: () =>
      classRegistrationsService.replyWithDefaultPreview(parentId),
    onSuccess: () => {
      void message.success("Đã gửi phản hồi.");
      onChanged();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Gửi phản hồi thất bại.";
      void message.error(msg);
    },
  });

  const registrationMessageStatusMutation = useMutation({
    mutationFn: async (next: "staged" | "new") => {
      await classRegistrationsService.update(parentId, {
        messageStatus: next,
      });
    },
    onSuccess: (_data, next) => {
      void message.success(
        next === "staged" ? "Đã duyệt hồ sơ." : "Đã hoàn tác về.",
      );
      onChanged();
    },
    onError: () => void message.error("Không cập nhật được trạng thái hồ sơ."),
  });

  const footerActionsBusy =
    deleteRegMutation.isPending ||
    sendReplyOnlyMutation.isPending ||
    registrationMessageStatusMutation.isPending;

  const updateItemStatusMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: number; status: ItemStatus }) =>
      classRegistrationItemsService.update(parentId, itemId, { status }),
    onSuccess: () => {
      onChanged();
    },
    onError: () =>
      void message.error("Không cập nhật được trạng thái yêu cầu."),
  });

  const runWithPendingReplyWarning = (fn: () => void) => {
    if (!hasPendingItems) {
      fn();
      return;
    }
    pendingReplyFnRef.current = fn;
    setPendingReplyWarningOpen(true);
  };

  const saveRegistrationNote = useCallback(async () => {
    setNoteSaving(true);
    try {
      await classRegistrationsService.update(parentId, {
        note: note.trim() === "" ? undefined : note,
      });
      noteBaselineRef.current = note;
      void message.success("Đã lưu ghi chú");
      onChanged();
    } catch {
      void message.error("Không lưu được ghi chú.");
    } finally {
      setNoteSaving(false);
    }
  }, [parentId, note, onChanged]);

  const pillRowBtnSecondary =
    `${deeplinkBtnSecondary} min-w-0 flex-1 justify-center !rounded-full px-1 text-xs font-medium`.trim();
  const pillRowBtnPrimary =
    `${deeplinkBtnPrimary} min-w-0 flex-1 justify-center !rounded-full px-1 text-xs font-medium`.trim();
  const rowIconBtnClass =
    "text-brand-600 dark:text-brand-400 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 active:scale-95 dark:hover:bg-white/10";
  const headerDeleteIconBtnClass =
    "text-red-600 dark:text-red-400 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-50 active:scale-95 dark:hover:bg-red-950/40";

  return (
    <section className="dark:bg-navy-950/40 rounded-2xl bg-white p-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="border-brand-500 flex min-w-0 flex-1 items-center gap-2 border-l-4 pl-3">
            <h2 className="text-navy-900 min-w-0 text-base font-bold tracking-tight uppercase dark:text-white">
              Đăng ký lớp
            </h2>
            <button
              type="button"
              aria-label="Xóa hồ sơ đăng ký lớp"
              disabled={footerActionsBusy}
              className={headerDeleteIconBtnClass}
              onClick={() => setDeleteRegConfirmOpen(true)}
            >
              {canEdit && !noteDirty ? (
                <MdDeleteOutline className="h-4 w-4" />
              ) : null}
            </button>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Tag
              color={MessageStatusColors[messageStatusView].hex}
              interactive={false}
              className="shrink-0"
            >
              {MessageStatusLabels[messageStatusView]}
            </Tag>
            {canEdit ? (
              <button
                type="button"
                className="text-brand-600 dark:text-brand-400 mb-1 w-full cursor-pointer border-0 bg-transparent p-0 text-right text-xs font-medium italic underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                onClick={openAdd}
              >
                Thêm yêu cầu
              </button>
            ) : (
              <div className="h-2" />
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col">
        {groups.map((g) => (
          <div key={g.key} className="py-2">
            <div className="text-navy-900 flex w-full min-w-0 flex-nowrap items-baseline overflow-hidden text-sm leading-snug font-semibold">
              {g.subjectCode ? (
                <CopyableText
                  text={g.subjectCode}
                  variant="field"
                  className="text-sm font-medium"
                />
              ) : null}
              {g.subjectCode && g.subjectName ? (
                <span
                  className="mx-1 shrink-0 text-sm font-normal text-gray-400 dark:text-gray-500"
                  aria-hidden
                >
                  -
                </span>
              ) : null}
              {g.subjectName ? (
                <span className="min-w-0 flex-1 overflow-hidden">
                  <CopyableText
                    text={g.subjectName}
                    variant="field"
                    className="min-w-0 truncate text-sm font-medium"
                  />
                </span>
              ) : null}
              {!g.subjectCode && !g.subjectName ? (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  —
                </span>
              ) : null}
            </div>
            <ul>
              {g.items.map((it) => {
                const classText = it.className?.trim() ?? "";
                const statusBusy =
                  updateItemStatusMutation.isPending &&
                  updateItemStatusMutation.variables?.itemId === it.id;
                return (
                  <li
                    key={it.id}
                    className="flex min-h-10 min-w-0 items-center gap-2"
                  >
                    <div className="flex min-w-[70px] shrink-0 items-center">
                      <RegistrationActionTag value={it.action} />
                    </div>
                    <div className="flex min-w-0 flex-1 items-center overflow-hidden">
                      <span className="inline-flex max-w-full min-w-0 items-center gap-1">
                        {it.action !== "requestOpen" ? (
                          <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            <CopyableText
                              text={classText}
                              variant="field"
                              className="text-sm font-medium"
                            />
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                        {canEdit ? (
                          <button
                            type="button"
                            aria-label="Sửa"
                            className={rowIconBtnClass}
                            onClick={() => openEdit(it)}
                          >
                            <MdEdit className="h-4 w-4" />
                          </button>
                        ) : null}
                      </span>
                    </div>
                    {it.action !== "requestOpen" ? (
                      canEdit ? (
                        <Tag
                          variant="selection"
                          value={it.status}
                          color={ITEM_STATUS_HEX[it.status]}
                          options={itemStatusOptions}
                          optionColors={ITEM_STATUS_HEX}
                          disabled={statusBusy}
                          className="shrink-0"
                          onChange={(v) =>
                            void updateItemStatusMutation.mutate({
                              itemId: it.id,
                              status: v as ItemStatus,
                            })
                          }
                        >
                          {ItemStatusLabels[it.status]}
                        </Tag>
                      ) : (
                        <Tag
                          variant="selection"
                          value={it.status}
                          color={ITEM_STATUS_HEX[it.status]}
                          interactive={false}
                          className="shrink-0"
                        >
                          {ItemStatusLabels[it.status]}
                        </Tag>
                      )
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Chưa có yêu cầu đăng ký trong hồ sơ này.
          </p>
        ) : null}
      </div>

      <footer className="flex flex-col gap-3">
        <RegistrationNoteBlock
          note={note}
          onNoteChange={setNote}
          readOnly={!canEdit}
        />
        {canEdit ? (
          noteDirty ? (
            <div className="flex w-full gap-3">
              <button
                type="button"
                className={pillRowBtnSecondary}
                disabled={noteSaving}
                onClick={() => setNote(noteBaselineRef.current)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={pillRowBtnPrimary}
                disabled={noteSaving}
                onClick={() => void saveRegistrationNote()}
              >
                <MdSave className="h-4 w-4" />
                {noteSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          ) : (
            <div className="flex w-full gap-3">
              <DeeplinkPillActionButton
                variant="secondary"
                disabled={footerActionsBusy || items.length === 0}
                onClick={() =>
                  runWithPendingReplyWarning(
                    () => void sendReplyOnlyMutation.mutate(),
                  )
                }
                label={
                  sendReplyOnlyMutation.isPending
                    ? "Đang gửi…"
                    : "Phản hồi ngay"
                }
              />
              <DeeplinkPillActionButton
                variant="primary"
                disabled={footerActionsBusy || items.length === 0}
                onClick={() =>
                  void registrationMessageStatusMutation.mutate("staged")
                }
                label={
                  registrationMessageStatusMutation.isPending
                    ? "Đang duyệt…"
                    : "Duyệt hồ sơ"
                }
              />
            </div>
          )
        ) : (
          <div className="flex w-full gap-3">
            <button
              type="button"
              className={`${pillRowBtnPrimary} w-full`}
              disabled={footerActionsBusy}
              onClick={() => setRevertStatusConfirmOpen(true)}
            >
              Hoàn tác
            </button>
          </div>
        )}
      </footer>

      <Drawer
        isOpen={itemDrawerOpen}
        onClose={closeItemDrawer}
        title={editingId == null ? "Thêm yêu cầu" : "Sửa yêu cầu"}
        width="max-w-lg"
        footerLeft={
          editingId != null ? (
            <button
              type="button"
              aria-label="Xóa yêu cầu"
              disabled={deleteItemMutation.isPending || saveMutation.isPending}
              onClick={() => setDeleteItemConfirmOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
            >
              <MdDeleteOutline className="h-4 w-4" />
            </button>
          ) : undefined
        }
      >
        <DetailFormLayout className="gap-5">
          <FormRow
            label="Loại"
            labelWidthClassName={drawerFormLabelWidth}
            dense
          >
            <RegistrationActionTag
              value={formAction}
              onChange={setFormAction}
              className="w-fit shrink-0"
            />
          </FormRow>
          <FormRow
            label="Mã môn"
            labelWidthClassName={drawerFormLabelWidth}
            dense
          >
            <input
              type="text"
              value={formSubjectCode}
              onChange={(e) => setFormSubjectCode(e.target.value)}
              placeholder="VD: CS101"
              className={drawerInputClass}
            />
          </FormRow>
          <FormRow
            label="Tên môn"
            labelWidthClassName={drawerFormLabelWidth}
            dense
          >
            <input
              type="text"
              value={formSubjectName}
              onChange={(e) => setFormSubjectName(e.target.value)}
              placeholder="VD: Giải tích 1"
              className={drawerInputClass}
            />
          </FormRow>
          <FormRow
            label="Tên lớp"
            labelWidthClassName={drawerFormLabelWidth}
            dense
          >
            <input
              type="text"
              value={formClassName}
              onChange={(e) => setFormClassName(e.target.value)}
              placeholder="VD: 22CLC01"
              className={drawerInputClass}
            />
          </FormRow>
          {editingId != null && formAction !== "requestOpen" ? (
            <FormRow
              label="Trạng thái"
              labelWidthClassName={drawerFormLabelWidth}
              dense
            >
              <Tag
                variant="selection"
                value={formItemStatus}
                color={ITEM_STATUS_HEX[formItemStatus]}
                options={itemStatusOptions}
                optionColors={ITEM_STATUS_OPTION_COLORS}
                className="w-fit shrink-0"
                onChange={(v) => setFormItemStatus(v as ItemStatus)}
              >
                {ItemStatusLabels[formItemStatus]}
              </Tag>
            </FormRow>
          ) : null}
        </DetailFormLayout>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={closeItemDrawer}
            className="rounded-xl px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => void saveMutation.mutate()}
            className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            <MdSave className="h-4 w-4" />
            {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </Drawer>

      <ConfirmModal
        open={deleteRegConfirmOpen}
        onCancel={() => setDeleteRegConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await deleteRegMutation.mutateAsync();
            setDeleteRegConfirmOpen(false);
          } catch {
            /* toast trong mutation */
          }
        }}
        title="Xóa toàn bộ hồ sơ đăng ký lớp?"
        subTitle="Xác nhận xóa dữ liệu này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        loading={deleteRegMutation.isPending}
      />

      <ConfirmModal
        open={revertStatusConfirmOpen}
        onCancel={() => setRevertStatusConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await registrationMessageStatusMutation.mutateAsync("new");
            setRevertStatusConfirmOpen(false);
          } catch {
            /* toast trong mutation */
          }
        }}
        title="Hoàn tác trạng thái hồ sơ?"
        subTitle="Đưa hồ sơ về trạng thái Mới để chỉnh sửa lại. Xác nhận hoàn tác?"
        confirmText="Hoàn tác"
        cancelText="Hủy"
        loading={registrationMessageStatusMutation.isPending}
        danger={false}
        icon="warning"
      />

      <ConfirmModal
        open={deleteItemConfirmOpen}
        onCancel={() => setDeleteItemConfirmOpen(false)}
        onConfirm={async () => {
          if (editingId == null) return;
          try {
            await deleteItemMutation.mutateAsync(editingId);
            setDeleteItemConfirmOpen(false);
          } catch {
            /* toast trong mutation */
          }
        }}
        title="Xóa yêu cầu này?"
        subTitle="Xác nhận xóa dữ liệu này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        loading={deleteItemMutation.isPending}
      />

      <ConfirmModal
        open={pendingReplyWarningOpen}
        onCancel={() => {
          pendingReplyFnRef.current = null;
          setPendingReplyWarningOpen(false);
        }}
        onConfirm={() => {
          pendingReplyFnRef.current?.();
          pendingReplyFnRef.current = null;
          setPendingReplyWarningOpen(false);
        }}
        title="Còn yêu cầu đang chờ duyệt"
        subTitle="Xác nhận gửi phản hồi? Còn yêu cầu đang chờ duyệt."
        confirmText="Gửi"
        danger={false}
        icon="warning"
      />
    </section>
  );
};

export default DeeplinkClassRegistrationSection;
