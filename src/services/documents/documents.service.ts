import { API_CONFIG, API_ENDPOINTS } from "@/config/api.config";
import http from "../http";
import ragHttp from "../rag-http";

/**
 * Service for document management.
 * Combines calls to Nest API (accesses, bookmarks) and Python RAG (file details, list, upload).
 */
export type UploadProgressEvent = {
  step: string;
  message: string;
  file_id?: string;
};

const getRagWsBaseUrl = () => {
  const raw = API_CONFIG.ragBaseURL;
  if (raw.startsWith("https://")) return raw.replace("https://", "wss://");
  if (raw.startsWith("http://")) return raw.replace("http://", "ws://");
  return raw;
};

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
    metadataFilter?: Record<string, string[]>;
  }): Promise<{ files: unknown[]; total: number }> {
    const queryParams: Record<string, unknown> = { ...params };
    if (params?.metadataFilter) {
      queryParams.metadataFilter = JSON.stringify(params.metadataFilter);
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
  async getFileDetail(fileId: string, recordAccess = false): Promise<any> {
    if (recordAccess) {
      // Background call to nest api
      this.recordAccess(fileId).catch(console.error);
    }
    const { data } = await ragHttp.get(API_ENDPOINTS.rag.files.byId(fileId));
    return data;
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

    socket.onopen = () => handlers.onOpen?.();
    socket.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data) as UploadProgressEvent;
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
  async uploadFile(formData: FormData): Promise<any> {
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
   * Update file metadata.
   */
  async updateFileMetadata(
    fileId: string,
    updates: {
      displayName?: string;
      customMetadata?: Record<string, string>;
    },
  ): Promise<any> {
    const { data } = await ragHttp.patch(API_ENDPOINTS.rag.files.byId(fileId), {
      displayName: updates.displayName,
      customMetadata: updates.customMetadata,
    });
    return data;
  },

  /**
   * Download file.
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await ragHttp.get(
      API_ENDPOINTS.rag.files.download(fileId),
      { responseType: "blob" },
    );
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
