export const extractPDFText = async (file: File): Promise<string> => {
  const pdf = await import("pdfjs-dist");
  pdf.GlobalWorkerOptions.workerSrc =
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdf.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdf.getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items
      .map((item) => {
        if (typeof item === "object" && item !== null && "str" in item) {
          return String((item as { str?: unknown }).str ?? "");
        }
        return "";
      })
      .join(" ") + "\n";
  }

  return text;
};
