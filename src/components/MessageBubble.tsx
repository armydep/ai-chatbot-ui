import { useState } from "react";
import type { ChatMessage, ToolCallRecord } from "../types/api";

interface Props {
  message: ChatMessage;
}

function ToolCallCard({ call }: { call: ToolCallRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 rounded border border-gray-200 bg-gray-50 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-left font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>{call.tool_name}</span>
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="border-t border-gray-200 px-3 py-2 space-y-1">
          <div>
            <span className="font-medium text-gray-500">Args: </span>
            <code className="text-[11px] text-gray-700">
              {JSON.stringify(call.arguments)}
            </code>
          </div>
          <div>
            <span className="font-medium text-gray-500">Result: </span>
            <pre className="mt-0.5 whitespace-pre-wrap text-[11px] text-gray-700">
              {call.result}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        {message.content || (
          <span className="italic text-gray-400">...</span>
        )}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 border-t border-gray-200 pt-2">
            <span className="text-[11px] font-medium text-gray-500">
              Tool calls ({message.toolCalls.length})
            </span>
            {message.toolCalls.map((call, i) => (
              <ToolCallCard key={i} call={call} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
