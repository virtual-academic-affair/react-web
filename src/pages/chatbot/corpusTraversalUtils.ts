import type {
  ChatCorpusTraversal,
  ChatCorpusTraversalStep,
  ChatCorpusTreeNode,
  ChatReasoningStep,
  CorpusNodeVisualState,
  CorpusTraversalAction,
} from "./types";

export const CORPUS_TRAVERSAL_SUMMARY_TYPE = "corpus_traversal_summary";
export const CORPUS_TRAVERSAL_SUMMARY_LABEL =
  "Corpus tree traversal trong kho tri thức của Giáo vụ số";

export const CORPUS_TRAVERSAL_STREAM_END_TYPE = "corpus_traversal_end";

const HIDDEN_REASONING_TYPES = new Set([
  "corpus_tree",
  "corpus_traversal",
  CORPUS_TRAVERSAL_STREAM_END_TYPE,
  CORPUS_TRAVERSAL_SUMMARY_TYPE,
  "reasoning",
  "thought",
]);

export function emptyCorpusTraversal(): ChatCorpusTraversal {
  return { tree: [], steps: [] };
}

const QUERY_ANALYSIS_PLACEHOLDER_RE = /^Phân tích câu hỏi của người dùng/i;

function visibleQueryAnalysisSteps(
  steps: ChatReasoningStep[],
): ChatReasoningStep[] {
  const querySteps = steps.filter((step) => step.type === "query_analysis");
  if (querySteps.length <= 1) return querySteps;
  const substantive = querySteps.filter(
    (step) => !QUERY_ANALYSIS_PLACEHOLDER_RE.test(step.content.trim()),
  );
  return substantive.length ? substantive : querySteps.slice(-1);
}

export function normalizeCorpusTreeNodes(raw: unknown): ChatCorpusTreeNode[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((node): ChatCorpusTreeNode | null => {
      if (!node || typeof node !== "object") return null;
      const candidate = node as Record<string, unknown>;
      const nodeKey =
        typeof candidate.nodeKey === "string"
          ? candidate.nodeKey
          : typeof candidate.node_key === "string"
            ? candidate.node_key
            : "";
      if (!nodeKey.trim()) return null;
      const title =
        typeof candidate.title === "string" ? candidate.title.trim() : "";
      const children = normalizeCorpusTreeNodes(candidate.children);
      return { nodeKey, title, children };
    })
    .filter((node): node is ChatCorpusTreeNode => node !== null);
}

function parseTraversalAction(value: unknown): CorpusTraversalAction | null {
  if (
    value === "expand" ||
    value === "inspect" ||
    value === "select" ||
    value === "no_match"
  ) {
    return value;
  }
  return null;
}

export function parseCorpusTraversalStep(
  raw: Record<string, unknown>,
): ChatCorpusTraversalStep | null {
  const action = parseTraversalAction(raw.action);
  if (!action) return null;
  const content = typeof raw.content === "string" ? raw.content.trim() : "";
  if (!content) return null;

  const step: ChatCorpusTraversalStep = {
    id: `corpus-step-${crypto.randomUUID()}`,
    action,
    content,
  };
  const nodeKey =
    typeof raw.nodeKey === "string"
      ? raw.nodeKey
      : typeof raw.node_key === "string"
        ? raw.node_key
        : undefined;
  if (nodeKey?.trim()) {
    step.nodeKey = nodeKey.trim();
  }
  const nodeKeysRaw = raw.nodeKeys ?? raw.node_keys;
  if (Array.isArray(nodeKeysRaw)) {
    const nodeKeys = nodeKeysRaw
      .filter((value): value is string => typeof value === "string" && !!value.trim())
      .map((value) => value.trim());
    if (nodeKeys.length) {
      step.nodeKeys = nodeKeys;
    }
  }
  return step;
}

export function buildCorpusTraversalFromRawSteps(
  rawSteps: unknown[],
): ChatCorpusTraversal | undefined {
  let tree: ChatCorpusTreeNode[] = [];
  const steps: ChatCorpusTraversalStep[] = [];

  for (const raw of rawSteps) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Record<string, unknown>;
    const type = typeof candidate.type === "string" ? candidate.type.trim() : "";
    if (type === "corpus_tree") {
      const parsedTree = normalizeCorpusTreeNodes(candidate.tree);
      if (parsedTree.length) {
        tree = parsedTree;
      }
      continue;
    }
    if (type === "corpus_traversal") {
      const parsed = parseCorpusTraversalStep(candidate);
      if (parsed) {
        steps.push(parsed);
      }
    }
  }

  if (!tree.length && !steps.length) return undefined;
  return { tree, steps };
}

