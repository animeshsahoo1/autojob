"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Briefcase,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  Clock,
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

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await fetch("/api/applications");
      const data = await response.json();
      const app = data.applications?.find((a: Application) => a._id === params.id);
      setApplication(app || null);
    } catch (error) {
      console.error("Error fetching application:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (shouldHaveBeenSkipped: boolean) => {
    if (shouldHaveBeenSkipped) {
      setFeedbackMessage("Thanks for your feedback!");
    } else {
      setFeedbackMessage("Great! We're glad this application was helpful.");
    }
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
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
          <span>Loading application details...</span>
        </div>
      </div>
    );
  }

  if (!application || !application.jobId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground text-lg">Application not found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <CardTitle className="text-2xl">{application.jobId.title}</CardTitle>
                    <Badge variant={getStatusVariant(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                  <CardDescription className="space-y-2 text-base">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      <span className="font-semibold">{application.jobId.company}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {application.jobId.location}
                      </span>
                      {application.jobId.isRemote && (
                        <Badge variant="secondary">Remote</Badge>
                      )}
                      <Badge variant="outline">{application.jobId.employmentType}</Badge>
                    </div>
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(application.createdAt).toLocaleDateString()}
                </div>
                <Button asChild size="sm">
                  <a
                    href={application.jobId.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Job Posting
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Resume Used</p>
                <p className="font-semibold">{application.resumeVariantUsed}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Attempts</p>
                <p className="font-semibold">{application.attempts}</p>
              </div>
              {application.validationState && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                  <p
                    className={`font-semibold ${
                      application.validationState.confidenceScore >= 70
                        ? "text-green-600"
                        : application.validationState.confidenceScore >= 50
                          ? "text-yellow-600"
                          : "text-orange-600"
                    }`}
                  >
                    {application.validationState.confidenceScore}%
                  </p>
                </div>
              )}
              {application.receipt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Receipt ID</p>
                  <p className="font-mono text-xs text-green-600 truncate">
                    {application.receipt}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Validation Results */}
            {application.validationState && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    AI Validation Results
                  </CardTitle>
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
                            className={`h-2 rounded-full transition-all ${
                              application.validationState.confidenceScore >= 70
                                ? "bg-green-500"
                                : application.validationState.confidenceScore >= 50
                                  ? "bg-yellow-500"
                                  : "bg-orange-500"
                            }`}
                            style={{
                              width: `${application.validationState.confidenceScore}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">
                          {application.validationState.confidenceScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Grounded in Profile
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          application.validationState.isGrounded
                            ? "text-green-600"
                            : "text-destructive"
                        }`}
                      >
                        {application.validationState.isGrounded ? (
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
                        {application.validationState.hallucinationRisks.length} warnings
                      </p>
                    </div>
                  </div>
                  {application.validationState.hallucinationRisks.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-3">
                          Validation Warnings:
                        </p>
                        <ul className="space-y-2">
                          {application.validationState.hallucinationRisks.map((risk, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-orange-700 flex items-start gap-2 p-2 bg-orange-50 rounded-md"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {application.jobId.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {application.jobId.requirements.map((req, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {application.jobId.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Screening Questions */}
            {application.answeredQuestions && application.answeredQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Screening Questions & Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.answeredQuestions.map((qa, idx) => (
                      <div key={idx} className="p-4 bg-accent/50 rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Q: {qa.question}</p>
                        <p className="text-sm text-muted-foreground">A: {qa.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {application.error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Error Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-destructive font-mono">{application.error}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Application Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.timeline.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 relative">
                      {idx !== application.timeline.length - 1 && (
                        <div className="absolute left-1 top-6 bottom-0 w-0.5 bg-border"></div>
                      )}
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0 z-10"></div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm">{event.stage}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.message && (
                          <p className="text-xs text-muted-foreground mt-1 p-2 bg-accent/50 rounded">
                            {event.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={getStatusVariant(application.status)}>
                    {application.status}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Applied</span>
                  <span className="text-sm font-medium">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Timeline Events</span>
                  <span className="text-sm font-medium">
                    {application.timeline.length}
                  </span>
                </div>
                {application.answeredQuestions && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Questions</span>
                      <span className="text-sm font-medium">
                        {application.answeredQuestions.length}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feedback Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Do you think this job should have been skipped?</CardTitle>
            <CardDescription>
              Help us improve our job matching algorithm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleFeedback(true)}
                variant="outline"
                className="flex-1"
              >
                Yes, it should be skipped
              </Button>
              <Button 
                onClick={() => handleFeedback(false)}
                variant="default"
                className="flex-1"
              >
                No, I'm interested in this
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Toast Message */}
        {showFeedback && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5">
            {feedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
}
