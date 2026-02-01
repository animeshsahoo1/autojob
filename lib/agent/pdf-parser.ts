// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse");
import { PDFDocument } from "pdf-lib";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { IResume } from "@/models/resume.model";
import { readFileSync } from "fs";

// Configuration: Switch between local Ollama and OpenAI for LLM parsing
const USE_LOCAL_OLLAMA = false ;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = "deepseek-r1:1.5b"; // Local Ollama model for parsing
const OPENAI_MODEL = "gpt-3.5-turbo";

/**
 * Month name to number mapping
 */
const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
  // Seasons
  spring: 2, summer: 5, fall: 8, autumn: 8, winter: 11,
};

/**
 * Sanitize date values - convert "Present", "Current", empty strings, and invalid dates to undefined
 * Handles common resume formats: "Jan 2024", "Spring 2023", "Q1 2024", "Expected May 2026"
 * Only returns valid ISO date strings (YYYY-MM-DD) or undefined
 */
function sanitizeDate(value: any): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  
  const normalized = value.trim().toLowerCase();
  if (normalized === 'present' || normalized === 'current' || normalized === '' || normalized === 'ongoing') return undefined;
  
  // Remove common prefixes
  const cleaned = normalized
    .replace(/^(expected|anticipated|est\.?|approx\.?)\s*/i, '')
    .trim();
  
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) return cleaned;
  }
  
  // Try "Month Year" format (Jan 2024, January 2024)
  const monthYearMatch = cleaned.match(/^([a-z]+)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const month = MONTH_MAP[monthYearMatch[1].toLowerCase()];
    const year = parseInt(monthYearMatch[2], 10);
    if (month !== undefined && year >= 1900 && year <= 2100) {
      return `${year}-${String(month + 1).padStart(2, '0')}-01`;
    }
  }
  
  // Try "Year Month" format (2024 Jan)
  const yearMonthMatch = cleaned.match(/^(\d{4})\s+([a-z]+)$/i);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1], 10);
    const month = MONTH_MAP[yearMonthMatch[2].toLowerCase()];
    if (month !== undefined && year >= 1900 && year <= 2100) {
      return `${year}-${String(month + 1).padStart(2, '0')}-01`;
    }
  }
  
  // Try year only (2024)
  const yearOnlyMatch = cleaned.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[1], 10);
    if (year >= 1900 && year <= 2100) {
      return `${year}-01-01`;
    }
  }
  
  // Try Q1/Q2/Q3/Q4 format
  const quarterMatch = cleaned.match(/^q([1-4])\s+(\d{4})$/i);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1], 10);
    const year = parseInt(quarterMatch[2], 10);
    const month = (quarter - 1) * 3 + 1;
    if (year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`;
    }
  }
  
  // Fallback: try native Date parsing
  const parsedDate = new Date(value);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split('T')[0];
  }
  
  return undefined;
}

/**
 * Sanitize enum values - remove if not in allowed list (case-insensitive)
 */
function sanitizeEnum<T extends string>(value: any, allowedValues: readonly T[]): T | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === '') return undefined;
  
  // Find matching value (case-insensitive)
  const match = allowedValues.find(v => v.toLowerCase() === normalized);
  return match;
}

/**
 * Extract hyperlinks from PDF using pdf-lib
 */
async function extractHyperlinks(buffer: Buffer): Promise<string[]> {
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const links: string[] = [];

    console.log("🔍 Extracting hyperlinks from PDF...");
    console.log(`📄 Document has ${pdfDoc.getPageCount()} pages`);

    const pages = pdfDoc.getPages();
    const context = pdfDoc.context;
    const { PDFName, PDFDict, PDFArray } = await import("pdf-lib");
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const annotsRef = page.node.get(PDFName.of("Annots"));
      
      if (!annotsRef) continue;
      
      const annots = context.lookup(annotsRef);
      if (!(annots instanceof PDFArray)) continue;
      
      const annotCount = annots.size();
      console.log(`📃 Page ${i + 1}: Found ${annotCount} annotations`);
      
      for (let j = 0; j < annotCount; j++) {
        const annotRef = annots.get(j);
        const annot = context.lookup(annotRef);
        
        if (!(annot instanceof PDFDict)) continue;
        
        // Get the A (Action) dictionary
        const aRef = annot.get(PDFName.of("A"));
        if (!aRef) continue;
        
        const aDict = context.lookup(aRef);
        if (!(aDict instanceof PDFDict)) continue;
        
        // Get URI from the action
        const uri = aDict.get(PDFName.of("URI"));
        if (uri) {
          const uriStr = uri.toString().replace(/^\(|\)$/g, "");
          if (uriStr.startsWith("http") || uriStr.startsWith("mailto")) {
            console.log(`   ✓ Found URL: ${uriStr}`);
            links.push(uriStr);
          }
        }
      }
    }

    console.log(`🔗 Total hyperlinks extracted: ${links.length}`);
    return [...new Set(links)];
  } catch (error) {
    console.error("Failed to extract hyperlinks:", error);
    return [];
  }
}

/**
 * Categorize extracted hyperlinks
 */
function categorizeLinks(links: string[]): {
  github: string[];
  linkedin: string | null;
  portfolio: string[];
  other: string[];
} {
  const github: string[] = [];
  const portfolio: string[] = [];
  const other: string[] = [];
  let linkedin: string | null = null;

  for (const url of links) {
    if (url.includes("github.com")) {
      github.push(url);
    } else if (url.includes("linkedin.com")) {
      linkedin = url;
    } else if (
      url.includes("vercel.app") ||
      url.includes("netlify.app") ||
      url.includes("herokuapp.com") ||
      url.includes(".io") ||
      url.includes("pages.dev")
    ) {
      portfolio.push(url);
    } else if (!url.includes("google.com") && !url.includes("fonts.")) {
      other.push(url);
    }
  }

  return { github, linkedin, portfolio, other };
}

/**
 * Generate summary from extracted resume data
 */
function generateSummary(data: any): string {
  const parts: string[] = [];
  
  // Current role or education
  if (data.workExperience?.length > 0) {
    const exp = data.workExperience[0];
    parts.push(`${exp.position} at ${exp.company}`);
  } else if (data.education?.length > 0) {
    const edu = data.education[0];
    parts.push(`${edu.degree} student at ${edu.institution}`);
  }
  
  // Domain expertise from work
  if (data.workExperience?.length > 0) {
    const techs = data.workExperience
      .flatMap((w: any) => w.technologies || [])
      .slice(0, 4);
    if (techs.length > 0) {
      parts.push(`with expertise in ${techs.join(", ")}`);
    }
  }
  
  // Skills
  if (data.skills?.length > 0) {
    const allSkills = data.skills
      .flatMap((s: any) => s.skills || [])
      .slice(0, 5);
    if (allSkills.length > 0) {
      parts.push(`Proficient in ${allSkills.join(", ")}`);
    }
  }
  
  // Projects count
  if (data.projects?.length > 0) {
    parts.push(`Built ${data.projects.length} technical projects`);
  }
  
  return parts.join(". ").replace(/\.\./g, ".") + ".";
}

/**
 * Enhance extracted data with hyperlinks from PDF
 */
function enhanceWithHyperlinks(
  jsonData: any,
  links: { github: string[]; linkedin: string | null; portfolio: string[]; other: string[] }
): any {
  console.log("🔗 === EXTRACTED HYPERLINKS ===");
  console.log("GitHub:", links.github);
  console.log("LinkedIn:", links.linkedin);
  console.log("Portfolio:", links.portfolio);
  console.log("Other:", links.other);
  console.log("=== END HYPERLINKS ===\n");

  // Generate summary if empty
  if (!jsonData.summary || jsonData.summary.trim() === "") {
    console.log("⚠️  Summary empty - generating from data...");
    jsonData.summary = generateSummary(jsonData);
    console.log("✅ Generated summary:", jsonData.summary);
  }

  // Enhance personalInfo with missing links
  if (!jsonData.personalInfo.github && links.github.length > 0) {
    const profileUrl = links.github.find((u) => {
      const path = u.replace(/https?:\/\/github\.com\//, "");
      return !path.includes("/") || path.split("/").filter(Boolean).length === 1;
    });
    if (profileUrl) {
      jsonData.personalInfo.github = profileUrl;
    }
  }

  if (!jsonData.personalInfo.linkedIn && links.linkedin) {
    jsonData.personalInfo.linkedIn = links.linkedin;
  }

  if (!jsonData.personalInfo.portfolio && links.portfolio.length > 0) {
    jsonData.personalInfo.portfolio = links.portfolio[0];
  }

  // Enhance projects with GitHub repos
  if (Array.isArray(jsonData.projects)) {
    const repoUrls = links.github.filter((u) => {
      const path = u.replace(/https?:\/\/github\.com\//, "");
      return path.split("/").filter(Boolean).length >= 2;
    });

    // Invalid URL patterns (text instead of actual URLs)
    const invalidUrlPatterns = [
      "project link", "live link", "demo link", "github link",
      "link", "demo", "live", "view", "click here", "source"
    ];

    jsonData.projects = jsonData.projects.map((project: any, index: number) => {
      // Clean invalid URL text
      if (project.url) {
        const urlLower = project.url.toLowerCase().trim();
        if (invalidUrlPatterns.some(p => urlLower === p) || !project.url.includes(".")) {
          delete project.url;
        }
      }
      if (project.github) {
        const githubLower = project.github.toLowerCase().trim();
        if (invalidUrlPatterns.some(p => githubLower === p) || !project.github.includes(".")) {
          delete project.github;
        }
      }

      // Assign extracted hyperlinks
      if (!project.github && repoUrls[index]) {
        project.github = repoUrls[index];
      }
      if (!project.url && links.portfolio[index]) {
        project.url = links.portfolio[index];
      }
      return project;
    });
  }

  return jsonData;
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
  hyperlinks: {
    github: string[];
    linkedin: string | null;
    portfolio: string[];
    other: string[];
  };
  metadata: {
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
  };
}

/**
 * Parse a PDF resume using pdf-parse and extract hyperlinks using pdfjs-dist
 */
export async function parseResumePDF(
  file: Buffer | string,
  fileName: string,
  fileSize: number
): Promise<ParsedResume> {
  try {
    let buffer: Buffer;

    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else {
      buffer = readFileSync(file);
    }

    // Parse text using pdf-parse
    const data = await pdf(buffer);

    // Extract hyperlinks using pdfjs-dist
    const links = await extractHyperlinks(buffer);
    const categorizedLinks = categorizeLinks(links);

    console.log("\n📄 === PARSED PDF TEXT ===");
    console.log(data.text.substring(0, 2000) + (data.text.length > 2000 ? "\n... [truncated]" : ""));
    console.log("=== END PDF TEXT ===");
    console.log(`📊 Total characters: ${data.text.length}, Pages: ${data.numpages}`);
    console.log(`🔗 Hyperlinks found: ${links.length}\n`);

    return {
      rawText: data.text.trim(),
      pageCount: data.numpages,
      hyperlinks: categorizedLinks,
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
 * Build the extraction prompt for resume parsing
 * Shared between Ollama and OpenAI to avoid duplication
 * @param userFeedback - Optional user feedback
 * @param escapeBraces - If true, escapes curly braces for LangChain PromptTemplate
 */
function buildExtractionPrompt(userFeedback?: string[], escapeBraces = false): string {
  const feedbackInstructions = userFeedback && userFeedback.length > 0
    ? `\nUSER PREFERENCES:\n${userFeedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n`
    : '';

  // Use placeholders that will be replaced based on escapeBraces flag
  const lb = escapeBraces ? '{{' : '{';
  const rb = escapeBraces ? '}}' : '}';

  return `You are a resume parser. Extract information from the resume and output ONLY valid JSON.

## EXTRACTION RULES
1. Extract ONLY information explicitly written in the resume
2. If a field is not present, omit it or use empty string
3. Email must be valid format (user@domain.com)
4. Use empty arrays [] for missing array fields

## DATE FORMAT
- Use YYYY-MM-DD format: "2025-07-01"
- Convert "July 2025" → "2025-07-01" (use first day of month)
- For current/ongoing positions, use empty string "" for endDate
- If date unclear, use empty string ""

## TEXT SPACING
PDFs often have concatenated text. Fix spacing issues:
- "AyushKumar" → "Ayush Kumar"
- "SoftwareEngineerIntern" → "Software Engineer Intern"
- "IndianInstituteofTechnology" → "Indian Institute of Technology"

## SUMMARY (REQUIRED - YOU MUST GENERATE THIS)
You MUST generate a "summary" field with 2-3 sentences. NEVER leave it empty.
- Combine: current role/education + years of experience + top 3-5 skills + key achievement
- Format: "[Role/Student] with experience in [domain]. Skilled in [technologies]. [Key achievement]."
- Example: "Backend Engineering Intern with serverless and cloud experience. Proficient in AWS, Go, Kubernetes, and distributed systems. Built scalable systems handling 250+ campaigns daily."

## PROJECTS (IMPORTANT)
For each project, extract ALL available information:
- "name": Project name
- "description": What the project does (1-2 sentences summarizing functionality)
- "technologies": Array of technologies/frameworks used
- "url": Live/deployed project URL (look for "Live:", "Demo:", "Website:", or any http/https links)
- "github": GitHub repository URL (look for "GitHub:", "Source:", "Code:", or github.com links)
- "highlights": Key achievements or features
${feedbackInstructions}
## OUTPUT STRUCTURE
${lb}
  "personalInfo": ${lb} "fullName": string, "email": string, "phone"?: string, "linkedIn"?: string, "github"?: string, "portfolio"?: string ${rb},
  "summary": string (REQUIRED),
  "education": [${lb} "institution": string, "degree": string, "major"?: string, "gpa"?: number, "startDate"?: string, "endDate"?: string ${rb}],
  "workExperience": [${lb} "company": string, "position": string, "description"?: string, "startDate"?: string, "endDate"?: string, "responsibilities"?: [string], "achievements"?: [string], "technologies"?: [string] ${rb}],
  "skills": [${lb} "category": string, "skills": [string] ${rb}],
  "projects"?: [${lb} "name": string, "description"?: string, "technologies"?: [string], "url"?: string, "github"?: string, "highlights"?: [string] ${rb}],
  "certifications"?: [${lb} "name": string, "issuer": string, "issueDate"?: string ${rb}]
${rb}`;
}

/**
 * Extract structured resume data using local Ollama
 */
async function extractWithOllama(
  rawText: string,
  hyperlinks: ParsedResume["hyperlinks"],
  userFeedback?: string[]
): Promise<Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>> {
  console.log(`Starting resume extraction with local Ollama (${OLLAMA_MODEL})...`);
  
  const prompt = `${buildExtractionPrompt(userFeedback)}

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
    
    // Clean up response
    aiResponse = aiResponse
      .replace(/<think>.*?<\/think>/g, '')
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();
    
    // Extract JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResponse = jsonMatch[0];
    }

    console.log("\n🤖 === LLM RAW OUTPUT ===");
    console.log(aiResponse.substring(0, 3000) + (aiResponse.length > 3000 ? "\n... [truncated]" : ""));
    console.log("=== END LLM OUTPUT ===\n");
    
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
    
    // Enhance with hyperlinks from PDF
    jsonData = enhanceWithHyperlinks(jsonData, hyperlinks);
    
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
  hyperlinks: ParsedResume["hyperlinks"],
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
  
  // Create prompt template using shared prompt builder (escapeBraces=true for LangChain)
  const promptTemplate = PromptTemplate.fromTemplate(
    `${buildExtractionPrompt(userFeedback, true)}

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
  
  // Clean up response - remove thinking tags, code blocks, and fix formatting
  response = response
    .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove <think> tags
    .replace(/```json\s*/g, '') // Remove ```json
    .replace(/```\s*/g, '') // Remove ```
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
  
  // Extract JSON from response if wrapped in other text
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    response = jsonMatch[0];
  }

  console.log("\n🤖 === LLM RAW OUTPUT ===");
  console.log(response.substring(0, 3000) + (response.length > 3000 ? "\n... [truncated]" : ""));
  console.log("=== END LLM OUTPUT ===\n");
  
  try {
    // Parse as JSON and fix common issues
    let jsonData = JSON.parse(response);
    
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
    
    // Fix email if invalid format
    if (jsonData.personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(jsonData.personalInfo.email)) {
      const emailMatch = rawText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
      jsonData.personalInfo.email = emailMatch ? emailMatch[0] : "unknown@example.com";
    }
    
    // Ensure arrays exist
    if (!Array.isArray(jsonData.education)) jsonData.education = [];
    if (!Array.isArray(jsonData.workExperience)) jsonData.workExperience = [];
    if (!Array.isArray(jsonData.skills)) jsonData.skills = [];
    
    // Enhance with hyperlinks from PDF
    jsonData = enhanceWithHyperlinks(jsonData, hyperlinks);
    
    // Sanitize data to prevent validation errors
    jsonData = sanitizeResumeData(jsonData);
    
    console.log("✅ Resume extraction completed successfully");

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
 */
export async function extractResumeFields(
  rawText: string,
  hyperlinks: ParsedResume["hyperlinks"],
  userFeedback?: string[]
): Promise<Partial<Omit<IResume, "_id" | "userId" | "createdAt" | "updatedAt">>> {
  if (USE_LOCAL_OLLAMA) {
    console.log(`Using local Ollama (${OLLAMA_MODEL}) for resume parsing`);
    return extractWithOllama(rawText, hyperlinks, userFeedback);
  } else {
    console.log(`Using OpenAI (${OPENAI_MODEL}) for resume parsing`);
    return extractWithOpenAI(rawText, hyperlinks, userFeedback);
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

  console.log("🤖 Extracting structured data...");
  // Step 2: Extract structured fields using LLM
  const structuredData = await extractResumeFields(rawData.rawText, rawData.hyperlinks, userFeedback);

  // Add file metadata
  structuredData.fileUrl = fileName;

  // Log final parsed output
  console.log("\n📊 === FINAL PARSED OUTPUT ===");
  console.log("Personal Info:", JSON.stringify(structuredData.personalInfo, null, 2));
  console.log("Summary:", structuredData.summary?.substring(0, 200) + "...");
  console.log("Education:", structuredData.education?.length || 0, "entries");
  console.log("Work Experience:", structuredData.workExperience?.length || 0, "entries");
  console.log("Projects:", structuredData.projects?.length || 0, "entries");
  if (structuredData.projects && structuredData.projects.length > 0) {
    console.log("Project Details:");
    structuredData.projects.forEach((p: any, i: number) => {
      console.log(`  ${i + 1}. ${p.name}`);
      console.log(`     Description: ${p.description?.substring(0, 100) || 'N/A'}...`);
      console.log(`     GitHub: ${p.github || 'N/A'}`);
      console.log(`     URL: ${p.url || 'N/A'}`);
    });
  }
  console.log("Skills:", structuredData.skills?.length || 0, "categories");
  console.log("=== END PARSED OUTPUT ===\n");

  return {
    rawData,
    structuredData,
  };
}
