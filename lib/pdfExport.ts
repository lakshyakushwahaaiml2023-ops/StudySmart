// lib/pdfExport.ts
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ExportData {
  summary: string;
  keyTerms: Array<{ term: string; definition: string }>;
  questions: Array<{
    question: string;
    options: string[];
    correct: string;
    explanation: string;
  }>;
}

export const exportToPDF = async (
  data: ExportData,
  fileName: string = "study_material.pdf"
): Promise<void> => {
  const pdf = new jsPDF();
  let yPosition = 20;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const maxWidth = pdf.internal.pageSize.getWidth() - marginLeft - marginRight;

  const addNewPageIfNeeded = (spaceNeeded: number) => {
    if (yPosition + spaceNeeded > pageHeight - 10) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  const addText = (text: string, fontSize: number, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont("helvetica", "bold");
    } else {
      pdf.setFont("helvetica", "normal");
    }

    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize / 2.5;
    const spaceNeeded = lines.length * lineHeight;

    addNewPageIfNeeded(spaceNeeded);

    pdf.text(lines, marginLeft, yPosition);
    yPosition += spaceNeeded + 3;
  };

  // Title
  addText("STUDY MATERIAL SUMMARY & QUIZ", 16, true);
  yPosition += 5;

  // Summary Section
  addText("SUMMARY", 14, true);
  yPosition += 3;

  // Parse and add summary (it's in markdown format)
  const summaryLines = data.summary.split("\n");
  summaryLines.forEach((line) => {
    if (line.startsWith("# ")) {
      addText(line.replace("# ", ""), 12, true);
    } else if (line.startsWith("## ")) {
      addText(line.replace("## ", ""), 11, true);
    } else if (line.startsWith("- ")) {
      addText(line.replace("- ", "  • "), 10);
    } else if (line.trim()) {
      addText(line, 10);
    }
  });

  yPosition += 8;

  // Key Terms Section
  addText("KEY TERMS & DEFINITIONS", 14, true);
  yPosition += 3;

  data.keyTerms.slice(0, 20).forEach((item) => {
    addNewPageIfNeeded(8);
    addText(`${item.term}`, 11, true);
    addText(`${item.definition}`, 10);
    yPosition += 2;
  });

  yPosition += 8;

  // MCQ Section
  addText("MULTIPLE CHOICE QUESTIONS", 14, true);
  yPosition += 3;

  data.questions.forEach((q, index) => {
    addNewPageIfNeeded(15);

    addText(`Q${index + 1}. ${q.question}`, 11, true);
    yPosition += 2;

    q.options.forEach((option, optIndex) => {
      const marker = String.fromCharCode(65 + optIndex); // A, B, C, D
      const isCorrect = option === q.correct;
      const text = `${marker}. ${option}${isCorrect ? " ✓ (CORRECT)" : ""}`;
      addText(text, 10, isCorrect);
    });

    addText(`Explanation: ${q.explanation}`, 9);
    yPosition += 4;
  });

  pdf.save(fileName);
};

export const exportToJSON = (data: ExportData, fileName: string = "study_material.json"): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToHTML = (data: ExportData, fileName: string = "study_material.html"): void => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Study Material</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
    h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    .summary { background: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .key-terms { background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .term { font-weight: bold; color: #166534; }
    .questions { background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .question { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #dc2626; }
    .options { margin: 10px 0; }
    .option { margin: 8px 0; }
    .correct { color: green; font-weight: bold; }
    .explanation { font-style: italic; color: #666; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Study Material Summary & Quiz</h1>
  
  <section class="summary">
    <h2>Summary</h2>
    <pre>${data.summary.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  </section>

  <section class="key-terms">
    <h2>Key Terms & Definitions</h2>
    ${data.keyTerms.map((item) => `
      <div>
        <span class="term">${item.term}</span>: ${item.definition}
      </div>
    `).join("")}
  </section>

  <section class="questions">
    <h2>Questions</h2>
    ${data.questions.map((q, i) => `
      <div class="question">
        <strong>Q${i + 1}. ${q.question}</strong>
        <div class="options">
          ${q.options.map((opt, j) => `
            <div class="option">
              <span>${String.fromCharCode(65 + j)}. ${opt}</span>
              ${opt === q.correct ? '<span class="correct"> ✓</span>' : ''}
            </div>
          `).join("")}
        </div>
        <div class="explanation">Explanation: ${q.explanation}</div>
      </div>
    `).join("")}
  </section>
</body>
</html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
