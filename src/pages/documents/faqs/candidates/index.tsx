import TableLayout from "@/components/table/TableLayout";
import type { TableAction, TableColumn } from "@/components/table/TableLayout";
import { faqsService } from "@/services/documents/faqs.service";
import type { FAQCandidate } from "@/types/faqs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useState } from "react";
import {
  MdInfoOutline,
  MdList,
  MdPendingActions,
} from "react-icons/md";
import { fixRichTextLinks } from "@/components/fields/RichTextEditor";
import { useSearchParams } from "react-router-dom";
import CandidateDetailDrawer from "../components/CandidateDetailDrawer";
import CandidateStatusSelector from "../components/CandidateStatusSelector";

const PAGE_SIZE = 10;

export default function ProposedFAQsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State from URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const selectedId = searchParams.get("id") || undefined;
  const view = searchParams.get("view") || "pending"; // pending or all

  // UI state
  const [searchValue, setSearchValue] = useState(search);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Data fetching
  const { data: result, isLoading, error } = useQuery({
    queryKey: ["faq-candidates", { page, search, view }],
    queryFn: async () => {
      const data = await faqsService.getCandidates({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: view === "pending" ? "pending" : undefined,
      });
      return data;
    },
    staleTime: 30 * 1000,
  });

  const { mutate: review } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      faqsService.reviewCandidate(id, action),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "approve" ? "Đã duyệt câu hỏi" : "Đã từ chối câu hỏi"
      );
      
      // Simply invalidate queries and let React Query handle the background refetch
      queryClient.invalidateQueries({ queryKey: ["faq-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi xử lý câu hỏi");
    },
    onSettled: (_, __, variables) => {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(variables.id);
        return next;
      });
    }
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    if (newStatus === "pending") return;
    
    // Map status 'approved'/'rejected' to action 'approve'/'reject' for backend
    const action = newStatus === "approved" ? "approve" : "reject";
    
    setUpdatingIds(prev => new Set(prev).add(id));
    review({ id, action: action as any });
  };

  const { mutate: triggerSynth, isPending: isSynthing } = useMutation({
    mutationFn: () =>
      faqsService.triggerSynthesis({
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      toast.success("Tiến trình tổng hợp đã bắt đầu. Vui lòng đợi vài phút.");
      queryClient.invalidateQueries({ queryKey: ["faq-candidates"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Lỗi khi chạy tổng hợp");
    },
  });

  const columns: TableColumn<FAQCandidate>[] = [
    {
      key: "question",
      header: "Câu hỏi đề xuất",
      width: "40%",
      render: (item) => (
        <p className="line-clamp-1 whitespace-normal text-sm font-medium text-navy-700 dark:text-white">
          {item.question}
        </p>
      ),
    },
    {
      key: "answerDraftRichText",
      header: "Câu trả lời dự thảo",
      width: "50%",
      render: (item) => (
        <div
          className="tiptap-prose line-clamp-1 whitespace-normal text-sm text-navy-700 dark:text-gray-300 [&_a:hover]:opacity-80 [&_a]:text-brand-500 [&_a]:underline [&_p]:inline dark:[&_a]:text-brand-400"
          dangerouslySetInnerHTML={{ __html: fixRichTextLinks(item.answerDraftRichText) }}
        />
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "150px",
      render: (item) => (
        <CandidateStatusSelector
          value={item.status}
          onChange={(val) => handleStatusChange(item.candidateId || (item as any).id, val)}
          disabled={updatingIds.has(item.candidateId || (item as any).id) || item.status !== "pending"}
        />
      ),
    },
  ];

  const handleOpenDetail = (id: string) => {
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

  const handleTabChange = (newView: string) => {
    setSearchParams((prev) => {
      prev.set("view", newView);
      prev.set("page", "1");
      return prev;
    });
  };

  const actions: TableAction<FAQCandidate>[] = [
    {
      key: "view",
      icon: <MdInfoOutline className="h-4 w-4" />,
      label: "Chi tiết",
      onClick: (item) => handleOpenDetail(item.candidateId || (item as any).id),
    },
  ];

  const selectedCandidate = result?.items.find((i) => (i.candidateId || i.id) === selectedId);

  return (
    <>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-500 dark:bg-red-500/10">
            Lỗi khi lấy dữ liệu: {(error as any)?.response?.data?.message || error.message}. 
          </div>
        )}

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
          searchPlaceholder="Tìm câu hỏi, câu trả lời đề xuất..."
          middleSlot={
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex p-1 bg-gray-100 dark:bg-navy-800 rounded-xl">
                <button
                  onClick={() => handleTabChange("pending")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg ${
                    view === "pending" 
                      ? "bg-white dark:bg-navy-700 text-brand-500 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <MdPendingActions className="h-4 w-4" />
                  Chờ duyệt
                </button>
                <button
                  onClick={() => handleTabChange("all")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg ${
                    view === "all" 
                      ? "bg-white dark:bg-navy-700 text-brand-500 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <MdList className="h-4 w-4" />
                  Tất cả
                </button>
              </div>

              <button
                type="button"
                onClick={() => triggerSynth()}
                disabled={isSynthing}
                className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSynthing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang chạy...
                  </>
                ) : (
                  "Tổng hợp câu hỏi"
                )}
              </button>
            </div>
          }
          emptyMessage={
            <div className="flex flex-col items-center gap-2 py-10">
              <p className="text-gray-500">
                {view === "pending" ? "Không có câu hỏi nào đang chờ duyệt." : "Không có lịch sử đề xuất nào."}
              </p>
              {view === "pending" && (
                <button 
                  onClick={() => triggerSynth()}
                  className="text-brand-500 hover:underline font-medium text-sm"
                >
                  Nhấn vào đây để chạy tổng hợp từ hội thoại email
                </button>
              )}
            </div>
          }
        />
      </div>

      <CandidateDetailDrawer
        candidate={selectedCandidate}
        open={!!selectedId}
        onClose={() => {
          setSearchParams((prev) => {
            prev.delete("id");
            return prev;
          });
        }}
      />
    </>
  );
}
