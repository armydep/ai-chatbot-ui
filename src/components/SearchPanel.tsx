import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { searchMessages } from "../api/search";
import type { MessageSearchResponse, SearchMatch } from "../types/api";

interface Props {
  onSelect: (sessionId: string) => void;
  children: ReactNode; // session list, shown when no search is active
}

const DEBOUNCE_MS = 400;

/** Render a snippet's [[HL]]...[[/HL]] markers as <mark> — plain text, no HTML. */
function renderSnippet(snippet: string) {
  return snippet.split("[[HL]]").flatMap((part, i) => {
    if (i === 0) return [part];
    const [highlighted, ...rest] = part.split("[[/HL]]");
    return [
      <mark key={i} className="rounded bg-yellow-200 px-0.5">
        {highlighted}
      </mark>,
      rest.join("[[/HL]]"),
    ];
  });
}

function MatchRow({ match }: { match: SearchMatch }) {
  const badge = match.match_type === "session_title" ? "title" : match.role;
  return (
    <div className="border-b border-gray-100 px-3 py-2">
      <span
        className={`mr-1 rounded px-1 text-[10px] font-medium uppercase ${
          badge === "user"
            ? "bg-blue-100 text-blue-700"
            : badge === "assistant"
              ? "bg-gray-200 text-gray-600"
              : "bg-amber-100 text-amber-700"
        }`}
      >
        {badge}
      </span>
      {match.snippets.map((snippet, i) => (
        <p key={i} className="mt-1 text-xs leading-snug text-gray-600">
          {renderSnippet(snippet)}
        </p>
      ))}
    </div>
  );
}

export default function SearchPanel({ onSelect, children }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const seq = ++requestSeq.current;
    const timer = setTimeout(async () => {
      try {
        const response = await searchMessages({ query: trimmed });
        if (seq === requestSeq.current) {
          setResults(response);
          setLoading(false);
        }
      } catch (e) {
        if (seq === requestSeq.current) {
          setError(e instanceof Error ? e.message : "Search failed");
          setResults(null);
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const handlePick = (sessionId: string) => {
    onSelect(sessionId);
    setQuery("");
  };

  const searching = query.trim().length > 0;

  return (
    <>
      <div className="border-b border-gray-200 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages..."
          aria-label="Search messages"
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!searching ? (
          children
        ) : loading ? (
          <p className="p-3 text-center text-xs text-gray-400">Searching…</p>
        ) : error ? (
          <p className="p-3 text-center text-xs text-red-500">{error}</p>
        ) : results && results.groups.length === 0 ? (
          <p className="p-3 text-center text-xs text-gray-400">No matches</p>
        ) : (
          results?.groups.map((group) => (
            <div
              key={group.session_id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handlePick(group.session_id)}
              role="button"
              aria-label={`Open conversation ${group.session_title || "Untitled"}`}
            >
              <div className="truncate bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {group.session_title || "Untitled"}
              </div>
              {group.matches.map((match) => (
                <MatchRow key={`${match.match_type}-${match.id}`} match={match} />
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
