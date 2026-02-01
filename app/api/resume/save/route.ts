import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import Resume from "@/models/resume.model";
import { User } from "@/models/user.model";
import dbConnect from "@/database/db";

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
    const resumeData = await request.json();

    console.log(`Saving resume for user ${userId}`);

    // Connect to database
    await dbConnect();

    // Check if user already has a resume
    const existingResume = await Resume.findOne({ userId });

    let savedResume;
    if (existingResume) {
      // Update existing resume
      console.log("Updating existing resume");
      savedResume = await Resume.findOneAndUpdate(
        { userId },
        {
          ...resumeData,
          userId,
          lastUpdated: new Date(),
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new resume
      console.log("Creating new resume");
      savedResume = await Resume.create({
        ...resumeData,
        userId,
        parsedDate: new Date(),
        lastUpdated: new Date(),
      });

      // Update user's resumeId
      await User.findByIdAndUpdate(userId, {
        resumeId: savedResume._id,
      });
    }

    console.log("Resume saved successfully");

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
