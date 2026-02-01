import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { Job } from "@/models/job.model";
import { Application } from "@/models/application.model";
import { auth } from "@/auth";
import mongoose from "mongoose";

// GET /api/jobs - Get all jobs
export async function GET() {
  try {
    await connectToDatabase();
    
    const jobs = await Job.find()
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 },
    );
  }
}

// POST /api/jobs - Auto apply to a job
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Please sign in" },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const { jobId } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json(
        { success: false, error: "Invalid job ID" },
        { status: 400 },
      );
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 },
      );
    }

    // Create application
    const application = await Application.create({
      jobId: new mongoose.Types.ObjectId(jobId),
      userId: new mongoose.Types.ObjectId(session.user.id),
      agentRunId: new mongoose.Types.ObjectId(),
      resumeVariantUsed: "base",
      status: "SUBMITTED",
      attempts: 1,
      timeline: [{
        stage: "SUBMITTED",
        timestamp: new Date(),
        message: "Application submitted successfully"
      }]
    });

    return NextResponse.json({
      success: true,
      message: `Applied to ${job.title} at ${job.company}`,
      applicationId: application._id,
    });
  } catch (error) {
    console.error("Error applying to job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to apply" },
      { status: 500 },
    );
  }
}
