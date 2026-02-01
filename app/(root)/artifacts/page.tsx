"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  GraduationCap,
  Code,
  Link as LinkIcon,
  Loader2,
  Edit3,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Settings,
} from "lucide-react";

export default function ArtifactsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artifacts, setArtifacts] = useState<any>(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      const response = await fetch("/api/artifacts/generate");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to load artifacts. Please upload a resume first."
        );
      }

      setArtifacts(data.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
          <p className="text-gray-400">Loading your artifact pack...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg">
            <p className="font-semibold mb-2">Error Loading Artifacts</p>
            <p className="text-sm">{error}</p>
            <a
              href="/resume"
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm transition-colors"
            >
              Upload Resume
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!artifacts) return null;

  const { studentProfile, resumeArtifacts, applyPolicy } = artifacts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20 pb-12">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Artifact Pack</h1>
            <p className="text-gray-400">
              AI-generated profile ready for job applications
            </p>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 px-4 py-2 rounded-lg transition-colors"
          >
            {editMode ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Edit Mode
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Education */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold">Education</h2>
            </div>
            <div className="space-y-2">
              {studentProfile?.education?.map((edu: string, i: number) => (
                <div
                  key={i}
                  className="bg-black/20 px-3 py-2 rounded text-sm text-gray-300"
                >
                  {edu}
                </div>
              ))}
              {(!studentProfile?.education ||
                studentProfile.education.length === 0) && (
                <p className="text-gray-500 text-sm">No education data</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold">Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {studentProfile?.skills?.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="bg-purple-600/20 border border-purple-500/30 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
              {(!studentProfile?.skills ||
                studentProfile.skills.length === 0) && (
                <p className="text-gray-500 text-sm">No skills data</p>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold">Experience</h2>
            </div>
            <div className="space-y-3">
              {studentProfile?.experience?.map((exp: string, i: number) => (
                <div
                  key={i}
                  className="bg-black/20 px-4 py-3 rounded text-sm text-gray-300"
                >
                  {exp}
                </div>
              ))}
              {(!studentProfile?.experience ||
                studentProfile.experience.length === 0) && (
                <p className="text-gray-500 text-sm">No experience data</p>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold">Projects</h2>
            </div>
            <div className="space-y-3">
              {studentProfile?.projects?.map((project: string, i: number) => (
                <div
                  key={i}
                  className="bg-black/20 px-4 py-3 rounded text-sm text-gray-300"
                >
                  {project}
                </div>
              ))}
              {(!studentProfile?.projects ||
                studentProfile.projects.length === 0) && (
                <p className="text-gray-500 text-sm">No projects data</p>
              )}
            </div>
          </div>

          {/* Bullet Bank */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-semibold">
                Bullet Bank{" "}
                <span className="text-sm text-gray-400">
                  ({resumeArtifacts?.bulletBank?.length || 0} bullets)
                </span>
              </h2>
            </div>
            <div className="space-y-2">
              {resumeArtifacts?.bulletBank?.map((bullet: string, i: number) => (
                <div
                  key={i}
                  className="bg-black/20 px-4 py-2 rounded text-sm text-gray-300 flex items-start gap-2"
                >
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>{bullet}</span>
                </div>
              ))}
              {(!resumeArtifacts?.bulletBank ||
                resumeArtifacts.bulletBank.length === 0) && (
                <p className="text-gray-500 text-sm">No bullets generated</p>
              )}
            </div>
          </div>

          {/* Proof Links */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold">
                Proof Pack{" "}
                <span className="text-sm text-gray-400">
                  ({resumeArtifacts?.proofLinks?.length || 0} links)
                </span>
              </h2>
            </div>
            <div className="space-y-2">
              {resumeArtifacts?.proofLinks?.map((link: string, i: number) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/20 px-4 py-2 rounded text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  {link}
                </a>
              ))}
              {(!resumeArtifacts?.proofLinks ||
                resumeArtifacts.proofLinks.length === 0) && (
                <p className="text-gray-500 text-sm">No proof links found</p>
              )}
            </div>
          </div>

          {/* Apply Policy */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold">Apply Policy</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/20 px-4 py-3 rounded">
                <p className="text-xs text-gray-400 mb-1">Max Apps/Day</p>
                <p className="text-lg font-semibold">
                  {applyPolicy?.maxApplicationsPerDay || 10}
                </p>
              </div>
              <div className="bg-black/20 px-4 py-3 rounded">
                <p className="text-xs text-gray-400 mb-1">Min Match Score</p>
                <p className="text-lg font-semibold">
                  {applyPolicy?.minMatchScore || 60}%
                </p>
              </div>
              <div className="bg-black/20 px-4 py-3 rounded">
                <p className="text-xs text-gray-400 mb-1">Remote Only</p>
                <p className="text-lg font-semibold">
                  {applyPolicy?.remoteOnly ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/resume"
            className="bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 px-6 py-3 rounded-lg transition-colors"
          >
            Upload New Resume
          </a>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all">
            Start Job Search
          </button>
        </div>
      </div>
    </div>
  );
}
