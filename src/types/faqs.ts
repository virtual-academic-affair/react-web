export interface YearRange {
  fromYear: number;
  toYear: number;
}

export interface FAQ {
  id: string; // faqId in JSON, but mapped to id for frontend consistency if needed
  faqId: string; 
  question: string;
  answerRichText: string;
  /** true: chỉ admin/lecture được thấy */
  lecturerOnly: boolean;
  metadataFilter: {
    academicYear: YearRange;
    enrollmentYear: YearRange;
  };
  viewCount: number;
  source: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FAQListResponse {
  items: FAQ[];
  total: number;
  page: number;
  limit: number;
}

export interface FAQCandidate {
  id: string; // candidateId in JSON
  candidateId: string;
  question: string;
  answerDraftRichText: string;
  metadataFilterSuggestion: {
    academicYear: YearRange;
    enrollmentYear: YearRange;
  };
  status: "pending" | "approved" | "rejected";
  similarCount: number;
  sourceType: string;
  synthesisBatchId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FAQCandidateListResponse {
  items: FAQCandidate[];
  total: number;
  page: number;
  limit: number;
}
