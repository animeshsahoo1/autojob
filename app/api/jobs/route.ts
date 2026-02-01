import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { Job } from "@/models/job.model";

// GET /api/jobs - Get all job postings
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);

    // Query parameters for filtering
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const company = searchParams.get("company");
    const location = searchParams.get("location");
    const isRemote = searchParams.get("isRemote");
    const employmentType = searchParams.get("employmentType");
    const skills = searchParams.get("skills"); // comma-separated

    // Build filter query
    const filter: any = {};

    if (company) filter.company = { $regex: company, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (isRemote === "true") filter.isRemote = true;
    if (employmentType) filter.employmentType = employmentType;
    if (skills) {
      const skillsArray = skills.split(",").map((s) => s.trim());
      filter.skills = { $in: skillsArray };
    }

    const skip = (page - 1) * limit;

    // Get jobs with pagination
    const jobs = await Job.find(filter)
      .select("-__v") // Exclude version field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalJobs = await Job.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limit);

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: page,
          totalPages,
          totalJobs,
          limit,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch jobs",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
