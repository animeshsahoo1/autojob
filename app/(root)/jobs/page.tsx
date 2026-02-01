"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Briefcase, MapPin, Building2, Clock, Send, ExternalLink } from "lucide-react";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  isRemote?: boolean;
  description: string;
  skills: string[];
  employmentType?: string;
  requirements?: string[];
  source?: string;
  createdAt: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplying(jobId);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
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
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner />
          <span>Loading jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Browse Jobs</h1>
          <p className="text-muted-foreground mt-1">
            {jobs.length} position{jobs.length !== 1 ? "s" : ""} available
          </p>
        </div>

        <Separator className="mb-8" />

        {/* Job Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card 
              key={job._id} 
              className="hover:bg-accent/50 transition-colors cursor-pointer flex flex-col h-full"
              onClick={() => router.push(`/jobs/${job._id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  {job.source && (
                    <Badge variant="outline" className="text-xs">
                      {job.source}
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
                    <span className="truncate">
                      {job.location}
                      {job.isRemote && " (Remote)"}
                    </span>
                  </div>
                  {job.employmentType && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="capitalize">{job.employmentType}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {job.description}
                </p>

                <div className="space-y-3">
                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 4).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/jobs/${job._id}`);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(job._id);
                      }}
                      disabled={applying === job._id}
                      size="sm"
                      className="flex-1 gap-1.5"
                    >
                      {applying === job._id ? (
                        <>
                          <Spinner className="h-3.5 w-3.5" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          Apply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {jobs.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs available</h3>
              <p className="text-muted-foreground">
                Check back later for new opportunities
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
