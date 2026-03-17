import { API_ENDPOINTS } from "@/config/api.config";
import type {
  Inquiry,
  InquiryStats,
  CreateInquiryDto,
  GetInquiriesParams,
  InquiryPreviewReplyDto,
  InquiryReplyDto,
  UpdateInquiryDto,
} from "@/types/inquiry";
import type { PaginatedResponse } from "@/types/common";
import http from "../http";
import type { GetStatsParams } from "@/types/classRegistration";

class InquiriesService {
  async getList(
    params?: GetInquiriesParams,
  ): Promise<PaginatedResponse<Inquiry>> {
    const res = await http.get<PaginatedResponse<Inquiry>>(
      API_ENDPOINTS.inquiry.inquiries.base,
      { params },
    );
    return res.data;
  }

  async getById(id: number): Promise<Inquiry> {
    const res = await http.get<Inquiry>(
      API_ENDPOINTS.inquiry.inquiries.byId(id),
    );
    return res.data;
  }

  async create(dto: CreateInquiryDto): Promise<Inquiry> {
    const res = await http.post<Inquiry>(
      API_ENDPOINTS.inquiry.inquiries.base,
      dto,
    );
    return res.data;
  }

  async update(
    id: number,
    dto: UpdateInquiryDto,
  ): Promise<Inquiry> {
    const res = await http.put<Inquiry>(
      API_ENDPOINTS.inquiry.inquiries.byId(id),
      dto,
    );
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await http.delete(API_ENDPOINTS.inquiry.inquiries.byId(id));
  }

  async getStats(params: GetStatsParams): Promise<InquiryStats> {
    const res = await http.get<InquiryStats>(
      API_ENDPOINTS.inquiry.inquiries.stats,
      { params },
    );
    return res.data;
  }

  async previewReply(id: number): Promise<InquiryPreviewReplyDto> {
    const res = await http.get<InquiryPreviewReplyDto>(
      API_ENDPOINTS.inquiry.inquiries.previewReply(id),
    );
    return res.data;
  }

  async reply(id: number, dto: InquiryReplyDto): Promise<void> {
    await http.post(API_ENDPOINTS.inquiry.inquiries.reply(id), dto);
  }
}

export const inquiriesService = new InquiriesService();
