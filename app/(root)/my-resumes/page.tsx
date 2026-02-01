"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Plus, Trash2, ExternalLink, Calendar, User } from "lucide-react";

interface ResumeItem {
  _id: string;
  personalInfo?: {
    fullName?: string;
  };
  fileUrl?: string;
  parsedDate?: string;
  lastUpdated?: string;
  createdAt?: string;
}

export default function MyResumesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    if (status === "authenticated") {
      fetchResumes();
    }
  }, [status, router]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/resume/list");
      const data = await response.json();

      if (data.success) {
        setResumes(data.data);
      } else {
        setError(data.error || "Failed to fetch resumes");
      }
    } catch (err) {
      setError("Failed to fetch resumes");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      const response = await fetch(`/api/resume/${resumeId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setResumes(resumes.filter((r) => r._id !== resumeId));
      } else {
        alert(data.error || "Failed to delete resume");
      }
    } catch (err) {
      alert("Failed to delete resume");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Resumes</h1>
            <p className="text-muted-foreground mt-1">
              Manage your uploaded resumes
            </p>
          </div>
          <Button onClick={() => router.push("/resume")} className="gap-2">
            <Plus className="h-4 w-4" />
            Upload New
          </Button>
        </div>

        <Separator className="mb-8" />

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && resumes.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first resume to get started
              </p>
              <Button onClick={() => router.push("/resume")}>
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Resume List */}
        <div className="space-y-4">
          {resumes.map((resume) => (
            <Card key={resume._id} className="hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {resume.personalInfo?.fullName || "Untitled Resume"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        Updated {formatDate(resume.lastUpdated || resume.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {resume.fileUrl ? resume.fileUrl.split("/").pop() : "Parsed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/resume/${resume._id}`)}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View / Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(resume._id)}
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
