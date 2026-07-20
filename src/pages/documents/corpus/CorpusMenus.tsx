import {
  dropdownMenuItemClass,
  dropdownMenuPanelClass,
} from "@/components/navbar/UserMenu";
import { getFloatingDropdownPosition } from "@/utils/floatingPosition";
import { Tree } from "antd";
import type { DataNode } from "antd/es/tree";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  MdCreateNewFolder,
  MdDeleteOutline,
  MdDriveFileRenameOutline,
  MdFolderOpen,
} from "react-icons/md";

/** Synthetic key for Corpus Tree root when moving a folder. */
export const CORPUS_TREE_KEY = "__corpus_tree__";

type FolderContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onMove: () => void;
};

export function FolderContextMenu({
  open,
  x,
  y,
  onClose,
  onEdit,
  onRemove,
  onMove,
}: FolderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(
    getFloatingDropdownPosition(new DOMRect(x, y, 0, 0), { minWidth: 220 }),
  );

  useEffect(() => {
    if (!open) return;
    setPosition(
      getFloatingDropdownPosition(new DOMRect(x, y, 0, 0), {
        minWidth: 220,
        maxHeight: 200,
      }),
    );
  }, [open, x, y]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const run = (action: () => void) => {
    onClose();
    action();
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width ?? 220,
      }}
      className={`${dropdownMenuPanelClass} fixed z-99999`}
    >
      <button
        type="button"
        role="menuitem"
        className={dropdownMenuItemClass}
        onClick={(e) => {
          e.stopPropagation();
          run(onEdit);
        }}
      >
        <MdDriveFileRenameOutline className="h-4 w-4 shrink-0" />
        <span>Chỉnh sửa</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={dropdownMenuItemClass}
        onClick={(e) => {
          e.stopPropagation();
          run(onMove);
        }}
      >
        <MdFolderOpen className="h-4 w-4 shrink-0" />
        <span>Di chuyển</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={dropdownMenuItemClass}
        onClick={(e) => {
          e.stopPropagation();
          run(onRemove);
        }}
      >
        <MdDeleteOutline className="h-4 w-4 shrink-0" />
        <span>Xóa</span>
      </button>
    </div>,
    document.body,
  );
}

type EmptyColumnMenuProps = {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onCreateFolder: () => void;
};

export function EmptyColumnMenu({
  open,
  x,
  y,
  onClose,
  onCreateFolder,
}: EmptyColumnMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(
    getFloatingDropdownPosition(new DOMRect(x, y, 0, 0), { minWidth: 220 }),
  );

  useEffect(() => {
    if (!open) return;
    setPosition(
      getFloatingDropdownPosition(new DOMRect(x, y, 0, 0), {
        minWidth: 220,
        maxHeight: 120,
      }),
    );
  }, [open, x, y]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width ?? 220,
      }}
      className={`${dropdownMenuPanelClass} fixed z-99999`}
    >
      <button
        type="button"
        role="menuitem"
        className={dropdownMenuItemClass}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
          onCreateFolder();
        }}
      >
        <MdCreateNewFolder className="h-4 w-4 shrink-0" />
        <span>Thêm chủ đề</span>
      </button>
    </div>,
    document.body,
  );
}

function collectHalfCheckedKeys(
  nodes: DataNode[],
  checked: Set<string>,
): string[] {
  const half: string[] = [];
  const walk = (list: DataNode[]): boolean => {
    let anySelected = false;
    for (const node of list) {
      const key = String(node.key);
      const childHas = walk(node.children ?? []);
      const self = checked.has(key);
      if (childHas && !self) half.push(key);
      if (self || childHas) anySelected = true;
    }
    return anySelected;
  };
  walk(nodes);
  return half;
}

function countSelectedDescendants(
  node: DataNode,
  checked: Set<string>,
): number {
  let count = 0;
  const walk = (n: DataNode) => {
    for (const child of n.children ?? []) {
      if (checked.has(String(child.key))) count += 1;
      walk(child);
    }
  };
  walk(node);
  return count;
}

type FolderPickerPopupProps = {
  open: boolean;
  anchor: { x: number; y: number } | null;
  title: string;
  subtitle?: string;
  folderTree: DataNode[];
  mode: "multiple" | "single";
  checkedKeys?: string[];
  onCheck?: (keys: string[]) => void;
  selectedKey?: string | null;
  disabledKeys?: string[];
  showRootOption?: boolean;
  onSelect?: (key: string | null) => void;
  saving: boolean;
  saveLabel?: string;
  onClose: () => void;
  onSave: () => void;
};

