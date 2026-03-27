"use client";

import { useState, useEffect } from "react";
import NotesInput from "@/components/NotesInput";
import SummaryDisplay from "@/components/SummaryDisplay";
import { validateText, cleanText } from "@/lib/textProcessing";
import { smoothScrollToElement, createConfetti } from "@/lib/animations";

export interface SummaryData {
  summary: string;
  keyTerms: Array<{ term: string; definition: string }>;
  formulas?: Array<{ name: string; formula: string; explanation: string }>;
  questions: Array<{
    question: string;
    options: string[];
    correct: string;
    explanation: string;
  }>;
}

export default function Home() {
  const [text, setText] = useState("");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [quizDifficulty, setQuizDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [quizCount, setQuizCount] = useState<number>(5);

  const handleTextInput = (inputText: string) => {
    setText(inputText);
    setError("");
  };

  const handleGenerateSummary = async () => {
    const validation = validateText(text);
    if (!validation.valid) {
      setError(validation.error || "Invalid input");
      return;
    }

    setLoading(true);
    setError("");
    setSummaryData(null);
    setProgress(0);

    try {
      const cleanedText = cleanText(text);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 300);

      // Call summarize API
      const summaryResponse = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText }),
      });

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json();
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const summaryResult = await summaryResponse.json();
      setProgress(40);

      // Call MCQ API
      const mcqResponse = await fetch("/api/generate_mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanedText,
          difficulty: quizDifficulty,
          count: quizCount,
        }),
      });

      if (!mcqResponse.ok) {
        const errorData = await mcqResponse.json();
        throw new Error(errorData.error || "Failed to generate MCQs");
      }

      const mcqResult = await mcqResponse.json();
      setProgress(100);

      setSummaryData({
        summary: summaryResult.summary,
        keyTerms: summaryResult.keyTerms,
        formulas: summaryResult.formulas || [],
        questions: mcqResult.questions,
      });

      // Scroll to results with smooth animation
      setTimeout(() => {
        const resultsElement = document.getElementById("results-section");
        if (resultsElement) {
          smoothScrollToElement(resultsElement);
        }
      }, 300);

      clearInterval(progressInterval);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";
      setError(message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText("");
    setSummaryData(null);
    setError("");
    setProgress(0);
    
    // Smooth scroll back to top
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Background is now handled directly by body styling in globals.css */}

      {/* Sidebar (Floating Logo on Desktop, Top on Mobile) */}
      <aside className="relative md:fixed md:left-0 md:top-0 w-full md:w-auto flex flex-col items-center justify-center p-4 md:p-8 z-50">
        <a href="/" className="group cursor-pointer flex-shrink-0">
          <img 
            src="/logo.png" 
            alt="StudySmart Logo" 
            className="h-24 md:h-32 lg:h-40 w-auto object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_25px_#0ff] group-active:scale-95 mix-blend-screen"
          />
        </a>

        {/* Progress bar */}
        {loading && (
          <div className="absolute top-full left-0 right-0 h-1 bg-slate-900/80">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-magenta-500 to-green-400 transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full md:ml-64 lg:ml-72 flex justify-center">
        <main className="relative w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-4 md:py-12">
        {!summaryData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-2 animate-slideInLeft">
              <div className="glass rounded-2xl shadow-2xl p-8 border border-slate-700/30">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-8">
                  Paste Your Notes or Upload a File
                </h2>

                <NotesInput
                  value={text}
                  onChange={handleTextInput}
                  onGenerate={handleGenerateSummary}
                  isLoading={loading}
                  difficulty={quizDifficulty}
                  setDifficulty={setQuizDifficulty}
                  questionCount={quizCount}
                  setQuestionCount={setQuizCount}
                />

                {error && (
                  <div className="mt-6 p-4 bg-red-950/40 border border-red-700/50 rounded-xl animate-fadeInUp shadow-lg shadow-red-500/10">
                    <p className="text-red-200">
                      <span className="font-semibold">⚠️ Error:</span> {error}
                    </p>
                  </div>
                )}

                {/* Character count */}
                {text.length > 0 && (
                  <div className="mt-4 text-sm text-slate-400">
                    <span className="text-cyan-400 font-semibold">{text.length}</span> characters | 
                    <span className="text-purple-400 font-semibold ml-2">{text.split(/\s+/).filter(Boolean).length}</span> words
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:col-span-1 animate-slideInRight">
              <div className="glass rounded-2xl shadow-2xl p-6 sticky top-24 border border-slate-700/30 animate-stagger">
                <h3 className="text-lg font-bold text-slate-100 mb-6 gradient-text">✨ Features</h3>
                
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <span className="text-cyan-400 font-bold text-lg flex-shrink-0">✓</span>
                    <span>Structured summaries with key points</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <span className="text-purple-400 font-bold text-lg flex-shrink-0">✓</span>
                    <span>Auto-generated MCQs with difficulty levels</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <span className="text-pink-400 font-bold text-lg flex-shrink-0">✓</span>
                    <span>Key terms and definitions</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <span className="text-green-400 font-bold text-lg flex-shrink-0">✓</span>
                    <span>Download as PDF or JSON</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                    <span className="text-blue-400 font-bold text-lg flex-shrink-0">✓</span>
                    <span>No login required</span>
                  </li>
                </ul>

                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <h4 className="font-semibold text-slate-100 mb-4 text-sm">📄 Supported Formats</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/30 p-2 rounded-lg">
                      <span>📝</span> Plain text (.txt)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/30 p-2 rounded-lg">
                      <span>📕</span> PDF files
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/30 p-2 rounded-lg">
                      <span>📋</span> Pasted text
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 text-center">
                    💡 Pro tip: Longer notes generate better summaries!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="results-section" className="animate-fadeInUp">
            <SummaryDisplay data={summaryData} onReset={handleReset} />
          </div>
        )}
      </main>

      </div>
    </div>
  );
}
