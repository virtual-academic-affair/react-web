import TableLayout from "@/components/table/TableLayout";
import type { TableAction, TableColumn } from "@/components/table/TableLayout";
import { faqsService } from "@/services/documents/faqs.service";
import type { FAQ } from "@/types/faqs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useState } from "react";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { fixRichTextLinks } from "@/components/fields/RichTextEditor";
import { useSearchParams } from "react-router-dom";
import FAQBulkImportModal from "./components/FAQBulkImportModal";
import FAQCreationDrawer from "./components/FAQCreationDrawer";
import FAQDetailDrawer from "./components/FAQDetailDrawer";
import ConfirmModal from "@/components/modal/ConfirmModal";

const PAGE_SIZE = 10;

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

  // Data fetching
  const { data: result, isLoading } = useQuery({
    queryKey: ["faqs", { page, search }],
    queryFn: () =>
      faqsService.getFAQs({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      }),
    staleTime: 30 * 1000,
  });

  const columns: TableColumn<FAQ>[] = [
    {
      key: "question",
      header: "Câu hỏi",
      width: "40%",
      render: (item) => (
        <p className="line-clamp-1 whitespace-normal text-sm font-medium text-navy-700 dark:text-white">
          {item.question}
        </p>
      ),
    },
    {
      key: "answerRichText",
      header: "Câu trả lời",
      width: "50%",
      render: (item) => (
        <div
          className="tiptap-prose line-clamp-1 whitespace-normal text-sm text-navy-700 dark:text-gray-300 [&_a:hover]:opacity-80 [&_a]:text-brand-500 [&_a]:underline dark:[&_a]:text-brand-400"
          dangerouslySetInnerHTML={{ __html: fixRichTextLinks(item.answerRichText) }}
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
        <TableLayout
          result={result || null}
          loading={isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          columns={columns}
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
