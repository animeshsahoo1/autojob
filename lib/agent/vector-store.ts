import OpenAI from "openai";
import type { IResume } from "@/models/resume.model";
import { connectToDatabase } from "@/database/db";
import mongoose from "mongoose";

/**
 * Vector embedding document schema for resume chunks
 */
interface IResumeEmbedding {
  userId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  chunkText: string;
  embedding: number[];
  metadata: {
    section: string; // 'personal', 'education', 'experience', 'skills', 'projects', etc.
    chunkIndex: number;
    timestamp: Date;
  };
}

const resumeEmbeddingSchema = new mongoose.Schema<IResumeEmbedding>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
    index: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Resume",
    index: true,
  },
  chunkText: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number],
    required: true,
    // Using 512 dimensions for cost-effective testing (instead of 1536)
  },
  metadata: {
    section: {
      type: String,
      required: true,
      index: true,
    },
    chunkIndex: Number,
    timestamp: Date,
  },
});

// Compound index for efficient queries
resumeEmbeddingSchema.index({ userId: 1, resumeId: 1 });
resumeEmbeddingSchema.index({ userId: 1, "metadata.section": 1 });

const ResumeEmbedding =
  mongoose.models.ResumeEmbedding ||
  mongoose.model<IResumeEmbedding>("ResumeEmbedding", resumeEmbeddingSchema);

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
 * Generate embeddings using OpenAI API
 */
async function generateEmbedding(text: string): Promise<number[]> {
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
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
      dimensions: 512, // Reduced from 1536 for cost savings
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No embedding data returned from OpenAI");
    }

    const embedding = response.data[0].embedding;
    console.log(`Generated embedding with ${embedding.length} dimensions`);
    
    return embedding;
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw new Error(`Failed to generate embedding: ${(error as Error).message}`);
  }
}

/**
 * Store resume embeddings in vector database
 */
export async function storeResumeInVectorDB(
  userId: string | mongoose.Types.ObjectId,
  resumeId: string | mongoose.Types.ObjectId,
  resumeData: Partial<IResume>
): Promise<{
  success: boolean;
  chunksStored: number;
  error?: string;
}> {
  try {
    console.log(`Storing resume embeddings for user ${userId}, resume ${resumeId}`);

    // Connect to database
    await connectToDatabase();

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
    await ResumeEmbedding.deleteMany({
      userId: new mongoose.Types.ObjectId(userId as string),
      resumeId: new mongoose.Types.ObjectId(resumeId as string),
    });
    console.log("Deleted existing embeddings");

    // Generate embeddings and store
    const embeddingDocs = [];
    
    for (const chunkJson of chunks) {
      const chunk = JSON.parse(chunkJson);
      
      // Generate embedding for this chunk
      const embedding = await generateEmbedding(chunk.text);
      
      embeddingDocs.push({
        userId: new mongoose.Types.ObjectId(userId as string),
        resumeId: new mongoose.Types.ObjectId(resumeId as string),
        chunkText: chunk.text,
        embedding: embedding,
        metadata: {
          section: chunk.section,
          chunkIndex: chunk.index,
          timestamp: new Date(),
        },
      });
    }

    // Bulk insert embeddings
    await ResumeEmbedding.insertMany(embeddingDocs);
    console.log(`Stored ${embeddingDocs.length} embeddings in vector database`);

    return {
      success: true,
      chunksStored: embeddingDocs.length,
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
 * Search resume embeddings (for future use)
 */
export async function searchResumeEmbeddings(
  userId: string | mongoose.Types.ObjectId,
  queryText: string,
  limit: number = 5
): Promise<Array<{ text: string; section: string; score: number }>> {
  try {
    await connectToDatabase();

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText);

    // Find all embeddings for this user
    const userEmbeddings = await ResumeEmbedding.find({
      userId: new mongoose.Types.ObjectId(userId as string),
    });

    // Calculate cosine similarity
    const results = userEmbeddings
      .map((doc) => {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          text: doc.chunkText,
          section: doc.metadata.section,
          score: similarity,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Delete resume embeddings
 */
export async function deleteResumeEmbeddings(
  userId: string | mongoose.Types.ObjectId,
  resumeId: string | mongoose.Types.ObjectId
): Promise<{ success: boolean; deletedCount: number }> {
  try {
    await connectToDatabase();

    const result = await ResumeEmbedding.deleteMany({
      userId: new mongoose.Types.ObjectId(userId as string),
      resumeId: new mongoose.Types.ObjectId(resumeId as string),
    });

    console.log(`Deleted ${result.deletedCount} embeddings`);

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error("Delete embeddings error:", error);
    return {
      success: false,
      deletedCount: 0,
    };
  }
}
