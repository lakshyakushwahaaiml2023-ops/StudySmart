"use client";

import { useState, useEffect } from "react";
import NotesInput from "@/components/NotesInput";
import SummaryDisplay from "@/components/SummaryDisplay";
import { validateText, cleanText } from "@/lib/textProcessing";
import { smoothScrollToElement, createConfetti } from "@/lib/animations";

export interface SummaryData {
  summary: string;
  keyTerms: Array<{ term: string; definition: string }>;
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
          difficulty: "Medium",
          count: 5,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-fadeInDown">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">StudySmart</h1>
            <p className="text-slate-300 mt-2 text-lg">
              Transform your notes into summaries and quizzes instantly
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/30">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-xl mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-slate-400">
            StudySmart © 2024 | <span className="text-cyan-400">Powered by Groq</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Made with ❤️ for students everywhere
          </p>
        </div>
      </footer>
    </div>
  );
}
