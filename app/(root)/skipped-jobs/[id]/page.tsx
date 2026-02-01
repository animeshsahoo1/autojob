"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
      <div className="p-8">
        <div className="text-center py-12">Loading job details...</div>
      </div>
    );
  }

  if (!job || !analysis) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Job not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link
        href="/skipped-jobs"
        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
      >
        ← Back to skipped jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <p className="text-xl text-gray-700 mb-3">{job.company}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>📍 {job.location}</span>
              <span>💼 {job.jobType}</span>
              {job.salary && (
                <span className="text-green-600">
                  💰 {job.salary.currency}
                  {job.salary.min.toLocaleString()} -{" "}
                  {job.salary.max.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {job.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Skills */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Analysis */}
        <div className="lg:col-span-1 space-y-6">
          {/* Skip Reasoning */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-semibold">AI Analysis</h2>
            </div>
            <p className="text-gray-700 mb-4">{analysis.skipReasoning}</p>
            <p className="text-xs text-gray-500">
              Generated by GPT-4o-mini on{" "}
              {new Date(analysis.analyzedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Missing Skills */}
          {analysis.missingSkills.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>❌</span> Missing Skills
              </h3>
              <ul className="space-y-2">
                {analysis.missingSkills.map((skill, index) => (
                  <li key={index} className="text-sm text-gray-700 pl-4">
                    • {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Experience */}
          {analysis.missingExperience.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>📊</span> Experience Gaps
              </h3>
              <ul className="space-y-2">
                {analysis.missingExperience.map((exp, index) => (
                  <li key={index} className="text-sm text-gray-700 pl-4">
                    • {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 border-2 border-green-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
              <span>💡</span> How to Improve
            </h3>

            {/* Skills to Learn */}
            {analysis.suggestions.skillsToLearn.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  📚 Skills to Learn:
                </h4>
                <ul className="space-y-1">
                  {analysis.suggestions.skillsToLearn.map((skill, index) => (
                    <li key={index} className="text-sm text-gray-600 pl-4">
                      • {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Projects to Add */}
            {analysis.suggestions.projectsToAdd.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  💼 Projects to Build:
                </h4>
                <ul className="space-y-1">
                  {analysis.suggestions.projectsToAdd.map((project, index) => (
                    <li key={index} className="text-sm text-gray-600 pl-4">
                      • {project}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resume Improvements */}
            {analysis.suggestions.resumeImprovements.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">
                  📝 Resume Tips:
                </h4>
                <ul className="space-y-1">
                  {analysis.suggestions.resumeImprovements.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 pl-4">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
