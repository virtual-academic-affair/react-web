import { API_ENDPOINTS } from "@/config/api.config";
import type {
    CancelReason,
    CreateCancelReasonDto,
    GetCancelReasonsParams,
    UpdateCancelReasonDto,
} from "@/types/classRegistration";
import type { PaginatedResponse } from "@/types/common";
import http from "../http";

class CancelReasonsService {
  async getList(
    params?: GetCancelReasonsParams,
  ): Promise<PaginatedResponse<CancelReason>> {
    const res = await http.get<PaginatedResponse<CancelReason>>(
      API_ENDPOINTS.classRegistration.cancelReasons.base,
      { params },
    );
    return res.data;
  }

  async getById(id: number): Promise<CancelReason> {
    const res = await http.get<CancelReason>(
      API_ENDPOINTS.classRegistration.cancelReasons.byId(id),
    );
    return res.data;
  }

  async create(dto: CreateCancelReasonDto): Promise<CancelReason> {
    const res = await http.post<CancelReason>(
      API_ENDPOINTS.classRegistration.cancelReasons.base,
      dto,
    );
    return res.data;
  }

  async update(id: number, dto: UpdateCancelReasonDto): Promise<CancelReason> {
    const res = await http.put<CancelReason>(
      API_ENDPOINTS.classRegistration.cancelReasons.byId(id),
      dto,
    );
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await http.delete(API_ENDPOINTS.classRegistration.cancelReasons.byId(id));
  }
}

export const cancelReasonsService = new CancelReasonsService();
