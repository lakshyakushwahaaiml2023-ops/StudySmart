"use client";

import { useState, useRef } from "react";
import { extractPDFText } from "@/lib/pdfExtractor";
import { resizeImage } from "@/lib/imageUtils";

interface Props {
  value: string;
  onChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  setDifficulty: (diff: "Easy" | "Medium" | "Hard") => void;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  variant?: "full" | "compact";
  showUploadInCompact?: boolean;
}

export default function NotesInput({
  value,
  onChange,
  onGenerate,
  isLoading,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount,
  variant = "full",
  showUploadInCompact = false,
}: Props) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [filePreview, setFilePreview] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setIsExtracting(true);
    setFilePreview(`📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    try {
      let extractedText = "";

      if (file.type.startsWith("image/")) {
        extractedText = await handleOCR(file);
      } else if (file.type === "application/pdf") {
        extractedText = await extractPDFText(file);
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
      } else {
        throw new Error("Unsupported file type. Please use PDF, TXT, or Image files.");
      }

      onChange(extractedText);
      setFilePreview(
        `✓ Extracted ${extractedText.split(/\s+/).length} words from ${file.name}`,
      );
    } catch (error) {
      setFilePreview(
        `✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsExtracting(false);
      setIsScanningOCR(false);
    }
  };

  const handleOCR = async (file: File): Promise<string> => {
    setIsScanningOCR(true);
    try {
      const optimizedBase64 = await resizeImage(file);
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: optimizedBase64 }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Neural OCR failed to analyze handwriting");
      }
      
      const data = await res.json();
      return data.text;
    } catch (e) {
      console.error("OCR Client Error:", e);
      throw e;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes("image")) {
        const file = items[i].getAsFile();
        if (file) processFile(file);
        break;
      }
    }
  };

  const clearText = () => {
    onChange("");
    setFilePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    textAreaRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          accept=".pdf,.txt,.jpg,.jpeg,.png"
          className="hidden"
        />
        {variant !== "compact" && (
          <>
            {/* File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative group rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                isDragActive
                  ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/30"
                  : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/30"
              }`}
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 sm:p-8 text-center hover:bg-slate-800/30 transition-colors rounded-xl relative overflow-hidden"
              >
                {/* Neural Scan Animation */}
                {isScanningOCR && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
                     <div className="relative w-full max-w-xs h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-32 animate-[shimmer_2s_infinite]" style={{ width: '50%' }} />
                        <div className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_2s_infinite]" />
                     </div>
                     <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] animate-pulse">Digitizing Handwritten Notes...</p>
                  </div>
                )}
                <div className="mb-4 flex justify-center">
                  <svg
                    className={`w-12 h-12 transition-all duration-300 ${
                      isDragActive
                        ? "text-cyan-400 scale-125"
                        : "text-slate-400 group-hover:text-slate-300"
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

                {isExtracting ? (
                  <div>
                    <p className="text-slate-300 font-semibold uppercase tracking-widest text-xs animate-pulse">
                      Neural Extraction Active...
                    </p>
                    <div className="mt-4 flex justify-center">
                      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-200 font-semibold">
                      Drop your notes here or click to upload
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                       Supports PDF, TXT & Handwritten Photos (OCR)
                    </p>
                  </div>
                )}
              </div>

              {isDragActive && (
                <div className="absolute inset-0 bg-cyan-500/5 rounded-xl pointer-events-none"></div>
              )}
            </div>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-slate-900/80 text-sm text-slate-400">
                  OR
                </span>
              </div>
            </div>
          </>
        )}

        {/* File Preview */}
        {filePreview && (
          <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-lg text-sm text-slate-300 animate-fadeInUp">
            {filePreview}
          </div>
        )}

        {/* Textarea */}
        <div className="relative group">
          <textarea
            ref={textAreaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste your study notes here..."
            className={`w-full bg-slate-800/40 border border-slate-700 rounded-xl px-5 py-4 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none transition-all resize-none shadow-inner ${
              variant === "compact"
                ? "min-h-[120px] text-xs"
                : "min-h-[250px] text-sm font-mono leading-relaxed"
            }`}
          />

          {/* Character count */}
          <div className="absolute bottom-3 right-3 text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded">
            {value.length > 0 ? `${value.length} chars` : "Start typing..."}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Quiz Settings */}
          {variant !== "compact" && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Quiz Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")
                  }
                  disabled={isLoading}
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(parseInt(e.target.value) || 5)
                  }
                  disabled={isLoading}
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-2.5 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onGenerate}
              disabled={!value.trim() || isLoading}
              className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
            >
              {isLoading ? (
                <>
                  <div className="spinner-sm"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>
                    {variant === "compact"
                      ? "Summarize"
                      : "Generate Learning Material"}
                  </span>
                </>
              )}
            </button>

            {variant === "compact" && showUploadInCompact && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="btn bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 px-4"
                title="Upload PDF/TXT"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-tight">Add Material</span>
                </div>
              </button>
            )}

            {value.trim() && (
              <button
                onClick={clearText}
                disabled={isLoading}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      {variant !== "compact" && (
        <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg mt-4">
          <p className="text-xs text-slate-400 mb-2 font-semibold">
            💡 Tips for best results:
          </p>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>• Paste at least 100 words for better summaries</li>
            <li>• Use clear, well-structured content</li>
            <li>• PDF files work best for textbooks and articles</li>
          </ul>
        </div>
      )}
      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
