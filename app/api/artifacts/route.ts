import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { User } from "@/models/user.model";
import { connectToDatabase } from "@/database/db";

export const runtime = "nodejs";

// GET /api/artifacts - Get user's artifact pack
export async function GET(request: NextRequest) {
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

    await connectToDatabase();

    // Get user with artifacts
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if artifacts exist
    if (!user.studentProfile || !user.resumeArtifacts) {
      return NextResponse.json(
        {
          success: false,
          error: "No artifact pack found. Please upload your resume first.",
        },
        { status: 404 }
      );
    }

    // Construct artifact pack from user data
    const artifactPack = {
      studentProfile: {
        education: user.studentProfile.education || [],
        skills: user.studentProfile.skills || [],
        projects: user.studentProfile.projects || [],
        experience: user.studentProfile.experience || [],
        links: user.studentProfile.links || [],
      },
      bulletBank: {
        bullets: user.resumeArtifacts.bulletBank || [],
        categorized: [], // TODO: Add categorization if needed
      },
      answerLibrary: {
        workAuthorization: "To be updated",
        availability: "To be updated",
        relocation: "To be updated",
        salary: "To be updated",
        remote: "To be updated",
        startDate: "To be updated",
      },
      proofPack: {
        links:
          user.resumeArtifacts.proofLinks?.map((link: string) => ({
            type: "other" as const,
            url: link,
            title: link,
            description: "",
          })) || [],
      },
      generatedAt: user.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: artifactPack,
    });
  } catch (error) {
    console.error("[API] Error fetching artifacts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch artifact pack",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
