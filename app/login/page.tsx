"use client";

import { useState, useEffect, useRef, type ComponentType, type SVGProps } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import {
  SparklesIcon,
  BoltIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  MapIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  StarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

// ─────────────────────────────────────────────
// Floating Particle Canvas
// ─────────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > W) p.dx *= -1;
        if (p.y < 0 || p.y > H) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.alpha})`;
        ctx.fill();
      });

      // Draw connecting lines for nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(
            particles[i].x - particles[j].x,
            particles[i].y - particles[j].y
          );
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-60"
    />
  );
};

// ─────────────────────────────────────────────
// Neural Network SVG (AI Showcase)
// ─────────────────────────────────────────────
const NeuralNet = () => {
  const nodes = [
    { x: 50, y: 150 }, { x: 50, y: 250 }, { x: 50, y: 350 },
    { x: 180, y: 100 }, { x: 180, y: 200 }, { x: 180, y: 300 }, { x: 180, y: 400 },
    { x: 310, y: 175 }, { x: 310, y: 275 }, { x: 310, y: 375 },
    { x: 440, y: 250 },
  ];
  const edges = [
    [0, 3], [0, 4], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [2, 6],
    [3, 7], [3, 8], [4, 7], [4, 8], [4, 9], [5, 8], [5, 9], [6, 9],
    [7, 10], [8, 10], [9, 10],
  ];

  return (
    <svg viewBox="0 0 490 500" className="w-full max-w-lg mx-auto opacity-90">
      <defs>
        <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y}
          x2={nodes[b].x} y2={nodes[b].y}
          stroke="url(#nodeGrad)"
          strokeWidth="0.8"
          strokeOpacity="0.3"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x} cy={n.y} r={i === 10 ? 16 : 8}
            fill="url(#nodeGrad)"
            filter="url(#glow)"
            style={{
              animation: `pulse-node ${1.5 + i * 0.2}s ease-in-out infinite alternate`,
            }}
          />
          {i === 10 && (
            <text x={n.x} y={n.y + 5} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">AI</text>
          )}
        </g>
      ))}
    </svg>
  );
};

// ─────────────────────────────────────────────
// Feature Card
// ─────────────────────────────────────────────
interface FeatureCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
  accent: string;
  delay: string;
}

const FeatureCard = ({ icon: Icon, title, desc, accent, delay }: FeatureCardProps) => (
  <div
    className="feature-card group relative rounded-2xl p-6 border border-white/5 bg-white/[0.03] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-white/15"
    style={{ animationDelay: delay }}
  >
    {/* Glow background */}
    <div
      className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ background: `radial-gradient(400px circle at 50% 0%, ${accent}22, transparent 70%)` }}
    />
    <div className="relative z-10 space-y-4">
      <div
        className="inline-flex p-3 rounded-xl"
        style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
      >
        <Icon className="w-6 h-6" style={{ color: accent }} />
      </div>
      <h3 className="font-bold text-white text-lg tracking-tight">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: accent }}>
        <span>Explore</span>
        <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Testimonial Card
// ─────────────────────────────────────────────
interface TestimonialCardProps {
  name: string;
  role: string;
  text: string;
  stars: number;
  avatar: string;
}

const TestimonialCard = ({ name, role, text, stars, avatar }: TestimonialCardProps) => (
  <div className="relative rounded-2xl p-6 border border-white/5 bg-white/[0.03] backdrop-blur-xl hover:border-purple-500/20 transition-all duration-300 hover:-translate-y-1">
    <div className="flex gap-1 mb-4">
      {Array.from({ length: stars }).map((_, i) => (
        <StarIcon key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
      ))}
    </div>
    <p className="text-slate-300 text-sm leading-relaxed mb-6">{text}</p>
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
      >
        {avatar}
      </div>
      <div>
        <div className="text-white font-semibold text-sm">{name}</div>
        <div className="text-slate-500 text-xs">{role}</div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Landing Page
// ─────────────────────────────────────────────
export default function StudyBuddyLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { updateProfile, logout } = useUser();

  const handleLogin = () => {
    updateProfile({
      isLoggedIn: true,
      name: "Verified Scholar", // Mock name for the demo
      studyLevel: "Elite",
    });
    router.push("/");
  };

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    { icon: SparklesIcon, title: "AI Notes Summarizer", desc: "Paste any content and get clean, structured summaries with key points extracted instantly.", accent: "#8b5cf6" },
    { icon: ClipboardDocumentCheckIcon, title: "MCQ Generator", desc: "Auto-generate quizzes from your notes with adjustable difficulty — Easy, Medium, Hard.", accent: "#06b6d4" },
    { icon: BookOpenIcon, title: "Key Terms Extractor", desc: "Surface critical vocabulary, formulas, and concepts from any topic with one click.", accent: "#10b981" },
    { icon: MapIcon, title: "Exam Roadmap", desc: "Get a personalized day-by-day study plan tailored to your exam date and syllabus.", accent: "#f59e0b" },
    { icon: AcademicCapIcon, title: "Dynamic Study Planner", desc: "AI schedules your sessions, balances subjects, and adapts as you make progress.", accent: "#ec4899" },
    { icon: ChatBubbleLeftRightIcon, title: "AI Chat Assistant", desc: "Ask anything about your subjects. Get clear, student-friendly explanations instantly.", accent: "#6366f1" },
  ];

  const steps = [
    { num: "01", title: "Upload or Paste", desc: "Drop your notes, PDFs, or paste raw text. Any format works." },
    { num: "02", title: "AI Processes", desc: "Our engine analyzes structure, key concepts, and exam weightage." },
    { num: "03", title: "Get Everything", desc: "Summary, quiz, flashcards, and personalized plan — ready in seconds." },
  ];

  const testimonials = [
    { name: "Arjun Mehta", role: "JEE Advanced 2025 — AIR 847", text: "I went from drowning in NCERT to finishing chapters in half the time. The roadmap feature alone is worth it.", stars: 5, avatar: "AM" },
    { name: "Priya Sharma", role: "NEET Aspirant, Delhi", text: "The MCQ generator is scary accurate. It generates exactly the kind of questions that appear in actual NEET papers.", stars: 5, avatar: "PS" },
    { name: "Rohan Gupta", role: "B.Tech CSE, IIT Bombay", text: "Used it for semester prep. The AI chat explains concepts better than half my professors honestly.", stars: 5, avatar: "RG" },
    { name: "Sneha Patel", role: "Class 12 Commerce, Mumbai", text: "Finally a study app that doesn't feel like a toy. This genuinely changed how I study for board exams.", stars: 5, avatar: "SP" },
  ];

  return (
    <div className="min-h-screen bg-[#010109] text-white overflow-x-hidden font-sans selection:bg-purple-500/30">
      <ParticleField />

      {/* ── Global CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3, .display { font-family: 'Syne', sans-serif; }

        @keyframes float-logo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-node {
          from { opacity: 0.4; r: 6; }
          to { opacity: 1; r: 9; }
        }
        @keyframes shimmer-btn {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes scroll-line {
          0% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        .logo-float { animation: float-logo 4s ease-in-out infinite; }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #6366f1, #06b6d4);
          background-size: 200% auto;
          animation: shimmer-btn 4s linear infinite;
          transition: all 0.3s;
        }
        .btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 0 40px rgba(139,92,246,0.5), 0 0 80px rgba(99,102,241,0.2);
        }
        .btn-secondary {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(139,92,246,0.4);
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(139,92,246,0.2);
        }
        .hero-animate {
          animation: fade-up 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        .corner-glow-1 {
          position: absolute; top: -100px; left: -100px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          animation: glow-pulse 5s ease-in-out infinite;
        }
        .corner-glow-2 {
          position: absolute; bottom: -100px; right: -100px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%);
          animation: glow-pulse 7s ease-in-out infinite reverse;
        }
        .step-line {
          animation: scroll-line 3s ease-in-out infinite;
        }
        .section-fade {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .section-fade.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .feature-card {
          animation: fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .noise-overlay {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }
        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #a78bfa 50%, #67e8f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cta-glow {
          background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.1) 50%, transparent 100%);
        }
        .nav-blur {
          background: rgba(1,1,9,0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>

      <div className="noise-overlay" />

      {/* ──────────── HERO ──────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-start text-center px-6 pt-12 overflow-hidden">
        <div className="corner-glow-1" />
        <div className="corner-glow-2" />

        {/* Logo */}
        <div className="logo-float mb-8" style={{ animationDelay: "0.1s" }}>
          <div className="relative w-72 h-72 md:w-[28rem] md:h-[28rem] mx-auto bg-black rounded-full p-4">
            <img
              src="/logo.png"
              alt="StudySmart Logo"
              className="relative w-full h-full object-contain mix-blend-screen opacity-100"
            />
          </div>
        </div>

        {/* Heading */}
        <h1
          className="hero-animate display text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 max-w-4xl leading-none"
          style={{ animationDelay: "0.15s" }}
        >
          <span className="gradient-text">Study Smarter.</span>
          <br />
          <span className="text-white">Score Higher.</span>
        </h1>

        {/* Subtext */}
        <p
          className="hero-animate text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed mb-12 font-light"
          style={{ animationDelay: "0.25s" }}
        >
          AI-powered notes, quizzes, and personalized study plans — generated in seconds, not hours.
        </p>

        {/* CTAs */}
        <div
          className="hero-animate flex flex-col sm:flex-row items-center gap-4"
          style={{ animationDelay: "0.35s" }}
        >
          <button 
            onClick={handleLogin}
            className="btn-primary flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-base"
          >
            <SparklesIcon className="w-5 h-5" />
            Generate Notes Free
            <ArrowRightIcon className="w-4 h-4" />
          </button>
          <a href="#features">
            <button className="btn-secondary flex items-center gap-3 px-8 py-4 rounded-2xl text-slate-300 font-semibold text-base">
              Explore Features
            </button>
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-purple-400 to-transparent step-line" />
          <span className="text-[10px] tracking-widest text-slate-500 uppercase">Scroll</span>
        </div>
      </section>

      {/* ──────────── FEATURES ──────────── */}
      <section id="features" className="relative max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-semibold tracking-widest uppercase mb-6">
            <SparklesIcon className="w-3.5 h-3.5" />
            Feature Set
          </div>
          <h2 className="display text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Everything you need to{" "}
            <span className="gradient-text">ace any exam.</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Six AI modules working in sync to turn raw study material into exam-ready intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={`${i * 0.08}s`} />
          ))}
        </div>
      </section>

      {/* ──────────── HOW IT WORKS ──────────── */}
      <section id="how-it-works" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs font-semibold tracking-widest uppercase mb-6">
              Process
            </div>
            <h2 className="display text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Three steps to <span className="gradient-text">exam-ready.</span>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px">
              <div className="w-full h-full bg-gradient-to-r from-purple-500/60 via-indigo-500/60 to-cyan-500/60" />
            </div>

            {steps.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  {/* Step number bubble */}
                  <div className="w-24 h-24 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl flex items-center justify-center relative z-10 group-hover:border-purple-500/40 transition-all duration-300">
                    <span
                      className="text-3xl font-black"
                      style={{
                        fontFamily: "Syne, sans-serif",
                        background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {s.num}
                    </span>
                  </div>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity scale-150" />
                  {/* Large bg number */}
                  <div
                    className="absolute -top-4 -left-4 text-8xl font-black opacity-[0.03] pointer-events-none select-none"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    {s.num}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
                  {s.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── AI SHOWCASE ──────────── */}
      <section className="relative max-w-7xl mx-auto px-6 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-semibold tracking-widest uppercase">
              AI Engine
            </div>
            <h2 className="display text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Your Personal <br />
              <span className="gradient-text">AI Study Engine</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Every input you give is processed through a neural pipeline that understands academic context — not just keywords. It knows what matters for exams.
            </p>
            <div className="space-y-4">
              {[
                { label: "Concept Mapping", val: 96 },
                { label: "Exam Pattern Recognition", val: 91 },
                { label: "Retention Optimization", val: 88 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="text-purple-400 font-bold">{item.val}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.val}%`,
                        background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                        boxShadow: "0 0 10px rgba(139,92,246,0.5)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Neural Net Viz */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 rounded-3xl blur-3xl" />
            <div className="relative rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8">
              <NeuralNet />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── TESTIMONIALS ──────────── */}
      <section id="testimonials" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-semibold tracking-widest uppercase mb-6">
              Student Stories
            </div>
            <h2 className="display text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Toppers use <span className="gradient-text">StudyBuddy.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section className="relative py-40 px-6 overflow-hidden">
        <div className="cta-glow absolute inset-0 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-cyan-600/8 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold tracking-widest uppercase">
            <BoltIcon className="w-3.5 h-3.5" />
            Ready to Begin
          </div>
          <h2 className="display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none">
            <span className="gradient-text">Transform</span>
            <br />
            <span className="text-white">your study game.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Join thousands of students already using AI to study smarter, retain more, and score higher — without burning out.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleLogin}
              className="btn-primary flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-bold text-base"
            >
              <SparklesIcon className="w-5 h-5" />
              Enter AI Dashboard
              <ArrowRightIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={logout}
              className="btn-secondary flex items-center gap-3 px-10 py-5 rounded-2xl text-slate-300 font-semibold text-base"
            >
              Try Without Login
            </button>
          </div>
          <p className="text-slate-600 text-xs">No credit card. No setup. Just results.</p>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0 bg-black rounded-full">
              <img
                src="/logo.png"
                alt="StudySmart Logo"
                className="relative w-full h-full object-contain mix-blend-screen opacity-80"
              />
            </div>
            <span className="text-slate-400 text-sm font-semibold" style={{ fontFamily: "Syne, sans-serif" }}>
              StudyBuddy AI
            </span>
          </div>
          <p className="text-slate-600 text-xs">© 2025 StudyBuddy AI — Built for students who want to win.</p>
        </div>
      </footer>
    </div>
  );
}
