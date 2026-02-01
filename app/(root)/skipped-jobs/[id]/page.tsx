"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  DollarSign,
  Sparkles,
  XCircle,
  BarChart3,
  Lightbulb,
  BookOpen,
  FolderCode,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: { min: number; max: number; currency: string };
  skills: string[];
  requirements: string[];
  description?: string;
  jobType: string;
  applyUrl?: string;
}

interface Analysis {
  skipReason: string;
  skipReasoning: string;
  missingSkills: string[];
  missingExperience: string[];
  suggestions: {
    skillsToLearn: string[];
    projectsToAdd: string[];
    resumeImprovements: string[];
  };
  analyzedAt: string;
}

export default function SkippedJobDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const id = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    if (!session?.user?.id || !id) return;
    fetchJobData();
  }, [session, id]);

  const fetchJobData = async () => {
    try {
      setLoading(true);

      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${id}`);
      const jobData = await jobResponse.json();
      setJob(jobData.data);

      // Fetch AI analysis
      const analysisResponse = await fetch(
        `/api/jobs/${id}/analysis?userId=${session?.user?.id}`,
      );
      const analysisData = await analysisResponse.json();
      setAnalysis(analysisData.analysis);
    } catch (error) {
      console.error("Failed to fetch job data:", error);
    } finally {
      setLoading(false);
    }
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

  if (!job || !analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12">
            <div className="text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Job not found</p>
              <Button asChild>
                <Link href="/skipped-jobs">Back to Skipped Jobs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalGaps = analysis.missingSkills.length + analysis.missingExperience.length;
  const totalSuggestions = analysis.suggestions.skillsToLearn.length + 
                          analysis.suggestions.projectsToAdd.length + 
                          analysis.suggestions.resumeImprovements.length;

  const handleFeedback = (shouldHaveBeenSkipped: boolean) => {
    if (shouldHaveBeenSkipped) {
      setFeedbackMessage("Thanks for your feedback!");
    } else {
      setFeedbackMessage("Okay memory updated, from next time, jobs like this would not be skipped.");
    }
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/skipped-jobs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Skipped Jobs
          </Link>
        </Button>

        {/* Job Header - Full Width */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                  <CardDescription className="text-base space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="destructive" className="shrink-0 h-fit">
                Skipped
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{job.location}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="capitalize">{job.jobType}</span>
              </div>
              {job.salary && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5 text-green-600 font-medium">
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <span>
                      {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Summary - Full Width */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Skip Analysis
                </CardTitle>
                <CardDescription className="mt-1">
                  Generated by GPT-4o-mini on {new Date(analysis.analyzedAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {totalGaps} Gaps
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {totalSuggestions} Tips
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{analysis.skipReasoning}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gap Analysis Column */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Gap Analysis
              </h2>
              
              {/* Missing Skills */}
              {analysis.missingSkills.length > 0 && (
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      Missing Skills ({analysis.missingSkills.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.missingSkills.map((skill, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="text-muted-foreground">{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Missing Experience */}
              {analysis.missingExperience.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-500" />
                      Experience Gaps ({analysis.missingExperience.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.missingExperience.map((exp, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="text-muted-foreground">{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Improvement Suggestions Column */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-green-600" />
                Improvement Roadmap
              </h2>

              {/* Skills to Learn */}
              {analysis.suggestions.skillsToLearn.length > 0 && (
                <Card className="mb-4 border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      Skills to Learn ({analysis.suggestions.skillsToLearn.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.suggestions.skillsToLearn.map((skill, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="text-muted-foreground">{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Projects to Build */}
              {analysis.suggestions.projectsToAdd.length > 0 && (
                <Card className="mb-4 border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FolderCode className="w-4 h-4 text-blue-600" />
                      Projects to Build ({analysis.suggestions.projectsToAdd.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.suggestions.projectsToAdd.map((project, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="text-muted-foreground">{project}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Resume Tips */}
              {analysis.suggestions.resumeImprovements.length > 0 && (
                <Card className="border-purple-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Resume Tips ({analysis.suggestions.resumeImprovements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.suggestions.resumeImprovements.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {index + 1}
                          </Badge>
                          <span className="text-muted-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Job Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description */}
          {job.description && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Required Skills */}
          <Card className={job.description ? "" : "lg:col-span-3"}>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
              <CardDescription>
                {job.skills.length} skill{job.skills.length !== 1 ? 's' : ''} required for this role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Requirements
                </CardTitle>
                <CardDescription>
                  Key qualifications and expectations for this position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
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
