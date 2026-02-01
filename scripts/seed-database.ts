/**
 * Seed Script: Setup database and run Discovery Workflow
 *
 * This script:
 * 1. Creates a test User
 * 2. Creates Resume documents
 * 3. Creates Job listings
 * 4. Creates AgentRun
 * 5. Runs Discovery Workflow
 *
 * Usage: npm run seed
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

  // 1. Create or reuse User
  console.log("👤 Creating/reusing test user...");

  let user = await User.findById("697f40c3b1a58236e580ade9");

  if (!user) {
    throw new Error(
      "User with ID 697f40c3b1a58236e580ade9 not found. Please check the user ID.",
    );
  }

  console.log(`✅ Using existing user: ${user.email} (ID: ${user._id})`);

  // 3. Create or reuse Resume documents
  console.log("📄 Creating/reusing resume documents...");

  let frontendResume = await Resume.findOne({
    userId: user._id,
    templateName: "frontend",
  });

  if (!frontendResume) {
    frontendResume = await Resume.create({
      userId: user._id,

      personalInfo: {
        fullName: "John Doe",
        email: "test.student@example.com",
        phone: "+1-555-0123",
        address: {
          city: "San Francisco",
          state: "CA",
          country: "USA",
        },
        linkedIn: "https://linkedin.com/in/johndoe",
        github: "https://github.com/johndoe",
        portfolio: "https://johndoe.dev",
        website: "https://johndoe.com",
      },

      summary:
        "Passionate full-stack developer with 3+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies.",

      education: [
        {
          institution: "Stanford University",
          degree: "Bachelor of Science",
          major: "Computer Science",
          gpa: 3.8,
          maxGpa: 4.0,
          startDate: new Date("2019-09-01"),
          endDate: new Date("2023-05-15"),
          location: "Stanford, CA",
          achievements: [
            "Dean's List (2020-2023)",
            "President of Computer Science Club",
          ],
          coursework: [
            "Data Structures",
            "Algorithms",
            "Web Development",
            "Machine Learning",
          ],
        },
      ],

      workExperience: [
        {
          company: "TechCorp",
          position: "Frontend Developer",
          location: "San Francisco, CA",
          isRemote: false,
          startDate: new Date("2023-06-01"),
          endDate: new Date("2025-12-31"),
          isCurrent: true,
          employmentType: "full-time",
          description:
            "Building modern web applications using React and TypeScript",
          responsibilities: [
            "Developed responsive user interfaces using React and Material-UI",
            "Collaborated with backend team to integrate REST APIs",
            "Mentored 2 junior developers",
          ],
          achievements: [
            "Reduced page load time by 40% through code optimization",
            "Built scalable component library used by 5+ teams",
            "Improved test coverage from 60% to 90%",
          ],
          technologies: ["React", "TypeScript", "Redux", "Material-UI", "Jest"],
        },
        {
          company: "StartupXYZ",
          position: "Full Stack Intern",
          location: "Remote",
          isRemote: true,
          startDate: new Date("2022-06-01"),
          endDate: new Date("2022-08-31"),
          isCurrent: false,
          employmentType: "internship",
          description: "Worked on full-stack features for SaaS platform",
          responsibilities: [
            "Developed features using React frontend and Node.js backend",
            "Implemented authentication system using JWT",
          ],
          achievements: [
            "Built REST APIs serving 10,000+ daily requests",
            "Reduced API response time by 25%",
          ],
          technologies: ["React", "Node.js", "Express", "MongoDB", "Docker"],
        },
      ],

      projects: [
        {
          name: "E-Commerce Platform",
          description:
            "Full-stack e-commerce platform with payment integration",
          role: "Lead Developer",
          startDate: new Date("2023-01-01"),
          endDate: new Date("2023-05-01"),
          technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "AWS"],
          achievements: [
            "Handled 1000+ concurrent users",
            "Integrated Stripe payment gateway",
            "Deployed on AWS with CI/CD pipeline",
          ],
          url: "https://ecommerce-demo.johndoe.dev",
          github: "https://github.com/johndoe/ecommerce",
        },
        {
          name: "Task Management App",
          description: "Real-time collaborative task management application",
          role: "Full Stack Developer",
          technologies: ["React", "Firebase", "Material-UI"],
          achievements: [
            "Implemented real-time updates using WebSockets",
            "Built drag-and-drop interface",
          ],
          github: "https://github.com/johndoe/taskapp",
        },
      ],

      skills: [
        {
          category: "Frontend",
          skills: [
            "React",
            "TypeScript",
            "JavaScript",
            "HTML",
            "CSS",
            "Redux",
            "Next.js",
          ],
        },
        {
          category: "Backend",
          skills: ["Node.js", "Express", "Python", "Django", "REST APIs"],
        },
        {
          category: "Database",
          skills: ["MongoDB", "PostgreSQL", "MySQL", "Redis"],
        },
        {
          category: "Tools & Technologies",
          skills: ["Git", "Docker", "AWS", "CI/CD", "Jest", "Webpack"],
        },
      ],

      certifications: [
        {
          name: "AWS Certified Developer",
          issuer: "Amazon Web Services",
          issueDate: new Date("2024-03-01"),
          credentialId: "AWS-123456",
        },
      ],

      languages: [
        { language: "English", proficiency: "native" },
        { language: "Spanish", proficiency: "intermediate" },
      ],

      workAuthorization: [
        {
          country: "USA",
          status: "citizen",
          requiresSponsorship: false,
        },
      ],

      desiredRoles: [
        "Frontend Developer",
        "Full Stack Developer",
        "Software Engineer",
      ],
      desiredLocations: ["San Francisco", "New York", "Remote"],
      willingToRelocate: true,
      remotePreference: "hybrid",

      version: "frontend-v1",
      templateName: "frontend",
      fileUrl: "https://storage.example.com/resumes/johndoe-frontend.pdf",
      parsedDate: new Date(),
    });

    console.log(`✅ Created frontend resume (ID: ${frontendResume._id})`);
  } else {
    console.log(
      `✅ Found existing frontend resume (ID: ${frontendResume._id})`,
    );
  }

  let backendResume = await Resume.findOne({
    userId: user._id,
    templateName: "backend",
  });

  if (!backendResume) {
    backendResume = await Resume.create({
      userId: user._id,

      personalInfo: {
        fullName: "John Doe",
        email: "test.student@example.com",
        phone: "+1-555-0123",
        linkedIn: "https://linkedin.com/in/johndoe",
        github: "https://github.com/johndoe",
      },

      summary:
        "Backend engineer specializing in scalable API development and microservices architecture.",

      education: [
        {
          institution: "Stanford University",
          degree: "Bachelor of Science",
          major: "Computer Science",
          gpa: 3.8,
          maxGpa: 4.0,
          endDate: new Date("2023-05-15"),
        },
      ],

      workExperience: frontendResume.workExperience,
      projects: frontendResume.projects,

      skills: [
        {
          category: "Backend",
          skills: [
            "Node.js",
            "Express",
            "Python",
            "Django",
            "FastAPI",
            "GraphQL",
          ],
        },
        {
          category: "Database",
          skills: ["PostgreSQL", "MongoDB", "Redis", "Elasticsearch"],
        },
        {
          category: "DevOps",
          skills: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
        },
      ],

      version: "backend-v1",
      templateName: "backend",
      fileUrl: "https://storage.example.com/resumes/johndoe-backend.pdf",
      parsedDate: new Date(),
    });

    console.log(`✅ Created backend resume (ID: ${backendResume._id})`);
  } else {
    console.log(`✅ Found existing backend resume (ID: ${backendResume._id})`);
  }

  console.log();

  // Update user with resume references if needed
  if (!user.resumes || user.resumes.length === 0) {
    user.resumes = [frontendResume._id, backendResume._id];
    await user.save();
    console.log(`✅ Linked resumes to user\n`);
  } else {
    console.log(`✅ Resumes already linked to user\n`);
  }

  // Cleanup old seed data
  await AgentRun.deleteMany({ userId: user._id });
  await Job.deleteMany({ source: "seed" });
  console.log("🧹 Cleaned up old seed data\n");

  // 4. Create Job listings
  console.log("💼 Creating job listings...");

  const jobs = await Job.insertMany([
    {
      externalJobId: "ext-job-001",
      source: "seed",
      title: "Frontend Developer",
      company: "Google",
      location: "San Francisco, CA",
      remote: false,
      jobType: "full-time",
      description: "Join our team to build next-generation web applications",
      skills: ["React", "TypeScript", "JavaScript", "CSS"],
      requirements: [
        "3+ years of React experience",
        "Strong TypeScript skills",
        "Experience with modern frontend tools",
      ],
      questions: [
        { question: "Why do you want to work at Google?", type: "text" },
        { question: "Describe your experience with React", type: "text" },
      ],
      applyUrl: "https://sandbox-api.example.com/apply/google-001",
      jobHash: crypto.createHash("md5").update("ext-job-001").digest("hex"),
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      externalJobId: "ext-job-002",
      source: "seed",
      title: "Full Stack Engineer",
      company: "Meta",
      location: "Remote",
      remote: true,
      jobType: "full-time",
      description: "Build scalable web applications",
      skills: ["React", "Node.js", "TypeScript", "MongoDB"],
      requirements: [
        "5+ years full-stack experience",
        "Strong problem-solving skills",
      ],
      questions: [
        {
          question: "What is your greatest technical achievement?",
          type: "text",
        },
      ],
      applyUrl: "https://sandbox-api.example.com/apply/meta-002",
      jobHash: crypto.createHash("md5").update("ext-job-002").digest("hex"),
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      source: "seed",
      externalJobId: "ext-job-003",
      title: "Backend Developer",
      company: "Amazon",
      location: "New York, NY",
      remote: false,
      jobType: "full-time",
      description: "Work on high-scale distributed systems",
      skills: ["Node.js", "Python", "AWS", "PostgreSQL"],
      requirements: [
        "4+ years backend development",
        "Experience with AWS services",
        "Strong database skills",
      ],
      questions: [],
      applyUrl: "https://sandbox-api.example.com/apply/amazon-003",
      jobHash: crypto.createHash("md5").update("ext-job-003").digest("hex"),
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      source: "seed",
      externalJobId: "ext-job-004",
      title: "Software Engineer",
      company: "Netflix",
      location: "Remote",
      remote: true,
      jobType: "full-time",
      description: "Build streaming infrastructure",
      skills: ["React", "Node.js", "Docker", "Kubernetes"],
      requirements: [
        "3+ years software development",
        "Experience with microservices",
      ],
      questions: [
        { question: "Tell us about a challenging bug you fixed", type: "text" },
      ],
      applyUrl: "https://sandbox-api.example.com/apply/netflix-004",
      jobHash: crypto.createHash("md5").update("ext-job-004").digest("hex"),
      postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
    {
      source: "seed",
      externalJobId: "ext-job-005",
      title: "Frontend Engineer",
      company: "Airbnb",
      location: "San Francisco, CA",
      remote: false,
      jobType: "full-time",
      description: "Create beautiful user experiences",
      skills: ["React", "TypeScript", "Redux", "CSS"],
      requirements: ["4+ years React development", "Strong UI/UX sensibility"],
      questions: [],
      applyUrl: "https://sandbox-api.example.com/apply/airbnb-005",
      jobHash: crypto.createHash("md5").update("ext-job-005").digest("hex"),
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
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
