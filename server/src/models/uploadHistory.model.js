import mongoose from "mongoose";

const uploadHistorySchema = new mongoose.Schema(
{
  fileName: {
   type: String,
},

  filePath: {
    type: String,
    required: true
  },

category: {
 type: String,
 enum: ["hotel", "transport", "activity", "package", "sightseeing"]
},

 uploadedAuth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  },

  // ✅ YE ADD KARO
  uploadedBy: {
    type: String,
    required: true
  },

records: {
 type: Number
},

blackoutDates: {
  type: [
    {
      rowNumber: { type: Number, default: 0 },
      blackoutName: { type: String, default: "" },
      occasion: { type: String, default: "" },
      rawPeriod: { type: String, default: "" },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      startDateKey: { type: String, default: "" },
      endDateKey: { type: String, default: "" },
      season: { type: String, default: "" },
      category: { type: String, default: "" },
      applicableRegion: { type: String, default: "" },
      rateAction: { type: String, default: "" },
      sourceSheet: { type: String, default: "" },
    },
  ],
  default: [],
},

  status: {
    type: String,
    enum: ["processing", "success", "failed"],
    default: "success"
  },

  // True only for uploads whose inventory records contain this upload's ID.
  // Older rows remain false so they cannot accidentally delete unrelated data.
  inventoryTracked: {
    type: Boolean,
    default: false,
  },

  changeLog: {
    type: [
      {
        rowIndex: { type: Number, default: 0 },
        category: { type: String, default: "", trim: true },
        reasonType: { type: String, default: "", trim: true },
        reasonLabel: { type: String, default: "", trim: true },
        reasonNote: { type: String, default: "", trim: true },
        changedFields: { type: [String], default: [] },
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
          default: null,
        },
        editedByName: { type: String, default: "", trim: true },
        editedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  }

},
{ timestamps: true }
);

export default mongoose.model("UploadHistory", uploadHistorySchema);
