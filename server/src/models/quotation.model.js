import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
{
  queryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TravelQuery",
    required: true
  },

  quotationNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },

  inclusions: [{ type: String }],

  // ================= 🔥 SERVICES =================
  services: [
    {
      serviceId: {
        type: mongoose.Schema.Types.ObjectId
      },

      type: {
        type: String,
        enum: ["hotel", "transfer", "activity", "sightseeing"],
        required: true
      },

      title: { type: String, required: true },

      // 🔹 LOCATION
      city: String,
      country: String,

      // 🔹 DESCRIPTION
      description: String,

      // ================= HOTEL =================
      adults: { type: Number, default: 0 },
      children: { type: Number, default: 0 },
      infants: { type: Number, default: 0 },

      rooms: { type: Number, default: 1 },

      bedType: {
        type: String,
        enum: ["single", "double", "twin", "triple"]
      },

      nights: { type: Number, default: 1 },

      // ================= TRANSFER =================
      vehicleType: String,

      passengerCapacity: { type: Number, default: 0 },
      luggageCapacity: { type: Number, default: 0 },

      usageType: {
        type: String,
        enum: ["point-to-point", "half-day", "full-day", "round-trip"],
        default: "point-to-point"
      },

      days: { type: Number, default: 1 },

      // ================= ACTIVITY / SIGHTSEEING =================
      pax: { type: Number, default: 1 },

      // ================= 🔥 PRICING =================
      currency: {
        type: String,
        enum: ["INR", "USD", "AED", "EUR", "THB"],
        default: "INR"
      },

      price: {
        type: Number,
        required: true   // 🔥 IMPORTANT
      },

      total: {
        type: Number,
        required: true   // 🔥 IMPORTANT
      }
    }
  ],

  // ================= PRICING =================
  pricing: {

    baseAmount: { type: Number, required: true },

    subTotal: { type: Number, default: 0 }, // 🔥 services total

    opsMarkup: {
      percent: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },

    opsCharges: {
      serviceCharge: { type: Number, default: 0 },
      handlingFee: { type: Number, default: 0 }
    },

    tax: {
      gst: {
        percent: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      },

      tcs: {
        percent: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      },

      tourismFee: {
        amount: { type: Number, default: 0 }
      },

      totalTax: { type: Number, default: 0 }
    },

    totalAmount: { type: Number, required: true }
  },

  // ================= AGENT MARKUP =================
  agentMarkup: {
    type: {
      type: String,
      enum: ["PERCENT", "AMOUNT"]
    },

    value: {
      type: Number,
      default: 0
    },

    markupAmount: {
      type: Number,
      default: 0
    }
  },

  clientTotalAmount: {
    type: Number
  },

  validTill: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: [
      "Quote Sent",
      "Revision Requested",
      "Pending",
      "Quote Accepted",
      "Quote Finalized",
      "Markup Applied",
      "Sent to Client"
    ],
    default: "Pending"
  }

},
{ timestamps: true }
);

export default mongoose.model("Quotation", quotationSchema);