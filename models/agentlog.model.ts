import mongoose, { Schema, model, models } from "mongoose";

export interface IAgentLog {
  _id: mongoose.Types.ObjectId;

  agentRunId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  stage:
    | "ARTIFACT"
    | "SEARCH"
    | "RANK"
    | "POLICY"
    | "QUEUE"
    | "PERSONALIZE"
    | "APPLY"
    | "VALIDATION"
    | "SYSTEM";

  level: "INFO" | "WARN" | "ERROR";

  message: string;

  metadata?: Record<string, any>;

  createdAt: Date;
}

const agentLogSchema = new Schema<IAgentLog>(
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
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    stage: {
      type: String,
      enum: [
        "ARTIFACT",
        "SEARCH",
        "RANK",
        "POLICY",
        "QUEUE",
        "PERSONALIZE",
        "APPLY",
        "VALIDATION",
        "SYSTEM",
      ],
      required: true,
      index: true,
    },

    level: {
      type: String,
      enum: ["INFO", "WARN", "ERROR"],
      default: "INFO",
      index: true,
    },

    message: {
      type: String,
      required: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AgentLog =
  models?.AgentLog || model<IAgentLog>("AgentLog", agentLogSchema);
