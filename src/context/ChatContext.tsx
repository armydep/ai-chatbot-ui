import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { ChatMessage, SessionResponse } from "../types/api";
import { streamMessage } from "../api/chat";
import { agentChat } from "../api/agent";
import { deleteSession as apiDeleteSession, getSession, listSessions } from "../api/sessions";

interface ChatState {
  messages: ChatMessage[];
  sessions: SessionResponse[];
  currentSessionId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  provider: "openai" | "local";
  ragEnabled: boolean;
  mode: "chat" | "agent";
}

type ChatAction =
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "UPDATE_LAST_ASSISTANT"; content: string }
  | { type: "SET_MESSAGES"; messages: ChatMessage[] }
  | { type: "SET_SESSIONS"; sessions: SessionResponse[] }
  | { type: "SET_SESSION_ID"; id: string | null }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_STREAMING"; streaming: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_PROVIDER"; provider: "openai" | "local" }
  | { type: "SET_RAG"; enabled: boolean }
  | { type: "SET_MODE"; mode: "chat" | "agent" }
  | { type: "NEW_CHAT" };

const initialState: ChatState = {
  messages: [],
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  isStreaming: false,
  error: null,
  provider: "openai",
  ragEnabled: false,
  mode: "chat",
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "UPDATE_LAST_ASSISTANT": {
      const msgs = [...state.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: action.content };
      }
      return { ...state, messages: msgs };
    }
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "SET_SESSIONS":
      return { ...state, sessions: action.sessions };
    case "SET_SESSION_ID":
      return { ...state, currentSessionId: action.id };
    case "SET_LOADING":
      return { ...state, isLoading: action.loading };
    case "SET_STREAMING":
      return { ...state, isStreaming: action.streaming };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_PROVIDER":
      return { ...state, provider: action.provider };
    case "SET_RAG":
      return { ...state, ragEnabled: action.enabled };
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "NEW_CHAT":
      return {
        ...state,
        messages: [],
        currentSessionId: crypto.randomUUID(),
        error: null,
      };
    default:
      return state;
  }
}

interface ChatContextValue extends ChatState {
  send: (content: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  switchSession: (id: string) => Promise<void>;
  newChat: () => void;
  removeSession: (id: string) => Promise<void>;
  setProvider: (provider: "openai" | "local") => void;
  setRagEnabled: (enabled: boolean) => void;
  setMode: (mode: "chat" | "agent") => void;
  clearError: () => void;
  abortStream: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    currentSessionId: crypto.randomUUID(),
  });

  const abortControllerRef = { current: null as AbortController | null };

  const loadSessions = useCallback(async () => {
    try {
      const data = await listSessions();
      dispatch({ type: "SET_SESSIONS", sessions: data.sessions });
    } catch {
      // Silently fail — sessions sidebar is non-critical
    }
  }, []);

  const sendChat = useCallback(
    async (content: string) => {
      dispatch({ type: "ADD_MESSAGE", message: { role: "user", content } });

      const allMessages: ChatMessage[] = [
        ...state.messages,
        { role: "user" as const, content },
      ];

      dispatch({ type: "SET_STREAMING", streaming: true });
      dispatch({ type: "ADD_MESSAGE", message: { role: "assistant", content: "" } });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await streamMessage({
          messages: allMessages,
          session_id: state.currentSessionId,
          provider: state.provider,
          use_rag: state.ragEnabled,
        }, controller.signal);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (controller.signal.aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!;

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data) as { content?: string; error?: string };
              if (parsed.error) {
                dispatch({ type: "SET_ERROR", error: parsed.error });
                break;
              }
              if (parsed.content) {
                accumulated += parsed.content;
                dispatch({ type: "UPDATE_LAST_ASSISTANT", content: accumulated });
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) {
          // User cancelled — not an error
        } else {
          dispatch({
            type: "SET_ERROR",
            error: err instanceof Error ? err.message : "Failed to send message",
          });
        }
      } finally {
        dispatch({ type: "SET_STREAMING", streaming: false });
        abortControllerRef.current = null;
        loadSessions();
      }
    },
    [state.messages, state.currentSessionId, state.provider, state.ragEnabled, loadSessions],
  );

  const sendAgent = useCallback(
    async (content: string) => {
      dispatch({ type: "ADD_MESSAGE", message: { role: "user", content } });
      dispatch({ type: "SET_LOADING", loading: true });

      try {
        const response = await agentChat({
          message: content,
          session_id: state.currentSessionId,
        });
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            role: "assistant",
            content: response.answer,
            toolCalls: response.tool_calls,
          },
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Failed to send message",
        });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
        loadSessions();
      }
    },
    [state.currentSessionId, loadSessions],
  );

  const send = useCallback(
    async (content: string) => {
      dispatch({ type: "SET_ERROR", error: null });
      if (state.mode === "agent") {
        await sendAgent(content);
      } else {
        await sendChat(content);
      }
    },
    [state.mode, sendChat, sendAgent],
  );

  const switchSession = useCallback(async (id: string) => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const session = await getSession(id);
      dispatch({ type: "SET_SESSION_ID", id });
      dispatch({ type: "SET_MESSAGES", messages: session.messages });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        error: err instanceof Error ? err.message : "Failed to load session",
      });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, []);

  const newChat = useCallback(() => {
    dispatch({ type: "NEW_CHAT" });
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      try {
        await apiDeleteSession(id);
        dispatch({
          type: "SET_SESSIONS",
          sessions: state.sessions.filter((s) => s.id !== id),
        });
        if (state.currentSessionId === id) {
          dispatch({ type: "NEW_CHAT" });
        }
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Failed to delete session",
        });
      }
    },
    [state.sessions, state.currentSessionId],
  );

  const setProvider = useCallback((provider: "openai" | "local") => {
    dispatch({ type: "SET_PROVIDER", provider });
  }, []);

  const setRagEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_RAG", enabled });
  }, []);

  const setMode = useCallback((mode: "chat" | "agent") => {
    dispatch({ type: "SET_MODE", mode });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  const abortStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      ...state,
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
    }),
    [state, send, loadSessions, switchSession, newChat, removeSession, setProvider, setRagEnabled, setMode, clearError, abortStream],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
