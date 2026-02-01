import OpenAI from "openai";
import type { IResume } from "@/models/resume.model";
import { QdrantClient } from "@qdrant/qdrant-js";

// Configuration: Switch between local Ollama and OpenAI
const USE_LOCAL_OLLAMA = false;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = "deepseek-r1:1.5b"; // Local Ollama model for embeddings
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

// Qdrant collection name for resume embeddings
const COLLECTION_NAME = "resume_embeddings";
const VECTOR_SIZE = 512; // Using 512 dimensions for cost-effective testing

/**
 * Initialize Qdrant client
 */
function getQdrantClient(): QdrantClient {
  if (!process.env.VECTOR_DB_ENDPOINT || !process.env.VECTOR_DB_API) {
    throw new Error("Qdrant credentials not found in environment variables");
  }

  return new QdrantClient({
    url: process.env.VECTOR_DB_ENDPOINT,
    apiKey: process.env.VECTOR_DB_API,
    timeout: 30000, // 30 second timeout for cloud connections
    checkCompatibility: false, // Skip version check to avoid extra request
  });
}

/**
 * Ensure collection exists with proper configuration
 */
async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);
    
    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`Created Qdrant collection: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error("Error ensuring collection:", error);
    throw error;
  }
}

/**
 * Clean and prepare resume data for embedding
 */
function cleanResumeData(resumeData: Partial<IResume>): string[] {
  const chunks: Array<{ text: string; section: string; index: number }> = [];
  let chunkIndex = 0;

  // Personal Information
  if (resumeData.personalInfo) {
    const personal = resumeData.personalInfo;
    const personalText = `
Name: ${personal.fullName}
Email: ${personal.email}
${personal.phone ? `Phone: ${personal.phone}` : ""}
${personal.linkedIn ? `LinkedIn: ${personal.linkedIn}` : ""}
${personal.github ? `GitHub: ${personal.github}` : ""}
${personal.portfolio ? `Portfolio: ${personal.portfolio}` : ""}
    `.trim();
    chunks.push({
      text: personalText,
      section: "personal",
      index: chunkIndex++,
    });
  }

  // Summary
  if (resumeData.summary) {
    chunks.push({
      text: `Professional Summary: ${resumeData.summary}`,
      section: "summary",
      index: chunkIndex++,
    });
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    resumeData.education.forEach((edu, idx) => {
      const eduText = `
Education: ${edu.degree} in ${edu.major || "N/A"}
Institution: ${edu.institution}
${edu.gpa ? `GPA: ${edu.gpa}${edu.maxGpa ? `/${edu.maxGpa}` : ""}` : ""}
${edu.startDate ? `Period: ${edu.startDate} to ${edu.endDate || "Present"}` : ""}
${edu.achievements && edu.achievements.length > 0 ? `Achievements: ${edu.achievements.join(", ")}` : ""}
${edu.coursework && edu.coursework.length > 0 ? `Relevant Coursework: ${edu.coursework.join(", ")}` : ""}
      `.trim();
      chunks.push({
        text: eduText,
        section: "education",
        index: chunkIndex++,
      });
    });
  }

  // Work Experience
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    resumeData.workExperience.forEach((exp, idx) => {
      const expText = `
Position: ${exp.position} at ${exp.company}
${exp.location ? `Location: ${exp.location}` : ""}
${exp.employmentType ? `Type: ${exp.employmentType}` : ""}
${exp.startDate ? `Period: ${exp.startDate} to ${exp.endDate || "Present"}` : ""}
${exp.description ? `Description: ${exp.description}` : ""}
${exp.responsibilities && exp.responsibilities.length > 0 ? `Responsibilities: ${exp.responsibilities.join(". ")}` : ""}
${exp.achievements && exp.achievements.length > 0 ? `Achievements: ${exp.achievements.join(". ")}` : ""}
${exp.technologies && exp.technologies.length > 0 ? `Technologies: ${exp.technologies.join(", ")}` : ""}
      `.trim();
      chunks.push({
        text: expText,
        section: "experience",
        index: chunkIndex++,
      });
    });
  }

  // Skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    const skillsText = resumeData.skills
      .map((skillGroup) => `${skillGroup.category}: ${skillGroup.skills.join(", ")}`)
      .join("\n");
    chunks.push({
      text: `Skills:\n${skillsText}`,
      section: "skills",
      index: chunkIndex++,
    });
  }

  // Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    resumeData.projects.forEach((project, idx) => {
      const projectText = `
