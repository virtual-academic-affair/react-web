import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MdClose,
  MdFolder,
  MdFolderOpen,
  MdLock,
  MdReplay,
  MdViewSidebar,
  MdAccountTree,
} from "react-icons/md";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import {
  collectCorpusNodeMap,
  computeCorpusNodeStates,
  computeExpandedNodeKeys,
  formatCorpusTimelineLabel,
} from "../corpusTraversalUtils";
import type {
  ChatCorpusTraversal,
  ChatCorpusTreeNode,
  CorpusNodeVisualState,
} from "../types";

export type CorpusTraversalModalMode = "stream" | "review";

export type CorpusTraversalModalViewState = {
  open: boolean;
  mode: CorpusTraversalModalMode;
  traversal: ChatCorpusTraversal;
  previewStepIndex: number | null;
  isReplaying: boolean;
};

type CorpusTraversalModalProps = {
  state: CorpusTraversalModalViewState;
  onClose: () => void;
  onPreviewStepIndexChange: (index: number | null) => void;
  onReplayChange: (isReplaying: boolean) => void;
};

const REPLAY_STEP_MS = 300;

function nodeStateClass(state: CorpusNodeVisualState) {
  switch (state) {
    case "active":
      return "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8] shadow-[0_0_0_1px_rgba(26,115,232,0.25)] animate-pulse dark:border-[#6dabf7] dark:bg-[#1a2b4a] dark:text-[#a8c7fa]";
    case "opened":
      return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-200";
    case "skipped":
      return "border-rose-200 bg-rose-50/80 text-rose-700 opacity-80 dark:border-rose-500/30 dark:bg-rose-950/20 dark:text-rose-200";
    default:
      return "border-transparent bg-transparent text-[#5f6368] opacity-50 dark:text-[#9aa0a6]";
  }
}

