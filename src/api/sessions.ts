import type { SessionDetailResponse, SessionListResponse } from "../types/api";
import { apiFetch } from "./client";

export async function listSessions(limit = 20, offset = 0): Promise<SessionListResponse> {
  return apiFetch(`/api/v1/sessions?limit=${limit}&offset=${offset}`);
}

export async function getSession(id: string): Promise<SessionDetailResponse> {
  return apiFetch(`/api/v1/sessions/${id}`);
}

export async function deleteSession(id: string): Promise<void> {
  await apiFetch(`/api/v1/sessions/${id}`, { method: "DELETE" });
}
