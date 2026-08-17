import mongoose from "mongoose";

const usageOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    usageType: {
      type: String,
      enum: ["point-to-point", "half-day", "full-day", "round-trip"],
      default: "point-to-point",
    },
    price: {
      type: Number,
      default: 0,
    },
    extraPerKmRate: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const usageTypesGroupSchema = new mongoose.Schema(
  {
    pointToPoint: [usageOptionSchema],
    hourly: [usageOptionSchema],
  },
  { _id: false }
);

const vehicleSubSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      required: true,
    },
    passengerCapacity: {
      type: Number,
      default: 4,
    },
    luggageCapacity: {
      type: Number,
      default: 2,
    },
    description: {
      type: String,
      default: "",
    },
    usageTypes: usageTypesGroupSchema,
  },
  { _id: true }
);

const transferSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
    },

    serviceCategory: {
      type: String,
      default: "transport",
    },

    supplierName: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    currency: {
      type: String,
      enum: ["USD", "INR", "AED", "EUR", "THB", "GBP", "IDR", "SGD", "MYR", "EGP"],
      default: "INR",
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validTo: {
      type: Date,
      required: true,
    },

    fullDayNote: {
      type: String,
      default: "",
    },

    halfDayNote: {
      type: String,
      default: "",
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },

    status: {
      type: String,
      default: "active",
    },

    // Hierarchical Nested Vehicles Array
    vehicles: [vehicleSubSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Dmc_Transfers", transferSchema);
