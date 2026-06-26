const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

let tokenGetter: (() => string | null) | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthCallbacks(
  getToken: () => string | null,
  handleUnauthorized: () => void,
) {
  tokenGetter = getToken;
  onUnauthorized = handleUnauthorized;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenGetter?.();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(body.detail || `Request failed (${response.status})`, response.status);
  }

  return response.json() as Promise<T>;
}

export async function apiStreamFetch(
  path: string,
  body: unknown,
): Promise<Response> {
  const token = tokenGetter?.();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(errorBody.detail || `Request failed (${response.status})`, response.status);
  }

  return response;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
