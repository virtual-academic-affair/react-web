import React from "react";
import {
  MdArticle,
  MdDescription,
  MdImage,
  MdPictureAsPdf,
  MdTableRows,
} from "react-icons/md";
import { PiMicrosoftWordLogoFill } from "react-icons/pi";

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
    [
      "png",
      "jpg",
      "jpeg",
      "gif",
      "bmp",
      "webp",
      "svg",
      "ico",
      "tiff",
      "tif",
    ].includes(ext)
  )
    return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["txt", "md", "markdown", "json", "xml", "yml", "yaml", "log", "ini"].includes(ext))
    return "text";
  return "other";
}

interface FileIconProps {
  filename: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** Icon only — no colored background / padding box. */
  plain?: boolean;
}

const sizeIconMap = {
  xs: "h-3.5 w-3.5",
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-12 w-12",
};
const sizeWrapMap = {
  xs: "h-7 w-7 rounded-lg",
  sm: "h-9 w-9 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
  lg: "h-20 w-20 rounded-3xl",
};

const FileIcon: React.FC<FileIconProps> = ({
  filename,
  size = "md",
  plain = false,
}) => {
  const type = getFileType(filename);
  const iconCls = `${sizeIconMap[size]} shrink-0`;
  const wrapCls = `${sizeWrapMap[size]} flex shrink-0 items-center justify-center`;

  const icon = (() => {
    switch (type) {
      case "pdf":
        return <MdPictureAsPdf className={`${iconCls} text-red-500`} />;
      case "word":
        return (
          <PiMicrosoftWordLogoFill className={`${iconCls} text-blue-600`} />
        );
      case "image":
        return <MdImage className={`${iconCls} text-teal-500`} />;
      case "spreadsheet":
        return <MdTableRows className={`${iconCls} text-green-600`} />;
      case "text":
        return <MdArticle className={`${iconCls} text-indigo-500`} />;
      default:
        return <MdDescription className={`${iconCls} text-cyan-500`} />;
    }
  })();

  if (plain) return icon;

  switch (type) {
    case "pdf":
      return (
        <div className={`${wrapCls} bg-red-50 dark:bg-red-900/20`}>{icon}</div>
      );
    case "word":
      return (
        <div className={`${wrapCls} bg-blue-50 dark:bg-blue-900/20`}>
          {icon}
        </div>
      );
    case "image":
      return (
        <div className={`${wrapCls} bg-teal-50 dark:bg-teal-900/20`}>
          {icon}
        </div>
      );
    case "spreadsheet":
      return (
        <div className={`${wrapCls} bg-green-50 dark:bg-green-900/20`}>
          {icon}
        </div>
      );
    case "text":
      return (
        <div className={`${wrapCls} bg-indigo-50 dark:bg-indigo-900/20`}>
          {icon}
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
