import mongoose from "mongoose";

const adminTermRevisionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  action: {
    type: String, // e.g., "Created", "Updated"
    default: "Updated",
  }
});

const adminTermSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    revisions: [adminTermRevisionSchema],
  },
  { timestamps: true }
);

const AdminTerm = mongoose.model("AdminTerm", adminTermSchema);
export default AdminTerm;
