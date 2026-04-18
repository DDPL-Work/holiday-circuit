import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
{

   serviceName: {
    type: String
  },

   supplierName: {
    type: String
  },


  hotelName: {
    type: String,
    required: true
  },

  country: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  serviceCategory: {
  type: String,
  default: "hotel"
},

  hotelCategory: {
    type: String,
    enum: ["3 Star", "4 Star", "5 Star", "Luxury"]
  },

  bedType: {
    type: String,
    enum: ["King", "Queen", "Twin"]
  },

  roomType: {
    type: String
  },

  mealPlan: {
    type: String,
    enum: ["EP", "CP", "MAP", "AP", "AI"]
  },

  price: {
    type: Number,
    required: true
  },

  awebRate: {
  type: Number,
  required: true
},
cwebRate: {
  type: Number,
  required: true
},
cwoebRate: {
  type: Number,
  required: true
},

   currency: {
    type: String,
    enum: ["USD", "INR", "AED", "EUR", "IDR", "THB", "SGD", "GBP", "MYR", "EGP"],
    default: "INR"
  },

  description: {
  type: String
},

    validFrom: {
    type: Date,
    required: true
  },

  validTo: {
    type: Date,
    required: true
  },

  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth"
  },

  status: {
    type: String,
    default: "active"
  }

},
{ timestamps: true }
);

export default mongoose.model("Dmc_Hotel", hotelSchema);
