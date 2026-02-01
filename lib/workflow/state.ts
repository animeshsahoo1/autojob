import { Annotation } from "@langchain/langgraph";
import mongoose from "mongoose";

/* ---------- Sub-states ---------- */

export type StudentProfile = {
  education: string[];
  skills: string[];
  projects: string[];
  experience: string[];
  links: string[];
};

export type ApplyPolicy = {
  maxApplicationsPerDay: number;
  minMatchScore: number;
  allowedLocations: string[];
  remoteOnly?: boolean;
  visaRequired?: boolean;
  blockedCompanies: string[];
  blockedRoles: string[];
  companyCooldownDays: number;
  killSwitch: boolean;
};

export type ArtifactState = {
  studentProfile?: StudentProfile;
  bulletBank?: string[];
  proofLinks?: string[];
  resumeVariants?: {
    name: string;
    url: string;
  }[];
  baseResumeUrl?: string;
};

export type JobSearchState = {
  fetchedJobIds: string[];
  totalJobsFound: number;
  deduplicatedCount: number;
};

export type RankingState = {
  rankedJobIds: string[];
  jobMatchMap: Record<
    string,
    {
      matchScore: number;
      skillOverlapScore: number;
      experienceFitScore: number;
      constraintFitScore: number;
      evidenceCoverage: number;
      rankingReason: string;
    }
  >;
};

export type PolicyState = {
  allowedJobIds: string[];
  skippedJobIds: string[];
  skipReasons: Record<string, string>; // jobId -> reason
  appliedCountToday: number;
  policiesChecked: string[];
};

export type QueueState = {
  queuedJobIds: string[];
  skippedJobIds: string[];
  cooldownJobIds: string[];
};

export type PersonalizationState = {
  currentJobId?: string;
  resumeVariantUsed?: string;
  requirementEvidenceMap?: Record<string, string>;
  confidenceLevels?: {
    strong: number;
    medium: number;
    weak: number;
  };
  generatedCoverLetter?: string;
  answeredQuestions?: {
    question: string;
    answer: string;
  }[];
};

export type ValidationState = {
  isGrounded: boolean;
  hallucinationRisks: string[];
  confidenceScore: number;
  validationPassed: boolean;
};

export type ApplyResultState = {
  applicationId?: string;
  applyStatus?: "SUBMITTED" | "FAILED" | "RETRIED";
  receipt?: string;
  error?: string;
  attempts: number;
};

export type LogState = {
  logsWritten: number;
  lastLogId?: string;
};

/* ---------- Main Agent State ---------- */

export const JobApplyAgentStateAnnotation = Annotation.Root({
  /* identity */
  agentRunId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),

  /* control */
  stopRequested: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  lastCheckpoint: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  runStatus: Annotation<
    "RUNNING" | "STOPPED" | "COMPLETED" | "FAILED" | undefined
  >({
    reducer: (x, y) => y ?? x,
    default: () => "RUNNING",
  }),

  /* user data */
  userEmail: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  applyPolicy: Annotation<ApplyPolicy | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  /* artifacts */
  artifactState: Annotation<ArtifactState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  /* jobs */
  jobSearchState: Annotation<JobSearchState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  rankingState: Annotation<RankingState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  policyState: Annotation<PolicyState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  queueState: Annotation<QueueState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  /* per-job execution */
  personalizationState: Annotation<PersonalizationState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  validationState: Annotation<ValidationState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  applyResultState: Annotation<ApplyResultState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  logState: Annotation<LogState | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),

  /* errors */
  errors: Annotation<string[]>({
    reducer: (x, y) => [...(x ?? []), ...(y ?? [])],
    default: () => [],
  }),
});

export type JobApplyAgentState = typeof JobApplyAgentStateAnnotation.State;
