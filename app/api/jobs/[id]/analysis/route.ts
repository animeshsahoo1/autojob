import { NextRequest, NextResponse } from "next/server";
import { ApplyQueue } from "@/models/applyqueue.model";
import { connectToDatabase } from "@/database/db";

/**
 * GET /api/jobs/[id]/analysis - Fetch AI analysis for a skipped job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Find the queue entry with analysis
    const queueEntry = await ApplyQueue.findOne({
      jobId: id,
      userId,
      status: "SKIPPED",
    }).lean();

    if (!queueEntry) {
      return NextResponse.json(
        { error: "Skipped job not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      analysis: {
        skipReason: queueEntry.skipReason,
        skipReasoning: queueEntry.skipReasoning || "Analysis not available",
        missingSkills: queueEntry.missingSkills || [],
        missingExperience: queueEntry.missingExperience || [],
        suggestions: queueEntry.suggestions || {
          skillsToLearn: [],
          projectsToAdd: [],
          resumeImprovements: [],
        },
        analyzedAt: queueEntry.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching job analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 },
    );
  }
}
