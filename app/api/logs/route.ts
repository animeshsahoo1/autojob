import { NextRequest, NextResponse } from "next/server";
import { AgentLog } from "@/models/agentlog.model";
import { connectToDatabase } from "@/database/db";

/**
 * GET /api/logs - Fetch agent logs with filtering
 *
 * Query params:
 * - userId: Filter by user ID (required)
 * - agentRunId: Filter by specific agent run
 * - jobId: Filter by specific job
 * - stage: Filter by stage (ARTIFACT, SEARCH, PERSONALIZE, etc.)
 * - level: Filter by level (INFO, WARN, ERROR)
 * - limit: Number of logs to return (default: 50)
 * - skip: Number of logs to skip for pagination
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const agentRunId = searchParams.get("agentRunId");
    const jobId = searchParams.get("jobId");
    const stage = searchParams.get("stage");
    const level = searchParams.get("level");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Build filter
    const filter: any = { userId };
    if (agentRunId) filter.agentRunId = agentRunId;
    if (jobId) filter.jobId = jobId;
    if (stage) filter.stage = stage;
    if (level) filter.level = level;

    // Fetch logs
    const logs = await AgentLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await AgentLog.countDocuments(filter);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + logs.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}
