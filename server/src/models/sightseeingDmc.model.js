import mongoose from "mongoose";

const seasonSchema = new mongoose.Schema(
  {
    seasonName: { type: String, default: "S1" },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    price: { type: Number, default: 0 },
    adultPrice: { type: Number, default: 0 },
    adultBlackoutPrice: { type: Number, default: 0 },
    childPrice: { type: Number, default: 0 },
    childBlackoutPrice: { type: Number, default: 0 },
    blackoutPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const tourTypeSchema = new mongoose.Schema(
  {
    tourType: {
      type: String,
      required: true,
      default: "Group Tour", // e.g. "Group Tour", "Private Tour", "Ticket Only"
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    adultPrice: {
      type: Number,
      default: 0,
    },
    childPrice: {
      type: Number,
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
    seasons: [seasonSchema],
  },
  { _id: true }
);

const sightseeingSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
    },

    serviceCategory: {
      type: String,
      default: "sightseeing",
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

    operatingDays: {
      type: String,
      default: "Mon-Sun",
    },

    openingTime: {
      type: String,
      default: "08:00",
    },

    closingTime: {
      type: String,
      default: "18:00",
    },

    duration: {
      type: String,
      default: "",
    },

    slots: {
      type: String,
      default: "",
    },

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

    // Hierarchical Nested Tour Types Array
    tourTypes: [tourTypeSchema],
  },
  { timestamps: true }
);

// Matches the bulk-upload upsert filter. This is intentionally non-unique so
// existing DMC inventory data remains unchanged while lookups become faster.
sightseeingSchema.index({ supplier: 1, serviceName: 1, city: 1, country: 1 });

export default mongoose.model("Dmc_Sightseeing", sightseeingSchema);
