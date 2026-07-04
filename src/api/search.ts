import type { MessageSearchRequest, MessageSearchResponse } from "../types/api";
import { apiFetch } from "./client";

export async function searchMessages(
  request: MessageSearchRequest,
): Promise<MessageSearchResponse> {
  return apiFetch("/api/v1/search", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
