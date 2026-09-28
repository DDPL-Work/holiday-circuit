import mongoose from "mongoose";

const phoneSchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      default: "91-IN",
      trim: true,
    },
    number: {
      type: String,
      default: "",
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const tripSourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    shortName: {
      type: String,
      default: "",
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ["b2b", "direct"],
      default: "b2b",
    },
    contactPerson: {
      name: {
        type: String,
        default: "",
        trim: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
      phones: {
        type: [phoneSchema],
        default: [],
      },
      phone: {
        type: String,
        default: "",
        trim: true,
      },
      countryCode: {
        type: String,
        default: "91-IN",
        trim: true,
      },
    },
    location: {
      type: String,
      default: "India",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

tripSourceSchema.index({ name: 1, sourceType: 1 });
tripSourceSchema.index({ createdAt: -1 });

export default mongoose.model("TripSource", tripSourceSchema);
