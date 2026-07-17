import { useState } from "react";
import { ingestDocument, uploadDocumentFile } from "../api/documents";

interface Props {
  onClose: () => void;
}

type Mode = "paste" | "file";

const ACCEPTED_EXTENSIONS = [".txt", ".md", ".pdf"];
const ACCEPT_ATTR = ".txt,.md,.pdf,text/plain,text/markdown,application/pdf";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors the backend limit

function hasAcceptedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function DocumentUpload({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>("paste");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setResult(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError("");
    setResult(null);
    if (selected && !hasAcceptedExtension(selected.name)) {
      setFile(null);
      setError(`Unsupported file type. Allowed: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return;
    }
    if (selected && selected.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setError("File is too large (max 10 MB).");
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "paste" && !content.trim()) return;
    if (mode === "file" && !file) return;

    setIsSubmitting(true);
    setError("");
    setResult(null);

    try {
      const response =
        mode === "file" && file
          ? await uploadDocumentFile(file, source)
          : await ingestDocument({
              content: content.trim(),
              source: source.trim() || undefined,
            });
      setResult(`${response.chunk_count} chunks created`);
      setContent("");
      setSource("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSubmitDisabled =
    isSubmitting || (mode === "paste" ? !content.trim() : !file);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Upload Document</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>

        <div role="tablist" className="mb-4 flex gap-1 rounded bg-gray-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "paste"}
            onClick={() => switchMode("paste")}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
              mode === "paste"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Paste text
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "file"}
            onClick={() => switchMode("file")}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
              mode === "file"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Upload file
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {result && (
          <div className="mb-3 rounded bg-green-50 p-2 text-sm text-green-700">
            {result}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="doc-source" className="mb-1 block text-sm font-medium text-gray-700">
            Source (optional)
          </label>
          <input
            id="doc-source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={mode === "file" ? "Defaults to the file name" : "e.g. user-guide.txt"}
            className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          {mode === "paste" ? (
            <>
              <label htmlFor="doc-content" className="mb-1 block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="doc-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste document text here..."
                rows={10}
                required
                className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </>
          ) : (
            <>
              <label htmlFor="doc-file" className="mb-1 block text-sm font-medium text-gray-700">
                File
              </label>
              <input
                id="doc-file"
                type="file"
                accept={ACCEPT_ATTR}
                onChange={handleFileChange}
                className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mb-4 text-xs text-gray-500">
                Supported: {ACCEPTED_EXTENSIONS.join(", ")} — up to 10 MB.
                {file ? ` Selected: ${file.name}` : ""}
              </p>
            </>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
