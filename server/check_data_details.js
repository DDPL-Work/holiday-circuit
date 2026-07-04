import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    const rawBatch = await mongoose.connection.db.collection('dmcsettlementbatches').findOne({});
    console.log('Raw batch items count:', rawBatch.items ? rawBatch.items.length : 0);
    console.log('Raw first item:', rawBatch.items ? rawBatch.items[0] : 'None');

    // Populate query like the API does:
    const query = await mongoose.connection.db.collection('travelqueries').findOne({ _id: rawBatch.items[0].query });
    console.log('Query from items:', query);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
