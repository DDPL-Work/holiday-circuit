import mongoose from "mongoose";

const paymentReceiptSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const paymentSubmissionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    onBehalfOf: {
      type: String,
      default: "",
      trim: true,
    },
    utrNumber: {
      type: String,
      default: "",
      trim: true,
    },
    bankName: {
      type: String,
      default: "",
      trim: true,
    },
    paymentDate: {
      type: Date,
    },
    receipt: {
      type: paymentReceiptSchema,
      default: () => ({}),
    },
    submittedAt: {
      type: Date,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
  },
  { _id: false },
);

const paymentVerificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    assignedToName: {
      type: String,
      default: "",
      trim: true,
    },
    assignedToEmail: {
      type: String,
      default: "",
      trim: true,
    },
    assignedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    rejectionRemarks: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    reviewedByName: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    teamDecisionStatus: {
      type: String,
      enum: ["", "Verified", "Rejected"],
      default: "",
    },
    teamDecisionReason: {
      type: String,
      default: "",
      trim: true,
    },
    teamDecisionRemarks: {
      type: String,
      default: "",
      trim: true,
    },
    teamDecisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    teamDecisionByName: {
      type: String,
      default: "",
      trim: true,
    },
    teamDecisionAt: {
      type: Date,
    },
    sentToManagerAt: {
      type: Date,
    },
  },
  { _id: false },
);

const paymentAuditEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["Submitted", "Verified", "Rejected"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      required: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    performedByName: {
      type: String,
      default: "",
      trim: true,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const invoiceLineItemSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    serviceDate: {
      type: Date,
    },
    nights: {
      type: Number,
      default: 0,
    },
    days: {
      type: Number,
      default: 0,
    },
    pax: {
      type: Number,
      default: 0,
    },
    rooms: {
      type: Number,
      default: 0,
    },
    adults: {
      type: Number,
      default: 0,
    },
    children: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const invoicePricingSnapshotSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    baseAmount: {
      type: Number,
      default: 0,
    },
    servicesTotal: {
      type: Number,
      default: 0,
    },
    packageTemplateAmount: {
      type: Number,
      default: 0,
    },
    opsMarkupPercent: {
      type: Number,
      default: 0,
    },
    opsMarkupAmount: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    handlingFee: {
      type: Number,
      default: 0,
    },
    gstPercent: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    tcsPercent: {
      type: Number,
      default: 0,
    },
    tcsAmount: {
      type: Number,
      default: 0,
    },
    tourismAmount: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const invoiceTripSnapshotSchema = new mongoose.Schema(
  {
    queryId: {
      type: String,
      default: "",
      trim: true,
    },
    destination: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    numberOfAdults: {
      type: Number,
      default: 0,
    },
    numberOfChildren: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
{
  query: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TravelQuery",
    required: true
  },

  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },

  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth" // admin / operations
  },

  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },

  invoiceType: {
    type: String,
    enum: ["agent","admin","operations"], // 👈 very important
    required: true
  },

  totalAmount: {
    type: Number,
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Partially Paid", "Paid", "Unpaid"],
    default: "Pending"
  },

  paymentUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"Auth"
  },

  remarks: {
    type: String
  },

  quotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quotation",
  },

  currency: {
    type: String,
    default: "INR",
    trim: true,
  },

  lineItems: {
    type: [invoiceLineItemSchema],
    default: [],
  },

  pricingSnapshot: {
    type: invoicePricingSnapshotSchema,
    default: () => ({}),
  },

  tripSnapshot: {
    type: invoiceTripSnapshotSchema,
    default: () => ({}),
  },

  templateVariant: {
    type: String,
    default: "grand-ledger",
    trim: true,
  },

  paymentSubmission: {
    type: paymentSubmissionSchema,
    default: () => ({}),
  },

  paymentVerification: {
    type: paymentVerificationSchema,
    default: () => ({ status: "Pending" }),
  },

  paymentAuditTrail: {
    type: [paymentAuditEntrySchema],
    default: [],
  },

},
{ timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
