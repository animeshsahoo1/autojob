"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
    };
    return labels[reason] || reason;
  };

  const getSkipReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      POLICY_BLOCK: "bg-red-100 text-red-800",
      LOW_MATCH_SCORE: "bg-yellow-100 text-yellow-800",
      MISSING_EVIDENCE: "bg-orange-100 text-orange-800",
      COMPANY_COOLDOWN: "bg-purple-100 text-purple-800",
      DUPLICATE: "bg-gray-100 text-gray-800",
      KILL_SWITCH: "bg-red-100 text-red-800",
    };
    return colors[reason] || "bg-gray-100 text-gray-800";
  };

  if (!session) {
    return (
      <div className="p-8">
        <p>Please sign in to view skipped jobs</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Skipped Jobs</h1>
      <p className="text-gray-600 mb-6">
        Jobs that were automatically skipped during discovery. Click on any job
        to see AI analysis and suggestions for improvement.
      </p>

      {loading ? (
        <div className="text-center py-12">Loading skipped jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No skipped jobs found</p>
          <p className="text-sm text-gray-400 mt-2">
            Run the discovery workflow to see skipped jobs
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Link
              key={job._id}
              href={`/skipped-jobs/${job._id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{job.title}</h3>
                {job.hasAnalysis && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    AI Analysis
                  </span>
                )}
              </div>

              <p className="text-gray-600 mb-2">{job.company}</p>
              <p className="text-sm text-gray-500 mb-3">📍 {job.location}</p>

              {job.salary && (
                <p className="text-sm text-green-600 mb-3">
                  💰 {job.salary.currency}
                  {job.salary.min.toLocaleString()} -{" "}
                  {job.salary.max.toLocaleString()}
                </p>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {job.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{job.skills.length - 3} more
                  </span>
                )}
              </div>

              <div className="pt-3 border-t">
                <span
                  className={`text-xs px-2 py-1 rounded ${getSkipReasonColor(job.skipReason)}`}
                >
                  {getSkipReasonLabel(job.skipReason)}
                </span>
              </div>

              {job.skipReasoning && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                  {job.skipReasoning}
                </p>
              )}

              <div className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                View analysis →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
