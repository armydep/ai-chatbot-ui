const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

let onUnauthorized: (() => void) | null = null;

export function setAuthCallbacks(handleUnauthorized: () => void) {
  onUnauthorized = handleUnauthorized;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    // Session auth lives in an httpOnly cookie (set by POST /auth/verify-otp),
    // not in JS-readable state — the browser attaches it automatically, but
    // only if we opt in to sending credentials on cross-origin requests.
    credentials: "include",
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
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  // Deliberately no Content-Type header — the browser sets it, including the
  // multipart boundary, when the body is a FormData instance.
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
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

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
