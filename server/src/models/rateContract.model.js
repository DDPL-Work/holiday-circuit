import mongoose from "mongoose";

const rateContractSchema = new mongoose.Schema(
{
  country: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  serviceCategory: {
    type: String,
    enum: ["sightseeing", "transport"],
    required: true
  },

  serviceName: {
    type: String,
    required: true
  },

  vehicleType: {
    type: String // only for transport
  },

  adultRate: {
    type: Number,
    required: true
  },

  childRate: {
    type: Number,
    default: 0
  },

  infantRate: {
    type: Number,
    default: 0
  },

  validFrom: {
    type: Date,
    required: true
  },

  validTo: {
    type: Date,
    required: true
  },

  supplierName: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth"
  }

},
{ timestamps: true }
);

export default mongoose.model("RateContract", rateContractSchema);
