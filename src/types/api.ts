export interface ToolCallRecord {
  tool_name: string;
  arguments: Record<string, unknown>;
  result: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  toolCalls?: ToolCallRecord[];
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
  session_id?: string | null;
  use_rag?: boolean;
  provider?: "openai" | "local";
}

export interface ChatResponse {
  role: string;
  content: string;
  model: string;
  usage: Record<string, number> | null;
  session_id: string | null;
}

export interface SessionResponse {
  id: string;
  title: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface SessionListResponse {
  sessions: SessionResponse[];
}

export interface SessionDetailResponse {
  id: string;
  title: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface DocumentIngestRequest {
  content: string;
  metadata?: Record<string, string>;
  source?: string | null;
}

export interface DocumentIngestResponse {
  chunk_count: number;
  source: string | null;
}

export interface OTPRequestBody {
  email: string;
}

export interface OTPVerifyRequest {
  email: string;
  code: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserMeResponse {
  user_id: string;
  email: string;
  role: string;
  auth_method: string;
}

export interface LogoutResponse {
  message: string;
}

export interface AgentChatRequest {
  message: string;
  model?: string;
  temperature?: number;
  tools?: string[];
  session_id?: string | null;
}

export interface AgentChatResponse {
  answer: string;
  tool_calls: ToolCallRecord[];
  model: string;
  session_id: string | null;
}

export interface MessageSearchRequest {
  query: string;
  role?: "user" | "assistant" | null;
  date_from?: string | null;
  date_to?: string | null;
  limit?: number;
  offset?: number;
}

export interface SearchMatch {
  id: string;
  match_type: "message" | "session_title";
  role: string | null;
  snippets: string[];
  score: number;
  created_at: string;
}

export interface SessionSearchGroup {
  session_id: string;
  session_title: string | null;
  matches: SearchMatch[];
}

export interface MessageSearchResponse {
  query: string;
  total: number;
  groups: SessionSearchGroup[];
}

export interface ApiError {
  detail: string;
}
