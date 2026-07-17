import { API_ENDPOINTS } from "@/config/api.config";
import type {
  CorpusPayloadTopicsResponse,
  CorpusTopicDetail,
  CorpusTopicsResponse,
  CorpusTreeResponse,
} from "@/types/corpus";
import ragHttp from "../rag-http";

class CorpusService {
  async getTree(params?: {
    lecturerOnly?: boolean;
    metadataFilter?: Record<string, unknown>;
  }): Promise<CorpusTreeResponse> {
    const queryParams: Record<string, unknown> = {};
    if (params?.metadataFilter) {
      queryParams.metadataFilter = JSON.stringify(params.metadataFilter);
    }
    if (params?.lecturerOnly !== undefined) {
      queryParams.lecturerOnly = params.lecturerOnly;
    }
    const { data } = await ragHttp.get<CorpusTreeResponse>(
      API_ENDPOINTS.rag.corpus.tree,
      { params: queryParams },
    );
    return data;
  }

  async getTopics(): Promise<CorpusTopicsResponse> {
    const { data } = await ragHttp.get<CorpusTopicsResponse>(
      API_ENDPOINTS.rag.corpus.topics,
    );
    return data;
  }

  async createTopic(body: {
    slug: string;
    title: string;
    summary?: string;
    parentKey?: string | null;
  }): Promise<CorpusTopicDetail> {
    const { data } = await ragHttp.post<CorpusTopicDetail>(
      API_ENDPOINTS.rag.corpus.topics,
      body,
    );
    return data;
  }

  async getTopic(topicKey: string): Promise<CorpusTopicDetail> {
    const { data } = await ragHttp.get<CorpusTopicDetail>(
      API_ENDPOINTS.rag.corpus.topicByKey(topicKey),
    );
    return data;
  }

  async updateTopic(
    topicKey: string,
    body: { title?: string; summary?: string; parentKey?: string | null },
  ): Promise<CorpusTopicDetail> {
    const { data } = await ragHttp.patch<CorpusTopicDetail>(
      API_ENDPOINTS.rag.corpus.topicByKey(topicKey),
      body,
    );
    return data;
  }

  async deleteTopic(
    topicKey: string,
  ): Promise<{ nodeKey: string; deleted: boolean }> {
    const { data } = await ragHttp.delete<{
      nodeKey: string;
      deleted: boolean;
    }>(API_ENDPOINTS.rag.corpus.topicByKey(topicKey));
    return data;
  }

  async getFileTopics(fileId: string): Promise<CorpusPayloadTopicsResponse> {
    const { data } = await ragHttp.get<CorpusPayloadTopicsResponse>(
      API_ENDPOINTS.rag.corpus.fileTopics(fileId),
    );
    return data;
  }

  async getFaqTopics(faqId: string): Promise<CorpusPayloadTopicsResponse> {
    const { data } = await ragHttp.get<CorpusPayloadTopicsResponse>(
      API_ENDPOINTS.rag.corpus.faqTopics(faqId),
    );
    return data;
  }

  async updateFileTopics(
    fileId: string,
    nodeKeys: string[],
  ): Promise<CorpusPayloadTopicsResponse> {
    const { data } = await ragHttp.put<CorpusPayloadTopicsResponse>(
      API_ENDPOINTS.rag.corpus.fileTopics(fileId),
      { nodeKeys },
    );
    return data;
  }

  async updateFaqTopics(
    faqId: string,
    nodeKeys: string[],
  ): Promise<CorpusPayloadTopicsResponse> {
    const { data } = await ragHttp.put<CorpusPayloadTopicsResponse>(
      API_ENDPOINTS.rag.corpus.faqTopics(faqId),
      { nodeKeys },
    );
    return data;
  }
}

export const corpusService = new CorpusService();
