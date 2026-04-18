import mongoose from "mongoose";

const sightseeingSchema = new mongoose.Schema({

  serviceName: {
    type: String
  },

  serviceCategory: {
    type: String,
    default: "sightseeing"
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

  price: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    enum: ["USD","INR","AED","EUR"],
    default: "USD"
  },

  description: {
  type: String
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

export default mongoose.model("Dmc_Sightseeing", sightseeingSchema);