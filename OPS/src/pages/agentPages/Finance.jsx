import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Wallet, Clock, TrendingUp, Download, FileText, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import API from "../../utils/Api";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const formatCurrency = (value, currency = "INR") =>
  `${currency === "INR" ? "₹" : `${currency} `}${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusColor = (status = "") => {
  if (status === "Success") return "bg-green-100 text-green-700";
  if (status === "Rejected") return "bg-rose-100 text-rose-700";
  return "bg-yellow-100 text-yellow-700";
};

const getAmountColor = (direction = "credit", status = "") => {
  if (status === "Rejected") return "text-rose-600";
  return direction === "debit" ? "text-red-600" : "text-green-600";
};

// FIX: Use a non-breaking minus sign (‒) + non-breaking space so the
// sign and number never wrap onto separate lines.
const getSignedAmount = (amount = 0, direction = "credit", currency = "INR") => {
  const sign = direction === "debit" ? "−\u00A0" : "+\u00A0"; // − and non-breaking space
  return `${sign}${formatCurrency(amount, currency)}`;
};

const getTransactionMetaItems = (txn = {}, currency = "INR") => {
  const markupAmount = Number(txn?.meta?.markupAmount || 0);
  const couponDiscountAmount = Number(txn?.meta?.couponDiscountAmount || 0);
  const subtotalAmount = Number(txn?.meta?.subtotalAmount || 0);
  const payableAmount = Number(txn?.meta?.payableAmount || 0);
  const couponCode = String(txn?.meta?.couponCode || "").trim();

  if (txn?.transactionType === "payment") {
    const items = [];
    if (subtotalAmount > 0) {
      items.push({ label: "Subtotal", value: formatCurrency(subtotalAmount, currency) });
    }
    items.push({ label: "Markup", value: formatCurrency(markupAmount, currency) });
    items.push({
      label: "Coupon Discount",
      value: formatCurrency(couponDiscountAmount, currency),
    });
    if (payableAmount > 0) {
      items.push({ label: "Final Payable", value: formatCurrency(payableAmount, currency) });
    }
    if (couponCode) {
      items.push({ label: "Coupon", value: couponCode, accent: true });
    }
    return items;
  }

  if (txn?.transactionType === "commission") {
    return [
      {
        label: "Markup Earned",
        value: formatCurrency(markupAmount, currency),
      },
    ];
  }

  return [];
};

const getQuotationDetails = (txn = {}) =>
  (Array.isArray(txn?.meta?.quotationDetails) ? txn.meta.quotationDetails : []).slice().sort((left, right) => {
    const leftTime = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
    return leftTime - rightTime;
  });

const formatServiceTypeLabel = (type = "") => {
  const normalized = String(type || "").trim().toLowerCase();
  if (!normalized) return "Service";
  return normalized
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getQuoteStatusColor = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "confirmed") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (normalized === "revision requested") return "bg-rose-50 text-rose-700 border border-rose-200";
  if (normalized === "quote sent" || normalized === "sent to client") {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const SpringChevron = ({ open = false, className = "w-3 h-3" }) => (
  <motion.svg
    animate={{ rotate: open ? 180 : 0, scale: open ? 1.06 : 1 }}
    transition={{ type: "spring", stiffness: 380, damping: 24, mass: 0.8 }}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <polyline points="6 9 12 15 18 9" />
  </motion.svg>
);

const buildStatementCsv = (transactions = [], currency = "INR") => {
  const rows = [
    ["Transaction ID", "Date", "Description", "Reject Quotation", "Details", "Amount", "Status"],
    ...transactions.map((txn) => [
      txn.id || "",
      formatDate(txn.date),
      txn.description || "",
      Number(txn?.meta?.quotationStats?.totalCount || 0),
      getTransactionMetaItems(txn, currency)
        .map((item) => `${item.label} ${item.value}`)
        .join(" | "),
      getSignedAmount(txn.amount, txn.direction, currency),
      txn.status || "",
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
};

const Finance = () => {
  const sectionRef = useRef(null);
  const transactionHistoryRef = useRef(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [quotationPopupPlacement, setQuotationPopupPlacement] = useState({
    left: null,
    top: null,
  });
  const isQuotationHistoryOpen = useMemo(
    () =>
      Object.entries(expandedRows).some(
        ([key, isOpen]) => Boolean(isOpen) && key.endsWith("-quotations"),
      ),
    [expandedRows],
  );


  const toggleRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleQuotationHistory = (id, event) => {
    const popupKey = `${id}-quotations`;
    const nextOpen = !expandedRows[popupKey];

    if (!nextOpen) {
      setExpandedRows((prev) => ({ ...prev, [popupKey]: false }));
      setQuotationPopupPlacement({ left: null, top: null });
      return;
    }

    const anchor = event?.currentTarget?.closest?.("[data-quotation-anchor]");
    const anchorRect = anchor?.getBoundingClientRect?.();
    const cardRect = transactionHistoryRef.current?.getBoundingClientRect?.();

    if (anchorRect && cardRect) {
      const visibleTop = Math.max(cardRect.top, 0);
      const visibleBottom = Math.min(cardRect.bottom, window.innerHeight);
      const centerYViewport = visibleTop < visibleBottom
        ? (visibleTop + visibleBottom) / 2
        : cardRect.top + Math.min(cardRect.height * 0.28, 220);

      setQuotationPopupPlacement({
        left: cardRect.left + cardRect.width / 2 - anchorRect.left,
        top: centerYViewport - anchorRect.top,
      });
    }

    setExpandedRows((prev) => ({ ...prev, [popupKey]: true }));
  };

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("[data-txn-dropdown]")) {
        setExpandedRows({});
        setQuotationPopupPlacement({ left: null, top: null });
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [overview, setOverview] = useState({
    currency: "INR",
    summary: {
      currentBalance: 0,
      pendingCommissions: 0,
      totalEarnings: 0,
    },
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const activeTxnWithQuotes = useMemo(() => {
    return overview.transactions.find((txn) => expandedRows[`${txn.id}-quotations`]);
  }, [overview.transactions, expandedRows]);

  const activeQuotationDetails = useMemo(() => {
    if (!activeTxnWithQuotes) return [];
    return getQuotationDetails(activeTxnWithQuotes);
  }, [activeTxnWithQuotes]);

  useEffect(() => {
    const fetchFinanceOverview = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/agent/finance-overview");
        setOverview({
          currency: data?.currency || "INR",
          summary: {
            currentBalance: Number(data?.summary?.currentBalance || 0),
            pendingCommissions: Number(data?.summary?.pendingCommissions || 0),
            totalEarnings: Number(data?.summary?.totalEarnings || 0),
          },
          transactions: Array.isArray(data?.transactions) ? data.transactions : [],
        });
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Unable to load finance data right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceOverview();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [overview.transactions.length]);

  const statementFileName = useMemo(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    return `agent-finance-statement-${stamp}.csv`;
  }, []);

  const totalPages = Math.ceil(overview.transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = overview.transactions.slice(startIndex, startIndex + itemsPerPage);

  const handleDownloadStatement = () => {
    const csvContent = buildStatementCsv(overview.transactions, overview.currency);
    // Prepend UTF-8 Byte Order Mark (BOM) so Excel reads international currency symbols (₹) correctly
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = statementFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <motion.section
      ref={sectionRef}
      className="relative isolate min-h-[calc(100vh-120px)] space-y-3"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.header variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Finance</h1>
          <p className="text-xs text-slate-500">
            Manage your wallet, payments, and commissions.
          </p>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadStatement}
            className="border border-slate-200 bg-white px-4 py-2 rounded-full text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer transition hover:bg-slate-50"
          >
            <Download size={13} />
            Statement
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer shadow-sm"
          >
            + Add Funds
          </motion.button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.article 
          variants={item} 
          whileHover={{ y: -4, boxShadow: "0 12px 30px -10px rgba(79, 70, 229, 0.3)" }} 
          className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white px-4 py-3.5 rounded-xl border border-indigo-500/20 shadow-md transition-all duration-200"
        >
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200">Current Balance</p>
            <Wallet size={16} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold mt-1.5 text-white">
            {loading ? "Loading..." : formatCurrency(overview.summary.currentBalance, overview.currency)}
          </h2>
        </motion.article>

        <motion.article 
          variants={item} 
          whileHover={{ y: -4, boxShadow: "0 12px 20px -8px rgba(249, 115, 22, 0.15)" }} 
          className="bg-gradient-to-br from-white to-orange-50/40 border border-slate-100 border-b-4 border-b-orange-500 shadow-sm px-4 py-3.5 rounded-xl transition-all duration-200"
        >
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Pending Commissions</p>
            <Clock className="text-orange-500" size={16} />
          </div>
          <h2 className="text-xl font-bold text-orange-600 mt-1.5">
            {loading ? "Loading..." : formatCurrency(overview.summary.pendingCommissions, overview.currency)}
          </h2>
        </motion.article>

        <motion.article 
          variants={item} 
          whileHover={{ y: -4, boxShadow: "0 12px 20px -8px rgba(16, 185, 129, 0.15)" }} 
          className="bg-gradient-to-br from-white to-emerald-50/40 border border-slate-100 border-b-4 border-b-emerald-500 shadow-sm px-4 py-3.5 rounded-xl transition-all duration-200"
        >
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Total Earnings</p>
            <TrendingUp className="text-emerald-600" size={16} />
          </div>
          <h2 className="text-xl font-bold text-emerald-600 mt-1.5">
            {loading ? "Loading..." : formatCurrency(overview.summary.totalEarnings, overview.currency)}
          </h2>
        </motion.article>
      </div>

      <motion.div
        ref={transactionHistoryRef}
        variants={item}
        className="relative bg-white shadow-sm rounded-xl px-4 py-3.5"
      >
        <h2 className="text-sm font-semibold mb-3 text-slate-800">Transaction History</h2>
        <table className="w-full text-[11px] table-auto">
            <colgroup>
              <col style={{ width: "190px" }} />
              <col style={{ width: "170px" }} />
              <col />
              <col style={{ width: "170px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "130px" }} />
            </colgroup>
            <thead className="text-[10px] uppercase tracking-[0.12em] text-slate-400 border-b border-slate-100">
              <tr>
                <th className="text-left py-2">Transaction ID</th>
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Description</th>
                <th className="py-2 text-center whitespace-nowrap">Reject Quotation</th>
                <th className="text-right py-2 whitespace-nowrap">Amount</th>
                <th className="text-right py-2">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : overview.transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    No finance transactions found yet.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((txn) => (
                  <tr key={`${txn.id}-${txn.description}`} className="transition-colors hover:bg-slate-50">
                    <td className="py-2 text-blue-600 align-top">{txn.id}</td>
                    <td className="py-2 align-top whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td className="py-2 pr-4 align-top">
                      {(() => {
                        const metaItems = getTransactionMetaItems(txn, overview.currency);
                        const isOpen = !!expandedRows[txn.id];
                        return (
                          <div className="relative w-full" data-txn-dropdown>
                            {/* Description row with arrow */}
                            <div className="inline-flex max-w-full items-center gap-1.5">
                              <span className="whitespace-nowrap">{txn.description}</span>
                              {metaItems.length > 0 && (
                                <button
                                  onClick={() => toggleRow(txn.id)}
                                  className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
                                >
                                  <SpringChevron open={isOpen} className="w-3 h-3 text-gray-500" />
                                </button>
                              )}
                            </div>

                            {/* Floating dropdown — absolutely positioned, won't push rows */}
                            {metaItems.length > 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 6px)",
                                  left: 0,
                                  zIndex: 50,
                                  minWidth: "240px",
                                  opacity: isOpen ? 1 : 0,
                                  transform: isOpen ? "translateY(0)" : "translateY(-6px)",
                                  pointerEvents: isOpen ? "auto" : "none",
                                  transition: "opacity 0.2s ease, transform 0.2s ease",
                                }}
                                className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                              >
                                {metaItems.map((mi, idx) => (
                                  <div
                                    key={`${txn.id}-${mi.label}`}
                                    className={`flex items-center justify-between px-3 py-2 text-[11px] ${
                                      idx !== metaItems.length - 1 ? "border-b border-gray-100" : ""
                                    } ${mi.accent ? "bg-blue-50 text-blue-600" : "text-gray-600"}`}
                                  >
                                    <span className="font-medium">{mi.label}</span>
                                    <span className={mi.accent ? "font-semibold" : ""}>{mi.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-2 pr-4 align-top text-center">
                      {(() => {
                        const quotationDetails = getQuotationDetails(txn);
                        const quotationCount = quotationDetails.length;
                        const isOpen = !!expandedRows[`${txn.id}-quotations`];

                        if (!quotationCount) {
                          return <span className="text-gray-300">-</span>;
                        }

                        return (
                          <div className="relative w-full" data-txn-dropdown data-quotation-anchor>
                            <div className="inline-flex max-w-full items-center justify-center gap-1.5">
                              <span className="whitespace-nowrap font-medium text-slate-700">{quotationCount}</span>
                              <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">
                                Quotation Details
                              </span>
                              <button
                                onClick={(event) => toggleQuotationHistory(txn.id, event)}
                                className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
                              >
                                <SpringChevron open={isOpen} className="w-3 h-3 text-gray-500" />
                              </button>
                            </div>


                          </div>
                        );
                      })()}
                    </td>

                    {/* FIX: whitespace-nowrap + align-top so amount stays on one line and aligns with top of row */}
                    <td className={`py-2 text-right align-top whitespace-nowrap font-medium ${getAmountColor(txn.direction, txn.status)}`}>
                      {getSignedAmount(txn.amount, txn.direction, overview.currency)}
                    </td>

                    <td className="py-2 text-right align-top">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs whitespace-nowrap ${getStatusColor(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        {totalPages > 1 && (
          <div className="mt-3 flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row">
            <span className="text-xs text-slate-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, overview.transactions.length)} of {overview.transactions.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                      return <span key={index} className="px-1 text-slate-400">...</span>;
                    }
                    if (index === totalPages - 2 && currentPage < totalPages - 2) {
                      return <span key={index} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        currentPage === index + 1
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {activeTxnWithQuotes && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center py-10 px-4" data-txn-dropdown>
              {/* Backdrop blur overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[8px]"
                onClick={() => setExpandedRows({})}
              />
              
              {/* Centered Modal content card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[760px] max-h-[72vh] flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
              >
                <div className="flex-shrink-0 rounded-t-[24px] border-b border-slate-100 bg-slate-50 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <FileText size={14} strokeWidth={2.2} />
                      </span>
                      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-700">
                        Quotation History
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedRows({})}
                      className="rounded-full p-1.5 hover:bg-slate-200/80 transition-colors text-slate-450 hover:text-slate-600 cursor-pointer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-650">
                    Only confirmed and rejected quotations are shown here. Open any quotation below to view its price, agent remark, and services.
                  </p>
                </div>

                <div className="modal-transparent-scroll flex-grow max-h-[320px] overflow-y-auto px-6 py-3.5">
                  <div className="space-y-3">
                    {activeQuotationDetails.map((quote, quoteIndex) => {
                      const quoteKey = `${activeTxnWithQuotes.id}-quote-${quote.id || quoteIndex}`;
                      const quoteOpen = !!expandedRows[quoteKey];

                      return (
                        <motion.div
                          key={quoteKey}
                          layout
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80"
                        >
                          <button
                            onClick={() => toggleRow(quoteKey)}
                            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {`Quotation ${quoteIndex + 1}`}
                                </span>
                                {quote.quotationNumber && (
                                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {quote.quotationNumber}
                                  </span>
                                )}
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getQuoteStatusColor(quote.status)}`}>
                                  {quote.status || "Pending"}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                <span>{formatDateTime(quote.createdAt)}</span>
                                <span>{formatCurrency(quote.clientTotalAmount || quote.opsTotalAmount || 0, quote.currency || overview.currency)}</span>
                                <span>{(quote.services || []).length} services</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                quoteOpen
                                  ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
                                  : "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                              }`}>
                                {quoteOpen ? <EyeOff size={13} strokeWidth={2.2} /> : <Eye size={13} strokeWidth={2.2} />}
                                {quoteOpen ? "Hide" : "View"}
                              </span>
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                quoteOpen ? "bg-rose-100 text-rose-600" : "bg-sky-100 text-sky-700"
                              }`}>
                                <SpringChevron open={quoteOpen} className="w-3 h-3" />
                              </span>
                            </div>
                          </button>

                          <AnimatePresence initial={false}>
                            {quoteOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.24, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-slate-200 bg-white px-4 py-3">
                                  <div className="grid grid-cols-2 gap-2.5 text-[11px] sm:grid-cols-3">
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                      <p className="text-slate-400 font-medium">Quote Price</p>
                                      <p className="mt-0.5 font-semibold text-slate-800">
                                        {formatCurrency(quote.clientTotalAmount || quote.opsTotalAmount || 0, quote.currency || overview.currency)}
                                      </p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                      <p className="text-slate-400 font-medium">Valid Till</p>
                                      <p className="mt-0.5 font-semibold text-slate-800">
                                        {formatDate(quote.validTill)}
                                      </p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                      <p className="text-slate-400 font-medium">Services</p>
                                      <p className="mt-0.5 font-semibold text-slate-800">
                                        {(quote.services || []).length}
                                      </p>
                                    </div>
                                  </div>

                                  {quote.revisionRemark && (
                                    <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                                        Agent Remark
                                      </p>
                                      <p className="mt-0.5 text-[11px] leading-5 text-amber-900">
                                        {quote.revisionRemark}
                                      </p>
                                    </div>
                                  )}

                                  {quote.status === "Revision Requested" && !quote.revisionRemark && (
                                    <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                                        Agent Remark
                                      </p>
                                      <p className="mt-0.5 text-[11px] leading-5 text-amber-900">
                                        No rejection remark was shared for this quotation.
                                      </p>
                                    </div>
                                  )}

                                  <div className="mt-3.5">
                                    <div className="mb-1.5 flex items-center gap-2">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                                        <svg
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M3 7h18" />
                                          <path d="M6 12h12" />
                                          <path d="M10 17h4" />
                                        </svg>
                                      </span>
                                      <p className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-700">
                                        Services
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      {(quote.services || []).length > 0 ? (
                                        quote.services.map((service, serviceIndex) => {
                                          const serviceKey = `${quoteKey}-service-card-${serviceIndex}`;
                                          const serviceOpen = !!expandedRows[serviceKey];
                                          const serviceMeta = [
                                            formatServiceTypeLabel(service.type),
                                            [service.city, service.country].filter(Boolean).join(", "),
                                            formatDate(service.serviceDate),
                                          ].filter((value) => value && value !== "-");

                                          const serviceHighlights = [
                                            Number(service.nights || 0) > 0 ? `${service.nights}N` : "",
                                            Number(service.days || 0) > 0 ? `${service.days}D` : "",
                                            Number(service.rooms || 0) > 0 ? `${service.rooms} Room` : "",
                                            Number(service.adults || 0) > 0 ? `${service.adults} Adult` : "",
                                            Number(service.children || 0) > 0 ? `${service.children} Child` : "",
                                            Number(service.pax || 0) > 0 ? `${service.pax} Pax` : "",
                                            service.vehicleType || "",
                                            service.roomType || "",
                                          ].filter(Boolean);

                                          return (
                                            <motion.div
                                              key={`${quoteKey}-service-${serviceIndex}`}
                                              layout
                                              transition={{ duration: 0.2, ease: "easeOut" }}
                                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left"
                                            >
                                              <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                  <p className="text-[11px] font-semibold text-slate-800">
                                                    {service.title || `Service ${serviceIndex + 1}`}
                                                  </p>
                                                  <p className="mt-0.5 text-[10px] text-slate-500">
                                                    {serviceMeta.join(" | ") || "Service details available"}
                                                  </p>
                                                </div>
                                                <div className="flex items-center self-center gap-2">
                                                  <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700">
                                                    {formatCurrency(service.total || 0, service.currency || quote.currency || overview.currency)}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleRow(serviceKey)}
                                                    className={`inline-flex h-7 w-10 items-center justify-center rounded-lg transition-colors ${
                                                      serviceOpen
                                                        ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
                                                        : "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                                                    }`}
                                                  >
                                                    {serviceOpen ? <EyeOff size={14} strokeWidth={2.2} /> : <Eye size={14} strokeWidth={2.2} />}
                                                  </button>
                                                </div>
                                              </div>

                                              <AnimatePresence initial={false}>
                                                {serviceOpen && (
                                                  <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                  >
                                                    {serviceHighlights.length > 0 && (
                                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {serviceHighlights.map((highlight, highlightIndex) => (
                                                          <span
                                                            key={`${quoteKey}-service-highlight-${highlightIndex}`}
                                                            className="rounded-md bg-white px-2 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-200"
                                                          >
                                                            {highlight}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    )}

                                                    {service.description && (
                                                      <p className="mt-2 text-[10px] leading-4 text-slate-500">
                                                        {service.description}
                                                      </p>
                                                    )}
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </motion.div>
                                          );
                                        })
                                      ) : (
                                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-400">
                                          No services available for this quotation.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.section>
  );
};

export default Finance;
