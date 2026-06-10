import mongoose from "mongoose";

const adminOverrideCaseSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["ops_query", "agent_approval", "payment_verification", "internal_invoice"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reference: {
      type: String,
      default: "",
      trim: true,
    },
    sourceModule: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Open", "Resolved", "Overridden", "Rejected"],
      default: "Open",
      index: true,
    },
    requestedByName: {
      type: String,
      default: "",
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    resolvedByName: {
      type: String,
      default: "",
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    decision: {
      type: String,
      enum: ["", "approve", "reject", "resolve"],
      default: "",
    },
    resolutionNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

adminOverrideCaseSchema.index({ targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model("AdminOverrideCase", adminOverrideCaseSchema);
