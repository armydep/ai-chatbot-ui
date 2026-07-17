import type { DocumentIngestRequest, DocumentIngestResponse } from "../types/api";
import { apiFetch, apiUpload } from "./client";

export async function ingestDocument(request: DocumentIngestRequest): Promise<DocumentIngestResponse> {
  return apiFetch("/api/v1/documents", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function uploadDocumentFile(
  file: File,
  source?: string,
): Promise<DocumentIngestResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (source && source.trim()) {
    formData.append("source", source.trim());
  }
  return apiUpload("/api/v1/documents/upload", formData);
}
