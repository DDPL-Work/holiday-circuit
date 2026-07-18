import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    const b = await mongoose.connection.db.collection('dmcsettlementbatches').findOne({
      $or: [
        { batchNumber: 'BULK-INV-20260630-170805' },
        { invoiceNumber: 'BULK-INV-20260630-170805' }
      ]
    });
    
    if (b) {
      console.log('Batch found in dmcsettlementbatches collection:');
      console.log('Batch ID:', b._id);
      console.log('BatchNumber:', b.batchNumber);
      console.log('AssignedTo:', b.assignedTo);
      console.log('PayoutInstallments:', JSON.stringify(b.payoutInstallments, null, 2));
    } else {
      console.log('Batch not found in dmcsettlementbatches. Checking internalinvoices collection...');
      const inv = await mongoose.connection.db.collection('internalinvoices').findOne({
        $or: [
          { batchNumber: 'BULK-INV-20260630-170805' },
          { invoiceNumber: 'BULK-INV-20260630-170805' }
        ]
      });
      if (inv) {
        console.log('Invoice found in internalinvoices collection:');
        console.log('Invoice ID:', inv._id);
        console.log('InvoiceNumber:', inv.invoiceNumber);
        console.log('AssignedTo:', inv.assignedTo);
        console.log('PayoutInstallments:', JSON.stringify(inv.payoutInstallments, null, 2));
        console.log('payoutDate:', inv.payoutDate);
        console.log('payoutAmount:', inv.payoutAmount);
      } else {
        console.log('Not found in internalinvoices either.');
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
