# AI Chatbot UI

## Project Overview

React SPA frontend for the [ai-chatbot-server](https://github.com/armydep/ai-chatbot-server) FastAPI backend.
Provides chat with SSE streaming, conversation sessions, provider switching (OpenAI/Ollama),
and RAG document upload.

## Tech Stack

- **Build:** Vite 8 + TypeScript (strict mode)
- **Framework:** React 19
- **Styling:** Tailwind CSS v4 (Vite plugin)
- **Routing:** React Router v7
- **HTTP:** fetch API (built-in), no axios
- **Markdown:** react-markdown

## Project Structure

```
src/
├── main.tsx              # React root mount
├── App.tsx               # Router: /login, /chat
├── index.css             # Tailwind import
├── types/api.ts          # TypeScript interfaces (mirrors backend Pydantic schemas)
├── api/
│   ├── client.ts         # apiFetch() wrapper with Bearer auth + 401 handling
│   ├── auth.ts           # requestOtp(), verifyOtp(), getMe()
│   ├── chat.ts           # sendMessage(), streamMessage()
│   ├── sessions.ts       # listSessions(), getSession(), deleteSession()
│   └── documents.ts      # ingestDocument()
├── context/
│   ├── AuthContext.tsx    # JWT storage, login/logout
│   └── ChatContext.tsx    # Messages, sessions, streaming, provider, RAG state
├── pages/
│   ├── LoginPage.tsx      # OTP email → code → JWT
│   └── ChatPage.tsx       # Layout: sidebar + chat + header
└── components/
    ├── ProtectedRoute.tsx  # Auth guard — redirects to /login
    ├── Sidebar.tsx         # Session list, new/delete
    ├── ChatMessages.tsx    # Message list with auto-scroll
    ├── MessageBubble.tsx   # Single message bubble
    ├── ChatInput.tsx       # Input + send + provider dropdown + RAG toggle
    └── DocumentUpload.tsx  # Modal for pasting document text
```

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build
npx tsc -b           # Type check
```

## Environment Variables

Copy `.env.example` to `.env`:

- `VITE_API_BASE_URL` — Backend API URL (default: `http://localhost:8000`)

## Backend Requirements

The backend must be running at `VITE_API_BASE_URL` with:
- CORS allowing `http://localhost:3000`
- Auth endpoints: `/api/v1/auth/request-otp`, `/api/v1/auth/verify-otp`, `/api/v1/auth/me`
- Chat endpoint: `POST /api/v1/chat` (streaming + non-streaming)
- Sessions: `GET/DELETE /api/v1/sessions`
- Documents: `POST /api/v1/documents`

## Conventions

- TypeScript interfaces in `src/types/api.ts` mirror backend Pydantic schemas
- API functions go in `src/api/` — one file per backend route group
- All API calls go through `apiFetch()` wrapper (never raw `fetch`)
- State managed via React Context + useReducer
- Styling via Tailwind utility classes — no CSS files per component
- JWT stored in memory (lost on refresh) — no localStorage

## Do Not

- Never store JWT in localStorage (XSS risk, and in-memory is fine for learning)
- Never call `fetch()` directly from components — use `apiFetch()` or `apiStreamFetch()`
- Never add CSS files per component — use Tailwind classes
