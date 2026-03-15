import { API_ENDPOINTS } from "@/config/api.config";
import type {
  Task,
  TaskStats,
  CreateTaskDto,
  GetTasksParams,
  GetTaskStatsParams,
  UpdateTaskDto,
} from "@/types/task";
import type { PaginatedResponse } from "@/types/common";
import http from "./http";

class TasksService {
  async getList(params?: GetTasksParams): Promise<PaginatedResponse<Task>> {
    const res = await http.get<PaginatedResponse<Task>>(
      API_ENDPOINTS.task.tasks.base,
      { params },
    );
    return res.data;
  }

  async getById(id: number): Promise<Task> {
    const res = await http.get<Task>(API_ENDPOINTS.task.tasks.byId(id));
    return res.data;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const res = await http.post<Task>(API_ENDPOINTS.task.tasks.base, dto);
    return res.data;
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const res = await http.put<Task>(API_ENDPOINTS.task.tasks.byId(id), dto);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    await http.delete(API_ENDPOINTS.task.tasks.byId(id));
  }

  async getStats(params: GetTaskStatsParams): Promise<TaskStats> {
    const res = await http.get<TaskStats>(API_ENDPOINTS.task.tasks.stats, {
      params,
    });
    return res.data;
  }
}

export const tasksService = new TasksService();
