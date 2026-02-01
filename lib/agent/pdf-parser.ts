import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { Ollama } from "@langchain/ollama";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { IResume } from "@/models/resume.model";

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

/**
 * Define Zod schema for structured resume extraction
 */
const resumeSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().describe("Full name of the candidate"),
    email: z.string().email().describe("Email address"),
    phone: z.string().optional().describe("Phone number"),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional()
      .describe("Physical address"),
    linkedIn: z.string().optional().describe("LinkedIn profile URL"),
    github: z.string().optional().describe("GitHub profile URL"),
    portfolio: z.string().optional().describe("Portfolio website URL"),
    website: z.string().optional().describe("Personal website URL"),
    socialLinks: z
      .array(
        z.object({
          platform: z.string(),
          url: z.string(),
        })
      )
      .optional()
      .describe("Other social media links"),
  }),

  summary: z
    .string()
    .optional()
    .describe("Professional summary or career objective"),
  objective: z.string().optional().describe("Career objective statement"),

  education: z
    .array(
      z.object({
        institution: z.string().describe("Name of the educational institution"),
        degree: z.string().describe("Degree obtained or pursuing"),
        major: z.string().optional().describe("Major or field of study"),
        minor: z.string().optional().describe("Minor field of study"),
        gpa: z.number().optional().describe("GPA score"),
        maxGpa: z.number().optional().describe("Maximum GPA scale"),
        startDate: z.string().optional().describe("Start date"),
        endDate: z.string().optional().describe("End date or expected graduation"),
        isCurrentlyEnrolled: z
          .boolean()
          .optional()
          .describe("Currently enrolled status"),
        location: z.string().optional().describe("Location of institution"),
        achievements: z.array(z.string()).optional().describe("Academic achievements"),
        coursework: z.array(z.string()).optional().describe("Relevant coursework"),
        honors: z.array(z.string()).optional().describe("Honors and awards"),
      })
    )
    .describe("Education history"),

  workExperience: z
    .array(
      z.object({
        company: z.string().describe("Company name"),
        position: z.string().describe("Job title/position"),
        location: z.string().optional().describe("Job location"),
        isRemote: z.boolean().optional().describe("Remote position"),
        startDate: z.string().optional().describe("Start date"),
        endDate: z.string().optional().describe("End date or 'Present'"),
        isCurrent: z.boolean().optional().describe("Currently employed"),
        employmentType: z
          .enum(["full-time", "part-time", "internship", "contract", "freelance"])
          .optional()
          .describe("Type of employment"),
        description: z.string().optional().describe("Job description"),
        responsibilities: z
          .array(z.string())
          .optional()
          .describe("Key responsibilities"),
        achievements: z.array(z.string()).optional().describe("Achievements and impact"),
        technologies: z.array(z.string()).optional().describe("Technologies used"),
      })
    )
    .describe("Work experience history"),

  projects: z
    .array(
      z.object({
        name: z.string().describe("Project name"),
        description: z.string().optional().describe("Project description"),
        role: z.string().optional().describe("Your role in the project"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        technologies: z.array(z.string()).optional().describe("Technologies used"),
        achievements: z.array(z.string()).optional().describe("Key achievements"),
        url: z.string().optional().describe("Project URL"),
        github: z.string().optional().describe("GitHub repository URL"),
        highlights: z.array(z.string()).optional().describe("Project highlights"),
        teamSize: z.number().optional().describe("Team size"),
      })
    )
    .optional()
    .describe("Projects"),

  skills: z
    .array(
      z.object({
        category: z
          .string()
          .describe(
            "Skill category (e.g., Programming Languages, Frameworks, Tools)"
          ),
        skills: z.array(z.string()).describe("List of skills in this category"),
      })
    )
    .describe("Technical and soft skills"),

  certifications: z
    .array(
      z.object({
        name: z.string().describe("Certification name"),
        issuer: z.string().describe("Issuing organization"),
        issueDate: z.string().optional(),
        expirationDate: z.string().optional(),
        credentialId: z.string().optional(),
        credentialUrl: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional()
    .describe("Certifications and licenses"),

  publications: z
    .array(
      z.object({
        title: z.string(),
        authors: z.array(z.string()).optional(),
        publisher: z.string().optional(),
        publicationDate: z.string().optional(),
        url: z.string().optional(),
        doi: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional()
    .describe("Publications"),

  awards: z
    .array(
      z.object({
        title: z.string(),
        issuer: z.string(),
        date: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional()
    .describe("Awards and honors"),

  volunteerExperience: z
    .array(
      z.object({
        organization: z.string(),
        role: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
        description: z.string().optional(),
        achievements: z.array(z.string()).optional(),
      })
    )
    .optional()
    .describe("Volunteer experience"),

  languages: z
    .array(
      z.object({
        language: z.string(),
        proficiency: z.enum(["native", "fluent", "professional", "intermediate", "basic"]),
      })
    )
    .optional()
    .describe("Languages spoken"),

  interests: z.array(z.string()).optional().describe("Personal interests"),
  hobbies: z.array(z.string()).optional().describe("Hobbies"),

  workAuthorization: z
    .array(
      z.object({
        country: z.string(),
        status: z.enum([
          "citizen",
          "permanent_resident",
          "work_visa",
          "student_visa",
          "requires_sponsorship",
        ]),
        requiresSponsorship: z.boolean().optional(),
        visaType: z.string().optional(),
      })
    )
    .optional()
    .describe("Work authorization status"),

  desiredRoles: z.array(z.string()).optional().describe("Desired job roles"),
  desiredLocations: z.array(z.string()).optional().describe("Preferred locations"),
  willingToRelocate: z.boolean().optional().describe("Willing to relocate"),
  remotePreference: z
    .enum(["remote_only", "hybrid", "onsite", "flexible"])
    .optional()
    .describe("Remote work preference"),
  expectedSalary: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
    })
    .optional()
    .describe("Expected salary range"),
  availableStartDate: z.string().optional().describe("Available start date"),
  noticePeriod: z.number().optional().describe("Notice period in days"),

  professionalMemberships: z
    .array(
      z.object({
        organization: z.string(),
        role: z.string().optional(),
        membershipId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
      })
    )
    .optional()
    .describe("Professional memberships"),

  teachingExperience: z
    .array(
      z.object({
        institution: z.string(),
        role: z.string(),
        courses: z.array(z.string()).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isCurrent: z.boolean().optional(),
      })
    )
    .optional()
    .describe("Teaching experience"),
});

/**
 * Extract structured resume data from parsed PDF text using LangChain with local Ollama
 * @param rawText - The raw text extracted from the PDF
 * @returns Structured resume data conforming to IResume interface
 */
export async function extractResumeFields(
  rawText: string
): Promise<Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>> {
  console.log("Starting resume extraction with local Ollama...");
  
  // Initialize Ollama with local instance
  const model = new Ollama({
    baseUrl: "http://localhost:11434",
    model: "deepseek-r1:1.5b",
    temperature: 0.1,
    format: "json", // Force JSON output
  });

  // Create structured output parser
  const parser = StructuredOutputParser.fromZodSchema(resumeSchema);

  console.log("Formatting prompt...");
  
  // Create prompt template
  const promptTemplate = PromptTemplate.fromTemplate(
    `Extract resume information as JSON.

Instructions:
- Use ISO dates (YYYY-MM-DD) or "Present"
- Omit missing fields
- Categorize skills (Programming Languages, Frameworks, Tools, etc.)
- Extract ALL data accurately
- DO NOT invent fields

{format_instructions}

Resume:
{resume_text}

JSON:`
  );

  // Format the prompt
  const formattedPrompt = await promptTemplate.format({
    resume_text: rawText,
    format_instructions: parser.getFormatInstructions(),
  });

  console.log("Invoking local Ollama...");
  
  // Invoke the model
  let response = await model.invoke(formattedPrompt);
  
  console.log("Cleaning response...");
  
  // Clean up response - remove thinking tags and code blocks
  response = response
    .replace(/<think>.*?<\/think>/gs, '') // Remove <think> tags
    .replace(/```json\s*/g, '') // Remove ```json
    .replace(/```\s*/g, '') // Remove ```
    .trim();
  
  console.log("Parsing response...");
  
  // Parse the output
  const parsedResume = await parser.parse(response);

  console.log("Resume extraction completed successfully");

  // Add metadata
  return {
    ...parsedResume,
    rawText,
    parsedDate: new Date(),
    lastUpdated: new Date(),
  };
}

/**
 * Complete pipeline: Parse PDF and extract structured resume data
 * @param file - PDF file buffer or path
 * @param fileName - Original filename
 * @param fileSize - File size in bytes
 * @returns Structured resume data ready to save to database
 */
export async function parseAndExtractResume(
  file: Buffer | string,
  fileName: string,
  fileSize: number
): Promise<{
  rawData: ParsedResume;
  structuredData: Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>;
}> {
  console.log("📄 Parsing PDF...");
  // Step 1: Parse the PDF
  const rawData = await parseResumePDF(file, fileName, fileSize);
  console.log(`✅ PDF parsed: ${rawData.pageCount} pages, ${rawData.rawText.length} characters`);

  console.log("🤖 Extracting structured data with local Ollama...");
  // Step 2: Extract structured fields using LangChain with Ollama
  const structuredData = await extractResumeFields(rawData.rawText);

  // Add file metadata
  structuredData.fileUrl = fileName;

  return {
    rawData,
    structuredData,
  };
}
