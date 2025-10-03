import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { getAuthHeader, refresh } from "../auth/tokenManager";
import { getApiBaseUrl } from "./baseUrl";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<AxiosResponse<T>> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const { method = "GET", body, headers = {}, signal, timeoutMs } = options;

  const config: AxiosRequestConfig = {
    url,
    method,
    headers: { ...headers },
    data: body,
    signal,
  };

  if (timeoutMs !== undefined) {
    config.timeout = timeoutMs;
  }

  if (body && !config.headers?.["Content-Type"]) {
    config.headers = {
      ...config.headers,
      "Content-Type": "application/json",
    };
  }

  let shouldRetry = true;

  const performRequest = async (): Promise<AxiosResponse<T>> => {
    const authHeader = await getAuthHeader();
    config.headers = {
      ...config.headers,
      ...authHeader,
    };

    try {
      return await axios<T>(config);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 && shouldRetry) {
        shouldRetry = false;
        await refresh();
        return performRequest();
      }
      throw error;
    }
  };

  return performRequest();
}
