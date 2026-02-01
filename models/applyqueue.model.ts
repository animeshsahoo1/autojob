import mongoose, { Schema, model, models } from "mongoose";

export interface IApplyQueue {
  _id: mongoose.Types.ObjectId;

  agentRunId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  status: "QUEUED" | "SKIPPED" | "SENT";

  skipReason?:
    | "POLICY_BLOCK"
    | "LOW_MATCH_SCORE"
    | "MISSING_EVIDENCE"
    | "COMPANY_COOLDOWN"
    | "DUPLICATE"
    | "KILL_SWITCH";

  cooldownUntil?: Date;

  queuedAt: Date;
  sentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const applyQueueSchema = new Schema<IApplyQueue>(
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

    status: {
      type: String,
      enum: ["QUEUED", "SKIPPED", "SENT"],
      required: true,
      index: true,
    },

    skipReason: {
      type: String,
      enum: [
        "POLICY_BLOCK",
        "LOW_MATCH_SCORE",
        "MISSING_EVIDENCE",
        "COMPANY_COOLDOWN",
        "DUPLICATE",
        "KILL_SWITCH",
      ],
    },

    cooldownUntil: {
      type: Date,
    },

    queuedAt: {
      type: Date,
      default: Date.now,
    },

    sentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const ApplyQueue =
  models?.ApplyQueue || model<IApplyQueue>("ApplyQueue", applyQueueSchema);
