"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Play,
  FileText,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  StopCircle,
  Building2,
  MapPin,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
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

  const getLogLevelVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      INFO: "default",
      WARN: "secondary",
      ERROR: "destructive",
      DEBUG: "outline",
    };
    return variants[level] || "outline";
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      RUNNING: "default",
      STOPPED: "destructive",
      COMPLETED: "secondary",
      FAILED: "destructive",
    };
    return variants[status] || "outline";
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view dashboard</p>
          <Button asChild className="mt-4">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your job applications and workflow
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLogs(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Logs
            </Button>

            {agentRun?.status === "RUNNING" ? (
              <Button
                variant="destructive"
                onClick={stopWorkflow}
                disabled={stoppingWorkflow}
              >
                {stoppingWorkflow ? (
                  <Spinner className="mr-2" />
                ) : (
                  <StopCircle className="w-4 h-4 mr-2" />
                )}
                {stoppingWorkflow ? "Stopping..." : "Stop Workflow"}
              </Button>
            ) : (
              <Button
                onClick={startWorkflow}
                disabled={startingWorkflow}
              >
                {startingWorkflow ? (
                  <Spinner className="mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {startingWorkflow ? "Starting..." : "Start Workflow"}
              </Button>
            )}
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {agentRun ? (
                  <>
                    <Badge variant={getStatusVariant(agentRun.status)}>
                      {agentRun.status}
                    </Badge>
                    {agentRun.status === "RUNNING" && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-2xl font-bold">Idle</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Applied Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {agentRun?.appliedCountToday || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Skipped Today
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {agentRun?.skippedCountToday || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {jobs.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>
                  Browse and apply to available positions
                </CardDescription>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/jobs">
                  View All →
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No jobs available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <Link
                    key={job._id}
                    href={`/jobs/${job._id}`}
                    className="block"
                  >
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                                <Briefcase className="h-4 w-4 text-primary" />
                              </div>
                              <h3 className="font-semibold truncate">
                                {job.title}
                              </h3>
                              {job.isRemote && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Remote
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="truncate">{job.company}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{job.location}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.slice(0, 4).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {job.skills.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{job.skills.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {job.salary && (
                            <div className="text-right shrink-0">
                              <p className="text-sm font-medium text-green-500">
                                {job.salary.currency}{" "}
                                {job.salary.min.toLocaleString()} -{" "}
                                {job.salary.max.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs Sliding Panel */}
      <SlidingPanel
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        title="Workflow Logs"
      >
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No logs available</p>
            </div>
          ) : (
            logs.map((log) => (
              <Card key={log._id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={getLogLevelVariant(log.level)}>
                      {log.level}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mb-1">{log.message}</p>
                  {log.checkpoint && (
                    <p className="text-xs text-muted-foreground">
                      Checkpoint: {log.checkpoint}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SlidingPanel>
    </div>
  );
}
