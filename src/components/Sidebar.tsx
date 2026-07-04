import type { SessionResponse } from "../types/api";
import SearchPanel from "./SearchPanel";

interface Props {
  sessions: SessionResponse[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50">
      <div className="border-b border-gray-200 p-3">
        <button
          onClick={onNew}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Chat
        </button>
      </div>

      <SearchPanel onSelect={onSelect}>
        {sessions.length === 0 ? (
          <p className="p-3 text-center text-xs text-gray-400">
            No conversations yet
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex cursor-pointer items-center border-b border-gray-100 px-3 py-2 text-sm hover:bg-gray-100 ${
                session.id === currentSessionId ? "bg-blue-50" : ""
              }`}
              onClick={() => onSelect(session.id)}
            >
              <span className="flex-1 truncate text-gray-700">
                {session.title || "Untitled"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="ml-2 hidden text-gray-400 hover:text-red-500 group-hover:block"
                title="Delete"
                aria-label="Delete conversation"
              >
                &times;
              </button>
            </div>
          ))
        )}
      </SearchPanel>
    </div>
  );
}
