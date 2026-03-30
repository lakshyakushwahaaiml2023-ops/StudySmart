"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { streamTextInChunks } from "@/lib/animations";
import { useUser } from "@/lib/UserContext";
import { calculateEventSchedule } from "@/lib/scheduler";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

function preprocessSummary(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\[QUIZ_START:\s*[^\]]+\]/g, "")
    .replace(/\[VERIFIED:\s*[^\]]+\]/g, "")
    .trim();
}

type ChatCloudButtonProps = {
  contextData?: any;
};

export default function ChatCloudButton({ contextData }: ChatCloudButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm your StudySmart AI core. Ask me to explain concepts, create practice questions, or clarify complex topics from your notes!",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { profile, updateProfile, toggleTaskCompletion, syncEventStartTime } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (profile.isLoggedIn && messages.length > 1) {
      setTimeout(() => {
        updateProfile({
          chatHistorySnapshot: messages.map(m => ({ role: m.role, content: m.content })).slice(-15)
        });
      }, 0);
    }
  }, [messages, profile.isLoggedIn]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: "user", content: message };
    const nextMessages = [...messages, userMessage];
    
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: nextMessages.filter((item) => item.role !== "assistant" || item.content !== messages[0]?.content).map(m => ({ role: m.role, content: m.content })),
          contextData: {
            ...contextData,
            profile, // Include the profile for full context
            activeSchedule: contextData?.eventId 
              ? calculateEventSchedule(profile.events.find(e => e.id === contextData.eventId))
              : []
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the AI model.");
      }

      const data = (await response.json()) as { reply: string };
      
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "", isStreaming: true },
      ]);

      let streamedContent = "";
      for await (const chunk of streamTextInChunks(data.reply, 10, 30)) {
        streamedContent += chunk;
        setMessages((prev) => 
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: streamedContent }
              : msg
          )
        );
        scrollToBottom();
      }

      // 1. PRIMARY MATCH: [VERIFIED: taskId]
      const verifyMatch = data.reply.match(/\[VERIFIED:\s*(task-[a-z0-9-]+)\]/i);
      let targetTaskId: string | null = null;
      let targetEventId: string | null = null;

      if (verifyMatch) {
         targetTaskId = verifyMatch[1].trim();
         console.info("⚡ Neural Sync (Primary) Triggered for", targetTaskId);
         const parts = targetTaskId.split("-");
         targetEventId = parts.length >= 2 ? parts[1] : null;
      } 
      // 2. HEURISTIC FALLBACK: If the AI forgot the tag but mentioned the task name
      else if (contextData?.todaysTasks) {
         const tasks = contextData.todaysTasks;
         // Find a task name that is mentioned in the AI's reply or similarity matching
         const foundTask = tasks.find((t: any) => 
            !t.isCompleted && 
            (data.reply.toLowerCase().includes(t.task.toLowerCase()) || 
             t.task.toLowerCase().includes(data.reply.toLowerCase()) ||
             // Check if user specifically asked for this task name
             message.toLowerCase().includes(t.task.toLowerCase()))
         );
         
         if (foundTask) {
           console.warn("🛡️ Neural Sync (Fallback) triggered for task matching:", foundTask.task);
           targetTaskId = foundTask.id;
           targetEventId = foundTask.eventId;
         }
      }

      if (targetTaskId && targetEventId) {
         const cleanedReply = data.reply.replace(/\[VERIFIED:\s*task-[^\]]+\]/gi, "").trim();
         
         // Update state with cleaned content
         setMessages((prev) =>
           prev.map((msg) =>
             msg.id === assistantMessageId ? { ...msg, content: cleanedReply, isStreaming: false } : msg
           )
         );

         console.log("🛠️ Syncing Dashboard State: Marking Task", targetTaskId, "Done");
         toggleTaskCompletion(targetEventId, targetTaskId);
         syncEventStartTime(targetEventId);
         
         // Celebration!
         import("@/lib/animations").then(lib => lib.createConfetti());
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      }
    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : "Error connecting to AI";
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: `❌ Error: ${messageText}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
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
      <div className={`fixed bottom-28 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-md transition-all duration-500 origin-bottom-right ${
        isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
      }`}>
        <div className="flex flex-col h-[550px] max-h-[75vh] rounded-3xl border border-cyan-500/40 bg-[#070b14] shadow-[0_0_50px_rgba(0,255,255,0.15)] overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-cyan-950/80 to-purple-950/80 border-b border-cyan-500/30 px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping opacity-20"></div>
                <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-slate-100 tracking-wide text-base">Study AI Core</h3>
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Neural Link Active</span>
                   </div>
                </div>
                <p className="text-xs text-cyan-400/80 font-mono tracking-widest uppercase mt-0.5">Ready for Sync</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-800/80 hover:text-cyan-400 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((item) => (
              <div key={item.id} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-5 py-3.5 text-sm leading-relaxed ${
                  item.role === "user"
                    ? "rounded-2xl rounded-br-none bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/40"
                    : "rounded-2xl rounded-bl-none border border-slate-700/60 bg-slate-800/80 text-slate-200 shadow-md prose prose-invert max-w-none"
                }`}>
                  {item.role === "user" ? (
                    <p className="whitespace-pre-wrap font-medium">{item.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {preprocessSummary(item.content) + (item.isStreaming ? " ..." : "")}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-none border border-cyan-500/30 bg-cyan-950/40 px-5 py-4 shadow-[0_0_15px_rgba(0,255,255,0.15)]">
                  <div className="flex gap-2 items-center h-4">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          <div className="border-t border-cyan-500/30 bg-slate-900/80 p-4 relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Initialize query..."
                disabled={loading}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-5 pr-14 text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all shadow-inner"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
                className="absolute right-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-2 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md shadow-cyan-900/50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
        <div className="absolute inset-x-0 -bottom-10 h-32 bg-cyan-500/10 blur-3xl opacity-50 rounded-full mix-blend-screen pointer-events-none" />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 text-white shadow-[0_0_40px_rgba(0,255,255,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_0_50px_rgba(0,255,255,0.8)] animate-float"
          aria-label="Toggle Chat"
        >
          <div className="absolute inset-0 bg-cyan-400/30 rounded-full filter blur-xl animate-pulse -z-10" style={{ animationDuration: '3s' }} />
          {isOpen ? (
            <svg className="h-7 w-7 transition-all duration-300 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-7 w-7 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          )}
        </button>
      </div>
    </>
  );
}
