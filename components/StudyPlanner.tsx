"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, Event } from "@/lib/UserContext";
import { extractPDFText } from "@/lib/pdfExtractor";
import { calculateEventSchedule } from "@/lib/scheduler";

// Helper function to extract deadline logic so it can be used for filtering
function getTaskDeadline(
  task: any,
  index: number,
  eventId: string,
  examDate: string,
) {
  const creationDate = new Date(parseInt(eventId));
  const isValidTimestamp =
    !isNaN(creationDate.getTime()) && creationDate.getFullYear() > 2000;

  const dayMatch = task.day ? String(task.day).match(/(\d+)/) : null;
  const dayNum = dayMatch ? parseInt(dayMatch[0]) : index + 1;

  let deadlineDate = new Date();
  if (isValidTimestamp) {
    deadlineDate = new Date(
      creationDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000,
    );
    const maxDate = new Date(examDate);
    if (deadlineDate > maxDate) {
      deadlineDate = maxDate;
    }
  }
  return deadlineDate;
}

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// Priority & Type labels with specific colors
const getTypeStyles = (type: string) => {
  switch (type?.toLowerCase()) {
    case "high yield": return "text-red-400 bg-red-950 border-red-800";
    case "quick win": return "text-amber-400 bg-amber-950 border-amber-800";
    case "concept": return "text-cyan-400 bg-cyan-950 border-cyan-800";
    case "revision": return "text-purple-400 bg-purple-950 border-purple-800";
    case "rest":
    case "meal": return "text-indigo-400 bg-indigo-950/40 border-indigo-800/50";
    default: return "text-slate-400 bg-slate-900 border-slate-700";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high": return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
    case "medium": return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
    case "low": return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    case "none":
    case "rest":
    case "meal": return "bg-indigo-500/50";
    default: return "bg-slate-500";
  }
};

// Priority & Type labels with specific colors

