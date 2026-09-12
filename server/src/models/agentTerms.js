import mongoose from "mongoose";

const termRevisionSchema = new mongoose.Schema({
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

const agentTermSchema = new mongoose.Schema(
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
    // The revisions array will store all historical states of the terms
    // The very first revision (on creation) should be pushed here as well
    revisions: [termRevisionSchema],
  },
  { timestamps: true }
);

const AgentTerm = mongoose.model("AgentTerm", agentTermSchema);
export default AgentTerm;
