/**
 * Users Service
 * Handles user management operations
 */

import { API_ENDPOINTS } from "@/config/api.config";
import type { PaginatedResponse } from "@/types/common";
import type {
  AssignRoleDto,
  GetUsersParams,
  UpdateUserDto,
  User,
} from "@/types/users";
import http from "../http";

/**
 * Users Service
 */
class UsersService {
  /**
   * Get paginated list of users with optional filters
   * @param params - Query parameters for filtering, sorting, and pagination
   * @requires ADMIN role
   */
  async getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
    const res = await http.get<PaginatedResponse<User>>(
      API_ENDPOINTS.authentication.users.base,
      { params },
    );
    return res.data;
  }

  /**
   * Get user by ID
   * @param id - User ID
   * @requires ADMIN role
   */
  async getUserById(id: number): Promise<User> {
    const res = await http.get<User>(
      API_ENDPOINTS.authentication.users.byId(id),
    );
    return res.data;
  }

  /**
   * Update user
   * @param id - User ID
   * @param dto - Update data
   * @requires ADMIN role
   */
  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const res = await http.put<User>(
      API_ENDPOINTS.authentication.users.byId(id),
      dto,
    );
    return res.data;
  }

  /**
   * Assign role to user (creates user if not exists)
   * @param dto - Email and role to assign
   * @requires ADMIN role
   */
  async assignRole(dto: AssignRoleDto): Promise<User> {
    const res = await http.post<User>(
      API_ENDPOINTS.authentication.users.assignRole,
      dto,
    );
    return res.data;
  }
}

// Export singleton instance
export const usersService = new UsersService();
