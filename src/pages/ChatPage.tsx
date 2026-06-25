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
  const {
    messages,
    sessions,
    currentSessionId,
    isStreaming,
    error,
    provider,
    ragEnabled,
    send,
    loadSessions,
    switchSession,
    newChat,
    removeSession,
    setProvider,
    setRagEnabled,
    clearError,
    abortStream,
  } = useChat();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelect={switchSession}
        onNew={newChat}
        onDelete={removeSession}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
          <h1 className="text-sm font-medium text-gray-700">AI Chatbot</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDocUpload(true)}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              Upload Doc
            </button>
            <span className="text-xs text-gray-400">{user?.email}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-700"
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

        <ChatMessages messages={messages} />

        <ChatInput
          onSend={send}
          isStreaming={isStreaming}
          onStop={abortStream}
          provider={provider}
          onProviderChange={setProvider}
          ragEnabled={ragEnabled}
          onRagToggle={setRagEnabled}
        />
      </div>

      {showDocUpload && (
        <DocumentUpload onClose={() => setShowDocUpload(false)} />
      )}
    </div>
  );
}
