"use client";

import { useEffect, useState } from "react";
import { Briefcase, MapPin, Building2, Clock } from "lucide-react";

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  isRemote?: boolean;
  description: string;
  skills: string[];
  employmentType?: string;
  createdAt: string;
}

export default function JobsPage() {
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Available Jobs</h1>
          <p className="text-gray-400">{jobs.length} positions found</p>
        </div>

        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{job.title}</h2>
                  <div className="flex flex-wrap gap-4 text-gray-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{job.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {job.location}
                        {job.isRemote && " (Remote)"}
                      </span>
                    </div>
                    {job.employmentType && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="capitalize">{job.employmentType}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleApply(job._id)}
                  disabled={applying === job._id}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  {applying === job._id ? "Applying..." : "Auto Apply"}
                </button>
              </div>

              <p className="text-gray-300 mb-4 line-clamp-3">
                {job.description}
              </p>

              {job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.skills.slice(0, 8).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 8 && (
                    <span className="px-3 py-1 text-gray-400 text-sm">
                      +{job.skills.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-xl">No jobs available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
