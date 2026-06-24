import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
{
  queryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TravelQuery",
    required: true
  },

  sourceQuotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quotation"
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
  exclusions: [{ type: String }],
  additionalNotes: [{ type: String }],
  dayWiseItinerary: [
    {
      dayNumber: { type: Number, default: 1 },
      dayLabel: { type: String, default: "" },
      date: { type: Date, default: null },
      title: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  ],

  // ================= 🔥 SERVICES =================
  services: [
    {
      serviceId: {
        type: mongoose.Schema.Types.ObjectId
      },

      supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth"
      },

      supplierName: {
        type: String
      },

      dmcId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth"
      },

      dmcName: {
        type: String
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
      serviceDate: Date,
      roomCategory: String,
      roomType: String,
      hotelCategory: String,

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

      transportUsageOptionKey: {
        type: String,
        default: ""
      },

      transportUsageLabel: {
        type: String,
        default: ""
      },

      transportUsageLimitOptionKey: {
        type: String,
        default: ""
      },

      extraPerKmRate: {
        type: Number,
        default: 0
      },

      fullDayExtraPerKmRate: {
        type: Number,
        default: 0
      },

      halfDayExtraPerKmRate: {
        type: Number,
        default: 0
      },

      days: { type: Number, default: 1 },

      // ================= ACTIVITY / SIGHTSEEING =================
      pax: { type: Number, default: 1 },

      // ================= 🔥 PRICING =================
      currency: {
        type: String,
        enum: ["INR", "USD", "AED", "EUR", "THB", "GBP", "IDR", "SGD", "MYR", "EGP", "AUD"],
        default: "INR"
      },

      price: {
        type: Number,
        required: true   // 🔥 IMPORTANT
      },

      hotelRateMode: {
        type: String,
        enum: ["unit-rate", "service-total"],
        default: "unit-rate"
      },

      manualRateOverride: {
        type: Boolean,
        default: false
      },

      quoteBaseRate: {
        type: Number,
        default: 0
      },

      roomTypeOptionRate: {
        type: Number,
        default: 0
      },

      roomTypeOptionCurrency: {
        type: String,
        default: "INR"
      },

      exchangeRate: {
        type: Number,
        default: 1
      },

      priceInInr: {
        type: Number,
        default: 0
      },

      extraAdult: {
        type: Boolean,
        default: false
      },

      childWithBed: {
        type: Boolean,
        default: false
      },

      childWithoutBed: {
        type: Boolean,
        default: false
      },

      awebRate: {
        type: Number,
        default: 0
      },

      cwebRate: {
        type: Number,
        default: 0
      },

      cwoebRate: {
        type: Number,
        default: 0
      },

      total: {
        type: Number,
        required: true   // 🔥 IMPORTANT
      },

      totalInInr: {
        type: Number,
        default: 0
      }
    }
  ],

  // ================= PRICING =================
  pricing: {

    currency: {
      type: String,
      default: "INR"
    },

    quoteCategory: {
      type: String,
      enum: ["domestic", "international"],
      default: "domestic"
    },

    baseAmount: { type: Number, required: true },

    subTotal: { type: Number, default: 0 }, // 🔥 services total

    packageTemplateAmount: { type: Number, default: 0 },

    serviceCurrencyBreakdown: {
      type: [
        new mongoose.Schema(
          {
            currency: {
              type: String,
              default: "INR"
            },
            amount: {
              type: Number,
              default: 0
            },
            amountInInr: {
              type: Number,
              default: 0
            },
            exchangeRate: {
              type: Number,
              default: 1
            }
          },
          { _id: false }
        )
      ],
      default: []
    },

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

  agentLogo: {
    type: String,
    default: ""
  },

  agentBrandingName: {
    type: String,
    default: ""
  },

  agentRevisionRemark: {
    type: String,
    default: ""
  },

  validTill: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ["Quote Sent","Revision Requested","Revised","Pending","Quote Accepted","Quote Finalized",
      "Markup Applied",
      "Sent to Client",
      "Confirmed"
    ],
    default: "Pending"
  }

},
{ timestamps: true }
);

quotationSchema.index({ queryId: 1, createdAt: -1 });
quotationSchema.index({ queryId: 1, status: 1, createdAt: -1 });
quotationSchema.index({ agent: 1, createdAt: -1 });

export default mongoose.model("Quotation", quotationSchema);
