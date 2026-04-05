import { richHtmlAsSingleInlineInsert } from "@/utils/html";
import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import { forwardRef, useImperativeHandle, useState } from "react";

export type QuickPickItem = {
  id: string;
  label: string;
  insertHtml?: string;
};

export type CancelReasonSuggestionListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

type Props = SuggestionProps<QuickPickItem, QuickPickItem>;

const SuggestionListBody = forwardRef<CancelReasonSuggestionListHandle, Props>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelected((i) => (items.length ? (i + 1) % items.length : 0));
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelected((i) =>
              items.length ? (i - 1 + items.length) % items.length : 0,
            );
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const item = items[selected];
            if (item) command(item);
            return true;
          }
          return false;
        },
      }),
      [items, selected, command],
    );

    if (!items.length) {
      return (
        <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg dark:border-white/10 dark:bg-gray-900 dark:text-gray-400">
          Không có lựa chọn
        </div>
      );
    }

    return (
      <div className="max-h-56 max-w-[360px] min-w-[220px] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-gray-900">
        {items.map((item, index) => {
          const rawHtml = item.insertHtml?.trim() ?? "";
          const previewHtml = rawHtml
            ? richHtmlAsSingleInlineInsert(rawHtml)
            : "";
          const showRich = Boolean(previewHtml.trim());
          const selectedCls =
            index === selected
              ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
              : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10";
          const previewCls =
            "line-clamp-2 min-w-0 max-w-full text-left text-sm leading-snug break-words";

          return (
            <button
              key={item.id}
              type="button"
              className={`w-full rounded-2xl px-3 py-2 text-left transition-colors ${selectedCls}`}
              onClick={() => command(item)}
            >
              {showRich ? (
                <span
                  className={`${previewCls} prose prose-sm max-w-none text-inherit dark:prose-invert prose-p:my-0 prose-headings:my-0 prose-strong:font-semibold prose-a:text-inherit`}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <span className={`${previewCls} block`}>{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  },
);

SuggestionListBody.displayName = "SuggestionListBody";

const CancelReasonSuggestionList = forwardRef<
  CancelReasonSuggestionListHandle,
  Props
>((props, ref) => {
  const listKey = props.items.map((i) => i.id).join("|") || "empty";
  return <SuggestionListBody key={listKey} ref={ref} {...props} />;
});

CancelReasonSuggestionList.displayName = "CancelReasonSuggestionList";

export default CancelReasonSuggestionList;
