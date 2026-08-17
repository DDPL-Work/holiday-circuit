// models/Confirmation.js
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  supplierConfirmation: {
    type: String,
  },
  voucherReference: {
    type: String,
  },
  termsConditions: {
    type: String,
  },
});

const supplierPaymentInstallmentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    status: { type: String, default: "Paid" },
    dueDate: { type: Date, default: null },
    paymentDate: { type: Date, default: Date.now },
    comments: { type: String, default: "" },
    verifiedBy: { type: String, default: "" },
    utrNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    createdByName: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },
  },
  { timestamps: true }
);

const supplierPaymentSchema = new mongoose.Schema(
  {
    serviceKey: { type: String, default: "" },
    serviceName: { type: String, default: "" },
    supplierName: { type: String, default: "" },
    totalCost: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    installments: [supplierPaymentInstallmentSchema],
  },
  { timestamps: true }
);

const confirmationSchema = new mongoose.Schema(
  {
    dmcId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    queryId: {
      type: String,
      required: true,
    },
    services: [
      {
        type: {
          type: String,
        },
        serviceName: {
          type: String,
        },
        serviceDate: {
          type: String,
        },
        status: {
          type: String,
        },
        confirmationNumber: {
          type: String,
        },
        voucherNumber: {
          type: String,
        },
      },
    ],
    emergencyContact: {
      type: String,
    },
    supplierPayments: [supplierPaymentSchema],
    documents: documentSchema,

    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft",
    },
  },

  { timestamps: true }
);

confirmationSchema.index({ dmcId: 1, queryId: 1 }, { unique: true });
confirmationSchema.index({ queryId: 1, updatedAt: -1 });
confirmationSchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model("Confirmation", confirmationSchema);
