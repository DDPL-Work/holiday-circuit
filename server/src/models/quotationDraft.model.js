import mongoose from "mongoose";
import { quotationSchema } from "./quotation.model.js";

const quotationDraftSchema = quotationSchema.clone();

quotationDraftSchema.add({
  draftStatus: {
    type: String,
    enum: ["active", "converted", "discarded"],
    default: "active",
  },
  convertedQuotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quotation",
  },
  convertedAt: {
    type: Date,
    default: null,
  },
});

quotationDraftSchema.index({ queryId: 1, draftStatus: 1, updatedAt: -1 });
quotationDraftSchema.index({ queryId: 1, sourceQuotationId: 1, draftStatus: 1, updatedAt: -1 });

export default mongoose.model("QuotationDraft", quotationDraftSchema);
