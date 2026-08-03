import { API_CONFIG, API_ENDPOINTS } from "@/config/api.config";
import { useAuthStore } from "@/stores/auth.store";
import http from "../http";
import ragHttp from "../rag-http";

/**
 * Service for document management.
 * Combines calls to Nest API (accesses, bookmarks) and Python RAG (file details, list, upload).
 */
export type FileStatus =
  | "uploading"
  | "processing"
  | "awaiting_review"
  | "ready"
  | "failed";

export type UploadProgressEvent = {
  type?: string;
  step?: string;
  message?: string;
  file_id?: string;
};

export interface DocumentYearRange {
  fromYear?: number | null;
  toYear?: number | null;
}

export interface DocumentCustomMetadata {
  type?: string | null;
  enrollmentYear?: DocumentYearRange | null;
  academicYear?: DocumentYearRange | null;
  [key: string]: unknown;
}

export interface FileListItemResponse {
  fileId: string;
  status: FileStatus;
  displayName?: string | null;
  originalFilename?: string | null;
  lecturerOnly: boolean;
  customMetadata?: DocumentCustomMetadata | null;
  fileUrl?: string | null;
  markdownFileUrl?: string | null;
  createdAt: string;
}

export interface FileDetailResponse
  extends Omit<FileListItemResponse, "fileUrl" | "markdownFileUrl">,
    Record<string, unknown> {
  fileUrl: string;
  markdownFileUrl: string;
  updatedAt?: string | null;
  fileSize?: number | null;
  tableOfContents?: string[] | null;
  lastProcessingError?: string | null;
  mimeType?: string | null;
  contentType?: string | null;
}

