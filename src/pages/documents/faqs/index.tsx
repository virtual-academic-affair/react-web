import { fixRichTextLinks } from "@/components/fields/RichTextEditor";
import { PageTitle } from "@/components/layouts/PageTitle";
import ConfirmModal from "@/components/modal/ConfirmModal";
import TableClampCell from "@/components/table/TableClampCell";
import type { TableAction, TableColumn } from "@/components/table/TableLayout";
import TableLayout from "@/components/table/TableLayout";
import Tag from "@/components/tag/Tag";
import { faqsService } from "@/services/documents/faqs.service";
import type { FAQ } from "@/types/faqs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HiOutlineDocumentAdd } from "react-icons/hi";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import LecturerOnlyFilter from "@/pages/user/documents/components/LecturerOnlyFilter";
import YearRangeFilter, {
  type YearRange,
} from "@/pages/user/documents/components/YearRangeFilter";
import { EMPTY_YEAR_RANGE_STRINGS } from "@/utils/yearRange";
import FAQBulkImportModal from "./components/FAQBulkImportModal";
import FAQCreationDrawer from "./components/FAQCreationDrawer";
import FAQDetailDrawer from "./components/FAQDetailDrawer";

const PAGE_SIZE = 10;
const EMPTY_YEAR_RANGE: YearRange = EMPTY_YEAR_RANGE_STRINGS;

