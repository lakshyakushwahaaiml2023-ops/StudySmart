"use client";

import { useState, useEffect } from "react";
import { createConfetti, staggerElements } from "@/lib/animations";

interface SummaryData {
  summary: string;
  keyTerms: Array<{ term: string; definition: string }>;
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
}

type TabType = "summary" | "terms" | "quiz";

export default function SummaryDisplay({ data, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

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
    { id: "quiz" as TabType, label: "🎯 Quiz", icon: "🎯" },
  ];

  return (
    <div className="animate-fadeInUp">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold gradient-text">Your Learning Material</h2>
        <button
          onClick={onReset}
          className="btn btn-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Material
        </button>
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
            <h3 className="text-2xl font-bold text-slate-100 mb-6">Summary</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-lg">
                {data.summary}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-700/30">
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
                  {data.questions.length}
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
                      <h4 className="font-bold text-slate-100 text-lg mb-2 group-hover:gradient-text transition-all">
                        {term.term}
                      </h4>
                      <p className="text-slate-300 leading-relaxed">
                        {term.definition}
                      </p>
                    </div>
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
                  <h4 className="font-bold text-slate-100 mb-4 text-lg">
                    <span className="inline-block mr-3 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-sm">
                      {qIndex + 1}
                    </span>
                    {question.question}
                  </h4>

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
                            <span className="w-6 h-6 flex items-center justify-center rounded-full border-2 border-current">
                              {String.fromCharCode(65 + oIndex)}
                            </span>
                            {option}
                            {showResult && isCorrect && (
                              <span className="ml-auto text-green-400">✓</span>
                            )}
                            {showResult && isSelected && !isCorrect && (
                              <span className="ml-auto text-red-400">✗</span>
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
                    <div className={`mt-4 p-3 rounded-lg text-sm ${
                      isCorrectAnswer
                        ? "bg-green-500/10 border border-green-500/30 text-green-300"
                        : "bg-orange-500/10 border border-orange-500/30 text-orange-300"
                    }`}>
                      <p className="font-semibold mb-1">Explanation:</p>
                      <p>{question.explanation}</p>
                      {!isCorrectAnswer && (
                        <p className="mt-2 text-orange-200">
                          Your answer: <span className="font-semibold">{selectedOptionText}</span>. Correct answer: <span className="font-semibold">{correctOptionText}</span>. Your selected option does not match the key concept tested in this question.
                        </p>
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
