import Drawer from "@/components/drawer/Drawer";
import DetailFormLayout, { FormRow } from "@/components/layouts/DetailFormLayout";
import { faqsService } from "@/services/documents/faqs.service";
import type { YearRange } from "@/types/faqs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useRef, useState, useEffect } from "react";
import { MdCheckCircle, MdError } from "react-icons/md";
import { read, utils } from "xlsx";

interface FAQBulkImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FAQBulkImportModal({
  open,
  onClose,
}: FAQBulkImportModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState({
    questionCol: 1,
    answerCol: 2,
    academicYearCol: 3,
    enrollmentYearCol: 4,
    startRow: 2,
  });

  const [previewError, setPreviewError] = useState<string | null>(null);
  const [localPreviewRows, setLocalPreviewRows] = useState<any[][]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);

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
      const createdCount = res.created ?? 0;
      toast.success(res.message || `Import thành công ${createdCount}/${totalRows} câu hỏi`);
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi import file");
    },
  });

  // Re-run local preview when file changes
  useEffect(() => {
    let cancelled = false;
    const parseLocalPreview = async () => {
      if (!file) {
        setLocalPreviewRows([]);
        setTotalRows(0);
        return;
      }
      try {
        const buf = await file.arrayBuffer();
        const wb = read(buf, { type: "array" });
        const firstSheetName = wb.SheetNames[0];
        const firstSheet = firstSheetName ? wb.Sheets[firstSheetName] : null;
        if (!firstSheet) return;

        const rows = (utils.sheet_to_json(firstSheet, {
          header: 1,
          blankrows: false,
          defval: "",
        }) as any[][]).map((row) =>
          row.map((cell) => (cell == null ? "" : String(cell).trim())),
        );

        if (!cancelled) {
          setLocalPreviewRows(rows.slice(0, 5));
          const actualDataRows = Math.max(0, rows.length - (config.startRow - 1));
          setTotalRows(actualDataRows);
        }
      } catch (err) {
        console.error("Local preview error:", err);
      }
    };
    parseLocalPreview();
    return () => { cancelled = true; };
  }, [file, config.startRow]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleConfigChange = (key: keyof typeof config, value: string) => {
    setConfig((p) => ({ ...p, [key]: parseInt(value, 10) || 0 }));
  };

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Optional: also reset config if you want a clean slate every time
      setConfig({
        questionCol: 1,
        answerCol: 2,
        academicYearCol: 3,
        enrollmentYearCol: 4,
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
                type="number"
                min={1}
                value={config.questionCol}
                onChange={(e) => handleConfigChange("questionCol", e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
            <FormRow label="Cột Câu trả lời">
              <input
                type="number"
                min={1}
                value={config.answerCol}
                onChange={(e) => handleConfigChange("answerCol", e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
            <FormRow label="Cột Năm học">
              <input
                type="number"
                min={1}
                value={config.academicYearCol}
                onChange={(e) => handleConfigChange("academicYearCol", e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
            <FormRow label="Cột Niên khóa">
              <input
                type="number"
                min={1}
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
            {previewError ? (
              <p className="text-sm text-red-500 py-4 text-center">{previewError}</p>
            ) : localPreviewRows.length === 0 ? (
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
                      {Array.from({
                        length: Math.max(1, ...localPreviewRows.map((row) => row.length)),
                      }).map((_, colIdx) => (
                        <th
                          key={`col-${colIdx + 1}`}
                          className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-center text-xs font-semibold tracking-wide text-gray-400 uppercase last:border-r-0 dark:border-white/10 dark:text-gray-500"
                        >
                          Cột {colIdx + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {localPreviewRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-b-0 dark:border-white/5">
                        <td className="w-12 whitespace-nowrap border-r border-gray-100 bg-gray-50 px-2 py-1.5 text-center text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                          {idx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="border-r border-gray-100 px-2 py-1.5 text-sm text-gray-700 last:border-r-0 dark:border-white/10 dark:text-white">
                            <div className="max-w-[200px] truncate" title={cell}>
                              {cell || "—"}
                            </div>
                          </td>
                        ))}
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
            disabled={!file || isPending || localPreviewRows.length === 0}
            className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Đang import..." : "Bắt đầu Import"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
