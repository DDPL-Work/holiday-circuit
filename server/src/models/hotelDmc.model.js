import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomType: { type: String, required: true },
    roomCategory: { type: String, default: "Double" },
    bedType: { type: String, default: "Queen" },
    extraBedType: { type: String, default: "None" },
    maxAdults: { type: Number, default: 2 },
    maxChildren: { type: Number, default: 1 },
    childAgeLimit: { type: String, default: "As per hotel policy" },
    mealPlan: {
      type: String,
      enum: ["EP", "CP", "MAP", "AP", "AI"],
      default: "EP",
    },
    price: { type: Number, required: true },
    awebRate: { type: Number, default: 0 },
    cwebRate: { type: Number, default: 0 },
    cwoebRate: { type: Number, default: 0 },
    description: { type: String, default: "" },
  },
  { _id: true }
);

const hotelSubSchema = new mongoose.Schema(
  {
    hotelName: { type: String, required: true },
    hotelCategory: {
      type: String,
      enum: ["3 Star", "4 Star", "5 Star", "Luxury"],
      default: "5 Star",
    },
    supplierName: { type: String, default: "" },
    rooms: [roomSchema],
  },
  { _id: true }
);

const hotelSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
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

    serviceCategory: {
      type: String,
      default: "hotel",
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

    blackoutDates: {
      type: [
        {
          rowNumber: { type: Number, default: 0 },
          rawPeriod: { type: String, default: "" },
          startDate: { type: Date, default: null },
          endDate: { type: Date, default: null },
          startDateKey: { type: String, default: "" },
          endDateKey: { type: String, default: "" },
          occasion: { type: String, default: "" },
          category: { type: String, default: "" },
          applicableRegion: { type: String, default: "" },
          sourceSheet: { type: String, default: "" },
        },
      ],
      default: [],
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },

    status: {
      type: String,
      default: "active",
    },

    // Hierarchical Nested Hotels & Rooms Array
    hotels: [hotelSubSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Dmc_Hotel", hotelSchema);
