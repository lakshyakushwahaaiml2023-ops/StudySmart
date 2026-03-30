"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BeakerIcon, 
  BookOpenIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  SparklesIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline";

export default function WelcomePage() {
  const { profile } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If not logged in, redirect back to home after a short delay
    if (!profile.isLoggedIn) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profile.isLoggedIn, router]);

  if (!mounted) return null;

  if (!profile.isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Neural Link Required</h2>
          <p className="text-slate-400">Redirecting to authentication portal...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Neural Sync", value: "98%", icon: SparklesIcon, color: "text-cyan-400" },
    { label: "Active Nodes", value: profile.events.length.toString(), icon: AcademicCapIcon, color: "text-purple-400" },
    { label: "Knowledge Base", value: "2.4 GB", icon: BeakerIcon, color: "text-emerald-400" },
    { label: "Uptime", value: "14h 22m", icon: RocketLaunchIcon, color: "text-amber-400" },
  ];

  const modules = [
    {
      title: "Syllabus Summarizer",
      description: "Convert dense academic papers into digestible neural maps.",
      icon: BookOpenIcon,
      href: "/",
      color: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
    },
    {
      title: "Smart Roadmap",
      description: "AI-optimized scheduling tailored to your biological clock.",
      icon: CalendarIcon,
      href: "/",
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
    },
    {
      title: "Adaptive Quizzes",
      description: "Test your retention with dynamically generated challenges.",
      icon: ChartBarIcon,
      href: "/",
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Neural Chatbot",
      description: "Direct interface with your personal study assistant.",
      icon: ChatBubbleLeftRightIcon,
      href: "/",
      color: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
      
      {/* Ambient Moving Orbs (matching home page) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-float opacity-60 will-change-transform"
          style={{ animationDuration: "18s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[100px] animate-float opacity-50 will-change-transform"
          style={{ animationDuration: "22s", animationDelay: "3s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] animate-float opacity-30 will-change-transform"
          style={{ animationDuration: "25s", animationDelay: "5s" }}
        />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-24 space-y-16">
        {/* Header Section */}
        <div className="space-y-4 animate-fadeInDown">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Neural Link Active
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            Welcome back, <br />
            <span className="gradient-text">{profile.name || "Scholar"}</span>
          </h1>
          <p className="max-w-2xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
            Your personal AI Command Center is synchronized. Access your study nodes, 
            track performance, and accelerate your learning trajectory.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-stagger">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass group p-6 rounded-3xl border border-slate-800/50 hover:border-cyan-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Live Telemetry</div>
              </div>
              <div className="text-3xl font-black text-white mb-1 tracking-tight">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Module Interface */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-cyan-500 rounded-full" />
              Active Modules
            </h2>
            <Link href="/" className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest">
              View All Systems →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-stagger">
            {modules.map((module, idx) => (
              <Link key={idx} href={module.href} className={`group relative p-8 rounded-[32px] bg-gradient-to-br ${module.color} border ${module.borderColor} hover:scale-[1.02] transition-all duration-500 overflow-hidden`}>
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500">
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">{module.title}</h3>
                      <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-[280px]">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest self-start px-4 py-2 bg-white/5 rounded-full border border-white/10 group-hover:bg-cyan-500 group-hover:border-cyan-400 transition-all">
                    Initialize Module
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              </Link>
            ))}
          </div>
        </div>

        {/* System Footnote */}
        <div className="pt-16 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
            <span className="w-px h-3 bg-slate-800" />
            <span>Encryption: AES-256</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-cyan-400 cursor-help transition-colors">System Protocol</span>
            <span className="hover:text-cyan-400 cursor-help transition-colors">Neural Interface v2.4.0</span>
          </div>
        </div>
      </main>

      {/* System Status and Orbs */}
      <div className="fixed bottom-10 right-10 z-20 pointer-events-none select-none opacity-40">
        <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-4">
          <div className="flex flex-col items-end">
             <span>LNK_STABLE: 100%</span>
             <span>CPU_LOAD: 12%</span>
          </div>
          <div className="w-px h-8 bg-cyan-500/20" />
          <div className="text-xl">AI-01-SY</div>
        </div>
      </div>
    </div>
  );
}
