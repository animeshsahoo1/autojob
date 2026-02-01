import mongoose, { Schema, model, models } from "mongoose";

export interface IJob {
  _id: mongoose.Types.ObjectId;

  externalJobId: string; // ID from source or sandbox
  source: string; // e.g. "sandbox", "dataset", "adzuna"

  company: string;
  title: string;

  location: string;
  isRemote?: boolean;

  description: string;
  requirements: string[];
  skills: string[]; // keywords for matching

  employmentType?: "full-time" | "part-time" | "internship" | "contract";
  startDate?: Date;

  questions?: {
    question: string;
    answer?: string;
  }[];

  applyUrl?: string; // sandbox apply endpoint

  jobHash: string; // used for deduplication

  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    externalJobId: {
      type: String,
      required: true,
      index: true,
    },

    source: {
      type: String,
      required: true,
      index: true,
    },

    company: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    isRemote: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      required: true,
    },

    requirements: {
      type: [String],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
      index: true,
    },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract"],
    },

    startDate: {
      type: Date,
    },

    questions: [
      {
        question: String,
        answer: String,
      },
    ],

    applyUrl: {
      type: String,
    },

    jobHash: {
      type: String,
      required: true,
      unique: true, // ensures deduplication
      index: true,
    },
  },
  { timestamps: true },
);

export const Job = models?.Job || model<IJob>("Job", jobSchema);
