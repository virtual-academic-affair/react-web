import type { ChangeEvent, RefObject } from "react";
import { MdAttachFile } from "react-icons/md";

interface FilePickerFieldProps {
  inputRef: RefObject<HTMLInputElement | null>;
  file: File | null;
  accept?: string;
  disabled?: boolean;
  inputKey?: string;
  buttonText?: string;
  emptyText?: string;
  onChange: (file: File | null) => void;
}

const FilePickerField = ({
  inputRef,
  file,
  accept,
  disabled = false,
  inputKey,
  buttonText = "Chọn file",
  emptyText = "Chưa chọn file",
  onChange,
}: FilePickerFieldProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-gray-200 px-3 py-2 sm:flex-row sm:items-center dark:border-white/10">
      <input
        key={inputKey}
        ref={inputRef}
        type="file"
        accept={accept}
        onClick={(event) => {
          event.currentTarget.value = "";
        }}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 sm:h-8 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      >
        <MdAttachFile className="h-4 w-4" />
        <span>{buttonText}</span>
      </button>
      <p
        className={`min-w-0 truncate text-sm ${
          file ? "text-gray-700 dark:text-white" : "text-gray-400"
        }`}
        title={file?.name ?? emptyText}
      >
        {file?.name ?? emptyText}
      </p>
    </div>
  );
};

export default FilePickerField;
