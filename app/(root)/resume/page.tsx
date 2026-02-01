"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Code2,
  FolderKanban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ResumeEditForm from "@/components/ResumeEditForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  // Simulate progress during upload
  useEffect(() => {
    if (uploading) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(timer);
    } else {
      setProgress(0);
    }
  }, [uploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setResult(null);

    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload resume");
      }

      setProgress(100);
      setResult(data.data);

      if (data.data.extractedData) {
        setTimeout(() => setShowEditor(true), 300);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveComplete = () => {
    router.push("/dashboard");
  };

  // Editor view
  if (showEditor && result?.extractedData) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary">Step 2 of 2</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              Review Your Resume
            </h1>
            <p className="text-muted-foreground">
              Make any corrections to the extracted information below.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <ResumeEditForm
                initialData={result.extractedData}
                onSave={handleSaveComplete}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Upload view
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary">Step 1 of 2</Badge>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">
            Upload Resume
          </h1>
          <p className="text-muted-foreground text-lg">
            We'll extract your information using AI and let you review it.
          </p>
        </div>

        <div className="space-y-6">
          {/* Upload Card */}
          <Card>
            <CardContent className="pt-6">
              {uploading ? (
                // Processing state
                <Empty className="border-0 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Spinner className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>Processing your resume...</EmptyTitle>
                    <EmptyDescription>
                      Our AI is extracting your information. This usually takes 10-30 seconds.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Progress value={progress} className="w-full max-w-xs" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(progress)}% complete
                    </p>
                  </EmptyContent>
                </Empty>
              ) : !file ? (
                // Empty upload state
                <label htmlFor="resume-upload" className="cursor-pointer block">
                  <Empty className="border border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Upload />
                      </EmptyMedia>
                      <EmptyTitle>Upload your resume</EmptyTitle>
                      <EmptyDescription>
                        Click to browse or drag and drop your PDF file here.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <p className="text-xs text-muted-foreground">
                        PDF only • Max 10MB
                      </p>
                    </EmptyContent>
                  </Empty>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                    disabled={uploading}
                  />
                </label>
              ) : (
                // File selected state
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • PDF
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Change
                    </Button>
                  </div>

                  <Button onClick={handleUpload} className="w-full" size="lg">
                    <Upload className="w-4 h-4 mr-2" />
                    Parse Resume
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Upload failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Preview */}
          {result && !showEditor && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <CardTitle>Resume Parsed Successfully</CardTitle>
                </div>
                <CardDescription>
                  We found the following information in your resume.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.extractedData?.personalInfo && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {result.extractedData.personalInfo.fullName}
                      </h3>
                      <p className="text-muted-foreground">
                        {result.extractedData.personalInfo.email}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {result.extractedData?.education?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <span>{result.extractedData.education.length} education</span>
                    </div>
                  )}
                  {result.extractedData?.workExperience?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>{result.extractedData.workExperience.length} experiences</span>
                    </div>
                  )}
                  {result.extractedData?.skills?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Code2 className="w-4 h-4 text-muted-foreground" />
                      <span>{result.extractedData.skills.length} skill groups</span>
                    </div>
                  )}
                  {result.extractedData?.projects?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <FolderKanban className="w-4 h-4 text-muted-foreground" />
                      <span>{result.extractedData.projects.length} projects</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setShowEditor(true)}
                  className="w-full"
                  size="lg"
                >
                  Continue to Review
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Footer note */}
          <p className="text-center text-muted-foreground text-sm">
            Your resume is processed securely and never shared.
          </p>
        </div>
      </div>
    </div>
  );
}
