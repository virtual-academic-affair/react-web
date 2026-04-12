import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import type { RefObject } from "react";
import InquiryReferenceSuggestionList, {
  type InquiryReferenceFileItem,
  type InquiryReferenceSuggestionListHandle,
  type InquiryReferenceSuggestionItem,
} from "./InquiryReferenceSuggestionList";

export const inquiryReferenceSuggestionPluginKey = new PluginKey(
  "inquiryReferenceSuggestion",
);

function filterItems(
  items: InquiryReferenceFileItem[],
  query: string,
): InquiryReferenceFileItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((i) => i.label.toLowerCase().includes(q));
}

export function createInquiryReferenceSuggestionExtension(
  itemsRef: RefObject<InquiryReferenceFileItem[]>,
) {
  return Extension.create({
    name: "inquiryReferenceSuggestion",

    addProseMirrorPlugins() {
      const editor = this.editor;

      return [
        Suggestion({
          editor,
          pluginKey: inquiryReferenceSuggestionPluginKey,
          char: "@",
          allowSpaces: true,
          command: ({ editor: ed, range, props }) => {
            const item = props as InquiryReferenceSuggestionItem;
            ed.chain().focus().deleteRange(range).insertContent(`${item.insertHtml} `).run();
          },
          items: ({ query }) => filterItems(itemsRef.current, query),
          allowedPrefixes: null,
          shouldShow: ({ editor: activeEditor }) => activeEditor.isFocused,
          render: () => {
            let renderer: ReactRenderer<InquiryReferenceSuggestionListHandle> | null =
              null;

            const POPUP_TOP_OFFSET_PX = 6;
            const POPUP_DATA_ATTR = "data-inquiry-reference-suggestion-popup";

            const cleanupExistingPopups = () => {
              document
                .querySelectorAll<HTMLElement>(`[${POPUP_DATA_ATTR}="true"]`)
                .forEach((el) => el.remove());
            };

            const place = (
              el: HTMLElement,
              clientRect?: (() => DOMRect | null) | null,
            ) => {
              const rect = clientRect?.();
              if (!rect) return;
              el.style.position = "fixed";
              el.style.left = `${rect.left}px`;
              el.style.top = `${rect.bottom + POPUP_TOP_OFFSET_PX}px`;
              el.style.zIndex = "10000";
            };

            return {
              onStart: (props) => {
                renderer?.element.remove();
                renderer?.destroy();
                cleanupExistingPopups();

                renderer = new ReactRenderer(InquiryReferenceSuggestionList, {
                  editor: props.editor,
                  props,
                });
                renderer.element.setAttribute(POPUP_DATA_ATTR, "true");
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
              onKeyDown: (keyProps) => renderer?.ref?.onKeyDown(keyProps) ?? false,
            };
          },
        }),
      ];
    },
  });
}

