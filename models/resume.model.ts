import mongoose, { Schema, model, models } from "mongoose";

/* ---------- Sub Interfaces ---------- */

export interface IPersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  website?: string;
  socialLinks?: {
    platform: string;
    url: string;
  }[];
}

export interface IEducation {
  institution: string;
  degree: string; // e.g., "Bachelor of Science", "Master of Arts"
  major?: string;
  minor?: string;
  gpa?: number;
  maxGpa?: number;
  startDate?: Date;
  endDate?: Date;
  isCurrentlyEnrolled?: boolean;
  location?: string;
  achievements?: string[];
  coursework?: string[];
  honors?: string[];
}

export interface IWorkExperience {
  company: string;
  position: string;
  location?: string;
  isRemote?: boolean;
  startDate?: Date;
  endDate?: Date;
  isCurrent?: boolean;
  employmentType?: "full-time" | "part-time" | "internship" | "contract" | "freelance";
  description?: string;
  responsibilities?: string[];
  achievements?: string[];
  technologies?: string[];
}

export interface IProject {
  name: string;
  description?: string;
  role?: string;
  startDate?: Date;
  endDate?: Date;
  technologies?: string[];
  achievements?: string[];
  url?: string;
  github?: string;
  highlights?: string[];
  teamSize?: number;
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate?: Date;
  expirationDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

export interface ISkill {
  category: string; // e.g., "Programming Languages", "Frameworks", "Tools", "Soft Skills"
  skills: string[];
}

export interface IPublication {
  title: string;
  authors?: string[];
  publisher?: string;
  publicationDate?: Date;
  url?: string;
  doi?: string;
  description?: string;
}

export interface IAward {
  title: string;
  issuer: string;
  date?: Date;
  description?: string;
}

export interface IVolunteerExperience {
  organization: string;
  role: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent?: boolean;
  description?: string;
  achievements?: string[];
}

export interface ILanguage {
  language: string;
  proficiency: "native" | "fluent" | "professional" | "intermediate" | "basic";
}

export interface IReference {
  name: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

/* ---------- Main Resume Interface ---------- */

export interface IResume {
  _id: mongoose.Types.ObjectId;

  userId: mongoose.Types.ObjectId;

  // Personal Information
  personalInfo: IPersonalInfo;

  // Professional Summary
  summary?: string;
  objective?: string;

  // Education
  education: IEducation[];

  // Work Experience
  workExperience: IWorkExperience[];

  // Projects
  projects?: IProject[];

  // Skills
  skills: ISkill[];

  // Certifications & Licenses
  certifications?: ICertification[];

  // Publications
  publications?: IPublication[];

  // Awards & Honors
  awards?: IAward[];

  // Volunteer Experience
  volunteerExperience?: IVolunteerExperience[];

  // Languages
  languages?: ILanguage[];

  // References
  references?: IReference[];

  // Additional Information
  interests?: string[];
  hobbies?: string[];

  // Eligibility & Legal
  workAuthorization?: {
    country: string;
    status: "citizen" | "permanent_resident" | "work_visa" | "student_visa" | "requires_sponsorship";
    requiresSponsorship?: boolean;
    visaType?: string;
  }[];

  // Preferences
  desiredRoles?: string[];
  desiredLocations?: string[];
  willingToRelocate?: boolean;
  remotePreference?: "remote_only" | "hybrid" | "onsite" | "flexible";
  expectedSalary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  availableStartDate?: Date;
  noticePeriod?: number; // in days

  // Resume Metadata
  version?: string;
  templateName?: string;
  fileUrl?: string; // URL to the actual resume PDF/DOC file
  rawText?: string; // Extracted text from the resume
  parsedDate?: Date;
  lastUpdated?: Date;

  // Military Service (optional, common in some countries)
  militaryService?: {
    branch?: string;
    rank?: string;
    startDate?: Date;
    endDate?: Date;
    description?: string;
  };

  // Professional Memberships
  professionalMemberships?: {
    organization: string;
    role?: string;
    membershipId?: string;
    startDate?: Date;
    endDate?: Date;
    isCurrent?: boolean;
  }[];

  // Patents (for technical/research roles)
  patents?: {
    title: string;
    patentNumber?: string;
    filingDate?: Date;
    grantDate?: Date;
    description?: string;
    url?: string;
  }[];

  // Teaching Experience (for academic roles)
  teachingExperience?: {
    institution: string;
    role: string;
    courses?: string[];
    startDate?: Date;
    endDate?: Date;
    isCurrent?: boolean;
  }[];