function TaskCard({
  task,
  taskId,
  eventId,
  isCompleted,
  isLocked,
  onToggle,
}: {
  task: any;
  taskId: string;
  eventId: string;
  isCompleted: boolean;
  isLocked: boolean;
  onToggle: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const typeStyles = getTypeStyles(task.type);

  const handleTaskClick = () => {
    if (isLocked) return;
    const isBreak = task.type?.toLowerCase().includes("rest") || 
                   task.type?.toLowerCase().includes("meal") ||
                   task.task?.toLowerCase().includes("break") ||
                   task.task?.toLowerCase().includes("nap");
    
    if (isBreak) return; // Prevent opening focus mode for breaks
    const index = taskId.split("-").pop();
    window.location.href = `/task/${eventId}/${index}`;
  };

  // Dispatch context change when this study target is focused/opened
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("focus-event", { 
        detail: { eventId, eventName: task.eventName || "this subject" } 
      }));
    }
  }, [isOpen, eventId, task.eventName]);

  return (
    <div
      className={`card-interactive !p-0 overflow-hidden transition-all duration-300 border ${
        isLocked ? "opacity-30 grayscale-[50%] pointer-events-none cursor-not-allowed border-slate-800" :
        isCompleted ? "opacity-60 border-emerald-500/30 bg-emerald-950/5" : 
        "bg-[#0a0f18] border-slate-800/50"
      }`}
    >
      <div className="flex items-stretch">
        {/* Verification Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isLocked) return;
            
            // Re-enabling the quiz for the dashboard button
            const event = new CustomEvent("verify-task", {
              detail: { taskId, taskName: task.task, eventId },
            });
            window.dispatchEvent(event);
          }}
          disabled={isCompleted || isLocked}
          className={`w-16 border-r transition-all flex flex-col items-center justify-center gap-1 group ${
            isLocked ? "border-slate-800 bg-slate-900/50 text-slate-700" :
            isCompleted ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : 
            "border-slate-800 bg-[#070b14] text-slate-500 hover:text-cyan-400 hover:bg-[#0c1424]"
          }`}
        >
          {isLocked ? (
             <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          ) : isCompleted ? (
            <div className="flex flex-col items-center">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
               </svg>
               <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">Verified</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 group-hover:animate-pulse">
               {task.type?.toLowerCase().includes("rest") || task.type?.toLowerCase().includes("meal") ? (
                  <span className="text-xl">☕</span>
               ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[7px] font-black uppercase tracking-tighter">Quiz</span>
                  </>
               )}
            </div>
          )}
        </button>

        {/* Content area */}
        <div
          onClick={handleTaskClick}
          className={`flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
            (task.type?.toLowerCase().includes("rest") || task.type?.toLowerCase().includes("meal") || isLocked)
              ? "cursor-default"
              : "cursor-pointer hover:bg-[#070b14]/50"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${typeStyles}`}>
                {task.type || "TASK"}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{task.priority} Priority</span>
              </div>
            </div>
            <h4 className={`font-bold text-lg transition-all ${
               isLocked ? "text-slate-600" :
               isCompleted ? "text-slate-500 line-through" : "text-slate-100"
            }`}>
              {task.task}
            </h4>
            <div className="text-xs text-slate-500 mt-1 italic font-medium">
              {isLocked ? "Complete previous task to unlock this session." : task.reason} 
              {isCompleted && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 ml-2 not-italic font-black border border-emerald-500/30 bg-emerald-950/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest"><span className="w-1 h-1 rounded-full bg-emerald-400" /> AI Verified</span>}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                 <div className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">Planned Slot</div>
                 <div className="text-xs font-black text-purple-400">
                    {task.estimated_time} 
                    <span className="block text-[9px] text-slate-500 mt-0.5">{task.timeSlot}</span>
                  </div>
              </div>
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
               isLocked ? "bg-slate-900 text-slate-700 border border-slate-800" :
               (task.type?.toLowerCase().includes("rest") || task.type?.toLowerCase().includes("meal"))
                 ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse"
                 : isOpen ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-400"
             }`}>
                {isLocked ? (
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                ) : (task.type?.toLowerCase().includes("rest") || task.type?.toLowerCase().includes("meal")) ? (
                  <div className="flex flex-col items-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[6px] font-black uppercase mt-0.5 tracking-tighter">Live Wait</span>
                  </div>
                ) : (
                  <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyInsight({ strategy, warning }: { strategy: string; warning?: string }) {
  return (
    <div className="space-y-4">
      <div className="p-5 bg-purple-900/10 border border-purple-500/30 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        <div className="flex items-start gap-3 relative z-10">
          <span className="text-2xl mt-0.5 animate-bounce">🤖</span>
          <div>
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1.5">AI Strategy Insight</h4>
            <p className="text-purple-100 text-sm leading-relaxed italic font-medium">
              "{strategy}"
            </p>
          </div>
        </div>
      </div>
      {warning && (
        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl flex items-center gap-3 animate-pulse">
          <span className="text-xl">⚠️</span>
          <p className="text-red-200 text-xs font-bold uppercase tracking-wide">{warning}</p>
        </div>
      )}
    </div>
  );
}

function RoadmapTable({ roadmap }: { roadmap: any[] }) {
  if (!roadmap || roadmap.length === 0) return null;
  return (
    <div className="glass rounded-2xl border border-slate-800/50 overflow-hidden shadow-2xl">
      <div className="p-4 bg-slate-900/60 border-b border-slate-800/50">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" /> Smart Roadmap
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/40">
              <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter border-b border-slate-800/50">Day</th>
              <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter border-b border-slate-800/50">Focus Area</th>
              <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter border-b border-slate-800/50">Outcome Goal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {roadmap.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 text-xs font-black text-cyan-400 font-mono whitespace-nowrap">{item.day}</td>
                <td className="p-4 text-sm text-slate-100 font-bold">{item.focus}</td>
                <td className="p-4 text-xs text-slate-400 font-medium leading-relaxed">{item.goal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgressTracker({ 
  completed, 
  total, 
  expected 
}: { 
  completed: number; 
  total: number; 
  expected: string 
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="card border-slate-800/50 !p-6 flex flex-col items-center justify-center text-center group">
       <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
             <circle 
                cx="50" cy="50" r="45" 
                fill="none" stroke="currentColor" 
                strokeWidth="8" className="text-slate-800"
             />
             <circle 
                cx="50" cy="50" r="45" 
                fill="none" stroke="url(#progress-grad)" 
                strokeWidth="8" strokeDasharray="283"
                strokeDashoffset={283 - (283 * percentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
             />
             <defs>
                <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#06b6d4" />
                   <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
             </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-3xl font-black text-slate-100 font-mono">{percentage}%</span>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Done</span>
          </div>
       </div>
       <div className="space-y-1">
          <div className="text-xs font-bold text-slate-300">Syllabus Covered</div>
          <div className="text-[10px] text-cyan-500 font-black uppercase tracking-widest">Target: {expected}</div>
       </div>
    </div>
  );
}

function AILoadingOverlay({ eventName }: { eventName: string }) {
  const steps = [
    "Analyzing Syllabus Data...",
    "Predicting Exam Weightage...",
    "Identifying High-Yield Core Topics...",
    "Optimizing Your Smart Roadmap...",
    "Finalizing Performance Model..."
  ];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
      <div className="max-w-md w-full p-8 text-center space-y-8 relative overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 blur-[120px] rounded-full animate-pulse" />
        
        <div className="relative">
          {/* Cyber Brain / Scan SVG */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-full h-full text-cyan-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-ping" />
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanLine" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-100 mb-2">
            Constructing Roadmap
          </h3>
          <p className="text-cyan-400 font-mono text-xs uppercase tracking-widest font-black">
            Core Target: {eventName}
          </p>
        </div>

        <div className="space-y-4 relative">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-loadingProgress" />
          </div>
          <div className="flex items-center justify-center gap-2 h-6">
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
            <p className="text-slate-400 text-sm font-medium animate-pulse">
              {steps[currentStep]}
            </p>
          </div>
        </div>

        <div className="pt-4">
           <p className="text-[10px] text-slate-600 font-black uppercase tracking-tighter max-w-[280px] mx-auto leading-relaxed">
             Our AI is simulating 1,200+ study paths to find the highest score-per-hour trajectory for you.
           </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes loadingProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-scanLine {
          animation: scanLine 2s ease-in-out infinite;
        }
        .animate-loadingProgress {
          animation: loadingProgress 15s linear forwards;
        }
      `}</style>
    </div>
  );
}

