/**
 * Apply Workflow (Apply Worker)
 *
 * Runs once per queued job
 *
 * Flow:
 * START → PersonalizeNode → HallucinationGuardNode
 *   ├── validation fails → FinalizeNode (STOPPED) → END
 *   └── validation passes → ApplyNode → TrackerNode → LogNode → FinalizeNode → END
 *
 * Outputs:
 * - Application record
 * - AgentLog entries
 * - Updated AgentRun counters
 *
 * This workflow processes one job at a time.
 */

import { StateGraph, END } from "@langchain/langgraph";
import { JobApplyAgentStateAnnotation, JobApplyAgentState } from "./state";
import { artifactNode } from "./nodes/artifact";
import { personalizeNode } from "./nodes/personalize";
import { hallucinationGuardNode } from "./nodes/hallucination-guard";
import { applyNode } from "./nodes/apply";
import { trackerNode } from "./nodes/tracker";
import { logNode } from "./nodes/log";
import { finalizeNode } from "./nodes/finalize";

/**
 * Conditional edge: After HallucinationGuardNode
 * - If validation fails → go to log (then finalize)
 * - If validation passes → go to apply
 */
function routeAfterValidation(state: JobApplyAgentState): string {
  // Check if validation failed or stop requested
  if (
    state.stopRequested ||
    state.runStatus === "STOPPED" ||
    state.runStatus === "FAILED" ||
    !state.validationState?.validationPassed
  ) {
    return "log"; // Log the failure before finalize
  }

  // Validation passed, proceed to apply
  return "apply";
}

/**
 * Conditional edge: Check if artifacts are loaded
 * - If artifacts missing → load artifacts first
 * - If artifacts present → go to personalize
 */
function routeAfterStart(state: JobApplyAgentState): string {
  if (!state.artifactState) {
    return "artifact";
  }
  return "personalize";
}

/**
 * Create the Apply workflow graph
 */
export function createApplyGraph() {
  const workflow = new StateGraph(JobApplyAgentStateAnnotation)
    // Add nodes
    .addNode("artifact", artifactNode)
    .addNode("personalize", personalizeNode)
    .addNode("hallucination_guard", hallucinationGuardNode)
    .addNode("apply", applyNode)
    .addNode("tracker", trackerNode)
    .addNode("log", logNode)
    .addNode("finalize", finalizeNode)

    // Define edges
    // Conditional start: load artifacts if needed
    .addConditionalEdges("__start__", routeAfterStart, {
      artifact: "artifact",
      personalize: "personalize",
    })
    .addEdge("artifact", "personalize")
    .addEdge("personalize", "hallucination_guard")

    // Conditional edge after validation
    .addConditionalEdges("hallucination_guard", routeAfterValidation, {
      log: "log", // Failed validation goes to log first
      apply: "apply",
    })

    // Happy path: apply → tracker → log → finalize
    .addEdge("apply", "tracker")
    .addEdge("tracker", "log")

    // All paths converge at log → finalize
    .addEdge("log", "finalize")
    .addEdge("finalize", END);

  return workflow.compile();
}

/**
 * Run the Apply workflow
 *
 * Note: artifactState is passed from Discovery workflow via BullMQ queue
 * It's already been loaded by ArtifactNode in Discovery workflow
 */
export async function runApplyWorkflow(input: {
  agentRunId: string;
  userId: string;
  jobId: string;
  artifactState: JobApplyAgentState["artifactState"] | null;
}) {
  const graph = createApplyGraph();

  const result = await graph.invoke({
    agentRunId: input.agentRunId,
    userId: input.userId,
    stopRequested: false,
    runStatus: "RUNNING" as const,
    errors: [],
    artifactState: input.artifactState || undefined,
    personalizationState: {
      currentJobId: input.jobId,
    },
  });

  return result;
}
