import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  companyName: {
    type: String,
    required: function () {
    return this.role === "agent";
  }

  },

gstNumber: {
  type: String,
  unique: true,
  sparse: true,
  required: function () {
    return this.role === "agent";
  }
},

  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },

  phone: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
      return this.role === "agent";
      },
      trim: true,
    },

  profileImage: {
    type: String,
    trim: true,
    default: "",
  },

  documents: {
      type: [String],
      required: function () {
      return this.role === "agent";
      }
    },

  role: {
    type: String,
    enum: [
      "admin",
      "agent",
      "operations",
      "dmc_partner",
      "finance_partner",
      "operation_manager",
      "finance_manager",
    ],
    required: true
  },

    status: {
      type: String,
      enum: ["pending", "approve", "rejected"],
    default: function () {
      return this.role === "agent" ? "pending" : undefined;
      }
    },

  manager: {
    type: String,
    trim: true,
    default: "",
  },

  department: {
    type: String,
    trim: true,
    default: "",
  },

  designation: {
    type: String,
    trim: true,
    default: "",
  },

  permissions: {
    type: [String],
    default: [],
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: {
    type: Date,
    default: null,
  },

  deletedBy: {
    type: String,
    trim: true,
    default: "",
  },

  deletionReason: {
    type: String,
    trim: true,
    default: "",
  },

  accountStatus: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },

  accessExpiry: {
    type: Date,
    default: null,
  },

  isApproved: {
    type: Boolean,
    default: false
  },

  reviewedAt: {
    type: Date,
    default: null,
  },

  reviewedBy: {
    type: String,
    trim: true,
    default: "",
  },

  reviewedById: {
    type: String,
    trim: true,
    default: "",
  },

  rejectionReason: {
    type: String,
    trim: true,
    default: "",
  },

  resetPasswordOtpHash: {
    type: String,
    default: ""
  },

  resetPasswordOtpExpiry: {
    type: Date,
    default: null
  },

  resetPasswordOtpVerifiedAt: {
    type: Date,
    default: null
  }

},
{ timestamps: true }
);


//======= THIS IS THE KEY PART =============

agentSchema.pre("save", function () {
  if (this.isDeleted) {
    this.accountStatus = "Inactive";
  }

  if (!["agent", "dmc_partner", "finance_partner"].includes(this.role)) {
    this.companyName = undefined;
    this.gstNumber = undefined;
    this.documents = undefined;
    this.status = undefined;
    this.reviewedAt = undefined;
    this.reviewedBy = undefined;
    this.reviewedById = undefined;
    this.rejectionReason = undefined;
  }

  if (this.phone !== undefined && this.phone !== null) {
    this.phone = String(this.phone).trim();
  }

  if (!this.phone) {
    this.phone = undefined;
  }

  if (!this.employeeId) {
    this.employeeId = undefined;
  }

  if (!this.gstNumber) {
    this.gstNumber = undefined;
  }

  if (!Array.isArray(this.permissions)) {
    this.permissions = [];
  }
});


export default mongoose.model("Auth", agentSchema);


