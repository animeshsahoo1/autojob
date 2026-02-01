"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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

export default function LogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    stage: "ALL",
    level: "ALL",
  });

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchLogs();
  }, [session, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId: session?.user?.id || "",
        limit: "100",
      });

      if (filter.stage !== "ALL") params.append("stage", filter.stage);
      if (filter.level !== "ALL") params.append("level", filter.level);

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-300";
      case "WARN":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "INFO":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStageEmoji = (stage: string) => {
    switch (stage) {
      case "ARTIFACT":
        return "📦";
      case "SEARCH":
        return "🔍";
      case "RANK":
        return "📊";
      case "POLICY":
        return "⚖️";
      case "QUEUE":
        return "📋";
      case "PERSONALIZE":
        return "✍️";
      case "APPLY":
        return "📧";
      case "VALIDATION":
        return "✅";
      case "SYSTEM":
        return "⚙️";
      default:
        return "📝";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (!session) {
    return (
      <div className="p-8">
        <p>Please sign in to view logs</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Workflow Logs</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-2">Stage</label>
          <select
            value={filter.stage}
            onChange={(e) => setFilter({ ...filter, stage: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="ALL">All Stages</option>
            <option value="ARTIFACT">Artifact</option>
            <option value="SEARCH">Search</option>
            <option value="RANK">Rank</option>
            <option value="POLICY">Policy</option>
            <option value="QUEUE">Queue</option>
            <option value="PERSONALIZE">Personalize</option>
            <option value="APPLY">Apply</option>
            <option value="VALIDATION">Validation</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Level</label>
          <select
            value={filter.level}
            onChange={(e) => setFilter({ ...filter, level: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
          </select>
        </div>

        <button
          onClick={fetchLogs}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-12">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No logs found</p>
          <p className="text-sm text-gray-400 mt-2">
            Run the workflow to see logs appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log._id}
              className={`border-l-4 p-4 rounded-lg shadow ${getLevelColor(log.level)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getStageEmoji(log.stage)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{log.stage}</span>
                      <span className="text-xs px-2 py-1 rounded bg-white/50">
                        {log.level}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{log.message}</p>

                    {/* Metadata */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer font-medium">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-white/50 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Job ID if available */}
                    {log.jobId && (
                      <p className="text-xs mt-2 text-gray-600">
                        Job: {log.jobId}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show more button */}
      {logs.length >= 100 && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              /* TODO: Implement pagination */
            }}
            className="text-blue-600 hover:underline"
          >
            Load more logs
          </button>
        </div>
      )}
    </div>
  );
}
