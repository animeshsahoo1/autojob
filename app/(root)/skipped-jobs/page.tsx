"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Briefcase, MapPin, Building2, Sparkles, Ban } from "lucide-react";

interface SkippedJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: { min: number; max: number; currency: string };
  skills: string[];
  skipReason: string;
  skipReasoning?: string;
  queuedAt: string;
  hasAnalysis: boolean;
}

export default function SkippedJobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<SkippedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchSkippedJobs();
  }, [session]);

  const fetchSkippedJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/jobs/skipped?userId=${session?.user?.id}&limit=50`,
      );
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Failed to fetch skipped jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSkipReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      POLICY_BLOCK: "Policy Block",
      LOW_MATCH_SCORE: "Low Match Score",
      MISSING_EVIDENCE: "Missing Evidence",
      COMPANY_COOLDOWN: "Company Cooldown",
      DUPLICATE: "Duplicate",
      KILL_SWITCH: "Kill Switch",
      LOCATION_MISMATCH: "Location Mismatch",
      REMOTE_ONLY_MISMATCH: "Remote Only",
    };
    return labels[reason] || reason;
  };

  const getSkipReasonVariant = (reason: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      POLICY_BLOCK: "destructive",
      LOW_MATCH_SCORE: "secondary",
      MISSING_EVIDENCE: "secondary",
      COMPANY_COOLDOWN: "outline",
      DUPLICATE: "outline",
      KILL_SWITCH: "destructive",
      LOCATION_MISMATCH: "outline",
      REMOTE_ONLY_MISMATCH: "outline",
    };
    return variants[reason] || "outline";
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view skipped jobs</p>
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
          <span>Loading skipped jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Skipped Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Jobs that were automatically skipped during discovery. Click on any job to see AI analysis and suggestions for improvement.
          </p>
        </div>

        <Separator className="mb-8" />

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Ban className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No skipped jobs found</p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Run the discovery workflow to see skipped jobs
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Link
                key={job._id}
                href={`/skipped-jobs/${job._id}`}
                className="block"
              >
                <Card className="hover:bg-accent/50 transition-colors h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      {job.hasAnalysis && (
                        <Badge variant="default" className="text-xs shrink-0">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Analysis
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                    <CardDescription className="space-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{job.company}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                    {job.salary && (
                      <p className="text-sm font-medium text-green-500 mb-3">
                        {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                      </p>
                    )}

                    <div className="space-y-3">
                      {job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{job.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div>
                        <Badge variant={getSkipReasonVariant(job.skipReason)}>
                          {getSkipReasonLabel(job.skipReason)}
                        </Badge>
                      </div>

                      {job.skipReasoning && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {job.skipReasoning}
                        </p>
                      )}

                      <p className="text-sm text-primary hover:underline">
                        View analysis →
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
