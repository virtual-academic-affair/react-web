import type { AnyExtension, Editor } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import {
  MdCode,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatUnderlined,
  MdLink,
  MdRedo,
  MdStrikethroughS,
  MdUndo,
} from "react-icons/md";

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
  /** Mở rộng Tiptap (nâng cao). Drawer đăng ký lớp dùng cho gợi ý ghi chú nhanh. */
  extraExtensions?: AnyExtension[];
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
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

function EditorToolbar({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled: boolean;
}) {
  const state = useEditorState({
    editor,
    selector: (snap) => ({
      bold: snap.editor.isActive("bold"),
      italic: snap.editor.isActive("italic"),
      strike: snap.editor.isActive("strike"),
      underline: snap.editor.isActive("underline"),
      code: snap.editor.isActive("code"),
      bulletList: snap.editor.isActive("bulletList"),
      orderedList: snap.editor.isActive("orderedList"),
      blockquote: snap.editor.isActive("blockquote"),
      h2: snap.editor.isActive("heading", { level: 2 }),
      h3: snap.editor.isActive("heading", { level: 3 }),
      link: snap.editor.isActive("link"),
      canUndo: snap.editor.can().undo(),
      canRedo: snap.editor.can().redo(),
    }),
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

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 transition-colors duration-300 bg-transparent px-2 py-1.5 dark:border-white/10">
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
      <ToolbarButton
        title="Gạch chân"
        disabled={disabled}
        active={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <MdFormatUnderlined className="h-4 w-4" />
      </ToolbarButton>
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
      <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/15 transition-colors duration-300" />
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
      <ToolbarButton
        title="Trích dẫn"
        disabled={disabled}
        active={state.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <MdFormatQuote className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/15 transition-colors duration-300" />
      <ToolbarButton
        title="Tiêu đề 2"
        disabled={disabled}
        active={state.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="text-xs font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton
        title="Tiêu đề 3"
        disabled={disabled}
        active={state.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>
      <ToolbarButton
        title="Liên kết"
        disabled={disabled}
        active={state.link}
        onClick={setLink}
      >
        <MdLink className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/15 transition-colors duration-300" />
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
      extraExtensions,
    },
    ref,
  ) => {
    const extensions = React.useMemo(() => {
      const list: AnyExtension[] = [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: {
            class: "text-brand-600 underline dark:text-brand-400",
          },
        }),
        Placeholder.configure({
          placeholder: placeholder ?? "",
          emptyEditorClass: "is-editor-empty",
        }),
      ];
      if (extraExtensions?.length) {
        list.push(...extraExtensions);
      }
      return list;
    }, [placeholder, extraExtensions]);

    const editor = useEditor(
      {
        extensions,
        content: value || "",
        editable: !disabled,
        onUpdate: ({ editor: ed }) => {
          onChange(ed.getHTML());
        },
        editorProps: {
          attributes: {
            class:
              "tiptap-prose min-h-[150px] px-3 py-2 text-[15px] text-navy-700 outline-none dark:text-white focus:outline-none transition-colors duration-300",
          },
        },
      },
      [disabled, extensions],
    );

    React.useEffect(() => {
      if (!editor) return;
      editor.setEditable(!disabled);
    }, [editor, disabled]);

    React.useEffect(() => {
      if (!editor) return;
      if (editor.isFocused) return;
      const current = editor.getHTML();
      if (value !== current) {
        editor.commands.setContent(value || "", { emitUpdate: false });
      }
    }, [editor, value]);

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
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={id}
            className="text-navy-700 ml-3 text-sm font-bold dark:text-white transition-colors duration-300"
          >
            {label}
          </label>
        )}
        <div
          className={`mt-2 overflow-hidden rounded-2xl border transition-colors duration-300 ${error ? "border-red-500" : "border-gray-200 dark:border-white/10"}`}
        >
          <style>{`
            .tiptap-editor .ProseMirror {
              min-height: 150px;
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
            .tiptap-editor .tiptap-prose ul { list-style: disc; padding-left: 1.25rem; margin: 0.5em 0; }
            .tiptap-editor .tiptap-prose ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5em 0; }
            .tiptap-editor .tiptap-prose li { margin: 0.15em 0; }
            .tiptap-editor .tiptap-prose h2 { font-size: 1.15rem; font-weight: 700; margin: 0.6em 0 0.35em; }
            .tiptap-editor .tiptap-prose h3 { font-size: 1.05rem; font-weight: 600; margin: 0.5em 0 0.3em; }
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
          `}</style>
          {editor ? (
            <div className="tiptap-editor bg-transparent">
              <EditorToolbar editor={editor} disabled={disabled} />
              <EditorContent editor={editor} />
            </div>
          ) : (
            <div className="min-h-[186px] bg-transparent" />
          )}
        </div>
        {error && <p className="mt-1 ml-3 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