export function applyCorpusTreeToMessage(
  traversal: ChatCorpusTraversal | undefined,
  tree: ChatCorpusTreeNode[],
): ChatCorpusTraversal {
  const current = traversal ?? emptyCorpusTraversal();
  return {
    ...current,
    tree: tree.length ? tree : current.tree,
  };
}

export function appendCorpusTraversalStep(
  traversal: ChatCorpusTraversal | undefined,
  step: ChatCorpusTraversalStep,
): ChatCorpusTraversal {
  const current = traversal ?? emptyCorpusTraversal();
  return {
    ...current,
    steps: [...current.steps, step],
  };
}

export function hasCorpusTraversalData(
  traversal: ChatCorpusTraversal | undefined,
): boolean {
  return Boolean(traversal?.tree.length || traversal?.steps.length);
}

export function buildCorpusTraversalSummaryStep(): ChatReasoningStep {
  return {
    id: "corpus-traversal-summary",
    type: CORPUS_TRAVERSAL_SUMMARY_TYPE,
    content: CORPUS_TRAVERSAL_SUMMARY_LABEL,
  };
}

export function buildDisplayReasoningSteps(
  reasoningSteps: ChatReasoningStep[] | undefined,
  corpusTraversal: ChatCorpusTraversal | undefined,
  options?: { corpusStreamPhaseActive?: boolean },
): ChatReasoningStep[] {
  const visible = (reasoningSteps ?? []).filter(
    (step) => !HIDDEN_REASONING_TYPES.has(step.type),
  );

  if (
    options?.corpusStreamPhaseActive &&
    hasCorpusTraversalData(corpusTraversal)
  ) {
    return [
      ...visibleQueryAnalysisSteps(visible),
      buildCorpusTraversalSummaryStep(),
    ];
  }

  if (!hasCorpusTraversalData(corpusTraversal)) {
    return visible;
  }

  const summaryStep = buildCorpusTraversalSummaryStep();
  const querySteps = visibleQueryAnalysisSteps(visible);
  const postCorpusSteps = visible.filter((step) => step.type !== "query_analysis");
  return [...querySteps, summaryStep, ...postCorpusSteps];
}

export function walkCorpusTree(
  nodes: ChatCorpusTreeNode[],
  visitor: (node: ChatCorpusTreeNode, depth: number) => void,
  depth = 0,
) {
  for (const node of nodes) {
    visitor(node, depth);
    if (node.children.length) {
      walkCorpusTree(node.children, visitor, depth + 1);
    }
  }
}

export function collectCorpusNodeMap(tree: ChatCorpusTreeNode[]) {
  const map = new Map<string, ChatCorpusTreeNode>();
  walkCorpusTree(tree, (node) => {
    map.set(node.nodeKey, node);
  });
  return map;
}

export function computeExpandedNodeKeys(
  tree: ChatCorpusTreeNode[],
  states: Map<string, CorpusNodeVisualState>,
) {
  const expanded = new Set<string>();
  walkCorpusTree(tree, (node) => {
    const state = states.get(node.nodeKey) ?? "default";
    if (state === "opened" || state === "active") {
      expanded.add(node.nodeKey);
    }
  });
  return expanded;
}

export function computeCorpusNodeStates(
  tree: ChatCorpusTreeNode[],
  steps: ChatCorpusTraversalStep[],
  upToStepIndex: number,
): Map<string, CorpusNodeVisualState> {
  const states = new Map<string, CorpusNodeVisualState>();
  walkCorpusTree(tree, (node) => {
    states.set(node.nodeKey, "default");
  });

  const limit = Math.min(upToStepIndex, steps.length - 1);
  if (limit < 0) {
    return states;
  }

  for (let index = 0; index <= limit; index += 1) {
    const step = steps[index];
    const isCurrent = index === limit;

    if (step.action === "expand" && step.nodeKey) {
      states.set(step.nodeKey, isCurrent ? "active" : "opened");
      continue;
    }

    if (step.action === "inspect" && step.nodeKey) {
      states.set(step.nodeKey, isCurrent ? "active" : "opened");
      continue;
    }

    if (step.action === "select" && step.nodeKeys?.length) {
      for (const nodeKey of step.nodeKeys) {
        states.set(nodeKey, isCurrent ? "active" : "opened");
      }
      continue;
    }

    if (step.action === "no_match") {
      walkCorpusTree(tree, (node) => {
        states.set(node.nodeKey, "skipped");
      });
    }
  }

  return states;
}

export function formatCorpusTimelineLabel(step: ChatCorpusTraversalStep) {
  return step.content;
}

