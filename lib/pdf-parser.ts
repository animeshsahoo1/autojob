import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";

export interface ParsedResume {
  rawText: string;
  pageCount: number;
  metadata: {
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
  };
}

/**
 * Parse a PDF resume using LangChain
 * @param file - PDF file buffer or path
 * @param fileName - Original filename
 * @param fileSize - File size in bytes
 * @returns Parsed resume data
 */
export async function parseResumePDF(
  file: Buffer | string,
  fileName: string,
  fileSize: number,
): Promise<ParsedResume> {
  try {
    let loader: PDFLoader;

    // Handle Buffer (from file upload)
    if (Buffer.isBuffer(file)) {
      // Create a temporary blob from buffer
      const blob = new Blob([file], { type: "application/pdf" });
      loader = new PDFLoader(blob, {
        splitPages: false, // Keep all content together
      });
    } else {
      // Handle file path
      loader = new PDFLoader(file, {
        splitPages: false,
      });
    }

    // Load and parse the PDF
    const docs: Document[] = await loader.load();

    // Combine all pages into one text
    const rawText = docs.map((doc) => doc.pageContent).join("\n\n");

    return {
      rawText: rawText.trim(),
      pageCount: docs.length,
      metadata: {
        fileName,
        fileSize,
        uploadedAt: new Date(),
      },
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}

/**
 * Validate PDF file before parsing
 */
export function validatePDFFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["application/pdf"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Only PDF files are allowed",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size must be less than 10MB",
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    };
  }

  return { valid: true };
}
