import "server-only";

import mammoth from "mammoth";
import { extractPdfText, isPdf } from "@/lib/pdf";

export function isDocx(file: File): boolean {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

// An error whose message is written for the entrepreneur and can be shown as-is.
export class DocumentReadError extends Error {}

// Extracts the text of an uploaded PDF or Word (.docx) document.
export async function extractDocumentText(file: File): Promise<string> {
  if (isPdf(file)) return extractPdfText(file);

  if (isDocx(file)) {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) });
    return value.trim();
  }

  if (file.name.toLowerCase().endsWith(".doc")) {
    throw new DocumentReadError(
      "This is an older Word file (.doc) that we can't read. In Word, choose Save As and pick .docx or PDF, then upload it again."
    );
  }
  throw new DocumentReadError("Please upload a PDF or a Word document (.docx).");
}
