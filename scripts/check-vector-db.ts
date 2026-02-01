/**
 * Check Vector DB Contents
 *
 * This script checks what's stored in the Qdrant vector database
 */

import { QdrantClient } from "@qdrant/qdrant-js";
import * as dotenv from "dotenv";

dotenv.config();

const COLLECTION_NAME = "resume_embeddings";

async function checkVectorDB() {
  try {
    console.log("🔍 Connecting to Qdrant...\n");

    const client = new QdrantClient({
      url: process.env.VECTOR_DB_ENDPOINT,
      apiKey: process.env.VECTOR_DB_API,
      timeout: 30000,
      checkCompatibility: false,
    });

    // Check if collection exists
    const collections = await client.getCollections();
    console.log(
      "📚 Collections:",
      collections.collections.map((c) => c.name).join(", "),
    );

    const collectionExists = collections.collections.some(
      (c) => c.name === COLLECTION_NAME,
    );

    if (!collectionExists) {
      console.log(`\n❌ Collection "${COLLECTION_NAME}" does not exist`);
      return;
    }

    // Get collection info
    const collectionInfo = await client.getCollection(COLLECTION_NAME);
    console.log(`\n✅ Collection "${COLLECTION_NAME}" found`);
    console.log(`   Points count: ${collectionInfo.points_count}`);
    console.log(
      `   Vector size: ${collectionInfo.config?.params?.vectors?.size || "N/A"}`,
    );
    console.log(
      `   Distance: ${collectionInfo.config?.params?.vectors?.distance || "N/A"}`,
    );

    if (collectionInfo.points_count === 0) {
      console.log(
        "\n⚠️  No points in collection. Upload a resume to populate vector DB.",
      );
      return;
    }

    // Scroll through points to see what's stored
    console.log("\n📝 Sampling stored points...\n");

    const result = await client.scroll(COLLECTION_NAME, {
      limit: 10,
      with_payload: true,
      with_vector: false, // Don't fetch vectors, just metadata
    });

    console.log(`Found ${result.points.length} sample points:\n`);

    result.points.forEach((point, idx) => {
      const payload = point.payload;
      console.log(`Point ${idx + 1}:`);
      console.log(`  ID: ${point.id}`);
      console.log(`  User ID: ${payload?.userId}`);
      console.log(`  Resume ID: ${payload?.resumeId}`);
      console.log(`  Section: ${payload?.section}`);
      console.log(`  Chunk Index: ${payload?.chunkIndex}`);
      console.log(
        `  Text Preview: ${(payload?.chunkText as string)?.substring(0, 100)}...`,
      );
      console.log(`  Timestamp: ${payload?.timestamp}`);
      console.log("");
    });

    // Get unique users and resumes
    const allPoints = await client.scroll(COLLECTION_NAME, {
      limit: 1000,
      with_payload: ["userId", "resumeId", "section"],
    });

    const users = new Set<string>();
    const resumes = new Set<string>();
    const sections = new Map<string, number>();

    allPoints.points.forEach((point) => {
      if (point.payload?.userId) users.add(point.payload.userId as string);
      if (point.payload?.resumeId)
        resumes.add(point.payload.resumeId as string);

      const section = point.payload?.section as string;
      if (section) {
        sections.set(section, (sections.get(section) || 0) + 1);
      }
    });

    console.log("📊 Summary:");
    console.log(`   Total points: ${allPoints.points.length}`);
    console.log(`   Unique users: ${users.size}`);
    console.log(`   Unique resumes: ${resumes.size}`);
    console.log("\n   Points by section:");
    sections.forEach((count, section) => {
      console.log(`     ${section}: ${count}`);
    });

    console.log("\n✅ Vector DB check complete!");
  } catch (error) {
    console.error("❌ Error checking vector DB:", error);
  }
}

checkVectorDB();