export default function StudyPlanner() {
  const {
    profile,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleTaskCompletion,
    syncAllSchedules,
    updateEventPlanTasks,
  } = useUser();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());

  // Syllabus Upload State
  const [isDragActiveSyllabus, setIsDragActiveSyllabus] = useState(false);
  const [filePreviewSyllabus, setFilePreviewSyllabus] = useState<string>("");
  const [isExtractingSyllabus, setIsExtractingSyllabus] = useState(false);
  const fileInputRefSyllabus = useRef<HTMLInputElement>(null);

  const handleSyllabusDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActiveSyllabus(true);
    } else if (e.type === "dragleave") {
      setIsDragActiveSyllabus(false);
    }
  };

  const processSyllabusFile = async (file: File) => {
    setIsExtractingSyllabus(true);
    setFilePreviewSyllabus(`📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    try {
      let extractedText = "";

      if (file.type === "application/pdf") {
        extractedText = await extractPDFText(file);
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
      } else {
        throw new Error("Unsupported file type. Please use PDF or TXT files.");
      }

      setSyllabus(extractedText);
      setFilePreviewSyllabus(`✓ Extracted ${extractedText.split(/\s+/).length} words from ${file.name}`);
    } catch (error) {
      setFilePreviewSyllabus(`✗ Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExtractingSyllabus(false);
    }
  };

  const handleSyllabusDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActiveSyllabus(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processSyllabusFile(files[0]);
    }
  };

  const handleSyllabusFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSyllabusFile(e.target.files[0]);
    }
  };

  // Aggregate all tasks for TODAY across all events and calculate time slots
  const allTodaysTasks = profile.events.flatMap((event) => {
    return calculateEventSchedule(event);
  });

  // Add a listener for the AI-triggered sync signal
  useEffect(() => {
    const handleSyncEvent = () => {
      handleSyncAllSchedules();
    };
    window.addEventListener("sync-schedule", handleSyncEvent);
    return () => window.removeEventListener("sync-schedule", handleSyncEvent);
  }, [profile.events]); // Re-bind if events change

  // 🎙️ Agentic Voice Caller: Deadline Monitor & UI Sync
  useEffect(() => {
    // 1. Sync from the Twilio DB every 3 seconds to catch Voice updates
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/twilio/status");
        if (res.ok) {
          const data = await res.json();
          if (data && data.updateAvailable && data.eventId && data.newTasks) {
            console.log("☎️ Incoming Dashboard Mutation from Twilio Voice Agent:", data.voiceCommand);
            
            // Atomic update to prevent stale closures
            updateEventPlanTasks(data.eventId, data.newTasks);
            
            import("@/lib/animations").then(lib => lib.createConfetti());
          }
        }
      } catch (e) {
        console.error("Twilio Poller Error:", e);
      }
    }, 3000);

    // 2. Deadline Monitor: Check for tasks 5 mins past deadline
    const deadlineInterval = setInterval(() => {
      for (const event of profile.events) {
         if (!event.plan?.today_tasks || !event.phoneNumber) continue;
         
         const schedule = calculateEventSchedule(event);
         
         for (let i = 0; i < schedule.length; i++) {
            const task = schedule[i];
            const taskId = `task-${event.id}-${i}`;
            const isCompleted = event.completedTasks?.includes(taskId);
            
            if (!isCompleted && task.end_time) {
               const endMatch = task.end_time.match(/(\d+):(\d+)\s+(AM|PM)/);
               if (endMatch) {
                  let hours = parseInt(endMatch[1]);
                  const mins = parseInt(endMatch[2]);
                  if (endMatch[3] === "PM" && hours !== 12) hours += 12;
                  if (endMatch[3] === "AM" && hours === 12) hours = 0;
                  
                  const targetTime = new Date();
                  targetTime.setHours(hours, mins, 0, 0);
                  
                  const now = new Date();
                  const diffMins = (now.getTime() - targetTime.getTime()) / (1000 * 60);
                  
                  if (diffMins >= 5 && !notifiedTaskIds.has(taskId)) {
                     setNotifiedTaskIds(prev => new Set([...prev, taskId]));
                     console.log("Deadline missed! Triggering Agentic Voice Call...");
                     
                     fetch("/api/twilio/call", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                           phoneNumber: event.phoneNumber,
                           taskId,
                           eventId: event.id,
                           taskName: task.task,
                           profile,
                        })
                     }).catch(console.error);
                  }
               }
            }
         }
      }
    }, 10000); // Check every 10 seconds

    return () => {
       clearInterval(syncInterval);
       clearInterval(deadlineInterval);
    };
  }, [profile.events, notifiedTaskIds, updateEvent, syncAllSchedules]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = addEvent({
      name: examName,
      date: examDate,
      syllabus,
      phoneNumber,
    });
    setIsCreatingEvent(false);
    setExamName("");
    setExamDate("");
    setSyllabus("");
    setPhoneNumber("");
    setFilePreviewSyllabus("");
    
    // Auto-generate plan for the new core
    handleGeneratePlan(newEvent);
  };

  const handleGeneratePlan = async (event: Event, isEarlyCompletion: boolean = false) => {
    setLoadingEventId(event.id);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          event,
          chatSnapshot: event.chatHistory || [],
          isEarlyCompletion,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const planData = await response.json();
      // Add a persistent start time for the schedule to prevent time drift
      const enrichedPlan = {
        ...planData,
        generatedAt: new Date().toISOString(),
      };
      
      updateEvent(event.id, { plan: enrichedPlan });
      if (isEarlyCompletion) {
        import("@/lib/animations").then(lib => lib.createConfetti());
      }
    } catch (error) {
      console.error(error);
      alert("Error generating the study plan. Please try again.");
    } finally {
      setLoadingEventId(null);
    }
  };

  const handleSyncAllSchedules = () => {
    syncAllSchedules();
  };

  return (
    <div className="animate-fadeInUp space-y-8 relative">
      {/* AI Loading Experience */}
      {loadingEventId && (
        <AILoadingOverlay 
          eventName={profile.events.find(e => e.id === loadingEventId)?.name || "Academic Target"} 
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">
            Dynamic Study Planner
          </h2>
          <p className="text-slate-400 mt-2">
            AI-driven tasks tailored to your schedule and chat history.
          </p>
        </div>
        <button
          onClick={() => setIsCreatingEvent(true)}
          className="btn btn-primary"
        >
          <span className="text-xl leading-none">+</span> New Exam / Event
        </button>
      </div>

      {isCreatingEvent && (
        <div className="card border-cyan-500/50">
          <h3 className="text-xl font-bold text-slate-100 mb-4">
            Initialize New Target
          </h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target Name (Exam/Project)
                </label>
                <input
                  type="text"
                  required
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full"
                  placeholder="e.g. AP Physics Midterm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Syllabus / Topics to Cover (Optional)
              </label>
              
              {/* File Upload Area for Syllabus */}
              <div
                onDragEnter={handleSyllabusDrag}
                onDragLeave={handleSyllabusDrag}
                onDragOver={handleSyllabusDrag}
                onDrop={handleSyllabusDrop}
                className={`relative group rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer mb-3 ${
                  isDragActiveSyllabus
                    ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/30"
                    : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                }`}
              >
                <input
                  ref={fileInputRefSyllabus}
                  type="file"
                  onChange={handleSyllabusFileInput}
                  accept=".pdf,.txt"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRefSyllabus.current?.click()}
                  className="p-6 text-center hover:bg-slate-900/20 transition-colors rounded-xl"
                >
                  <div className="mb-2 flex justify-center">
                    <svg
                      className={`w-10 h-10 transition-all duration-300 ${
                        isDragActiveSyllabus
                          ? "text-cyan-400 scale-125"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z"
                      />
                    </svg>
                  </div>

                  {isExtractingSyllabus ? (
                    <div className="py-2">
                       <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-slate-300 text-sm font-bold">Extracting Syllabus Data...</p>
                       </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-300 text-sm font-bold">
                        Drop Syllabus PDF/TXT or click to upload
                      </p>
                      <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">
                        Smart AI Scan Enabled
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* File Preview */}
              {filePreviewSyllabus && (
                <div className="p-2 mb-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 animate-fadeInUp flex items-center justify-between">
                  <span className="truncate max-w-[80%]">{filePreviewSyllabus}</span>
                  <button 
                    type="button" 
                    onClick={() => { setSyllabus(""); setFilePreviewSyllabus(""); }}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              <textarea
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                className="w-full min-h-[120px] text-sm bg-slate-900/20"
                placeholder="Or paste the chapters/topics manually here..."
              />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/50">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                <span className="text-green-400">🎙️ Agentic Voice Caller</span> (Optional)
              </label>
              <p className="text-xs text-slate-500 mb-2">Input your phone number to get an AI phone call if you miss a deadline by 5+ minutes.</p>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full font-mono bg-slate-900/50 border-slate-800 focus:border-green-500/50"
                placeholder="e.g. +1234567890"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreatingEvent(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-success text-white">
                Create Target
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Study Execution Dashboard */}
      <div className="space-y-8">
        {/* Section 1: Today's Focus */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-100">
               <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  🎯
               </span>
               Today's Focus
            </h3>
              <div className="flex items-center gap-3">
                {allTodaysTasks.length > 0 && allTodaysTasks.every(t => t.isCompleted) && (
                  <div className="animate-fadeInUp flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/40 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-tight">Neural Momentum</span>
                      <span className="text-xs text-slate-100 font-bold">You're Ahead of Schedule!</span>
                    </div>
                    <button 
                      onClick={() => {
                        const event = profile.events[0];
                        if (event) handleGeneratePlan(event, true);
                      }}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-glow flex items-center gap-2"
                    >
                      ⚡ Pull Next Session
                    </button>
                  </div>
                )}
                {allTodaysTasks.length > 0 && (
                  <div className="flex items-center gap-2">
                    {profile.events[0]?.phoneNumber && (
                      <button 
                        onClick={() => {
                          const event = profile.events[0];
                          const schedule = calculateEventSchedule(event);
                          // Intelligently find the first task that isn't done yet, or fall back to the first task
                          const targetTask = schedule.find((t: any) => !t.isCompleted) || schedule[0];
                          
                          fetch("/api/twilio/call", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              phoneNumber: event.phoneNumber,
                              taskId: targetTask.id,
                              eventId: event.id,
                              taskName: targetTask.task,
                              profile,
                              reason: "manual", // Flag this as a user-initiated status check
                            })
                          }).then(() => alert("☎️ Sync Call Initiated. Connecting to your AI study companion...")).catch(e => alert("Call failed: " + e.message));
                        }}
                        className="text-[10px] bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 px-3 py-1 rounded-full transition-all font-black uppercase tracking-widest flex items-center gap-1.5"
                      >
                        📞 Test Call
                      </button>
                    )}
                    <button 
                      onClick={handleSyncAllSchedules}
                      className="text-[10px] bg-slate-800/10 hover:bg-slate-800/50 text-slate-500 hover:text-cyan-400 border border-slate-800 px-3 py-1 rounded-full transition-all font-black uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                      Sync to Now
                    </button>
                  </div>
                )}
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                  {allTodaysTasks.filter(t => t.isCompleted).length} / {allTodaysTasks.length} Done
               </div>
            </div>
          </div>

          {allTodaysTasks.length === 0 ? (
            <div className="text-center py-16 card border-dashed border-slate-800/80 bg-slate-900/40 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">☕</div>
                <h4 className="text-slate-200 font-black text-lg">System Status: Cleared</h4>
                <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto font-medium">
                  No immediate tasks mapped for today. Great time to review your roadmap or refresh existing knowledge.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {allTodaysTasks.map((task, idx) => {
                const event = profile.events.find((e) => e.id === task.eventId);
                if (!event) return null;

                const isCompleted = !!task.isCompleted;
                // A task is locked if any previous task in the flat list is NOT completed
                const isLocked = allTodaysTasks.slice(0, idx).some(t => !t.isCompleted);
                
                return (
                  <div key={task.id} className="relative group">
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full opacity-30 group-hover:opacity-100 transition-opacity" />
                    <div className="text-[10px] text-cyan-500 font-black uppercase tracking-widest ml-4 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                      Target: {event.name}
                    </div>
                    <TaskCard
                      task={task}
                      taskId={task.id}
                      eventId={event.id}
                      isCompleted={isCompleted}
                      isLocked={isLocked}
                      onToggle={() => toggleTaskCompletion(event.id, task.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Logic & Stats (Strategy & Progress) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              {profile.events.some(e => e.plan) && (
                <div className="space-y-4">
                   <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                      🧠 Strategic Insights
                   </h3>
                   <div className="grid gap-4">
                      {profile.events.filter(e => e.plan).map(event => (
                         <div key={`strategy-${event.id}`} className="space-y-2">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                               <div className="w-1 h-1 rounded-full bg-slate-500" />
                               For: {event.name}
                            </div>
                            <StrategyInsight 
                              strategy={event.plan.strategy} 
                              warning={event.plan.progress_model?.warning}
                            />
                         </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                 📊 Stats Tracker
              </h3>
              <div className="space-y-6">
                 {profile.events.filter(e => e.plan).map(event => (
                    <div key={`progress-${event.id}`} className="space-y-3">
                       <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {event.name} Coverage
                       </div>
                       <ProgressTracker 
                          completed={event.completedTasks?.length || 0}
                          total={event.plan.today_tasks?.length || 0} // Using today_tasks length as proxy for plan size
                          expected={event.plan.progress_model?.expected_completion || "N/A"}
                       />
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Section: Roadmap Timeline */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                 🗺️ Smart Roadmap
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Master Timeline Progress</p>
           </div>
           
           <div className="grid gap-8">
              {profile.events.filter(e => e.plan).map(event => (
                 <div key={`roadmap-${event.id}`} className="space-y-3">
                    <div className="flex items-center gap-2">
                       <h4 className="text-sm font-bold text-cyan-400">{event.name}</h4>
                       <div className="flex-1 h-px bg-slate-800" />
                    </div>
                    <RoadmapTable roadmap={event.plan.roadmap} />
                    
                    <div className="flex justify-end gap-3 mt-4">
                       <button
                          onClick={() => handleGeneratePlan(event)}
                          disabled={loadingEventId === event.id}
                          className="btn btn-secondary text-xs flex items-center gap-2 group border-cyan-500/20"
                       >
                          <svg className={`w-3.5 h-3.5 ${loadingEventId === event.id ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {loadingEventId === event.id ? "Recalculating..." : "Optimize Plan (Adaptive)"}
                       </button>
                       <button
                          onClick={() => deleteEvent(event.id)}
                          className="btn border-red-900/30 text-red-500 bg-red-950/10 text-xs flex items-center gap-2 hover:bg-red-950/20"
                       >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Target
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      <div className="pt-12 border-t border-slate-800/50">
        <h3 className="text-xl font-black text-slate-100 mb-6 flex items-center gap-3">
           <span className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
              ⚙️
           </span>
           System Configuration
        </h3>
        
        {profile.events.length === 0 && !isCreatingEvent ? (
          <div className="text-center py-16 card border-dashed border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 transition-colors cursor-pointer" onClick={() => setIsCreatingEvent(true)}>
            <div className="text-6xl mb-4 grayscale opacity-50">🛰️</div>
            <h3 className="text-2xl font-black text-slate-100">No active operational targets</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto font-medium leading-relaxed">
              Initialize a new exam or project core to let StudySmart AI generate your prioritized execution Roadmap.
            </p>
            <div className="mt-8">
               <span className="btn btn-primary shadow-glow">Initialize New Core</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
             <button
              onClick={() => setIsCreatingEvent(true)}
              className="btn btn-secondary border-dashed border-slate-700 w-full max-w-sm py-4 group"
             >
               <span className="text-xl group-hover:scale-125 transition-transform inline-block mr-2">+</span> Add New Operational Target
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
