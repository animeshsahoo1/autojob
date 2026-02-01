import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { AgentRun } from "@/models/agentrun.model";
import { User } from "@/models/user.model";
import { enqueueDiscoveryJob } from "@/lib/queue/discovery-queue";
import mongoose from "mongoose";

/**
 * POST /api/workflow/start
 * Start a new workflow run
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Valid userId is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if there's already a running workflow
    const existingRun = await AgentRun.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "RUNNING",
    });

    if (existingRun) {
      return NextResponse.json({
        success: false,
        error: "Workflow is already running",
        agentRunId: existingRun._id,
      });
    }

    // Create new agent run
    const agentRun = await AgentRun.create({
      userId: new mongoose.Types.ObjectId(userId),
      status: "RUNNING",
      appliedCountToday: 0,
      skippedCountToday: 0,
      killSwitch: false,
      startedAt: new Date(),
    });

    // Enqueue the discovery job to be processed by worker
    await enqueueDiscoveryJob({
      agentRunId: agentRun._id.toString(),
      userId: userId,
    });

    console.log(`[API] Discovery job enqueued for AgentRun ${agentRun._id}`);

    return NextResponse.json({
      success: true,
      message: "Workflow started successfully",
      agentRunId: agentRun._id,
      status: agentRun.status,
    });
  } catch (error) {
    console.error("[API] Start workflow error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