Project: ${project.name}
${project.role ? `Role: ${project.role}` : ""}
${project.description ? `Description: ${project.description}` : ""}
${project.technologies && project.technologies.length > 0 ? `Technologies: ${project.technologies.join(", ")}` : ""}
${project.achievements && project.achievements.length > 0 ? `Achievements: ${project.achievements.join(". ")}` : ""}
${project.url ? `URL: ${project.url}` : ""}
${project.github ? `GitHub: ${project.github}` : ""}
      `.trim();
      chunks.push({
        text: projectText,
        section: "projects",
        index: chunkIndex++,
      });
    });
  }

  // Certifications
  if (resumeData.certifications && resumeData.certifications.length > 0) {
    resumeData.certifications.forEach((cert, idx) => {
      const certText = `
Certification: ${cert.name}
Issuer: ${cert.issuer}
${cert.issueDate ? `Issued: ${cert.issueDate}` : ""}
${cert.expirationDate ? `Expires: ${cert.expirationDate}` : ""}
${cert.credentialId ? `Credential ID: ${cert.credentialId}` : ""}
      `.trim();
      chunks.push({
        text: certText,
        section: "certifications",
        index: chunkIndex++,
      });
    });
  }

  // Publications
  if (resumeData.publications && resumeData.publications.length > 0) {
    resumeData.publications.forEach((pub, idx) => {
      const pubText = `
