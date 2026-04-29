import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { MdDeleteOutline, MdInfoOutline } from "react-icons/md";
import { message as toast } from "antd";
import { fixRichTextLinks } from "@/components/fields/RichTextEditor";

import TableLayout from "@/components/table/TableLayout";
import type { TableColumn, TableAction } from "@/components/table/TableLayout";
import ConfirmModal from "@/components/modal/ConfirmModal";

import type { Form } from "@/types/forms";
import { formsService } from "@/services/documents/forms.service";

import CreationDrawer from "./components/CreationDrawer";
import FormDetailDrawer from "./components/FormDetailDrawer";
import BulkImportModal from "./components/BulkImportModal";

const PAGE_SIZE = 10;

export default function FormsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State từ URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const keyword = searchParams.get("keyword") || "";
  const selectedId = searchParams.get("id") || undefined;

  // Local UI state
  const [searchValue, setSearchValue] = useState(keyword);
  const [creationOpen, setCreationOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Data fetching
  const { data: result, isFetching } = useQuery({
    queryKey: ["forms", { page, keyword }],
    queryFn: () =>
      formsService.getForms({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
      }),
    staleTime: 30 * 1000, // 30s cache
  });

  // Table Configuration
  const columns: TableColumn<Form>[] = [
    {
      key: "documentType",
      header: "Loại văn bản",
      render: (item) => (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-navy-700 dark:text-white">
            {item.documentType}
          </p>
        </div>
      ),
    },
    {
      key: "contentLink",
      header: "Nội dung & Phạm vi áp dụng",
      render: (item) => (
        <div
          className="tiptap-prose text-sm text-navy-700 dark:text-white [&_a]:text-brand-500 [&_a:hover]:underline dark:[&_a]:text-brand-400 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: fixRichTextLinks(item.contentLink || "") }}
        />
      ),
    },
    {
      key: "notes",
      header: "Ghi chú",
      render: (item) => (
        <div
          className="tiptap-prose text-sm text-navy-700 dark:text-white [&_a]:text-brand-500 [&_a:hover]:underline dark:[&_a]:text-brand-400 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: fixRichTextLinks(item.notes || "") }}
        />
      ),
    },
  ];

  // Actions
  const handleEdit = (id: string) => {
    setSearchParams((prev) => {
      prev.set("id", id.toString());
      return prev;
    });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      await formsService.removeForm(deleteTarget);
      toast.success("Xóa biểu mẫu thành công");

      // Cập nhật query data (Optimistic update)
      queryClient.setQueryData(
        ["forms", { page, keyword }],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((item: Form) => item.id !== deleteTarget),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1),
            },
          };
        },
      );
      
      // Xóa form cache
      queryClient.removeQueries({ queryKey: ["form", deleteTarget] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi khi xóa biểu mẫu");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSearch = () => {
    setSearchParams((prev) => {
      if (searchValue) {
        prev.set("keyword", searchValue);
      } else {
        prev.delete("keyword");
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  const actions: TableAction<Form>[] = [
    {
      key: "view",
      icon: <MdInfoOutline className="h-4 w-4" />,
      label: "Chi tiết",
      onClick: (item) => handleEdit(item.id),
      // Not passing className will default to blue rounded square like students page
    },
    {
      key: "delete",
      icon: <MdDeleteOutline className="h-4 w-4" />,
      label: "Xóa",
      className: "flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500 text-white transition-colors hover:bg-red-600 disabled:opacity-50",
      onClick: (item) => setDeleteTarget(item.id),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        <TableLayout
          result={result || null}
          loading={isFetching}
          page={page}
          pageSize={PAGE_SIZE}
          columns={columns}
          actions={actions}
          onPageChange={handlePageChange}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearch={handleSearch}
          searchPlaceholder="Tìm theo loại văn bản..."
          middleSlot={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreationOpen(true)}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Thêm hàng loạt
              </button>
            </div>
          }
        />
      </div>

      <CreationDrawer
        open={creationOpen}
        onClose={() => setCreationOpen(false)}
      />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <FormDetailDrawer
        id={selectedId}
        open={!!selectedId}
        onClose={() => {
          setSearchParams((prev) => {
            prev.delete("id");
            return prev;
          });
        }}
        onFormChanged={(updated) => {
          queryClient.setQueryData(
            ["forms", { page, keyword }],
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.map((item: Form) =>
                  item.id === updated.id ? updated : item,
                ),
              };
            },
          );
        }}
        onFormDeleted={(id) => {
          queryClient.setQueryData(
            ["forms", { page, keyword }],
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.filter((item: Form) => item.id !== id),
                pagination: {
                  ...old.pagination,
                  total: Math.max(0, old.pagination.total - 1),
                },
              };
            },
          );
          queryClient.removeQueries({ queryKey: ["form", id] });
        }}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Xác nhận xóa"
        subTitle="Bạn có chắc chắn muốn xóa biểu mẫu này không? Sau khi xóa sẽ không thể phục hồi lại được dữ liệu."
        confirmText="Xóa hoàn toàn"
        danger={true}
      />
    </>
  );
}
