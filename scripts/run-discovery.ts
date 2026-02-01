/**
 * CLI script to trigger Discovery Workflow
 *
 * Usage: npm run discovery -- <agentRunId> <userId>
 */

import { runDiscoveryWorkflow } from "../lib/workflow/discovery-graph";

async function main() {
  const agentRunId = process.argv[2];
  const userId = process.argv[3];

  if (!agentRunId || !userId) {
    console.error("Usage: npm run discovery -- <agentRunId> <userId>");
    process.exit(1);
  }

  console.log(`Starting Discovery Workflow...`);
  console.log(`AgentRun ID: ${agentRunId}`);
  console.log(`User ID: ${userId}`);

  try {
    const result = await runDiscoveryWorkflow({
      agentRunId,
      userId,
    });

    console.log("\n✅ Discovery Workflow completed!");
    console.log(`Status: ${result.runStatus}`);
    console.log(`Jobs found: ${result.jobSearchState?.totalJobsFound || 0}`);
    console.log(`Jobs queued: ${result.queueState?.queuedJobIds.length || 0}`);
    console.log(
      `Jobs skipped: ${result.queueState?.skippedJobIds.length || 0}`,
    );

    if (result.errors && result.errors.length > 0) {
      console.log(`\n⚠️ Errors:`, result.errors);
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Discovery Workflow failed:", error);
    process.exit(1);
  }
}

main();
