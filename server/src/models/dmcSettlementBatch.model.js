import mongoose from "mongoose";

const settlementBatchItemSchema = new mongoose.Schema(
  {
    query: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelQuery",
      required: true,
    },
    queryCode: {
      type: String,
      trim: true,
      required: true,
    },
    destination: {
      type: String,
      trim: true,
      default: "",
    },
    serviceRef: {
      type: String,
      trim: true,
      required: true,
    },
    serviceIndex: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      trim: true,
      default: "Hotel",
    },
    service: {
      type: String,
      trim: true,
      required: true,
    },
    serviceDate: {
      type: Date,
      default: null,
    },
    creditStartDate: {
      type: Date,
      default: null,
    },
    currency: {
      type: String,
      trim: true,
      default: "INR",
    },
    qty: {
      type: Number,
      default: 1,
    },
    rate: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const settlementBatchDocumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    filePath: {
      type: String,
      trim: true,
      required: true,
    },
    size: {
      type: String,
      trim: true,
      default: "",
    },
    kind: {
      type: String,
      trim: true,
      default: "invoice",
    },
  },
  { _id: false },
);

const dmcSettlementBatchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      required: true,
    },
    dmc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      index: true,
    },
    dmcName: {
      type: String,
      trim: true,
      default: "",
    },
    supplierName: {
      type: String,
      trim: true,
      required: true,
    },
    coveredQueries: {
      type: [
        {
          query: { type: mongoose.Schema.Types.ObjectId, ref: "TravelQuery" },
          queryCode: { type: String, trim: true },
          destination: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    creditPeriodDays: {
      type: Number,
      enum: [7, 15],
      default: 7,
    },
    items: {
      type: [settlementBatchItemSchema],
      default: [],
    },
    documents: {
      type: [settlementBatchDocumentSchema],
      default: [],
    },
    invoiceSource: {
      type: String,
      enum: ["system_template", "uploaded_invoice"],
      default: "system_template",
    },
    uploadedInvoice: {
      name: { type: String, trim: true, default: "" },
      filePath: { type: String, trim: true, default: "" },
      size: { type: String, trim: true, default: "" },
      mimeType: { type: String, trim: true, default: "" },
    },
    claimedSummary: {
      subtotal: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
    invoiceExtraction: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    taxConfig: {
      gstRate: { type: Number, default: 0 },
      tcsRate: { type: Number, default: 0 },
      otherTax: { type: Number, default: 0 },
    },
    summary: {
      subtotal: { type: Number, default: 0 },
      gstAmount: { type: Number, default: 0 },
      tcsAmount: { type: Number, default: 0 },
      otherTaxAmount: { type: Number, default: 0 },
      totalTax: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
    templateVariant: {
      type: String,
      default: "aurora-ledger",
    },
    status: {
      type: String,
      enum: ["Submitted", "In Review", "Approved", "Rejected", "Partially Paid", "Paid"],
      default: "Submitted",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    payoutReference: { type: String, trim: true, default: "" },
    payoutDate: { type: Date, default: null },
    payoutBank: { type: String, trim: true, default: "" },
    payoutAmount: { type: Number, default: 0 },
    payoutInstallments: {
      type: [
        {
          amount: { type: Number, required: true },
          utrNumber: { type: String, required: true },
          bankName: { type: String, required: true },
          paymentDate: { type: Date, required: true },
          financeNotes: { type: String, default: "" },
          paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },
          paidByName: { type: String },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    financeNotes: { type: String, trim: true, default: "" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", default: null },
    assignedToName: { type: String, trim: true, default: "" },
    assignedToEmail: { type: String, trim: true, default: "" },
    assignedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", default: null },
    reviewedByName: { type: String, trim: true, default: "" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

dmcSettlementBatchSchema.index({ dmc: 1, status: 1, dueDate: 1 });
dmcSettlementBatchSchema.index({ dmc: 1, "items.serviceRef": 1 });

export default mongoose.model("DmcSettlementBatch", dmcSettlementBatchSchema);
