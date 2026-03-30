"use client";

import { useState, useEffect } from "react";

interface Props {
  scheduledStartTime: string; // ISO string or parsable date
  durationMinutes: number;
}

export default function Stopwatch({ scheduledStartTime, durationMinutes }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const start = new Date(scheduledStartTime).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      setElapsed(diff);
    };

    update(); // Initial call
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [scheduledStartTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = Math.min(100, (elapsed / (durationMinutes * 60)) * 100);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#0a0f18] border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
      
      {/* Progress Ring */}
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-800"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#timer-grad)"
            strokeWidth="4"
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * progress) / 100}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          />
          <defs>
            <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Digital Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {formatTime(elapsed)}
          </div>
          <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mt-1">
            Elapsed
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Target Duration: {durationMinutes} mins
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${elapsed > durationMinutes * 60 ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {elapsed > durationMinutes * 60 ? "Overtime detected" : "Session in progress"}
          </span>
        </div>
      </div>
    </div>
  );
}
