/**
 * API endpoint to trigger Discovery Workflow
 *
 * POST /api/workflow/discovery
 * Body: { agentRunId: string, userId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { runDiscoveryWorkflow } from "@/lib/workflow/discovery-graph";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentRunId, userId } = body;

    if (!agentRunId || !userId) {
      return NextResponse.json(
        { error: "agentRunId and userId are required" },
        { status: 400 },
      );
    }

    console.log(`[API] Starting Discovery Workflow for AgentRun ${agentRunId}`);

    const result = await runDiscoveryWorkflow({
      agentRunId,
      userId,
    });

    return NextResponse.json({
      success: true,
      runStatus: result.runStatus,
      jobsFound: result.jobSearchState?.totalJobsFound || 0,
      jobsQueued: result.queueState?.queuedJobIds.length || 0,
      jobsSkipped: result.queueState?.skippedJobIds.length || 0,
      errors: result.errors || [],
    });
  } catch (error) {
    console.error("[API] Discovery workflow error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
