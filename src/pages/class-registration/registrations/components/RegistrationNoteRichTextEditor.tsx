import RichTextEditor, {
  type RichTextEditorHandle,
} from "@/components/fields/RichTextEditor";
import React from "react";
import type { QuickPickItem } from "./CancelReasonSuggestionList";
import { createCancelReasonSuggestionExtension } from "./cancelReasonSuggestionExtension";

type BaseProps = React.ComponentProps<typeof RichTextEditor>;

export type RegistrationNoteRichTextEditorProps = Omit<
  BaseProps,
  "extraExtensions"
> & {
  suggestionItems: QuickPickItem[];
};

/**
 * Rich text + gợi ý `@` (ghi chú nhanh). Drawer chi tiết đăng ký lớp + màn tạo đăng ký.
 */
const RegistrationNoteRichTextEditor = React.forwardRef<
  RichTextEditorHandle,
  RegistrationNoteRichTextEditorProps
>(({ suggestionItems, ...rest }, ref) => {
  const itemsRef = React.useRef<QuickPickItem[]>(suggestionItems);
  React.useEffect(() => {
    itemsRef.current = suggestionItems;
  }, [suggestionItems]);

  const extraExtensions = React.useMemo(
    () => [
      // Ref chỉ đọc trong plugin khi người dùng gõ @, không đọc trong render.
      createCancelReasonSuggestionExtension(itemsRef),
    ],
    [],
  );

  return (
    <RichTextEditor ref={ref} {...rest} extraExtensions={extraExtensions} />
  );
});

RegistrationNoteRichTextEditor.displayName = "RegistrationNoteRichTextEditor";

export default RegistrationNoteRichTextEditor;
