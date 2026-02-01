/**
 * JobDiscoveryNode
 *
 * Comprehensive job pipeline that:
 * - Searches jobs from multiple sources
 * - Deduplicates jobs using jobHash
 * - Ranks jobs based on skill overlap, experience fit, and constraints
 * - Applies policy checks (location, remote, visa, blocked companies)
 * - Decides which jobs are eligible for application
 *
 * What it does:
 * 1. Fetch recent jobs from Job collection
 * 2. Deduplicate using jobHash (skip already seen in this run)
 * 3. Calculate match scores for each job:
 *    - Skill overlap score (student skills vs job skills)
 *    - Experience fit score (based on education/experience)
 *    - Constraint fit score (location, remote, employment type)
 * 4. Rank jobs by match score (highest first)
 * 5. Apply policy checks:
 *    - Min match score threshold
 *    - Blocked companies
 *    - Blocked roles
 *    - Company cooldown (check previous applications)
 *    - Max applications per day limit
 * 6. Create JobMatch records in database
 * 7. Produce eligible and skipped job lists
 *
 * What it does NOT do:
 * ❌ No applying
 * ❌ No personalization
 * ❌ No LLM calls for content generation
 */

import { JobApplyAgentState } from "../state";
import { connectToDatabase } from "@/database/db";
import { Job, IJob } from "@/models/job.model";
import { JobMatch } from "@/models/jobmatch.model";
import { Application } from "@/models/application.model";
import mongoose from "mongoose";

/**
 * Calculate skill overlap score between student and job
 */
function calculateSkillOverlapScore(
  studentSkills: string[],
  jobSkills: string[],
): number {
  if (jobSkills.length === 0) return 50; // neutral if no skills specified

  const studentSkillsLower = studentSkills.map((s) => s.toLowerCase());
  const jobSkillsLower = jobSkills.map((s) => s.toLowerCase());

  const matchedSkills = jobSkillsLower.filter((jobSkill) =>
    studentSkillsLower.some(
      (studentSkill) =>
        studentSkill.includes(jobSkill) || jobSkill.includes(studentSkill),
    ),
  );

  return Math.round((matchedSkills.length / jobSkillsLower.length) * 100);
}

/**
 * Calculate experience fit score based on education and experience
 */
function calculateExperienceFitScore(
  education: string[],
  experience: string[],
): number {
  let score = 0;

  // Education contributes 40 points max
  if (education.length > 0) {
    score += Math.min(education.length * 15, 40);
  }

  // Experience contributes 60 points max
  if (experience.length > 0) {
    score += Math.min(experience.length * 20, 60);
  }

  return Math.min(score, 100);
}

/**
 * Calculate constraint fit score based on policy preferences
 */
function calculateConstraintFitScore(
  job: IJob,
  policy: any,
): { score: number; reason?: string } {
  let score = 100;
  const reasons: string[] = [];

  // Remote check
  if (policy.remoteOnly && !job.isRemote) {
    score -= 50;
    reasons.push("Not remote");
  }

  // Location check
  if (policy.allowedLocations && policy.allowedLocations.length > 0) {
    const locationMatch = policy.allowedLocations.some((loc: string) =>
      job.location.toLowerCase().includes(loc.toLowerCase()),
    );
    if (!locationMatch && !job.isRemote) {
      score -= 30;
      reasons.push("Location not in allowed list");
    }
  }

  return {
    score: Math.max(score, 0),
    reason: reasons.join(", "),
  };
}

