import type { Role } from "@/types/users";

/**
 * Returns the default dashboard path for a given role.
 * Used across RoleRoute, DefaultRedirect, and callback page.
 */
export function getRolePath(role: Role | null): string {
  if (role === "admin") return "/admin/dashboard";
  if (role) return "/user";
  return "/auth/login";
}

export interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

/**
 * Decodes basic user info (name, email, picture) from a JWT access token.
 * Used by layouts and pages to show user profile without an extra API call.
 */
export function getUserInfoFromToken(token: string | null): UserInfo {
  if (!token) return {};
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return {
      name: payload.name ?? payload.email ?? undefined,
      email: payload.email ?? undefined,
      picture: payload.picture ?? undefined,
    };
  } catch {
    return {};
  }
}

