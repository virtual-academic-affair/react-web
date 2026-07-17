import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  MdAccountTree,
  MdChevronRight,
  MdClose,
  MdLock,
  MdReplay,
  MdViewSidebar,
} from "react-icons/md";
import ReactXarrows from "react-xarrows";

type ReactXarrowsModule = {
  default: ComponentType<Record<string, unknown>>;
  Xwrapper: ComponentType<{ children: ReactNode }>;
};

const { default: Xarrow, Xwrapper } =
  ReactXarrows as unknown as ReactXarrowsModule;

const CORPUS_CONNECTOR_COLOR = "#1a73e8";
const CORPUS_CONNECTOR_DASHNESS = { strokeLen: 5, nonStrokeLen: 8 };
const corpusConnectorHeadShape = {
  svgElem: <polyline points="0,0 1,0.5 0,1" />,
  offsetForward: 0.18,
};

const CONNECTOR_END_GAP_PX = 10;

import { ModalShell } from "@/components/modal/ModalShell";
import Tooltip from "@/components/tooltip/Tooltip";

import {
  buildColumnPathForStepIndex,
  buildConnectorPairsForStep,
  buildConnectorPairsFromView,
  collectCorpusNodeMap,
  computeCorpusNodeStates,
  CORPUS_ROW_FOCUS_STYLE,
  CORPUS_STEP_ACTION_META,
  formatCorpusTimelineLabel,
  getStepTargetNodeKeys,
  highlightedNodeKeyForStep,
  shouldRevealChildrenColumn,
} from "../corpusTraversalUtils";
import type {
  ChatCorpusTraversal,
  ChatCorpusTreeNode,
  CorpusNodeVisualState,
  CorpusTraversalAction,
} from "../types";
import { CorpusActionIcon, CorpusStaticFolderIcon } from "./CorpusActionIcon";

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

const REPLAY_STEP_MS = 2000;
const COLUMN_WIDTH_PX = 280;

type TraversalColumn = {
  parentKey: string | null;
  folders: ChatCorpusTreeNode[];
  depth: number;
};

function sanitizeAnchorId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function corpusTextAnchorId(nodeKey: string) {
  return `corpus-text-end-${sanitizeAnchorId(nodeKey)}`;
}

function corpusIconAnchorId(nodeKey: string) {
  return `corpus-icon-start-${sanitizeAnchorId(nodeKey)}`;
}

function CorpusFolderIcon({
  nodeKey,
  isOpen,
  isSkipped,
  isStepFocus,
  focusAction,
}: {
  nodeKey: string;
  isOpen: boolean;
  isSkipped: boolean;
  isStepFocus: boolean;
  focusAction: CorpusTraversalAction | null;
}) {
  const anchorId = corpusIconAnchorId(nodeKey);

  if (isSkipped) {
    return (
      <span
        id={anchorId}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
      >
        <MdLock
          className="h-4 w-4 text-rose-500 dark:text-rose-300"
          aria-hidden
        />
      </span>
    );
  }

  if (isStepFocus && focusAction) {
    return (
      <span
        id={anchorId}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
        aria-hidden
      >
        <CorpusActionIcon action={focusAction} active size={16} />
      </span>
    );
  }

  return (
    <span
      id={anchorId}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
      aria-hidden
    >
      <CorpusStaticFolderIcon open={isOpen} />
    </span>
  );
}

function buildTraversalColumns(
  tree: ChatCorpusTreeNode[],
  pathKeys: string[],
  revealChildrenOfLast: boolean,
): TraversalColumn[] {
  const columns: TraversalColumn[] = [
    { parentKey: null, folders: tree, depth: 0 },
  ];

  let currentFolders = tree;
  for (let i = 0; i < pathKeys.length; i += 1) {
    const selected = currentFolders.find(
      (folder) => folder.nodeKey === pathKeys[i],
    );
    if (!selected) break;
    const isLast = i === pathKeys.length - 1;
    if (isLast && !revealChildrenOfLast) break;
    columns.push({
      parentKey: selected.nodeKey,
      folders: selected.children ?? [],
      depth: i + 1,
    });
    currentFolders = selected.children ?? [];
  }

  return columns;
}

