import React from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor = React.forwardRef<
  ReactQuill,
  RichTextEditorProps
>(({ value, onChange }, ref) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
      <style>{`
    .ql-toolbar.ql-snow, .ql-container.ql-snow {
      border: none !important;
    }
    .ql-toolbar.ql-snow {
      border-bottom: 1px solid #e5e7eb !important; /* gray-200 */
      background: #ffffff !important;
    }
    .dark .ql-toolbar.ql-snow {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; /* white/10 */
      background: transparent !important;
    }
    .ql-container {
      font-size: 15px;
      color: #1b2559 !important; /* navy-900 */
      background: #ffffff !important;
    }
    .dark .ql-container {
      color: #ffffff !important;
      background: transparent !important;
    }
    .ql-container .ql-editor {
      color: inherit !important;
    }
    .ql-toolbar .ql-stroke {
      stroke: #1b2559 !important; /* navy-900 */
    }
    .dark .ql-toolbar .ql-stroke {
      stroke: #ffffff !important;
    }
    .ql-toolbar .ql-fill {
      fill: #1b2559 !important; /* navy-900 */
    }
    .dark .ql-toolbar .ql-fill {
      fill: #ffffff !important;
    }
    .ql-toolbar button:hover .ql-stroke,
    .ql-toolbar button.ql-active .ql-stroke {
      stroke: #422afb !important; /* brand-500 */
    }
    .dark .ql-toolbar button:hover .ql-stroke,
    .dark .ql-toolbar button.ql-active .ql-stroke {
      stroke: #868cff !important; /* brandLinear */
    }
    .ql-toolbar button:hover .ql-fill,
    .ql-toolbar button.ql-active .ql-fill {
      fill: #422afb !important; /* brand-500 */
    }
    .dark .ql-toolbar button:hover .ql-fill,
    .dark .ql-toolbar button.ql-active .ql-fill {
      fill: #868cff !important; /* brandLinear */
    }
  `}</style>

      <ReactQuill
        ref={ref}
        theme="snow"
        value={value}
        onChange={onChange}
      />
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
