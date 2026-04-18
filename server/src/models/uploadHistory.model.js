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

  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success"
  }

},
{ timestamps: true }
);

export default mongoose.model("UploadHistory", uploadHistorySchema);