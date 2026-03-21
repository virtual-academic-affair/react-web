/**
 * useDynamicData
 * Shared query hook for the global dynamic-data fetch (settings + enums).
 * Used by AdminLayout and passed down to pages that need it.
 *
 * staleTime: 10 minutes — settings/enums almost never change during a session.
 */

import { dynamicDataService } from "@/services/shared";
import type { DynamicDataParams, DynamicDataResponse } from "@/types/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const DYNAMIC_DATA_QUERY_KEY = ["dynamicData"] as const;

export function useDynamicData(params?: DynamicDataParams): {
  data: DynamicDataResponse | undefined;
  isLoading: boolean;
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: DYNAMIC_DATA_QUERY_KEY,
    queryFn: () => dynamicDataService.get(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const refetch = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: DYNAMIC_DATA_QUERY_KEY });
  };

  return { data, isLoading, refetch };
}
