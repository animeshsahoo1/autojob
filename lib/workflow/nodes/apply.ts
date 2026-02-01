/**
 * ApplyNode
 *
 * Submits the application via sandbox API with:
 * - Retry logic (up to 3 attempts)
 * - Error handling and logging
 * - Receipt/confirmation tracking
 * - Status updates (SUBMITTED, FAILED, RETRIED)
 *
 * Uses personalized resume variant and generated content.
 *
 * What it does:
 * 1. Takes validated personalized content
 * 2. Submits application to sandbox apply API
 * 3. Handles retries/failures (up to 3 attempts)
 * 4. Creates or updates Application record
 * 5. Updates timeline with APPLIED → SUBMITTED/FAILED stages
 * 6. Sets checkpoint to "APPLIED"
 */

import { JobApplyAgentState } from "../state";
import { connectToDatabase } from "@/database/db";
import { Job, IJob } from "@/models/job.model";
import { Application } from "@/models/application.model";
import mongoose from "mongoose";

const MAX_RETRY_ATTEMPTS = 3;

/**
 * Submit application to sandbox API
 */
async function submitToSandboxAPI(
  job: IJob,
  resumeVariantUrl: string,
  answeredQuestions: { question: string; answer: string }[],
): Promise<{ success: boolean; receipt?: string; error?: string }> {
  try {
    if (!job.applyUrl) {
      throw new Error("Job does not have an apply URL");
    }

    // For sandbox jobs, simulate successful submission without actually calling API
    if (
      job.source === "sandbox" ||
      job.applyUrl.includes("sandbox.autojob.com")
    ) {
      console.log(
        `[Apply] 🧪 Sandbox job detected - simulating successful submission`,
      );
      return {
        success: true,
        receipt: `SANDBOX-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    }

    // Build application payload
    const payload = {
      jobId: job.externalJobId,
      resumeUrl: resumeVariantUrl,
      answers: answeredQuestions.reduce(
        (acc, qa) => {
          acc[qa.question] = qa.answer;
          return acc;
        },
        {} as Record<string, string>,
      ),
    };

    // Submit to real API
    const response = await fetch(job.applyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      receipt: result.receipt || result.confirmationId || result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function applyNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    // Validate required state
    if (!state.personalizationState) {
      throw new Error(
        "Personalization state not loaded. Run PersonalizeNode first.",
      );
    }

    if (!state.validationState?.validationPassed) {
      throw new Error("Validation did not pass. Cannot apply.");
    }

    const {
      currentJobId,
      resumeVariantUsed,
      answeredQuestions = [],
    } = state.personalizationState;

    if (!currentJobId) {
      throw new Error("No current job ID in personalization state.");
    }

    if (!resumeVariantUsed) {
      throw new Error("No resume variant selected.");
    }

    // Fetch job details
    const job = (await Job.findById(currentJobId).lean()) as unknown as IJob;
    if (!job) {
      throw new Error(`Job not found: ${currentJobId}`);
    }

    // Get resume variant URL
    const resumeVariant = state.artifactState?.resumeVariants?.find(
      (v) => v.name === resumeVariantUsed,
    );
    const resumeUrl =
      resumeVariant?.url || state.artifactState?.baseResumeUrl || "";

    if (!resumeUrl) {
      throw new Error("Resume URL not found for selected variant.");
    }

    // Retry loop
    let attempts = 0;
    let lastError = "";
    let receipt: string | undefined = undefined;
    let success = false;

    while (attempts < MAX_RETRY_ATTEMPTS && !success) {
      attempts++;

      const result = await submitToSandboxAPI(
        job,
        resumeUrl,
        answeredQuestions,
      );

      if (result.success) {
        success = true;
        receipt = result.receipt;
      } else {
        lastError = result.error || "Unknown error";
        // Wait before retry (exponential backoff)
        if (attempts < MAX_RETRY_ATTEMPTS) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)),
          );
        }
      }
    }

    // Determine final status
    const finalStatus = success
      ? "SUBMITTED"
      : attempts > 1
        ? "RETRIED"
        : "FAILED";

    // Create or update Application record
    let application = await Application.findOne({
      agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
      jobId: new mongoose.Types.ObjectId(currentJobId),
    });

    if (!application) {
      // Create new application
      application = await Application.create({
        agentRunId: new mongoose.Types.ObjectId(state.agentRunId),
        jobId: new mongoose.Types.ObjectId(currentJobId),
        userId: new mongoose.Types.ObjectId(state.userId),
        resumeVariantUsed,
        answeredQuestions,
        validationState: state.validationState
          ? {
              confidenceScore: state.validationState.confidenceScore,
              isGrounded: state.validationState.isGrounded,
              hallucinationRisks: state.validationState.hallucinationRisks,
            }
          : undefined,
        status: finalStatus,
        attempts,
        receipt: receipt || undefined,
        error: success ? undefined : lastError,
        timeline: [
          {
            stage: "PERSONALIZED",
            timestamp: new Date(),
            message: "Content personalized and validated",
          },
          {
            stage: success ? "SUBMITTED" : "FAILED",
            timestamp: new Date(),
            message: success
              ? `Successfully submitted after ${attempts} attempt(s)`
              : `Failed after ${attempts} attempt(s): ${lastError}`,
          },
        ],
      });
    } else {
      // Update existing application
      application.status = finalStatus;
      application.attempts = attempts;
      application.receipt = receipt;
      application.error = success ? undefined : lastError;
      application.timeline.push({
        stage: success ? "SUBMITTED" : "FAILED",
        timestamp: new Date(),
        message: success
          ? `Successfully submitted after ${attempts} attempt(s)`
          : `Failed after ${attempts} attempt(s): ${lastError}`,
      });
      await application.save();
    }

    // Return state updates
    return {
      applyResultState: {
        applicationId: application._id.toString(),
        applyStatus: finalStatus as "SUBMITTED" | "FAILED" | "RETRIED",
        receipt: receipt || undefined,
        error: success ? undefined : lastError,
        attempts,
      },
      lastCheckpoint: "APPLIED",
      ...(success
        ? {}
        : {
            stopRequested: true,
            runStatus: "FAILED",
            errors: [`Application failed: ${lastError}`],
          }),
    };
  } catch (error) {
    errors.push(`ApplyNode error: ${(error as Error).message}`);
    return {
      errors,
      stopRequested: true,
      runStatus: "FAILED",
      lastCheckpoint: "APPLY_FAILED",
    };
  }
}
