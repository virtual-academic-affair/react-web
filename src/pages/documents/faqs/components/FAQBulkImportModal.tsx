import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { FormRow } from "@/components/layouts/DetailFormLayout";
import { faqsService } from "@/services/documents/faqs.service";
import type { YearRange } from "@/types/faqs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useRef, useState, useEffect } from "react";
import { MdCheckCircle, MdError } from "react-icons/md";

interface FAQBulkImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ImportRowPreview {
  rowIndex: number;
  question: string;
  answerRichText: string; // Updated to match new backend field
  metadata: {
    academicYear: YearRange;
    enrollmentYear: YearRange;
  };
  isValid: boolean;
  error?: string;
}

export default function FAQBulkImportModal({
  open,
  onClose,
}: FAQBulkImportModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState({
    questionCol: "1",
    answerCol: "2",
    academicYearCol: "3",
    enrollmentYearCol: "4",
    startRow: 2,
  });

  const [previewData, setPreviewData] = useState<ImportRowPreview[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { mutate: getPreview } = useMutation({
    mutationFn: (selectedFile: File) =>
      faqsService.previewImportFAQs(selectedFile, {
        questionCol: config.questionCol,
        answerCol: config.answerCol,
        academicYearCol: config.academicYearCol,
        enrollmentYearCol: config.enrollmentYearCol,
        skipRows: config.startRow - 1,
      }),
    onSuccess: (res) => {
      setPreviewData(res.rows || []);
      setPreviewError(null);
    },
    onError: (error: any) => {
      setPreviewError(error?.response?.data?.message || "Lỗi khi lấy dữ liệu xem trước");
      setPreviewData([]);
    },
    onSettled: () => {
      setIsPreviewLoading(false);
    },
  });

  const { mutate: importData, isPending } = useMutation({
    mutationFn: () =>
      faqsService.importFAQs(file!, {
        questionCol: config.questionCol,
        answerCol: config.answerCol,
        academicYearCol: config.academicYearCol,
        enrollmentYearCol: config.enrollmentYearCol,
        skipRows: config.startRow - 1,
      }),
    onSuccess: (res: any) => {
      toast.success(res.message || `Import thành công ${res.created} câu hỏi`);
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi import file");
    },
  });

  // Re-run preview when config or file changes
  useEffect(() => {
    if (file) {
      setIsPreviewLoading(true);
      const timer = setTimeout(() => {
        getPreview(file);
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [file, config]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleConfigChange = (key: keyof typeof config, value: string) => {
    setConfig((p) => ({ ...p, [key]: value }));
  };

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewData([]);
      setPreviewError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Optional: also reset config if you want a clean slate every time
      setConfig({
        questionCol: "1",
        answerCol: "2",
        academicYearCol: "3",
        enrollmentYearCol: "4",
        startRow: 2,
      });
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    importData();
  };

  const previewHeaders = ["Trạng thái", "Câu hỏi", "Câu trả lời", "Năm học", "Niên khóa"];

  return (
    <Drawer isOpen={open} onClose={handleClose} title="Thêm câu hỏi hàng loạt">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <DetailFormLayout>
          <FormRow label="File dữ liệu">
            <input
              key={open ? 'open' : 'closed'}
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onClick={(e) => (e.currentTarget.value = "")}
              onChange={handleFileChange}
              disabled={isPending}
              className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:border-white/10 dark:text-white dark:file:bg-white/10 dark:file:text-white dark:hover:file:bg-white/20"
            />
          </FormRow>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <FormRow label="Cột Câu hỏi">
              <input
                type="text"
                value={config.questionCol}
                onChange={(e) => handleConfigChange("questionCol", e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
            <FormRow label="Cột Câu trả lời">
              <input
                type="text"
                value={config.answerCol}
                onChange={(e) => handleConfigChange("answerCol", e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
            <FormRow label="Cột Năm học">
              <input
                type="text"
                value={config.academicYearCol}
                onChange={(e) => handleConfigChange("academicYearCol", e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
            <FormRow label="Cột Niên khóa">
              <input
                type="text"
                value={config.enrollmentYearCol}
                onChange={(e) => handleConfigChange("enrollmentYearCol", e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
          </div>

          <FormRow label="Dòng bắt đầu">
            <input
              type="number"
              min={1}
              value={config.startRow}
              onChange={(e) => handleConfigChange("startRow", e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </FormRow>
        </DetailFormLayout>

        {file && (
          <div className="mt-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Xem trước dữ liệu
              </h3>
              {isPreviewLoading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              )}
            </div>

            {previewError ? (
              <p className="text-sm text-red-500 py-4 text-center">{previewError}</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/10">
                <table className="min-w-full w-max text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                      <th className="w-12 whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-xs font-semibold tracking-wide text-gray-400 uppercase dark:border-white/10 dark:text-gray-500">
                        #
                      </th>
                      {previewHeaders.map((header, idx) => (
                        <th
                          key={idx}
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
                        key={idx}
                        className={`border-b border-gray-50 last:border-b-0 dark:border-white/5 ${
                          !row.isValid ? "bg-red-50/50 dark:bg-red-500/5" : ""
                        }`}
                      >
                        <td className="w-12 whitespace-nowrap border-r border-gray-100 bg-gray-50 px-2 py-1.5 text-center text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                          {row.rowIndex}
                        </td>
                        <td className="border-r border-gray-100 px-2 py-1.5 text-center dark:border-white/10">
                          <div className="flex justify-center">
                            {row.isValid ? (
                              <MdCheckCircle className="text-green-500 h-4 w-4" title="Hợp lệ" />
                            ) : (
                              <MdError className="text-red-500 h-4 w-4" title={row.error} />
                            )}
                          </div>
                        </td>
                        <td className="border-r border-gray-100 px-2 py-1.5 dark:border-white/10">
                          <div className="max-w-[200px] truncate text-navy-700 dark:text-white" title={row.question}>
                            {row.question || "—"}
                          </div>
                        </td>
                        <td className="border-r border-gray-100 px-2 py-1.5 dark:border-white/10">
                          <div 
                            className="min-w-[300px] max-h-[100px] overflow-y-auto rich-text-preview text-gray-700 dark:text-gray-300"
                            dangerouslySetInnerHTML={{ __html: row.answerRichText }} 
                          />
                        </td>
                        <td className="border-r border-gray-100 px-2 py-1.5 text-center dark:border-white/10">
                          <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {row.metadata.academicYear.fromYear === 0 && row.metadata.academicYear.toYear === 9999
                              ? "Tất cả"
                              : `${row.metadata.academicYear.fromYear} - ${row.metadata.academicYear.toYear}`}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {row.metadata.enrollmentYear.fromYear === 0 && row.metadata.enrollmentYear.toYear === 9999
                              ? "Tất cả"
                              : `${row.metadata.enrollmentYear.fromYear} - ${row.metadata.enrollmentYear.toYear}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {previewData.length === 0 && !isPreviewLoading && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          Chưa có dữ liệu xem trước
                        </td>
                      </tr>
                    )}
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
            disabled={!file || isPending || isPreviewLoading || previewData.length === 0 || previewData.every(r => !r.isValid)}
            className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Đang import..." : "Bắt đầu Import"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