  // Custom Fields (for flexible data storage)
  customFields?: {
    key: string;
    value: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

/* ---------- Mongoose Schema ---------- */

const personalInfoSchema = new Schema<IPersonalInfo>({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
  },
  linkedIn: { type: String },
  github: { type: String },
  portfolio: { type: String },
  website: { type: String },
  socialLinks: [
    {
      platform: { type: String },
      url: { type: String },
    },
  ],
});

const educationSchema = new Schema<IEducation>({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  major: { type: String },
  minor: { type: String },
  gpa: { type: Number },
  maxGpa: { type: Number },
  startDate: { type: Date },
  endDate: { type: Date },
  isCurrentlyEnrolled: { type: Boolean },
  location: { type: String },
  achievements: [{ type: String }],
  coursework: [{ type: String }],
  honors: [{ type: String }],
});

const workExperienceSchema = new Schema<IWorkExperience>({
  company: { type: String, required: true },
  position: { type: String, required: true },
  location: { type: String },
  isRemote: { type: Boolean },
  startDate: { type: Date },
  endDate: { type: Date },
  isCurrent: { type: Boolean },
  employmentType: {
    type: String,
    enum: ["full-time", "part-time", "internship", "contract", "freelance"],
  },
  description: { type: String },
  responsibilities: [{ type: String }],
  achievements: [{ type: String }],
  technologies: [{ type: String }],
});

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String },
  role: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  technologies: [{ type: String }],
  achievements: [{ type: String }],
  url: { type: String },
  github: { type: String },
  highlights: [{ type: String }],
  teamSize: { type: Number },
});

const certificationSchema = new Schema<ICertification>({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: Date },
  expirationDate: { type: Date },
  credentialId: { type: String },
  credentialUrl: { type: String },
  description: { type: String },
});

const skillSchema = new Schema<ISkill>({
  category: { type: String, required: true },
  skills: [{ type: String }],
});

const publicationSchema = new Schema<IPublication>({
  title: { type: String, required: true },
  authors: [{ type: String }],
  publisher: { type: String },
  publicationDate: { type: Date },
  url: { type: String },
  doi: { type: String },
  description: { type: String },
});

const awardSchema = new Schema<IAward>({
  title: { type: String, required: true },
  issuer: { type: String, required: true },
  date: { type: Date },
  description: { type: String },
});

const volunteerExperienceSchema = new Schema<IVolunteerExperience>({
  organization: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  isCurrent: { type: Boolean },
  description: { type: String },
  achievements: [{ type: String }],
});

const languageSchema = new Schema<ILanguage>({
  language: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ["native", "fluent", "professional", "intermediate", "basic"],
    required: true,
  },
});

const referenceSchema = new Schema<IReference>({
  name: { type: String, required: true },
  position: { type: String },
  company: { type: String },
  email: { type: String },
  phone: { type: String },
  relationship: { type: String },
});

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    personalInfo: {
      type: personalInfoSchema,
      required: true,
    },

    summary: { type: String },
    objective: { type: String },

    education: {
      type: [educationSchema],
      default: [],
    },

    workExperience: {
      type: [workExperienceSchema],
      default: [],
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    skills: {
      type: [skillSchema],
      default: [],
    },

    certifications: {
      type: [certificationSchema],
      default: [],
    },

    publications: {
      type: [publicationSchema],
      default: [],
    },

    awards: {
      type: [awardSchema],
      default: [],
    },

    volunteerExperience: {
      type: [volunteerExperienceSchema],
      default: [],
    },

    languages: {
      type: [languageSchema],
      default: [],
    },

    references: {
      type: [referenceSchema],
      default: [],
    },

    interests: [{ type: String }],
    hobbies: [{ type: String }],

    workAuthorization: [
      {
        country: { type: String, required: true },
        status: {
          type: String,
          enum: [
            "citizen",
            "permanent_resident",
            "work_visa",
            "student_visa",
            "requires_sponsorship",
          ],
          required: true,
        },
        requiresSponsorship: { type: Boolean },
        visaType: { type: String },
      },
    ],

    desiredRoles: [{ type: String }],
    desiredLocations: [{ type: String }],
    willingToRelocate: { type: Boolean },
    remotePreference: {
      type: String,
      enum: ["remote_only", "hybrid", "onsite", "flexible"],
    },
    expectedSalary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "USD" },
    },
    availableStartDate: { type: Date },
    noticePeriod: { type: Number },

    version: { type: String },
    templateName: { type: String },
    fileUrl: { type: String },
    rawText: { type: String },
    parsedDate: { type: Date },
    lastUpdated: { type: Date },

    militaryService: {
      branch: { type: String },
      rank: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String },
    },

    professionalMemberships: [
      {
        organization: { type: String, required: true },
        role: { type: String },
        membershipId: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean },
      },
    ],

    patents: [
      {
        title: { type: String, required: true },
        patentNumber: { type: String },
        filingDate: { type: Date },
        grantDate: { type: Date },
        description: { type: String },
        url: { type: String },
      },
    ],

    teachingExperience: [
      {
        institution: { type: String, required: true },
        role: { type: String, required: true },
        courses: [{ type: String }],
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean },
      },
    ],

    customFields: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ "personalInfo.email": 1 });
resumeSchema.index({ parsedDate: -1 });

const Resume = models.Resume || model<IResume>("Resume", resumeSchema);

export default Resume;
