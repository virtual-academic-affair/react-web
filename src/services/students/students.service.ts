import { API_ENDPOINTS } from "@/config/api.config";
import type {
  CreateStudentDto,
  GetStudentsParams,
  ImportStudentsDto,
  ImportStudentsResult,
  Student,
  UpdateStudentDto,
} from "@/types/students";
import type { PaginatedResponse } from "@/types/common";
import http from "@/services/http";

class StudentsService {
  async getStudents(
    params?: GetStudentsParams,
  ): Promise<PaginatedResponse<Student>> {
    const res = await http.get<PaginatedResponse<Student>>(
      API_ENDPOINTS.authentication.students.base,
      { params },
    );
    return res.data;
  }

  async createStudent(dto: CreateStudentDto): Promise<Student> {
    const res = await http.post<Student>(
      API_ENDPOINTS.authentication.students.base,
      dto,
    );
    return res.data;
  }

  async getStudentById(id: number): Promise<Student> {
    const res = await http.get<Student>(
      API_ENDPOINTS.authentication.students.byId(id),
    );
    return res.data;
  }

  async updateStudent(id: number, dto: UpdateStudentDto): Promise<Student> {
    const res = await http.put<Student>(
      API_ENDPOINTS.authentication.students.byId(id),
      dto,
    );
    return res.data;
  }

  async removeStudent(id: number): Promise<void> {
    await http.delete(API_ENDPOINTS.authentication.students.byId(id));
  }

  async importStudents(
    file: File,
    dto: ImportStudentsDto,
  ): Promise<ImportStudentsResult> {
    const formData = new FormData();
    formData.append("file", file);

    if (dto.studentCodeCol != null) {
      formData.append("studentCodeCol", String(dto.studentCodeCol));
    }
    if (dto.studentNameCol != null) {
      formData.append("studentNameCol", String(dto.studentNameCol));
    }
    if (dto.startRow != null) {
      formData.append("startRow", String(dto.startRow));
    }

    const res = await http.post<ImportStudentsResult>(
      API_ENDPOINTS.authentication.students.import,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  }
}

export const studentsService = new StudentsService();
