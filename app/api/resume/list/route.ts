import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/database/db";
import Resume from "@/models/resume.model";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Fetch all resumes for this user
    const resumes = await Resume.find({ userId: session.user.id })
      .select("_id personalInfo.fullName fileUrl parsedDate lastUpdated createdAt")
      .sort({ lastUpdated: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    console.error("Resume list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}
