import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: String,
  day: String,
  price: Number,
  unit: String,
  quantity: Number
})

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

  hotels: [serviceSchema],
  activities: [serviceSchema],
  transfers: [serviceSchema],
  sightseeing: [serviceSchema],

  price: {
    type: Number,
    required: true
  },

  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth"
  }

}, { timestamps: true })

export default mongoose.model("Dmc_Package", packageSchema);