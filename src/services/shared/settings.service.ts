import { API_ENDPOINTS } from "@/config/api.config";
import http from "@/services/http";
import type { SettingKey, SettingsMap } from "@/types/shared";

class SettingsService {
  async getMany<K extends SettingKey>(keys: readonly K[] | K[]): Promise<Pick<SettingsMap, K>> {
    const res = await http.get<Pick<SettingsMap, K>>(API_ENDPOINTS.shared.settings, {
      params: { keys },
    });
    return res.data;
  }

  async update<K extends SettingKey>(
    key: K,
    dto: NonNullable<SettingsMap[K]>,
  ): Promise<void> {
    await http.put(API_ENDPOINTS.shared.settingsByKey(key), dto);
  }
}

export const settingsService = new SettingsService();