function CorpusTreeNodeRow({
  node,
  depth,
  state,
  expanded,
  highlighted,
  onToggle,
  nodeRef,
}: {
  node: ChatCorpusTreeNode;
  depth: number;
  state: CorpusNodeVisualState;
  expanded: boolean;
  highlighted: boolean;
  onToggle?: () => void;
  nodeRef?: (element: HTMLButtonElement | null) => void;
}) {
  const FolderIcon =
    state === "skipped"
      ? MdLock
      : expanded || state === "opened" || state === "active"
        ? MdFolderOpen
        : MdFolder;

  return (
    <button
      ref={nodeRef}
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition-all duration-300 ${nodeStateClass(state)} ${
        highlighted ? "ring-2 ring-[#1a73e8]/40 dark:ring-[#6dabf7]/40" : ""
      }`}
      style={{ marginLeft: depth * 16 }}
    >
      <FolderIcon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate font-medium">{node.title || node.nodeKey}</span>
    </button>
  );
}

function CorpusTreeBranch({
  node,
  depth,
  states,
  expandedKeys,
  highlightedNodeKey,
  onToggle,
  registerNodeRef,
}: {
  node: ChatCorpusTreeNode;
  depth: number;
  states: Map<string, CorpusNodeVisualState>;
  expandedKeys: Set<string>;
  highlightedNodeKey: string | null;
  onToggle: (nodeKey: string) => void;
  registerNodeRef: (nodeKey: string, element: HTMLButtonElement | null) => void;
}) {
  const state = states.get(node.nodeKey) ?? "default";
  const expanded = expandedKeys.has(node.nodeKey);
  const hasChildren = node.children.length > 0;

  return (
    <div className="min-w-0">
      <CorpusTreeNodeRow
        node={node}
        depth={depth}
        state={state}
        expanded={expanded}
        highlighted={highlightedNodeKey === node.nodeKey}
        onToggle={hasChildren ? () => onToggle(node.nodeKey) : undefined}
        nodeRef={(element) => registerNodeRef(node.nodeKey, element)}
      />
      {hasChildren && expanded ? (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <CorpusTreeBranch
              key={child.nodeKey}
              node={child}
              depth={depth + 1}
              states={states}
              expandedKeys={expandedKeys}
              highlightedNodeKey={highlightedNodeKey}
              onToggle={onToggle}
              registerNodeRef={registerNodeRef}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CorpusTreePanel({
  tree,
  states,
  expandedKeys,
  highlightedNodeKey,
}: {
  tree: ChatCorpusTreeNode[];
  states: Map<string, CorpusNodeVisualState>;
  expandedKeys: Set<string>;
  highlightedNodeKey: string | null;
}) {
  const [manualExpandedKeys, setManualExpandedKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const nodeRefs = useRef(new Map<string, HTMLButtonElement | null>());

  const mergedExpandedKeys = useMemo(() => {
    const merged = new Set(expandedKeys);
    for (const key of manualExpandedKeys) {
      merged.add(key);
    }
    return merged;
  }, [expandedKeys, manualExpandedKeys]);

  const toggleExpanded = useCallback((nodeKey: string) => {
    setManualExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
      }
      return next;
    });
  }, []);

  const registerNodeRef = useCallback(
    (nodeKey: string, element: HTMLButtonElement | null) => {
      nodeRefs.current.set(nodeKey, element);
    },
    [],
  );

  useEffect(() => {
    if (!highlightedNodeKey) return;
    const element = nodeRefs.current.get(highlightedNodeKey);
    element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedNodeKey, states]);

  if (!tree.length) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-sm text-[#80868b] dark:text-[#9aa0a6]">
        Chưa có cây chủ đề cho lượt tra cứu này.
      </div>
    );
  }

  return (
    <div className="app-scrollbar-hidden h-full space-y-1 overflow-y-auto p-3">
      {tree.map((node) => (
        <CorpusTreeBranch
          key={node.nodeKey}
          node={node}
          depth={0}
          states={states}
          expandedKeys={mergedExpandedKeys}
          highlightedNodeKey={highlightedNodeKey}
          onToggle={toggleExpanded}
          registerNodeRef={registerNodeRef}
        />
      ))}
    </div>
  );
}

export function CorpusTraversalModal({
  state,
  onClose,
  onPreviewStepIndexChange,
  onReplayChange,
}: CorpusTraversalModalProps) {
  useBodyScrollLock(state.open);
  const [splitView, setSplitView] = useState(true);
  const replayTimerRef = useRef<number | null>(null);

  const effectiveStepIndex =
    state.previewStepIndex ?? Math.max(state.traversal.steps.length - 1, -1);

  const nodeStates = useMemo(
    () =>
      computeCorpusNodeStates(
        state.traversal.tree,
        state.traversal.steps,
        effectiveStepIndex,
      ),
    [effectiveStepIndex, state.traversal.steps, state.traversal.tree],
  );

  const expandedKeys = useMemo(
    () => computeExpandedNodeKeys(state.traversal.tree, nodeStates),
    [nodeStates, state.traversal.tree],
  );

  const highlightedNodeKey = useMemo(() => {
    if (effectiveStepIndex < 0) return null;
    const step = state.traversal.steps[effectiveStepIndex];
    if (!step) return null;
    if (step.nodeKey) return step.nodeKey;
    return step.nodeKeys?.[0] ?? null;
  }, [effectiveStepIndex, state.traversal.steps]);

  const stopReplay = useCallback(() => {
    if (replayTimerRef.current !== null) {
      window.clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    onReplayChange(false);
  }, [onReplayChange]);

  const startReplay = useCallback(() => {
    stopReplay();
    if (!state.traversal.steps.length) return;
    onReplayChange(true);
    onPreviewStepIndexChange(0);
    let index = 0;
    replayTimerRef.current = window.setInterval(() => {
      index += 1;
      if (index >= state.traversal.steps.length) {
        onPreviewStepIndexChange(state.traversal.steps.length - 1);
        stopReplay();
        return;
      }
      onPreviewStepIndexChange(index);
    }, REPLAY_STEP_MS);
  }, [
    onPreviewStepIndexChange,
    onReplayChange,
    state.traversal.steps.length,
    stopReplay,
  ]);

  useEffect(() => {
    if (!state.open) {
      stopReplay();
      onPreviewStepIndexChange(null);
    }
  }, [onPreviewStepIndexChange, state.open, stopReplay]);

  useEffect(() => () => stopReplay(), [stopReplay]);

  if (!state.open) return null;

  const showReplay = state.mode === "review" && state.traversal.steps.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Corpus tree traversal"
        className="relative flex h-[min(82vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#171c26]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-white/10">
          <div>
            <h2 className="text-sm font-semibold text-[#202124] dark:text-white">
              Corpus tree traversal
            </h2>
            <p className="text-xs text-[#80868b] dark:text-[#9aa0a6]">
              Kho tri thức của Giáo vụ số
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSplitView((current) => !current)}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-gray-200 px-3 text-xs font-medium text-[#444746] transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            >
              {splitView ? (
                <MdAccountTree className="h-4 w-4" />
              ) : (
                <MdViewSidebar className="h-4 w-4" />
              )}
              {splitView ? "Chỉ cây" : "Mô tả + cây"}
            </button>
            {showReplay ? (
              <button
                type="button"
                onClick={() => (state.isReplaying ? stopReplay() : startReplay())}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-gray-200 px-3 text-xs font-medium text-[#444746] transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
              >
                <MdReplay className="h-4 w-4" />
                {state.isReplaying ? "Dừng" : "Replay"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label="Đóng modal"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className={`grid min-h-0 flex-1 ${
            splitView ? "grid-cols-1 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" : "grid-cols-1"
          }`}
        >
          {splitView ? (
            <div className="min-h-0 border-b border-gray-200 md:border-r md:border-b-0 dark:border-white/10">
              <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold tracking-wide text-[#80868b] uppercase dark:border-white/5 dark:text-[#9aa0a6]">
                Hành trình duyệt
              </div>
              <div className="app-scrollbar-hidden h-full max-h-[min(58vh,560px)] space-y-1 overflow-y-auto p-3">
                {state.traversal.steps.length ? (
                  state.traversal.steps.map((step, index) => {
                    const active =
                      state.mode === "review" &&
                      effectiveStepIndex === index &&
                      !state.isReplaying;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onMouseEnter={() => {
                          if (state.mode !== "review" || state.isReplaying) {
                            return;
                          }
                          onPreviewStepIndexChange(index);
                        }}
                        onMouseLeave={() => {
                          if (state.mode !== "review" || state.isReplaying) {
                            return;
                          }
                          onPreviewStepIndexChange(null);
                        }}
                        onFocus={() => onPreviewStepIndexChange(index)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          active || effectiveStepIndex === index
                            ? "bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a2b4a] dark:text-[#a8c7fa]"
                            : "text-[#3c4043] hover:bg-gray-50 dark:text-[#d9e2ff] dark:hover:bg-white/5"
                        }`}
                      >
                        {formatCorpusTimelineLabel(step, index)}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-2 py-3 text-sm text-[#80868b] dark:text-[#9aa0a6]">
                    Đang chờ các bước duyệt cây...
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="min-h-0">
            <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold tracking-wide text-[#80868b] uppercase dark:border-white/5 dark:text-[#9aa0a6]">
              Cây chủ đề
            </div>
            <div className="h-full max-h-[min(58vh,560px)]">
              <CorpusTreePanel
                tree={state.traversal.tree}
                states={nodeStates}
                expandedKeys={expandedKeys}
                highlightedNodeKey={highlightedNodeKey}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function buildCorpusModalHighlightedNodeKey(
  traversal: ChatCorpusTraversal,
  stepIndex: number,
) {
  if (stepIndex < 0) return null;
  const step = traversal.steps[stepIndex];
  if (!step) return null;
  if (step.nodeKey) return step.nodeKey;
  return step.nodeKeys?.[0] ?? null;
}

export function getCorpusNodeTitle(
  traversal: ChatCorpusTraversal,
  nodeKey: string,
) {
  return collectCorpusNodeMap(traversal.tree).get(nodeKey)?.title ?? nodeKey;
}
