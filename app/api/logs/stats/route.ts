import { NextRequest, NextResponse } from "next/server";
import { AgentLog } from "@/models/agentlog.model";
import { connectToDatabase } from "@/database/db";

/**
 * GET /api/logs/stats - Get log statistics
 *
 * Query params:
 * - userId: User ID (required)
 * - agentRunId: Filter by specific agent run (optional)
 * - timeRange: Time range in hours (default: 24)
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const agentRunId = searchParams.get("agentRunId");
    const timeRange = parseInt(searchParams.get("timeRange") || "24");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const filter: any = {
      userId,
      createdAt: { $gte: new Date(Date.now() - timeRange * 60 * 60 * 1000) },
    };
    if (agentRunId) filter.agentRunId = agentRunId;

    // Get counts by stage
    const stageStats = await AgentLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
          errors: {
            $sum: { $cond: [{ $eq: ["$level", "ERROR"] }, 1, 0] },
          },
          warnings: {
            $sum: { $cond: [{ $eq: ["$level", "WARN"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get counts by level
    const levelStats = await AgentLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$level",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent errors
    const recentErrors = await AgentLog.find({
      ...filter,
      level: "ERROR",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Timeline data (logs per hour)
    const timeline = await AgentLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d %H:00",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
          errors: {
            $sum: { $cond: [{ $eq: ["$level", "ERROR"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      stageStats,
      levelStats,
      recentErrors,
      timeline,
    });
  } catch (error) {
    console.error("Error fetching log stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch log stats" },
      { status: 500 },
    );
  }
}
