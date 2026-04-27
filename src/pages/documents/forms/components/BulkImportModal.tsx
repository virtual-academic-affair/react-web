import { useRef, useState } from "react";
import { message as toast, App } from "antd";
import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { FormRow } from "@/components/layouts/DetailFormLayout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formsService } from "@/services/documents/forms.service";

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface PreviewRow {
  documentType: string;
  contentLink: string;
  linkDisplayName: string;
  notes: string;
}

export default function BulkImportModal({ open, onClose }: BulkImportModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  
  // Mapping config
  const [config, setConfig] = useState({
    documentTypeCol: 1,
    contentLinkCol: 2,
    linkDisplayNameCol: 3,
    notesCol: 4,
    startRow: 2,
  });

  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { mutate: getPreview, isPending: isPreviewLoading } = useMutation({
    mutationFn: (args: { file: File, config: typeof config }) => 
      formsService.previewImport(args.file, args.config),
    onSuccess: (res) => {
      setPreview(res.rows);
      setPreviewError(null);
    },
    onError: (error: any) => {
      setPreviewError(error?.response?.data?.message || "Lỗi đọc file từ server");
      setPreview([]);
    }
  });

  const { mutate: importData, isPending } = useMutation({
    mutationFn: () =>
      formsService.importForms(file!, {
        documentTypeCol: config.documentTypeCol,
        contentLinkCol: config.contentLinkCol,
        linkDisplayNameCol: config.linkDisplayNameCol,
        notesCol: config.notesCol,
        startRow: config.startRow,
      }),
    onSuccess: (res) => {
      toast.success(res.message || "Import thành công");
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi import file");
    },
  });

  const generatePreview = (selectedFile: File, currentConfig: typeof config) => {
    getPreview({ file: selectedFile, config: currentConfig });
  };

  const handleFileFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      generatePreview(selectedFile, config);
    }
  };

  const handleConfigChange = (key: keyof typeof config, value: string) => {
    const numValue = Math.max(1, parseInt(value) || 1);
    const newConfig = { ...config, [key]: numValue };
    setConfig(newConfig);
    
    if (file) {
      generatePreview(file, newConfig);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setPreviewError(null);
    setConfig({
      documentTypeCol: 1,
      contentLinkCol: 2,
      linkDisplayNameCol: 3,
      notesCol: 4,
      startRow: 2,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const updateConfig = (key: keyof typeof config) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleConfigChange(key, e.target.value);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    importData();
  };

  const previewHeaders = ["Loại văn bản", "Link", "Nội dung hiển thị", "Ghi chú"];
  const previewData = preview.map(r => [r.documentType, r.contentLink, r.linkDisplayName, r.notes]);

  return (
    <Drawer
      isOpen={open}
      onClose={handleClose}
      title="Thêm hàng loạt"
    >
      <form onSubmit={handleImport} className="flex flex-col gap-4">
        <DetailFormLayout>
          <FormRow label="File dữ liệu">
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onClick={(e) => (e.currentTarget.value = "")}
                onChange={handleFileFilter}
                disabled={isPending || isPreviewLoading}
                className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:border-white/10 dark:text-white dark:file:bg-white/10 dark:file:text-white dark:hover:file:bg-white/20"
              />
            </div>
          </FormRow>

          <FormRow label="Cột Loại văn bản">
            <input
              type="number"
              min={1}
              value={config.documentTypeCol}
              onChange={updateConfig("documentTypeCol")}
              disabled={isPending || isPreviewLoading}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </FormRow>

          <FormRow label="Cột Nội dung (Link)">
            <input
              type="number"
              min={1}
              value={config.contentLinkCol}
              onChange={updateConfig("contentLinkCol")}
              disabled={isPending || isPreviewLoading}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </FormRow>

          <FormRow label="Cột Nội dung hiển thị">
            <input
              type="number"
              min={1}
              value={config.linkDisplayNameCol}
              onChange={updateConfig("linkDisplayNameCol")}
              disabled={isPending || isPreviewLoading}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </FormRow>

          <FormRow label="Cột Ghi chú">
            <input
              type="number"
              min={1}
              value={config.notesCol}
              onChange={updateConfig("notesCol")}
              disabled={isPending || isPreviewLoading}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </FormRow>

          <FormRow label="Dòng bắt đầu">
            <input
              type="number"
              min={1}
              value={config.startRow}
              onChange={updateConfig("startRow")}
              disabled={isPending || isPreviewLoading}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </FormRow>
        </DetailFormLayout>

        {file && (
          <div className="mt-2">
            {previewError ? (
              <p className="text-sm text-red-500">{previewError}</p>
            ) : isPreviewLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-300 animate-pulse">
                Đang tải dữ liệu xem trước...
              </p>
            ) : previewData.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-300">
                Không có dữ liệu mẫu để hiển thị.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/10">
                <table className="min-w-full w-max text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                      <th className="w-12 whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-xs font-semibold tracking-wide text-gray-400 uppercase dark:border-white/10 dark:text-gray-500">
                        #
                      </th>
                      {previewHeaders.map((header, colIdx) => (
                        <th
                          key={`col-${colIdx}`}
                          className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-xs font-semibold tracking-wide text-gray-400 uppercase last:border-r-0 dark:border-white/10 dark:text-gray-500"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr
                        key={`${idx}`}
                        className="border-b border-gray-50 last:border-b-0 dark:border-white/5"
                      >
                        <td className="w-12 whitespace-nowrap border-r border-gray-100 bg-gray-50 px-2 py-1.5 text-center text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                          {idx + 1}
                        </td>
                        {row.map((cellValue, colIdx) => {
                          const isNotesCol = colIdx === 3;
                          
                          return (
                            <td
                              key={`cell-${idx}-${colIdx}`}
                              className={`${isNotesCol ? "" : "whitespace-nowrap"} border-r border-gray-100 px-2 py-1.5 text-sm text-gray-700 last:border-r-0 dark:border-white/10 dark:text-white`}
                            >
                              {isNotesCol ? (
                                <div 
                                  className="min-w-[300px] max-h-[100px] overflow-y-auto rich-text-preview"
                                  dangerouslySetInnerHTML={{ __html: cellValue }} 
                                />
                              ) : (
                                <div className="max-w-[200px] truncate">
                                  {cellValue || "—"}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!file || preview.length === 0 || isPending || isPreviewLoading}
            className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Đang thêm..." : "Thêm"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
