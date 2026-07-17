import Drawer from "@/components/drawer/Drawer";
import { formInputClass } from "@/components/fields/formInputClass";
import { corpusService } from "@/services/documents/corpus.service";
import type { CorpusTopicDetail } from "@/types/corpus";
import { parseError } from "@/utils/parseError";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useEffect, useState, type ReactNode } from "react";
import { MdSave } from "react-icons/md";

type TopicDetailDrawerProps = {
  nodeKey: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

const Row = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
    <div className="w-full shrink-0 sm:w-40">
      <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
        {label}
      </p>
    </div>
    <div className="w-full min-w-0 flex-1">{children}</div>
  </div>
);

export default function TopicDetailDrawer({
  nodeKey,
  isOpen,
  onClose,
  onUpdated,
}: TopicDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  const {
    data: topic,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["corpus-topic", nodeKey],
    queryFn: () => corpusService.getTopic(nodeKey!),
    enabled: isOpen && !!nodeKey,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!topic) return;
    setTitle(topic.title ?? "");
    setSummary(topic.summary ?? "");
  }, [topic]);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setSummary("");
    }
  }, [isOpen]);

  const saveMutation = useMutation({
    mutationFn: (body: { title: string; summary: string }) =>
      corpusService.updateTopic(nodeKey!, body),
    onSuccess: (updated: CorpusTopicDetail) => {
      toast.success("Đã cập nhật chủ đề.");
      queryClient.setQueryData(["corpus-topic", nodeKey], updated);
      queryClient.invalidateQueries({ queryKey: ["corpus-tree"] });
      onUpdated?.();
    },
    onError: (err) => toast.error(parseError(err)),
  });

  const canSave = Boolean(title.trim()) && !saveMutation.isPending;
  const dirty =
    !!topic &&
    (title.trim() !== (topic.title ?? "").trim() ||
      summary.trim() !== (topic.summary ?? "").trim());

  const footerRight = (
    <button
      type="button"
      disabled={!canSave || !dirty}
      onClick={() => {
        if (!canSave) return;
        saveMutation.mutate({ title: title.trim(), summary: summary.trim() });
      }}
      className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
    >
      <MdSave className="h-4 w-4" />
      {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
    </button>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa chủ đề"
      footerRight={isError ? undefined : footerRight}
      width="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="dark:bg-navy-700 h-5 animate-pulse rounded bg-gray-200"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {parseError(error) || "Không tải được chủ đề."}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <Row label="Tên chủ đề">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={formInputClass}
              placeholder="Tên chủ đề"
            />
          </Row>

          <Row label="Mô tả">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={`${formInputClass} min-h-[120px] resize-y`}
              placeholder="Tóm tắt nội dung chủ đề…"
              rows={5}
            />
          </Row>

          {topic ? (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/10">
              <p className="text-navy-700 mb-3 text-xs font-semibold tracking-wide uppercase dark:text-white">
                Thông số kỹ thuật
              </p>
              <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Row label="Node key">
                  <p className="text-navy-700 break-all dark:text-white">
                    {topic.nodeKey}
                  </p>
                </Row>
                <Row label="Parent key">
                  <p className="text-navy-700 break-all dark:text-white">
                    {topic.parentKey ?? "—"}
                  </p>
                </Row>
                <Row label="Số file">
                  <p className="text-navy-700 dark:text-white">
                    {topic.fileCount}
                  </p>
                </Row>
                <Row label="Số FAQ">
                  <p className="text-navy-700 dark:text-white">
                    {topic.faqCount}
                  </p>
                </Row>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
