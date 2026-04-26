import { appConfig } from "./config";
import type { ApiEnvelope } from "./types";

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    const message = body?.error?.message || `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status, body?.error?.code);
  }

  return body;
}
