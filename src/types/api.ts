export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

export interface ApiError {
  detail: string;
}
