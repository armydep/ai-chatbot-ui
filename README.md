# AI Chatbot UI

React SPA frontend for the [ai-chatbot-server](https://github.com/armydep/ai-chatbot-server) FastAPI backend.

Built as part of an [AI Engineering Roadmap](https://github.com/armydep/ai-roadmap) project.

## Pages & Flow

```
localhost:3000/*
       │
       ▼
 ProtectedRoute
  ┌────┴────┐
  │no JWT   │has JWT
  ▼         ▼
/login    /chat
```

### /login — LoginPage

Two-step OTP authentication:

```
┌──────────────────────┐
│  Step 1: Enter Email │
│  → POST /auth/       │
│    request-otp       │
│  (OTP logged to      │
│   backend console)   │
├──────────────────────┤
│  Step 2: Enter Code  │
│  → POST /auth/       │
│    verify-otp        │
│  Returns JWT token   │
│  → redirect to /chat │
└──────────────────────┘
```

### /chat — ChatPage

```
┌─────────┬──────────────────────────────────┐
│         │  Header: email | Upload Doc |    │
│         │          Logout                  │
│ Sidebar ├──────────────────────────────────┤
│         │                                  │
│ + New   │  ChatMessages                    │
│ Chat    │  ┌──────────────────────┐        │
│         │  │ User (blue, right)   │        │
│ Sess 1  │  │ Assistant (gray,left)│        │
│ Sess 2  │  │ Streaming tokens...  │        │
│ Sess 3  │  └──────────────────────┘        │
│         ├──────────────────────────────────┤
│         │  [OpenAI ▾] [☑ RAG]             │
│         │  [ message...        ] [Send]    │
│         │  POST /chat (stream: true)       │
└─────────┴──────────────────────────────────┘

┌──────────────────────────────────┐
│  DocumentUpload (modal overlay)  │
│  Source + Content textarea       │
│  POST /documents → "N chunks"   │
└──────────────────────────────────┘
```

**Navigation rules:**
- Any URL without JWT → redirect to `/login`
- 401 response from backend → clear token, redirect to `/login`
- Logout button → clear token, redirect to `/login`

## Features

- **OTP + JWT login** — email-based authentication
- **SSE streaming chat** — real-time token-by-token via `fetch` + `ReadableStream`
- **Sessions sidebar** — list, create, switch, delete conversations
- **Provider toggle** — switch between OpenAI and Local (Ollama) per request
- **RAG toggle** — enable document-grounded responses
- **Document upload** — paste text to ingest into the RAG pipeline
- **Stop button** — cancel streaming via `AbortController`
- **Error handling** — 401 redirect, inline error messages, rate limit display

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | Vite 8 | Fast dev server, hot reload, zero config |
| Language | TypeScript (strict) | Compile-time type safety |
| Framework | React 19 | Component-based UI |
| Styling | Tailwind CSS v4 | Utility-first, no CSS files per component |
| Routing | React Router v7 | URL → component mapping |
| HTTP | fetch (built-in) | No extra dependencies |
| SSE | fetch + ReadableStream | POST with auth headers (EventSource is GET-only) |
| Markdown | react-markdown | Render formatting in assistant responses |

## Getting Started

### Prerequisites

- Node.js 18+
- Backend running at `http://localhost:8000` ([ai-chatbot-server](https://github.com/armydep/ai-chatbot-server))

### Setup

```bash
git clone git@github.com:armydep/ai-chatbot-ui.git
cd ai-chatbot-ui
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000. The login page appears — enter any email, read the OTP from the backend console, and you're in.

### Backend Setup

The backend must be running with CORS allowing `http://localhost:3000`:

```bash
cd ai-chatbot-server
docker compose up --build
```

For local LLM support (optional):

```bash
docker compose --profile local-llm up ollama -d
docker exec -it $(docker compose --profile local-llm ps -q ollama) ollama pull llama3.2:1b
```

## Project Structure

```
src/
├── main.tsx              # React root mount
├── App.tsx               # Router: /login, /chat
├── index.css             # Tailwind import
├── types/api.ts          # TypeScript interfaces (mirrors backend Pydantic models)
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
    └── DocumentUpload.tsx  # Modal for document text ingestion
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API URL |

## Development

```bash
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build to dist/
npx tsc -b           # Type check
npm run lint         # Lint with oxlint
```

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/auth/request-otp` | Request OTP code |
| `POST /api/v1/auth/verify-otp` | Verify OTP, get JWT |
| `GET /api/v1/auth/me` | Current user info |
| `POST /api/v1/chat` | Chat (streaming SSE or JSON) |
| `GET /api/v1/sessions` | List conversation sessions |
| `GET /api/v1/sessions/{id}` | Get session with messages |
| `DELETE /api/v1/sessions/{id}` | Delete a session |
| `POST /api/v1/documents` | Ingest document for RAG |

## License

MIT
