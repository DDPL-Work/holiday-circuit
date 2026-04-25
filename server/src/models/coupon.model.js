import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0.01,
    },
    discountLabel: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    assignedAgentName: {
      type: String,
      trim: true,
      default: "",
    },
    assignedAgentEmail: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
    lastSentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    sentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redeemedByInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    redeemedInvoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    redeemedByAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

couponSchema.pre("validate", function normalizeCoupon() {
  if (this.code) {
    this.code = String(this.code).trim().toUpperCase();
  }

  if (this.assignedAgentEmail) {
    this.assignedAgentEmail = String(this.assignedAgentEmail).trim().toLowerCase();
  }

  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    throw new Error("End date cannot be earlier than start date");
  }
});

couponSchema.index({ assignedAgent: 1, createdAt: -1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
