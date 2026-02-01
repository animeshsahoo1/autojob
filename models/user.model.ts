import mongoose, { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

/* ---------- Sub Types ---------- */

interface ApplyPolicy {
  maxApplicationsPerDay: number;
  minMatchScore: number;
  allowedLocations: string[];
  remoteOnly?: boolean;
  visaRequired?: boolean;
  blockedCompanies: string[];
  blockedRoles: string[];
  companyCooldownDays: number;
  killSwitch: boolean;
}

interface StudentProfile {
  education: string[];
  skills: string[];
  projects: string[];
  experience: string[];
  links: string[];
}

interface ResumeArtifacts {
  baseResumeUrl: string;
  resumeVariants: {
    name: string; // e.g. "frontend", "backend"
    url: string;
  }[];
  bulletBank: string[];
  proofLinks: string[];
}

/* ---------- Main User Interface ---------- */

export interface IUser {
  _id: mongoose.Types.ObjectId;

  name: string;
  email: string;

  provider: "credentials" | "google";
  providerId?: string;

  password?: string;

  role: "student" | "admin";

  studentProfile?: StudentProfile;
  resumeArtifacts?: ResumeArtifacts;

  // Resume references
  resumes?: mongoose.Types.ObjectId[];

  // User feedback for improving resume parsing
  parsingFeedback?: string[];

  applyPolicy?: ApplyPolicy;

  lastRunAt?: Date;
  isActive?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/* ---------- Schema ---------- */

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
      required: true,
    },

    providerId: {
      type: String,
      sparse: true,
      index: true,
    },

    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === "credentials";
      },
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    studentProfile: {
      education: [String],
      skills: [String],
      projects: [String],
      experience: [String],
      links: [String],
    },

    resumeArtifacts: {
      baseResumeUrl: String,
      resumeVariants: [
        {
          name: String,
          url: String,
        },
      ],
      bulletBank: [String],
      proofLinks: [String],
    },

    resumes: [{
      type: Schema.Types.ObjectId,
      ref: "Resume",
    }],

    parsingFeedback: [String],

    applyPolicy: {
      maxApplicationsPerDay: { type: Number, default: 10 },
      minMatchScore: { type: Number, default: 60 },
      allowedLocations: [String],
      remoteOnly: Boolean,
      visaRequired: Boolean,
      blockedCompanies: [String],
      blockedRoles: [String],
      companyCooldownDays: { type: Number, default: 30 },
      killSwitch: { type: Boolean, default: false },
    },

    lastRunAt: Date,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* ---------- Hooks ---------- */

userSchema.pre("save", function () {
  if (this.provider === "credentials" && !this.password) {
    throw new Error("Password required for credentials provider");
  }

  if (this.provider === "google" && !this.providerId) {
    throw new Error("Provider ID required for Google login");
  }
});

/* ---------- Methods ---------- */

userSchema.methods.isPasswordCorrect = async function (
  password: string
) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

/* ---------- Export ---------- */

export const User =
  models?.User || model<IUser>("User", userSchema);
