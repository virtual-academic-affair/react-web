import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth.store";
import { getUserInfoFromToken, type UserInfo } from "@/utils/auth.util";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const USER_PROFILE_QUERY_KEY = ["auth", "me"] as const;

const hasUserInfo = (info: UserInfo) =>
  Boolean(info.name || info.email || info.picture);

export function useUserProfile() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const tokenUserInfo = useMemo(
    () => getUserInfoFromToken(accessToken),
    [accessToken],
  );

  const query = useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: () => authService.getMe(),
    enabled: Boolean(accessToken),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    placeholderData: (previousData) =>
      previousData ?? (hasUserInfo(tokenUserInfo) ? tokenUserInfo : undefined),
  });

  const userInfo: UserInfo = query.data ?? tokenUserInfo;
  const isLoadingUser = query.isLoading && !hasUserInfo(userInfo);

  return { userInfo, isLoadingUser };
}
