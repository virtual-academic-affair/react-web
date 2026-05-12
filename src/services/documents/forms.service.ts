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
import ragHttp from "@/services/rag-http";

class FormsService {
  async getForms(
    params?: GetFormsParams,
  ): Promise<PaginatedResponse<Form>> {
    const res = await ragHttp.get<PaginatedResponse<Form>>(
      API_ENDPOINTS.rag.forms.base,
      { params },
    );
    return res.data;
  }

  async createForm(dto: CreateFormDto): Promise<Form> {
    const res = await ragHttp.post<Form>(
      API_ENDPOINTS.rag.forms.base,
      dto,
    );
    return res.data;
  }

  async getFormById(id: string): Promise<Form> {
    const res = await ragHttp.get<Form>(
      API_ENDPOINTS.rag.forms.byId(id),
    );
    return res.data;
  }

  async updateForm(id: string, dto: UpdateFormDto): Promise<Form> {
    const res = await ragHttp.put<Form>(
      API_ENDPOINTS.rag.forms.byId(id),
      dto,
    );
    return res.data;
  }

  async removeForm(id: string): Promise<void> {
    await ragHttp.delete(API_ENDPOINTS.rag.forms.byId(id));
  }

  async importForms(
    file: File,
    dto: ImportFormsDto,
  ): Promise<ImportFormsResult> {
    const formData = new FormData();
    formData.append("file", file);

    if (dto.documentTypeCol != null) formData.append("document_type_col", String(dto.documentTypeCol));
    if (dto.contentLinkCol != null) formData.append("content_link_col", String(dto.contentLinkCol));
    if (dto.notesCol != null) formData.append("notes_col", String(dto.notesCol));
    if (dto.startRow != null) formData.append("start_row", String(dto.startRow));

    const res = await ragHttp.post<ImportFormsResult>(
      API_ENDPOINTS.rag.forms.import,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  }
}

export const formsService = new FormsService();
