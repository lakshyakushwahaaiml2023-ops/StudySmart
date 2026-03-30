"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { streamTextInChunks } from "@/lib/animations";
import { useUser } from "@/lib/UserContext";
import { calculateEventSchedule } from "@/lib/scheduler";
import { sounds } from "@/lib/sounds";

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
    sounds.playBlip();

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
      sounds.playNotify();
      
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
      <div className="z-50 pointer-events-none">
        {isOpen && (
          <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-3xl bg-[#0a0f18]/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-fadeInUp pointer-events-auto z-[60]">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group relative">
                   <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-lg animate-pulse" />
                   <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
                   <p className="text-[10px] text-cyan-400/80 font-mono tracking-[0.2em] uppercase mt-0.5">Optimized Sync Ready</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-cyan-500 shrink-0 shadow-lg">
                      <span className="text-sm">🤖</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-slate-900/40 border border-white/5 text-slate-200"
                        : "bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-900/20"
                    } ${msg.isStreaming ? "animate-pulse" : ""}`}
                  >
                    {msg.isStreaming ? (
                       <div className="flex flex-col gap-2">
                         <div className="h-2 w-32 bg-cyan-500/20 rounded-full animate-shimmer" />
                         <div className="h-2 w-24 bg-cyan-500/20 rounded-full animate-shimmer delay-75" />
                         <div className="h-2 w-28 bg-cyan-500/20 rounded-full animate-shimmer delay-150" />
                       </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {preprocessSummary(msg.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                 <div className="flex justify-start items-end gap-3 animate-fadeInUp">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-cyan-500 shrink-0">
                       <span className="text-sm animate-bounce">🤖</span>
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex gap-1.5">
                       <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                       <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                       <div className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/5 bg-slate-900/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="relative group"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Initialize query..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all group-hover:border-white/20 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white disabled:opacity-30 disabled:hover:bg-cyan-500/10 disabled:hover:text-cyan-400 transition-all"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}
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

      <style jsx>{`
        @keyframes shimmer {
          0% { opacity: 0.3; transform: translateX(-10%); }
          50% { opacity: 0.8; transform: translateX(5%); }
          100% { opacity: 0.3; transform: translateX(-10%); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
