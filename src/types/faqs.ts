export interface FAQ {
  id: string; // faqId in JSON, but mapped to id for frontend consistency if needed
  faqId: string; 
  question: string;
  answerRichText: string;
  metadataFilter: {
    academicYear: string[];
    cohort: string[];
  };
  isActive: boolean;
  viewCount: number;
  source: string;
  createdAt: string;
  updatedAt: string;
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
    academicYear: string[];
    cohort: string[];
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
