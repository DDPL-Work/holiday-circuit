import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Auth from './src/models/auth.model.js';
import TravelQuery from './src/models/TravelQuery.model.js';
import InternalInvoice from './src/models/internalInvoice.model.js';
import DmcSettlementBatch from './src/models/dmcSettlementBatch.model.js';
import Invoice from './src/models/invoice.model.js';
import { getFinanceAccessContext } from './src/services/financeTeamScopeService.js';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

const parseAnalyticsDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const getInternalInvoiceCostAmount = (invoice = {}) => {
  const isBatch = Boolean(invoice.batchNumber || invoice.settlementType === "bulk");
  if (isBatch) {
    return Number(invoice.summary?.grandTotal || invoice.claimedSummary?.grandTotal || invoice.payoutAmount || 0);
  }
  return Number(invoice.payoutAmount || invoice.summary?.grandTotal || invoice.claimedSummary?.grandTotal || 0);
};

const getAnalyticsInternalInvoiceDate = (invoice = {}) =>
  parseAnalyticsDate(invoice.payoutDate) ||
  parseAnalyticsDate(invoice.submittedAt) ||
  parseAnalyticsDate(invoice.createdAt);

const getInternalInvoiceCostEntries = (invoice = {}) => {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const isBatch = Boolean(invoice.batchNumber || invoice.settlementType === "bulk");

  if (isBatch && !items.length) {
    return [];
  }

  if (isBatch && items.length) {
    const invoiceTotal = getInternalInvoiceCostAmount(invoice);
    const itemSubtotalTotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

    return items.map((item) => {
      const itemSubtotal = Number(item.subtotal || 0);
      const proportionalAmount = itemSubtotalTotal > 0
        ? (invoiceTotal * itemSubtotal) / itemSubtotalTotal
        : itemSubtotal + Number(item.tax || 0);
      const date =
        parseAnalyticsDate(item.serviceDate) ||
        parseAnalyticsDate(item.creditStartDate) ||
        parseAnalyticsDate(item.query?.startDate);

      return {
        date,
        amount: Number(proportionalAmount || 0),
      };
    }).filter((entry) => entry.date && entry.amount > 0);
  }

  return [
    {
      date: getAnalyticsInternalInvoiceDate(invoice),
      amount: getInternalInvoiceCostAmount(invoice),
    },
  ].filter((entry) => entry.date && entry.amount > 0);
};

