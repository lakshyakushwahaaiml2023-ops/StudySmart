// lib/textProcessing.ts

export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;

  if (fileType === "text/plain" || file.name.endsWith(".txt")) {
    return await file.text();
  } else if (
    fileType === "application/pdf" ||
    file.name.endsWith(".pdf")
  ) {
    return await extractTextFromPDF(file);
  } else {
    throw new Error("Unsupported file type. Please use TXT or PDF files.");
  }
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Configure worker at runtime to avoid SSR module evaluation issues.
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          if (typeof item === "object" && item !== null && "str" in item) {
            return String((item as { str?: unknown }).str ?? "");
          }
          return "";
        })
        .join(" ");
      extractedText += pageText + "\n";
    }

    return extractedText.trim();
  } catch {
    throw new Error("Failed to extract text from PDF. Please check the file.");
  }
};

export const validateText = (text: string): { valid: boolean; error?: string } => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Please provide some text" };
  }

  if (text.length < 100) {
    return {
      valid: false,
      error: "Text is too short (minimum 100 characters)",
    };
  }

  if (text.length > 50000) {
    return {
      valid: false,
      error: "Text is too long (maximum 50,000 characters)",
    };
  }

  return { valid: true };
};

export const cleanText = (text: string): string => {
  return text
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
    .trim();
};

export const getCharacterCount = (text: string): number => {
  return text.length;
};

export const getWordCount = (text: string): number => {
  return text.trim().split(/\s+/).length;
};
