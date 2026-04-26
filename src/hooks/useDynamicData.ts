/**
 * useDynamicData
 * Shared query hook for loading app settings.
 * Used by AdminLayout and passed down to pages that need it.
 *
 * staleTime: 10 minutes — settings almost never change during a session.
 */

import { settingsService } from "@/services/shared";
import type { DynamicDataResponse, SettingKey } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const DYNAMIC_DATA_QUERY_KEY = ["dynamicData"] as const;

export function useDynamicData(keys: readonly SettingKey[] | SettingKey[]): {
  data: DynamicDataResponse | undefined;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...DYNAMIC_DATA_QUERY_KEY, keys],
    queryFn: async () => ({ settings: await settingsService.getMany(keys) }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const refetch = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: DYNAMIC_DATA_QUERY_KEY });
  };

  return { data, isLoading, refetch };
}
