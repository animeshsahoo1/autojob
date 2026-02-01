import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { IResume } from "@/models/resume.model";

// Configuration: Switch between local Ollama and OpenAI for LLM parsing
const USE_LOCAL_OLLAMA = false ;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = "deepseek-r1:1.5b"; // Local Ollama model for parsing
const OPENAI_MODEL = "gpt-3.5-turbo";

/**
 * Sanitize date values - convert "Present", "Current", empty strings, and invalid dates to undefined
 * Only returns valid ISO date strings (YYYY-MM-DD) or undefined
 */
function sanitizeDate(value: any): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  
  const normalized = value.trim().toLowerCase();
  if (normalized === 'present' || normalized === 'current' || normalized === '') return undefined;
  
  // Try to parse the date - if invalid, return undefined
  const parsedDate = new Date(value);
  if (isNaN(parsedDate.getTime())) {
    console.warn(`Invalid date format: "${value}" - converting to undefined`);
    return undefined;
  }
  
  // Return ISO format (YYYY-MM-DD)
  return parsedDate.toISOString().split('T')[0];
}

/**
 * Sanitize enum values - remove if not in allowed list
 */
function sanitizeEnum<T>(value: any, allowedValues: readonly T[]): T | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === '') return undefined;
  return allowedValues.includes(value as T) ? (value as T) : undefined;
}

/**
 * Remove undefined/null fields from object
 */
