import mongoose from "mongoose";

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

  agentStatus: {
    type: String,
    enum: ["Pending", "In Progress", "Quote Sent", "Confirmed", "Rejected", "Revision Requested"],
    default: "Pending"
  },

  opsStatus: {
  type: String,
  enum: ["New_Query", "Pending_Accept", "Revision_Query", "Rejected", "Booking_Accepted","Confirmed", "Vouchered"],
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
]

},

{ timestamps: true }

);

export default mongoose.model("TravelQuery", travelQuerySchema);
