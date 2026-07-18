import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    console.log('--- DETAILED INVOICE DOCUMENT ---');
    const invoice = await mongoose.connection.db.collection('invoices').findOne({
      invoiceNumber: 'INV-1024'
    });
    console.log(JSON.stringify(invoice, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