Publication: ${pub.title}
${pub.authors && pub.authors.length > 0 ? `Authors: ${pub.authors.join(", ")}` : ""}
${pub.publisher ? `Publisher: ${pub.publisher}` : ""}
${pub.publicationDate ? `Published: ${pub.publicationDate}` : ""}
${pub.doi ? `DOI: ${pub.doi}` : ""}
      `.trim();
      chunks.push({
        text: pubText,
        section: "publications",
        index: chunkIndex++,
      });
    });
  }

  return chunks.map((chunk) => JSON.stringify(chunk));
}

/**
 * Generate embeddings using local Ollama
 */
async function generateOllamaEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.embedding || data.embedding.length === 0) {
      throw new Error("No embedding data returned from Ollama");
    }

    console.log(`Generated Ollama embedding with ${data.embedding.length} dimensions`);
    return data.embedding;
  } catch (error) {
    console.error("Ollama embedding generation error:", error);
    throw new Error(`Failed to generate Ollama embedding: ${(error as Error).message}`);
  }
}

/**
 * Generate embeddings using OpenAI API
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate embedding using OpenAI's text-embedding-3-small model
    // Using 512 dimensions for cheapest testing (5x cheaper than full 1536 dims)
    const response = await openai.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
      encoding_format: "float",
      dimensions: 512, // Reduced from 1536 for cost savings
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No embedding data returned from OpenAI");
    }

    const embedding = response.data[0].embedding;
    console.log(`Generated OpenAI embedding with ${embedding.length} dimensions`);
    
    return embedding;
  } catch (error) {
    console.error("OpenAI embedding generation error:", error);
    throw new Error(`Failed to generate OpenAI embedding: ${(error as Error).message}`);
  }
}

/**
 * Generate embeddings - automatically switches between Ollama and OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (USE_LOCAL_OLLAMA) {
    console.log(`Using local Ollama (${OLLAMA_MODEL}) for embeddings`);
    return generateOllamaEmbedding(text);
  } else {
    console.log(`Using OpenAI (${OPENAI_EMBEDDING_MODEL}) for embeddings`);
    return generateOpenAIEmbedding(text);
  }
}

/**
 * Store resume embeddings in vector database
 */
export async function storeResumeInVectorDB(
  userId: string,
  resumeId: string,
  resumeData: Partial<IResume>
): Promise<{
  success: boolean;
  chunksStored: number;
  error?: string;
}> {
  try {
    console.log(`Storing resume embeddings for user ${userId}, resume ${resumeId}`);

    const client = getQdrantClient();
    
    // Ensure collection exists
    await ensureCollection();

    // Clean and chunk the resume data
    const chunks = cleanResumeData(resumeData);
    console.log(`Created ${chunks.length} chunks from resume data`);

    if (chunks.length === 0) {
      return {
        success: false,
        chunksStored: 0,
        error: "No content to embed",
      };
    }

    // Delete existing embeddings for this resume (if updating)
    await client.delete(COLLECTION_NAME, {
      filter: {
        must: [
          { key: "userId", match: { value: userId } },
          { key: "resumeId", match: { value: resumeId } },
        ],
      },
    });
    console.log("Deleted existing embeddings");

    // Generate embeddings and store
    const points = [];
    
    for (const chunkJson of chunks) {
      const chunk = JSON.parse(chunkJson);
      
      // Generate embedding for this chunk
      const embedding = await generateEmbedding(chunk.text);
      
      // Create unique ID for this point
      const pointId = `${userId}_${resumeId}_${chunk.index}`;
      
      points.push({
        id: pointId,
        vector: embedding,
        payload: {
          userId: userId,
          resumeId: resumeId,
          chunkText: chunk.text,
          section: chunk.section,
          chunkIndex: chunk.index,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Bulk insert points into Qdrant
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: points,
    });
    console.log(`Stored ${points.length} embeddings in Qdrant vector database`);

    return {
      success: true,
      chunksStored: points.length,
    };
  } catch (error) {
    console.error("Vector store error:", error);
    return {
      success: false,
      chunksStored: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Search resume embeddings using Qdrant's vector search
 */
export async function searchResumeEmbeddings(
  userId: string,
  queryText: string,
  limit: number = 5,
  resumeId?: string
): Promise<Array<{ text: string; section: string; score: number; resumeId: string }>> {
  try {
    const client = getQdrantClient();
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText);

    // Build filter for user (and optionally specific resume)
    const filter: any = {
      must: [{ key: "userId", match: { value: userId } }],
    };
    
    if (resumeId) {
      filter.must.push({ key: "resumeId", match: { value: resumeId } });
    }

    // Perform vector search in Qdrant
    const searchResult = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      filter: filter,
      limit: limit,
      with_payload: true,
    });

    // Format results
    const results = searchResult.map((hit) => ({
      text: hit.payload?.chunkText as string,
      section: hit.payload?.section as string,
      score: hit.score,
      resumeId: hit.payload?.resumeId as string,
    }));

    console.log(`Found ${results.length} matching chunks for query`);
    return results;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Delete resume embeddings from Qdrant
 */
export async function deleteResumeEmbeddings(
  userId: string,
  resumeId: string
): Promise<{ success: boolean; deletedCount?: number }> {
  try {
    const client = getQdrantClient();

    // Delete points matching userId and resumeId
    const result = await client.delete(COLLECTION_NAME, {
      filter: {
        must: [
          { key: "userId", match: { value: userId } },
          { key: "resumeId", match: { value: resumeId } },
        ],
      },
    });

    console.log(`Deleted embeddings for user ${userId}, resume ${resumeId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete embeddings error:", error);
    return {
      success: false,
    };
  }
}

/**
 * Get all resumes stored in vector DB for a user
 */
export async function getUserResumesFromVectorDB(
  userId: string
): Promise<string[]> {
  try {
    const client = getQdrantClient();
    
    // Scroll through all points for this user
    const result = await client.scroll(COLLECTION_NAME, {
      filter: {
        must: [{ key: "userId", match: { value: userId } }],
      },
      limit: 1000,
      with_payload: ["resumeId"],
    });

    // Extract unique resume IDs
    const resumeIds = new Set<string>();
    result.points.forEach((point) => {
      if (point.payload?.resumeId) {
        resumeIds.add(point.payload.resumeId as string);
      }
    });

    return Array.from(resumeIds);
  } catch (error) {
    console.error("Error fetching user resumes from vector DB:", error);
    return [];
  }
}
