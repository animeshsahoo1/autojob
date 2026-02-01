import mongoose, { Schema, model, models } from "mongoose";

export interface IAgentRun {
  _id: mongoose.Types.ObjectId;

  userId: mongoose.Types.ObjectId;

  status: "RUNNING" | "STOPPED" | "COMPLETED" | "FAILED";

  appliedCountToday: number;
  skippedCountToday: number;

  lastCheckpoint?: string;

  killSwitch: boolean;

  startedAt: Date;
  finishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const agentRunSchema = new Schema<IAgentRun>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["RUNNING", "STOPPED", "COMPLETED", "FAILED"],
      default: "RUNNING",
      index: true,
    },

    appliedCountToday: {
      type: Number,
      default: 0,
    },

    skippedCountToday: {
      type: Number,
      default: 0,
    },

    lastCheckpoint: {
      type: String,
    },

    killSwitch: {
      type: Boolean,
      default: false,
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    finishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const AgentRun =
  models?.AgentRun || model<IAgentRun>("AgentRun", agentRunSchema);