export default function FAQsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State from URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const selectedId = searchParams.get("id") || undefined;

  // UI state
  const [searchValue, setSearchValue] = useState(search);
  const [creationOpen, setCreationOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters (initialized from URL) — same pattern as documents list
  const [lecturerOnlyFilter, setLecturerOnlyFilter] = useState(
    () => searchParams.get("lecturerOnly") === "true",
  );
  const [enrollmentYear, setEnrollmentYear] = useState<YearRange>(() => ({
    fromYear: searchParams.get("enrollFrom") ?? "",
    toYear: searchParams.get("enrollTo") ?? "",
  }));
  const [academicYear, setAcademicYear] = useState<YearRange>(() => ({
    fromYear: searchParams.get("acadFrom") ?? "",
    toYear: searchParams.get("acadTo") ?? "",
  }));

  /** Bật lọc → lecturerOnly=true; tắt → không gửi query param */
  const lecturerOnlyArg = lecturerOnlyFilter ? true : undefined;

  const metadataFilterArg = useMemo(() => {
    const result: Record<string, unknown> = {};
    if (enrollmentYear.fromYear || enrollmentYear.toYear) {
      const obj: Record<string, number> = {};
      if (enrollmentYear.fromYear)
        obj.fromYear = Number(enrollmentYear.fromYear);
      if (enrollmentYear.toYear) obj.toYear = Number(enrollmentYear.toYear);
      result.enrollmentYear = obj;
    }
    if (academicYear.fromYear || academicYear.toYear) {
      const obj: Record<string, number> = {};
      if (academicYear.fromYear) obj.fromYear = Number(academicYear.fromYear);
      if (academicYear.toYear) obj.toYear = Number(academicYear.toYear);
      result.academicYear = obj;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [enrollmentYear, academicYear]);

  const hasFilters =
    lecturerOnlyFilter ||
    Boolean(enrollmentYear.fromYear || enrollmentYear.toYear) ||
    Boolean(academicYear.fromYear || academicYear.toYear);

  const handleClearAllFilters = useCallback(() => {
    setLecturerOnlyFilter(false);
    setEnrollmentYear(EMPTY_YEAR_RANGE);
    setAcademicYear(EMPTY_YEAR_RANGE);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("lecturerOnly");
      next.delete("enrollFrom");
      next.delete("enrollTo");
      next.delete("acadFrom");
      next.delete("acadTo");
      next.set("page", "1");
      return next;
    });
  }, [setSearchParams]);

  // Sync filter state → URL
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (lecturerOnlyArg !== undefined)
          next.set("lecturerOnly", String(lecturerOnlyArg));
        else next.delete("lecturerOnly");

        if (enrollmentYear.fromYear)
          next.set("enrollFrom", enrollmentYear.fromYear);
        else next.delete("enrollFrom");
        if (enrollmentYear.toYear) next.set("enrollTo", enrollmentYear.toYear);
        else next.delete("enrollTo");

        if (academicYear.fromYear) next.set("acadFrom", academicYear.fromYear);
        else next.delete("acadFrom");
        if (academicYear.toYear) next.set("acadTo", academicYear.toYear);
        else next.delete("acadTo");

        return next;
      },
      { replace: true },
    );
  }, [lecturerOnlyArg, enrollmentYear, academicYear, setSearchParams]);

  // Data fetching
  const { data: result, isLoading } = useQuery({
    queryKey: [
      "faqs",
      {
        page,
        search,
        lecturerOnly: lecturerOnlyArg,
        metadataFilter: metadataFilterArg,
      },
    ],
    queryFn: () =>
      faqsService.getFAQs({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        lecturerOnly: lecturerOnlyArg,
        metadataFilter: metadataFilterArg,
      }),
    staleTime: 30 * 1000,
  });

  const columns: TableColumn<FAQ>[] = [
    {
      key: "question",
      header: "Câu hỏi",
      width: "40%",
      render: (item) => (
        <div className="flex min-w-0 flex-col gap-1.5">
          <TableClampCell className="text-sm font-medium text-navy-700 dark:text-white">
            {item.question}
          </TableClampCell>
          {item.lecturerOnly ? (
            <Tag color="#ef4444" className="w-fit text-[10px]" interactive={false}>
              Chỉ giảng viên
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      key: "answerRichText",
      header: "Câu trả lời",
      width: "50%",
      render: (item) => (
        <TableClampCell
          className="tiptap-prose text-navy-700 [&_a]:text-brand-500 dark:[&_a]:text-brand-400 text-sm dark:text-gray-300 [&_a]:underline [&_a:hover]:opacity-80"
          html={fixRichTextLinks(item.answerRichText)}
        />
      ),
    },
  ];

  const handleEdit = (id: string) => {
    setSearchParams((prev) => {
      prev.set("id", id);
      return prev;
    });
  };

  const handleSearch = () => {
    setSearchParams((prev) => {
      if (searchValue) prev.set("search", searchValue);
      else prev.delete("search");
      prev.set("page", "1");
      return prev;
    });
  };

  const resetPage = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", "1");
      return next;
    });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // Use faqId from the new backend schema
      const id = deleteTarget.faqId || (deleteTarget as any).id;
      await faqsService.removeFAQ(id);
      toast.success("Xóa câu hỏi thành công");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi xóa câu hỏi");
    } finally {
      setIsDeleting(false);
    }
  };

  const actions: TableAction<FAQ>[] = [
    {
      key: "view",
      icon: <MdInfoOutline className="h-4 w-4" />,
      label: "Chi tiết",
      onClick: (item) => handleEdit(item.faqId || (item as any).id),
    },
    {
      key: "delete",
      icon: <MdDeleteOutline className="h-4 w-4" />,
      label: "Xóa",
      className:
        "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50",
      onClick: (item) => setDeleteTarget(item),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        <PageTitle
          title="Danh sách câu hỏi thường gặp (FAQ)"
          tabTitle="Danh sách câu hỏi thường gặp (FAQ)"
          icon={HiOutlineDocumentAdd}
        />
        <TableLayout
          result={result || null}
          loading={isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          columns={columns}
          rowAlign="top"
          actions={actions}
          onPageChange={(p) =>
            setSearchParams((prev) => {
              prev.set("page", p.toString());
              return prev;
            })
          }
          pagination={
            result
              ? {
                  currentPage: result.page,
                  totalPages: Math.ceil(result.total / PAGE_SIZE),
                  total: result.total,
                }
              : undefined
          }
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearch={handleSearch}
          searchPlaceholder="Tìm câu hỏi, câu trả lời..."
          middleSlot={
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <LecturerOnlyFilter
                  checked={lecturerOnlyFilter}
                  onChange={(next) => {
                    setLecturerOnlyFilter(next);
                    resetPage();
                  }}
                />
                <YearRangeFilter
                  label="Khóa tuyển sinh"
                  value={enrollmentYear}
                  onChange={(next) => {
                    setEnrollmentYear(next);
                    resetPage();
                  }}
                />
                <YearRangeFilter
                  label="Năm học"
                  value={academicYear}
                  onChange={(next) => {
                    setAcademicYear(next);
                    resetPage();
                  }}
                />

                {hasFilters && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-action-link ml-2 text-xs"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreationOpen(true)}
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
            </div>
          }
        />
      </div>

      <FAQCreationDrawer
        open={creationOpen}
        onClose={() => setCreationOpen(false)}
      />

      <FAQBulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <FAQDetailDrawer
        id={selectedId}
        open={!!selectedId}
        onClose={() => {
          setSearchParams((prev) => {
            prev.delete("id");
            return prev;
          });
        }}
        onFAQDeleted={() => {
          setSearchParams((prev) => {
            prev.delete("id");
            return prev;
          });
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Xác nhận xóa"
        subTitle="Bạn có chắc chắn muốn xóa câu hỏi này không? Sau khi xóa sẽ không thể phục hồi lại được dữ liệu."
        confirmText={isDeleting ? "Đang xóa..." : "Xóa hoàn toàn"}
        danger={true}
      />
    </>
  );
}
