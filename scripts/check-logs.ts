/**
 * Check logs and status for worker jobs
 */

import mongoose from "mongoose";
import { ApplyQueue } from "../models/applyqueue.model";
import { Application } from "../models/application.model";
import { AgentLog } from "../models/agentlog.model";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("MongoDB connected successfully");
  }
}

async function checkLogs() {
  await connectDB();

  console.log("📊 Checking job processing status...\n");

  // 1. Check ApplyQueue status
  console.log("═══════════════════════════════════════");
  console.log("🔄 QUEUE STATUS");
  console.log("═══════════════════════════════════════");

  const pending = await ApplyQueue.countDocuments({ status: "PENDING" });
  const processing = await ApplyQueue.countDocuments({ status: "PROCESSING" });
  const completed = await ApplyQueue.countDocuments({ status: "COMPLETED" });
  const failed = await ApplyQueue.countDocuments({ status: "FAILED" });

  console.log(`Pending:    ${pending}`);
  console.log(`Processing: ${processing}`);
  console.log(`Completed:  ${completed}`);
  console.log(`Failed:     ${failed}`);
  console.log(`Total:      ${pending + processing + completed + failed}\n`);

  // 2. Show recent queue items with details
  if (completed > 0 || failed > 0 || processing > 0) {
    console.log("═══════════════════════════════════════");
    console.log("📋 RECENT QUEUE ITEMS");
    console.log("═══════════════════════════════════════");

    const recentItems = await ApplyQueue.find()
      .sort({ updatedAt: -1 })
      .limit(5) // Show only 5 most recent
      .lean();

    for (const item of recentItems) {
      const statusEmoji = {
        PENDING: "⏳",
        PROCESSING: "🔄",
        COMPLETED: "✅",
        FAILED: "❌",
      }[item.status];

      console.log(`${statusEmoji} ${item.status}`);
      console.log(`   Queue ID: ${item._id}`);
      console.log(`   Job ID: ${item.jobId}`);
      console.log(`   User ID: ${item.userId}`);
      if (item.attempts !== undefined && item.maxAttempts !== undefined) {
        console.log(`   Attempts: ${item.attempts}/${item.maxAttempts}`);
      }
      if (item.applicationId) {
        console.log(`   Application: ${item.applicationId}`);
      }
      if (item.failureReason) {
        console.log(`   ⚠️  Failure: ${item.failureReason.substring(0, 300)}`);
      }
      console.log(`   Created: ${item.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${item.updatedAt.toLocaleString()}`);
      console.log();
    }
  }

  // 3. Check Applications created
  console.log("═══════════════════════════════════════");
  console.log("📝 APPLICATIONS");
  console.log("═══════════════════════════════════════");

  const totalApps = await Application.countDocuments();
  const appliedApps = await Application.countDocuments({ status: "APPLIED" });
  const draftApps = await Application.countDocuments({ status: "DRAFT" });

  console.log(`Total:   ${totalApps}`);
  console.log(`Applied: ${appliedApps}`);
  console.log(`Draft:   ${draftApps}\n`);

  // Show recent applications
  if (totalApps > 0) {
    const recentApps = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    for (const app of recentApps) {
      console.log(`✅ ${app.status}`);
      console.log(`   Job ID: ${app.jobId}`);
      console.log(`   Match Score: ${app.matchScore?.toFixed(2) || "N/A"}`);
      console.log(`   Personalized: ${app.personalized ? "Yes" : "No"}`);
      console.log(`   Created: ${app.createdAt.toLocaleString()}`);
      console.log();
    }
  }

  // 4. Check AgentLog for workflow traces
  console.log("═══════════════════════════════════════");
  console.log("📜 AGENT LOGS (Last 10)");
  console.log("═══════════════════════════════════════");

  const logs = await AgentLog.find().sort({ timestamp: -1 }).limit(10).lean();

  for (const log of logs) {
    const levelEmoji =
      {
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        debug: "🐛",
      }[log.level] || "•";

    console.log(`${levelEmoji} ${log.level.toUpperCase()} - ${log.message}`);
    console.log(`   Workflow: ${log.workflowType || "N/A"}`);
    if (log.nodeName) {
      console.log(`   Node: ${log.nodeName}`);
    }
    if (log.metadata) {
      console.log(`   Metadata:`, JSON.stringify(log.metadata, null, 2));
    }
    const timestamp = log.timestamp || log.createdAt;
    if (timestamp) {
      console.log(`   ${new Date(timestamp).toLocaleString()}`);
    }
    console.log();
  }

  // 5. LangSmith info
  console.log("═══════════════════════════════════════");
  console.log("🔗 LANGSMITH TRACING");
  console.log("═══════════════════════════════════════");

  if (process.env.LANGSMITH_API_KEY) {
    console.log("✅ LangSmith is configured");
    console.log("\n📊 View traces at:");
    console.log("   https://smith.langchain.com/\n");
    console.log("🔍 Search by:");
    console.log("   - agentRunId (from seed output)");
    console.log("   - Workflow name: 'Apply Workflow' or 'Discovery Workflow'");
    console.log("   - Time range: Last hour");
    console.log(
      "\n💡 Tip: Look for PersonalizeNode and HallucinationGuardNode calls",
    );
    console.log("   to see OpenAI API usage and token costs\n");
  } else {
    console.log("⚠️  LangSmith not configured (no LANGSMITH_API_KEY)");
    console.log("\nTo enable tracing:");
    console.log("   LANGSMITH_API_KEY=your_key");
    console.log("   LANGCHAIN_TRACING_V2=true\n");
  }

  await mongoose.connection.close();
  console.log("✅ Done!");
}

checkLogs().catch((error) => {
  console.error("❌ Error checking logs:", error);
  process.exit(1);
});
