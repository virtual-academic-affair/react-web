import React from "react";
import {
  MdDescription,
  MdImage,
  MdPictureAsPdf,
  MdTableRows,
} from "react-icons/md";
import { SiMicrosoftword } from "react-icons/si";

export type FileType =
  | "pdf"
  | "word"
  | "image"
  | "spreadsheet"
  | "text"
  | "other";

export function getExtension(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase();
}

export function getFileType(filename: string): FileType {
  const ext = getExtension(filename);
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (
    ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif"].includes(ext)
  )
    return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["txt", "md", "json", "xml", "yml", "yaml", "log", "ini"].includes(ext))
    return "text";
  return "other";
}

interface FileIconProps {
  filename: string;
  size?: "sm" | "md" | "lg";
}

const sizeIconMap = { sm: "h-5 w-5", md: "h-7 w-7", lg: "h-12 w-12" };
const sizeWrapMap = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-20 w-20 rounded-3xl",
};

const FileIcon: React.FC<FileIconProps> = ({ filename, size = "md" }) => {
  const type = getFileType(filename);
  const iconCls = sizeIconMap[size];
  const wrapCls = `${sizeWrapMap[size]} flex shrink-0 items-center justify-center`;

  switch (type) {
    case "pdf":
      return (
        <div className={`${wrapCls} bg-red-50 dark:bg-red-900/20`}>
          <MdPictureAsPdf className={`${iconCls} text-red-500`} />
        </div>
      );
    case "word":
      return (
        <div className={`${wrapCls} bg-blue-50 dark:bg-blue-900/20`}>
          <SiMicrosoftword className={`${iconCls} text-blue-600`} />
        </div>
      );
    case "image":
      return (
        <div className={`${wrapCls} bg-teal-50 dark:bg-teal-900/20`}>
          <MdImage className={`${iconCls} text-teal-500`} />
        </div>
      );
    case "spreadsheet":
      return (
        <div className={`${wrapCls} bg-green-50 dark:bg-green-900/20`}>
          <MdTableRows className={`${iconCls} text-green-600`} />
        </div>
      );
    default:
      return (
        <div className={`${wrapCls} bg-gray-100 dark:bg-white/8`}>
          <MdDescription className={`${iconCls} text-gray-400`} />
        </div>
      );
  }
};

export default FileIcon;
