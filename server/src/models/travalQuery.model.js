const travelQuerySchema = new mongoose.Schema(
{
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },

  destination: {
    type: String,
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  numberOfAdults: {
    type: Number,
    required: true
  },

  numberOfChildren: {
    type: Number,
    default: 0
  },

  hotelCategory: {
    type: String,
    enum: ["3 Star", "4 Star", "5 Star"]
  },

  transportRequired: {
    type: Boolean,
    default: false
  },

  sightseeingRequired: {
    type: Boolean,
    default: false
  },

  specialRequirements: {
    type: String
  },

  status: {
    type: String,
    enum: ["submitted", "in_progress", "quoted", "confirmed", "rejected"],
    default: "submitted"
  },

},
{ timestamps: true }
);

export default mongoose.model("TravelQuery", travelQuerySchema);
