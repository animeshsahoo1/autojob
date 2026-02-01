/**
 * LoadRunNode
 *
 * Loads AgentRun, user, and apply policy into state.
 * This is the entry point of the workflow that initializes the agent run
 * with user data, student profile, and policy constraints.
 *
 * What it does:
 * 1. Fetch AgentRun by agentRunId (ensure exists)
 * 2. Fetch User by userId (ensure active)
 * 3. Load Apply Policy from User.applyPolicy
 * 4. Check Kill Switch (AgentRun or User policy)
 * 5. Validate Run Status (must be RUNNING)
 * 6. Initialize Counters (appliedCountToday, skippedCountToday)
 * 7. Set Checkpoint to "LOAD_RUN"
 *
 * What it does NOT do:
 * ❌ No job fetching
 * ❌ No ranking
 * ❌ No applying
 * ❌ No LLM calls
 * ❌ No writes except safe flags / checkpoint
 */

import { JobApplyAgentState } from "../state";
import { connectToDatabase } from "@/database/db";
import { AgentRun } from "@/models/agentrun.model";
import { User, IUser } from "@/models/user.model";
import mongoose from "mongoose";

export async function loadRunNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    // 1. Fetch AgentRun by agentRunId
    const agentRun = await AgentRun.findById(state.agentRunId);
    if (!agentRun) {
      throw new Error(`AgentRun not found: ${state.agentRunId}`);
    }

    // 2. Fetch User by userId
    const user = (await User.findById(state.userId).lean()) as IUser | null;
    if (!user) {
      throw new Error(`User not found: ${state.userId}`);
    }

    // Ensure user is active
    if (!user.isActive) {
      throw new Error(`User is inactive: ${user.email}`);
    }

    // 3. Load Apply Policy from User
    const applyPolicy = user.applyPolicy || {
      maxApplicationsPerDay: 10,
      minMatchScore: 60,
      allowedLocations: [],
      remoteOnly: false,
      visaRequired: false,
      blockedCompanies: [],
      blockedRoles: [],
      companyCooldownDays: 30,
      killSwitch: false,
    };

    // 4. Check Kill Switch
    const killSwitchActive =
      agentRun.killSwitch === true || applyPolicy.killSwitch === true;

    // 5. Validate Run Status (must be RUNNING)
    if (agentRun.status !== "RUNNING") {
      throw new Error(
        `AgentRun status is ${agentRun.status}, expected RUNNING`,
      );
    }

    // 6. Initialize Counters
    const appliedCountToday = agentRun.appliedCountToday || 0;
    const skippedCountToday = agentRun.skippedCountToday || 0;

    // 7. Return state updates
    return {
      userEmail: user.email,
      applyPolicy,
      policyState: {
        allowedJobIds: [],
        skippedJobIds: [],
        skipReasons: {},
        appliedCountToday,
        policiesChecked: [],
      },
      stopRequested: killSwitchActive,
      lastCheckpoint: "LOAD_RUN",
      runStatus: agentRun.status,
    };
  } catch (error) {
    errors.push(`LoadRunNode error: ${(error as Error).message}`);
    return {
      errors,
      stopRequested: true,
      runStatus: "FAILED",
      lastCheckpoint: "LOAD_RUN_FAILED",
    };
  }
}
