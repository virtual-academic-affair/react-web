import { API_ENDPOINTS } from "@/config/api.config";
import http from "../http";

export interface ResourceTodayStatsDto {
  open: number;
  totalToday: number;
}

export interface TaskTodayStatsDto {
  todo: number;
  totalToday: number;
}

export interface InquiryTodayStatsDto {
  totalToday: number;
  trainingToday: number;
  graduationToday: number;
}

export interface TodayDashboardSummaryDto {
  classRegistrations: ResourceTodayStatsDto;
  tasks: TaskTodayStatsDto;
  inquiries: InquiryTodayStatsDto;
}

class DashboardService {
  async getTodaySummary(params: {
    from: string;
    to: string;
  }): Promise<TodayDashboardSummaryDto> {
    const res = await http.get<TodayDashboardSummaryDto>(
      API_ENDPOINTS.shared.dashboardTodaySummary,
      { params },
    );
    return res.data;
  }
}

export const dashboardService = new DashboardService();
