"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createConfetti, staggerElements } from "@/lib/animations";
import { exportToJSON, exportToTXT, exportToPDF } from "@/lib/export";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface SummaryData {
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

interface Props {
  data: SummaryData;
  onReset: () => void;
  onGenerateTargetedQuiz: () => void;
  quizState: {
    quizAnswers: Record<number, string>;
    setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    quizSubmitted: boolean;
    setQuizSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
    score: number;
    setScore: React.Dispatch<React.SetStateAction<number>>;
  };
}

type TabType = "summary" | "terms" | "formulas" | "quiz";

function preprocessSummary(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\n/g, "\n")   // fix literal \n
    .replace(/\\t/g, "\t")   // fix literal \t
    .trim();
}

function preprocessMath(text: string): string {
  if (!text) return "";
  const cleanedText = preprocessSummary(text);
  // Only transform text outside existing $...$ / $$...$$ blocks.
  const segments = cleanedText.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);

  return segments
    .map((segment) => {
      if (segment.startsWith("$")) {
        return segment;
      }

      return segment.replace(
        /\\(?!begin|end|item|n|t)([a-zA-Z]+(?:\{[^}]*\})*(?:\[[^\]]*\])?)/g,
        (match) => `$${match}$`
      );
    })
    .join("");
}

export default function SummaryDisplay({ data, onReset, onGenerateTargetedQuiz, quizState }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const { quizAnswers, setQuizAnswers, quizSubmitted, setQuizSubmitted, score, setScore } = quizState;

  useEffect(() => {
    const tabElements = document.querySelectorAll("[data-tab-content]");
    staggerElements(Array.from(tabElements) as HTMLElement[]);
  }, [activeTab]);

  const getCorrectOptionIndex = (question: SummaryData["questions"][number]) => {
    const normalizedCorrect = question.correct.trim();

    // Support either "A"/"B"/"C"/"D" format or full option text.
    if (/^[A-D]$/i.test(normalizedCorrect)) {
      return normalizedCorrect.toUpperCase().charCodeAt(0) - 65;
    }

    return question.options.findIndex(
      (option) => option.trim().toLowerCase() === normalizedCorrect.toLowerCase()
    );
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (!quizSubmitted) {
      const optionLetter = String.fromCharCode(65 + optionIndex);
      setQuizAnswers((prev) => ({
        ...prev,
        [questionIndex]: optionLetter,
      }));
    }
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    data.questions.forEach((question, index) => {
      const selectedIndex = quizAnswers[index]
        ? quizAnswers[index].charCodeAt(0) - 65
        : -1;
      const correctIndex = getCorrectOptionIndex(question);

      if (selectedIndex === correctIndex) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setQuizSubmitted(true);

    // Trigger confetti celebration
    if (correctCount === data.questions.length) {
      createConfetti();
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setScore(0);
  };

  const tabs = [
    { id: "summary" as TabType, label: "📖 Summary", icon: "📖" },
    { id: "terms" as TabType, label: "📚 Key Terms", icon: "📚" },
    ...(data.formulas && data.formulas.length > 0
      ? [{ id: "formulas" as TabType, label: "∑ Formulas", icon: "∑" }]
      : []),
    { id: "quiz" as TabType, label: "🎯 Quiz", icon: "🎯" },
  ];

  return (
    <div className="animate-fadeInUp">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold gradient-text">Your Learning Material</h2>
        <div className="flex items-center gap-3">
          {/* Intelligence Export Dropdown */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="btn btn-secondary border-cyan-500/30 flex items-center gap-2 group hover:border-cyan-500 transition-all">
                <svg className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-xs font-black uppercase tracking-widest">Download Intelligence</span>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl bg-[#0a0f18] border border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => exportToPDF(data)}
                        className={`${
                          active ? "bg-cyan-500/10 text-cyan-400" : "text-slate-300"
                        } flex w-full items-center px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border-b border-white/5`}
                      >
                        <span className="text-xl mr-3">📄</span> Portable PDF Format
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => exportToTXT(data)}
                        className={`${
                          active ? "bg-purple-500/10 text-purple-400" : "text-slate-300"
                        } flex w-full items-center px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border-b border-white/5`}
                      >
                        <span className="text-xl mr-3">📝</span> Plain Text (TXT)
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => exportToJSON(data)}
                        className={`${
                          active ? "bg-blue-500/10 text-blue-400" : "text-slate-300"
                        } flex w-full items-center px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors`}
                      >
                        <span className="text-xl mr-3">🧠</span> Neural JSON Data
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          <button
            onClick={onReset}
            className="btn btn-secondary border-slate-800"
          >
            <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-black uppercase tracking-widest">New Core</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass rounded-xl mb-8 p-1 border border-slate-700/30 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/30"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass rounded-2xl border border-slate-700/30 p-8 shadow-2xl">
        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div data-tab-content className="animate-fadeInUp">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              >
                {preprocessMath(data.summary)}
              </ReactMarkdown>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-700/30">
              <div className="text-center p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="text-2xl font-bold gradient-text">
                  {data.summary.split(" ").length}
                </div>
                <p className="text-sm text-slate-400 mt-1">Words</p>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="text-2xl font-bold gradient-text">
                  {data.keyTerms.length}
                </div>
                <p className="text-sm text-slate-400 mt-1">Key Terms</p>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="text-2xl font-bold gradient-text">
                  {data.formulas?.length || 0}
                </div>
                <p className="text-sm text-slate-400 mt-1">Formulas</p>
              </div>
              <div className="text-center p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="text-2xl font-bold gradient-text">
                  {data.questions?.length || 0}
                </div>
                <p className="text-sm text-slate-400 mt-1">Questions</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Terms Tab */}
        {activeTab === "terms" && (
          <div data-tab-content className="animate-fadeInUp">
            <h3 className="text-2xl font-bold text-slate-100 mb-6">Key Terms & Definitions</h3>
            <div className="space-y-4">
              {data.keyTerms.map((term, index) => (
                <div
                  key={index}
                  className="card-hover border border-slate-700/30 p-5 hover:shadow-lg hover:shadow-cyan-500/10 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-100 text-lg mb-2 group-hover:gradient-text transition-all [&>p]:inline">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(term.term)}</ReactMarkdown>
                      </div>
                      <div className="text-slate-300 leading-relaxed">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {preprocessMath(term.definition)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulas Tab */}
        {activeTab === "formulas" && data.formulas && (
          <div data-tab-content className="animate-fadeInUp">
            <h3 className="text-2xl font-bold text-slate-100 mb-6">Key Formulas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.formulas.map((item, index) => (
                <div
                  key={index}
                  className="card-hover border border-slate-700/30 p-5 hover:shadow-lg hover:shadow-pink-500/10 group flex flex-col justify-between"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div>
                    <div className="font-bold text-pink-400 text-lg mb-4 flex items-center gap-2 [&>p]:inline">
                      <span className="text-2xl">∑</span> <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(item.name)}</ReactMarkdown>
                    </div>
                    <div className="bg-slate-900/80 p-4 rounded-lg border border-pink-500/20 mb-4 shadow-inner text-cyan-300 overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {preprocessMath(item.formula)}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed border-t border-slate-700/30 pt-3">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {preprocessMath(item.explanation)}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === "quiz" && (
          <div data-tab-content className="animate-fadeInUp">
            <h3 className="text-2xl font-bold text-slate-100 mb-6">Test Your Knowledge</h3>

            {quizSubmitted && (
              <div className="mb-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="url(#grad)" strokeWidth="3" />
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 30 50 L 45 65 L 70 35"
                        fill="none"
                        stroke="url(#grad)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="100"
                        strokeDashoffset="100"
                        style={{
                          animation: "drawCheck 0.6s ease-out forwards",
                        }}
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-100">
                      {score} / {data.questions.length}
                    </p>
                    <p className="text-slate-300 mt-1">
                      {Math.round((score / data.questions.length) * 100)}% Correct
                    </p>
                    <div className="mt-3 w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(score / data.questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {data.questions.map((question, qIndex) => (
                <div
                  key={qIndex}
                  className="p-6 bg-slate-800/30 border border-slate-700/30 rounded-xl hover:bg-slate-800/50 transition-all"
                  style={{ animationDelay: `${qIndex * 50}ms` }}
                >
                  <div className="font-bold text-slate-100 mb-4 text-lg flex items-start gap-3">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-sm flex-shrink-0 mt-0.5">
                      {qIndex + 1}
                    </span>
                    <div className="flex-1 [&>p]:inline">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {preprocessMath(question.question)}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => {
                      const isSelected = quizAnswers[qIndex] === String.fromCharCode(65 + oIndex);
                      const correctOptionIndex = getCorrectOptionIndex(question);
                      const isCorrect = oIndex === correctOptionIndex;
                      const showResult = quizSubmitted;

                      let buttonClass =
                        "w-full p-3 text-left rounded-lg border transition-all text-slate-100 font-medium cursor-pointer ";

                      if (showResult) {
                        if (isCorrect) {
                          buttonClass += "bg-green-500/20 border-green-500/50 text-green-300";
                        } else if (isSelected && !isCorrect) {
                          buttonClass += "bg-red-500/20 border-red-500/50 text-red-300";
                        } else {
                          buttonClass += "bg-slate-700/20 border-slate-600/50 opacity-50";
                        }
                      } else {
                        buttonClass += isSelected
                          ? "bg-cyan-500/30 border-cyan-500 shadow-lg shadow-cyan-500/30"
                          : "bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/40";
                      }

                      return (
                        <button
                          key={oIndex}
                          onClick={() => handleAnswerSelect(qIndex, oIndex)}
                          disabled={quizSubmitted}
                          className={buttonClass}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full border-2 border-current">
                              {String.fromCharCode(65 + oIndex)}
                            </span>
                            <div className="flex-1 text-left [&>p]:inline">
                              <ReactMarkdown 
                                remarkPlugins={[remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                              >
                                {preprocessMath(option)}
                              </ReactMarkdown>
                            </div>
                            {showResult && isCorrect && (
                              <span className="ml-auto flex-shrink-0 text-green-400">✓</span>
                            )}
                            {showResult && isSelected && !isCorrect && (
                              <span className="ml-auto flex-shrink-0 text-red-400">✗</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    (() => {
                      const selectedLetter = quizAnswers[qIndex];
                      const selectedOptionIndex = selectedLetter
                        ? selectedLetter.charCodeAt(0) - 65
                        : -1;
                      const correctOptionIndex = getCorrectOptionIndex(question);
                      const selectedOptionText =
                        selectedOptionIndex >= 0
                          ? question.options[selectedOptionIndex]
                          : "No option selected";
                      const correctOptionText =
                        correctOptionIndex >= 0
                          ? question.options[correctOptionIndex]
                          : question.correct;
                      const isCorrectAnswer = selectedOptionIndex === correctOptionIndex;

                      return (
                    <div className={`mt-4 p-4 rounded-lg text-sm shadow-inner ${
                      isCorrectAnswer
                        ? "bg-green-500/10 border border-green-500/30 text-green-300/90"
                        : "bg-orange-500/10 border border-orange-500/30 text-orange-300/90"
                    }`}>
                      <p className="font-bold mb-2 uppercase tracking-wider text-xs opacity-75">Explanation:</p>
                      <div className="text-base leading-relaxed">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                        >
                          {preprocessMath(question.explanation)}
                        </ReactMarkdown>
                      </div>
                      {!isCorrectAnswer && (
                        <div className="mt-3 text-orange-200 border-t border-orange-500/20 pt-3 space-y-2">
                          <div className="flex gap-2 [&>p]:inline">
                            <span className="opacity-75">Your answer:</span> 
                            <span className="font-bold text-slate-100"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(selectedOptionText)}</ReactMarkdown></span>
                          </div>
                          <div className="flex gap-2 [&>p]:inline">
                            <span className="opacity-75">Correct answer:</span> 
                            <span className="font-bold text-green-400"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessMath(correctOptionText)}</ReactMarkdown></span>
                          </div>
                        </div>
                      )}
                    </div>
                      );
                    })()
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 mt-8">
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length !== data.questions.length}
                  className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Quiz
                </button>
              ) : (
                <>
                  <button
                    onClick={onGenerateTargetedQuiz}
                    className="flex-1 btn bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-0 shadow-lg shadow-purple-500/20"
                  >
                    Target Weak Topics
                  </button>
                  <button
                    onClick={handleResetQuiz}
                    className="flex-1 btn btn-secondary"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onReset}
                    className="flex-1 btn btn-primary"
                  >
                    New Material
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
