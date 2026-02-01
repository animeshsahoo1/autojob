"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle,
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

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card>
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
              <Card key={app._id} className="overflow-hidden">
                {/* Skip if job was deleted */}
                {!app.jobId ? (
                  <CardContent className="py-6">
                    <p className="text-muted-foreground">
                      Job details not available (deleted)
                    </p>
                  </CardContent>
                ) : (
                  <>
                    {/* Application Header */}
                    <CardHeader
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() =>
                        setExpandedApp(expandedApp === app._id ? null : app._id)
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <Briefcase className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{app.jobId.title}</CardTitle>
                              <Badge variant={getStatusVariant(app.status)}>
                                {app.status}
                              </Badge>
                            </div>
                            <CardDescription className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                <span>{app.jobId.company}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {app.jobId.location}
                                </span>
                                {app.jobId.isRemote && (
                                  <Badge variant="secondary">Remote</Badge>
                                )}
                                <Badge variant="outline">{app.jobId.employmentType}</Badge>
                              </div>
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-sm text-muted-foreground">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                          {expandedApp === app._id ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-3">
                        <span className="flex items-center gap-1">
                          Resume: <span className="font-medium">{app.resumeVariantUsed}</span>
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span>Attempts: {app.attempts}</span>
                        {app.validationState && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <span
                              className={`font-medium ${
                                app.validationState.confidenceScore >= 70
                                  ? "text-green-600"
                                  : app.validationState.confidenceScore >= 50
                                    ? "text-yellow-600"
                                    : "text-orange-600"
                              }`}
                            >
                              Confidence: {app.validationState.confidenceScore}%
                            </span>
                          </>
                        )}
                        {app.receipt && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Receipt: {app.receipt.substring(0, 12)}...
                            </span>
                          </>
                        )}
                      </div>
                    </CardHeader>

                    {/* Expanded Details */}
                    {expandedApp === app._id && (
                      <CardContent className="border-t bg-accent/20 space-y-6">
                        {/* Validation Details */}
                        {app.validationState && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">AI Validation Results</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Confidence Score
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-secondary rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          app.validationState.confidenceScore >= 70
                                            ? "bg-green-500"
                                            : app.validationState.confidenceScore >= 50
                                              ? "bg-yellow-500"
                                              : "bg-orange-500"
                                        }`}
                                        style={{
                                          width: `${app.validationState.confidenceScore}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-bold">
                                      {app.validationState.confidenceScore}%
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Grounded in Profile
                                  </p>
                                  <p
                                    className={`text-sm font-semibold ${
                                      app.validationState.isGrounded
                                        ? "text-green-600"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {app.validationState.isGrounded ? (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Yes
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        <XCircle className="w-4 h-4" /> No
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Issues Detected
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {app.validationState.hallucinationRisks.length} warnings
                                  </p>
                                </div>
                              </div>
                              {app.validationState.hallucinationRisks.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Validation Warnings:
                                  </p>
                                  <ul className="space-y-1">
                                    {app.validationState.hallucinationRisks.map((risk, idx) => (
                                      <li
                                        key={idx}
                                        className="text-xs text-orange-700 flex items-start gap-2"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                        <span>{risk}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Job Description */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Job Description
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {app.jobId.description}
                          </p>
                        </div>

                        {/* Requirements */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Requirements
                          </h4>
                          <ul className="space-y-1">
                            {app.jobId.requirements.map((req, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Skills */}
                        <div>
                          <h4 className="font-semibold mb-2">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {app.jobId.skills.map((skill, idx) => (
                              <Badge key={idx} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Answered Questions */}
                        {app.answeredQuestions && app.answeredQuestions.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3">
                              Screening Questions & Answers
                            </h4>
                            <div className="space-y-3">
                              {app.answeredQuestions.map((qa, idx) => (
                                <Card key={idx}>
                                  <CardContent className="py-4">
                                    <p className="font-medium mb-2">Q: {qa.question}</p>
                                    <p className="text-sm text-muted-foreground">A: {qa.answer}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div>
                          <h4 className="font-semibold mb-3">Application Timeline</h4>
                          <div className="space-y-3">
                            {app.timeline.map((event, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{event.stage}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </p>
                                  {event.message && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {event.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Error Message */}
                        {app.error && (
                          <Card className="border-destructive/50 bg-destructive/5">
                            <CardHeader>
                              <CardTitle className="text-base text-destructive flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                Error Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-destructive">{app.error}</p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Apply URL */}
                        <div>
                          <Button asChild>
                            <a
                              href={app.jobId.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Original Job Posting
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    )}
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
