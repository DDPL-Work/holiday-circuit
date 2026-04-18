// models/Confirmation.js
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  supplierConfirmation: { 
        type: String,
    },
  voucherReference: { 
        type: String,
    },
  termsConditions: { 
        type: String,
    },
});

const confirmationSchema = new mongoose.Schema({
  dmcId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
    index: true,
  },
  queryId: {
    type: String,
    required: true,
  },
  services: [
    {
      type: { 
        type: String,
    },
      serviceName: { 
        type: String,
    },
      serviceDate:{ 
        type: String,
    },
      status: { 
        type: String,
    },
      confirmationNumber: { 
        type: String,
    },
      voucherNumber: { 
        type: String,
    },

    },
  ],
  emergencyContact:  { 
        type: String,
    },

  documents: documentSchema,

  status: {
    type: String,
    enum: ["draft", "submitted"],
    default: "draft",
  },
  
}, 

{ timestamps: true }

);

confirmationSchema.index({ dmcId: 1, queryId: 1 }, { unique: true });

export default mongoose.model("Confirmation", confirmationSchema);
