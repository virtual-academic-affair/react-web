export interface Form {
  id: number;
  documentType: string;
  contentLink: string;
  linkDisplayName?: string;
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
  linkDisplayName?: string;
  notes?: string;
}

export interface UpdateFormDto extends Partial<CreateFormDto> {}

export interface ImportFormsDto {
  documentTypeCol?: number;
  contentLinkCol?: number;
  linkDisplayNameCol?: number;
  notesCol?: number;
  startRow?: number;
}

export interface ImportFormsResult {
  message: string;
  count: number;
}
