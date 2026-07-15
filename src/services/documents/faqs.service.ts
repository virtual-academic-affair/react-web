import { API_ENDPOINTS } from "@/config/api.config";
import type { FAQ, FAQListResponse, FAQCandidateListResponse, YearRange } from "@/types/faqs";
import ragHttp from "../rag-http";

class FAQsService {
  async getFAQs(params: {
    page?: number;
    limit?: number;
    search?: string;
    lecturerOnly?: boolean;
    metadataFilter?: Record<string, unknown>;
  }) {
    const queryParams: Record<string, unknown> = { ...params };
    if (params.metadataFilter) {
      queryParams.metadataFilter = JSON.stringify(params.metadataFilter);
    }
    if (params.lecturerOnly === undefined) {
      delete queryParams.lecturerOnly;
    }

    const response = await ragHttp.get<FAQListResponse>(
      API_ENDPOINTS.rag.faqs.base,
      { params: queryParams }
    );
    return response.data;
  }

  async getCandidates(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const response = await ragHttp.get<FAQCandidateListResponse>(
      API_ENDPOINTS.rag.faqs.candidates,
      { params }
    );
    return response.data;
  }

  async reviewCandidate(id: string, action: "approve" | "reject", overrides?: {
    question?: string;
    answer?: string;
    metadataFilter?: any;
    note?: string;
  }) {
    const payload: any = { action };
    if (overrides) {
      if (overrides.question) payload.questionOverride = overrides.question;
      if (overrides.answer) payload.answerRichTextOverride = overrides.answer;
      if (overrides.metadataFilter) payload.metadataFilterOverride = overrides.metadataFilter;
      if (overrides.note) payload.note = overrides.note;
    }

    const response = await ragHttp.post(
      API_ENDPOINTS.rag.faqs.reviewCandidate(id),
      payload
    );
    return response.data;
  }

  async triggerSynthesis(params: {
    dateFrom?: string;
    dateTo?: string;
    sources?: string[];
  }) {
    const response = await ragHttp.post(
      API_ENDPOINTS.rag.faqs.base + "/synthesis",
      {
        date_from: params.dateFrom,
        date_to: params.dateTo,
        sources: params.sources || ["chat", "inquiry_email"],
      }
    );
    return response.data;
  }

  async getFAQ(id: string) {
    const response = await ragHttp.get<FAQ>(
      API_ENDPOINTS.rag.faqs.byId(id)
    );
    return response.data;
  }

  async createFAQ(data: {
    question: string;
    answer: string;
    lecturerOnly?: boolean;
    academicYear?: YearRange;
    enrollmentYear?: YearRange;
  }) {
    const payload = {
      question: data.question,
      answerRichText: data.answer,
      lecturerOnly: data.lecturerOnly ?? false,
      metadataFilter: {
        academicYear: data.academicYear || { fromYear: 0, toYear: 9999 },
        enrollmentYear: data.enrollmentYear || { fromYear: 0, toYear: 9999 },
      },
    };
    const response = await ragHttp.post<FAQ>(
      API_ENDPOINTS.rag.faqs.base,
      payload
    );
    return response.data;
  }

  async updateFAQ(id: string, data: {
    question?: string;
    answer?: string;
    lecturerOnly?: boolean;
    academicYear?: YearRange;
    enrollmentYear?: YearRange;
  }) {
    const payload: any = {};
    if (data.question) payload.question = data.question;
    if (data.answer) payload.answerRichText = data.answer;
    if (data.lecturerOnly !== undefined) payload.lecturerOnly = data.lecturerOnly;
    
    if (data.academicYear || data.enrollmentYear) {
      payload.metadataFilter = {
        academicYear: data.academicYear || { fromYear: 0, toYear: 9999 },
        enrollmentYear: data.enrollmentYear || { fromYear: 0, toYear: 9999 },
      };
    }
    
    const response = await ragHttp.patch<FAQ>(
      API_ENDPOINTS.rag.faqs.byId(id),
      payload
    );
    return response.data;
  }

  async removeFAQ(id: string) {
    await ragHttp.delete(API_ENDPOINTS.rag.faqs.byId(id));
  }

  async importFAQs(
    file: File,
    config: {
      questionCol: number;
      answerCol: number;
      academicYearCol?: number;
      enrollmentYearCol?: number;
      sheetName?: string;
      skipRows?: number;
    }
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("question_col", config.questionCol.toString());
    formData.append("answer_col", config.answerCol.toString());
    
    const metadataMap: any = {};
    if (config.academicYearCol) metadataMap.academic_year = config.academicYearCol.toString();
    if (config.enrollmentYearCol) metadataMap.enrollment_year = config.enrollmentYearCol.toString();
    formData.append("metadataFilterJson", JSON.stringify(metadataMap));

    if (config.sheetName) formData.append("sheet_name", config.sheetName);
    if (config.skipRows !== undefined) formData.append("skip_rows", config.skipRows.toString());

    const response = await ragHttp.post<{ message: string; created: number }>(API_ENDPOINTS.rag.faqs.import, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
}

export const faqsService = new FAQsService();
