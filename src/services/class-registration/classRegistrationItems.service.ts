import { API_ENDPOINTS } from "@/config/api.config";
import type {
    ClassRegistrationItem,
    CreateClassRegistrationItemDto,
    UpdateClassRegistrationItemDto,
} from "@/types/classRegistration";
import http from "../http";

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
}

export const classRegistrationItemsService = new ClassRegistrationItemsService();
