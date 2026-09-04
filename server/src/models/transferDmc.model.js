import mongoose from "mongoose";

const usageSeasonSchema = new mongoose.Schema(
  {
    seasonName: {
      type: String,
      default: "S1",
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validTo: {
      type: Date,
      default: null,
    },
    price: {
      type: Number,
      default: 0,
    },
    blackoutPrice: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

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
    // Structured Seasons Array (S1, S2, etc.)
    seasons: [usageSeasonSchema],
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

    // Links inventory to the exact bulk file that created it, enabling a
    // safe delete of that upload without touching other DMC inventory.
    sourceUpload: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UploadHistory",
      index: true,
      default: null,
    },

    status: {
      type: String,
      default: "active",
    },

    // Blackout Dates associated with this transport contract
    blackoutDates: {
      type: [
        {
          rowNumber: { type: Number, default: 0 },
          blackoutName: { type: String, default: "" },
          occasion: { type: String, default: "" },
          rawPeriod: { type: String, default: "" },
          startDate: { type: Date, default: null },
          endDate: { type: Date, default: null },
          startDateKey: { type: String, default: "" },
          endDateKey: { type: String, default: "" },
          season: { type: String, default: "" },
          category: { type: String, default: "" },
          applicableRegion: { type: String, default: "" },
          rateAction: { type: String, default: "" },
          sourceSheet: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // Hierarchical Nested Vehicles Array
    vehicles: [vehicleSubSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Dmc_Transfers", transferSchema);
