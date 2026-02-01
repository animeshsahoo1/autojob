import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { AgentRun } from "@/models/agentrun.model";
import mongoose from "mongoose";

/**
 * GET /api/agent-run?userId=xxx
 * Get the current or latest agent run for a user
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Valid userId is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Try to find a running agent run first
    let agentRun = await AgentRun.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "RUNNING",
    }).sort({ startedAt: -1 });

    // If no running agent run, get the most recent one
    if (!agentRun) {
      agentRun = await AgentRun.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      }).sort({ startedAt: -1 });
    }

    return NextResponse.json({
      success: true,
      agentRun: agentRun || null,
    });
  } catch (error) {
    console.error("[API] Get agent run error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
