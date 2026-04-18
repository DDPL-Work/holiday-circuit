import mongoose from "mongoose";

const travelerDocumentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },
    fileName: {
      type: String,
      default: "",
      trim: true,
    },
    mimeType: {
      type: String,
      default: "",
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const travelerDocumentsSchema = new mongoose.Schema(
  {
    passport: {
      type: travelerDocumentSchema,
      default: () => ({}),
    },
    governmentId: {
      type: travelerDocumentSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const travelerDocumentVerificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Draft", "Pending", "Verified", "Rejected"],
      default: "Draft",
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
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
      default: "",
      trim: true,
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
    issues: {
      type: [
        new mongoose.Schema(
          {
            travelerId: {
              type: String,
              default: "",
              trim: true,
            },
            travelerName: {
              type: String,
              default: "",
              trim: true,
            },
            documentKey: {
              type: String,
              default: "",
              trim: true,
            },
            documentLabel: {
              type: String,
              default: "",
              trim: true,
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { _id: false },
);

const travelerDocumentAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Verified", "Rejected"],
      default: "Draft",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    performedByName: {
      type: String,
      default: "",
      trim: true,
    },
    remarks: {
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

const reassignmentHistorySchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    fromName: {
      type: String,
      default: "",
      trim: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    toName: {
      type: String,
      default: "",
      trim: true,
    },
    performedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    performedByName: {
      type: String,
      default: "",
      trim: true,
    },
    movedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const adminCoordinationMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["operations", "admin"],
      default: "operations",
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    senderName: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const adminCoordinationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["idle", "pending_admin_reply", "replied"],
      default: "idle",
    },
    lastOpsMessage: {
      type: String,
      default: "",
      trim: true,
    },
    lastOpsMessageAt: {
      type: Date,
      default: null,
    },
    lastOpsMessageBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    lastOpsMessageByName: {
      type: String,
      default: "",
      trim: true,
    },
    lastAdminReply: {
      type: String,
      default: "",
      trim: true,
    },
    lastAdminReplyAt: {
      type: Date,
      default: null,
    },
    lastAdminReplyBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    lastAdminReplyByName: {
      type: String,
      default: "",
      trim: true,
    },
    thread: {
      type: [adminCoordinationMessageSchema],
      default: [],
    },
  },
  { _id: false },
);

const travelerDetailSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    travelerType: {
      type: String,
      enum: ["Adult", "Child"],
      required: true,
    },
    childAge: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },
    documentType: {
      type: String,
      default: "Passport",
      trim: true,
    },
    document: {
      type: travelerDocumentSchema,
      default: () => ({}),
    },
    documents: {
      type: travelerDocumentsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

const travelQuerySchema = new mongoose.Schema(
{
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth" // operations user
    },

   queryId: {
    type: String,
    unique: true
  },

  destination: {
    type: String,
    required: true
  },

  clientEmail: {
    type: String,
    default: "",
    trim: true,
    lowercase: true,
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  numberOfAdults: {
    type: Number,
    required: true
  },

  numberOfChildren: {
    type: Number,
    default: 0
  },

 customerBudget: {
  type: Number,
  min: 0,
  default: 0
},

  hotelCategory: {
    type: String,
    enum: ["3 Star", "4 Star", "5 Star"]
  },

  transportRequired: {
    type: Boolean,
    default: false
  },

  sightseeingRequired: {
    type: Boolean,
    default: false
  },

  specialRequirements: {
    type: String
  },

  travelerDetails: {
    type: [travelerDetailSchema],
    default: [],
  },

  agentStatus: {
    type: String,
    enum: ["Pending", "In Progress", "Quote Sent", "Client Approved", "Confirmed", "Rejected", "Revision Requested"],
    default: "Pending"
  },

  opsStatus: {
  type: String,
  enum: ["New_Query", "Pending_Accept", "Revision_Query", "Rejected", "Booking_Accepted", "Invoice_Requested", "Confirmed", "Vouchered"],
  default: "New_Query"
},

quotationStatus: {
  type: String,
  enum: ["Awaiting_Decision", "Quotation_Created", "Sent_To_Agent"],
  default: "Awaiting_Decision"
},

rejectionNote: {
  type: String
},

activityLog: [
  {
    action: String,
    performedBy: String,      // "Query Created", "Quote Sent", etc.
    timestamp: {                   // "Agent", "Ops Team"
      type: Date,
      default: Date.now
    }
  }
],

voucherStatus: {
  type: String,
  enum: ["ready", "generated", "sent"],
  default: "ready"
},
voucherNumber: {
  type: String,
  default: ""
},
voucherGeneratedAt: {
  type: Date
},
voucherSentAt: {
  type: Date
},
voucherPdfUrl: {
  type: String,
  default: ""
},

travelerDocumentVerification: {
  type: travelerDocumentVerificationSchema,
  default: () => ({}),
},

travelerDocumentAuditTrail: {
  type: [travelerDocumentAuditSchema],
  default: [],
},

reassignmentHistory: {
  type: [reassignmentHistorySchema],
  default: [],
},

adminCoordination: {
  type: adminCoordinationSchema,
  default: () => ({}),
},

},

{ timestamps: true }

);

export default mongoose.model("TravelQuery", travelQuerySchema);
