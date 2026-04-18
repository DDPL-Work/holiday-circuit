import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    query: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TravelQuery",
      required: true,
    },
    quotation: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Quotation",
  default: null,
},

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
    },
    guestName: {
      type: String,
      default: "",
    },
    destination: {
      type: String,
      default: "",
    },
    travelDate: Date,
    duration: {
      type: String,
      default: "",
    },
    passengers: {
  type: String,
  default: "",
},

    services: [
      {
        type: {
          type: String,
          default: "service",
        },
        name: {
          type: String,
          default: "",
        },
        confirmation: {
          type: String,
          default: "",
        },
      },
    ],
    status: {
      type: String,
      enum: ["ready", "generated", "sent"],
      default: "ready",
    },
    branding: {
      type: String,
      enum: ["with", "without"],
      default: "with",
    },
    pdfUrl: {
      type: String,
      default: "",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    generatedAt: Date,
    sentAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Voucher", voucherSchema);
