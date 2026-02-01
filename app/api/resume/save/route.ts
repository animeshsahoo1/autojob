import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Resume from "@/models/resume.model";
import { User } from "@/models/user.model";
import { connectToDatabase } from "@/database/db";
import { storeResumeInVectorDB } from "@/lib/agent/vector-store";

export const runtime = "nodejs";

// POST /api/resume/save
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
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { resumeId, ...resumeData } = await request.json();

    console.log(`Saving resume for user ${userId}`);

    // Connect to database
    await connectToDatabase();

    let savedResume;
    
    if (resumeId) {
      // Update existing resume by ID
      console.log(`Updating resume ${resumeId}`);
      savedResume = await Resume.findOneAndUpdate(
        { _id: resumeId, userId }, // Ensure user owns this resume
        {
          ...resumeData,
          userId,
          lastUpdated: new Date(),
        },
        { new: true, runValidators: true }
      );
      
      if (!savedResume) {
        return NextResponse.json(
          {
            success: false,
            error: "Resume not found or access denied",
          },
          { status: 404 }
        );
      }
    } else {
      // Create new resume
      console.log("Creating new resume");
      savedResume = await Resume.create({
        ...resumeData,
        userId,
        parsedDate: new Date(),
        lastUpdated: new Date(),
      });

      // Add resume to user's resumes array
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { resumes: savedResume._id } },
        { new: true }
      );
    }

    console.log("Resume saved successfully");

    // Store resume in vector database for semantic search
    try {
      const vectorResult = await storeResumeInVectorDB(
        userId.toString(),
        savedResume._id.toString(),
        savedResume.toObject()
      );
      
      if (vectorResult.success) {
        console.log(`Stored ${vectorResult.chunksStored} chunks in vector database`);
      } else {
        console.warn("Vector storage failed:", vectorResult.error);
        // Don't fail the whole request if vector storage fails
      }
    } catch (vectorError) {
      console.error("Vector storage error:", vectorError);
      // Continue even if vector storage fails
    }

    return NextResponse.json({
      success: true,
      data: {
        resumeId: savedResume._id,
        message: "Resume saved successfully",
      },
    });
  } catch (error) {
    console.error("Resume save error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save resume",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
