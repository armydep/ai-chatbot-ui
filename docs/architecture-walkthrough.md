# Architecture Walkthrough

A guided tour of this codebase for developers new to React.

## How the app boots

React apps have a single HTML page; JavaScript builds everything else. The chain here is:

1. [main.tsx](../src/main.tsx) — finds the `<div id="root">` in `index.html` and mounts the React tree into it. It wraps everything in `<AuthProvider>` so authentication state is available app-wide.
2. [App.tsx](../src/App.tsx) — defines the **routes**. There are only two real "pages": `/login` and `/chat`. Any other URL redirects to `/chat`. Note two things wrapped around ChatPage:
   - `<ProtectedRoute>` — if you're not logged in, it redirects to `/login` ([ProtectedRoute.tsx](../src/components/ProtectedRoute.tsx), just 12 lines — worth reading first).
   - `<ChatProvider>` — makes all chat state available to everything inside ChatPage.

## The three layers

The app is organized in a classic layered pattern:

### 1. API layer (`src/api/`)

Plain TypeScript functions, no React. One file per backend route group (`auth.ts`, `chat.ts`, `sessions.ts`...). All of them go through [client.ts](../src/api/client.ts), which:

- Prepends the base URL from the `VITE_API_BASE_URL` env var
- Attaches the JWT as a `Bearer` header on every request
- On a `401` response, calls a `logout` callback so an expired token kicks you back to login globally, without every component handling it

### 2. State layer (`src/context/`)

Two React Contexts. **Context** is React's mechanism for sharing state across the tree without passing props through every level:

