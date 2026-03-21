import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
{
queryId: {
type: mongoose.Schema.Types.ObjectId,
ref: "TravelQuery",
required: true
},

quotationNumber: {
type: String,
unique: true,
sparse: true
},

agent: {
type: mongoose.Schema.Types.ObjectId,
ref: "Auth",
required: true
},

createdBy: {
type: mongoose.Schema.Types.ObjectId,
ref: "Auth",
required: true
},

inclusions: [{ type: String }],


pricing: {

baseAmount: { type: Number, required: true },

opsMarkup: {
    percent: { type: Number, default: 0},
    amount: { type: Number, default: 0}
},

opsCharges: {
    serviceCharge: { type: Number, default: 0 },
    handlingFee: { type: Number, default: 0 },
  },

tax: {
  gst: {
    percent: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },

  tcs: {
    percent: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },

  tourismFee: {
    amount : {type: Number, default: 0}
},

  totalTax: { type: Number, default: 0
  }
},

  totalAmount: { type: Number }
},


//===================== Agent Markup quotationSchema.js ==========================

agentMarkup: {
type: {
type: String,
enum: ["PERCENT", "AMOUNT"],
},
value: {
type: Number,
default: 0,
},
markupAmount: {
type: Number,
default: 0,
}
},

clientTotalAmount: {
type: Number
},

validTill: {
type: Date,
required: true
},

status: {
type: String,
enum: ["Quote Sent", "Revision Requested", "Pending", "Quote Accepted", "Quote Finalized","Markup Applied", "Sent to Client" ],
default: "Pending"
}
},
{ timestamps: true }
);

export default mongoose.model("Quotation", quotationSchema);