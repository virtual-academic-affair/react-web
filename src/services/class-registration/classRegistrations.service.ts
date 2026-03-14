import { API_ENDPOINTS } from "@/config/api.config";
import type {
    ClassRegistration,
    ClassRegistrationStats,
    CreateClassRegistrationDto,
    GetClassRegistrationsParams,
    GetStatsParams,
    PreviewReplyDto,
    ReplyDto,
    UpdateClassRegistrationDto,
} from "@/types/classRegistration";
import type { PaginatedResponse } from "@/types/common";
import http from "../http";

class ClassRegistrationsService {
  async getList(
    params?: GetClassRegistrationsParams,
  ): Promise<PaginatedResponse<ClassRegistration>> {
    const res = await http.get<PaginatedResponse<ClassRegistration>>(
      API_ENDPOINTS.classRegistration.registrations.base,
      { params },
    );
    return res.data;
  }

  async getById(id: number): Promise<ClassRegistration> {
    const res = await http.get<ClassRegistration>(
      API_ENDPOINTS.classRegistration.registrations.byId(id),
    );
    return res.data;
  }

  async create(dto: CreateClassRegistrationDto): Promise<ClassRegistration> {
    const res = await http.post<ClassRegistration>(
      API_ENDPOINTS.classRegistration.registrations.base,
      dto,
    );
    return res.data;
  }

  async update(
    id: number,
    dto: UpdateClassRegistrationDto,
  ): Promise<ClassRegistration> {
    const res = await http.put<ClassRegistration>(
      API_ENDPOINTS.classRegistration.registrations.byId(id),
      dto,
    );
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await http.delete(API_ENDPOINTS.classRegistration.registrations.byId(id));
  }

  async getStats(params: GetStatsParams): Promise<ClassRegistrationStats> {
    const res = await http.get<ClassRegistrationStats>(
      API_ENDPOINTS.classRegistration.registrations.stats,
      { params },
    );
    return res.data;
  }

  async previewReply(id: number): Promise<PreviewReplyDto> {
    const res = await http.get<PreviewReplyDto>(
      API_ENDPOINTS.classRegistration.registrations.previewReply(id),
    );
    return res.data;
  }

  async reply(id: number, dto: ReplyDto): Promise<void> {
    await http.post(API_ENDPOINTS.classRegistration.registrations.reply(id), dto);
  }
}

export const classRegistrationsService = new ClassRegistrationsService();
