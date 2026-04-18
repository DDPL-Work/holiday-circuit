import mongoose from "mongoose";

const adminAccessSchema = new mongoose.Schema(
{
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },

  permissions: {
    approveAgent: {
      type: Boolean,
      default: true
    },

    rejectAgent: {
      type: Boolean,
      default: true
    },

    manageRoles: {
      type: Boolean,
      default: true
    },

    manageRateContracts: {
      type: Boolean,
      default: true
    },

    monitorSystemActivity: {
      type: Boolean,
      default: true
    },

    monitorPayments: {
      type: Boolean,
      default: true
    }
  }

},
{ timestamps: true }
);

export default mongoose.model("AdminAccess", adminAccessSchema);
