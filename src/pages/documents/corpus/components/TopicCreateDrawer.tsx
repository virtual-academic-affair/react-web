import Drawer from "@/components/drawer/Drawer";
import { formInputClass } from "@/components/fields/formInputClass";
import { useEffect, useState, type ReactNode } from "react";
import { MdAdd } from "react-icons/md";

type TopicCreateDrawerProps = {
  isOpen: boolean;
  parentLabel: string;
  saving: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; summary: string }) => void;
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

export default function TopicCreateDrawer({
  isOpen,
  parentLabel,
  saving,
  onClose,
  onCreate,
}: TopicCreateDrawerProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setSummary("");
    }
  }, [isOpen]);

  const canCreate = Boolean(title.trim()) && !saving;
  const showCreate = Boolean(title.trim()) || saving;

  const footerRight = showCreate ? (
    <button
      type="button"
      disabled={!canCreate}
      onClick={() => {
        if (!canCreate) return;
        onCreate({ title: title.trim(), summary: summary.trim() });
      }}
      className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
    >
      <MdAdd className="h-4 w-4" />
      {saving ? "Đang tạo..." : "Tạo"}
    </button>
  ) : undefined;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm chủ đề"
      footerRight={footerRight}
      width="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        <Row label="Tạo trong">
          <p className="text-navy-700 text-sm dark:text-white">{parentLabel}</p>
        </Row>

        <Row label="Tên chủ đề">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={formInputClass}
            placeholder="Tên chủ đề"
            autoFocus
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
      </div>
    </Drawer>
  );
}
