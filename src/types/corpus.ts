import type { YearRange } from "@/types/faqs";

export type CorpusPayloadKind = "file" | "faq";

export type CorpusYearRange = YearRange;

export type CorpusPayloadMetadata = {
  enrollmentYear?: CorpusYearRange | null;
  academicYear?: CorpusYearRange | null;
  type?: string | null;
};

export type CorpusPayloadRef = {
  id: string;
  name: string;
  /** Present on file refs — used for extension/icon. */
  originalFilename?: string;
  metadata: CorpusPayloadMetadata | null;
  lecturerOnly: boolean;
  updatedAt: string | null;
};

export type CorpusTreeNode = {
  nodeKey: string;
  title: string;
  summary: string;
  fileCount: number;
  faqCount: number;
  directFiles: CorpusPayloadRef[];
  directFaqs: CorpusPayloadRef[];
  children: CorpusTreeNode[];
};

export type CorpusTreeResponse = {
  totalNodes: number;
  totalRootNodes: number;
  tree: CorpusTreeNode[];
};

export type CorpusTopicSummary = {
  nodeKey: string;
  title: string;
  summary: string;
  parentKey: string | null;
  fileCount: number;
  faqCount: number;
};

export type CorpusTopicsResponse = {
  total: number;
  items: CorpusTopicSummary[];
};

export type CorpusTopicDetail = CorpusTopicSummary & {
  childKeys: string[];
  directFiles: CorpusPayloadRef[];
  directFaqs: CorpusPayloadRef[];
};

export type CorpusPayloadTopicsResponse = {
  payloadType: CorpusPayloadKind;
  payloadId: string;
  name: string;
  nodeKeys: string[];
};

/** Annotated tree node with parent for move / path operations. */
export type CorpusTreeNodeWithParent = CorpusTreeNode & {
  parentKey: string | null;
  children: CorpusTreeNodeWithParent[];
};
