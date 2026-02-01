"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import ResumeEditForm from "@/components/ResumeEditForm";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";
import type { IResume } from "@/models/resume.model";

type ResumeData = Partial<IResume> & {
  _id: string;
  fileUrl?: string;
  parsedDate?: string;
  lastUpdated?: string;
  createdAt?: string;
};

export default function ResumeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    if (status === "authenticated" && id) {
      fetchResume();
    }
  }, [status, router, id]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/resume/${id}`);
      const data = await response.json();

      if (data.success) {
        setResume(data.data);
      } else {
        setError(data.error || "Failed to fetch resume");
      }
    } catch (err) {
      setError("Failed to fetch resume");
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

  const handleSaveSuccess = () => {
    fetchResume();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner />
          <span>Loading resume...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/my-resumes")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Resumes
          </Button>
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/my-resumes")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Resumes
          </Button>
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Resume not found</h3>
              <p className="text-muted-foreground">
                This resume may have been deleted or you don&apos;t have access to it.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/my-resumes")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Resumes
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {resume.personalInfo?.fullName || "Untitled Resume"}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  Last updated: {formatDate(resume.lastUpdated || resume.createdAt)}
                </p>
              </div>
            </div>
            {resume.fileUrl && (
              <Badge variant="secondary">
                {resume.fileUrl.split("/").pop()}
              </Badge>
            )}
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Resume Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Resume
            </CardTitle>
            <CardDescription>
              Update your resume information. Changes will be saved to your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeEditForm
              initialData={{
                personalInfo: resume.personalInfo,
                summary: resume.summary,
                education: resume.education,
                workExperience: resume.workExperience,
                skills: resume.skills,
              }}
              onSave={handleSaveSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
