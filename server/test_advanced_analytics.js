import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getAdvancedAnalytics } from './src/controllers/adminController.js';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    const user = await mongoose.connection.db.collection('auths').findOne({
      email: 'finance4@gmail.com'
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    const req = {
      user: {
        id: user._id.toString(),
        _id: user._id,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
        email: user.email
      },
      query: {
        startDate: '2026-07-01',
        endDate: '2026-07-31'
      }
    };

    let responseData = null;
    const res = {
      status: function(code) { return this; },
      json: function(payload) { responseData = payload; return this; }
    };

    await getAdvancedAnalytics(req, res, () => {});

    if (responseData) {
      console.log('API RESPONSE RECEIVED successfully');
      console.log('Custom metrics:', JSON.stringify(responseData.data.custom.metrics, null, 2));
      console.log('Monthly metrics:', JSON.stringify(responseData.data.monthly.metrics, null, 2));
      console.log('Internal invoices returned:', responseData.data.internalInvoices.length);
      responseData.data.internalInvoices.forEach(inv => {
        console.log(`  - Number: ${inv.invoiceNumber || inv.batchNumber} | PayoutAmount: ${inv.payoutAmount} | SettlementType: ${inv.settlementType}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
