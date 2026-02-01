import "dotenv/config";
import { connectToDatabase } from "../database/db";
import { Job } from "../models/job.model";
import crypto from "crypto";

const companies = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Tesla", 
  "Uber", "Airbnb", "Spotify", "Adobe", "Salesforce", "Oracle", "IBM",
  "Stripe", "Shopify", "Coinbase", "Atlassian", "GitHub", "Figma"
];

const jobTitles = [
  "Software Engineer",
  "Senior Frontend Developer",
  "Backend Engineer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Cloud Architect",
  "Security Engineer",
  "Mobile Developer",
  "QA Engineer",
  "Site Reliability Engineer",
  "Technical Lead"
];

const locations = [
  "San Francisco, CA",
  "New York, NY",
  "Seattle, WA",
  "Austin, TX",
  "Boston, MA",
  "Denver, CO",
  "Chicago, IL",
  "Los Angeles, CA",
  "Portland, OR",
  "Atlanta, GA",
  "Miami, FL",
  "Remote"
];

const skillSets = [
  ["JavaScript", "React", "Node.js", "TypeScript", "MongoDB"],
  ["Python", "Django", "PostgreSQL", "Redis", "Docker"],
  ["Java", "Spring Boot", "MySQL", "Kubernetes", "AWS"],
  ["Go", "Microservices", "gRPC", "Kafka", "GCP"],
  ["React Native", "iOS", "Android", "Swift", "Kotlin"],
  ["Machine Learning", "TensorFlow", "PyTorch", "Python", "Spark"],
  ["DevOps", "Jenkins", "Terraform", "Ansible", "CI/CD"],
  ["C++", "System Design", "Linux", "Performance Optimization"],
  ["Vue.js", "Nuxt", "GraphQL", "REST API", "Firebase"],
  ["Angular", "RxJS", "NgRx", "Azure", "SQL Server"]
];

const requirementTemplates = [
  "Bachelor's degree in Computer Science or related field",
  "3+ years of professional software development experience",
  "Strong problem-solving and analytical skills",
  "Experience with agile development methodologies",
  "Excellent communication and teamwork abilities",
  "Experience with version control systems (Git)",
  "Understanding of software design patterns",
  "Ability to write clean, maintainable code",
  "Experience with unit testing and TDD",
  "Knowledge of web security best practices"
];

const descriptionTemplates = [
  "Join our innovative team to build cutting-edge solutions that impact millions of users worldwide.",
  "We're looking for passionate engineers to help scale our platform and deliver exceptional user experiences.",
  "Work on challenging problems with a talented team in a collaborative, fast-paced environment.",
  "Help us revolutionize the industry with groundbreaking technology and innovative approaches.",
  "Build the future of our platform while working with the latest technologies and best practices.",
  "Contribute to mission-critical systems that power our global operations.",
  "Design and implement scalable solutions that meet the needs of our growing customer base.",
  "Join a team of world-class engineers building products that make a difference."
];

const employmentTypes: Array<"full-time" | "part-time" | "internship" | "contract"> = [
  "full-time", "full-time", "full-time", "full-time", "full-time",
  "full-time", "full-time", "contract", "internship", "part-time"
];

function generateJobHash(company: string, title: string, location: string): string {
  return crypto
    .createHash("md5")
    .update(`${company}-${title}-${location}-${Date.now()}`)
    .digest("hex");
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateJobs() {
  await connectToDatabase();
  console.log("Connected to database");

  // Clear existing jobs
  await Job.deleteMany({});
  console.log("Cleared existing jobs");

  const jobs = [];

  for (let i = 0; i < 30; i++) {
    const company = getRandomItem(companies);
    const title = getRandomItem(jobTitles);
    const location = getRandomItem(locations);
    const isRemote = location === "Remote" || Math.random() > 0.7;
    const skills = getRandomItem(skillSets);
    const employmentType = getRandomItem(employmentTypes);

    const job = {
      externalJobId: `JOB-${Date.now()}-${i}`,
      source: "sandbox",
      company,
      title,
      location: isRemote ? "Remote" : location,
      isRemote,
      description: `${getRandomItem(descriptionTemplates)} ${company} is seeking a ${title} to join our team. ${getRandomItem(descriptionTemplates)}`,
      requirements: getRandomItems(requirementTemplates, 5),
      skills,
      employmentType,
      startDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
      questions: [
        {
          question: "Are you authorized to work in the United States?",
          answer: "",
        },
        {
          question: "What is your expected salary range?",
          answer: "",
        },
        {
          question: "When can you start?",
          answer: "",
        },
      ],
      applyUrl: `https://sandbox.autojob.com/apply/${company.toLowerCase().replace(/\s+/g, "-")}-${i}`,
      jobHash: generateJobHash(company, title, location),
    };

    jobs.push(job);
  }

  // Insert all jobs
  const result = await Job.insertMany(jobs);
  console.log(`✅ Successfully created ${result.length} jobs`);

  // Display summary
  console.log("\n📊 Job Summary:");
  console.log(`- Companies: ${new Set(jobs.map(j => j.company)).size}`);
  console.log(`- Job Titles: ${new Set(jobs.map(j => j.title)).size}`);
  console.log(`- Locations: ${new Set(jobs.map(j => j.location)).size}`);
  console.log(`- Remote Jobs: ${jobs.filter(j => j.isRemote).length}`);
  console.log(`- Full-time: ${jobs.filter(j => j.employmentType === "full-time").length}`);
  console.log(`- Contract: ${jobs.filter(j => j.employmentType === "contract").length}`);
  console.log(`- Internship: ${jobs.filter(j => j.employmentType === "internship").length}`);

  process.exit(0);
}

generateJobs().catch((error) => {
  console.error("❌ Error generating jobs:", error);
  process.exit(1);
});
