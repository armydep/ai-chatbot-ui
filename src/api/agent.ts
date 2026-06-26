import { apiFetch } from "./client";
import type { AgentChatRequest, AgentChatResponse } from "../types/api";

export async function agentChat(request: AgentChatRequest): Promise<AgentChatResponse> {
  return apiFetch<AgentChatResponse>("/api/v1/agent/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