function removeEmptyFields(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => removeEmptyFields(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = removeEmptyFields(value);
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Sanitize extracted resume data to prevent validation errors
 */
function sanitizeResumeData(data: any): any {
  // Sanitize work experience
  if (Array.isArray(data.workExperience)) {
    data.workExperience = data.workExperience.map((exp: any) => {
      const sanitized: any = { ...exp };
      sanitized.startDate = sanitizeDate(exp.startDate);
      sanitized.endDate = sanitizeDate(exp.endDate);
      sanitized.employmentType = sanitizeEnum(exp.employmentType, ['full-time', 'part-time', 'internship', 'contract', 'freelance']);
      return removeEmptyFields(sanitized);
    });
  }

  // Sanitize education
  if (Array.isArray(data.education)) {
    data.education = data.education.map((edu: any) => {
      const sanitized: any = { ...edu };
      sanitized.startDate = sanitizeDate(edu.startDate);
      sanitized.endDate = sanitizeDate(edu.endDate);
      return removeEmptyFields(sanitized);
    });
  }

  // Sanitize projects
  if (Array.isArray(data.projects)) {
    data.projects = data.projects.map((proj: any) => {
      const sanitized: any = { ...proj };
      sanitized.startDate = sanitizeDate(proj.startDate);
      sanitized.endDate = sanitizeDate(proj.endDate);
      return removeEmptyFields(sanitized);
    });
  }

  // Sanitize certifications
  if (Array.isArray(data.certifications)) {
    data.certifications = data.certifications.map((cert: any) => {
      const sanitized: any = { ...cert };
      sanitized.issueDate = sanitizeDate(cert.issueDate);
      sanitized.expirationDate = sanitizeDate(cert.expirationDate);
      return removeEmptyFields(sanitized);
    });
  }

  // Sanitize volunteer experience
  if (Array.isArray(data.volunteerExperience)) {
    data.volunteerExperience = data.volunteerExperience.map((vol: any) => {
      const sanitized: any = { ...vol };
      sanitized.startDate = sanitizeDate(vol.startDate);
      sanitized.endDate = sanitizeDate(vol.endDate);
      return removeEmptyFields(sanitized);
    });
  }

  // Sanitize top-level enum fields - remove if invalid
  const remotePreference = sanitizeEnum(data.remotePreference, ['remote_only', 'hybrid', 'onsite', 'flexible']);
  if (remotePreference) {
    data.remotePreference = remotePreference;
  } else {
    delete data.remotePreference;
  }

  // Sanitize languages
  if (Array.isArray(data.languages)) {
    data.languages = data.languages.map((lang: any) => {
      const sanitized: any = { ...lang };
      sanitized.proficiency = sanitizeEnum(lang.proficiency, ['native', 'fluent', 'professional', 'intermediate', 'basic']);
      return removeEmptyFields(sanitized);
    });
  }

  // Sanitize work authorization
  if (Array.isArray(data.workAuthorization)) {
    data.workAuthorization = data.workAuthorization.map((auth: any) => {
      const sanitized: any = { ...auth };
      sanitized.status = sanitizeEnum(auth.status, ['citizen', 'permanent_resident', 'work_visa', 'student_visa', 'requires_sponsorship']);
      return removeEmptyFields(sanitized);
    });
  }

  return data;
}

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
 * Verify extracted data exists in original text (prevents hallucination)
 */
function verifyDataInText(value: any, originalText: string): boolean {
  if (!value || typeof value !== 'string') return true;
  if (value.length < 3) return true; // Skip very short values
  
  const normalizedText = originalText.toLowerCase();
  const normalizedValue = value.toLowerCase();
  
  // Check if value appears in text
  return normalizedText.includes(normalizedValue);
}

/**
 * Clean extracted data by removing hallucinated fields
 */
function cleanHallucinatedData(data: any, originalText: string): any {
  if (Array.isArray(data)) {
    return data.map(item => cleanHallucinatedData(item, originalText)).filter(Boolean);
  }
  
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length >= 3) {
        // Verify string values exist in original text
        if (verifyDataInText(value, originalText)) {
          cleaned[key] = value;
        }
      } else if (typeof value === 'object') {
        cleaned[key] = cleanHallucinatedData(value, originalText);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  
  return data;
}

/**
 * Extract structured resume data using local Ollama
 */
async function extractWithOllama(
  rawText: string,
  userFeedback?: string[]
): Promise<Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>> {
  console.log(`Starting resume extraction with local Ollama (${OLLAMA_MODEL})...`);
  
  // Build user feedback instructions
  const feedbackInstructions = userFeedback && userFeedback.length > 0
    ? `\n\nUSER PREFERENCES:\n${userFeedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n`
    : '';
  
  const prompt = `You are a resume parser. Extract information from the resume text and output ONLY valid JSON.

CRITICAL RULES:
1. Output ONLY the JSON object, no explanations or markdown
2. ONLY extract information that is EXPLICITLY written in the resume
3. DO NOT infer, guess, or fill in missing information
4. If a field is not present, leave it empty or omit it
5. Email must be valid format (e.g., user@domain.com)
6. Dates MUST be in ISO format YYYY-MM-DD (e.g., "2025-07-01") or leave empty
7. For current positions, use empty string for endDate, NOT "Present"
8. Arrays cannot be empty - include at least [] for empty arrays${feedbackInstructions}

IMPORTANT DATE FORMATTING:
- Use YYYY-MM-DD format ONLY: "2025-07-01", "2024-05-15"
- If only month/year is known, use first day: "July 2025" → "2025-07-01"
- If date is unclear or not found, use empty string ""
- For current/ongoing, leave endDate as empty string ""

Extract the following structure:
{
  "personalInfo": { "fullName": string, "email": string, "phone": string, "linkedIn": string, "github": string, "portfolio": string },
  "summary": string,
  "education": [{ "institution": string, "degree": string, "major": string, "gpa": number, "startDate": string, "endDate": string }],
  "workExperience": [{ "company": string, "position": string, "startDate": string, "endDate": string, "responsibilities": [string], "achievements": [string], "technologies": [string] }],
  "skills": [{ "category": string, "skills": [string] }],
  "projects": [{ "name": string, "description": string, "technologies": [string], "url": string, "github": string }],
  "certifications": [{ "name": string, "issuer": string, "issueDate": string }]
}

Resume Text:
${rawText}

Output valid JSON only:`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    let aiResponse = data.response;
    
    console.log("=== RAW OLLAMA RESPONSE ===");
    console.log(aiResponse);
    console.log("=== END RAW RESPONSE ===");
    
    // Clean up response
    aiResponse = aiResponse
      .replace(/<think>.*?<\/think>/gs, '')
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();
    
    // Extract JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResponse = jsonMatch[0];
    }
    
    console.log("=== CLEANED RESPONSE ===");
    console.log(aiResponse);
    console.log("=== END CLEANED RESPONSE ===");
    
    let jsonData = JSON.parse(aiResponse);
    
    // Fix common issues
    if (!jsonData.personalInfo) {
      jsonData.personalInfo = { fullName: "Unknown", email: "unknown@example.com" };
    }
    if (!jsonData.personalInfo.fullName) {
      jsonData.personalInfo.fullName = "Unknown";
    }
    if (!jsonData.personalInfo.email) {
      jsonData.personalInfo.email = "unknown@example.com";
    }
    
    // Fix email format
    if (jsonData.personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(jsonData.personalInfo.email)) {
      const emailMatch = rawText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      jsonData.personalInfo.email = emailMatch ? emailMatch[0] : "unknown@example.com";
    }
    
    // Ensure arrays exist
    if (!Array.isArray(jsonData.education)) jsonData.education = [];
    if (!Array.isArray(jsonData.workExperience)) jsonData.workExperience = [];
    if (!Array.isArray(jsonData.skills)) jsonData.skills = [];
    
    console.log("✅ Ollama extraction successful");
    
    // Sanitize data to prevent validation errors
    jsonData = sanitizeResumeData(jsonData);
    
    return {
      ...jsonData,
      rawText,
      parsedDate: new Date(),
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("❌ Ollama extraction failed:", error);
    throw new Error(`Failed to extract resume with Ollama: ${(error as Error).message}`);
  }
}

/**
 * Extract structured resume data using OpenAI
 */
async function extractWithOpenAI(
  rawText: string,
  userFeedback?: string[]
): Promise<Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>> {
  console.log(`Starting resume extraction with OpenAI (${OPENAI_MODEL})...`);
  
  // Initialize OpenAI with API key from environment
  const model = new ChatOpenAI({
    modelName: OPENAI_MODEL,
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Create structured output parser
  const parser = StructuredOutputParser.fromZodSchema(resumeSchema);

  console.log("Formatting prompt...");
  
  // Build user feedback instructions
  const feedbackInstructions = userFeedback && userFeedback.length > 0
    ? `\n\nUSER PREFERENCES:\n${userFeedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n`
    : '';
  
  // Create prompt template with stricter instructions
  const promptTemplate = PromptTemplate.fromTemplate(
    `You are a resume parser. Extract information from the resume text and output ONLY valid JSON.

CRITICAL RULES:
1. Output ONLY the JSON object, no explanations or markdown
2. ONLY extract information that is EXPLICITLY written in the resume
3. DO NOT infer, guess, or fill in missing information
4. If a field is not present, leave it empty or omit it
5. Email must be valid format (e.g., user@domain.com)
6. Dates MUST be in ISO format YYYY-MM-DD (e.g., "2025-07-01") or leave empty
7. For current positions, use empty string for endDate, NOT "Present"
8. Arrays cannot be empty - include at least [] for empty arrays${feedbackInstructions}

IMPORTANT DATE FORMATTING:
- Use YYYY-MM-DD format ONLY: "2025-07-01", "2024-05-15"
- If only month/year is known, use first day: "July 2025" → "2025-07-01"
- If date is unclear or not found, use empty string ""
- For current/ongoing, leave endDate as empty string ""

{format_instructions}

Resume Text:
{resume_text}

Output valid JSON only:`
  );

  // Format the prompt
  const formattedPrompt = await promptTemplate.format({
    resume_text: rawText,
    format_instructions: parser.getFormatInstructions(),
  });

  console.log("Invoking OpenAI API...");
  
  // Invoke the model
  const result = await model.invoke(formattedPrompt);
  let response = result.content.toString();
  
  console.log("=== RAW AI RESPONSE ===");
  console.log(response);
  console.log("=== END RAW RESPONSE ===");
  
  console.log("Cleaning response...");
  
  // Clean up response - remove thinking tags, code blocks, and fix formatting
  response = response
    .replace(/<think>.*?<\/think>/gs, '') // Remove <think> tags
    .replace(/```json\s*/g, '') // Remove ```json
    .replace(/```\s*/g, '') // Remove ```
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
  
  // Extract JSON from response if wrapped in other text
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    response = jsonMatch[0];
  }
  
  console.log("=== CLEANED RESPONSE ===");
  console.log(response);
  console.log("=== END CLEANED RESPONSE ===");
  
  console.log("Parsing response...");
  
  try {
    // First try to parse as JSON to validate and fix
    let jsonData = JSON.parse(response);
    
    console.log("=== PARSED JSON DATA ===");
    console.log(JSON.stringify(jsonData, null, 2));
    console.log("=== END PARSED JSON ===");
    
    // Fix common issues
    // Ensure required fields exist with defaults
    if (!jsonData.personalInfo) {
      jsonData.personalInfo = { fullName: "Unknown", email: "unknown@example.com" };
    }
    if (!jsonData.personalInfo.fullName) {
      jsonData.personalInfo.fullName = "Unknown";
    }
    if (!jsonData.personalInfo.email) {
      jsonData.personalInfo.email = "unknown@example.com";
    }
    
    // Fix email if it contains phone number or invalid format
    if (jsonData.personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(jsonData.personalInfo.email)) {
      // Extract email from text if exists
      const emailMatch = rawText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      jsonData.personalInfo.email = emailMatch ? emailMatch[0] : "unknown@example.com";
    }
    
    // Ensure arrays exist
    if (!Array.isArray(jsonData.education)) {
      jsonData.education = [];
    }
    if (!Array.isArray(jsonData.workExperience)) {
      jsonData.workExperience = [];
    }
    if (!Array.isArray(jsonData.skills)) {
      jsonData.skills = [];
    }
    
    console.log("✅ JSON parsing successful - using extracted data directly");
    
    // Sanitize data to prevent validation errors
    jsonData = sanitizeResumeData(jsonData);
    
    console.log("Resume extraction completed successfully");

    // Add metadata
    return {
      ...jsonData,
      rawText,
      parsedDate: new Date(),
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("❌ OpenAI parsing failed:", error);
    throw new Error(`Failed to extract resume with OpenAI: ${(error as Error).message}`);
  }
}

/**
 * Extract structured resume data - automatically switches between Ollama and OpenAI
 * @param rawText - The raw text extracted from the PDF
 * @param userFeedback - Optional user feedback to improve parsing
 * @returns Structured resume data conforming to IResume interface
 */
export async function extractResumeFields(
  rawText: string,
  userFeedback?: string[]
): Promise<Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>> {
  if (USE_LOCAL_OLLAMA) {
    console.log(`Using local Ollama (${OLLAMA_MODEL}) for resume parsing`);
    return extractWithOllama(rawText, userFeedback);
  } else {
    console.log(`Using OpenAI (${OPENAI_MODEL}) for resume parsing`);
    return extractWithOpenAI(rawText, userFeedback);
  }
}

/**
 * Complete pipeline: Parse PDF and extract structured resume data
 * @param file - PDF file buffer or path
 * @param fileName - Original filename
 * @param fileSize - File size in bytes
 * @param userFeedback - Optional user feedback to improve parsing
 * @returns Structured resume data ready to save to database
 */
export async function parseAndExtractResume(
  file: Buffer | string,
  fileName: string,
  fileSize: number,
  userFeedback?: string[]
): Promise<{
  rawData: ParsedResume;
  structuredData: Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>;
}> {
  console.log("📄 Parsing PDF...");
  // Step 1: Parse the PDF
  const rawData = await parseResumePDF(file, fileName, fileSize);
  console.log(`✅ PDF parsed: ${rawData.pageCount} pages, ${rawData.rawText.length} characters`);

  console.log("🤖 Extracting structured data with OpenAI...");
  // Step 2: Extract structured fields using LangChain with OpenAI
  const structuredData = await extractResumeFields(rawData.rawText, userFeedback);

  // Add file metadata
  structuredData.fileUrl = fileName;

  return {
    rawData,
    structuredData,
  };
}