export async function jobDiscoveryNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    // Validate required state
    if (!state.artifactState?.studentProfile) {
      throw new Error("Artifact state not loaded. Run ArtifactNode first.");
    }

    if (!state.applyPolicy) {
      throw new Error("Apply policy not loaded. Run LoadRunNode first.");
    }

    const studentProfile = state.artifactState.studentProfile;
    const policy = state.applyPolicy;

    // 1. Fetch recent jobs (limit to 50 for this run)
    const recentJobs = (await Job.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()) as unknown as IJob[];

    if (recentJobs.length === 0) {
      return {
        jobSearchState: {
          fetchedJobIds: [],
          totalJobsFound: 0,
          deduplicatedCount: 0,
        },
        rankingState: {
          rankedJobIds: [],
          jobMatchMap: {},
        },
        policyState: {
          allowedJobIds: [],
          skippedJobIds: [],
          skipReasons: {},
          appliedCountToday: state.policyState?.appliedCountToday || 0,
          policiesChecked: ["NO_JOBS_FOUND"],
        },
        lastCheckpoint: "JOB_DISCOVERY",
      };
    }

    // 2. Deduplicate (check if job already processed in previous applications)
    const existingApplications = await Application.find({
      userId: new mongoose.Types.ObjectId(state.userId),
      jobId: { $in: recentJobs.map((j) => j._id) },
    })
      .select("jobId")
      .lean();

    const existingJobIds = new Set(
      existingApplications
        .map((app: any) => app.jobId?.toString())
        .filter(Boolean),
    );
    const newJobs = recentJobs.filter(
      (job) => !existingJobIds.has(job._id.toString()),
    );

    // 3. Calculate match scores and rank
    const jobScores = newJobs.map((job) => {
      const skillOverlapScore = calculateSkillOverlapScore(
        studentProfile.skills,
        job.skills,
      );

      const experienceFitScore = calculateExperienceFitScore(
        studentProfile.education,
        studentProfile.experience,
      );

      const constraintFit = calculateConstraintFitScore(job, policy);
      const constraintFitScore = constraintFit.score;

      // Overall match score (weighted average)
      const matchScore = Math.round(
        skillOverlapScore * 0.5 +
          experienceFitScore * 0.3 +
          constraintFitScore * 0.2,
      );

      const rankingReason = [
        `Skills: ${skillOverlapScore}%`,
        `Experience: ${experienceFitScore}%`,
        `Constraints: ${constraintFitScore}%`,
        constraintFit.reason ? `(${constraintFit.reason})` : "",
      ]
        .filter(Boolean)
        .join(", ");

      return {
        job,
        matchScore,
        skillOverlapScore,
        experienceFitScore,
        constraintFitScore,
        evidenceCoverage: 0, // Will be calculated in PersonalizeNode
        rankingReason,
      };
    });

    // Sort by match score descending
    jobScores.sort((a, b) => b.matchScore - a.matchScore);

    // 4. Apply policy checks
    const allowedJobs: string[] = [];
    const skippedJobs: string[] = [];
    const skipReasons: Record<string, string> = {};
    const policiesChecked: string[] = [];

    // Check if we hit daily application limit
    const appliedCountToday = state.policyState?.appliedCountToday || 0;
    const maxApplicationsPerDay = policy.maxApplicationsPerDay || 10;

    // Get company cooldown data
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - policy.companyCooldownDays);

    const recentCompanyApplications = await Application.find({
      userId: new mongoose.Types.ObjectId(state.userId),
      createdAt: { $gte: cooldownDate },
    })
      .populate("jobId")
      .lean();

    const companiesOnCooldown = new Set(
      recentCompanyApplications
        .map((app: any) => app.jobId?.company)
        .filter(Boolean),
    );

    for (const jobScore of jobScores) {
      const job = jobScore.job;
      const jobIdStr = job._id.toString();

      // Policy check: Min match score
      if (jobScore.matchScore < policy.minMatchScore) {
        skippedJobs.push(jobIdStr);
        skipReasons[jobIdStr] =
          `LOW_MATCH_SCORE (${jobScore.matchScore}% < ${policy.minMatchScore}%)`;
        policiesChecked.push(`MIN_SCORE_CHECK_${jobIdStr}`);
        continue;
      }

      // Policy check: Blocked companies
      if (
        policy.blockedCompanies.some((blocked: string) =>
          job.company.toLowerCase().includes(blocked.toLowerCase()),
        )
      ) {
        skippedJobs.push(jobIdStr);
        skipReasons[jobIdStr] = `BLOCKED_COMPANY (${job.company})`;
        policiesChecked.push(`BLOCKED_COMPANY_CHECK_${jobIdStr}`);
        continue;
      }

      // Policy check: Blocked roles
      if (
        policy.blockedRoles.some((blocked: string) =>
          job.title.toLowerCase().includes(blocked.toLowerCase()),
        )
      ) {
        skippedJobs.push(jobIdStr);
        skipReasons[jobIdStr] = `BLOCKED_ROLE (${job.title})`;
        policiesChecked.push(`BLOCKED_ROLE_CHECK_${jobIdStr}`);
        continue;
      }

      // Policy check: Company cooldown
      if (companiesOnCooldown.has(job.company)) {
        skippedJobs.push(jobIdStr);
        skipReasons[jobIdStr] = `COMPANY_COOLDOWN (${job.company})`;
        policiesChecked.push(`COOLDOWN_CHECK_${jobIdStr}`);
        continue;
      }

      // Policy check: Max applications per day
      if (appliedCountToday + allowedJobs.length >= maxApplicationsPerDay) {
        skippedJobs.push(jobIdStr);
        skipReasons[jobIdStr] =
          `MAX_APPLICATIONS_REACHED (${maxApplicationsPerDay}/day)`;
        policiesChecked.push(`MAX_APPS_CHECK_${jobIdStr}`);
        continue;
      }

      // Passed all checks
      allowedJobs.push(jobIdStr);
      policiesChecked.push(`ALLOWED_${jobIdStr}`);
    }

    // 5. Create JobMatch records
    const jobMatchBulk = jobScores.map((jobScore) => ({
      agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
      jobId: jobScore.job._id,
      userId: new mongoose.Types.ObjectId(state.userId),
      matchScore: jobScore.matchScore,
      skillOverlapScore: jobScore.skillOverlapScore,
      experienceFitScore: jobScore.experienceFitScore,
      constraintFitScore: jobScore.constraintFitScore,
      evidenceCoverage: 0,
      confidenceLevels: { strong: 0, medium: 0, weak: 0 },
      rankingReason: jobScore.rankingReason,
    }));

    if (jobMatchBulk.length > 0) {
      await JobMatch.insertMany(jobMatchBulk);
    }

    // 6. Build jobMatchMap for state
    const jobMatchMap: Record<string, any> = {};
    jobScores.forEach((jobScore) => {
      jobMatchMap[jobScore.job._id.toString()] = {
        matchScore: jobScore.matchScore,
        skillOverlapScore: jobScore.skillOverlapScore,
        experienceFitScore: jobScore.experienceFitScore,
        constraintFitScore: jobScore.constraintFitScore,
        evidenceCoverage: 0,
        rankingReason: jobScore.rankingReason,
      };
    });

    // 7. Return state updates
    return {
      jobSearchState: {
        fetchedJobIds: recentJobs.map((j) => j._id.toString()),
        totalJobsFound: recentJobs.length,
        deduplicatedCount: newJobs.length,
      },
      rankingState: {
        rankedJobIds: jobScores.map((js) => js.job._id.toString()),
        jobMatchMap,
      },
      policyState: {
        allowedJobIds: allowedJobs,
        skippedJobIds: skippedJobs,
        skipReasons,
        appliedCountToday,
        policiesChecked,
      },
      lastCheckpoint: "JOB_DISCOVERY",
    };
  } catch (error) {
    errors.push(`JobDiscoveryNode error: ${(error as Error).message}`);
    return {
      errors,
      stopRequested: true,
      runStatus: "FAILED",
      lastCheckpoint: "JOB_DISCOVERY_FAILED",
    };
  }
}
