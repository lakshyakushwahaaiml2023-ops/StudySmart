import { jsPDF } from "jspdf";

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

export const exportToJSON = (data: SummaryData, filename: string = "study-summary.json") => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToTXT = (data: SummaryData, filename: string = "study-summary.txt") => {
  let content = `STUDY SUMMARY\n${"=".repeat(20)}\n\n`;
  
  // Summary
  content += `SUMMARY\n${"-".repeat(10)}\n${data.summary.replace(/\\n/g, "\n")}\n\n`;
  
  // Key Terms
  if (data.keyTerms.length > 0) {
    content += `KEY TERMS\n${"-".repeat(10)}\n`;
    data.keyTerms.forEach((item, i) => {
      content += `${i + 1}. ${item.term}: ${item.definition}\n`;
    });
    content += "\n";
  }
  
  // Formulas
  if (data.formulas && data.formulas.length > 0) {
    content += `FORMULAS\n${"-".repeat(10)}\n`;
    data.formulas.forEach((item, i) => {
      content += `${i + 1}. ${item.name}: ${item.formula}\n   Expl: ${item.explanation}\n`;
    });
    content += "\n";
  }
  
  // Questions (No answers for study purposes)
  if (data.questions.length > 0) {
    content += `PRACTICE QUESTIONS\n${"-".repeat(10)}\n`;
    data.questions.forEach((q, i) => {
      content += `Q${i + 1}: ${q.question}\n`;
      q.options.forEach((opt, j) => {
        content += `   ${String.fromCharCode(65 + j)}) ${opt}\n`;
      });
      content += "\n";
    });
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = async (data: SummaryData, filename: string = "study-summary.pdf") => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 20;

  // Helper for text wrapping and auto-paging
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    
    // Simple sanitization for PDF (remove markdown symbols)
    const cleanText = text
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/\\n/g, "\n")
      .replace(/###?\s+/g, "")
      .replace(/[\$]{1,2}/g, ""); // Remove LaTeX symbols for plain PDF text

    const lines = doc.splitTextToSize(cleanText, pageWidth - margin * 2);
    
    lines.forEach((line: string) => {
      if (cursorY > 270) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, margin, cursorY);
      cursorY += fontSize * 0.5;
    });
    cursorY += 5;
  };

  // Title
  doc.setTextColor(0, 184, 212); // Cyan
  addText("STUDY BUDDY AI: INTELLIGENCE SUMMARY", 16, true);
  doc.setTextColor(0, 0, 0);
  cursorY += 10;

  // Summary
  doc.setTextColor(59, 130, 246); // Blue
  addText("SUMMARY", 14, true);
  doc.setTextColor(0, 0, 0);
  addText(data.summary, 10);
  cursorY += 10;

  // Key Terms
  if (data.keyTerms.length > 0) {
    doc.setTextColor(59, 130, 246);
    addText("KEY TERMS", 14, true);
    doc.setTextColor(0, 0, 0);
    data.keyTerms.forEach((item, i) => {
      addText(`${i + 1}. ${item.term}: ${item.definition}`, 10);
    });
    cursorY += 10;
  }

  // Formulas
  if (data.formulas && data.formulas.length > 0) {
    doc.setTextColor(59, 130, 246);
    addText("FORMULAS", 14, true);
    doc.setTextColor(0, 0, 0);
    data.formulas.forEach((item, i) => {
      addText(`${i + 1}. ${item.name}: ${item.formula}`, 10, true);
      addText(`Explanation: ${item.explanation}`, 9);
    });
    cursorY += 10;
  }

  // Questions
  if (data.questions.length > 0) {
    doc.setTextColor(59, 130, 246);
    addText("PRACTICE QUESTIONS", 14, true);
    doc.setTextColor(0, 0, 0);
    data.questions.forEach((q, i) => {
      addText(`Q${i + 1}: ${q.question}`, 10, true);
      q.options.forEach((opt, j) => {
        addText(`  ${String.fromCharCode(65 + j)}) ${opt}`, 10);
      });
      cursorY += 5;
    });
  }

  doc.save(filename);
};