async function run() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    const user = await Auth.findOne({ email: 'finance2@gmail.com' }).lean();
    const accessContext = await getFinanceAccessContext({ id: user._id.toString(), role: user.role });

    const internalInvoices = await InternalInvoice.find({}).populate("query").lean();
    const settlementBatches = await DmcSettlementBatch.find({}).populate("items.query").lean();
    const allInternalInvoices = [
      ...internalInvoices,
      ...settlementBatches.map((batch) => ({
        ...batch,
        settlementType: "bulk",
      })),
    ];

    const invoices = await Invoice.find({}).populate("query").lean();
    const baseScopedInvoices = invoices.filter((invoice) => {
      const assignedFinance = invoice.paymentVerification?.assignedTo || invoice.paymentVerification?.reviewedBy || null;
      const assignedFinanceId = assignedFinance ? String(assignedFinance?._id || assignedFinance) : null;
      return assignedFinanceId === accessContext.currentUserId;
    });

    const scopedInvoiceQueryKeys = baseScopedInvoices.reduce((set, invoice) => {
      const addQueryKey = (set, value) => {
        if (value && value !== "-") set.add(String(value?._id || value?.id || value).trim());
      };
      addQueryKey(set, invoice.query);
      addQueryKey(set, invoice.query?._id);
      addQueryKey(set, invoice.query?.queryId);
      addQueryKey(set, invoice.queryCode);
      addQueryKey(set, invoice.tripSnapshot?.queryId);
      return set;
    }, new Set());

    const getInternalInvoiceQueryKeys = (invoice = {}) => {
      const keys = new Set();
      const addQueryKey = (set, value) => {
        if (value && value !== "-") set.add(String(value?._id || value?.id || value).trim());
      };
      addQueryKey(keys, invoice.query);
      addQueryKey(keys, invoice.query?._id);
      addQueryKey(keys, invoice.query?.queryId);
      addQueryKey(keys, invoice.queryCode);
      (invoice.coveredQueries || []).forEach((covered) => {
        addQueryKey(keys, covered.query);
        addQueryKey(keys, covered.query?._id);
        addQueryKey(keys, covered.query?.queryId);
        addQueryKey(keys, covered.queryCode);
        addQueryKey(keys, covered.queryId);
      });
      (invoice.items || []).forEach((item) => {
        addQueryKey(keys, item.query);
        addQueryKey(keys, item.query?._id);
        addQueryKey(keys, item.query?.queryId);
        addQueryKey(keys, item.queryCode);
        addQueryKey(keys, item.queryId);
      });
      return keys;
    };

    const agentMatchedInternalInvoices = allInternalInvoices.filter((invoice) => {
      return Array.from(getInternalInvoiceQueryKeys(invoice)).some((key) => scopedInvoiceQueryKeys.has(key));
    });

    const baseScopedInternalInvoices = allInternalInvoices.filter((invoice) => {
      const assignedTo = invoice.assignedTo || invoice.reviewedBy || null;
      const assignedFinanceId = assignedTo ? String(assignedTo?._id || assignedTo) : null;
      return assignedFinanceId === accessContext.currentUserId;
    });

    const candidateScopedInternalInvoices = [
      ...baseScopedInternalInvoices,
      ...agentMatchedInternalInvoices
    ];

    const allAgentInvoiceQueryKeys = invoices.reduce((set, invoice) => {
      const addQueryKey = (set, value) => {
        if (value && value !== "-") set.add(String(value?._id || value?.id || value).trim());
      };
      addQueryKey(set, invoice.query);
      addQueryKey(set, invoice.query?._id);
      addQueryKey(set, invoice.query?.queryId);
      addQueryKey(set, invoice.queryCode);
      addQueryKey(set, invoice.tripSnapshot?.queryId);
      return set;
    }, new Set());

    const filterInternalInvoiceByQueryKeys = (invoice = {}, allowedKeys = new Set(), forceFilter = false) => {
      const isBatch = Boolean(invoice.batchNumber || invoice.settlementType === "bulk");
      if (isBatch && !forceFilter) {
        return invoice;
      }
      if (!allowedKeys.size) return invoice;
      const keys = getInternalInvoiceQueryKeys(invoice);
      const matches = Array.from(keys).some(k => allowedKeys.has(k));
      if (!matches) return null;

      const hasQueryScopedItems = Array.isArray(invoice.items) && invoice.items.some((item) =>
        Boolean(item?.query || item?.queryCode || item?.query?.queryId || item?.query?._id),
      );
      const filteredItems = hasQueryScopedItems
        ? invoice.items.filter((item) => {
            const itemKeys = new Set();
            const addQueryKey = (set, value) => {
              if (value && value !== "-") set.add(String(value?._id || value?.id || value).trim());
            };
            addQueryKey(itemKeys, item.query);
            addQueryKey(itemKeys, item.query?._id);
            addQueryKey(itemKeys, item.query?.queryId);
            addQueryKey(itemKeys, item.queryCode);
            return Array.from(itemKeys).some(k => allowedKeys.has(k));
          })
        : [];

      return {
        ...invoice,
        items: hasQueryScopedItems ? filteredItems : invoice.items,
      };
    };

    const profitInternalInvoices = candidateScopedInternalInvoices
      .filter((invoice) => {
        const internalKeys = getInternalInvoiceQueryKeys(invoice);
        const hasAgentInvoice = Array.from(internalKeys).some(k => allAgentInvoiceQueryKeys.has(k));
        return hasAgentInvoice
          ? Array.from(internalKeys).some(k => scopedInvoiceQueryKeys.has(k))
          : true;
      })
      .map((invoice) => {
        const internalKeys = getInternalInvoiceQueryKeys(invoice);
        const hasAgentInvoice = Array.from(internalKeys).some(k => allAgentInvoiceQueryKeys.has(k));
        return hasAgentInvoice
          ? filterInternalInvoiceByQueryKeys(invoice, scopedInvoiceQueryKeys, true)
          : invoice;
      })
      .filter(Boolean);

    console.log('\n=== Scoped Invoice Query Keys for FM2 ===', Array.from(scopedInvoiceQueryKeys));

    console.log('\n=== August 2026 Cost Entries for FM2 ===');
    const augStart = new Date(2026, 7, 1);
    const augEnd = new Date(2026, 7, 31, 23, 59, 59, 999);
    profitInternalInvoices.forEach(inv => {
      const entries = getInternalInvoiceCostEntries(inv);
      entries.forEach(e => {
        if (e.date >= augStart && e.date <= augEnd) {
          console.log(`Invoice: ${inv.invoiceNumber || inv.batchNumber} (Type: ${inv.settlementType || 'normal'}) - Date: ${e.date}, Amount: ${e.amount}`);
        }
      });
    });

    console.log('\n=== December 2026 Cost Entries for FM2 ===');
    const decStart = new Date(2026, 11, 1);
    const decEnd = new Date(2026, 11, 31, 23, 59, 59, 999);
    profitInternalInvoices.forEach(inv => {
      const entries = getInternalInvoiceCostEntries(inv);
      entries.forEach(e => {
        if (e.date >= decStart && e.date <= decEnd) {
          console.log(`Invoice: ${inv.invoiceNumber || inv.batchNumber} (Type: ${inv.settlementType || 'normal'}) - Date: ${e.date}, Amount: ${e.amount}`);
        }
      });
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
