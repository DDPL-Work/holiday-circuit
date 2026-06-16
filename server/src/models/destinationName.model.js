import mongoose from "mongoose";

const destinationNameSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    country: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["hotel", "query", "manual"],
      default: "manual",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, collection: "destination_names" },
);

destinationNameSchema.index({ normalizedKey: 1 }, { unique: true });
destinationNameSchema.index({ label: 1 });

export default mongoose.model("DestinationName", destinationNameSchema);
