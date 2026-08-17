import mongoose from "mongoose";

const agentTaskSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    query: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelQuery",
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: ["NEW_QUERY", "QUOTE_SENT", "BOOKING_PROCESSED", "BOOKING_CONFIRMED"],
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    author: {
      type: String,
      default: "Agent",
      trim: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    dueNotificationDismissedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

agentTaskSchema.index({ agent: 1, query: 1, stage: 1, createdAt: -1 });
agentTaskSchema.index({ agent: 1, dueDate: 1, resolved: 1, dueNotificationDismissedAt: 1 });

export default mongoose.model("AgentTask", agentTaskSchema);