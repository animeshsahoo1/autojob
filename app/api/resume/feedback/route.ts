import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/database/db";
import { User } from "@/models/user.model";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { feedback } = await request.json();

    if (!feedback || typeof feedback !== "string" || !feedback.trim()) {
      return NextResponse.json(
        { success: false, error: "Feedback is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Add feedback to user's parsingFeedback array
    await User.findByIdAndUpdate(
      session.user.id,
      { $push: { parsingFeedback: feedback.trim() } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Feedback saved successfully",
    });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
