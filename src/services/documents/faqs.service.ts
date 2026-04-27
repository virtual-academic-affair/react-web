import { API_ENDPOINTS } from "@/config/api.config";
import type { FAQ, FAQListResponse, FAQCandidate, FAQCandidateListResponse } from "@/types/faqs";
import ragHttp from "../rag-http";

class FAQsService {
  async getFAQs(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    academicYear?: string;
    cohort?: string;
  }) {
    const { academicYear, cohort, isActive, ...rest } = params;
    
    // Convert separate metadata filters into a single JSON string as required by the new backend
    const metadataFilter: any = {};
    if (academicYear) metadataFilter.academic_year = [academicYear];
    if (cohort) metadataFilter.cohort = [cohort];
    
    const queryParams: any = { ...rest };
    if (isActive !== undefined) queryParams.isActive = isActive;
    if (Object.keys(metadataFilter).length > 0) {
      queryParams.metadataFilter = JSON.stringify(metadataFilter);
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
    academicYear?: string;
    cohort?: string;
  }) {
    const payload = {
      question: data.question,
      answerRichText: data.answer,
      metadataFilter: {
        academic_year: data.academicYear ? [data.academicYear] : [],
        cohort: data.cohort ? [data.cohort] : [],
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
    academicYear?: string;
    cohort?: string;
    isActive?: boolean;
  }) {
    const payload: any = {};
    if (data.question) payload.question = data.question;
    if (data.answer) payload.answerRichText = data.answer;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    
    if (data.academicYear || data.cohort) {
      payload.metadataFilter = {
        academic_year: data.academicYear ? [data.academicYear] : [],
        cohort: data.cohort ? [data.cohort] : [],
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

  async previewImportFAQs(
    file: File,
    config: {
      questionCol: string;
      answerCol: string;
      academicYearCol?: string;
      cohortCol?: string;
      sheetName?: string;
      skipRows?: number;
    }
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("question_col", config.questionCol);
    formData.append("answer_col", config.answerCol);
    
    // New metadata format
    const metadataMap: any = {};
    if (config.academicYearCol) metadataMap.academic_year = config.academicYearCol;
    if (config.cohortCol) metadataMap.cohort = config.cohortCol;
    formData.append("metadataFilterJson", JSON.stringify(metadataMap));

    if (config.sheetName) formData.append("sheet_name", config.sheetName);
    if (config.skipRows !== undefined) formData.append("skip_rows", config.skipRows.toString());

    const response = await ragHttp.post(API_ENDPOINTS.rag.faqs.importPreview, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async importFAQs(
    file: File,
    config: {
      questionCol: string;
      answerCol: string;
      academicYearCol?: string;
      cohortCol?: string;
      sheetName?: string;
      skipRows?: number;
    }
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("question_col", config.questionCol);
    formData.append("answer_col", config.answerCol);
    
    const metadataMap: any = {};
    if (config.academicYearCol) metadataMap.academic_year = config.academicYearCol;
    if (config.cohortCol) metadataMap.cohort = config.cohortCol;
    formData.append("metadataFilterJson", JSON.stringify(metadataMap));

    if (config.sheetName) formData.append("sheet_name", config.sheetName);
    if (config.skipRows !== undefined) formData.append("skip_rows", config.skipRows.toString());

    const response = await ragHttp.post(API_ENDPOINTS.rag.faqs.import, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
}

export const faqsService = new FAQsService();
