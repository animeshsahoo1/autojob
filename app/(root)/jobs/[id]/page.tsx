"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Building2, 
  Clock, 
  Send, 
  ExternalLink,
  FileText,
  CheckCircle2,
  Globe
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  isRemote?: boolean;
  description: string;
  requirements?: string[];
  skills: string[];
  employmentType?: string;
  startDate?: string;
  source?: string;
  externalJobId?: string;
  applyUrl?: string;
  questions?: {
    question: string;
    answer?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${id}`);
      const data = await response.json();

      if (data.success) {
        setJob(data.data);
      } else {
        setError(data.error || "Failed to fetch job");
      }
    } catch (err) {
      setError("Failed to fetch job");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner />
          <span>Loading job details...</span>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/jobs")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error || "Job not found"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/jobs")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-4 rounded-lg bg-primary/10 shrink-0">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    {job.source && (
                      <Badge variant="outline">{job.source}</Badge>
                    )}
                  </div>
                  <CardDescription className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="text-base">{job.company}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                        {job.isRemote && " (Remote)"}
                      </span>
                      {job.employmentType && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4" />
                          <span className="capitalize">{job.employmentType}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Posted {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleApply}
                disabled={applying}
                size="lg"
                className="shrink-0 gap-2"
              >
                {applying ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Auto Apply
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Questions */}
            {job.questions && job.questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Application Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.questions.map((q, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="font-medium">{q.question}</p>
                        {q.answer && (
                          <p className="text-sm text-muted-foreground pl-4 border-l-2 border-primary">
                            {q.answer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {job.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.startDate && (
                  <div>
                    <p className="text-sm font-medium mb-1">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(job.startDate)}
                    </p>
                  </div>
                )}
                {job.externalJobId && (
                  <div>
                    <p className="text-sm font-medium mb-1">Job ID</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {job.externalJobId}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-1">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(job.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* External Link */}
            {job.applyUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">External Application</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(job.applyUrl, "_blank")}
                  >
                    <Globe className="h-4 w-4" />
                    Apply on External Site
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
