import mongoose from "mongoose";

const internalInvoiceItemSchema = new mongoose.Schema(
  {
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

const internalInvoiceDocumentSchema = new mongoose.Schema(
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

const internalInvoiceSchema = new mongoose.Schema(
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
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    agentName: {
      type: String,
      trim: true,
      default: "",
    },
    dmc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    dmcName: {
      type: String,
      trim: true,
      default: "",
    },
    destination: {
      type: String,
      trim: true,
      default: "",
    },
    supplierName: {
      type: String,
      trim: true,
      required: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    items: {
      type: [internalInvoiceItemSchema],
      default: [],
    },
    documents: {
      type: [internalInvoiceDocumentSchema],
      default: [],
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
      enum: ["Submitted", "In Review", "Approved", "Rejected", "Paid"],
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
    payoutReference: {
      type: String,
      trim: true,
      default: "",
    },
    payoutDate: {
      type: Date,
      default: null,
    },
    payoutBank: {
      type: String,
      trim: true,
      default: "",
    },
    payoutAmount: {
      type: Number,
      default: 0,
    },
    financeNotes: {
      type: String,
      trim: true,
      default: "",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    assignedToName: {
      type: String,
      trim: true,
      default: "",
    },
    assignedToEmail: {
      type: String,
      trim: true,
      default: "",
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    reviewedByName: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

internalInvoiceSchema.index({ query: 1, dmc: 1 }, { unique: true });

export default mongoose.model("InternalInvoice", internalInvoiceSchema);
