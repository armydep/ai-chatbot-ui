import { useEffect, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatMessages from "../components/ChatMessages";
import ChatInput from "../components/ChatInput";
import DocumentUpload from "../components/DocumentUpload";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    isStreaming,
    error,
    provider,
    ragEnabled,
    mode,
    send,
    loadSessions,
    switchSession,
    newChat,
    removeSession,
    setProvider,
    setRagEnabled,
    setMode,
    clearError,
    abortStream,
  } = useChat();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <div className="flex min-h-[100svh] overflow-hidden bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Backdrop — only on mobile when the drawer is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — static on desktop, slide-over drawer on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelect={(id) => {
            switchSession(id);
            setSidebarOpen(false);
          }}
          onNew={() => {
            newChat();
            setSidebarOpen(false);
          }}
          onDelete={removeSession}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-col gap-2 border-b border-gray-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="-ml-1 rounded p-1 text-gray-600 hover:bg-gray-100 md:hidden"
              aria-label="Open conversations menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="truncate text-sm font-medium text-gray-700">AI Chatbot</h1>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={() => setShowDocUpload(true)}
              className="shrink-0 whitespace-nowrap rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              Upload<span className="hidden sm:inline"> Doc</span>
            </button>
            <span className="hidden max-w-[40vw] truncate text-xs text-gray-400 sm:inline">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="shrink-0 whitespace-nowrap text-xs text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-4 mt-2 flex items-center justify-between rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={clearError} className="ml-2 text-red-500 hover:text-red-700">
              &times;
            </button>
          </div>
        )}

        {isLoading && mode === "agent" && (
          <div className="mx-4 mt-2 flex items-center gap-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <span className="animate-pulse">Agent is thinking...</span>
          </div>
        )}

        <ChatMessages messages={messages} />

        <ChatInput
          onSend={send}
          isStreaming={isStreaming}
          isLoading={isLoading}
          onStop={abortStream}
          provider={provider}
          onProviderChange={setProvider}
          ragEnabled={ragEnabled}
          onRagToggle={setRagEnabled}
          mode={mode}
          onModeChange={setMode}
        />
      </div>

      {showDocUpload && (
        <DocumentUpload onClose={() => setShowDocUpload(false)} />
      )}
    </div>
  );
}
