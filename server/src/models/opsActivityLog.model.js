import mongoose from "mongoose";

const opsActivityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    module: {
      type: String,
      default: "Package Management",
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
      },
      name: {
        type: String,
        default: "Operations Member",
      },
      email: {
        type: String,
        default: "",
      },
      role: {
        type: String,
        default: "operations",
      },
    },
    targetItem: {
      itemId: {
        type: String,
        default: "",
      },
      itemType: {
        type: String,
        default: "PackageTemplate",
      },
      itemName: {
        type: String,
        default: "",
      },
      destination: {
        type: String,
        default: "",
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
  },
  { timestamps: true }
);

opsActivityLogSchema.index({ createdAt: -1 });
opsActivityLogSchema.index({ "performedBy.userId": 1, createdAt: -1 });

const OpsActivityLog = mongoose.model("OpsActivityLog", opsActivityLogSchema);

export default OpsActivityLog;
