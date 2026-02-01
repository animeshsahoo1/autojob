import mongoose, { Schema, model, models } from "mongoose";

export interface IJobMatch {
  _id: mongoose.Types.ObjectId;

  agentRunId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  matchScore: number; // 0–100

  skillOverlapScore: number;
  experienceFitScore: number;
  constraintFitScore: number;

  evidenceCoverage: number; // %

  confidenceLevels: {
    strong: number;
    medium: number;
    weak: number;
  };

  rankingReason: string;

  createdAt: Date;
  updatedAt: Date;
}

const jobMatchSchema = new Schema<IJobMatch>(
  {
    agentRunId: {
      type: Schema.Types.ObjectId,
      ref: "AgentRun",
      required: true,
      index: true,
    },

    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },

    skillOverlapScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    experienceFitScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    constraintFitScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    evidenceCoverage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    confidenceLevels: {
      strong: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      weak: { type: Number, default: 0 },
    },

    rankingReason: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const JobMatch =
  models?.JobMatch || model<IJobMatch>("JobMatch", jobMatchSchema);
