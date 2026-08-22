import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: String,
  serviceName: String,
  day: String,
  nights: Number,
  rooms: Number,
  price: Number,
  basePrice: Number,
  unit: String,
  quantity: Number,
  pax: Number,
  tourType: String,
  tourTypes: [mongoose.Schema.Types.Mixed],
  pricingBasis: String,
  maxPax: String,
  hotel_name: String,
  hotelName: String,
  room_type: String,
  roomType: String,
  roomCategory: String,
  bedType: String,
  extraBedType: String,
  mealPlan: String,
  maxAdults: Number,
  maxChildren: Number,
  extraAdult: Boolean,
  childWithBed: Boolean,
  childWithoutBed: Boolean,
  extraChildBed: Boolean,
  extraChildNoBed: Boolean,
  awebRate: Number,
  cwebRate: Number,
  cwoebRate: Number,
  vehicle_type: String,
  vehicleType: String,
  passenger_capacity: Number,
  passengerCapacity: Number,
  luggage_capacity: Number,
  luggageCapacity: Number,
  duration: String,
  operatingDays: String,
  openingTime: String,
  closingTime: String,
  selectedSlot: String,
  time: String,
  adultPrice: Number,
  childPrice: Number,
  adults: Number,
  children: Number,
  supplierName: String,
  dayLabel: String,
  dayHours: String,
  description: String,
}, { strict: false });

const packageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  destination: {
    type: String,
    required: true
  },

  country: String,    
  duration: String,

  days: Number,

  description: String,
  inclusions: String,
  exclusions: String,
  dayWiseItinerary: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  termsAndConditions: String,

  hotels: [serviceSchema],
  activities: [serviceSchema],
  transfers: [serviceSchema],
  sightseeing: [serviceSchema],

  basePrice: {
    type: Number,
    default: 0
  },

  tax: {
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    tcsPercent: { type: Number, default: 0 },
    tcsAmount: { type: Number, default: 0 },
    tourismAmount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 }
  },

  price: {
    type: Number,
    required: true
  },

  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth"
  }

}, { timestamps: true });

export default mongoose.model("Dmc_Package", packageSchema);
