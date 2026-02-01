"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Briefcase,
  MapPin,
  Building2,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    location: string;
    isRemote: boolean;
    employmentType: string;
    description: string;
    requirements: string[];
    skills: string[];
    applyUrl: string;
  };
  resumeVariantUsed: string;
  answeredQuestions?: { question: string; answer: string }[];
  validationState?: {
    confidenceScore: number;
    isGrounded: boolean;
    hallucinationRisks: string[];
  };
  status: "QUEUED" | "SUBMITTED" | "FAILED" | "RETRIED";
  receipt?: string;
  error?: string;
  attempts: number;
  createdAt: string;
  timeline: {
    stage: string;
    timestamp: string;
    message?: string;
  }[];
}

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications");
      const data = await response.json();
      // Filter out applications where job was deleted
      setApplications(
        (data.applications || []).filter((app: Application) => app.jobId),
      );
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "SUBMITTED":
        return "default";
      case "FAILED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner />
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Applied Jobs</h1>
          <p className="text-muted-foreground mt-1">
            View all your submitted applications with details
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Applied
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Submitted
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {applications.filter((a) => a.status === "SUBMITTED").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {applications.filter((a) => a.status === "FAILED").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-lg">No applications yet</p>
                  <p className="text-muted-foreground/70 text-sm mt-2">
                    Start the workflow to apply to jobs automatically
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            applications.map((app) => (
              <Card
                key={app._id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/applied/${app._id}`)}
              >
                {!app.jobId ? (
                  <CardContent className="py-6">
                    <p className="text-muted-foreground text-sm">
                      Job details not available
                    </p>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant={getStatusVariant(app.status)} className="shrink-0">
                          {app.status}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {app.jobId.title}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">{app.jobId.company}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{app.jobId.location}</span>
                          </div>
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {app.jobId.isRemote && (
                          <Badge variant="secondary" className="text-xs">Remote</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {app.jobId.employmentType}
                        </Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Resume:</span>
                          <span className="font-medium text-foreground truncate ml-2">
                            {app.resumeVariantUsed}
                          </span>
                        </div>
                        {app.validationState && (
                          <div className="flex items-center justify-between">
                            <span>Confidence:</span>
                            <span
                              className={`font-medium ${
                                app.validationState.confidenceScore >= 70
                                  ? "text-green-600"
                                  : app.validationState.confidenceScore >= 50
                                    ? "text-yellow-600"
                                    : "text-orange-600"
                              }`}
                            >
                              {app.validationState.confidenceScore}%
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
