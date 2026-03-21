/**
 * useAdminUsers
 * Shared query hook for fetching the list of admin users.
 * Cache is shared across all components — only one network request
 * is made no matter how many components use this hook simultaneously.
 *
 * staleTime: 5 minutes — the admin list rarely changes within a session.
 */

import { usersService } from "@/services/users";
import type { User } from "@/types/users";
import { useQuery } from "@tanstack/react-query";

export const ADMIN_USERS_QUERY_KEY = ["users", "admin"] as const;

export function useAdminUsers(): {
  admins: User[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: () =>
      usersService.getUsers({ roles: ["admin"], limit: 100 }).then((r) => r.items),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    admins: data ?? [],
    isLoading,
  };
}
