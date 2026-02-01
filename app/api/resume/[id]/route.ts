import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/database/db";
import Resume from "@/models/resume.model";
import { User } from "@/models/user.model";
import { deleteResumeEmbeddings } from "@/lib/agent/vector-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const resume = await Resume.findOne({
      _id: id,
      userId: session.user.id,
    }).lean();

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error("Resume fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resume" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Find and delete the resume
    const resume = await Resume.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    // Remove from user's resumes array
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { resumes: id },
    });

    // Delete from vector database
    try {
      await deleteResumeEmbeddings(session.user.id, id);
    } catch (vectorError) {
      console.warn("Failed to delete vector embeddings:", vectorError);
      // Continue even if vector deletion fails
    }

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Resume delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
