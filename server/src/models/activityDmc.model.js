import mongoose from "mongoose";

const tourTypeSchema = new mongoose.Schema(
  {
    tourType: {
      type: String,
      required: true,
      default: "Group Tour", // e.g. "Group Tour", "Private Tour", "Premium/VIP Tour"
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    pricingBasis: {
      type: String,
      default: "Per Pax", // "Per Pax", "Per Group"
    },
    maxPax: {
      type: String,
      default: "N/A (Shared Group)", // e.g. "N/A (Shared Group)", "Up to 4 Pax", "Up to 6 Pax"
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const activitySchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
    },

    serviceCategory: {
      type: String,
      default: "activity",
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
      enum: ["USD", "INR", "AED", "EUR", "IDR", "THB", "SGD", "GBP", "MYR", "EGP"],
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

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },

    status: {
      type: String,
      default: "active",
    },

    // Hierarchical Nested Tour Types Array
    tourTypes: [tourTypeSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Dmc_Activity", activitySchema);