export function getStepTargetNodeKeys(
  step: ChatCorpusTraversalStep | undefined,
): string[] {
  if (!step || step.action === "no_match") return [];

  const keys: string[] = [];
  if (step.nodeKey?.trim()) {
    keys.push(step.nodeKey.trim());
  }
  if (step.nodeKeys?.length) {
    for (const key of step.nodeKeys) {
      if (key?.trim()) keys.push(key.trim());
    }
  }
  return [...new Set(keys)];
}

/** Inline row highlight — avoids Tailwind purge on `.corpus-col-item`. */
export const CORPUS_ROW_FOCUS_STYLE: Record<
  CorpusTraversalAction,
  { backgroundColor: string }
> = {
  expand: {
    backgroundColor: "rgba(14, 165, 233, 0.38)",
  },
  inspect: {
    backgroundColor: "rgba(139, 92, 246, 0.38)",
  },
  select: {
    backgroundColor: "rgba(16, 185, 129, 0.38)",
  },
  no_match: {
    backgroundColor: "rgba(244, 63, 94, 0.38)",
  },
};

export const CORPUS_STEP_ACTION_META: Record<
  CorpusTraversalAction,
  {
    shortLabel: string;
    chipClass: string;
    activeChipClass: string;
    activeStepClass: string;
    iconGradientClass: string;
    connectorColor: string;
  }
> = {
  expand: {
    shortLabel: "Mở",
    chipClass:
      "bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300",
    activeChipClass: "bg-sky-500 text-white dark:bg-sky-400 dark:text-sky-950",
    activeStepClass:
      "border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-500 dark:bg-sky-950/50 dark:text-sky-100",
    iconGradientClass:
      "bg-gradient-to-br from-sky-400 to-blue-600 shadow-sm shadow-sky-500/35",
    connectorColor: "#0284c7",
  },
  inspect: {
    shortLabel: "Kiểm tra",
    chipClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300",
    activeChipClass:
      "bg-violet-500 text-white dark:bg-violet-400 dark:text-violet-950",
    activeStepClass:
      "border-violet-400 bg-violet-50 text-violet-900 dark:border-violet-500 dark:bg-violet-950/50 dark:text-violet-100",
    iconGradientClass:
      "bg-gradient-to-br from-violet-400 to-purple-600 shadow-sm shadow-violet-500/35",
    connectorColor: "#7c3aed",
  },
  select: {
    shortLabel: "Chọn",
    chipClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
    activeChipClass:
      "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950",
    activeStepClass:
      "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100",
    iconGradientClass:
      "bg-gradient-to-br from-emerald-400 to-green-600 shadow-sm shadow-emerald-500/35",
    connectorColor: "#059669",
  },
  no_match: {
    shortLabel: "Không khớp",
    chipClass:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300",
    activeChipClass: "bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950",
    activeStepClass:
      "border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/50 dark:text-rose-100",
    iconGradientClass:
      "bg-gradient-to-br from-rose-400 to-red-600 shadow-sm shadow-rose-500/35",
    connectorColor: "#e11d48",
  },
};

export function findCorpusNodePath(
  nodes: ChatCorpusTreeNode[],
  targetKey: string,
  trail: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node.nodeKey];
    if (node.nodeKey === targetKey) return nextTrail;
    const childPath = findCorpusNodePath(node.children, targetKey, nextTrail);
    if (childPath) return childPath;
  }
  return null;
}

/** Path keys for column browser up to a traversal step (inclusive). */
export function buildColumnPathForStepIndex(
  tree: ChatCorpusTreeNode[],
  steps: ChatCorpusTraversalStep[],
  stepIndex: number,
): string[] {
  if (stepIndex < 0 || !steps.length) return [];

  let pathKeys: string[] = [];
  const limit = Math.min(stepIndex, steps.length - 1);

  for (let index = 0; index <= limit; index += 1) {
    const step = steps[index];

    if (step.action === "select" && step.nodeKeys?.length) {
      const firstPath = findCorpusNodePath(tree, step.nodeKeys[0]);
      if (firstPath?.length) {
        // Keep ancestors only so the children column can show selected nodes.
        pathKeys = firstPath.length > 1 ? firstPath.slice(0, -1) : firstPath;
      }
      continue;
    }

    if (step.action === "inspect" && step.nodeKey) {
      const fullPath = findCorpusNodePath(tree, step.nodeKey);
      if (fullPath?.length) {
        // Same as select: stop at parent so the inspected child is visible with bg.
        pathKeys = fullPath.length > 1 ? fullPath.slice(0, -1) : fullPath;
      }
      continue;
    }

    const nodeKey = step.nodeKey ?? step.nodeKeys?.[0];
    if (!nodeKey) continue;
    const fullPath = findCorpusNodePath(tree, nodeKey);
    if (fullPath?.length) {
      pathKeys = fullPath;
    }
  }

  return pathKeys;
}

