/**
 * ArtifactNode
 *
 * Builds or loads the student artifact pack including:
 * - Student profile (skills, education, experience, projects)
 * - Resume variants (base + specialized versions)
 * - Bullet bank (reusable achievement statements)
 * - Proof links (portfolio, GitHub, LinkedIn, etc.)
 *
 * What it does:
 * 1. Fetch User by userId
 * 2. Load Resume documents from user.resumes[]
 * 3. Extract Student Profile from Resume data
 * 4. Extract Resume Artifacts (bulletBank, proofLinks, resumeVariants)
 * 5. Validate that required artifacts exist
 * 6. Set artifactState in workflow state
 * 7. Set checkpoint to "ARTIFACT"
 *
 * What it does NOT do:
 * ❌ No job fetching
 * ❌ No ranking
 * ❌ No LLM calls for artifact generation (just loads existing data)
 * ❌ No writes to database
 */

import { JobApplyAgentState, StudentProfile } from "../state";
import { connectToDatabase } from "@/database/db";
import { User, IUser } from "@/models/user.model";
import Resume, { IResume } from "@/models/resume.model";

export async function artifactNode(
  state: JobApplyAgentState,
): Promise<Partial<JobApplyAgentState>> {
  await connectToDatabase();

  const errors: string[] = [];

  try {
    // 1. Fetch User by userId
    const user = (await User.findById(state.userId).lean()) as IUser | null;
    if (!user) {
      throw new Error(`User not found: ${state.userId}`);
    }

    // 2. Fetch Resume documents
    if (!user.resumes || user.resumes.length === 0) {
      throw new Error(
        "No resumes found. User must upload at least one resume.",
      );
    }

    const resumeDocs = await Resume.find({
      _id: { $in: user.resumes },
    }).lean();

    if (resumeDocs.length === 0) {
      throw new Error("Resume documents not found in database.");
    }

    const resumes = resumeDocs as unknown as IResume[];

    // Use the first resume as primary
    const primaryResume = resumes[0];

    // 3. Extract Student Profile from Resume
    const studentProfile: StudentProfile = {
      // Education: format as strings
      education: primaryResume.education.map(
        (edu) =>
          `${edu.degree}${edu.major ? ` in ${edu.major}` : ""} at ${edu.institution}${edu.gpa ? ` (GPA: ${edu.gpa})` : ""}`,
      ),

      // Skills: flatten all skill categories
      skills: primaryResume.skills.flatMap((skillGroup) => skillGroup.skills),

      // Projects: format as strings
      projects:
        primaryResume.projects?.map(
          (proj) =>
            `${proj.name}${proj.description ? `: ${proj.description}` : ""}`,
        ) || [],

      // Experience: format as strings
      experience: primaryResume.workExperience.map(
        (exp) =>
          `${exp.position} at ${exp.company}${exp.description ? `: ${exp.description}` : ""}`,
      ),

      // Links: extract from personalInfo
      links: [
        primaryResume.personalInfo.linkedIn,
        primaryResume.personalInfo.github,
        primaryResume.personalInfo.portfolio,
        primaryResume.personalInfo.website,
        ...(primaryResume.personalInfo.socialLinks?.map((s) => s.url) || []),
      ].filter((link): link is string => !!link),
    };

    // Validate student profile has minimum data
    if (
      studentProfile.skills.length === 0 &&
      studentProfile.education.length === 0 &&
      studentProfile.experience.length === 0
    ) {
      errors.push(
        "Resume is incomplete. Need at least skills, education, or work experience.",
      );
    }

    // 4. Extract Bullet Bank from all resumes
    const bulletBank: string[] = [];

    resumes.forEach((resume) => {
      // Add work experience achievements
      resume.workExperience.forEach((exp) => {
        if (exp.achievements) {
          bulletBank.push(...exp.achievements);
        }
        if (exp.responsibilities) {
          bulletBank.push(...exp.responsibilities);
        }
      });

      // Add project achievements
      resume.projects?.forEach((proj) => {
        if (proj.achievements) {
          bulletBank.push(...proj.achievements);
        }
        if (proj.highlights) {
          bulletBank.push(...proj.highlights);
        }
      });
    });

    // Deduplicate bullet bank
    const uniqueBulletBank = Array.from(new Set(bulletBank));

    // 5. Extract Proof Links from all resumes
    const proofLinksSet = new Set<string>();

    resumes.forEach((resume) => {
      // Add personal info links
      if (resume.personalInfo.linkedIn)
        proofLinksSet.add(resume.personalInfo.linkedIn);
      if (resume.personalInfo.github)
        proofLinksSet.add(resume.personalInfo.github);
      if (resume.personalInfo.portfolio)
        proofLinksSet.add(resume.personalInfo.portfolio);
      if (resume.personalInfo.website)
        proofLinksSet.add(resume.personalInfo.website);

      resume.personalInfo.socialLinks?.forEach((link) => {
        if (link.url) proofLinksSet.add(link.url);
      });

      // Add project URLs
      resume.projects?.forEach((proj) => {
        if (proj.url) proofLinksSet.add(proj.url);
        if (proj.github) proofLinksSet.add(proj.github);
      });
    });

    const proofLinks = Array.from(proofLinksSet);

    // 6. Create Resume Variants from all resumes
    const resumeVariants = resumes.map((resume, index) => ({
      name: resume.templateName || resume.version || `variant-${index + 1}`,
      url: resume.fileUrl || "",
    }));

    // Filter out resumes without fileUrl
    const validResumeVariants = resumeVariants.filter((variant) => variant.url);

    if (validResumeVariants.length === 0) {
      throw new Error("No resume files found. Resumes must have fileUrl set.");
    }

    const baseResumeUrl = validResumeVariants[0].url;

    // 7. Return artifactState
    return {
      artifactState: {
        studentProfile,
        bulletBank: uniqueBulletBank,
        proofLinks,
        resumeVariants: validResumeVariants,
        baseResumeUrl,
      },
      lastCheckpoint: "ARTIFACT",
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    errors.push(`ArtifactNode error: ${(error as Error).message}`);
    return {
      errors,
      stopRequested: true,
      runStatus: "FAILED",
      lastCheckpoint: "ARTIFACT_FAILED",
    };
  }
}
