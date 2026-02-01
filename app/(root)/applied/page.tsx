"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  FileText,
} from "lucide-react";

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    location: string;
    isRemote: boolean;
    employmentType: string;
    description: string;
    requirements: string[];
    skills: string[];
    applyUrl: string;
  };
  resumeVariantUsed: string;
  answeredQuestions?: { question: string; answer: string }[];
  validationState?: {
    confidenceScore: number;
    isGrounded: boolean;
    hallucinationRisks: string[];
  };
  status: "QUEUED" | "SUBMITTED" | "FAILED" | "RETRIED";
  receipt?: string;
  error?: string;
  attempts: number;
  createdAt: string;
  timeline: {
    stage: string;
    timestamp: string;
    message?: string;
  }[];
}

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications");
      const data = await response.json();
      // Filter out applications where job was deleted
      setApplications(
        (data.applications || []).filter((app: Application) => app.jobId),
      );
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-green-100 text-green-800 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Applied Jobs
          </h1>
          <p className="text-gray-600">
            View all your submitted applications with details
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Applied</p>
                <p className="text-3xl font-bold text-gray-900">
                  {applications.length}
                </p>
              </div>
              <FileText className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Submitted</p>
                <p className="text-3xl font-bold text-green-600">
                  {applications.filter((a) => a.status === "SUBMITTED").length}
                </p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">
                  {applications.filter((a) => a.status === "FAILED").length}
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No applications yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Start the workflow to apply to jobs automatically
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
              >
                {/* Skip if job was deleted */}
                {!app.jobId ? (
                  <div className="p-6">
                    <p className="text-gray-500">
                      Job details not available (deleted)
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Application Header */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() =>
                        setExpandedApp(expandedApp === app._id ? null : app._id)
                      }
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(app.status)}
                            <h3 className="text-xl font-bold text-gray-900">
                              {app.jobId.title}
                            </h3>
                          </div>
                          <p className="text-gray-600 text-lg mb-1">
                            {app.jobId.company}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>📍 {app.jobId.location}</span>
                            {app.jobId.isRemote && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Remote
                              </span>
                            )}
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {app.jobId.employmentType}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}
                          >
                            {app.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span>Resume: {app.resumeVariantUsed}</span>
                        <span>•</span>
                        <span>Attempts: {app.attempts}</span>
                        {app.validationState && (
                          <>
                            <span>•</span>
                            <span
                              className={`font-medium ${
                                app.validationState.confidenceScore >= 70
                                  ? "text-green-600"
                                  : app.validationState.confidenceScore >= 50
                                    ? "text-yellow-600"
                                    : "text-orange-600"
                              }`}
                            >
                              Confidence: {app.validationState.confidenceScore}%
                            </span>
                          </>
                        )}
                        {app.receipt && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">
                              ✓ Receipt: {app.receipt.substring(0, 12)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedApp === app._id && (
                      <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-6">
                        {/* Validation Details */}
                        {app.validationState && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">
                              AI Validation Results
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Confidence Score
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        app.validationState.confidenceScore >=
                                        70
                                          ? "bg-green-500"
                                          : app.validationState
                                                .confidenceScore >= 50
                                            ? "bg-yellow-500"
                                            : "bg-orange-500"
                                      }`}
                                      style={{
                                        width: `${app.validationState.confidenceScore}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">
                                    {app.validationState.confidenceScore}%
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Grounded in Profile
                                </p>
                                <p
                                  className={`text-sm font-semibold ${
                                    app.validationState.isGrounded
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {app.validationState.isGrounded
                                    ? "✓ Yes"
                                    : "✗ No"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Issues Detected
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {
                                    app.validationState.hallucinationRisks
                                      .length
                                  }{" "}
                                  warnings
                                </p>
                              </div>
                            </div>
                            {app.validationState.hallucinationRisks.length >
                              0 && (
                              <div className="mt-4">
                                <p className="text-xs text-gray-500 mb-2">
                                  Validation Warnings:
                                </p>
                                <ul className="space-y-1">
                                  {app.validationState.hallucinationRisks.map(
                                    (risk, idx) => (
                                      <li
                                        key={idx}
                                        className="text-xs text-orange-700 flex items-start gap-2"
                                      >
                                        <span className="text-orange-500">
                                          ⚠️
                                        </span>
                                        <span>{risk}</span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Job Description */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Job Description
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {app.jobId.description}
                          </p>
                        </div>

                        {/* Requirements */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Requirements
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {app.jobId.requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Skills */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Required Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {app.jobId.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Answered Questions */}
                        {app.answeredQuestions &&
                          app.answeredQuestions.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">
                                Screening Questions & Answers
                              </h4>
                              <div className="space-y-4">
                                {app.answeredQuestions.map((qa, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white p-4 rounded-lg border border-gray-200"
                                  >
                                    <p className="font-medium text-gray-900 mb-2">
                                      Q: {qa.question}
                                    </p>
                                    <p className="text-gray-700 text-sm">
                                      A: {qa.answer}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Timeline */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Application Timeline
                          </h4>
                          <div className="space-y-3">
                            {app.timeline.map((event, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {event.stage}
                                  </p>
                                  <p className="text-gray-600 text-xs">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </p>
                                  {event.message && (
                                    <p className="text-gray-500 text-xs mt-1">
                                      {event.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Error Message */}
                        {app.error && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-900 mb-2">
                              Error Details
                            </h4>
                            <p className="text-red-700 text-sm">{app.error}</p>
                          </div>
                        )}

                        {/* Apply URL */}
                        <div>
                          <a
                            href={app.jobId.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Original Job Posting
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
