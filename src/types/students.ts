export interface ImportStudentsDto {
  studentCodeCol?: number;
  studentNameCol?: number;
  startRow?: number;
}

export interface ImportStudentsResult {
  insertedOrUpdated: number;
}

export interface Student {
  id: number;
  studentCode: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetStudentsParams {
  page?: number;
  limit?: number;
  keyword?: string;
}

export interface CreateStudentDto {
  studentCode: string;
  studentName: string;
}

export interface UpdateStudentDto {
  studentCode?: string;
  studentName?: string;
}
