import type { AnyExtension, Editor } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import { createPortal } from "react-dom";
import {
  MdChecklist,
  MdCode,
  MdDataObject,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatUnderlined,
  MdHorizontalRule,
  MdImage,
  MdLink,
  MdRedo,
  MdStrikethroughS,
  MdTableChart,
  MdUndo,
} from "react-icons/md";

import {
  getFloatingDropdownPosition,
  type FloatingPosition,
} from "@/utils/floatingPosition";

/**
 * Helper to ensure all links in rich text HTML open in a new tab.
 * Useful for dangerouslySetInnerHTML content.
 */
export const fixRichTextLinks = (html: string): string => {
  if (!html) return "";
  return html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    if (/\btarget\s*=/i.test(attrs)) return `<a${attrs}>`;
    return `<a${attrs} target="_blank" rel="noopener noreferrer nofollow">`;
  });
};

export interface RichTextEditorHandle {
  focus: () => void;
  getEditor: () => Editor | null;
}

interface RichTextEditorProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (html: string) => void;
  className?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Gmail deeplink: khối soạn ~3 dòng, dài hơn thì cuộn. */
  compact?: boolean;
  /** Mở rộng Tiptap (nâng cao). Drawer đăng ký lớp dùng cho gợi ý ghi chú nhanh. */
  extraExtensions?: AnyExtension[];
  /** Định dạng dữ liệu vào/ra. Mặc định giữ nguyên contract HTML cũ. */
  contentFormat?: "html" | "markdown";
  /** Chiếm chiều cao của parent và chỉ cuộn phần nội dung bên dưới toolbar. */
  fillHeight?: boolean;
  /** Chiều cao tối thiểu của vùng soạn thảo, ví dụ "55vh". */
  minHeight?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
  buttonRef,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-40 ${
        active
          ? "bg-brand-500/15 text-brand-600 dark:text-brand-300"
          : "text-navy-700 hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function HeadingToolbarMenu({
  editor,
  disabled,
  activeLevel,
}: {
  editor: Editor;
  disabled: boolean;
  activeLevel: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<FloatingPosition>({ left: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (disabled) return;
    if (!open && triggerRef.current) {
      setPosition(
        getFloatingDropdownPosition(
          triggerRef.current.getBoundingClientRect(),
          { gap: 6, width: 170, maxHeight: 340 },
        ),
      );
    }
    setOpen((current) => !current);
  };

  React.useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const selectLevel = (level: number) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor
        .chain()
        .focus()
        .setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
        .run();
    }
    setOpen(false);
  };

  return (
    <>
      <ToolbarButton
        title="Kiểu đoạn văn"
        disabled={disabled}
        active={activeLevel > 0}
        onClick={toggleMenu}
        buttonRef={triggerRef}
      >
        <span className="text-xs font-bold">
          {activeLevel > 0 ? `H${activeLevel}` : "P"}
        </span>
      </ToolbarButton>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
            }}
            className="dark:bg-navy-900 fixed z-9999 w-[170px] rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl dark:border-white/10"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((level) => {
              const isActive = activeLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => selectLevel(level)}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-300"
                      : "text-navy-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                  }`}
                >
                  {level === 0 ? "Đoạn văn" : `Tiêu đề ${level}`}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

function TableToolbarMenu({
  editor,
  disabled,
  active,
}: {
  editor: Editor;
  disabled: boolean;
  active: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<FloatingPosition>({ left: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (disabled) return;
    if (!open && triggerRef.current) {
      setPosition(
        getFloatingDropdownPosition(
          triggerRef.current.getBoundingClientRect(),
          {
            gap: 6,
            width: 230,
            maxHeight: 320,
          },
        ),
      );
    }
    setOpen((current) => !current);
  };

  React.useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const runAction = (action: string) => {
    const chain = editor.chain().focus();
    switch (action) {
      case "insert":
        chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case "add-row":
        chain.addRowAfter().run();
        break;
      case "add-column":
        chain.addColumnAfter().run();
        break;
      case "toggle-header":
        chain.toggleHeaderRow().run();
        break;
      case "delete-row":
        chain.deleteRow().run();
        break;
      case "delete-column":
        chain.deleteColumn().run();
        break;
      case "delete-table":
        chain.deleteTable().run();
        break;
    }
    setOpen(false);
  };

  const menuButtonClass =
    "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-navy-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5";

  return (
    <>
      <ToolbarButton
        title="Bảng"
        disabled={disabled}
        active={active}
        onClick={toggleMenu}
        buttonRef={triggerRef}
      >
        <MdTableChart className="h-4 w-4" />
      </ToolbarButton>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
            }}
            className="dark:bg-navy-900 fixed z-9999 w-[230px] rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl dark:border-white/10"
          >
            {!active ? (
              <button
                type="button"
                onClick={() => runAction("insert")}
                className={menuButtonClass}
              >
                Chèn bảng 3 × 3
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => runAction("add-row")}
                  className={menuButtonClass}
                >
                  Thêm hàng phía dưới
                </button>
                <button
                  type="button"
                  onClick={() => runAction("add-column")}
                  className={menuButtonClass}
                >
                  Thêm cột bên phải
                </button>
                <button
                  type="button"
                  onClick={() => runAction("toggle-header")}
                  className={menuButtonClass}
                >
                  Bật/tắt hàng tiêu đề
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-white/10" />
                <button
                  type="button"
                  onClick={() => runAction("delete-row")}
                  className={`${menuButtonClass} text-red-500 dark:text-red-400`}
                >
                  Xóa hàng hiện tại
                </button>
                <button
                  type="button"
                  onClick={() => runAction("delete-column")}
                  className={`${menuButtonClass} text-red-500 dark:text-red-400`}
                >
                  Xóa cột hiện tại
                </button>
                <button
                  type="button"
                  onClick={() => runAction("delete-table")}
                  className={`${menuButtonClass} text-red-500 dark:text-red-400`}
                >
                  Xóa bảng
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function EditorToolbar({
  editor,
  disabled,
  contentFormat,
}: {
  editor: Editor;
  disabled: boolean;
  contentFormat: "html" | "markdown";
}) {
  const state = useEditorState({
    editor,
    selector: (snap) => {
      const headingLevel = ([1, 2, 3, 4, 5, 6] as const).find((level) =>
        snap.editor.isActive("heading", { level }),
      );
      return {
        bold: snap.editor.isActive("bold"),
        italic: snap.editor.isActive("italic"),
        strike: snap.editor.isActive("strike"),
        underline: snap.editor.isActive("underline"),
        code: snap.editor.isActive("code"),
        codeBlock: snap.editor.isActive("codeBlock"),
        bulletList: snap.editor.isActive("bulletList"),
        orderedList: snap.editor.isActive("orderedList"),
        taskList: snap.editor.isActive("taskList"),
        blockquote: snap.editor.isActive("blockquote"),
        headingLevel: headingLevel ?? 0,
        link: snap.editor.isActive("link"),
        table: snap.editor.isActive("table"),
        canUndo: snap.editor.can().undo(),
        canRedo: snap.editor.can().redo(),
      };
    },
  });

  const setLink = () => {
    if (disabled) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL liên kết", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = () => {
    if (disabled) return;
    const src = window.prompt("URL hình ảnh", "https://");
    if (!src?.trim()) return;
    editor.chain().focus().setImage({ src: src.trim() }).run();
  };

  return (
    <div
      className="flex min-h-9 min-w-0 shrink-0 flex-nowrap items-center gap-0.5 overflow-x-auto overflow-y-hidden border-b border-gray-200 bg-transparent px-2 py-1.5 transition-colors duration-200 dark:border-white/10"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <ToolbarButton
        title="Đậm"
        disabled={disabled}
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <MdFormatBold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Nghiêng"
        disabled={disabled}
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <MdFormatItalic className="h-4 w-4" />
      </ToolbarButton>
      {contentFormat === "html" && (
        <ToolbarButton
          title="Gạch chân"
          disabled={disabled}
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <MdFormatUnderlined className="h-4 w-4" />
        </ToolbarButton>
      )}
      <ToolbarButton
        title="Gạch ngang"
        disabled={disabled}
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <MdStrikethroughS className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Mã inline"
        disabled={disabled}
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <MdCode className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 transition-colors duration-200 dark:bg-white/15" />
      {contentFormat === "markdown" && (
        <HeadingToolbarMenu
          editor={editor}
          disabled={disabled}
          activeLevel={state.headingLevel}
        />
      )}
      {contentFormat === "html" && (
        <>
          <ToolbarButton
            title="Tiêu đề 2"
            disabled={disabled}
            active={state.headingLevel === 2}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <span className="text-xs font-bold">H2</span>
          </ToolbarButton>
          <ToolbarButton
            title="Tiêu đề 3"
            disabled={disabled}
            active={state.headingLevel === 3}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <span className="text-xs font-bold">H3</span>
          </ToolbarButton>
        </>
      )}
      <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 transition-colors duration-200 dark:bg-white/15" />
      <ToolbarButton
        title="Danh sách bullet"
        disabled={disabled}
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <MdFormatListBulleted className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Danh sách số"
        disabled={disabled}
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <MdFormatListNumbered className="h-4 w-4" />
      </ToolbarButton>
      {contentFormat === "markdown" && (
        <ToolbarButton
          title="Danh sách công việc"
          disabled={disabled}
          active={state.taskList}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <MdChecklist className="h-4 w-4" />
        </ToolbarButton>
      )}
      <ToolbarButton
        title="Trích dẫn"
        disabled={disabled}
        active={state.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <MdFormatQuote className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 transition-colors duration-200 dark:bg-white/15" />
      {contentFormat === "markdown" && (
        <>
          <ToolbarButton
            title="Khối mã"
            disabled={disabled}
            active={state.codeBlock}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <MdDataObject className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Đường phân cách"
            disabled={disabled}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <MdHorizontalRule className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
      <ToolbarButton
        title="Liên kết"
        disabled={disabled}
        active={state.link}
        onClick={setLink}
      >
        <MdLink className="h-4 w-4" />
      </ToolbarButton>
      {contentFormat === "markdown" && (
        <>
          <TableToolbarMenu
            editor={editor}
            disabled={disabled}
            active={state.table}
          />
          <ToolbarButton
            title="Chèn ảnh từ URL"
            disabled={disabled}
            onClick={insertImage}
          >
            <MdImage className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
      <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 transition-colors duration-200 dark:bg-white/15" />
      <ToolbarButton
        title="Hoàn tác"
        disabled={disabled || !state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <MdUndo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Làm lại"
        disabled={disabled || !state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <MdRedo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

const RichTextEditor = React.forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(
  (
    {
      value,
      onChange,
      id,
      label,
      className = "",
      error,
      placeholder,
      disabled = false,
      compact = false,
      extraExtensions,
      contentFormat = "html",
      fillHeight = false,
      minHeight,
    },
    ref,
  ) => {
    const extensions = React.useMemo(() => {
      const list: AnyExtension[] = [
        StarterKit.configure({
          heading: {
            levels: contentFormat === "markdown" ? [1, 2, 3, 4, 5, 6] : [2, 3],
          },
          // Disable extensions that might be bundled in v3 to avoid duplicates
          link: false,
          underline: false,
        } as any),
        Link.configure({
          openOnClick: true,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: {
            class: "text-brand-600 underline dark:text-brand-400",
            target: "_blank",
            rel: "noopener noreferrer nofollow",
          },
        }),
        Placeholder.configure({
          placeholder: placeholder ?? "",
          emptyEditorClass: "is-editor-empty",
        }),
      ];
      if (contentFormat === "html") {
        list.push(Underline);
      }
      if (contentFormat === "markdown") {
        list.push(
          Markdown,
          TaskList,
          TaskItem.configure({ nested: true }),
          TableKit.configure({
            table: { resizable: true },
          }),
          Image.configure({ inline: true, allowBase64: true }),
        );
      }
      if (extraExtensions?.length) {
        list.push(...extraExtensions);
      }

      // Filter out duplicate extensions by name to avoid Tiptap warnings
      const uniqueExtensions: AnyExtension[] = [];
      const extensionNames = new Set<string>();

      for (const ext of list) {
        if (!extensionNames.has(ext.name)) {
          uniqueExtensions.push(ext);
          extensionNames.add(ext.name);
        }
      }

      return uniqueExtensions;
    }, [placeholder, extraExtensions, contentFormat]);

    const editor = useEditor(
      {
        extensions,
        content: value || "",
        contentType: contentFormat,
        editable: !disabled,
        onUpdate: ({ editor: ed }) => {
          onChange(
            contentFormat === "markdown" ? ed.getMarkdown() : ed.getHTML(),
          );
        },
        editorProps: {
          attributes: {
            class: compact
              ? "tiptap-prose min-h-[5.25rem] max-h-[10rem] overflow-y-auto px-3 py-2 text-[15px] text-navy-700 outline-none dark:text-white focus:outline-none transition-colors duration-200"
              : `tiptap-prose ${fillHeight ? "min-h-full" : "min-h-[150px]"} overflow-x-auto px-3 py-2 text-[15px] text-navy-700 outline-none dark:text-white focus:outline-none transition-colors duration-200`,
            ...(!compact && (fillHeight || minHeight)
              ? {
                  style: fillHeight
                    ? "min-height: 100%"
                    : `min-height: ${minHeight}`,
                }
              : {}),
          },
        },
      },
      [extensions, compact, contentFormat, fillHeight, minHeight],
    );

    React.useEffect(() => {
      if (!editor) return;
      editor.setEditable(!disabled);
    }, [editor, disabled]);

    React.useEffect(() => {
      if (!editor || editor.isDestroyed) return;

      const currentValue =
        contentFormat === "markdown" ? editor.getMarkdown() : editor.getHTML();
      const newValue = value || "";

      // Tiptap empty = "<p></p>", but value="" means empty — treat as equal to skip
      const isTiptapEmpty = (html: string) =>
        !html || html === "<p></p>" || html === "<p> </p>";

      if (isTiptapEmpty(newValue) && isTiptapEmpty(currentValue)) return;
      if (newValue === currentValue) return;

      // Use emitUpdate:false to avoid triggering onChange and causing circular state updates
      editor.commands.setContent(newValue, {
        emitUpdate: false,
        contentType: contentFormat,
      });
    }, [contentFormat, editor, value]);

    React.useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          editor?.commands.focus();
        },
        getEditor: () => editor ?? null,
      }),
      [editor],
    );

    return (
      <div
        className={`w-full min-w-0 ${fillHeight ? "flex h-full min-h-0 flex-col" : ""} ${className}`}
      >
        {label && (
          <label
            htmlFor={id}
            className="text-navy-700 ml-3 text-sm font-bold transition-colors duration-200 dark:text-white"
          >
            {label}
          </label>
        )}
        <div
          className={`min-w-0 rounded-2xl border transition-colors duration-200 ${
            fillHeight ? "min-h-0 flex-1" : ""
          } overflow-hidden ${error ? "border-red-500" : "border-gray-200 dark:border-white/10"}`}
        >
          <style>{`
            .tiptap-editor:not(.tiptap-editor--compact) .ProseMirror {
              min-height: 150px;
            }
            .tiptap-editor--compact .ProseMirror {
              min-height: 5.25rem;
              max-height: 10rem;
              overflow-y: auto;
            }
            .tiptap-editor .tiptap-prose p.is-editor-empty::before {
              content: attr(data-placeholder);
              float: left;
              height: 0;
              pointer-events: none;
              color: #a3aed0;
            }
            .dark .tiptap-editor .tiptap-prose p.is-editor-empty::before {
              color: rgba(255, 255, 255, 0.5);
            }
            .tiptap-editor .tiptap-prose p { margin: 0.35em 0; }
            .tiptap-editor .tiptap-prose p:first-child { margin-top: 0; }
            .tiptap-editor .tiptap-prose p:last-child { margin-bottom: 0; }
            .tiptap-editor .tiptap-prose p:last-child:empty:not(:only-child),
            .tiptap-editor .tiptap-prose p:last-child:has(> br:only-child):not(:only-child) {
              display: none;
            }
            .tiptap-editor .tiptap-prose ul { list-style: disc; padding-left: 1.25rem; margin: 0.5em 0; }
            .tiptap-editor .tiptap-prose ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5em 0; }
            .tiptap-editor .tiptap-prose li { margin: 0.15em 0; }
            .tiptap-editor .tiptap-prose ul[data-type="taskList"] {
              list-style: none;
              padding-left: 0;
            }
            .tiptap-editor .tiptap-prose li[data-type="taskItem"] {
              display: flex;
              align-items: flex-start;
              gap: 0.5rem;
            }
            .tiptap-editor .tiptap-prose li[data-type="taskItem"] > label {
              margin-top: 0.35rem;
              user-select: none;
            }
            .tiptap-editor .tiptap-prose li[data-type="taskItem"] > div { flex: 1; min-width: 0; }
            .tiptap-editor .tiptap-prose h1 { font-size: 1.35rem; font-weight: 750; margin: 0.7em 0 0.4em; }
            .tiptap-editor .tiptap-prose h2 { font-size: 1.15rem; font-weight: 700; margin: 0.6em 0 0.35em; }
            .tiptap-editor .tiptap-prose h3 { font-size: 1.05rem; font-weight: 600; margin: 0.5em 0 0.3em; }
            .tiptap-editor .tiptap-prose h4,
            .tiptap-editor .tiptap-prose h5,
            .tiptap-editor .tiptap-prose h6 { font-weight: 600; margin: 0.45em 0 0.25em; }
            .tiptap-editor .tiptap-prose blockquote {
              border-left: 3px solid #e5e7eb;
              padding-left: 0.75rem;
              margin: 0.5em 0;
              color: #64748b;
            }
            .dark .tiptap-editor .tiptap-prose blockquote {
              border-left-color: rgba(255,255,255,0.2);
              color: rgba(255,255,255,0.65);
            }
            .tiptap-editor .tiptap-prose code {
              background: rgba(66, 42, 251, 0.08);
              padding: 0.1em 0.35em;
              border-radius: 4px;
              font-size: 0.9em;
            }
            .dark .tiptap-editor .tiptap-prose code {
              background: rgba(134, 140, 255, 0.15);
            }
            .tiptap-editor .tiptap-prose pre {
              background: #f3f4f6;
              padding: 0.75rem;
              border-radius: 8px;
              margin: 0.5em 0;
              font-size: 0.875em;
              overflow-x: auto;
            }
            .dark .tiptap-editor .tiptap-prose pre {
              background: rgba(255,255,255,0.06);
            }
            .tiptap-editor .tiptap-prose pre code { background: none; padding: 0; }
            .tiptap-editor .tiptap-prose hr {
              border: 0;
              border-top: 1px solid #d1d5db;
              margin: 1rem 0;
            }
            .dark .tiptap-editor .tiptap-prose hr { border-top-color: rgba(255,255,255,0.18); }
            .tiptap-editor .tiptap-prose table {
              width: 100%;
              min-width: 36rem;
              border-collapse: collapse;
              margin: 0.75rem 0;
            }
            .tiptap-editor .tiptap-prose th,
            .tiptap-editor .tiptap-prose td {
              border: 1px solid #e5e7eb;
              padding: 0.5rem 0.65rem;
              text-align: left;
              vertical-align: top;
            }
            .tiptap-editor .tiptap-prose th { background: #f3f4f6; font-weight: 650; }
            .dark .tiptap-editor .tiptap-prose th,
            .dark .tiptap-editor .tiptap-prose td { border-color: rgba(255,255,255,0.14); }
            .dark .tiptap-editor .tiptap-prose th { background: rgba(255,255,255,0.06); }
            .tiptap-editor .tiptap-prose img {
              max-width: 100%;
              height: auto;
              border-radius: 0.75rem;
              margin: 0.75rem auto;
            }
          `}</style>
          {editor ? (
            <div
              className={`tiptap-editor min-w-0 bg-transparent ${
                fillHeight ? "flex h-full min-h-0 flex-col" : ""
              } ${compact ? "tiptap-editor--compact" : ""}`}
            >
              <EditorToolbar
                editor={editor}
                disabled={disabled}
                contentFormat={contentFormat}
              />
              <EditorContent
                editor={editor}
                className={fillHeight ? "min-h-0 flex-1 overflow-y-auto" : ""}
              />
            </div>
          ) : (
            <div
              className={`bg-transparent ${fillHeight ? "h-full min-h-0" : compact ? "min-h-[132px]" : "min-h-[186px]"}`}
            />
          )}
        </div>
        {error && <p className="mt-1 ml-3 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