export interface UploadFileResponse {
  fileId: string;
  status: FileStatus;
  lecturerOnly: boolean;
  customMetadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface OcrReviewResponse {
  fileId: string;
  status: "awaiting_review";
  markdown: string;
  ocrPageCount: number | null;
  ocrCompletedAt: string | null;
  lastProcessingError: string | null;
}

const getRagWsBaseUrl = () => {
  const raw = API_CONFIG.ragBaseURL;
  if (raw.startsWith("https://")) return raw.replace("https://", "wss://");
  if (raw.startsWith("http://")) return raw.replace("http://", "ws://");
  return raw;
};

export type DownloadFileFormat = "original" | "markdown";

export const DocumentsService = {
  // ── Nest API Endpoints ─────────────────────────────────────────────────────

  /**
   * Record that a file was accessed.
   */
  async recordAccess(fileId: string): Promise<void> {
    await http.post(API_ENDPOINTS.document.accesses.base, { fileId });
  },

  /**
   * Get recently accessed files.
   */
  async getRecentAccesses(): Promise<{ fileId: string; accessedAt: string }[]> {
    return http.get(API_ENDPOINTS.document.accesses.recent);
  },

  /**
   * Toggle bookmark status.
   */
  async toggleBookmark(fileId: string, isBookmarked: boolean): Promise<void> {
    if (isBookmarked) {
      await http.delete(API_ENDPOINTS.document.bookmarks.byId(fileId));
    } else {
      await http.post(API_ENDPOINTS.document.bookmarks.byId(fileId));
    }
  },

  /**
   * Get all user bookmarks.
   */
  async getBookmarks(): Promise<{ fileId: string; bookmarkedAt: string }[]> {
    return http.get(API_ENDPOINTS.document.bookmarks.base);
  },

  // ── Python RAG API Endpoints ───────────────────────────────────────────────

  /**
   * List files from RAG.
   * @param params - Query parameters including metadataFilter as JSON string
   */
  async listFiles(params?: {
    page?: number;
    limit?: number;
    keywords?: string;
    fileStatus?: FileStatus;
    lecturerOnly?: boolean;
    metadataFilter?: Record<string, unknown>;
  }): Promise<{
    files: FileListItemResponse[];
    total: number;
    page?: number;
    limit?: number;
  }> {
    const queryParams: Record<string, unknown> = { ...params };
    if (params?.metadataFilter) {
      queryParams.metadataFilter = JSON.stringify(params.metadataFilter);
    }
    if (params?.lecturerOnly === undefined) {
      delete queryParams.lecturerOnly;
    }
    const { data } = await ragHttp.get(API_ENDPOINTS.rag.files.base, {
      params: queryParams,
    });
    return data;
  },

  /**
   * Get file detail from RAG.
   * Also optionally records access in Nest API.
   */
  async getFileDetail(
    fileId: string,
    recordAccess = false,
  ): Promise<FileDetailResponse> {
    if (recordAccess) {
      // Background call to nest api
      this.recordAccess(fileId).catch(console.error);
    }
    const { data } = await ragHttp.get(API_ENDPOINTS.rag.files.byId(fileId));
    return {
      ...data,
      fileUrl: data.fileUrl ?? "",
      markdownFileUrl: data.markdownFileUrl ?? "",
    };
  },

  createUploadProgressSocket(
    clientId: string,
    handlers: {
      onOpen?: () => void;
      onMessage?: (event: UploadProgressEvent) => void;
      onError?: (event: Event) => void;
      onClose?: (event: CloseEvent) => void;
    },
  ): WebSocket {
    const wsUrl = `${getRagWsBaseUrl()}${API_ENDPOINTS.rag.files.progress(clientId)}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      const token = useAuthStore.getState().accessToken;
      socket.send(JSON.stringify({ type: "auth", token: token ?? "" }));
      handlers.onOpen?.();
    };
    socket.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data) as UploadProgressEvent;
        if (payload.type === "auth_ok") return;
        handlers.onMessage?.(payload);
      } catch {
        // ignore malformed messages
      }
    };
    socket.onerror = (evt) => handlers.onError?.(evt);
    socket.onclose = (evt) => handlers.onClose?.(evt);

    return socket;
  },

  /**
   * Upload file to RAG.
   */
  async uploadFile(formData: FormData): Promise<UploadFileResponse> {
    const { data } = await ragHttp.post(
      API_ENDPOINTS.rag.files.base,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  /**
   * Get the OCR Markdown draft while a file is awaiting admin review.
   */
  async getOcrReview(fileId: string): Promise<OcrReviewResponse> {
    const { data } = await ragHttp.get(
      API_ENDPOINTS.rag.files.ocrReview(fileId),
    );
    return data;
  },

  /**
   * Persist an edited OCR Markdown draft to R2.
   */
  async saveOcrReview(
    fileId: string,
    markdown: string,
    clientId?: string,
  ): Promise<void> {
    await ragHttp.put(
      API_ENDPOINTS.rag.files.ocrReview(fileId),
      { markdown },
      clientId ? { headers: { "X-Client-ID": clientId } } : undefined,
    );
  },

  /**
   * Approve an OCR draft and atomically start background indexing.
   */
  async approveOcrReview(fileId: string): Promise<FileDetailResponse> {
    const { data } = await ragHttp.post(
      API_ENDPOINTS.rag.files.approveOcrReview(fileId),
    );
    return {
      ...data,
      fileUrl: data.fileUrl ?? "",
      markdownFileUrl: data.markdownFileUrl ?? "",
    };
  },

  /**
   * Reject an OCR draft, marking the file failed and deleting the draft.
   */
  async rejectOcrReview(fileId: string): Promise<void> {
    await ragHttp.post(API_ENDPOINTS.rag.files.rejectOcrReview(fileId));
  },

  /**
   * Update file display name in RAG.
   */
  async updateFileName(fileId: string, displayName: string): Promise<any> {
    const { data } = await ragHttp.patch(API_ENDPOINTS.rag.files.byId(fileId), {
      display_name: displayName,
    });
    return data;
  },

  /**
   * Delete file from RAG.
   */
  async deleteFile(fileId: string): Promise<void> {
    await ragHttp.delete(API_ENDPOINTS.rag.files.byId(fileId));
  },

  /**
   * Update file display name and/or metadata.
   * PATCH /api/files/{fileId}
   */
  async updateFileMetadata(
    fileId: string,
    updates: {
      displayName?: string;
      lecturerOnly?: boolean;
      customMetadata?: Record<string, unknown>;
    },
  ): Promise<any> {
    const { data } = await ragHttp.patch(
      API_ENDPOINTS.rag.files.byId(fileId),
      {
        displayName: updates.displayName,
        lecturerOnly: updates.lecturerOnly,
        customMetadata: updates.customMetadata,
      },
    );
    return data;
  },

  /**
   * Download file.
   */
  async downloadFile(
    fileId: string,
    format: DownloadFileFormat = "original",
  ): Promise<Blob> {
    const response = await ragHttp.get(API_ENDPOINTS.rag.files.download(fileId), {
      params: { format },
      responseType: "blob",
    });
    return response.data;
  },
};

/**
 * Service for metadata management (Python RAG).
 */
export const MetadataService = {
  // ── Metadata Endpoints (RAG) ────────────────────────────────────────────────

  /**
   * Check if a metadata key already exists.
   */
  async checkKeyExists(key: string): Promise<boolean> {
    const { data } = await ragHttp.get(
      `${API_ENDPOINTS.rag.metadata.base}/exists`,
      {
        params: { key },
      },
    );
    return data.exists;
  },

  /**
   * List all metadata types.
   */
  async listTypes(params?: {
    keywords?: string;
    isActive?: boolean;
    enableIsActiveFilter?: boolean;
  }): Promise<any[]> {
    const { data } = await ragHttp.get(API_ENDPOINTS.rag.metadata.base, {
      params: {
        ...(params?.keywords ? { keywords: params.keywords } : {}),
        ...(params?.enableIsActiveFilter && params.isActive !== undefined
          ? { isActive: params.isActive }
          : {}),
      },
    });
    const items = data.metadataTypes || data.metadata_types || [];
    // Ensure each item has an 'id' for TableLayout compatibility
    return items.map((item: any) => ({
      ...item,
      id: item.id || item.metadataId || item.key,
    }));
  },

  /**
   * Get metadata type details.
   */
  async getType(key: string): Promise<any> {
    const { data } = await ragHttp.get(API_ENDPOINTS.rag.metadata.byId(key));
    return data;
  },

  /**
   * Create new metadata type.
   */
  async createType(typeData: any): Promise<any> {
    const { data } = await ragHttp.post(
      API_ENDPOINTS.rag.metadata.base,
      typeData,
    );
    return data;
  },

  /**
   * Update metadata type.
   */
  async updateType(key: string, updates: any): Promise<any> {
    const { data } = await ragHttp.patch(
      API_ENDPOINTS.rag.metadata.byId(key),
      updates,
    );
    return data;
  },

  /**
   * Delete metadata type.
   */
  async deleteType(key: string): Promise<void> {
    await ragHttp.delete(API_ENDPOINTS.rag.metadata.byId(key));
  },

  /**
   * Add value to metadata type.
   */
  async addValue(key: string, valueData: any): Promise<any> {
    const { data } = await ragHttp.post(
      API_ENDPOINTS.rag.metadata.values(key),
      valueData,
    );
    return data;
  },

  /**
   * Update metadata value.
   */
  async updateValue(key: string, valueKey: string, updates: any): Promise<any> {
    const { data } = await ragHttp.patch(
      API_ENDPOINTS.rag.metadata.valueById(key, valueKey),
      updates,
    );
    return data;
  },

  /**
   * Delete metadata value.
   */
  async deleteValue(key: string, valueKey: string): Promise<void> {
    await ragHttp.delete(API_ENDPOINTS.rag.metadata.valueById(key, valueKey));
  },
};
