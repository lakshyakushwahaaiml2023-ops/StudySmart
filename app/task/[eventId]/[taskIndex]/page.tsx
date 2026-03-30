"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import { calculateEventSchedule } from "@/lib/scheduler";
import Stopwatch from "@/components/Stopwatch";
import TaskVerifier from "@/components/TaskVerifier";
import NotesInput from "@/components/NotesInput";
import SummaryDisplay from "@/components/SummaryDisplay";
import ChatCloudButton from "@/components/ChatCloudButton";
import { ArrowLeftIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function TaskFocusPage() {
  const { eventId, taskIndex } = useParams();
  const router = useRouter();
  const { profile, toggleTaskCompletion, syncEventStartTime } = useUser();
  
  const [studyText, setStudyText] = useState("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // SummaryDisplay Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Find the specific task
  const task = useMemo(() => {
    const event = profile.events.find((e) => e.id === eventId);
    if (!event) return null;
    const schedule = calculateEventSchedule(event);
    return schedule[parseInt(taskIndex as string)];
  }, [profile.events, eventId, taskIndex]);

  // Check if already completed
  const isCompleted = useMemo(() => {
    const event = profile.events.find((e) => e.id === eventId);
    return !!event?.completedTasks?.includes(task.id);
  }, [profile.events, eventId, task.id]);

  if (!task) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Task not found...</div>
      </div>
    );
  }

  const handleComplete = () => {
    if (!isCompleted) {
      toggleTaskCompletion(eventId as string, task.id);
      syncEventStartTime(eventId as string);
    }
    router.push("/");
  };

  const handleSummarize = async () => {
    if (!studyText.trim()) return;
    setIsSummarizing(true);
    setSummaryData(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setScore(0);

    try {
      // 1. Fetch Summary
      const summaryRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: studyText }),
      });
      const summaryResult = await summaryRes.json();

      // 2. Fetch MCQs (3 questions for the study tab)
      const mcqRes = await fetch("/api/generate_mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: studyText,
          difficulty: "Medium",
          count: 3,
        }),
      });
      const mcqResult = await mcqRes.json();

      setSummaryData({
        summary: summaryResult.summary,
        keyTerms: summaryResult.keyTerms || [],
        formulas: summaryResult.formulas || [],
        questions: mcqResult.questions || [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-8 flex flex-col gap-8 pb-32 transition-colors duration-1000 ${isCompleted ? "bg-emerald-950/10" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push("/")}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-cyan-500/50 transition-all group"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${isCompleted ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"}`}>
                {task.type}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {task.eventName}
              </span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-black tracking-tight leading-none transition-all ${isCompleted ? "text-emerald-400" : "text-white"}`}>
              {task.task}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Status</div>
              <div className={`text-xl font-black uppercase tracking-widest ${isCompleted ? "text-emerald-400 animate-pulse" : "text-purple-400"}`}>
                {isCompleted ? "Mastered" : task.estimated_time}
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Focus & Verification (4 columns) */}
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-8">
           {isCompleted ? (
             <div className="card border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-6 animate-bounceIn shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white text-5xl mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  ✓
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Mastery Achieved</h3>
                  <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mt-1 italic">This unit is active in your long-term memory</p>
                </div>
                <div className="pt-4">
                  <button 
                    onClick={() => router.push("/")}
                    className="btn btn-primary w-full py-4 font-black uppercase tracking-[0.2em] shadow-glow"
                  >
                    Return to Operational HQ
                  </button>
                </div>
             </div>
           ) : (
             <>
               <Stopwatch 
                  scheduledStartTime={task.generatedAt || new Date().toISOString()} // Anchor for relative start
                  durationMinutes={parseInt(task.estimated_time) || 45} 
               />
               
               <TaskVerifier 
                  taskName={task.task} 
                  studyText={studyText} 
                  onComplete={handleComplete} 
               />
             </>
           )}
        </div>

        {/* Right Column: Study Material & Summarizer (8 columns) */}
        <div className="lg:col-span-8 space-y-8 animate-fadeInRight">
           <div className={`card-interactive border-purple-500/20 group ${isCompleted ? "bg-[#0a1210]" : "bg-[#0a0f18]"}`}>
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] ${isCompleted ? "bg-emerald-500" : "bg-purple-500"}`} />
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isCompleted ? "text-emerald-400" : "text-purple-300"}`}>Research Vault</h3>
              </div>
              
              <NotesInput 
                value={studyText}
                onChange={setStudyText}
                onGenerate={handleSummarize}
                isLoading={isSummarizing}
                difficulty="Medium"
                setDifficulty={() => {}}
                questionCount={3}
                setQuestionCount={() => {}}
                variant="compact"
                showUploadInCompact={true}
              />

              {summaryData && (
                <div className="mt-8 pt-8 border-t border-slate-800">
                  <SummaryDisplay 
                    data={summaryData} 
                    onReset={() => {
                      setSummaryData(null);
                      setStudyText("");
                    }}
                    onGenerateTargetedQuiz={() => {}} // Not needed in focus mode
                    quizState={{
                      quizAnswers,
                      setQuizAnswers,
                      quizSubmitted,
                      setQuizSubmitted,
                      score,
                      setScore
                    }}
                  />
                </div>
              )}
           </div>

           {/* AI Concept Assistant */}
           <div className={`p-6 border rounded-3xl relative overflow-hidden ${isCompleted ? "bg-emerald-950/10 border-emerald-500/20" : "bg-cyan-950/10 border-cyan-500/20"}`}>
              <div className="absolute top-4 right-4 text-2xl opacity-20">{isCompleted ? "💠" : "🧊"}</div>
              <h4 className={`text-xs font-black uppercase tracking-widest mb-3 ${isCompleted ? "text-emerald-400" : "text-cyan-400"}`}>
                {isCompleted ? "Post-Mastery Review" : "Focus Strategy"}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed italic">
                 {isCompleted 
                   ? `Excellent work on ${task.task}. You've successfully integrated this into your roadmap. Review these notes periodically to maintain peak retention.`
                   : `"You scheduled this for ${task.estimated_time}. Focus on the core principles of ${task.task} first. Use the summarizer above to condense complex paragraphs into high-yield points."`
                 }
              </p>
           </div>
        </div>
      </div>

      {/* Floating Chat Assistant */}
      <ChatCloudButton 
        contextData={{
          currentTask: task.task,
          taskId: task.id,
          subject: task.eventName,
          scheduledDuration: task.estimated_time,
          isFocusMode: true,
          isCompleted: isCompleted,
          studyText: studyText, 
          summary: summaryData?.summary
        }}
      />
    </div>
  );
}
