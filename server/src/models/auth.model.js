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
      unique: true,
      sparse: true,
      required: function () {
      return this.role === "agent";
      }
    },

  documents: {
      type: [String],
      required: function () {
      return this.role === "agent";
      }
    },

  role: {
    type: String,
    enum: ["admin","agent","operations","dmc_partner"],
    required: true
  },

    status: {
      type: String,
      enum: ["pending", "approve", "rejected"],
      default: function () {
      return this.role === "agent" ? "pending" : undefined;
      }
    },

  isApproved: {
    type: Boolean,
    default: false
  }

},
{ timestamps: true }
);


//======= THIS IS THE KEY PART =============

agentSchema.pre("save", function (next) {
  if (this.role !== "agent") {
    this.companyName = undefined;
    this.gstNumber = undefined;
    this.phone = undefined;
    this.documents = undefined;
    this.status = undefined;
  }
 next();
});


export default mongoose.model("Auth", agentSchema);


