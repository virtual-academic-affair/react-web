/**
 * User types for authentication/users module
 */

import type { ResourceQueryDto } from "./common";

/**
 * Role values matching backend Role enum
 */
export const Role = {
  Student: "student",
  Admin: "admin",
  Lecture: "lecture",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/**
 * Role display mapping for UI
 */
export const RoleLabels: Record<Role, string> = {
  [Role.Student]: "Sinh viên",
  [Role.Admin]: "Giáo vụ",
  [Role.Lecture]: "Giảng viên",
};

/**
 * Role color mapping for badges
 */
export const RoleColors: Record<Role, { bg: string; text: string }> = {
  [Role.Student]: { bg: "bg-blue-100", text: "text-blue-800" },
  [Role.Admin]: { bg: "bg-red-100", text: "text-red-800" },
  [Role.Lecture]: { bg: "bg-yellow-100", text: "text-yellow-800" },
};

/**
 * User entity
 */
export interface User {
  id: number;
  email: string;
  googleId?: string;
  name?: string;
  role: Role;
  picture?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Query params for users list
 */
export interface GetUsersParams extends ResourceQueryDto {
  roles?: Role[];
  isActive?: boolean;
}


/**
 * DTO for assigning role to user
 */
export interface AssignRoleDto {
  email: string;
  role: Role;
}

/**
 * DTO for updating user
 */
export interface UpdateUserDto {
  role?: Role;
  isActive?: boolean;
}
