import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  companyName: {
    type: String,
    required: function () {
    return this.role === "agent";
  }
  },


gstNumber: {
  type: String,
  unique: true,
  sparse: true,
  required: function () {
    return this.role === "agent";
  }
},

  phone: {
    type: Number,
    unique: true

  },

  documents: [
    {
      type: String ,
    }
  ],

  role: {
    type: String,
    enum: ["admin", "agent"],
    required: true
  },

  isApproved: {
    type: Boolean,
    default: false
  }
},
{ timestamps: true }
);

export default mongoose.model("Auth", agentSchema);
