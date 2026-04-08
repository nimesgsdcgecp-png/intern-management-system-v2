"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, SendHorizontal, X, Maximize2, Minimize2, RotateCcw } from "lucide-react";

const API_URL = "http://localhost:8000/api/v0/ask";

const SUGGESTIONS = [
  "List all active interns",
  "How many tasks are pending?",
  "Show completed tasks",
  "Interns by department",
];

interface Message {
  id: string | number;
  role: "user" | "assistant";
  type: "text" | "data" | "error";
  content: string;
  columns?: string[];
  rows?: Record<string, unknown>[];
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setWelcome = () => {
    setShowSuggestions(true);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        type: "text",
        content:
          "👋 Hello! I'm your **Assistant**. Ask me anything about interns, tasks, or reports.",
      },
    ]);
  };

  useEffect(() => {
    if (open && messages.length === 0) {
      setWelcome();
    }
  }, [open, messages.length]);

  const sendMessage = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    setShowSuggestions(false);

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", type: "text", content: q },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Query failed");

      const hasData = (data.results ?? []).length > 0;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          type: hasData ? "data" : "text",
          content: hasData
            ? `📊 Found **${data.results.length}** record(s)`
            : "⚠️ No records found",
          columns: data.columns,
          rows: data.results,
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          type: "error",
          content: "❌ " + errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text: string) =>
    text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 ? <strong key={i}>{part}</strong> : part
    );

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn btn-primary fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-high
            hover:scale-110 active:scale-95 transition-transform"
        type="button"
        aria-label="Open chat assistant"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.2-3.2A7.94 7.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed z-50 flex flex-col bg-surface-overlay border border-border-default shadow-overlay rounded-lg transition-all duration-300
        ${open ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}
        ${isMaximized
            ? "bottom-10 right-10 w-[620px] h-[650px]"
            : "bottom-20 right-6 w-[380px] h-[520px]"
          }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-surface-nav text-content-nav rounded-t-lg shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            IMS Assistant
          </span>

          <div className="flex gap-2">
            <button onClick={setWelcome} className="btn btn-ghost btn-icon-sm" type="button" aria-label="Reset chat">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => setIsMaximized((v) => !v)} className="btn btn-ghost btn-icon-sm" type="button" aria-label="Toggle size">
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setOpen(false)} className="btn btn-ghost btn-icon-sm" type="button" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-app">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-3 rounded-lg text-sm max-w-[90%] shadow-subtle transition
                ${msg.role === "user"
                    ? "bg-primary text-inverse"
                    : "bg-surface-card border border-border-default"
                  }`}
              >
                <div className="leading-relaxed">{renderText(msg.content)}</div>

                {/* Suggestions */}
                {msg.id === "welcome" && showSuggestions && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-1.5 bg-primary-subtle border border-primary-border rounded-full hover:bg-primary hover:text-inverse transition text-primary-text"
                        type="button"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Data Table */}
                {msg.type === "data" && (msg.rows ?? []).length > 0 && (
                  <div className="mt-4 table-container">
                    <div className="table-scroll max-h-[300px]">
                      <table className="table text-xs">
                        <thead>
                          <tr>
                            {(msg.columns ?? []).map((col) => (
                              <th key={col}>
                                {col.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(msg.rows ?? []).slice(0, 15).map((row: Record<string, unknown>, i: number) => (
                            <tr key={i}>
                              {(msg.columns ?? []).map((col) => (
                                <td key={col}>
                                  {row[col] === null || row[col] === undefined ? "—" : String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Animation */}
          {loading && (
            <div className="flex gap-1.5 px-3 py-2 bg-surface-card w-max rounded-full border border-border-default self-start">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:75ms]"></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></span>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex gap-3 border-t border-border-default bg-surface-card rounded-b-lg shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            className="input flex-1"
            placeholder="Ask AI about interns, tasks, etc..."
          />
          <button
            onClick={() => sendMessage(input)}
            className="btn btn-primary btn-icon"
            type="button"
            aria-label="Send message"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}