import Tag from "@/components/tag/Tag";
import type { InquiryType } from "@/types/inquiry";
import { InquiryTypeColors, InquiryTypeLabels } from "@/types/inquiry";
import React from "react";
import { createPortal } from "react-dom";
import { MdExpandMore } from "react-icons/md";

interface InquiryTypeEditorProps {
  value: InquiryType[];
  onChange: (types: InquiryType[]) => void;
  disabled?: boolean;
}

const InquiryTypeEditor: React.FC<InquiryTypeEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<InquiryType[]>([]);
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const options: InquiryType[] = ["graduation", "training", "procedure"];

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setDraft([...(value ?? [])]);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    onChange(draft);
    setOpen(false);
  };

  const toggleType = (type: InquiryType) => {
    setDraft((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative z-1 flex flex-wrap items-center gap-1 text-xs"
      >
        {value?.length ? (
          value.map((type) => (
            <Tag key={type} color={InquiryTypeColors[type].hex}>
              {InquiryTypeLabels[type]}
            </Tag>
          ))
        ) : (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          title="Chỉnh sửa loại thắc mắc"
          className="bg-transparent ml-0.5 inline-flex aspect-square h-5 items-center rounded-lg border border-gray-200 pr-1.5 pl-1 text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <MdExpandMore className="h-3.5 w-3.5" />
        </button>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-200" onClick={handleClose} />
            <div
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              className="dark:bg-navy-900 fixed z-210 w-60 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10"
            >
              <p className="mb-2 pl-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Loại thắc mắc
              </p>

              <div className="flex flex-wrap gap-2 p-1">
                {options.map((type) => {
                  const active = draft.includes(type);
                  const colors = InquiryTypeColors[type];
                  return (
                    <Tag
                      key={type}
                      color={active ? colors.hex : "gray"}
                      onClick={() => toggleType(type)}
                      className={`cursor-pointer ${active ? "" : "opacity-50"}`}
                    >
                      {InquiryTypeLabels[type]}
                    </Tag>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-brand-500 hover:bg-brand-600 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors"
                >
                  Lưu
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
};

export default InquiryTypeEditor;
