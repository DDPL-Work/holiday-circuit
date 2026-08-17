import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import TravelQuery from "./models/TravelQuery.model.js";
import Quotation from "./models/Quotation.model.js";
import Voucher from "./models/voucher.model.js";

async function inspectQuotesAndVouchersForConfirmed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const queries = await TravelQuery.find({
      $or: [{ agentStatus: "Confirmed" }, { opsStatus: "Confirmed" }]
    }).lean();

    console.log(`Checking ${queries.length} confirmed queries...`);

    for (const q of queries) {
      const quotes = await Quotation.find({ queryId: q._id }).lean();
      const vouchers = await Voucher.find({ query: q._id }).lean();

      console.log(`Query QRY-${q.queryId} (_id: ${q._id}): Quotes Count = ${quotes.length}, Vouchers Count = ${vouchers.length}, Query voucherNumber = ${q.voucherNumber || 'None'}, opsStatus = ${q.opsStatus}, agentStatus = ${q.agentStatus}`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

inspectQuotesAndVouchersForConfirmed();