function pathDepthForNode(
  tree: ChatCorpusTreeNode[],
  nodeKey: string | undefined,
): number {
  if (!nodeKey) return 0;
  return findCorpusNodePath(tree, nodeKey)?.length ?? 0;
}

/** Reveal children after expand; for nested select/inspect show the child column. */
export function shouldRevealChildrenColumn(
  tree: ChatCorpusTreeNode[],
  steps: ChatCorpusTraversalStep[],
  stepIndex: number,
): boolean {
  if (stepIndex < 0) return false;
  const step = steps[stepIndex];
  if (!step) return false;

  if (step.action === "expand") {
    return true;
  }

  if (step.action === "select" && step.nodeKeys?.length) {
    return pathDepthForNode(tree, step.nodeKeys[0]) > 1;
  }

  if (step.action === "inspect" && step.nodeKey) {
    return pathDepthForNode(tree, step.nodeKey) > 1;
  }

  return false;
}

export function findCorpusParentKey(
  tree: ChatCorpusTreeNode[],
  targetKey: string,
): string | null {
  for (const node of tree) {
    if (node.children.some((child) => child.nodeKey === targetKey)) {
      return node.nodeKey;
    }
    const nested = findCorpusParentKey(node.children, targetKey);
    if (nested) return nested;
  }
  return null;
}

export type CorpusConnectorPair = {
  id: string;
  parentKey: string;
  childKey: string;
};

/** Connectors for a single traversal step (parent text → child icon). */
export function buildConnectorPairsForStep(
  tree: ChatCorpusTreeNode[],
  step: ChatCorpusTraversalStep | undefined,
): CorpusConnectorPair[] {
  if (!step || step.action === "no_match") return [];

  if (step.action === "select" && step.nodeKeys?.length) {
    const pairs: CorpusConnectorPair[] = [];
    for (const childKey of step.nodeKeys) {
      const parentKey = findCorpusParentKey(tree, childKey);
      if (!parentKey) continue;
      pairs.push({
        id: `${parentKey}->${childKey}`,
        parentKey,
        childKey,
      });
    }
    return pairs;
  }

  if (
    (step.action === "expand" || step.action === "inspect") &&
    step.nodeKey
  ) {
    const parentKey = findCorpusParentKey(tree, step.nodeKey);
    if (!parentKey) return [];
    return [
      {
        id: `${parentKey}->${step.nodeKey}`,
        parentKey,
        childKey: step.nodeKey,
      },
    ];
  }

  return [];
}

export function buildConnectorPairsFromView(
  columns: Array<{
    parentKey: string | null;
    folders: ChatCorpusTreeNode[];
  }>,
  activePath: string[],
  states: Map<string, CorpusNodeVisualState>,
): CorpusConnectorPair[] {
  const pairs: CorpusConnectorPair[] = [];

  for (
    let columnIndex = 0;
    columnIndex < columns.length - 1;
    columnIndex += 1
  ) {
    const nextColumn = columns[columnIndex + 1];
    const parentKey = nextColumn.parentKey;
    if (!parentKey) continue;

    const childKeys = new Set<string>();
    const activeChild = activePath[columnIndex + 1];
    if (activeChild) childKeys.add(activeChild);

    for (const folder of nextColumn.folders) {
      const state = states.get(folder.nodeKey) ?? "default";
      if (state === "opened" || state === "active") {
        childKeys.add(folder.nodeKey);
      }
    }

    for (const childKey of childKeys) {
      pairs.push({
        id: `${parentKey}->${childKey}`,
        parentKey,
        childKey,
      });
    }
  }

  return pairs;
}

export function highlightedNodeKeyForStep(
  steps: ChatCorpusTraversalStep[],
  stepIndex: number,
): string | null {
  if (stepIndex < 0) return null;
  const step = steps[stepIndex];
  if (!step) return null;
  if (step.nodeKey) return step.nodeKey;
  return step.nodeKeys?.[0] ?? null;
}

export function isCorpusTraversalStreamEndEvent(
  event: Record<string, unknown>,
): boolean {
  const eventType = typeof event.type === "string" ? event.type : "";
  return (
    eventType === CORPUS_TRAVERSAL_STREAM_END_TYPE ||
    event.traversalComplete === true
  );
}

export const CORPUS_TRAVERSAL_END_EVENT_TYPES = new Set([
  "faq_retrieval",
  "faq_answer",
  "file_retrieval",
  "document_read",
]);
