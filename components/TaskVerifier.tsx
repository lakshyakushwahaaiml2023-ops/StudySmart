"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { createConfetti } from "@/lib/animations";

interface Question {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

interface Props {
  taskName: string;
  studyText: string;
  onComplete: () => void;
}

function preprocessMath(text: string): string {
  if (!text) return "";
  // Ensure double backslashes are handled correctly for JSON/LaTeX parsing
  return text.replace(/\\\\/g, "\\").trim();
}

export default function TaskVerifier({ taskName, studyText, onComplete }: Props) {
  const [step, setStep] = useState<"start" | "quiz" | "correction" | "success">("start");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [wrongIndices, setWrongIndices] = useState<number[]>([]);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate_mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: studyText || `I am studying ${taskName}. Please generate questions about it.`,
          difficulty: "Medium",
          count: 3,
        }),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setStep("quiz");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const wrong: number[] = [];
    questions.forEach((q, i) => {
      if (answers[i] !== q.correct) {
        wrong.push(i);
      }
    });

    if (wrong.length === 0) {
      createConfetti();
      setStep("success");
      setTimeout(onComplete, 3000);
    } else {
      setWrongIndices(wrong);
      setStep("correction");
    }
  };

  if (step === "start") {
    return (
      <div className="flex flex-col items-center gap-6 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to verify?</h3>
          <p className="text-slate-400 text-sm">Complete a 3-question MCQ quiz to mark this task as done.</p>
        </div>
        <button
          onClick={startQuiz}
          disabled={loading}
          className="btn btn-primary px-8 py-3 rounded-2xl flex items-center gap-2"
        >
          {loading ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircleIcon className="w-5 h-5" />
          )}
          Generate Quiz
        </button>
      </div>
    );
  }

  if (step === "quiz") {
    return (
      <div className="space-y-6 p-6 bg-slate-900/50 rounded-3xl border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-4">Verification Quiz</h3>
        {questions.map((q, i) => (
          <div key={i} className="space-y-3">
            <div className="text-sm text-slate-200 font-medium flex gap-2">
              <span>{i + 1}.</span>
              <div className="[&>p]:inline">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {preprocessMath(q.question)}
                </ReactMarkdown>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [i]: opt })}
                  className={`p-3 text-left text-xs rounded-xl border transition-all ${
                    answers[i] === opt
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-100"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <div className="[&>p]:inline">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {preprocessMath(opt)}
                    </ReactMarkdown>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full btn btn-success py-4 rounded-2xl font-bold uppercase tracking-widest disabled:opacity-30"
        >
          Verify Answers
        </button>
      </div>
    );
  }

  if (step === "correction") {
    const q = questions[wrongIndices[currentFlashcard]];
    return (
      <div className="space-y-6 p-8 bg-slate-900/50 rounded-3xl border border-red-500/20">
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <XCircleIcon className="w-6 h-6" />
          <h3 className="text-lg font-bold">Correction Required</h3>
        </div>
        
        <div className="relative group perspective-1000 h-72">
           {/* Simple Flashcard UI */}
           <div className="w-full h-full bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-slate-700 shadow-xl overflow-y-auto">
              <div className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-4">Learning Card</div>
              <div className="text-slate-200 text-sm font-medium mb-2">Focus on this concept:</div>
              <div className="text-cyan-400 text-base font-bold italic mb-4">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {preprocessMath(q.explanation)}
                </ReactMarkdown>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase">
                Correct Answer: 
                <span className="ml-1 text-emerald-400">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {preprocessMath(q.correct)}
                  </ReactMarkdown>
                </span>
              </div>
           </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => {
              if (currentFlashcard > 0) setCurrentFlashcard(c => c - 1);
            }}
            disabled={currentFlashcard === 0}
            className="text-xs text-slate-500 hover:text-white disabled:opacity-0"
          >
            ← Previous
          </button>
          <div className="text-xs font-mono text-slate-500">
            {currentFlashcard + 1} / {wrongIndices.length}
          </div>
          {currentFlashcard < wrongIndices.length - 1 ? (
            <button
              onClick={() => setCurrentFlashcard(c => c + 1)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => {
                setStep("start"); // Retry
                setAnswers({});
                setWrongIndices([]);
                setCurrentFlashcard(0);
              }}
              className="btn btn-primary px-6 py-2 rounded-xl text-xs"
            >
              Retry Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-4 p-12 bg-emerald-500/10 rounded-3xl border border-emerald-500/30 text-center animate-bounceIn">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white text-4xl shadow-[0_0_30px_rgba(16,185,129,0.5)]">
          ✓
        </div>
        <div>
          <h3 className="text-2xl font-black text-white">Task Verified!</h3>
          <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mt-1">Syncing Schedule...</p>
        </div>
      </div>
    );
  }

  return null;
}
