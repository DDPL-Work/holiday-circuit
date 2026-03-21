import mongoose from "mongoose";

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
  }

},
{ timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
