import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    console.log('--- USERS ---');
    const users = await mongoose.connection.db.collection('auths').find({
      role: 'finance_partner'
    }).toArray();
    users.forEach(u => {
      console.log(`User: ${u.name} | ID: ${u._id} | Email: ${u.email}`);
    });

    console.log('--- BATCH DETAILS ---');
    const batch = await mongoose.connection.db.collection('dmcsettlementbatches').findOne({
      batchNumber: 'BULK-1782819685208'
    });
    
    if (batch) {
      console.log('Batch ID:', batch._id);
      console.log('AssignedTo:', batch.assignedTo);
      console.log('SubmittedBy:', batch.submittedBy);
      console.log('PayoutInstallments:', JSON.stringify(batch.payoutInstallments, null, 2));
    } else {
      console.log('Batch BULK-1782819685208 not found');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
