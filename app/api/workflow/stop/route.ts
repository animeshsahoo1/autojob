import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { AgentRun } from "@/models/agentrun.model";
import mongoose from "mongoose";

/**
 * POST /api/workflow/stop
 * Stop a running workflow by activating the kill switch
 */
export async function POST(req: NextRequest) {
  try {
    const { agentRunId, userId } = await req.json();

    if (!agentRunId || !mongoose.Types.ObjectId.isValid(agentRunId)) {
      return NextResponse.json(
        { success: false, error: "Valid agentRunId is required" },
        { status: 400 },
      );
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Valid userId is required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Find the agent run
    const agentRun = await AgentRun.findById(agentRunId);

    if (!agentRun) {
      return NextResponse.json(
        { success: false, error: "Agent run not found" },
        { status: 404 },
      );
    }

    // Verify the agent run belongs to the user
    if (agentRun.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Check if already stopped
    if (agentRun.status !== "RUNNING") {
      return NextResponse.json({
        success: false,
        error: `Workflow is already ${agentRun.status}`,
        status: agentRun.status,
      });
    }

    // Activate kill switch and update status
    agentRun.killSwitch = true;
    agentRun.status = "STOPPED";
    agentRun.finishedAt = new Date();
    await agentRun.save();

    console.log(`[API] Workflow stopped for AgentRun ${agentRunId}`);

    return NextResponse.json({
      success: true,
      message: "Workflow stopped successfully",
      agentRunId: agentRun._id,
      status: agentRun.status,
    });
  } catch (error) {
    console.error("[API] Stop workflow error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
