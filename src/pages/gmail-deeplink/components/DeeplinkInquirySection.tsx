import ConfirmModal from "@/components/modal/ConfirmModal";
import Tag from "@/components/tag/Tag";
import Tooltip from "@/components/tooltip/Tooltip.tsx";
import InquiryReplyRichTextEditor from "@/pages/inquiry/inquiries/components/InquiryReplyRichTextEditor";
import { inquiriesService } from "@/services/inquiry";
import {
  InquiryTypeColors,
  InquiryTypeLabels,
  type Inquiry,
  type InquiryType,
} from "@/types/inquiry";
import {
  coerceMessageStatus,
  MessageStatusColors,
  MessageStatusLabels,
} from "@/types/messageStatus";
import { useMutation } from "@tanstack/react-query";
import { Input, message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { MdDeleteOutline, MdSave } from "react-icons/md";
import DeeplinkPillActionButton from "./DeeplinkPillActionButton";
import {
  deeplinkBtnPrimary,
  deeplinkBtnSecondary,
} from "./deeplinkButtonClasses";

const AUTOSAVE_DELAY_MS = 10_000;
const INQUIRY_TYPE_TAG_NEUTRAL_HEX = "#94a3b8";

function stripHtml(html: string): string {
  if (!html?.trim()) return "";
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || d.innerText || "").trim();
}

function normalizeTypes(
  types: InquiryType[] | undefined | null,
): InquiryType[] {
  if (!types?.length) return [];
  return [...types].sort();
}

