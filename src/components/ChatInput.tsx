import { useState } from "react";

interface Props {
  onSend: (content: string) => void;
  isStreaming: boolean;
  isLoading: boolean;
  onStop: () => void;
  provider: "openai" | "local";
  onProviderChange: (provider: "openai" | "local") => void;
  ragEnabled: boolean;
  onRagToggle: (enabled: boolean) => void;
  mode: "chat" | "agent";
  onModeChange: (mode: "chat" | "agent") => void;
}

export default function ChatInput({
  onSend,
  isStreaming,
  isLoading,
  onStop,
  provider,
  onProviderChange,
  ragEnabled,
  onRagToggle,
  mode,
  onModeChange,
}: Props) {
  const [input, setInput] = useState("");
  const busy = isStreaming || isLoading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    onSend(trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-3 text-xs">
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as "chat" | "agent")}
          aria-label="Chat mode"
          className="rounded border border-gray-300 px-2 py-1 text-xs font-medium"
        >
          <option value="chat">Chat</option>
          <option value="agent">Agent</option>
        </select>

        {mode === "chat" && (
          <>
            <select
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as "openai" | "local")}
              aria-label="LLM provider"
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="openai">OpenAI</option>
              <option value="local">Local (Ollama)</option>
            </select>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={ragEnabled}
                onChange={(e) => onRagToggle(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              RAG
            </label>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === "agent" ? "Ask the agent..." : "Type a message..."}
          rows={1}
          className="flex-1 resize-none rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
