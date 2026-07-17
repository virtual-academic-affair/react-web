import type {
  CorpusPayloadKind,
  CorpusPayloadRef,
  CorpusTreeNode,
  CorpusTreeNodeWithParent,
} from "@/types/corpus";
import type { DataNode } from "antd/es/tree";
import type { Key } from "react";

export type CorpusFolderMeta = {
  kind: "folder";
  nodeKey: string;
  parentKey: string | null;
  title: string;
  fileCount: number;
  faqCount: number;
};

export type CorpusCandidateMeta = {
  kind: "candidate";
  payloadKind: CorpusPayloadKind;
  payload: CorpusPayloadRef;
  parentNodeKey: string;
};

export type CorpusTreeDataNode = DataNode & {
  meta: CorpusFolderMeta | CorpusCandidateMeta;
  children?: CorpusTreeDataNode[];
};

export function folderTreeKey(nodeKey: string): string {
  return `folder:${nodeKey}`;
}

export function parseFolderTreeKey(key: Key): string | null {
  const raw = String(key);
  return raw.startsWith("folder:") ? raw.slice("folder:".length) : null;
}

export function candidateInstanceKey(
  kind: CorpusPayloadKind,
  payloadId: string,
  parentNodeKey: string,
): string {
  return `${kind}:${payloadId}::${parentNodeKey}`;
}

export function candidateIdentityKey(
  kind: CorpusPayloadKind,
  payloadId: string,
): string {
  return `${kind}:${payloadId}`;
}

export function annotateTreeWithParents(
  nodes: CorpusTreeNode[],
  parentKey: string | null = null,
): CorpusTreeNodeWithParent[] {
  return nodes.map((node) => ({
    ...node,
    parentKey,
    children: annotateTreeWithParents(node.children ?? [], node.nodeKey),
  }));
}

export function collectAllFolderKeys(
  nodes: CorpusTreeNodeWithParent[],
): string[] {
  const keys: string[] = [];
  const walk = (list: CorpusTreeNodeWithParent[]) => {
    for (const node of list) {
      keys.push(folderTreeKey(node.nodeKey));
      walk(node.children);
    }
  };
  walk(nodes);
  return keys;
}

export function collectDescendantFolderKeys(
  nodes: CorpusTreeNodeWithParent[],
  targetKey: string,
): Set<string> {
  const found = findNode(nodes, targetKey);
  if (!found) return new Set();
  const keys = new Set<string>([targetKey]);
  const walk = (list: CorpusTreeNodeWithParent[]) => {
    for (const node of list) {
      keys.add(node.nodeKey);
      walk(node.children);
    }
  };
  walk(found.children);
  return keys;
}

/** Self + all descendants — blocked targets when moving a folder. */
export function collectSelfAndDescendantKeys(
  nodes: CorpusTreeNodeWithParent[],
  targetKey: string,
): string[] {
  return Array.from(collectDescendantFolderKeys(nodes, targetKey));
}

export function findNode(
  nodes: CorpusTreeNodeWithParent[],
  nodeKey: string,
): CorpusTreeNodeWithParent | null {
  for (const node of nodes) {
    if (node.nodeKey === nodeKey) return node;
    const child = findNode(node.children, nodeKey);
    if (child) return child;
  }
  return null;
}

export function findPayloadLocations(
  nodes: CorpusTreeNodeWithParent[],
  kind: CorpusPayloadKind,
  payloadId: string,
): string[] {
  const locations: string[] = [];
  const walk = (list: CorpusTreeNodeWithParent[]) => {
    for (const node of list) {
      const refs =
        kind === "file" ? node.directFiles ?? [] : node.directFaqs ?? [];
      if (refs.some((ref) => ref.id === payloadId)) {
        locations.push(node.nodeKey);
      }
      walk(node.children);
    }
  };
  walk(nodes);
  return locations;
}

export function getAncestorKeys(
  nodes: CorpusTreeNodeWithParent[],
  nodeKey: string,
): string[] {
  const path: string[] = [];

  const walk = (
    list: CorpusTreeNodeWithParent[],
    trail: string[],
  ): boolean => {
    for (const node of list) {
      if (node.nodeKey === nodeKey) {
        path.push(...trail);
        return true;
      }
      if (walk(node.children, [...trail, node.nodeKey])) return true;
    }
    return false;
  };

  walk(nodes, []);
  return path;
}