export function FolderPickerPopup({
  open,
  anchor,
  title,
  subtitle,
  folderTree,
  mode,
  checkedKeys = [],
  onCheck,
  selectedKey = null,
  disabledKeys = [],
  showRootOption = false,
  onSelect,
  saving,
  saveLabel = "Lưu",
  onClose,
  onSave,
}: FolderPickerPopupProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(
    getFloatingDropdownPosition(new DOMRect(0, 0, 0, 0), {
      width: 320,
      maxHeight: 420,
    }),
  );

  const effectiveCheckedKeys = useMemo(() => {
    if (mode === "single") {
      return [selectedKey ?? CORPUS_TREE_KEY];
    }
    return checkedKeys;
  }, [mode, selectedKey, checkedKeys]);

  const checkedSet = useMemo(
    () => new Set(effectiveCheckedKeys),
    [effectiveCheckedKeys],
  );
  const disabledSet = useMemo(() => new Set(disabledKeys), [disabledKeys]);
  const halfCheckedKeys = useMemo(
    () =>
      mode === "multiple" ? collectHalfCheckedKeys(folderTree, checkedSet) : [],
    [folderTree, checkedSet, mode],
  );

  const mappedFolders = useMemo(() => {
    const mapNodes = (nodes: DataNode[]): DataNode[] =>
      nodes.map((node) => {
        const key = String(node.key);
        const baseTitle = String(node.title ?? "");
        let titleNode: ReactNode = baseTitle;

        if (mode === "multiple") {
          const descendantCount = countSelectedDescendants(node, checkedSet);
          const showHint =
            !checkedSet.has(key) &&
            descendantCount > 0 &&
            (node.children?.length ?? 0) > 0;
          titleNode = (
            <span className="inline-flex min-w-0 items-center gap-1">
              <span className="truncate">{baseTitle}</span>
              {showHint ? (
                <span className="shrink-0 text-[11px] text-gray-400">
                  ({descendantCount})
                </span>
              ) : null}
            </span>
          );
        }

        return {
          ...node,
          title: titleNode,
          disabled: mode === "single" ? disabledSet.has(key) : false,
          children: mapNodes(node.children ?? []),
        };
      });
    return mapNodes(folderTree);
  }, [folderTree, checkedSet, disabledSet, mode]);

  const treeData = useMemo(() => {
    if (mode === "single" && showRootOption) {
      return [
        {
          key: CORPUS_TREE_KEY,
          title: "Corpus Tree",
          children: mappedFolders,
        },
      ];
    }
    return mappedFolders;
  }, [mode, showRootOption, mappedFolders]);

  useEffect(() => {
    if (!open || !anchor) return;
    setPosition(
      getFloatingDropdownPosition(new DOMRect(anchor.x, anchor.y, 0, 0), {
        width: 320,
        maxHeight: 420,
      }),
    );
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width ?? 320,
      }}
      className="dark:bg-navy-800 fixed z-99999 flex max-h-[420px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-white/10"
    >
      <div className="border-b border-gray-100 px-4 py-3 dark:border-white/10">
        <p className="text-navy-700 line-clamp-2 text-sm font-semibold dark:text-white">
          {title || "Thư mục"}
        </p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
        ) : null}
      </div>
      <div className="corpus-folder-picker min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {folderTree.length === 0 && mode === "multiple" ? (
          <p className="px-2 py-4 text-center text-sm text-gray-400">
            Chưa có thư mục nào
          </p>
        ) : (
          <Tree
            checkable
            checkStrictly
            selectable={false}
            defaultExpandAll
            treeData={treeData}
            checkedKeys={{
              checked: effectiveCheckedKeys,
              halfChecked: halfCheckedKeys,
            }}
            onCheck={(_checked, info) => {
              const key = String(info.node.key);
              if (mode === "single") {
                if (disabledSet.has(key)) return;
                onSelect?.(key === CORPUS_TREE_KEY ? null : key);
                return;
              }
              const nextChecked = Array.isArray(_checked)
                ? _checked
                : _checked.checked;
              onCheck?.(nextChecked.map(String));
            }}
          />
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 px-3 py-2.5 dark:border-white/10">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Đang lưu…" : saveLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
