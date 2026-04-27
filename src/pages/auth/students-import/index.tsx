import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import { studentsService } from "@/services/students";
import type { ImportStudentsDto } from "@/types/students";
import { parseError } from "@/utils/parseError";
import { message as toast } from "antd";
import React from "react";

const DEFAULT_IMPORT_CONFIG: Required<ImportStudentsDto> = {
  studentCodeCol: 1,
  studentNameCol: 2,
  startRow: 2,
};

const StudentsImportPage: React.FC = () => {
  const [file, setFile] = React.useState<File | null>(null);
  const [config, setConfig] =
    React.useState<Required<ImportStudentsDto>>(DEFAULT_IMPORT_CONFIG);
  const [submitting, setSubmitting] = React.useState(false);
  const [lastImportedCount, setLastImportedCount] = React.useState<number | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
  };

  const updateConfig =
    (key: keyof Required<ImportStudentsDto>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(event.target.value);
      setConfig((prev) => ({
        ...prev,
        [key]: Number.isFinite(raw) ? Math.max(1, Math.floor(raw)) : 1,
      }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      toast.error("Vui lòng chọn file import.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await studentsService.importStudents(file, config);
      setLastImportedCount(result.insertedOrUpdated);
      toast.success(
        `Import thành công ${result.insertedOrUpdated} sinh viên (insert/update).`,
      );
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CreatePageLayout title="Import sinh viên">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            File dữ liệu
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Hỗ trợ các định dạng bảng như Excel/CSV theo API backend.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              disabled={submitting}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:border-white/10 dark:text-white dark:file:bg-white/10 dark:file:text-white dark:hover:file:bg-white/20"
            />
            {file && (
              <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
                Đã chọn: <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Cột MSSV
            </span>
            <input
              type="number"
              min={1}
              value={config.studentCodeCol}
              onChange={updateConfig("studentCodeCol")}
              disabled={submitting}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Cột họ tên
            </span>
            <input
              type="number"
              min={1}
              value={config.studentNameCol}
              onChange={updateConfig("studentNameCol")}
              disabled={submitting}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
              Bắt đầu từ dòng
            </span>
            <input
              type="number"
              min={1}
              value={config.startRow}
              onChange={updateConfig("startRow")}
              disabled={submitting}
              className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
            />
          </label>
        </div>

        {lastImportedCount != null && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
            Kết quả lần import gần nhất: {lastImportedCount} bản ghi được insert/update.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !file}
            className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? "Đang import..." : "Import sinh viên"}
          </button>
        </div>
      </form>
    </CreatePageLayout>
  );
};

export default StudentsImportPage;
