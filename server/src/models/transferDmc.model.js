import mongoose from "mongoose";

const transferSchema = new mongoose.Schema(
{
  serviceName: {
    type: String,
    required: true
  },

  serviceCategory: {
    type: String,
    default: "transport"
  },

  supplierName: {
    type: String
  },

  country: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  vehicleType: {
    type: String
  },

  passengerCapacity:{
    type: Number,
    default: 0
  },

  luggageCapacity:{
    type: Number,
    default: 0
  },

  price: {
    type: Number,
    default: 0
  },

  currency: {
    type: String,
    enum: ["USD","INR","AED","EUR"],
    default: "USD"
  },

  usageType: {
    type: String,
    enum: ["point-to-point","half-day","full-day"]
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

},
{ timestamps: true }
);

export default mongoose.model("Dmc_Transfers", transferSchema);