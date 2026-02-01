"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ResumeEditForm from "@/components/ResumeEditForm";

export default function OnboardingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setResult(null);

    // Validate file
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

      setResult(data.data);
      console.log("Parsed resume:", data.data);
      
      // Show editor after successful parsing
      if (data.data.extractedData) {
        setShowEditor(true);
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

  if (showEditor && result?.extractedData) {
    return (
      <div className="min-h-screen bg-black text-white pt-20 pb-12 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-fuchsia-600/20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>
        
        {/* Spotlight effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-600/30 rounded-full blur-[120px] animate-pulse"></div>
        
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">AI-Powered Extraction</span>
            </div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white via-violet-200 to-purple-200 bg-clip-text text-transparent">
              Edit Your Resume
            </h1>
            <p className="text-gray-400 text-lg">
              Review and edit the extracted information
            </p>
          </div>
          
          <div className="group bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-violet-500/20 transition-all duration-500">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-violet-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <ResumeEditForm 
                initialData={result.extractedData} 
                onSave={handleSaveComplete}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-fuchsia-600/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">AI-Powered Resume Parser</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-violet-200 to-purple-200 bg-clip-text text-transparent">
            Welcome to autojob
          </h1>
          <p className="text-gray-400 text-lg">
            Let's start by uploading your resume
          </p>
        </div>

        {/* Upload Card */}
        <div className="group bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-violet-500/20 transition-all duration-500">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-violet-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative space-y-6">
            {/* Upload Area */}
            <div className="relative border-2 border-dashed border-white/30 rounded-2xl p-12 text-center hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300 group/upload">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/0 via-purple-600/5 to-fuchsia-600/0 opacity-0 group-hover/upload:opacity-100 transition-opacity duration-500"></div>
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
                disabled={uploading}
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer flex flex-col items-center gap-4 relative"
              >
                <div className="relative">
                  {file ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-violet-500 rounded-full blur-xl opacity-50"></div>
                      <FileText className="w-20 h-20 text-violet-400 relative" />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gray-500 rounded-full blur-xl opacity-30 group-hover/upload:bg-violet-500 group-hover/upload:opacity-50 transition-all"></div>
                      <Upload className="w-20 h-20 text-gray-400 group-hover/upload:text-violet-400 transition-colors relative" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xl font-semibold mb-2 group-hover/upload:text-violet-200 transition-colors">
                    {file ? file.name : "Click to upload your resume"}
                  </p>
                  <p className="text-sm text-gray-400">
                    PDF files only • Max 10MB
                  </p>
                  {file && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                      <p className="text-xs text-violet-300">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="relative overflow-hidden bg-red-500/10 border border-red-500/30 text-red-300 px-5 py-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent"></div>
                <AlertCircle className="w-5 h-5 flex-shrink-0 relative" />
                <p className="text-sm relative">{error}</p>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="space-y-4">
                {/* Summary Card */}
                <div className="relative overflow-hidden bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-300 px-5 py-5 rounded-2xl backdrop-blur-sm">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(16,185,129,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]"></div>
                  <div className="flex items-center gap-3 mb-3 relative">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-50"></div>
                      <CheckCircle2 className="w-6 h-6 relative" />
                    </div>
                    <p className="font-semibold text-lg">Resume parsed successfully!</p>
                  </div>
                  <div className="text-sm space-y-1 text-green-200/80 relative">
                    <p>• Pages: {result.pageCount}</p>
                    <p>• Size: {(result.fileSize / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                {/* Extracted Data */}
                {result.extractedData && (
                  <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-violet-500 rounded-full blur-md opacity-50"></div>
                        <Sparkles className="w-5 h-5 text-violet-300 relative" />
                      </div>
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                        Extracted Information
                      </h3>
                    </div>

                    {/* Personal Info */}
                    {result.extractedData.personalInfo && (
                      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-violet-500/30 transition-colors">
                        <h4 className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-violet-500 rounded-full"></div>
                          Personal Information
                        </h4>
                        <div className="text-sm space-y-1 text-gray-300">
                          <p>
                            <strong>Name:</strong>{" "}
                            {result.extractedData.personalInfo.fullName}
                          </p>
                          <p>
                            <strong>Email:</strong>{" "}
                            {result.extractedData.personalInfo.email}
                          </p>
                          {result.extractedData.personalInfo.phone && (
                            <p>
                              <strong>Phone:</strong>{" "}
                              {result.extractedData.personalInfo.phone}
                            </p>
                          )}
                          {result.extractedData.personalInfo.linkedIn && (
                            <p>
                              <strong>LinkedIn:</strong>{" "}
                              <a
                                href={result.extractedData.personalInfo.linkedIn}
                                className="text-violet-400 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {result.extractedData.personalInfo.linkedIn}
                              </a>
                            </p>
                          )}
                          {result.extractedData.personalInfo.github && (
                            <p>
                              <strong>GitHub:</strong>{" "}
                              <a
                                href={result.extractedData.personalInfo.github}
                                className="text-violet-400 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {result.extractedData.personalInfo.github}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {result.extractedData.education &&
                      result.extractedData.education.length > 0 && (
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-blue-500/30 transition-colors">
                          <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                            🎓 Education ({result.extractedData.education.length})
                          </h4>
                          <div className="space-y-2">
                            {result.extractedData.education.map(
                              (edu: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-300 border-l-2 border-blue-500/30 pl-3"
                                >
                                  <p className="font-medium">{edu.degree}</p>
                                  <p className="text-gray-400">
                                    {edu.institution}
                                    {edu.major && ` • ${edu.major}`}
                                  </p>
                                  {edu.gpa && (
                                    <p className="text-xs text-gray-500">
                                      GPA: {edu.gpa}
                                      {edu.maxGpa && `/${edu.maxGpa}`}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Work Experience */}
                    {result.extractedData.workExperience &&
                      result.extractedData.workExperience.length > 0 && (
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition-colors">
                          <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                            💼 Work Experience ({result.extractedData.workExperience.length})
                          </h4>
                          <div className="space-y-2">
                            {result.extractedData.workExperience.map(
                              (exp: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-300 border-l-2 border-purple-500/30 pl-3"
                                >
                                  <p className="font-medium">{exp.position}</p>
                                  <p className="text-gray-400">
                                    {exp.company}
                                    {exp.location && ` • ${exp.location}`}
                                  </p>
                                  {exp.technologies &&
                                    exp.technologies.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {exp.technologies
                                          .slice(0, 5)
                                          .map((tech: string, i: number) => (
                                            <span
                                              key={i}
                                              className="text-xs bg-purple-500/20 px-2 py-0.5 rounded"
                                            >
                                              {tech}
                                            </span>
                                          ))}
                                        {exp.technologies.length > 5 && (
                                          <span className="text-xs text-gray-500">
                                            +{exp.technologies.length - 5} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Skills */}
                    {result.extractedData.skills &&
                      result.extractedData.skills.length > 0 && (
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-fuchsia-500/30 transition-colors">
                          <h4 className="text-sm font-semibold text-fuchsia-300 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-fuchsia-500 rounded-full"></div>
                            🚀 Skills
                          </h4>
                          <div className="space-y-2">
                            {result.extractedData.skills.map(
                              (skillGroup: any, idx: number) => (
                                <div key={idx} className="text-sm">
                                  <p className="font-medium text-gray-300 mb-1">
                                    {skillGroup.category}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {skillGroup.skills.map(
                                      (skill: string, i: number) => (
                                        <span
                                          key={i}
                                          className="text-xs bg-fuchsia-500/20 text-fuchsia-200 px-2 py-1 rounded"
                                        >
                                          {skill}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Projects */}
                    {result.extractedData.projects &&
                      result.extractedData.projects.length > 0 && (
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-green-500/30 transition-colors">
                          <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                            🛠️ Projects ({result.extractedData.projects.length})
                          </h4>
                          <div className="space-y-2">
                            {result.extractedData.projects.map(
                              (project: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-300 border-l-2 border-green-500/30 pl-3"
                                >
                                  <p className="font-medium">{project.name}</p>
                                  {project.description && (
                                    <p className="text-xs text-gray-400">
                                      {project.description}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Summary */}
                    {result.extractedData.summary && (
                      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-colors">
                        <h4 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                          📝 Summary
                        </h4>
                        <p className="text-sm text-gray-300">
                          {result.extractedData.summary}
                        </p>
                      </div>
                    )}

                    {/* Raw JSON Preview */}
                    <details className="mt-3 group/details">
                      <summary className="cursor-pointer text-sm font-medium text-violet-300 hover:text-violet-200 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-violet-500/30 transition-colors">
                        <Sparkles className="w-4 h-4" />
                        View full JSON data
                      </summary>
                      <div className="mt-2 p-4 bg-black/60 backdrop-blur-sm rounded-xl text-xs font-mono overflow-auto max-h-60 border border-white/10">
                        <pre className="text-gray-300">
                          {JSON.stringify(result.extractedData, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="relative w-full group/button overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:shadow-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover/button:translate-x-[200%] transition-transform duration-1000"></div>
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative" />
                  <span className="relative">Processing with AI...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 relative" />
                  <span className="relative">Parse Resume</span>
                </>
              )}
            </button>

            {/* Next Steps */}
            {result && (
              <div className="pt-6 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  AI will extract your:
                </p>
                <ul className="text-sm text-gray-300 space-y-3">
                  <li className="flex items-center gap-3 group/item">
                    <div className="w-2 h-2 bg-violet-400 rounded-full group-hover/item:scale-125 transition-transform"></div>
                    <span className="group-hover/item:text-violet-300 transition-colors">Skills & Technologies</span>
                  </li>
                  <li className="flex items-center gap-3 group/item">
                    <div className="w-2 h-2 bg-purple-400 rounded-full group-hover/item:scale-125 transition-transform"></div>
                    <span className="group-hover/item:text-purple-300 transition-colors">Education & Certifications</span>
                  </li>
                  <li className="flex items-center gap-3 group/item">
                    <div className="w-2 h-2 bg-fuchsia-400 rounded-full group-hover/item:scale-125 transition-transform"></div>
                    <span className="group-hover/item:text-fuchsia-300 transition-colors">Work Experience & Projects</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