export function toAntdTreeData(
  nodes: CorpusTreeNodeWithParent[],
): CorpusTreeDataNode[] {
  return nodes.map((node) => {
    const childFolders = toAntdTreeData(node.children ?? []);
    const files: CorpusTreeDataNode[] = (node.directFiles ?? []).map(
      (file) => ({
        key: candidateInstanceKey("file", file.id, node.nodeKey),
        isLeaf: true,
        selectable: true,
        disableCheckbox: true,
        meta: {
          kind: "candidate",
          payloadKind: "file",
          payload: file,
          parentNodeKey: node.nodeKey,
        },
        title: file.name || file.id,
      }),
    );
    const faqs: CorpusTreeDataNode[] = (node.directFaqs ?? []).map((faq) => ({
      key: candidateInstanceKey("faq", faq.id, node.nodeKey),
      isLeaf: true,
      selectable: true,
      disableCheckbox: true,
      meta: {
        kind: "candidate",
        payloadKind: "faq",
        payload: faq,
        parentNodeKey: node.nodeKey,
      },
      title: faq.name || faq.id,
    }));

    return {
      key: folderTreeKey(node.nodeKey),
      selectable: false,
      meta: {
        kind: "folder",
        nodeKey: node.nodeKey,
        parentKey: node.parentKey,
        title: node.title,
        fileCount: node.fileCount,
        faqCount: node.faqCount,
      },
      title: node.title,
      children: [...childFolders, ...files, ...faqs],
    };
  });
}

/** Folder-only tree for organize checkboxes / move picker. */
export function toAntdFolderPickerData(
  nodes: CorpusTreeNodeWithParent[],
): DataNode[] {
  return nodes.map((node) => ({
    key: node.nodeKey,
    title: node.title,
    children: toAntdFolderPickerData(node.children ?? []),
  }));
}

export function collectCandidateInstanceKeys(
  nodes: CorpusTreeNodeWithParent[],
  kind: CorpusPayloadKind,
  payloadId: string,
): string[] {
  return findPayloadLocations(nodes, kind, payloadId).map((parentNodeKey) =>
    candidateInstanceKey(kind, payloadId, parentNodeKey),
  );
}

export function getNodeTitlePath(
  nodes: CorpusTreeNodeWithParent[],
  nodeKey: string,
): string[] {
  const titles: string[] = [];

  const walk = (
    list: CorpusTreeNodeWithParent[],
    trail: string[],
  ): boolean => {
    for (const node of list) {
      const nextTrail = [...trail, node.title || node.nodeKey];
      if (node.nodeKey === nodeKey) {
        titles.push(...nextTrail);
        return true;
      }
      if (walk(node.children, nextTrail)) return true;
    }
    return false;
  };

  walk(nodes, []);
  return titles;
}

export type CorpusSearchFolderHit = {
  kind: "folder";
  nodeKey: string;
  title: string;
  /** Ancestor titles only (path tới folder). */
  pathLabels: string[];
};

export type CorpusSearchPayloadHit = {
  kind: "file" | "faq";
  payload: CorpusPayloadRef;
  parentKey: string;
  parentTitle: string;
  /** Full folder path including parent. */
  pathLabels: string[];
};

export type CorpusSearchHit = CorpusSearchFolderHit | CorpusSearchPayloadHit;

export type CorpusSearchResults = {
  folders: CorpusSearchFolderHit[];
  files: CorpusSearchPayloadHit[];
  faqs: CorpusSearchPayloadHit[];
};

const DEFAULT_SEARCH_LIMIT_PER_KIND = 8;

function matchesQuery(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query);
}

/** Client-side corpus tree search by folder title, file name, or FAQ question. */
export function searchCorpusTree(
  nodes: CorpusTreeNodeWithParent[],
  rawQuery: string,
  limitPerKind = DEFAULT_SEARCH_LIMIT_PER_KIND,
): CorpusSearchResults {
  const query = rawQuery.trim().toLowerCase();
  const folders: CorpusSearchFolderHit[] = [];
  const files: CorpusSearchPayloadHit[] = [];
  const faqs: CorpusSearchPayloadHit[] = [];

  if (!query) {
    return { folders, files, faqs };
  }

  const walk = (list: CorpusTreeNodeWithParent[], trailTitles: string[]) => {
    for (const node of list) {
      const title = node.title || node.nodeKey;
      const nextTrail = [...trailTitles, title];

      if (
        folders.length < limitPerKind &&
        matchesQuery(title, query)
      ) {
        folders.push({
          kind: "folder",
          nodeKey: node.nodeKey,
          title,
          pathLabels: trailTitles,
        });
      }

      if (files.length < limitPerKind) {
        for (const file of node.directFiles ?? []) {
          const name = file.name || file.originalFilename || file.id;
          if (!matchesQuery(name, query)) continue;
          files.push({
            kind: "file",
            payload: file,
            parentKey: node.nodeKey,
            parentTitle: title,
            pathLabels: nextTrail,
          });
          if (files.length >= limitPerKind) break;
        }
      }

      if (faqs.length < limitPerKind) {
        for (const faq of node.directFaqs ?? []) {
          const name = faq.name || faq.id;
          if (!matchesQuery(name, query)) continue;
          faqs.push({
            kind: "faq",
            payload: faq,
            parentKey: node.nodeKey,
            parentTitle: title,
            pathLabels: nextTrail,
          });
          if (faqs.length >= limitPerKind) break;
        }
      }

      walk(node.children, nextTrail);
    }
  };

  walk(nodes, []);
  return { folders, files, faqs };
}

export function hasCorpusSearchHits(results: CorpusSearchResults) {
  return (
    results.folders.length > 0 ||
    results.files.length > 0 ||
    results.faqs.length > 0
  );
}
