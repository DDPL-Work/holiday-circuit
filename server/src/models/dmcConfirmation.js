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

export default mongoose.model("Confirmation", confirmationSchema);