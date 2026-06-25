import type { DocumentIngestRequest, DocumentIngestResponse } from "../types/api";
import { apiFetch } from "./client";

export async function ingestDocument(request: DocumentIngestRequest): Promise<DocumentIngestResponse> {
  return apiFetch("/api/v1/documents", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
