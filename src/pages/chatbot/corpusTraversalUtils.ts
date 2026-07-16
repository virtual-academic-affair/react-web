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

const HIDDEN_REASONING_TYPES = new Set([
  "corpus_tree",
  "corpus_traversal",
  CORPUS_TRAVERSAL_SUMMARY_TYPE,
]);

export function emptyCorpusTraversal(): ChatCorpusTraversal {
  return { tree: [], steps: [] };
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
): ChatReasoningStep[] {
  const visible = (reasoningSteps ?? []).filter(
    (step) => !HIDDEN_REASONING_TYPES.has(step.type),
  );
  if (!hasCorpusTraversalData(corpusTraversal)) {
    return visible;
  }
  return [...visible, buildCorpusTraversalSummaryStep()];
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
        states.set(nodeKey, "opened");
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

export function formatCorpusTimelineLabel(
  step: ChatCorpusTraversalStep,
  index: number,
) {
  return `${index + 1}. ${step.content}`;
}

export const CORPUS_TRAVERSAL_END_EVENT_TYPES = new Set([
  "faq_retrieval",
  "faq_answer",
  "file_retrieval",
  "document_read",
]);
