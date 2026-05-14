import { API_ENDPOINTS } from "@/config/api.config";
import type { PaginatedResponse } from "@/types/common";
import type {
  ClassRegistrationItem,
  CreateClassRegistrationItemDto,
  GetClassRegistrationItemsParams,
  ItemStatus,
  OverviewSubjectGroup,
  RegistrationAction,
  UpdateClassRegistrationItemDto,
} from "@/types/classRegistration";
import http from "../http";

/** parentId = 0: toàn hệ thống (ResourceItemService không lọc theo parent). */
export const CLASS_REGISTRATION_ITEMS_GLOBAL_PARENT_ID = 0;

class ClassRegistrationItemsService {
  async create(
    parentId: number,
    dto: CreateClassRegistrationItemDto,
  ): Promise<ClassRegistrationItem> {
    const res = await http.post<ClassRegistrationItem>(
      API_ENDPOINTS.classRegistration.registrations.items(parentId),
      dto,
    );
    return res.data;
  }

  async update(
    parentId: number,
    id: number,
    dto: UpdateClassRegistrationItemDto,
  ): Promise<ClassRegistrationItem> {
    const res = await http.put<ClassRegistrationItem>(
      API_ENDPOINTS.classRegistration.registrations.itemById(parentId, id),
      dto,
    );
    return res.data;
  }

  async remove(parentId: number, id: number): Promise<void> {
    await http.delete(
      API_ENDPOINTS.classRegistration.registrations.itemById(parentId, id),
    );
  }

  async findAll(
    parentId: number,
    params?: GetClassRegistrationItemsParams,
  ): Promise<PaginatedResponse<ClassRegistrationItem>> {
    const res = await http.get<PaginatedResponse<ClassRegistrationItem>>(
      API_ENDPOINTS.classRegistration.registrations.items(parentId),
      { params },
    );
    return res.data;
  }

  async overview(
    parentId: number,
    params?: {
      sentFrom?: string;
      sentTo?: string;
      messageStatuses?: string[];
      actions?: RegistrationAction[];
      statuses?: ItemStatus[];
      itemCreatedFrom?: string;
      itemCreatedTo?: string;
    },
  ): Promise<OverviewSubjectGroup[]> {
    const res = await http.get<OverviewSubjectGroup[]>(
      API_ENDPOINTS.classRegistration.registrations.itemsOverview(parentId),
      { params },
    );
    return res.data;
  }

  async bulkUpdateStatus(
    parentId: number,
    body: { ids: number[]; status: ItemStatus },
  ): Promise<{ updated: number; requested: number }> {
    const res = await http.post<{ updated: number; requested: number }>(
      API_ENDPOINTS.classRegistration.registrations.itemsBulkStatus(parentId),
      body,
    );
    return res.data;
  }
}

export const classRegistrationItemsService = new ClassRegistrationItemsService();
