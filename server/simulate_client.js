import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

const parseValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatYearMonthFromDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const isDateInYearMonth = (date, yearMonth) =>
  Boolean(date && yearMonth && formatYearMonthFromDate(date) === yearMonth);

const getDmcPaidAmount = (invoice) => {
  const installments = invoice.payoutInstallments || [];
  if (Array.isArray(installments) && installments.length > 0) {
    return installments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }
  if (invoice.status === 'Paid' || invoice.status === 'Settled') return Number(invoice.payoutAmount || invoice.summary?.grandTotal || 0);
  return 0;
};

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    const internalInvoices = await mongoose.connection.db.collection('dmcsettlementbatches').find({}).toArray();
    
    // Simulate June 2026 view
    const statsModalMonth = "Jun";
    const statsModalYear = "2026";
    const targetYearMonth = "2026-06";

    let total = 0;
    let paid = 0;

    internalInvoices.forEach(inv => {
      // Map it to has coveredQueries to behave like client
      inv.coveredQueries = inv.coveredQueries || [];
      inv.settlementType = "bulk";

      const queryItems = (inv.items || []).filter(item => {
        const itemTravelDate = parseValidDate(item.query?.startDate || item.serviceDate || item.creditStartDate);
        if (!itemTravelDate) return false;
        return isDateInYearMonth(itemTravelDate, targetYearMonth);
      });

      const sub = queryItems.reduce((s, item) => s + Number(item.subtotal || 0), 0);
      const tax = queryItems.reduce((s, item) => s + Number(item.tax || 0), 0);
      const rawItemTotal = sub + tax;

      const totalExpected = Number(inv.summary?.grandTotal || inv.claimedSummary?.grandTotal || inv.payoutAmount || 0);
      const itemsTotal = (inv.items || []).reduce((s, it) => s + Number(it.subtotal || 0) + Number(it.tax || 0), 0);
      
      let rawTotal = rawItemTotal;
      if (itemsTotal > 0) {
        rawTotal = rawItemTotal * (totalExpected / itemsTotal);
      }
      const dmcPaid = getDmcPaidAmount(inv);
      const rawPaid = totalExpected > 0 ? rawTotal * (dmcPaid / totalExpected) : 0;

      console.log("SIMULATED LOG:", {
        invoiceNumber: inv.invoiceNumber,
        totalItems: inv.items?.length,
        filteredQueryItems: queryItems.length,
        rawItemTotal,
        totalExpected,
        itemsTotal,
        rawTotal,
        rawPaid,
        dmcPaid
      });

      total += rawTotal;
      paid += rawPaid;
    });

    console.log("SIMULATED FINAL STATS:", { total, paid });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
