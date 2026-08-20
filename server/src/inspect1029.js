import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import TravelQuery from "./models/TravelQuery.model.js";

async function listAllConfirmedQueries() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const queries = await TravelQuery.find({
      $or: [{ agentStatus: "Confirmed" }, { opsStatus: "Confirmed" }]
    })
      .select("queryId agentStatus opsStatus voucherNumber destination createdAt agentId")
      .sort({ createdAt: -1 })
      .lean();

    console.log("Total Confirmed Queries count:", queries.length);
    console.log("List of all 24 Confirmed Queries in DB:");
    queries.forEach((q, idx) => {
      console.log(`${idx + 1}. ID: QRY-${q.queryId} | DB _id: ${q._id} | Dest: ${q.destination} | AgentStatus: ${q.agentStatus} | OpsStatus: ${q.opsStatus} | Voucher: ${q.voucherNumber || 'None'}`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listAllConfirmedQueries();
