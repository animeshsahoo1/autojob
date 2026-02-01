import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseAndExtractResume } from "@/lib/agent/pdf-parser";
import { connectToDatabase } from "@/database/db";
import { User } from "@/models/user.model";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/resume/upload
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please sign in",
        },
        { status: 401 },
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file uploaded",
        },
        { status: 400 },
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          error: "Only PDF files are allowed",
        },
        { status: 400 },
      );
    }

    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File size must be less than 10MB",
        },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Parsing resume for user ${session.user.id}: ${file.name}`);

    // Connect to database and get user's parsing feedback preferences
    await connectToDatabase();
    const user = await User.findById(session.user.id).select('parsingFeedback');
    const userFeedback = user?.parsingFeedback || [];

    console.log("Step 1: Extracting text from PDF...");
    const { rawData, structuredData } = await parseAndExtractResume(
      buffer,
      file.name,
      file.size,
      userFeedback
    );

    console.log("✅ Resume extraction completed successfully");

    // TODO: Store parsed resume in database with userId
    // await Resume.create({ ...structuredData, userId: session.user.id });

    return NextResponse.json({
      success: true,
      data: {
        // Raw data
        fileName: rawData.metadata.fileName,
        fileSize: rawData.metadata.fileSize,
        pageCount: rawData.pageCount,
        textPreview: rawData.rawText.substring(0, 500) + "...",
        uploadedAt: rawData.metadata.uploadedAt,
        
        // Structured extracted data
        extractedData: structuredData,
      },
      message: "Resume uploaded and parsed successfully",
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process resume",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