function TraversalTimeline({
  steps,
  activeIndex,
  isReplaying,
  onPreviewStepIndexChange,
}: {
  steps: ChatCorpusTraversal["steps"];
  activeIndex: number;
  isReplaying: boolean;
  onPreviewStepIndexChange: (index: number | null) => void;
}) {
  const canHover = !isReplaying;
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevVisibleCountRef = useRef(0);
  const prevStepsLengthRef = useRef(steps.length);

  const visibleSteps = isReplaying
    ? steps.slice(0, Math.max(activeIndex + 1, 0))
    : steps;

  const newlyRevealedIndex = isReplaying
    ? visibleSteps.length > prevVisibleCountRef.current
      ? visibleSteps.length - 1
      : -1
    : steps.length > prevStepsLengthRef.current
      ? steps.length - 1
      : -1;

  useEffect(() => {
    prevVisibleCountRef.current = visibleSteps.length;
  }, [visibleSteps.length]);

  useEffect(() => {
    prevStepsLengthRef.current = steps.length;
  }, [steps.length]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const timer = window.setTimeout(() => {
      const activeEl = scroller.querySelector<HTMLElement>(
        `[data-corpus-step-index="${activeIndex}"]`,
      );
      activeEl?.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [activeIndex, visibleSteps.length]);

  if (!steps.length) {
    return (
      <p className="px-2 py-3 text-sm text-[#80868b] dark:text-[#9aa0a6]">
        Đang chờ các bước duyệt cây...
      </p>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="app-scrollbar-hidden overflow-x-auto px-3 py-2.5"
      onMouseLeave={() => {
        if (!canHover) return;
        onPreviewStepIndexChange(null);
      }}
    >
      <div className="flex min-w-max flex-nowrap items-center gap-1.5">
        {visibleSteps.map((step, index) => {
          const active = activeIndex === index;
          const isNewlyRevealed = index === newlyRevealedIndex;
          const isConnectingNewStep =
            newlyRevealedIndex >= 0 && index === newlyRevealedIndex - 1;
          return (
            <div
              key={step.id}
              data-corpus-step-index={index}
              className={`flex shrink-0 items-center gap-1.5 ${isNewlyRevealed ? "corpus-step-slide-in" : ""}`}
            >
              <button
                type="button"
                onMouseEnter={() => {
                  if (!canHover) return;
                  onPreviewStepIndexChange(index);
                }}
                onFocus={() => onPreviewStepIndexChange(index)}
                className={`corpus-step-pill inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-300 ease-out ${
                  active
                    ? "corpus-step-pill-active border-transparent text-white"
                    : "border-gray-200 bg-white text-[#3c4043] hover:border-transparent dark:border-white/10 dark:bg-[#171c26] dark:text-[#d9e2ff] dark:hover:border-transparent"
                } ${!active ? "corpus-step-pill-idle" : ""}`}
              >
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-[#5f6368] dark:bg-white/10 dark:text-gray-300"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                  <CorpusActionIcon
                    action={step.action}
                    active={active}
                    size={15}
                    color={active ? "#ffffff" : undefined}
                  />
                </span>
                <span>
                  {formatCorpusTimelineLabel(step)}
                </span>
              </button>
              {index < visibleSteps.length - 1 ? (
                <span
                  className={`shrink-0 text-base leading-none font-semibold text-gray-400 dark:text-gray-500 ${
                    isConnectingNewStep
                      ? "corpus-step-arrow-slide-in"
                      : index === activeIndex - 1 && isReplaying
                        ? "corpus-step-arrow-pulse"
                        : ""
                  }`}
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CorpusTreePanel({
  tree,
  steps,
  stepIndex,
  isReplaying,
  states,
  highlightedNodeKey,
}: {
  tree: ChatCorpusTreeNode[];
  steps: ChatCorpusTraversal["steps"];
  stepIndex: number;
  isReplaying: boolean;
  states: Map<string, CorpusNodeVisualState>;
  highlightedNodeKey: string | null;
}) {
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const prevColumnsLengthRef = useRef(0);

  const activePath = useMemo(
    () => buildColumnPathForStepIndex(tree, steps, stepIndex),
    [stepIndex, steps, tree],
  );
  const revealChildren = useMemo(
    () => shouldRevealChildrenColumn(tree, steps, stepIndex),
    [stepIndex, steps, tree],
  );
  const columns = useMemo(
    () => buildTraversalColumns(tree, activePath, revealChildren),
    [activePath, revealChildren, tree],
  );
  const currentStep = stepIndex >= 0 ? steps[stepIndex] : undefined;
  const stepFocusKeys = useMemo(
    () => new Set(getStepTargetNodeKeys(currentStep)),
    [currentStep],
  );
  const focusAction = currentStep?.action ?? null;
  const connectorPairs = useMemo(() => {
    if (currentStep) {
      const stepPairs = buildConnectorPairsForStep(tree, currentStep);
      if (stepPairs.length) return stepPairs;
    }
    return buildConnectorPairsFromView(columns, activePath, states);
  }, [activePath, columns, currentStep, states, tree]);
  const connectorColor =
    focusAction != null
      ? CORPUS_STEP_ACTION_META[focusAction].connectorColor
      : CORPUS_CONNECTOR_COLOR;
  const animateConnectors = Boolean(currentStep && focusAction);
  const scrollRafRef = useRef<number | null>(null);

  const notifyXarrowLayoutChange = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      window.dispatchEvent(new Event("resize"));
    });
  }, []);

  useEffect(
    () => () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    notifyXarrowLayoutChange();
  }, [columns.length, connectorColor, notifyXarrowLayoutChange, stepIndex]);

  useEffect(() => {
    if (!highlightedNodeKey) return;
    const element = document.getElementById(
      corpusIconAnchorId(highlightedNodeKey),
    );
    element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedNodeKey, stepFocusKeys, states]);

  useEffect(() => {
    if (columns.length <= prevColumnsLengthRef.current) {
      prevColumnsLengthRef.current = columns.length;
      return;
    }
    prevColumnsLengthRef.current = columns.length;
    const scroller = treeScrollRef.current;
    if (!scroller) return;
    const lastColumn = scroller.querySelector<HTMLElement>(
      ".corpus-col-slot:last-child",
    );
    lastColumn?.scrollIntoView({
      behavior: "smooth",
      inline: "end",
      block: "nearest",
    });
  }, [columns.length]);

  if (!tree.length) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-sm text-[#80868b] dark:text-[#9aa0a6]">
        Chưa có cây chủ đề cho lượt tra cứu này.
      </div>
    );
  }

  return (
    <div
      ref={treeScrollRef}
      className="corpus-columns-scroll app-scrollbar-hidden h-full overflow-x-auto overflow-y-hidden"
      onScroll={notifyXarrowLayoutChange}
    >
      <Xwrapper>
        <div
          key={`tree-${stepIndex}`}
          className="corpus-cols corpus-tree-step-enter relative flex h-full min-w-max items-stretch"
        >
          {columns.map((column, columnIndex) => {
            const hasChildrenColumn = columnIndex < columns.length - 1;

            return (
              <div
                key={`${column.parentKey ?? "root"}-${column.depth}`}
                className="corpus-col-slot flex h-full shrink-0 flex-col"
                style={{ width: COLUMN_WIDTH_PX }}
              >
                <div className="min-h-0 flex-1 overflow-y-auto py-1">
                  {column.folders.length ? (
                    column.folders.map((folder) => {
                      const key = folder.nodeKey;
                      const traversalState = states.get(key) ?? "default";
                      const pathActive = activePath[column.depth] === key;
                      const isStepFocus = stepFocusKeys.has(key);
                      const rowActive =
                        pathActive ||
                        traversalState === "opened" ||
                        traversalState === "active";
                      const showOpenIcon =
                        traversalState !== "skipped" &&
                        (pathActive ||
                          traversalState === "opened" ||
                          traversalState === "active");
                      const hasNext =
                        folder.children.length > 0 &&
                        pathActive &&
                        revealChildren &&
                        hasChildrenColumn;
                      const rowFocusStyle =
                        isStepFocus && focusAction
                          ? {
                              backgroundColor:
                                CORPUS_ROW_FOCUS_STYLE[focusAction]
                                  .backgroundColor,
                            }
                          : undefined;
                      const rowBgClass =
                        !isStepFocus && rowActive ? "bg-brand-500/10" : "";

                      return (
                        <button
                          key={key}
                          type="button"
                          data-corpus-node-key={key}
                          data-corpus-step-focus={
                            isStepFocus ? "true" : undefined
                          }
                          style={rowFocusStyle}
                          className={`corpus-col-item flex h-9 w-full items-center gap-2 px-3 text-left transition-colors duration-300 ${rowBgClass}`}
                        >
                          <CorpusFolderIcon
                            nodeKey={key}
                            isOpen={showOpenIcon}
                            isSkipped={traversalState === "skipped"}
                            isStepFocus={isStepFocus}
                            focusAction={focusAction}
                          />
                          <span
                            id={corpusTextAnchorId(key)}
                            className="text-navy-700 min-w-0 flex-1 truncate text-sm font-medium dark:text-white"
                          >
                            {folder.title || folder.nodeKey}
                          </span>
                          {hasNext ? (
                            <MdChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
                          ) : (
                            <span className="ml-auto h-3.5 w-3.5 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-6 text-center text-xs text-gray-400">
                      Không có chủ đề con
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {connectorPairs.map((pair) => (
            <Xarrow
              key={`${pair.id}-${stepIndex}-${focusAction ?? "default"}-${isReplaying ? "replay" : "live"}`}
              start={corpusTextAnchorId(pair.parentKey)}
              end={corpusIconAnchorId(pair.childKey)}
              startAnchor="right"
              endAnchor={{ position: "left", offset: { x: -CONNECTOR_END_GAP_PX } }}
              color={connectorColor}
              strokeWidth={2}
              path="smooth"
              curveness={0.65}
              _extendSVGcanvas={CONNECTOR_END_GAP_PX}
              showHead
              headSize={5}
              headShape={corpusConnectorHeadShape}
              arrowHeadProps={{
                fill: "none",
                stroke: connectorColor,
                strokeWidth: 0.2,
                strokeLinecap: "round",
                strokeLinejoin: "round",
              }}
              arrowBodyProps={
                animateConnectors
                  ? { className: "corpus-connector-dash-anim" }
                  : undefined
              }
              showTail={false}
              zIndex={1}
              dashness={CORPUS_CONNECTOR_DASHNESS}
            />
          ))}
        </div>
      </Xwrapper>
    </div>
  );
}

export function CorpusTraversalModal({
  state,
  onClose,
  onPreviewStepIndexChange,
  onReplayChange,
}: CorpusTraversalModalProps) {
  const [showTimeline, setShowTimeline] = useState(true);
  const replayTimerRef = useRef<number | null>(null);

  const lastStepIndex = Math.max(state.traversal.steps.length - 1, -1);
  const effectiveStepIndex =
    state.previewStepIndex ?? lastStepIndex;
  const displayStepIndex =
    showTimeline || state.isReplaying
      ? effectiveStepIndex
      : lastStepIndex;

  const nodeStates = useMemo(
    () =>
      computeCorpusNodeStates(
        state.traversal.tree,
        state.traversal.steps,
        displayStepIndex,
      ),
    [displayStepIndex, state.traversal.steps, state.traversal.tree],
  );

  const highlightedNodeKey = useMemo(
    () => highlightedNodeKeyForStep(state.traversal.steps, displayStepIndex),
    [displayStepIndex, state.traversal.steps],
  );

  const currentDisplayStep =
    displayStepIndex >= 0 ? state.traversal.steps[displayStepIndex] : undefined;

  const stopReplay = useCallback(() => {
    if (replayTimerRef.current !== null) {
      window.clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    onReplayChange(false);
  }, [onReplayChange]);

  const handleToggleTimeline = useCallback(() => {
    if (state.isReplaying) return;
    setShowTimeline((current) => {
      const next = !current;
      if (!next) {
        onPreviewStepIndexChange(null);
      }
      return next;
    });
  }, [onPreviewStepIndexChange, state.isReplaying]);

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
      setShowTimeline(true);
    }
  }, [onPreviewStepIndexChange, state.open, stopReplay]);

  useEffect(() => () => stopReplay(), [stopReplay]);

  const showReplay =
    state.mode === "review" && state.traversal.steps.length > 0;

  return (
    <ModalShell
      open={state.open}
      onClose={onClose}
      ariaLabel="Corpus tree traversal"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-4 pb-3">
          <div className="flex items-center justify-start gap-1.5">
            <Tooltip
              label={
                state.isReplaying
                  ? "Đang replay..."
                  : showTimeline
                    ? "Chỉ cây"
                    : "Mô tả + cây"
              }
            >
              <span className="inline-flex">
                <button
                  type="button"
                  onClick={handleToggleTimeline}
                  disabled={state.isReplaying}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[#444746] transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                  aria-label={showTimeline ? "Chỉ cây" : "Mô tả + cây"}
                  aria-disabled={state.isReplaying}
                >
                  {showTimeline ? (
                    <MdAccountTree className="h-4 w-4" />
                  ) : (
                    <MdViewSidebar className="h-4 w-4" />
                  )}
                </button>
              </span>
            </Tooltip>
            {showReplay ? (
              <Tooltip label={state.isReplaying ? "Dừng" : "Replay"}>
                <button
                  type="button"
                  onClick={() =>
                    state.isReplaying ? stopReplay() : startReplay()
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[#444746] transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                  aria-label={state.isReplaying ? "Dừng" : "Replay"}
                >
                  <MdReplay className="h-4 w-4" />
                </button>
              </Tooltip>
            ) : null}
          </div>
          <h2 className="text-center text-base font-medium text-[#202124] dark:text-white">
            Corpus tree traversal
          </h2>
          <div className="flex items-center justify-end">
            <Tooltip label="Đóng">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                aria-label="Đóng modal"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {showTimeline ? (
            <div className="shrink-0 border-b border-gray-200 px-1 pt-1 pb-1 dark:border-white/10">
              <TraversalTimeline
                steps={state.traversal.steps}
                activeIndex={effectiveStepIndex}
                isReplaying={state.isReplaying}
                onPreviewStepIndexChange={onPreviewStepIndexChange}
              />
            </div>
          ) : currentDisplayStep ? (
            <div className="app-scrollbar-hidden flex shrink-0 justify-center overflow-x-auto border-b border-gray-200 px-3 py-2 dark:border-white/10">
              <div
                key={`summary-${displayStepIndex}`}
                className="corpus-step-pill corpus-step-pill-active corpus-step-summary-slide-in inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white"
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                  {displayStepIndex + 1}
                </span>
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                  <CorpusActionIcon
                    action={currentDisplayStep.action}
                    active
                    size={15}
                    color="#ffffff"
                  />
                </span>
                <span>
                  {formatCorpusTimelineLabel(currentDisplayStep)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 px-1 pb-2 pt-1">
            <CorpusTreePanel
              tree={state.traversal.tree}
              steps={state.traversal.steps}
              stepIndex={displayStepIndex}
              isReplaying={state.isReplaying}
              states={nodeStates}
              highlightedNodeKey={highlightedNodeKey}
            />
          </div>
        </div>
      </div>

      <style>{`
          .corpus-col-slot {
            flex-shrink: 0;
            border-right: 1px solid rgb(243 244 246 / 0.9);
          }
          .dark .corpus-col-slot {
            border-right-color: rgb(255 255 255 / 0.08);
          }
          .corpus-col-item {
            -webkit-tap-highlight-color: transparent;
            outline: none !important;
          }
          .corpus-col-item:focus,
          .corpus-col-item:focus-visible,
          .corpus-col-item:active {
            outline: none !important;
          }
          @keyframes corpus-step-slide-in {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .corpus-step-slide-in {
            animation: corpus-step-slide-in 0.48s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @keyframes corpus-step-arrow-slide-in {
            from {
              opacity: 0;
              transform: translateX(-12px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .corpus-step-arrow-slide-in {
            animation: corpus-step-arrow-slide-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
            animation-delay: 0.08s;
          }
          @keyframes corpus-step-summary-slide-in {
            from {
              opacity: 0;
              transform: translateX(-16px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .corpus-step-summary-slide-in {
            animation: corpus-step-summary-slide-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @keyframes corpus-step-arrow-pulse {
            0%, 100% {
              opacity: 0.55;
            }
            50% {
              opacity: 0.95;
            }
          }
          .corpus-step-arrow-pulse {
            animation: corpus-step-arrow-pulse 0.7s ease-in-out 1;
          }
          @keyframes corpus-tree-fade {
            from {
              opacity: 0.88;
            }
            to {
              opacity: 1;
            }
          }
          .corpus-tree-step-enter {
            animation: corpus-tree-fade 0.3s ease-out;
          }
          @keyframes corpus-connector-dash {
            to {
              stroke-dashoffset: -52;
            }
          }
          .corpus-connector-dash-anim {
            animation: corpus-connector-dash 1.15s linear infinite;
          }
          .corpus-step-pill-active {
            background-image: linear-gradient(120deg, #2563eb, #7c3aed, #2563eb);
            background-size: 200% 200%;
            animation: chatbot-nav-gradient-shift 2.6s ease-in-out infinite;
          }
          .corpus-step-pill-idle:hover,
          .corpus-step-pill-idle:focus-visible {
            background-image: linear-gradient(120deg, #2563eb, #7c3aed, #2563eb);
            background-size: 200% 200%;
            animation: chatbot-nav-gradient-shift 2.6s ease-in-out infinite;
            color: #fff;
          }
          .corpus-step-pill-idle:hover > span:first-child,
          .corpus-step-pill-idle:focus-visible > span:first-child {
            background-color: rgb(255 255 255 / 0.2);
            color: #fff;
          }
          @media (prefers-reduced-motion: reduce) {
            .corpus-step-pill-active,
            .corpus-step-pill-idle:hover,
            .corpus-step-pill-idle:focus-visible,
            .corpus-connector-dash-anim,
            .corpus-step-slide-in,
            .corpus-step-arrow-slide-in,
            .corpus-step-summary-slide-in,
            .corpus-step-arrow-pulse,
            .corpus-tree-step-enter {
              animation: none !important;
            }
            .corpus-tree-step-enter {
              opacity: 1 !important;
            }
          }
        `}</style>
    </ModalShell>
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
