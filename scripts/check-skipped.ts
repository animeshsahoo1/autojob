import { connectToDatabase } from "../database/db";
import { ApplyQueue } from "../models/applyqueue.model";
import { Job } from "../models/job.model";

async function checkSkipped() {
  await connectToDatabase();

  const userId = "697f40c3b1a58236e580ade9";

  const skippedCount = await ApplyQueue.countDocuments({
    userId,
    status: "SKIPPED",
  });

  const skippedJobs = await ApplyQueue.find({
    userId,
    status: "SKIPPED",
  }).limit(5);

  console.log(`\n📊 Skipped Jobs Count: ${skippedCount}`);
  console.log(`\n📋 Sample Skipped Jobs:`);

  for (const job of skippedJobs) {
    console.log(`\n- Job ID: ${job.jobId}`);
    console.log(`  Reason: ${job.skipReason}`);
    console.log(`  Has AI Analysis: ${job.skipReasoning ? "✅" : "❌"}`);
    if (job.skipReasoning) {
      console.log(`  Reasoning: ${job.skipReasoning.substring(0, 100)}...`);
    }
  }

  process.exit(0);
}

checkSkipped();
