import mongoose, { Schema, model, models } from "mongoose";

export interface IApplication {
  _id: mongoose.Types.ObjectId;

  agentRunId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  resumeVariantUsed: string;

  answeredQuestions?: { question: string; answer: string }[];

  validationState?: {
    confidenceScore: number;
    isGrounded: boolean;
    hallucinationRisks: string[];
  };

  status: "QUEUED" | "SUBMITTED" | "FAILED" | "RETRIED";

  attempts: number;

  receipt?: string;
  error?: string;

  timeline: {
    stage:
      | "SEARCHED"
      | "RANKED"
      | "POLICY_ALLOWED"
      | "PERSONALIZED"
      | "APPLIED"
      | "SUBMITTED"
      | "FAILED";
    timestamp: Date;
    message?: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
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

    resumeVariantUsed: {
      type: String,
      required: true,
    },

    answeredQuestions: [
      {
        question: String,
        answer: String,
      },
    ],

    validationState: {
      confidenceScore: Number,
      isGrounded: Boolean,
      hallucinationRisks: [String],
    },

    status: {
      type: String,
      enum: ["QUEUED", "SUBMITTED", "FAILED", "RETRIED"],
      default: "QUEUED",
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    receipt: {
      type: String,
    },

    error: {
      type: String,
    },

    timeline: [
      {
        stage: {
          type: String,
          enum: [
            "SEARCHED",
            "RANKED",
            "POLICY_ALLOWED",
            "PERSONALIZED",
            "APPLIED",
            "SUBMITTED",
            "FAILED",
          ],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        message: String,
      },
    ],
  },
  { timestamps: true },
);

export const Application =
  models?.Application || model<IApplication>("Application", applicationSchema);
