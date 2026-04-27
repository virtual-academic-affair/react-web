import { API_ENDPOINTS } from "@/config/api.config";
import type {
  CreateFormDto,
  GetFormsParams,
  ImportFormsDto,
  ImportFormsResult,
  Form,
  UpdateFormDto,
} from "@/types/forms";
import type { PaginatedResponse } from "@/types/common";
import http from "@/services/http";

class FormsService {
  async getForms(
    params?: GetFormsParams,
  ): Promise<PaginatedResponse<Form>> {
    const res = await http.get<PaginatedResponse<Form>>(
      API_ENDPOINTS.document.forms.base,
      { params },
    );
    return res.data;
  }

  async createForm(dto: CreateFormDto): Promise<Form> {
    const res = await http.post<Form>(
      API_ENDPOINTS.document.forms.base,
      dto,
    );
    return res.data;
  }

  async getFormById(id: number): Promise<Form> {
    const res = await http.get<Form>(
      API_ENDPOINTS.document.forms.byId(id),
    );
    return res.data;
  }

  async updateForm(id: number, dto: UpdateFormDto): Promise<Form> {
    const res = await http.put<Form>(
      API_ENDPOINTS.document.forms.byId(id),
      dto,
    );
    return res.data;
  }

  async removeForm(id: number): Promise<void> {
    await http.delete(API_ENDPOINTS.document.forms.byId(id));
  }

  async previewImport(
    file: File,
    dto: ImportFormsDto,
  ): Promise<{ rows: any[] }> {
    const formData = new FormData();
    formData.append("file", file);

    if (dto.documentTypeCol != null) formData.append("documentTypeCol", String(dto.documentTypeCol));
    if (dto.contentLinkCol != null) formData.append("contentLinkCol", String(dto.contentLinkCol));
    if (dto.linkDisplayNameCol != null) formData.append("linkDisplayNameCol", String(dto.linkDisplayNameCol));
    if (dto.notesCol != null) formData.append("notesCol", String(dto.notesCol));
    if (dto.startRow != null) formData.append("startRow", String(dto.startRow));

    const res = await http.post<{ rows: any[] }>(
      API_ENDPOINTS.document.forms.importPreview,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  }

  async importForms(
    file: File,
    dto: ImportFormsDto,
  ): Promise<ImportFormsResult> {
    const formData = new FormData();
    formData.append("file", file);

    if (dto.documentTypeCol != null) formData.append("documentTypeCol", String(dto.documentTypeCol));
    if (dto.contentLinkCol != null) formData.append("contentLinkCol", String(dto.contentLinkCol));
    if (dto.linkDisplayNameCol != null) formData.append("linkDisplayNameCol", String(dto.linkDisplayNameCol));
    if (dto.notesCol != null) formData.append("notesCol", String(dto.notesCol));
    if (dto.startRow != null) formData.append("startRow", String(dto.startRow));

    const res = await http.post<ImportFormsResult>(
      API_ENDPOINTS.document.forms.import,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  }
}

export const formsService = new FormsService();
