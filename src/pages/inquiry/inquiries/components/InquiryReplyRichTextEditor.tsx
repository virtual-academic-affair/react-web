import RichTextEditor, {
  type RichTextEditorHandle,
} from "@/components/fields/RichTextEditor";
import { DocumentsService } from "@/services/documents";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { createInquiryReferenceSuggestionExtension } from "./inquiryReferenceSuggestionExtension";
import type { InquiryReferenceFileItem } from "./InquiryReferenceSuggestionList";

type BaseProps = React.ComponentProps<typeof RichTextEditor>;

export type InquiryReplyRichTextEditorProps = Omit<BaseProps, "extraExtensions">;

const InquiryReplyRichTextEditor = React.forwardRef<
  RichTextEditorHandle,
  InquiryReplyRichTextEditorProps
>((props, ref) => {
  const { data: filesData } = useQuery({
    queryKey: ["inquiry-reference-files"],
    queryFn: () =>
      DocumentsService.listFiles({
        page: 1,
        limit: 100,
      }),
    staleTime: 60 * 1000,
  });

  const suggestionItems = React.useMemo<InquiryReferenceFileItem[]>(() => {
    const files = (filesData?.files ?? []) as Array<any>;
    return files
      .map((file) => {
        const fileId = String(file?.fileId ?? "").trim();
        const label = String(file?.displayName || file?.originalFilename || "").trim();
        if (!fileId || !label) return null;
        return {
          id: fileId,
          fileId,
          label,
        } as InquiryReferenceFileItem;
      })
      .filter(Boolean) as InquiryReferenceFileItem[];
  }, [filesData]);

  const itemsRef = React.useRef<InquiryReferenceFileItem[]>(suggestionItems);
  React.useEffect(() => {
    itemsRef.current = suggestionItems;
  }, [suggestionItems]);

  const extraExtensions = React.useMemo(
    () => [createInquiryReferenceSuggestionExtension(itemsRef)],
    [],
  );

  return <RichTextEditor ref={ref} {...props} extraExtensions={extraExtensions} />;
});

InquiryReplyRichTextEditor.displayName = "InquiryReplyRichTextEditor";

export default InquiryReplyRichTextEditor;

