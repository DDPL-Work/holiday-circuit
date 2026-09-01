import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  category: {
    type: String,
    default: "",
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  }
}, { _id: false });

const adminIncExcSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    inclusions: {
      type: [itemSchema],
      default: [],
    },
    exclusions: {
      type: [itemSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
  },
  {
    timestamps: true,
  }
);

const AdminIncExc = mongoose.model("AdminIncExc", adminIncExcSchema);

export default AdminIncExc;
