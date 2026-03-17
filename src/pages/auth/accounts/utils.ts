import type { User } from "@/types/users.ts";

/**
 * Generate avatar URL for user
 * If user has picture, use it. Otherwise, generate from ui-avatars.com
 */
export function getUserAvatarUrl(user: User): string {
  if (user.picture) {
    return user.picture;
  }

  const name = user.name || user.email;
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random`;
}
