"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatCloudButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I am your StudySmart assistant. Ask me to explain concepts, create quick practice questions, or clarify doubts.",
    },
  ]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: nextMessages.filter((item) => item.role !== "assistant" || item.content !== messages[0]?.content),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = (await response.json()) as { reply: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error: unknown) {
      const messageText =
        error instanceof Error ? error.message : "Unable to connect to assistant";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I could not reply right now. ${messageText}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-950/40 sm:right-6">
          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Study Chat</p>
              <p className="text-xs text-cyan-100">Ask anything about your notes</p>
            </div>
            <button
              type="button"
              aria-label="Close chat panel"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-white/90 hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`rounded-2xl px-3 py-2 text-sm ${
                  item.role === "user"
                    ? "ml-8 bg-cyan-600 text-white"
                    : "mr-8 bg-slate-800 text-slate-100"
                }`}
              >
                {item.content}
              </div>
            ))}
            {loading && (
              <div className="mr-8 rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-300">
                Thinking...
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type your question..."
                className="flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={loading || input.trim().length === 0}
                className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Open chat assistant"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/40 transition hover:scale-[1.03] hover:from-cyan-400 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.5 18.5h8.25a4.25 4.25 0 0 0 .74-8.43A5.25 5.25 0 0 0 6.36 9.2a3.85 3.85 0 0 0 1.14 7.3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{isOpen ? "Close" : "Chat"}</span>
      </button>
    </>
  );
}
