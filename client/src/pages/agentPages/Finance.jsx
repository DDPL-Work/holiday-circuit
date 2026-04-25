import { useEffect, useMemo, useState } from "react";
import { Wallet, Clock, TrendingUp, Download } from "lucide-react";
import { motion } from "framer-motion";
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

const buildStatementCsv = (transactions = [], currency = "INR") => {
  const rows = [
    ["Transaction ID", "Date", "Description", "Details", "Amount", "Status"],
    ...transactions.map((txn) => [
      txn.id || "",
      formatDate(txn.date),
      txn.description || "",
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
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("[data-txn-dropdown]")) {
        setExpandedRows({});
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
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    <motion.section className="space-y-3" variants={container} initial="hidden" animate="visible">
      <motion.header variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-sm text-gray-500">
            Manage your wallet, payments, and commissions.
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadStatement}
            className="border border-gray-400 px-3 py-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer"
          >
            <Download size={16} />
            Statement
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs cursor-pointer"
          >
            + Add Funds
          </motion.button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.article variants={item} whileHover={{ y: -4 }} className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-300">Current Balance</p>
            <Wallet size={20} />
          </div>
          <h2 className="text-2xl font-semibold mt-3">
            {loading ? "Loading..." : formatCurrency(overview.summary.currentBalance, overview.currency)}
          </h2>
        </motion.article>

        <motion.article variants={item} whileHover={{ y: -4 }} className="bg-white shadow-sm p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Pending Commissions</p>
            <Clock className="text-orange-500" size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-orange-600 mt-3">
            {loading ? "Loading..." : formatCurrency(overview.summary.pendingCommissions, overview.currency)}
          </h2>
        </motion.article>

        <motion.article variants={item} whileHover={{ y: -4 }} className="bg-white shadow-sm p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <h2 className="text-2xl font-semibold text-green-600 mt-3">
            {loading ? "Loading..." : formatCurrency(overview.summary.totalEarnings, overview.currency)}
          </h2>
        </motion.article>
      </div>

      <motion.div variants={item} className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        <table className="w-full text-xs table-auto">
            <colgroup>
              <col style={{ width: "190px" }} />
              <col style={{ width: "170px" }} />
              <col />
              <col style={{ width: "170px" }} />
              <col style={{ width: "130px" }} />
            </colgroup>
            <thead className="text-gray-500 border-b border-b-gray-200">
              <tr>
                <th className="text-left py-3">Transaction ID</th>
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Description</th>
                <th className="text-right py-3 whitespace-nowrap">Amount</th>
                <th className="text-right py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : overview.transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No finance transactions found yet.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((txn) => (
                  <tr key={`${txn.id}-${txn.description}`} className="transition-colors hover:bg-slate-50">
                    <td className="py-4 text-blue-600 align-top">{txn.id}</td>
                    <td className="py-4 align-top whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td className="py-4 pr-4 align-top">
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
                                  <svg
                                    style={{ transition: "transform 0.2s ease" }}
                                    className={`w-3 h-3 text-gray-500 ${isOpen ? "rotate-180" : "rotate-0"}`}
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                  >
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
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

                    {/* FIX: whitespace-nowrap + align-top so amount stays on one line and aligns with top of row */}
                    <td className={`py-4 text-right align-top whitespace-nowrap font-medium ${getAmountColor(txn.direction, txn.status)}`}>
                      {getSignedAmount(txn.amount, txn.direction, overview.currency)}
                    </td>

                    <td className="py-4 text-right align-top">
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
          <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-2 pt-4 sm:flex-row">
            <span className="text-xs font-medium text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, overview.transactions.length)} of {overview.transactions.length} entries
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
      </motion.div>
    </motion.section>
  );
};

export default Finance;
