export interface Form {
  id: string;
  documentType: string;
  contentLink: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetFormsParams {
  page?: number;
  limit?: number;
  keyword?: string;
  orderCol?: string;
  orderDir?: "ASC" | "DESC";
}

export interface CreateFormDto {
  documentType: string;
  contentLink: string;
  notes?: string;
}

export interface UpdateFormDto extends Partial<CreateFormDto> {}

export interface ImportFormsDto {
  documentTypeCol?: number;
  contentLinkCol?: number;
  notesCol?: number;
  startRow?: number;
}

export interface ImportFormsResult {
  message: string;
  created: number;
}
