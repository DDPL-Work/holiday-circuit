import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Auth from './src/models/auth.model.js';
import TravelQuery from './src/models/TravelQuery.model.js';
import InternalInvoice from './src/models/internalInvoice.model.js';
import DmcSettlementBatch from './src/models/dmcSettlementBatch.model.js';
import Invoice from './src/models/invoice.model.js';
import { getAdvancedAnalytics } from './src/controllers/adminController.js';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    const user = await Auth.findOne({ email: 'finance4@gmail.com' }).lean();

    const req = {
      user: {
        id: user._id.toString(),
        role: user.role
      },
      query: {
        startDate: '2026-07-01',
        endDate: '2026-07-31'
      }
    };

    let responseData = null;
    const res = {
      status(code) {
        return {
          json(data) {
            responseData = data;
          }
        };
      }
    };

    const next = (err) => {
      if (err) console.error('Next Error:', err);
    };

    await getAdvancedAnalytics(req, res, next);

    if (responseData) {
      fs.writeFileSync('analytics_response.json', JSON.stringify(responseData, null, 2));
      console.log('Successfully wrote analytics_response.json');
      
      // Let's print out the monthly reports for July 2026
      const monthly = responseData.data.monthly;
      const julyPeriod = monthly.taxPeriods?.find(p => p.value === '2026-07');
      if (julyPeriod) {
        console.log('=== July 2026 Tax Period Metrics ===');
        console.log(JSON.stringify(julyPeriod.metrics, null, 2));
      } else {
        console.log('July 2026 period not found in taxPeriods');
      }

      console.log('=== Reports monthly for July 2026 ===');
      console.log(JSON.stringify(responseData.data.reports.monthly.summaryCards, null, 2));
    } else {
      console.log('No response received');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
