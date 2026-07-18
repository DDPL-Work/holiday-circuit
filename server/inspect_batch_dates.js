import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    const batch = await mongoose.connection.db.collection('dmcsettlementbatches').findOne({
      batchNumber: 'BULK-1782819685208'
    });

    if (batch) {
      console.log('Batch items dates:');
      batch.items.forEach((item, index) => {
        console.log(`Item ${index}: serviceDate: ${item.serviceDate} | creditStartDate: ${item.creditStartDate}`);
      });
    } else {
      console.log('Batch not found');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
