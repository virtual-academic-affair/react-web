import { richHtmlAsSingleInlineInsert } from "@/utils/html";
import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import type { RefObject } from "react";
import CancelReasonSuggestionList, {
  type CancelReasonSuggestionListHandle,
  type QuickPickItem,
} from "./CancelReasonSuggestionList";

export const cancelReasonSuggestionPluginKey = new PluginKey(
  "cancelReasonSuggestion",
);

function filterItems(items: QuickPickItem[], query: string): QuickPickItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((i) => i.label.toLowerCase().includes(q));
}

/**
 * Plugin {@link Suggestion}: gõ `@` gợi ý ghi chú nhanh (đăng ký lớp).
 */
export function createCancelReasonSuggestionExtension(
  itemsRef: RefObject<QuickPickItem[]>,
) {
  return Extension.create({
    name: "cancelReasonSuggestion",

    addProseMirrorPlugins() {
      const editor = this.editor;

      return [
        Suggestion({
          editor,
          pluginKey: cancelReasonSuggestionPluginKey,
          char: "@",
          allowSpaces: true,
          command: ({ editor: ed, range, props }) => {
            const item = props as QuickPickItem;
            const chunk = item.insertHtml ?? item.label;
            const inline =
              item.insertHtml != null
                ? richHtmlAsSingleInlineInsert(chunk)
                : chunk;
            ed.chain()
              .focus()
              .deleteRange(range)
              .insertContent(`${inline} `)
              .run();
          },
          items: ({ query }) => filterItems(itemsRef.current, query),
          shouldShow: ({ query }) => {
            const all = itemsRef.current;
            if (!all.length) return false;
            return filterItems(all, query).length > 0;
          },
          render: () => {
            let renderer: ReactRenderer<CancelReasonSuggestionListHandle> | null =
              null;

            const place = (
              el: HTMLElement,
              clientRect?: (() => DOMRect | null) | null,
            ) => {
              const rect = clientRect?.();
              if (!rect) return;
              el.style.position = "fixed";
              el.style.left = `${rect.left}px`;
              el.style.top = `${rect.bottom + 6}px`;
              el.style.zIndex = "10000";
            };

            return {
              onStart: (props) => {
                renderer = new ReactRenderer(CancelReasonSuggestionList, {
                  editor: props.editor,
                  props,
                });
                document.body.appendChild(renderer.element);
                place(renderer.element, props.clientRect);
              },
              onUpdate: (props) => {
                const r = renderer;
                if (!r) return;
                r.updateProps(props);
                place(r.element, props.clientRect);
              },
              onExit: () => {
                renderer?.element.remove();
                renderer?.destroy();
                renderer = null;
              },
              onKeyDown: (keyProps) =>
                renderer?.ref?.onKeyDown(keyProps) ?? false,
            };
          },
        }),
      ];
    },
  });
}
