"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface AgentLog {
  _id: string;
  agentRunId: string;
  jobId?: string;
  userId: string;
  stage: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: any;
  createdAt: string;
}

interface Stats {
  stageStats: Array<{
    _id: string;
    count: number;
    errors: number;
    warnings: number;
  }>;
  levelStats: Array<{
    _id: string;
    count: number;
  }>;
  timeline: Array<{
    _id: string;
    count: number;
    errors: number;
  }>;
}

export default function AgentRunLogsPage() {
  const params = useParams();
  const agentRunId = params.agentRunId as string;

  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentRunId) return;
    fetchData();
  }, [agentRunId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch logs
      const logsRes = await fetch(
        `/api/logs?agentRunId=${agentRunId}&limit=200`,
      );
      const logsData = await logsRes.json();
      setLogs(logsData.logs || []);

      // Fetch stats
      const statsRes = await fetch(`/api/logs/stats?agentRunId=${agentRunId}`);
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      ARTIFACT: "bg-purple-100",
      SEARCH: "bg-blue-100",
      RANK: "bg-cyan-100",
      POLICY: "bg-yellow-100",
      QUEUE: "bg-orange-100",
      PERSONALIZE: "bg-green-100",
      APPLY: "bg-pink-100",
      VALIDATION: "bg-teal-100",
      SYSTEM: "bg-gray-100",
    };
    return colors[stage] || "bg-gray-100";
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Loading agent run details...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Agent Run Details</h1>
        <p className="text-gray-600">Run ID: {agentRunId}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Logs
            </h3>
            <p className="text-3xl font-bold">
              {stats.levelStats.reduce((sum, s) => sum + s.count, 0)}
            </p>
          </div>

          {/* Errors */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Errors</h3>
            <p className="text-3xl font-bold text-red-600">
              {stats.levelStats.find((s) => s._id === "ERROR")?.count || 0}
            </p>
          </div>

          {/* Warnings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Warnings</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.levelStats.find((s) => s._id === "WARN")?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Stage Breakdown */}
      {stats && stats.stageStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Logs by Stage</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.stageStats.map((stat) => (
              <div
                key={stat._id}
                className={`p-4 rounded-lg ${getStageColor(stat._id)}`}
              >
                <div className="text-sm font-medium mb-1">{stat._id}</div>
                <div className="text-2xl font-bold">{stat.count}</div>
                {(stat.errors > 0 || stat.warnings > 0) && (
                  <div className="text-xs mt-2">
                    {stat.errors > 0 && (
                      <span className="text-red-600">{stat.errors} errors</span>
                    )}
                    {stat.warnings > 0 && (
                      <span className="text-yellow-600 ml-2">
                        {stat.warnings} warnings
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {stats && stats.timeline.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
          <div className="space-y-2">
            {stats.timeline.map((point) => (
              <div key={point._id} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-40">{point._id}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${Math.min(100, (point.count / Math.max(...stats.timeline.map((p) => p.count))) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {point.count}
                </span>
                {point.errors > 0 && (
                  <span className="text-xs text-red-600">
                    {point.errors} errors
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Logs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Detailed Logs</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No logs found</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={log._id}
                className="border-l-4 border-gray-300 pl-4 py-2 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-1 rounded ${getStageColor(log.stage)}`}
                      >
                        {log.stage}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          log.level === "ERROR"
                            ? "bg-red-100 text-red-800"
                            : log.level === "WARN"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {log.level}
                      </span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.metadata && (
                      <details className="text-xs mt-1 text-gray-600">
                        <summary className="cursor-pointer">
                          View metadata
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 ml-4">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