function typesEqual(a: InquiryType[], b: InquiryType[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort().join("\0");
  const sb = [...b].sort().join("\0");
  return sa === sb;
}

function inquiryBodyDirty(
  question: string,
  answer: string,
  types: InquiryType[],
  last: { question: string; answer: string; types: InquiryType[] },
): boolean {
  return (
    question.trim() !== last.question.trim() ||
    (answer.trim() || "") !== (last.answer.trim() || "") ||
    !typesEqual(types, last.types)
  );
}

/** ~2 dòng mặc định, tối đa ~4 dòng rồi cuộn (text-sm ~leading-snug). */
const deeplinkCompactPlainTextAreaClass =
  "text-navy-800 resize-none !rounded-none !border-0 bg-transparent px-3 py-2 text-sm leading-snug shadow-none placeholder:text-gray-400 focus:!shadow-none read-only:cursor-default dark:text-gray-100 dark:placeholder:text-gray-500 max-h-[6.5rem] overflow-y-auto";

interface Props {
  inquiry: Inquiry;
  onChanged: () => void;
}

const DeeplinkInquirySection: React.FC<Props> = ({ inquiry, onChanged }) => {
  const inquiryId = inquiry.id;
  const messageStatusView = coerceMessageStatus(inquiry.messageStatus) ?? "new";
  const isReplied = messageStatusView === "replied";

  const [question, setQuestion] = useState(() =>
    stripHtml(inquiry.question ?? ""),
  );
  const [answer, setAnswer] = useState(() => inquiry.answer ?? "");
  const [types, setTypes] = useState<InquiryType[]>(() =>
    normalizeTypes(inquiry.types),
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  const lastPersistedRef = useRef({
    question: stripHtml(inquiry.question ?? ""),
    answer: inquiry.answer ?? "",
    types: normalizeTypes(inquiry.types),
  });
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  useEffect(() => {
    const q = stripHtml(inquiry.question ?? "");
    const a = inquiry.answer ?? "";
    const ty = normalizeTypes(inquiry.types);
    setQuestion(q);
    setAnswer(a);
    setTypes(ty);
    lastPersistedRef.current = { question: q, answer: a, types: ty };
  }, [
    inquiryId,
    inquiry.question,
    inquiry.answer,
    inquiry.types,
    inquiry.updatedAt,
  ]);

  const persist = useCallback(
    async (quiet: boolean) => {
      const last = lastPersistedRef.current;
      const q = question.trim();
      const a = answer.trim();
      const ty = types;
      if (!inquiryBodyDirty(question, answer, types, last)) return;

      setAutoSaving(true);
      try {
        const data = await inquiriesService.update(inquiryId, {
          question: q,
          answer: a || undefined,
          types: ty,
        });
        const nq = stripHtml(data.question ?? "");
        const na = data.answer ?? "";
        const nty = normalizeTypes(data.types);
        setQuestion(nq);
        setAnswer(na);
        setTypes(nty);
        lastPersistedRef.current = {
          question: nq,
          answer: na,
          types: nty,
        };
        onChangedRef.current();
        if (!quiet) void message.success("Đã lưu thắc mắc");
      } catch {
        void message.error("Không lưu được.");
      } finally {
        setAutoSaving(false);
      }
    },
    [inquiryId, question, answer, types],
  );

  /** Vấn đề hoặc phản hồi khác bản đã lưu → Hủy/Lưu thay cho 3 nút. */
  const contentManualDirty =
    !isReplied &&
    (question.trim() !== lastPersistedRef.current.question.trim() ||
      (answer.trim() || "") !== (lastPersistedRef.current.answer.trim() || ""));

  useEffect(() => {
    if (isReplied) return;
    if (contentManualDirty) return;
    const last = lastPersistedRef.current;
    if (typesEqual(types, last.types)) return;

    const timeoutId = window.setTimeout(() => {
      void persist(true);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [question, types, answer, contentManualDirty, persist, isReplied]);

  const toggleType = (t: InquiryType) => {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await inquiriesService.remove(inquiryId);
    },
    onSuccess: () => {
      void message.success("Đã xóa thắc mắc");
      setDeleteConfirmOpen(false);
      onChanged();
    },
    onError: () => void message.error("Không xóa được."),
  });

  const sendReplyOnlyMutation = useMutation({
    mutationFn: () => inquiriesService.replyWithDefaultPreview(inquiryId),
    onSuccess: () => {
      void message.success("Đã gửi phản hồi.");
      onChanged();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Gửi phản hồi thất bại.";
      void message.error(msg);
    },
  });

  const inquiryMessageStatusMutation = useMutation({
    mutationFn: async (next: "staged" | "new") => {
      await inquiriesService.update(inquiryId, { messageStatus: next });
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
    deleteMutation.isPending ||
    sendReplyOnlyMutation.isPending ||
    inquiryMessageStatusMutation.isPending;

  const replyActionsBusy = autoSaving;

  const pillRowBtnSecondary =
    `${deeplinkBtnSecondary} min-w-0 flex-1 justify-center !rounded-full px-1 text-xs font-medium`.trim();
  const pillRowBtnPrimary =
    `${deeplinkBtnPrimary} min-w-0 flex-1 justify-center !rounded-full px-1 text-xs font-medium`.trim();
  const headerDeleteIconBtnClass =
    "text-red-600 dark:text-red-400 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-50 active:scale-95 dark:hover:bg-red-950/40";

  return (
    <section className="dark:bg-navy-950/40 rounded-2xl bg-white p-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="border-brand-500 flex min-w-0 flex-1 items-center gap-2 border-l-4 pl-3">
            <h2 className="text-navy-900 min-w-0 text-base font-bold tracking-tight uppercase dark:text-white">
              Thắc mắc
            </h2>
            {!isReplied && !contentManualDirty ? (
              <Tooltip label="Xóa thắc mắc">
                <button
                  type="button"
                  aria-label="Xóa thắc mắc"
                  disabled={footerActionsBusy}
                  className={headerDeleteIconBtnClass}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <MdDeleteOutline className="h-4 w-4" />
                </button>
              </Tooltip>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Tag
              color={MessageStatusColors[messageStatusView].hex}
              interactive={false}
              className="shrink-0"
            >
              {MessageStatusLabels[messageStatusView]}
            </Tag>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 pt-1">
        <div className="mt-5 flex flex-wrap gap-2">
          {(["training", "graduation"] as const).map((t) => {
            const on = types.includes(t);
            const pal = InquiryTypeColors[t];
            return (
              <Tag
                key={t}
                color={on ? pal.hex : INQUIRY_TYPE_TAG_NEUTRAL_HEX}
                interactive={!isReplied}
                onClick={isReplied ? undefined : () => toggleType(t)}
                className="!px-3 !py-1 text-sm font-medium"
              >
                {InquiryTypeLabels[t]}
              </Tag>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Vấn đề
          </span>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-none transition-colors dark:border-white/10 dark:bg-white/3">
            <Input.TextArea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Nội dung câu hỏi"
              autoSize={{ minRows: 3, maxRows: 8 }}
              readOnly={isReplied}
              bordered={false}
              className={deeplinkCompactPlainTextAreaClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Phản hồi
          </span>
          <div className="overflow-hidden">
            <InquiryReplyRichTextEditor
              value={answer}
              onChange={setAnswer}
              placeholder="Soạn câu trả lời…"
              disabled={isReplied}
              compact
              className="rounded-none! border-0 bg-transparent dark:bg-transparent"
            />
          </div>
        </div>
      </div>

      <footer className="mt-4 flex flex-col gap-3">
        {isReplied ? (
          <div className="flex w-full gap-3">
            <button
              type="button"
              className={`${pillRowBtnPrimary} w-full`}
              disabled={footerActionsBusy}
              onClick={() => void inquiryMessageStatusMutation.mutate("new")}
            >
              {inquiryMessageStatusMutation.isPending
                ? "Đang hoàn tác…"
                : "Hoàn tác"}
            </button>
          </div>
        ) : contentManualDirty ? (
          <div className="flex w-full gap-3">
            <button
              type="button"
              className={pillRowBtnSecondary}
              disabled={replyActionsBusy}
              onClick={() => {
                const b = lastPersistedRef.current;
                setQuestion(b.question);
                setAnswer(b.answer);
                setTypes([...b.types]);
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              className={pillRowBtnPrimary}
              disabled={replyActionsBusy}
              onClick={() => void persist(false)}
            >
              <MdSave className="h-4 w-4" />
              {autoSaving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        ) : (
          <div className="flex w-full gap-3">
            <DeeplinkPillActionButton
              variant="secondary"
              disabled={footerActionsBusy}
              onClick={() => void sendReplyOnlyMutation.mutate()}
              label={
                sendReplyOnlyMutation.isPending
                  ? "Đang gửi…"
                  : "Phản hồi ngay"
              }
            />
            <DeeplinkPillActionButton
              variant="primary"
              disabled={footerActionsBusy}
              onClick={() =>
                void inquiryMessageStatusMutation.mutate(
                  messageStatusView === "new" ? "staged" : "new",
                )
              }
              label={
                inquiryMessageStatusMutation.isPending
                  ? messageStatusView === "new"
                    ? "Đang duyệt…"
                    : "Đang hoàn tác…"
                  : messageStatusView === "new"
                    ? "Duyệt hồ sơ"
                    : "Hoàn tác"
              }
            />
          </div>
        )}
      </footer>

      <ConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await deleteMutation.mutateAsync();
          } catch {
            /* toast trong mutation */
          }
        }}
        title="Xóa thắc mắc này?"
        subTitle="Xác nhận xóa dữ liệu này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        loading={deleteMutation.isPending}
      />
    </section>
  );
};

export default DeeplinkInquirySection;
