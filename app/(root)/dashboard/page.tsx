"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Play,
  FileText,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  StopCircle,
} from "lucide-react";
import Link from "next/link";
import { SlidingPanel } from "@/components/ui/sliding-panel";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: { min: number; max: number; currency: string };
  skills: string[];
  isRemote: boolean;
  createdAt: string;
}

interface AgentRun {
  _id: string;
  status: "RUNNING" | "STOPPED" | "COMPLETED" | "FAILED";
  appliedCountToday: number;
  skippedCountToday: number;
  startedAt: string;
}

interface Log {
  _id: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  checkpoint: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingWorkflow, setStartingWorkflow] = useState(false);
  const [stoppingWorkflow, setStoppingWorkflow] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [jobsRes, agentRunRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch(`/api/agent-run?userId=${session?.user?.id}`),
      ]);

      const jobsData = await jobsRes.json();
      const agentRunData = await agentRunRes.json();

      setJobs(jobsData.jobs || []);
      setAgentRun(agentRunData.agentRun || null);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/logs?userId=${session?.user?.id}&limit=50`,
      );
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  useEffect(() => {
    if (showLogs && session?.user?.id) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLogs, session?.user?.id]);

  const startWorkflow = async () => {
    try {
      setStartingWorkflow(true);
      const response = await fetch("/api/workflow/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session?.user?.id }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error("Failed to start workflow:", error);
    } finally {
      setStartingWorkflow(false);
    }
  };

  const stopWorkflow = async () => {
    if (!agentRun?._id) return;

    try {
      setStoppingWorkflow(true);
      const response = await fetch("/api/workflow/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentRunId: agentRun._id,
          userId: session?.user?.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error("Failed to stop workflow:", error);
    } finally {
      setStoppingWorkflow(false);
    }
  };

  const getLogLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      INFO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      WARN: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      ERROR: "bg-red-500/20 text-red-400 border-red-500/30",
      DEBUG: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[level] || colors.DEBUG;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RUNNING: "text-green-400",
      STOPPED: "text-red-400",
      COMPLETED: "text-blue-400",
      FAILED: "text-orange-400",
    };
    return colors[status] || "text-gray-400";
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <p className="text-white">Please sign in to view dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">
              Monitor your job applications and workflow
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowLogs(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              <FileText className="w-5 h-5" />
              View Logs
            </button>

            {agentRun?.status === "RUNNING" ? (
              <button
                onClick={stopWorkflow}
                disabled={stoppingWorkflow}
                className="flex items-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-all"
              >
                <StopCircle className="w-5 h-5" />
                {stoppingWorkflow ? "Stopping..." : "Stop Workflow"}
              </button>
            ) : (
              <button
                onClick={startWorkflow}
                disabled={startingWorkflow}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                {startingWorkflow ? "Starting..." : "Start Workflow"}
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {agentRun && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Status</span>
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <p
                className={`text-2xl font-bold ${getStatusColor(agentRun.status)}`}
              >
                {agentRun.status}
              </p>
              {agentRun.status === "RUNNING" && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Active</span>
                </div>
              )}
            </div>

            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Applied Today</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">
                {agentRun.appliedCountToday}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Skipped Today</span>
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">
                {agentRun.skippedCountToday}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Jobs</span>
                <Briefcase className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {jobs.length}
              </p>
            </div>
          </div>
        )}

        {/* Jobs List */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Available Jobs</h2>
            <Link
              href="/jobs"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-400">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No jobs available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.slice(0, 10).map((job) => (
                <Link
                  key={job._id}
                  href={`/jobs/${job._id}`}
                  className="block p-5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1 group-hover:text-blue-400 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-gray-400 mb-3">
                        {job.company} • {job.location}
                        {job.isRemote && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                            Remote
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-sm bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="px-3 py-1 text-sm text-gray-400">
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                    {job.salary && (
                      <div className="text-right ml-4">
                        <p className="text-green-400 font-semibold">
                          {job.salary.currency}{" "}
                          {job.salary.min.toLocaleString()} -{" "}
                          {job.salary.max.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logs Sliding Panel */}
      <SlidingPanel
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        title="Workflow Logs"
      >
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No logs available</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log._id}
                className={`p-4 rounded-lg border ${getLogLevelColor(log.level)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-sm">{log.level}</span>
                  <span className="text-xs opacity-70">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm mb-1">{log.message}</p>
                {log.checkpoint && (
                  <p className="text-xs opacity-70">
                    Checkpoint: {log.checkpoint}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </SlidingPanel>
    </div>
  );
}
