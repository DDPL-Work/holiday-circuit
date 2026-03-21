import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({

  serviceName: {
    type: String
  },

  serviceCategory: {
    type: String,
    default: "activity"
  },

  supplierName: {
    type: String
  },

  name: {
    type: String,
    required: true
  },

  country: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  adultPrice:{
    type: Number
  },

  childPrice:{
    type: Number
  },

  infantPrice:{
    type: Number
  },

  currency: {
    type: String,
    enum: ["USD","INR","AED","EUR"],
    default: "USD"
  },

  validFrom: {
    type: Date,
    required: true
  },

  validTo: {
    type: Date,
    required: true
  },

  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth"
  }

},{ timestamps:true });

export default mongoose.model("Dmc_Activity", activitySchema);