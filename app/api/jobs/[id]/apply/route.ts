import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { Job, IJob } from "@/models/job.model";
import { User, IUser } from "@/models/user.model";
import { auth } from "@/auth";
import mongoose from "mongoose";

// POST /api/jobs/[id]/apply - Apply to a job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please sign in to apply",
        },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const { id } = params;

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

    // Get request body
    const body = await request.json();
    const {
      resumeVariant, // which resume to use (optional)
      answers, // answers to screening questions
      coverLetter,
    } = body;

    // Fetch job details
    const job = (await Job.findById(id).lean()) as IJob | null;
    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    // Fetch user details
    const user = (await User.findById(session.user.id).lean()) as IUser | null;
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    // Check if user has required resume
    if (!user.resumeArtifacts?.baseResumeUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Please upload a resume before applying",
        },
        { status: 400 },
      );
    }

    // Select resume to use
    let resumeUrl = user.resumeArtifacts.baseResumeUrl;
    if (resumeVariant && user.resumeArtifacts.resumeVariants) {
      const variant = user.resumeArtifacts.resumeVariants.find(
        (v) => v.name === resumeVariant,
      );
      if (variant) {
        resumeUrl = variant.url;
      }
    }

    // Validate answers for screening questions if job has questions
    if (job.questions && job.questions.length > 0) {
      if (!answers || Object.keys(answers).length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Please answer all screening questions",
            questions: job.questions,
          },
          { status: 400 },
        );
      }
    }

    // Here you would typically:
    // 1. Create an Application record
    // 2. Submit to external job board if applyUrl exists
    // 3. Send confirmation email
    // For now, we'll return a success response

    const applicationData = {
      jobId: job._id,
      userId: user._id,
      company: job.company,
      title: job.title,
      resumeUrl,
      answers: answers || {},
      coverLetter: coverLetter || "",
      appliedAt: new Date(),
      status: "submitted",
    };

    // TODO: Create Application model and save application
    // const application = await Application.create(applicationData);

    // If job has external apply URL, you could trigger application submission
    if (job.applyUrl) {
      // TODO: Implement external application submission
      console.log("Would submit to:", job.applyUrl);
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      data: {
        jobId: job._id,
        company: job.company,
        title: job.title,
        appliedAt: applicationData.appliedAt,
      },
    });
  } catch (error) {
    console.error("Error applying to job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit application",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
