import { connectToDatabase } from "../database/db";
import Resume from "../models/resume.model";

async function checkResume() {
  await connectToDatabase();

  const resumeId = "697f8b13b261b4f401c759df";
  const resume = await Resume.findById(resumeId);

  if (!resume) {
    console.log("❌ Resume not found");
    process.exit(1);
  }

  console.log("\n📄 Resume Found!");
  console.log("\n🎯 Skills:");
  console.log(resume.skills?.technical || []);

  console.log("\n💼 Work Experience:");
  resume.workExperience?.forEach((exp, i) => {
    console.log(`${i + 1}. ${exp.title} at ${exp.company}`);
    console.log(`   ${exp.startDate} - ${exp.endDate || "Present"}`);
  });

  console.log("\n🎓 Education:");
  resume.education?.forEach((edu, i) => {
    console.log(`${i + 1}. ${edu.degree} in ${edu.fieldOfStudy}`);
    console.log(`   ${edu.institution} (${edu.graduationDate})`);
  });

  console.log("\n🚀 Projects:");
  resume.projects?.forEach((proj, i) => {
    console.log(`${i + 1}. ${proj.name}`);
    console.log(`   Technologies: ${proj.technologies?.join(", ")}`);
  });

  process.exit(0);
}

checkResume();
