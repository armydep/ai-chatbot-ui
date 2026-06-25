import type { ChatRequest, ChatResponse } from "../types/api";
import { apiFetch, apiStreamFetch } from "./client";

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  return apiFetch("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({ ...request, stream: false }),
  });
}

export async function streamMessage(
  request: ChatRequest,
  signal?: AbortSignal,
): Promise<Response> {
  const response = await apiStreamFetch("/api/v1/chat", {
    ...request,
    stream: true,
  });

  if (signal?.aborted) {
    response.body?.cancel();
  }

  return response;
}
