import { CopyableText } from "@/components/copyable/CopyableText";
import { FormRow } from "@/components/layouts/DetailFormLayout";
import { classRegistrationsService } from "@/services/class-registration";
import { messagesService } from "@/services/email";
import { ApiError } from "@/services/http";
import { inquiriesService } from "@/services/inquiry";
import type { CreateClassRegistrationDto } from "@/types/classRegistration";
import type { Message } from "@/types/email";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message as toast } from "antd";
import { useCallback } from "react";
import DeeplinkClassRegistrationSection from "./DeeplinkClassRegistrationSection";
import DeeplinkInquirySection from "./DeeplinkInquirySection";
import DeeplinkPillActionButton from "./DeeplinkPillActionButton";

interface Props {
  message: Message;
  threadId?: string | null;
  gmailMessageId?: string | null;
}

function displayNameFromQuotedOrRaw(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const m = t.match(/"([^"]*)"/);
  const segment = m ? m[1] : t;
  return segment.replace(/,/g, "").replace(/\s+/g, " ").trim();
}

function StudentSummaryFromMessage({ message: m }: { message: Message }) {
  const fullName = displayNameFromQuotedOrRaw(
    m.student?.studentName?.trim() || m.senderName?.trim() || "",
  );
  const mssv = m.student?.studentCode?.trim() || m.studentCode?.trim() || "";
  if (!fullName && !mssv) return null;
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <div className="flex flex-col gap-2">
        <FormRow label="Họ tên" labelWidthClassName="w-[88px]" dense>
          <CopyableText text={fullName} variant="plain" className="text-sm" />
        </FormRow>
        <FormRow label="MSSV" labelWidthClassName="w-[88px]" dense>
          <CopyableText text={mssv} variant="plain" className="text-sm" />
        </FormRow>
      </div>
    </div>
  );
}

const BusinessCardsView: React.FC<Props> = ({
  message,
  threadId,
  gmailMessageId,
}) => {
  const queryClient = useQueryClient();

  const {
    data: messageDetail,
    isLoading: detailLoading,
    isFetched: detailFetched,
  } = useQuery({
    queryKey: ["gmail-deeplink-message-detail", message.id],
    queryFn: () => messagesService.getMessageById(message.id),
    staleTime: 15 * 1000,
  });

  const fullMessage = messageDetail ?? message;

  const classRegShell = fullMessage.classRegistration;
  const classRegHasItems =
    Array.isArray(classRegShell?.items) && classRegShell.items.length > 0;

  const { data: classRegHydrated, isLoading: classRegHydratedLoading } =
    useQuery({
      queryKey: [
        "gmail-deeplink-classReg-full",
        fullMessage.id,
        classRegShell?.id ?? 0,
      ],
      queryFn: async () => {
        if (classRegShell?.id != null) {
          return classRegistrationsService.getById(classRegShell.id);
        }
        const res = await classRegistrationsService.getList({
          messageId: fullMessage.id,
          page: 1,
          limit: 1,
        });
        const row = res.items[0];
        if (!row) return null;
        return classRegistrationsService.getById(row.id);
      },
      enabled:
        !!fullMessage.id &&
        detailFetched &&
        (!classRegShell || !classRegHasItems),
    });

  const bumpMessageQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["gmail-deeplink-message-detail", message.id],
    });
    void queryClient.invalidateQueries({
      queryKey: ["gmail-deeplink-classReg-full", message.id],
    });
    void queryClient.invalidateQueries({
      queryKey: ["gmail-deeplink-message", threadId, gmailMessageId],
    });
  }, [queryClient, message.id, threadId, gmailMessageId]);

  const createRegistrationMutation = useMutation({
    mutationFn: async () => {
      const dto: CreateClassRegistrationDto = {
        messageId: fullMessage.id,
        studentCode: "",
        studentName: "",
        academicYear: new Date().getFullYear(),
        note: "",
        items: [],
      };
      return classRegistrationsService.create(dto);
    },
    onSuccess: () => {
      void toast.success("Đã tạo đăng ký lớp.");
      bumpMessageQueries();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Không tạo được đăng ký lớp.";
      void toast.error(msg);
    },
  });

  const createInquiryMutation = useMutation({
    mutationFn: () =>
      inquiriesService.create({
        messageId: fullMessage.id,
        types: [],
        question: "",
      }),
    onSuccess: () => {
      void toast.success("Đã tạo thắc mắc.");
      bumpMessageQueries();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Không tạo được thắc mắc.";
      void toast.error(msg);
    },
  });

  const createFooterBusy =
    createRegistrationMutation.isPending || createInquiryMutation.isPending;

  const reg =
    classRegHydrated ??
    (classRegHasItems && classRegShell ? classRegShell : null) ??
    null;
  const inq = fullMessage.inquiry ?? null;

  const detailReady = detailFetched && !detailLoading;
  const classRegLookupDone = !classRegHydratedLoading;
  const showCreateRegistration =
    detailReady && classRegLookupDone && reg == null;
  const showCreateInquiry = detailReady && inq == null;
  const showDeeplinkCreateFooter = showCreateRegistration || showCreateInquiry;

  return (
    <div className="flex min-h-screen flex-col">
      <div
        className={`mx-auto flex w-full max-w-lg flex-1 flex-col gap-2 ${showDeeplinkCreateFooter ? "pb-16" : ""}`}
      >
        {detailLoading && !messageDetail ? (
          <div className="flex justify-center py-6">
            <div className="border-t-brand-500 h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-transparent" />
          </div>
        ) : null}

        <StudentSummaryFromMessage message={fullMessage} />

        {classRegHydratedLoading &&
        !reg &&
        detailFetched &&
        !classRegHasItems ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Đang tải chi tiết đăng kí lớp…
          </div>
        ) : null}

        {reg ? (
          <DeeplinkClassRegistrationSection
            registration={reg}
            onChanged={bumpMessageQueries}
          />
        ) : null}

        {inq ? (
          <DeeplinkInquirySection
            key={inq.id}
            inquiry={inq}
            onChanged={bumpMessageQueries}
          />
        ) : null}
      </div>

      {showDeeplinkCreateFooter ? (
        <footer className="dark:bg-navy-950/95 sticky bottom-0 z-10 mt-auto border-t border-gray-200 px-4 py-2 backdrop-blur-md dark:border-white/10">
          <div className="mx-auto flex w-full max-w-lg gap-3">
            {showCreateRegistration ? (
              <DeeplinkPillActionButton
                variant="secondary"
                disabled={createFooterBusy}
                label="Tạo đăng ký lớp"
                onClick={() => void createRegistrationMutation.mutate()}
              />
            ) : null}
            {showCreateInquiry ? (
              <DeeplinkPillActionButton
                variant="primary"
                disabled={createFooterBusy}
                label="Tạo thắc mắc"
                onClick={() => void createInquiryMutation.mutate()}
              />
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
};

export default BusinessCardsView;
