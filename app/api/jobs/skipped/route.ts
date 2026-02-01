import { NextRequest, NextResponse } from "next/server";
import { ApplyQueue } from "@/models/applyqueue.model";
import { Job } from "@/models/job.model";
import { connectToDatabase } from "@/database/db";

/**
 * GET /api/jobs/skipped - Fetch all skipped jobs for a user
 *
 * Query params:
 * - userId: User ID (required)
 * - limit: Number of results (default: 20)
 * - skip: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Ensure Job model is registered
    Job;

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Fetch skipped queue entries
    const skippedQueue = await ApplyQueue.find({
      userId,
      status: "SKIPPED",
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("jobId")
      .lean();

    const total = await ApplyQueue.countDocuments({
      userId,
      status: "SKIPPED",
    });

    // Format response
    const jobs = skippedQueue.map((entry: any) => ({
      _id: entry.jobId._id,
      title: entry.jobId.title,
      company: entry.jobId.company,
      location: entry.jobId.location,
      salary: entry.jobId.salary,
      skills: entry.jobId.skills,
      skipReason: entry.skipReason,
      skipReasoning: entry.skipReasoning,
      queuedAt: entry.queuedAt,
      hasAnalysis: !!entry.skipReasoning,
    }));

    return NextResponse.json({
      jobs,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + jobs.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching skipped jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch skipped jobs" },
      { status: 500 },
    );
  }
}
