import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, Search, ChevronDown, Eye, Cloud, CheckCircle,
  FileDown, Calendar} from 'lucide-react';
import API from '../../utils/Api';
import InvoiceDocumentModal from '../../modal/InvoiceDocumentModal';

const amountColor = {
  Pending: "text-amber-500",
  Overdue: "text-red-500",
  Paid: "text-green-500",
  Submitted: "text-amber-500",
  "In Review": "text-blue-500",
  Approved: "text-green-500",
  Rejected: "text-red-500",
};

const formatCurrency = (value, currency = "INR") =>
  `${currency} ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const statsCardConfig = [
  { key: "totalInvoices", title: "Total Invoices", color: "text-blue-500", bg: "bg-blue-50" },
  { key: "pending", title: "Pending", color: "text-amber-500", bg: "bg-amber-50" },
  { key: "paid", title: "Paid", color: "text-green-500", bg: "bg-green-50" },
  { key: "overdue", title: "Overdue", color: "text-red-500", bg: "bg-red-50" },
  { key: "totalAmount", title: "Total Revenue", color: "text-yellow-500", bg: "bg-yellow-50", money: true },
  { key: "pendingAmount", title: "Pending Amount", color: "text-orange-500", bg: "bg-orange-50", money: true },
];

const StatusBadge = ({ status, method }) => {
  const styles = {
    Pending: "bg-amber-50 text-amber-600 border-amber-200",
    Overdue: "bg-red-50 text-red-600 border-red-200",
    Paid: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Submitted: "bg-amber-50 text-amber-600 border-amber-200",
    "In Review": "bg-blue-50 text-blue-600 border-blue-200",
    Approved: "bg-green-50 text-green-600 border-green-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <div className="flex flex-col items-start">
      <span className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
        {status}
      </span>
      {method && (
        <span className="mt-px block whitespace-nowrap text-[8px] font-medium leading-3 text-slate-400">
          {method}
        </span>
      )}
    </div>
  );
};

const withinDateFilter = (value, dateFilter) => {
  if (!value || dateFilter === "All Time") return true;

  const invoiceDate = new Date(value);
  if (Number.isNaN(invoiceDate.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  invoiceDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((today - invoiceDate) / (1000 * 60 * 60 * 24));

  if (dateFilter === "Last 7 Days") return diffDays >= 0 && diffDays <= 7;
  if (dateFilter === "Last 30 Days") return diffDays >= 0 && diffDays <= 30;
  if (dateFilter === "This Month") {
    return (
      invoiceDate.getMonth() === today.getMonth() &&
      invoiceDate.getFullYear() === today.getFullYear()
    );
  }

  return true;
};

const isDatePast = (value) => {
  if (!value) return false;

  const targetDate = new Date(value);
  if (Number.isNaN(targetDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  return targetDate < today;
};

const getInvoiceDisplayStatus = (status, dueDateValue) => {
  if (status === "Paid") return "Paid";
  if (status === "Rejected") return "Rejected";
  return isDatePast(dueDateValue) ? "Overdue" : "Pending";
};

const InternalInvoices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceData, setInvoiceData] = useState({ summary: {}, invoices: [] });
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        const { data: invoiceResponse } = await API.get("/admin/internal-invoices");

        setInvoiceData(invoiceResponse?.data || { summary: {}, invoices: [] });
      } catch (error) {
        console.error("Failed to fetch finance internal invoice data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, []);

  const invoicesData = useMemo(
    () =>
      (invoiceData.invoices || []).map((invoice) => ({
        _id: invoice.id,
        id: invoice.invoiceNumber,
        isDmc: true,
        ref: invoice.queryId,
        party: invoice.dmcName,
        utr:
          invoice.utrNumber ||
          invoice.utr ||
          invoice.transactionReference ||
          invoice.payoutReference ||
          "Pending",
        bank: invoice.bankName || invoice.sourceBank || invoice.payoutBank || "Pending",
        hasBank: Boolean(invoice.bankName || invoice.sourceBank || invoice.payoutBank),
        date: invoice.dueDate || invoice.invoiceDate,
        amountValue: Number(invoice.amount || 0),
        amount: formatCurrency(invoice.amount, invoice.currency),
        agreedRate: formatCurrency(invoice.opsServicesTotal || 0, invoice.currency),
        agreedRateValue: Number(invoice.opsServicesTotal || 0),
        dmcInvoiceAmount: formatCurrency(invoice.dmcServicesTotal || 0, invoice.currency),
        dmcInvoiceAmountValue: Number(invoice.dmcServicesTotal || 0),
        taxValue: Number(invoice.tax || 0),
        tax: formatCurrency(invoice.tax, invoice.currency),
        status: getInvoiceDisplayStatus(invoice.status, invoice.dueDateValue || invoice.invoiceDateValue),
        method: invoice.templateVariant,
        dateValue: invoice.dueDateValue || invoice.invoiceDateValue,
        quotationNumber: invoice.quotationNumber,
        items: invoice.items || [],
        documents: invoice.documents || [],
      })),
    [invoiceData.invoices],
  );

  const statsData = useMemo(() => {
    const totals = invoicesData.reduce(
      (acc, invoice) => {
        acc.totalInvoices += 1;
        acc.totalAmount += invoice.amountValue;

        if (invoice.status === "Pending") {
          acc.pending += 1;
          acc.pendingAmount += invoice.amountValue;
        }

        if (invoice.status === "Overdue") {
          acc.overdue += 1;
          acc.pendingAmount += invoice.amountValue;
        }

        if (invoice.status === "Paid") {
          acc.paid += 1;
        }

        return acc;
      },
      {
        totalInvoices: 0,
        pending: 0,
        paid: 0,
        overdue: 0,
        totalAmount: 0,
        pendingAmount: 0,
      },
    );

    return statsCardConfig.map((stat) => ({
      ...stat,
      value: stat.money ? formatCurrency(totals[stat.key] || 0) : totals[stat.key] || 0,
    }));
  }, [invoicesData]);

  const openModal = (invoice) => setSelectedInvoice(invoice);
  const closeModal = () => setSelectedInvoice(null);
  const handleInvoiceUpdated = (updatedInvoice) => {
    if (!updatedInvoice?.id) return;

    setInvoiceData((prev) => ({
      ...prev,
      invoices: (prev.invoices || []).map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
      ),
    }));
    setSelectedInvoice((prev) =>
      prev?._id === updatedInvoice.id
        ? {
            ...prev,
            _id: updatedInvoice.id,
            utr:
              updatedInvoice.utrNumber ||
              updatedInvoice.utr ||
              updatedInvoice.transactionReference ||
              updatedInvoice.payoutReference ||
              "Pending",
            bank:
              updatedInvoice.bankName ||
              updatedInvoice.sourceBank ||
              updatedInvoice.payoutBank ||
              "Pending",
            hasBank: Boolean(
              updatedInvoice.bankName || updatedInvoice.sourceBank || updatedInvoice.payoutBank,
            ),
            date: updatedInvoice.dueDate || updatedInvoice.invoiceDate,
            amountValue: Number(updatedInvoice.amount || 0),
            amount: formatCurrency(updatedInvoice.amount, updatedInvoice.currency),
            agreedRate: formatCurrency(updatedInvoice.opsServicesTotal || 0, updatedInvoice.currency),
            agreedRateValue: Number(updatedInvoice.opsServicesTotal || 0),
            dmcInvoiceAmount: formatCurrency(
              updatedInvoice.dmcServicesTotal || 0,
              updatedInvoice.currency,
            ),
            dmcInvoiceAmountValue: Number(updatedInvoice.dmcServicesTotal || 0),
            taxValue: Number(updatedInvoice.tax || 0),
            tax: formatCurrency(updatedInvoice.tax, updatedInvoice.currency),
            status: getInvoiceDisplayStatus(
              updatedInvoice.status,
              updatedInvoice.dueDateValue || updatedInvoice.invoiceDateValue,
            ),
            method: updatedInvoice.templateVariant,
            dateValue: updatedInvoice.dueDateValue || updatedInvoice.invoiceDateValue,
            quotationNumber: updatedInvoice.quotationNumber,
            items: updatedInvoice.items || [],
            documents: updatedInvoice.documents || [],
            payoutReference: updatedInvoice.payoutReference || "",
            payoutDate: updatedInvoice.payoutDate || "",
            payoutDateValue: updatedInvoice.payoutDateValue || updatedInvoice.payoutDate || "",
            payoutBank: updatedInvoice.payoutBank || "",
            payoutAmount: Number(updatedInvoice.payoutAmount || 0),
          }
        : prev,
    );
  };

  const filteredInvoices = useMemo(() => {
    return invoicesData.filter((invoice) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        String(invoice.id || "").toLowerCase().includes(searchLower) ||
        String(invoice.ref || "").toLowerCase().includes(searchLower) ||
        String(invoice.party || "").toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "All Status" || invoice.status === statusFilter;

      const matchesDate = withinDateFilter(invoice.dateValue, dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, invoicesData, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, invoicesData.length]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-full flex flex-col gap-4 max-w-400 mx-auto text-slate-800 w-full overflow-x-hidden sm:p- ">

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Internal Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track all internal invoices</p>
        </div>

        <div className="flex items-start gap-3 flex-wrap justify-end">
          <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
            <FileDown className="w-4 h-4" />
            Export Finance Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0">
        {statsData.map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] text-slate-500 font-medium mb-1">{stat.title}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{loading ? "..." : stat.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <FileText className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col lg:flex-row justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number, booking ref, or party name..."
            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Rejected">Rejected</option>
              <option value="Paid">Paid</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="finance-transparent-scrollbar overflow-x-auto overflow-y-hidden pb-2">
          <div className="min-w-305">
            <table className="w-full table-fixed border-separate border-spacing-y-2">
            <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>

            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Invoice No.</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Booking Ref</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Party Name</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">UTR Number</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bank Name</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Payment Due Date</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-3 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-3 text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-sm">
                    Loading internal invoices...
                  </td>
                </tr>
              ) : paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((invoice, idx) => {
                  const rowCellClass = "border-y border-slate-200 bg-white px-3 py-2.5 align-top";
                  return (
                  <tr key={idx} className="transition-transform duration-150 hover:-translate-y-[1px]">
                    <td className={`${rowCellClass} rounded-l-xl border-l`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-800 truncate min-w-0">{invoice.id}</span>
                        {invoice.isDmc && (
                          <span className="shrink-0 bg-purple-50 text-purple-600 border border-purple-200 text-[8px] font-bold px-1 py-px rounded uppercase">DMC</span>
                        )}
                      </div>
                    </td>

                    <td className={rowCellClass}>
                      <span className="text-[11px] text-slate-500 block whitespace-nowrap">{invoice.ref}</span>
                    </td>

                    <td className={rowCellClass}>
                      <span className="text-[11px] text-slate-800 font-medium truncate block">{invoice.party}</span>
                    </td>

                    <td className={rowCellClass}>
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono block whitespace-nowrap overflow-hidden text-ellipsis">{invoice.utr}</span>
                    </td>

                    <td className={rowCellClass}>
                      {invoice.hasBank ? (
                        <span className="text-[11px] text-slate-500 truncate block">{invoice.bank}</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono block whitespace-nowrap overflow-hidden text-ellipsis">
                          {invoice.bank}
                        </span>
                      )}
                    </td>

                    <td className={rowCellClass}>
                      <div className="flex items-center gap-1 min-w-0 whitespace-nowrap">
                        <Calendar className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="text-[11px] text-slate-500 truncate">{invoice.date}</span>
                      </div>
                    </td>

                    <td className={rowCellClass}>
                      <span className={`text-[11px] font-bold block whitespace-nowrap ${amountColor[invoice.status] || "text-slate-700"}`}>{invoice.amount}</span>
                      <span className="mt-px block text-[9px] leading-3 text-slate-400">Tax: {invoice.tax}</span>
                    </td>

                    <td className={rowCellClass}>
                      <StatusBadge status={invoice.status} method={invoice.method} />
                    </td>

                    <td className={`${rowCellClass} rounded-r-xl border-r`}>
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button onClick={() => openModal(invoice)} className="rounded-full p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" title="Finance Queue">
                          <Cloud className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={invoice.status === 'Paid'}
                          className={invoice.status === 'Paid' ? 'rounded-full p-1 text-green-400/40 cursor-not-allowed' : 'rounded-full p-1 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors'}
                          title="Review Ready"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-sm">
                    No invoices match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
          <span className="text-xs font-medium text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <div className="hidden items-center gap-1 sm:flex">
              {Array.from({ length: totalPages }).map((_, index) => {
                if (
                  totalPages > 5 &&
                  index !== 0 &&
                  index !== totalPages - 1 &&
                  Math.abs(currentPage - 1 - index) > 1
                ) {
                  if (index === 1 && currentPage > 3) {
                    return <span key={index} className="px-1 text-gray-400">...</span>;
                  }
                  if (index === totalPages - 2 && currentPage < totalPages - 2) {
                    return <span key={index} className="px-1 text-gray-400">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      currentPage === index + 1
                        ? "bg-slate-900 text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDocumentModal
          invoice={selectedInvoice}
          onClose={closeModal}
          onInvoiceUpdated={handleInvoiceUpdated}
        />
      )}
    </div>
  );
};

export default InternalInvoices;
