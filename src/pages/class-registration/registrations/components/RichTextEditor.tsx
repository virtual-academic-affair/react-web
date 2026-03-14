import React from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
      <style>{`
    .ql-toolbar.ql-snow, .ql-container.ql-snow {
      border: none !important;
    }
    .ql-toolbar.ql-snow {
      border-bottom: 1px solid #e5e7eb !important; /* gray-200 */
    }
    .dark .ql-toolbar.ql-snow {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important; /* white/10 */
    }
    .ql-container {
      font-size: 15px;
    }
  `}</style>

      <ReactQuill theme="snow" value={value} onChange={onChange} />
    </div>
  );
};

export default RichTextEditor;
