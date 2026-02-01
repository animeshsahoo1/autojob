import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/database/db";
import { User } from "@/models/user.model";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/artifacts/generate
 * Generate artifact pack from resume text
 * TODO: Add AI extraction when needed
 */
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

    // Get resume text from request body
    const body = await request.json();
    const { resumeText, fileName } = body;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Resume text is required",
        },
        { status: 400 }
      );
    }

    if (resumeText.length < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Resume text is too short. Please provide a complete resume.",
        },
        { status: 400 }
      );
    }

    console.log(
      `[API] Processing resume for user ${userId}, resume length: ${resumeText.length}`
    );

    // Basic extraction - parse resume text manually
    // TODO: Integrate AI for better extraction
    const lines = resumeText.split('\n').filter(line => line.trim());
    const artifactPack = {
      studentProfile: {
        education: lines.filter(l => l.toLowerCase().includes('university') || l.toLowerCase().includes('degree')),
        skills: [],
        projects: [],
        experience: [],
        links: [],
        constraints: {}
      },
      bulletBank: {
        bullets: [],
        categorized: []
      },
      answerLibrary: {
        workAuthorization: "",
        availability: "Available immediately",
        relocation: "",
        remote: "",
        startDate: new Date().toISOString()
      },
      proofPack: {
        links: []
      },
      generatedAt: new Date()
    };

    // Connect to database and save artifacts to user profile
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Update user with artifact pack
    user.studentProfile = {
      education: artifactPack.studentProfile.education,
      skills: artifactPack.studentProfile.skills,
      projects: artifactPack.studentProfile.projects,
      experience: artifactPack.studentProfile.experience,
      links: artifactPack.studentProfile.links,
    };

    user.resumeArtifacts = {
      baseResumeUrl: fileName || "uploaded-resume.pdf",
      resumeVariants: [],
      bulletBank: artifactPack.bulletBank.bullets,
      proofLinks: [],
    };

    // Initialize apply policy with defaults if not exists
    if (!user.applyPolicy) {
      user.applyPolicy = {
        maxApplicationsPerDay: 10,
        minMatchScore: 60,
        allowedLocations: [],
        remoteOnly: false,
        visaRequired: false,
        blockedCompanies: [],
        blockedRoles: [],
        companyCooldownDays: 30,
        killSwitch: false,
      };
    }

    await user.save();

    console.log(`[API] Artifact pack saved for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: {
        studentProfile: artifactPack.studentProfile,
        bulletBank: artifactPack.bulletBank,
        answerLibrary: artifactPack.answerLibrary,
        proofPack: artifactPack.proofPack,
        savedToProfile: true,
      },
      message: "Artifact pack generated and saved successfully",
    });
  } catch (error) {
    console.error("[API] Artifact generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate artifact pack",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/artifacts/generate
 * Get user's saved artifact pack
 */
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

    const userId = session.user.id;

    await connectToDatabase();

    const user = await User.findById(userId).select(
      "studentProfile resumeArtifacts applyPolicy"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    if (!user.studentProfile || !user.resumeArtifacts) {
      return NextResponse.json(
        {
          success: false,
          error: "No artifact pack found. Please upload a resume first.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        studentProfile: user.studentProfile,
        resumeArtifacts: user.resumeArtifacts,
        applyPolicy: user.applyPolicy,
      },
    });
  } catch (error) {
    console.error("[API] Get artifacts error:", error);
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
