import { API_CONFIG } from "@/config/api.config";
import { useAuthStore } from "@/stores/auth.store";
import axios from "axios";

const ragHttp = axios.create({
  baseURL: API_CONFIG.ragBaseURL,
  timeout: API_CONFIG.timeout,
  headers: { "Content-Type": "application/json" },
});

ragHttp.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

ragHttp.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default ragHttp;
