"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Welcome to autojob</h1>
          <p className="text-gray-400 text-lg">
            Let's start by uploading your resume
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-500/50 transition-all">
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
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                {file ? (
                  <FileText className="w-16 h-16 text-blue-400" />
                ) : (
                  <Upload className="w-16 h-16 text-gray-400" />
                )}
                <div>
                  <p className="text-lg font-semibold mb-1">
                    {file ? file.name : "Click to upload your resume"}
                  </p>
                  <p className="text-sm text-gray-400">
                    PDF files only • Max 10MB
                  </p>
                  {file && (
                    <p className="text-xs text-blue-400 mt-2">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-300 px-4 py-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-semibold">Resume parsed successfully!</p>
                </div>
                <div className="text-sm space-y-1 text-green-200/80">
                  <p>• Pages: {result.pageCount}</p>
                  <p>• Size: {(result.fileSize / 1024).toFixed(2)} KB</p>
                  <p>• Characters extracted: {result.rawText.length}</p>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium hover:text-green-200">
                    View preview
                  </summary>
                  <div className="mt-2 p-3 bg-black/20 rounded text-xs font-mono overflow-auto max-h-40">
                    {result.textPreview}
                  </div>
                </details>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Parse Resume
                </>
              )}
            </button>

            {/* Next Steps */}
            {result && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-3">
                  Next, we'll extract your:
                </p>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Skills & Technologies
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Education & Certifications
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Work Experience & Projects
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
