import AccessScopeBadge from "@/pages/documents/components/AccessScopeBadge";
import {
  getFloatingDropdownPosition,
  type FloatingPosition,
} from "@/utils/floatingPosition";
import React from "react";
import { createPortal } from "react-dom";
import { MdExpandMore } from "react-icons/md";

const ACCESS_SCOPE_VALUES = ["lecture", "student"] as const;

type AccessScopeValue = (typeof ACCESS_SCOPE_VALUES)[number];

interface AccessScopeEditorProps {
  value?: string[] | null;
  onChange: (next: AccessScopeValue[]) => void;
  disabled?: boolean;
}

const AccessScopeEditor: React.FC<AccessScopeEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<AccessScopeValue[]>([]);
  const [dropdownPos, setDropdownPos] = React.useState<FloatingPosition>({
    left: 0,
  });

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos(getFloatingDropdownPosition(rect, { width: 240 }));
    const normalized = (value || []).filter((v): v is AccessScopeValue =>
      ACCESS_SCOPE_VALUES.includes(v as AccessScopeValue),
    );
    setDraft(normalized);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const toggleScope = (scope: AccessScopeValue) => {
    setDraft((prev) =>
      prev.includes(scope)
        ? prev.filter((item) => item !== scope)
        : [...prev, scope],
    );
  };

  const handleSave = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <>
      <div className="relative z-1 flex flex-wrap items-center gap-1 text-xs">
        <AccessScopeBadge value={value || []} />
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          title="Chỉnh sửa phạm vi truy cập"
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
              style={{
                top: dropdownPos.top,
                bottom: dropdownPos.bottom,
                left: dropdownPos.left,
              }}
              className="dark:bg-navy-900 fixed z-210 w-60 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-100 bg-white p-3 shadow-lg dark:border-white/10"
            >
              <p className="mb-2 pl-1 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Phạm vi truy cập
              </p>

              <div className="flex flex-wrap gap-2 p-1">
                {ACCESS_SCOPE_VALUES.map((scope) => {
                  const active = draft.includes(scope);
                  return (
                    <span
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={`cursor-pointer rounded-full transition-opacity ${
                        active ? "" : "opacity-45"
                      }`}
                    >
                      <AccessScopeBadge value={[scope]} />
                    </span>
                  );
                })}
                <span
                  onClick={() => setDraft([])}
                  className={`cursor-pointer rounded-full transition-opacity ${
                    draft.length === 0 ? "" : "opacity-45"
                  }`}
                >
                  <AccessScopeBadge value={[]} />
                </span>
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

export default AccessScopeEditor;