- [AuthContext.tsx](../src/context/AuthContext.tsx) — holds the JWT token and user info **in memory only** (deliberately no localStorage — refresh logs you out; that's a stated security choice in CLAUDE.md). Exposes `login()`/`logout()` via the `useAuth()` hook.
- [ChatContext.tsx](../src/context/ChatContext.tsx) — the heart of the app. Holds messages, sessions, streaming status, provider/RAG/mode settings, and all the actions (`send`, `switchSession`, `newChat`...). Exposed via the `useChat()` hook.

### 3. UI layer (`src/pages/` and `src/components/`)

Pages are route-level layouts; components are reusable pieces. The UI components are mostly **"dumb"**: [Sidebar.tsx](../src/components/Sidebar.tsx) and [ChatInput.tsx](../src/components/ChatInput.tsx) receive everything as props and just call callbacks. [ChatPage.tsx](../src/pages/ChatPage.tsx) is the wiring point — it pulls state out of `useChat()` and passes it down.

Plus [types/api.ts](../src/types/api.ts) — TypeScript interfaces mirroring the backend's Pydantic schemas, so requests/responses are type-checked.

## Key React concepts this app demonstrates

**Props down, events up.** Look at ChatPage → ChatInput: state (`provider`, `mode`) flows down as props; user actions flow up as callbacks (`onProviderChange`, `onSend`). The child never changes state itself — it asks the parent to. This one-way data flow is *the* core React idea.

**useState** — local state that only one component cares about. E.g., the draft text in `ChatInput.tsx`, or the email/otp step in `LoginPage.tsx`. Calling the setter re-renders the component.

**useReducer** — like useState, but for complex state with many kinds of updates. `ChatContext.tsx` has a `chatReducer(state, action)` function: you `dispatch({ type: "ADD_MESSAGE", message })` and the reducer returns a **new** state object. Note it never mutates — always `{ ...state, messages: [...state.messages, ...] }`. Immutability is how React detects changes.

**useEffect** — run side effects after render. `ChatPage.tsx` loads the session list when the page mounts. `ChatMessages.tsx` scrolls to the bottom whenever `messages` changes. `SearchPanel.tsx` debounces search as you type — its cleanup function (`return () => clearTimeout(timer)`) cancels the pending search when the query changes again.

**useRef** — a mutable box that survives re-renders without causing them. Used for the DOM node to scroll to (`ChatMessages.tsx`), the AbortController for cancelling a stream (`ChatContext.tsx`), and a request sequence counter to discard stale search responses (`SearchPanel.tsx`).

**useCallback / useMemo / memo** — performance tools. They keep function and object identities stable across renders so children don't re-render needlessly. `MessageBubble.tsx` is wrapped in `memo()` because it renders in a list.

**Custom hooks as the access pattern** — `useAuth()` and `useChat()` throw if called outside their Provider. That's a common guard idiom.

## The main flows

### Login (OTP flow)

1. [LoginPage](../src/pages/LoginPage.tsx) is a two-step form driven by a `step` state (`"email"` → `"otp"`).
2. Enter email → `requestOtp()` → backend emails a code.
3. Enter code → `verifyOtp()` returns a JWT → `login(token)` stores it and fetches `/me` → `navigate("/chat")`.

### Sending a chat message (streaming)

The most interesting flow, in `sendChat` in [ChatContext.tsx](../src/context/ChatContext.tsx):

1. Dispatch the user message into `messages` (UI shows it immediately — "optimistic" update).
2. Dispatch an **empty assistant message** as a placeholder bubble.
3. POST to `/api/v1/chat` with `stream: true`. The response is **SSE** (Server-Sent Events) — the server pushes `data: {"content": "tok"}` lines as the LLM generates.
4. `readSSEStream()` reads the byte stream, handles chunks split mid-line via a buffer, and on each token dispatches `UPDATE_LAST_ASSISTANT` with the accumulated text — so the last bubble grows word by word.
5. The Stop button calls `abortStream()`, which fires the `AbortController` to cancel mid-stream.
6. Finally, `loadSessions()` refreshes the sidebar (the backend has created/updated the session).

### Agent mode

The alternative path (`sendAgent` in ChatContext): non-streaming, single request/response, and the response includes `tool_calls` which MessageBubble renders as expandable cards. The `send()` function just branches on `mode`. Agent mode is OpenAI-only (no provider toggle).

### Sessions

Clicking a sidebar item calls `switchSession(id)` → fetches full history → replaces `messages`. "New Chat" generates a fresh `crypto.randomUUID()` client-side and clears messages — the backend creates the session lazily on first message.

### Search

Typing in the sidebar box debounces 400ms, hits the search endpoint, and swaps the session list for grouped results with highlighted snippets. Selecting a result opens that session.

### RAG

"Upload Doc" opens a modal ([DocumentUpload.tsx](../src/components/DocumentUpload.tsx)) that posts text to `/documents`; the "RAG" checkbox then sets `use_rag: true` on chat requests so the backend retrieves relevant chunks.

## Details worth knowing

- **`<StrictMode>`** in main.tsx makes React run effects twice in dev to expose bugs. If you see doubled API calls in dev, that's why — it doesn't happen in production builds.
- **The token ref trick** (AuthContext): the token lives in both `useState` (to trigger re-renders) and a `useRef` (so the non-React API client can read the current value without re-registering callbacks). Bridging React state to plain JS modules is a recurring pattern.
- **Stale closure hazard:** `sendChat` lists `state.messages` in its `useCallback` deps — that's required because the function captures a snapshot of state. Forgetting deps like this is the #1 source of React bugs.
- **`key={i}` in ChatMessages:** index keys are acceptable here because messages are append-only, but index keys break if a list can be reordered or have items removed from the middle.
- **Styling** is Tailwind utility classes inline in JSX — no per-component CSS files, by project convention.
- **Project conventions** live in [CLAUDE.md](../CLAUDE.md) and [.claude/rules/react-frontend-rules.md](../.claude/rules/react-frontend-rules.md): never call `fetch()` directly from components, all types in `types/api.ts`, no `any`, no localStorage for the JWT.

## Suggested reading order

To internalize the codebase, read in this order (easiest to hardest):

1. `src/components/ProtectedRoute.tsx`
2. `src/pages/LoginPage.tsx`
3. `src/api/client.ts`
4. `src/context/AuthContext.tsx`
5. `src/pages/ChatPage.tsx`
6. `src/components/ChatInput.tsx`
7. `src/context/ChatContext.tsx` — the hardest and most instructive file
