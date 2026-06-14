import ConfirmModal from "@/components/modal/ConfirmModal";
import Drawer from "@/components/drawer/Drawer";
import FilePickerField from "@/components/fields/FilePickerField";
import DetailFormLayout, { FormRow } from "@/components/layouts/DetailFormLayout";
import TableLayout, {
  type TableAction,
  type TableColumn,
} from "@/components/table/TableLayout";
import StudentDetailDrawer from "@/pages/auth/students/components/StudentDetailDrawer";
import StudentFormFields, {
  type StudentFormValue,
} from "@/pages/auth/students/components/StudentFormFields";
import { studentsService } from "@/services/students";
import type { PaginatedResponse } from "@/types/common";
import type {
  ImportStudentsDto,
  Student,
} from "@/types/students";
import { parseError } from "@/utils/parseError";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import React from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import { read, utils } from "xlsx";

const PAGE_SIZE = 10;
const DEFAULT_IMPORT_CONFIG: Required<ImportStudentsDto> = {
  studentCodeCol: 1,
  studentNameCol: 2,
  startRow: 2,
};

const StudentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get("keyword") ?? "";
  const initialPage =
    Number(searchParams.get("page") ?? "1") > 0
      ? Number(searchParams.get("page") ?? "1")
      : 1;
  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [searchValue, setSearchValue] = React.useState(initialKeyword);
  const [page, setPage] = React.useState(initialPage);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Student | null>(null);

  const [creating, setCreating] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  const [createDto, setCreateDto] = React.useState<StudentFormValue>({
    studentCode: "",
    studentName: "",
  });
  const [file, setFile] = React.useState<File | null>(null);
  const [importConfig, setImportConfig] =
    React.useState<Required<ImportStudentsDto>>(DEFAULT_IMPORT_CONFIG);
  const [previewRows, setPreviewRows] = React.useState<string[][]>([]);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const idParam = searchParams.get("id");
  const selectedId = idParam ? Number(idParam) : null;

  const { data: result = null, isLoading: loading } = useQuery({
    queryKey: ["students", { page, keyword }],
    queryFn: () =>
      studentsService.getStudents({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
      }),
    staleTime: 30 * 1000,
  });

  const handleSearch = () => {
    setKeyword(searchValue.trim());
    setPage(1);
  };

  React.useEffect(() => {
    const next = new URLSearchParams();
    if (keyword) {
      next.set("keyword", keyword);
    }
    next.set("page", String(page));
    if (idParam) {
      next.set("id", idParam);
    }
    setSearchParams(next, { replace: true });
  }, [keyword, page, idParam, setSearchParams]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createDto.studentCode.trim() || !createDto.studentName.trim()) {
      toast.error("Vui lòng nhập đầy đủ MSSV và họ tên.");
      return;
    }

    setCreating(true);
    try {
      await studentsService.createStudent({
        studentCode: createDto.studentCode.trim(),
        studentName: createDto.studentName.trim(),
      });
      toast.success("Tạo sinh viên thành công.");
      setCreateOpen(false);
      setCreateDto({ studentCode: "", studentName: "" });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setCreating(false);
    }
  };

  const updateImportConfig =
    (key: keyof Required<ImportStudentsDto>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setImportConfig((prev) => ({
        ...prev,
        [key]: Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1,
      }));
    };

  React.useEffect(() => {
    let cancelled = false;

    const parsePreview = async () => {
      if (!file) {
        setPreviewRows([]);
        setPreviewError(null);
        return;
      }

      try {
        const isCsv = file.name.toLowerCase().endsWith(".csv");
        let wb;
        if (isCsv) {
          const text = await file.text();
          wb = read(text, { type: "string" });
        } else {
          const buf = await file.arrayBuffer();
          wb = read(buf, { type: "array" });
        }
        const firstSheetName = wb.SheetNames[0];
        const firstSheet = firstSheetName ? wb.Sheets[firstSheetName] : null;
        if (!firstSheet) {
          if (!cancelled) {
            setPreviewRows([]);
            setPreviewError("Không đọc được dữ liệu trong file.");
          }
          return;
        }

        const rows = (utils.sheet_to_json(firstSheet, {
          header: 1,
          blankrows: false,
          defval: "",
        }) as unknown[][]).map((row) =>
          row.map((cell) => (cell == null ? "" : String(cell).trim())),
        );

        if (!cancelled) {
          setPreviewRows(rows.slice(0, 5));
          setPreviewError(null);
        }
      } catch {
        if (!cancelled) {
          setPreviewRows([]);
          setPreviewError("Không thể đọc file mẫu. Vui lòng kiểm tra định dạng.");
        }
      }
    };

    void parsePreview();

    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast.error("Vui lòng chọn file import.");
      return;
    }

    setImporting(true);
    try {
      const result = await studentsService.importStudents(file, importConfig);
      toast.success(
        `Import thành công ${result.insertedOrUpdated} sinh viên (insert/update).`,
      );
      setImportOpen(false);
      setFile(null);
      setPreviewRows([]);
      setPreviewError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteFromTable = React.useCallback((student: Student) => {
    setDeleteTarget(student);
  }, []);

  const handleCloseImportDrawer = React.useCallback(() => {
    setImportOpen(false);
    setFile(null);
    setPreviewRows([]);
    setPreviewError(null);
    setImportConfig(DEFAULT_IMPORT_CONFIG);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const executeDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await studentsService.removeStudent(deleteTarget.id);
      toast.success("Xóa sinh viên thành công.");
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      if (selectedId === deleteTarget.id) {
        const next = new URLSearchParams(searchParams);
        next.delete("id");
        setSearchParams(next, { replace: true });
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(parseError(error));
    }
  }, [deleteTarget, queryClient, searchParams, selectedId, setSearchParams]);

  const columns: TableColumn<Student>[] = React.useMemo(
    () => [
      {
        key: "studentCode",
        header: "MSSV",
        width: "220px",
        render: (student) => (
          <p className="text-navy-700 text-sm font-medium dark:text-white">
            {student.studentCode}
          </p>
        ),
      },
      {
        key: "studentName",
        header: "Họ tên",
        render: (student) => (
          <p className="text-navy-700 text-sm dark:text-white">
            {student.studentName}
          </p>
        ),
      },
    ],
    [],
  );

  const actions: TableAction<Student>[] = React.useMemo(
    () => [
      {
        key: "detail",
        icon: <MdInfoOutline className="h-4 w-4" />,
        label: "Chi tiết",
        onClick: (student) => {
          const next = new URLSearchParams(searchParams);
          next.set("id", String(student.id));
          setSearchParams(next, { replace: true });
        },
      },
      {
        key: "delete",
        icon: <MdDeleteOutline className="h-4 w-4" />,
        label: "Xóa",
        onClick: (student) => void handleDeleteFromTable(student),
        render: (student) => (
          <button
            type="button"
            onClick={() => void handleDeleteFromTable(student)}
            aria-label="Xóa"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            <MdDeleteOutline className="h-4 w-4" />
          </button>
        ),
      },
    ],
    [handleDeleteFromTable, searchParams, setSearchParams],
  );

  const handleCloseDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <TableLayout<Student>
          result={result}
          loading={loading}
          page={page}
          pageSize={PAGE_SIZE}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearch={handleSearch}
          searchPlaceholder="Tìm theo MSSV, họ tên..."
          middleSlot={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white"
              >
                Thêm hàng loạt
              </button>
            </div>
          }
          columns={columns}
          actions={actions}
          onPageChange={setPage}
        />
      </div>

      <Drawer
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm sinh viên"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <DetailFormLayout>
            <StudentFormFields
              value={createDto}
              onChange={setCreateDto}
              disabled={creating}
            />
          </DetailFormLayout>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="bg-brand-500 hover:bg-brand-600 rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? "Đang thêm..." : "Thêm"}
            </button>
          </div>
        </form>
      </Drawer>

      <Drawer
        isOpen={importOpen}
        onClose={handleCloseImportDrawer}
        title="Thêm hàng loạt"
      >
        <form onSubmit={handleImport} className="flex flex-col gap-4">
          <DetailFormLayout>
            <FormRow
              label="File dữ liệu"
              className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-6"
              labelWidthClassName="w-full sm:w-40"
            >
              <FilePickerField
                inputKey={importOpen ? "open" : "closed"}
                inputRef={fileInputRef}
                file={file}
                accept=".xlsx,.xls,.csv"
                disabled={importing}
                onChange={setFile}
              />
            </FormRow>

            <FormRow label="Cột MSSV">
              <input
                type="number"
                min={1}
                value={importConfig.studentCodeCol}
                onChange={updateImportConfig("studentCodeCol")}
                disabled={importing}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>

            <FormRow label="Cột họ tên">
              <input
                type="number"
                min={1}
                value={importConfig.studentNameCol}
                onChange={updateImportConfig("studentNameCol")}
                disabled={importing}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>

            <FormRow label="Dòng bắt đầu">
              <input
                type="number"
                min={1}
                value={importConfig.startRow}
                onChange={updateImportConfig("startRow")}
                disabled={importing}
                className="w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none dark:border-white/10 dark:text-white"
              />
            </FormRow>
          </DetailFormLayout>

          {file && (
            <div className="mt-2 ">
              {previewError ? (
                <p className="text-sm text-red-500">{previewError}</p>
              ) : previewRows.length === 0 ? (
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
                          length: Math.max(
                            1,
                            ...previewRows.map((row) => row.length),
                          ),
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
                      {previewRows.map((row, idx) => (
                        <tr
                          key={`${idx}-${row.join("|")}`}
                          className="border-b border-gray-50 last:border-b-0 dark:border-white/5"
                        >
                          <td className="w-12 whitespace-nowrap border-r border-gray-100 bg-gray-50 px-2 py-1.5 text-center text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                            {idx + 1}
                          </td>
                          {Array.from({
                            length: Math.max(
                              1,
                              ...previewRows.map((previewRow) => previewRow.length),
                            ),
                          }).map((_, colIdx) => (
                            <td
                              key={`cell-${idx + 1}-${colIdx + 1}`}
                              className="whitespace-nowrap border-r border-gray-100 px-2 py-1.5 text-sm text-gray-700 last:border-r-0 dark:border-white/10 dark:text-white"
                            >
                              {row[colIdx] || "—"}
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
              onClick={handleCloseImportDrawer}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={importing || !file}
              className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {importing ? "Đang thêm..." : "Thêm"}
            </button>
          </div>
        </form>
      </Drawer>

      <StudentDetailDrawer
        studentId={selectedId}
        onClose={handleCloseDetail}
        onStudentChanged={(updated) => {
          queryClient.setQueryData(
            ["students", { page, keyword }],
            (prev: PaginatedResponse<Student> | undefined) =>
              prev
                ? {
                    ...prev,
                    items: prev.items.map((item) =>
                      item.id === updated.id ? updated : item,
                    ),
                  }
                : prev,
          );
        }}
        onStudentDeleted={(studentId) => {
          queryClient.setQueryData(
            ["students", { page, keyword }],
            (prev: PaginatedResponse<Student> | undefined) =>
              prev
                ? {
                    ...prev,
                    items: prev.items.filter((item) => item.id !== studentId),
                    pagination: {
                      ...prev.pagination,
                      total: Math.max(0, prev.pagination.total - 1),
                    },
                  }
                : prev,
          );
          queryClient.invalidateQueries({ queryKey: ["students"] });
        }}
      />
      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Xóa sinh viên"
        subTitle={`Bạn có chắc chắn muốn xóa sinh viên "${deleteTarget?.studentCode ?? ""}${deleteTarget?.studentName ? ` - ${deleteTarget.studentName}` : ""}" không? Hành động này không thể hoàn tác.`}
      />
    </>
  );
};

export default StudentsPage;
