import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { Job } from "@/models/job.model";
import mongoose from "mongoose";

// GET /api/jobs/[id] - Get single job posting with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();

    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid job ID format",
        },
        { status: 400 },
      );
    }

    const job = await Job.findById(id).select("-__v").lean();

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch job details",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
