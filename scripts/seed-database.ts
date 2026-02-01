/**
 * Seed Script: Setup database and run Discovery Workflow
 *
 * This script:
 * 1. Uses existing User (697f40c3b1a58236e580ade9)
 * 2. Checks for existing Resume documents
 * 3. Creates Job listings matching the resume skills
 * 4. Creates AgentRun
 * 5. Runs Discovery Workflow
 *
 * Usage: npx tsx --env-file=.env scripts/seed-database.ts
 */

import { connectToDatabase } from "../database/db";
import { User } from "../models/user.model";
import Resume from "../models/resume.model";
import { Job } from "../models/job.model";
import { AgentRun } from "../models/agentrun.model";
import { runDiscoveryWorkflow } from "../lib/workflow/discovery-graph";
import crypto from "crypto";

async function seedDatabase() {
  await connectToDatabase();

  console.log("🌱 Starting database seed...\n");

  // 1. Use existing User
  console.log("👤 Loading existing user...");

  const user = await User.findById("697f40c3b1a58236e580ade9");

  if (!user) {
    throw new Error(
      "User with ID 697f40c3b1a58236e580ade9 not found. Please check the user ID.",
    );
  }

  console.log(`✅ Using existing user: ${user.email} (ID: ${user._id})`);

  // 2. Check for existing resume
  console.log("\n📄 Checking for resume documents...");
  const resumeCount = await Resume.countDocuments({ userId: user._id });
  console.log(`✅ Found ${resumeCount} resume(s) for user\n`);

  // 3. Cleanup old seed data
  await AgentRun.deleteMany({ userId: user._id });
  await Job.deleteMany({ source: "seed" });
  console.log("🧹 Cleaned up old seed data\n");

  // 4. Create Job listings matching resume skills
  // Skills from resume: FastAPI, MongoDB, Express, Node.js, React, Next.js,
  // LangChain, LangGraph, Redis, WebSockets, Docker, D3.js, Zustand, Motion
  console.log("💼 Creating job listings...");

  const jobs = await Job.insertMany([
    {
      externalJobId: "ext-job-001",
      source: "seed",
      title: "Full Stack Developer (Python/React)",
      company: "OpenAI",
      location: "San Francisco, CA",
      remote: true,
      jobType: "full-time",
      description:
        "Build AI-powered applications using FastAPI, React, and LangChain. Work on cutting-edge AI products.",
      skills: ["Python", "FastAPI", "React", "Next.js", "LangChain", "Docker"],
      requirements: [
        "Experience with Python backend frameworks (FastAPI/Django)",
        "Strong React and modern JavaScript skills",
        "Familiarity with AI/ML frameworks",
        "Docker and containerization experience",
      ],
      questions: [
        {
          question: "Describe your experience with AI/ML frameworks",
          type: "text",
        },
        {
          question: "Tell us about a complex full-stack project you built",
          type: "text",
        },
      ],
      salary: { min: 150000, max: 220000, currency: "USD" },
      applyUrl: "https://sandbox-api.example.com/apply/openai-001",
      jobHash: crypto.createHash("md5").update("ext-job-001").digest("hex"),
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      externalJobId: "ext-job-002",
      source: "seed",
      title: "Backend Engineer - AI Platform",
      company: "Anthropic",
      location: "Remote",
      remote: true,
      jobType: "full-time",
      description:
        "Build scalable backend systems for AI applications using FastAPI, Redis, and WebSockets.",
      skills: [
        "Python",
        "FastAPI",
        "Redis",
        "WebSockets",
        "Docker",
        "LangGraph",
      ],
      requirements: [
        "3+ years Python backend development",
        "Experience with real-time systems (WebSockets)",
        "Knowledge of caching strategies (Redis)",
        "Microservices architecture experience",
      ],
      questions: [
        {
          question: "What's your experience with real-time data streaming?",
          type: "text",
        },
      ],
      salary: { min: 140000, max: 200000, currency: "USD" },
      applyUrl: "https://sandbox-api.example.com/apply/anthropic-002",
      jobHash: crypto.createHash("md5").update("ext-job-002").digest("hex"),
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      source: "seed",
      externalJobId: "ext-job-003",
      title: "Full Stack Engineer - Healthcare Tech",
      company: "Healthtech Startup",
      location: "New York, NY",
      remote: true,
      jobType: "full-time",
      description:
        "Build healthcare appointment management systems with MERN stack and geolocation APIs.",
      skills: [
        "MongoDB",
        "Express.js",
        "React",
        "Node.js",
        "Geolocation APIs",
      ],
      requirements: [
        "Experience with MERN stack",
        "Healthcare domain knowledge (preferred)",
        "API integration experience",
        "Understanding of HIPAA compliance",
      ],
      questions: [],
      salary: { min: 120000, max: 170000, currency: "USD" },
      applyUrl: "https://sandbox-api.example.com/apply/healthtech-003",
      jobHash: crypto.createHash("md5").update("ext-job-003").digest("hex"),
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      source: "seed",
      externalJobId: "ext-job-004",
      title: "Senior Frontend Developer",
      company: "Vercel",
      location: "Remote",
      remote: true,
      jobType: "full-time",
      description:
        "Build beautiful UIs with Next.js, React, and modern animation libraries.",
      skills: ["Next.js", "React", "TypeScript", "Zustand", "Motion", "D3.js"],
      requirements: [
        "4+ years React development",
        "Expert-level Next.js knowledge",
        "Experience with state management (Zustand/Redux)",
        "Animation and data visualization skills",
      ],
      questions: [
        {
          question: "What's your favorite Next.js 14+ feature and why?",
          type: "text",
        },
      ],
      salary: { min: 160000, max: 210000, currency: "USD" },
      applyUrl: "https://sandbox-api.example.com/apply/vercel-004",
      jobHash: crypto.createHash("md5").update("ext-job-004").digest("hex"),
      postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      source: "seed",
      externalJobId: "ext-job-005",
      title: "AI/ML Engineer - Trading Systems",
      company: "Jane Street",
      location: "New York, NY",
      remote: false,
      jobType: "full-time",
      description:
        "Build algorithmic trading analysis platforms with Python, LangGraph, and real-time data processing.",
      skills: [
        "Python",
        "LangGraph",
        "LangChain",
        "FastAPI",
        "Redis",
        "WebSockets",
      ],
      requirements: [
        "Strong Python and algorithmic thinking",
        "Experience with AI agent frameworks",
        "Real-time data processing experience",
        "Financial domain knowledge (preferred)",
      ],
      questions: [],
      salary: { min: 180000, max: 250000, currency: "USD" },
      applyUrl: "https://sandbox-api.example.com/apply/janestreet-005",
      jobHash: crypto.createHash("md5").update("ext-job-005").digest("hex"),
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log(`✅ Created ${jobs.length} job listings\n`);

  // 5. Create AgentRun
  console.log("🤖 Creating agent run...");

  const agentRun = await AgentRun.create({
    userId: user._id,
    status: "RUNNING",
    startedAt: new Date(),
    appliedCountToday: 0,
    skippedCountToday: 0,
    killSwitch: false,
  });

  console.log(`✅ Created agent run (ID: ${agentRun._id})\n`);

  // 6. Run Discovery Workflow
  console.log("🚀 Starting Discovery Workflow...\n");

  try {
    const result = await runDiscoveryWorkflow({
      agentRunId: agentRun._id.toString(),
      userId: user._id.toString(),
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

    console.log("\n✅ Seed completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Start the worker: npm run worker");
    console.log("2. Worker will process the queued jobs automatically");
    console.log(`\nUser ID: ${user._id}`);
    console.log(`AgentRun ID: ${agentRun._id}`);
  } catch (error) {
    console.error("\n❌ Discovery Workflow failed:", error);
    throw error;
  }
}

// Run seed
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
