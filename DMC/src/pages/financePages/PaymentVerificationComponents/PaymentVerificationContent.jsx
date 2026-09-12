import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  Eye,
  FileDown,
  Image as ImageIcon,
  Download,
  Check,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Building2,
  Send,
  User,
  Mail,
  Loader2,
} from "lucide-react";

const BANK_LOGOS = {
  "HDFC Bank": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-blue-900/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect width="24" height="24" fill="#004C8F" />
      <rect x="3" y="3" width="5" height="5" fill="#E31E24" />
      <rect x="16" y="3" width="5" height="5" fill="#E31E24" />
      <rect x="3" y="16" width="5" height="5" fill="#E31E24" />
      <rect x="16" y="16" width="5" height="5" fill="#E31E24" />
      <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
    </svg>
  ),
  "ICICI Bank": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-full border border-orange-500/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="12" fill="#F58220" />
      <path
        d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM10.5 7H13.5V9H10.5V7ZM10.5 10.5H13.5V17H10.5V10.5Z"
        fill="#7A1C1C"
      />
    </svg>
  ),
  "State Bank of India": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-full border border-sky-600/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="12" fill="#00B3E3" />
      <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
      <rect x="11" y="12" width="2" height="9" fill="#FFFFFF" />
    </svg>
  ),
  "Axis Bank": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-red-950/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect width="24" height="24" fill="#841A41" />
      <path d="M12 4L4 18H8.5L12 11L15.5L18 18H22.5L12 4Z" fill="#FFFFFF" />
      <path d="M12 14.5L10 18H14L12 14.5Z" fill="#841A41" />
    </svg>
  ),
  "Kotak Bank": (
    <svg
      className="h-3.5 w-3.5 shrink-0 rounded-full border border-red-600/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="12" fill="#EE1C25" />
      <path
        d="M8 7H10V11L14 7H16.5L12.5 11.5L17 17H14.5L11 12.8V17H8V7Z"
        fill="#FFFFFF"
      />
    </svg>
  ),
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getTimeAgo = (value) => {
  if (!value) return "Just now";
  const now = new Date();
  const date = new Date(value);
  const diffInMinutes = Math.floor((now - date) / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return `${Math.floor(diffInMinutes / 1440)} day ago`;
};

const isImageReceipt = (payment) => {
  const mimeType = String(payment?.receiptMimeType || "").toLowerCase();
  const receiptUrl = String(payment?.receiptUrl || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((ext) => receiptUrl.endsWith(ext))
  );
};

const getPaymentComparisonMeta = (payment = {}) => {
  const expectedAmount = Math.round(
    Number(payment?.expectedAmount ?? payment?.amount ?? 0),
  );
  const opsInvoiceAmount = Math.round(
    Number(payment?.opsInvoiceAmount ?? expectedAmount ?? 0),
  );
  const receivedAmount = Math.round(Number(payment?.receivedAmount || 0));
  const hasReceivedAmount = receivedAmount > 0;
  const couponApplied = Boolean(payment?.couponApplied);
  const verificationVariance = hasReceivedAmount
    ? receivedAmount - expectedAmount
    : 0;
  const displayVariance = hasReceivedAmount
    ? couponApplied
      ? receivedAmount - opsInvoiceAmount
      : verificationVariance
    : 0;
  const isMatched = hasReceivedAmount && verificationVariance === 0;
  const expectedAmountLabel = couponApplied
    ? "Payable after coupon"
    : "Expected invoice amount";

  if (!hasReceivedAmount) {
    return {
      expectedAmount,
      opsInvoiceAmount,
      receivedAmount,
      variance: displayVariance,
      verificationVariance,
      hasReceivedAmount,
      isMatched,
      couponApplied,
      expectedAmountLabel,
      label: "Pending Amount",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      varianceClass: "text-slate-400",
      note: couponApplied
        ? "Agent has not declared the transferred amount yet. Coupon-adjusted payable amount should be used for verification."
        : "Agent has not declared the transferred amount yet.",
    };
  }

  if (isMatched) {
    return {
      expectedAmount,
      opsInvoiceAmount,
      receivedAmount,
      variance: displayVariance,
      verificationVariance,
      hasReceivedAmount,
      isMatched,
      couponApplied,
      expectedAmountLabel,
      label: "Fully Paid",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      varianceClass: couponApplied ? "text-rose-700" : "text-emerald-700",
      note: couponApplied
        ? "The amount shared by the agent matches the discounted payable amount. The variance card below still shows the gap against the full ops invoice."
        : "Declared amount matches the ops invoice total exactly.",
    };
  }

  if (verificationVariance < 0) {
    return {
      expectedAmount,
      opsInvoiceAmount,
      receivedAmount,
      variance: displayVariance,
      verificationVariance,
      hasReceivedAmount,
      isMatched,
      couponApplied,
      expectedAmountLabel,
      label: "Partially Paid",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      varianceClass: "text-rose-700",
      note: couponApplied
        ? "Declared amount is lower than the coupon-adjusted payable amount."
        : "Declared amount is lower than the expected invoice total.",
    };
  }

  return {
    expectedAmount,
    opsInvoiceAmount,
    receivedAmount,
    variance: displayVariance,
    verificationVariance,
    hasReceivedAmount,
    isMatched,
    couponApplied,
    expectedAmountLabel,
    label: "Excess Amount",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
    varianceClass: "text-orange-700",
    note: couponApplied
      ? "Declared amount is higher than the coupon-adjusted payable amount."
      : "Declared amount is higher than the expected invoice total.",
  };
};

const formatAuditText = (value = "") =>
  String(value || "").replace(/INR\s*([+-]?\s*[\d,]+)/gi, (_, amount) => {
    const normalized = String(amount || "")
      .replace(/\s+/g, "")
      .trim();
    const sign = normalized.startsWith("-")
      ? "-"
      : normalized.startsWith("+")
        ? "+"
        : "";
    const digitsOnly = normalized.replace(/^[+-]/, "").replace(/,/g, "");

    if (!/^\d+$/.test(digitsOnly)) {
      return `₹${normalized}`;
    }

    return `${sign}${formatCurrency(Number(digitsOnly))}`;
  });

const AmountCheckBadge = ({ payment }) => {
  const meta = getPaymentComparisonMeta(payment);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-50 text-amber-600 border-amber-200",
    "Manager Review": "bg-blue-50 text-blue-600 border-blue-200",
    Verified: "bg-green-50 text-green-600 border-green-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
  };
  const icons = {
    Pending: <Clock className="h-3 w-3 mr-1" />,
    "Manager Review": <ShieldCheck className="h-3 w-3 mr-1" />,
    Verified: <CheckCircle2 className="h-3 w-3 mr-1" />,
    Rejected: <XCircle className="h-3 w-3 mr-1" />,
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      {icons[status]}
      {status}
    </span>
  );
};

const PaymentVerificationContent = ({
  selectedPayment,
  setSelectedPayment,
  selectedWorkflowStatus,
  handleExportFinanceReport,
  exportingReport,
  statsData,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  filteredPayments,
  paginatedPayments,
  totalPages,
  startIndex,
  itemsPerPage,
  currentPage,
  setCurrentPage,
  hasSelectedPaymentContext,
  selectedPaymentComparison,
  isPartialPayment,
  isExcessPayment,
  isPaymentFullyPaid,
  isFinalVerified,
  isFinalRejected,
  isAwaitingManager,
  canCurrentUserReview,
  canVerifySelectedPayment,
  canSendFinalInvoice,
  sendingFinalInvoice,
  submittingAction,
  handleSendFinalInvoice,
  handleDownloadReceipt,
  handlePreviewReceipt,
  setOpenVerifyModal,
  setOpenRejectModal,
  setOpenPaymentTrackerModal,
}) => {
  return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-1 text-slate-800">
        {!selectedPayment && (
          <>
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Payment Verification
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Review and verify agent payment submissions before invoice
                  workflow continues
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportFinanceReport}
                disabled={exportingReport}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-600 active:scale-95 active:translate-y-0 hover:-translate-y-0.5 transition-all duration-300 ease-out text-white px-4.5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer disabled:opacity-75"
              >
                {exportingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Export Finance Report
                  </>
                )}
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0">
              {statsData.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br ${stat.cardBg} border ${stat.borderColor} border-b-4 ${stat.accentColor} rounded-xl p-3.5 shadow-sm hover:shadow-md ${stat.shadowColor} flex items-center justify-between hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out group`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <p className="mb-2 text-[10px] font-semibold leading-4 uppercase tracking-wider text-slate-500">
                        {stat.title}
                      </p>
                      <p
                        className={`text-lg font-extrabold tracking-tight leading-none ${stat.color}`}
                      >
                        {loading ? "..." : stat.value}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform duration-300 ease-out shadow-inner`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </>
        )}

        <AnimatePresence mode="wait">
          {!selectedPayment ? (
            <motion.div
              key="payment-list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Filters */}
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by booking ref, agent name, UTR, or invoice number..."
                    className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All Status">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Manager Review">Awaiting Manager</option>
                      <option value="Verified">Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All Time">All Time</option>
                      <option value="Last 7 Days">Last 7 Days</option>
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="This Month">This Month</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mt-3">
                <div className="custom-scroll overflow-x-auto pb-2">
                  <table className="w-full min-w-[1240px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Booking Reference
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Agent Name
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Amount Check
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          UTR Number
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Payment Date
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Bank
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan="9"
                            className="py-12 text-center text-sm text-slate-400"
                          >
                            Loading payment submissions...
                          </td>
                        </tr>
                      ) : paginatedPayments.length > 0 ? (
                        paginatedPayments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="transition-colors hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">
                                    {payment.bookingReference}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {payment.invoiceNumber}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
                              {payment.agentName}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div>
                                <p className="text-xs font-bold text-slate-800">
                                  {formatCurrency(
                                    payment.expectedAmount || payment.amount,
                                  )}
                                </p>
                                <p className="mt-1 text-[10px] text-slate-400">
                                  Paid:{" "}
                                  {payment.receivedAmount
                                    ? formatCurrency(payment.receivedAmount)
                                    : "Pending"}
                                </p>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <AmountCheckBadge payment={payment} />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {!payment.utrNumber ||
                              payment.utrNumber === "Pending" ? (
                                <span className="inline-flex w-fit items-center rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-0.5 text-[10px] font-mono font-medium text-amber-600 whitespace-nowrap">
                                  Pending
                                </span>
                              ) : (
                                <span
                                  className="inline-flex w-fit items-center rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-700 whitespace-nowrap"
                                  title={payment.utrNumber}
                                >
                                  {payment.utrNumber}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {payment.paymentDate}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              {payment.bankName &&
                              payment.bankName !== "Pending" ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {BANK_LOGOS[payment.bankName] || (
                                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  )}
                                  <span className="text-[11px] font-semibold text-slate-700 truncate min-w-0">
                                    {payment.bankName}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex w-fit items-center rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-0.5 text-[10px] font-mono font-medium text-amber-600 whitespace-nowrap">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <StatusBadge
                                status={
                                  payment.workflowStatus || payment.status
                                }
                              />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center">
                              <button
                                onClick={() => setSelectedPayment(payment)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 hover:from-blue-950 hover:via-slate-900 hover:to-slate-950 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm hover:shadow shadow-blue-950/10 cursor-pointer group"
                              >
                                <Eye className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-300" />
                                Review
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="9"
                            className="py-12 text-center text-sm text-slate-500"
                          >
                            No payment records match your current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-3 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
                  <span className="text-xs font-medium text-gray-500">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredPayments.length,
                    )}{" "}
                    of {filteredPayments.length} entries
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
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
                          if (index === 1 && currentPage > 3)
                            return (
                              <span key={index} className="px-1 text-gray-400">
                                ...
                              </span>
                            );
                          if (
                            index === totalPages - 2 &&
                            currentPage < totalPages - 2
                          )
                            return (
                              <span key={index} className="px-1 text-gray-400">
                                ...
                              </span>
                            );
                          return null;
                        }
                        return (
                          <button
                            key={index}
                            onClick={() => setCurrentPage(index + 1)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${currentPage === index + 1 ? "bg-slate-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="payment-details"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className=" p-1"
            >
              {/* Detail Header */}
              <div className="mb-6 flex items-center justify-between border-b border-gray-300 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Payment Verification Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedPayment.bookingReference} |{" "}
                    {selectedPayment.invoiceNumber}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenPaymentTrackerModal(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-b-[4px] border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100/70 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all hover:from-emerald-100/90 hover:to-green-200/70 hover:border-emerald-300 active:translate-y-[2px] active:border-b-[2px]"
                  >
                    <Clock className="h-4 w-4" />
                    Payment Tracker
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPayment(null);
                      setOpenRejectModal(false);
                      setOpenPaymentTrackerModal(false);
                    }}
                    className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium transition-colors bg-[#000000e3] text-white hover:bg-gray-20 cursor-pointer"
                  >
                    Back to List
                  </button>
                </div>
              </div>

              {/* Status Cards Row */}
              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div
                  className={`rounded-xl border px-4 py-3 border-b-4 ${isFinalVerified ? "border-emerald-200 bg-emerald-50 border-b-emerald-500" : isFinalRejected ? "border-red-200 bg-red-50 border-b-red-500" : isAwaitingManager ? "border-blue-200 bg-blue-50 border-b-blue-500" : "border-amber-200 bg-amber-50 border-b-amber-500"}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Verification Status
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={selectedWorkflowStatus} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/40 via-slate-50/50 to-blue-50/30 border-b-4 border-b-indigo-500 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {isAwaitingManager
                      ? "Recommended By"
                      : selectedPayment.status === "Pending"
                        ? "Assigned To"
                        : "Reviewed By"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {isAwaitingManager
                      ? selectedPayment.teamDecisionByName ||
                        selectedPayment.assignedFinanceName ||
                        "Finance Executive"
                      : selectedPayment.status === "Pending"
                        ? selectedPayment.assignedFinanceName ||
                          "Awaiting assignment"
                        : selectedPayment.reviewedByName ||
                          selectedPayment.assignedFinanceName ||
                          "Awaiting finance review"}
                  </p>
                  {selectedPayment.assignedFinanceEmail && (
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedPayment.assignedFinanceEmail}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-sky-50/40 via-slate-50/50 to-teal-50/30 border-b-4 border-b-sky-500 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {isAwaitingManager
                      ? "Sent To Manager On"
                      : selectedPayment.status === "Pending"
                        ? "Assigned On"
                        : "Reviewed On"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {isAwaitingManager
                      ? selectedPayment.sentToManagerAt ||
                        selectedPayment.teamDecisionAt ||
                        "Pending"
                      : selectedPayment.status === "Pending"
                        ? selectedPayment.assignedAt || "Pending"
                        : selectedPayment.reviewedAt || "Pending"}
                  </p>
                </div>
              </div>

              {/* Match Deck */}
              <div className="mb-6 rounded-[18px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_rgba(255,255,255,1)_42%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_50%,_#eef8f2_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                      Verification Match Deck
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Compare the expected invoice amount with the payment
                      shared by the agent
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {selectedPaymentComparison.note}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <AmountCheckBadge payment={selectedPayment} />
                    {selectedPayment.couponApplied && (
                      <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
                        Coupon Applied
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-sky-700">
                      {selectedPaymentComparison.expectedAmountLabel}
                    </p>
                    <p className="mt-2 text-xl font-bold text-sky-950">
                      {formatCurrency(selectedPaymentComparison.expectedAmount)}
                    </p>
                    {selectedPayment.couponApplied && (
                      <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                          Ops Invoice Before Discount
                        </span>
                        <span className="text-[11px] font-bold text-amber-900">
                          {formatCurrency(
                            selectedPaymentComparison.opsInvoiceAmount,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-700">
                      Agent Declared Amount
                    </p>
                    <p
                      className={`mt-2 text-xl font-bold ${selectedPaymentComparison.hasReceivedAmount ? "text-emerald-950" : "text-slate-400"}`}
                    >
                      {selectedPaymentComparison.hasReceivedAmount
                        ? formatCurrency(
                            selectedPaymentComparison.receivedAmount,
                          )
                        : "Pending"}
                    </p>
                  </div>
                  <div
                    className={`rounded-2xl border px-4 py-3 ${selectedPayment.couponApplied ? "border-violet-200 bg-violet-50/70" : "border-white/70 bg-white/90"}`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                      Variance
                    </p>
                    <p
                      className={`mt-2 text-xl font-bold ${selectedPaymentComparison.varianceClass}`}
                    >
                      {selectedPaymentComparison.hasReceivedAmount
                        ? `${selectedPaymentComparison.variance > 0 ? "+" : ""}${formatCurrency(selectedPaymentComparison.variance)}`
                        : "Pending"}
                    </p>
                    {selectedPayment.couponApplied && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Difference against the full ops invoice before coupon
                        discount
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                      Payment Reference Shared By Agent
                    </p>
                    <p
                      className={`mt-2 text-sm font-semibold leading-5 ${hasSelectedPaymentContext ? "text-slate-900" : "text-slate-400"}`}
                    >
                      {selectedPayment.paymentOnBehalfOf ||
                        "Agent has not shared the payment reference yet"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Column Detail */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* LEFT: Payment Details + Actions */}
                <div className="flex flex-col min-w-0">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Agent Payment Details
                    </h3>
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-4">
                      <div>
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                          <User className="h-3 w-3 text-sky-500" /> Agent Name
                        </p>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <Building2 className="h-4 w-4 text-[#5b5ff8]" />{" "}
                          {selectedPayment.agentName}
                        </p>
                        {selectedPayment.agentEmail && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="h-3 w-3 text-violet-500" />{" "}
                            {selectedPayment.agentEmail}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={selectedWorkflowStatus} />
                    </div>
                    <div className="relative pl-7 space-y-4 mt-2">
                      <div className="absolute left-[11px] top-1.5 bottom-1.5 border-l-2 border-dashed border-slate-200" />

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">
                          Booking Reference
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {selectedPayment.bookingReference}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Invoice Number</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedPayment.invoiceNumber}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-sky-400 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">
                          {selectedPayment.couponApplied
                            ? "Expected Payable Amount"
                            : "Expected Invoice Amount"}
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(
                            selectedPaymentComparison.expectedAmount,
                          )}
                        </p>
                      </div>

                      {selectedPayment.couponApplied && (
                        <div className="relative flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                          <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-400 ring-[3px] ring-slate-50" />
                          <p className="text-xs font-semibold text-amber-700">
                            Ops Invoice Total
                          </p>
                          <p className="text-sm font-bold text-amber-900">
                            {formatCurrency(
                              selectedPaymentComparison.opsInvoiceAmount,
                            )}
                          </p>
                        </div>
                      )}

                      {selectedPayment.couponApplied && (
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-violet-400 ring-[3px] ring-slate-50" />
                          <p className="text-xs text-slate-500">Coupon Code</p>
                          <p className="text-right text-sm font-semibold text-violet-700">
                            {selectedPayment.couponCode || "Applied"}
                          </p>
                        </div>
                      )}

                      {selectedPayment.couponApplied && (
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-[3px] ring-slate-50" />
                          <p className="text-xs text-slate-500">
                            Coupon Discount
                          </p>
                          <p className="text-right text-sm font-semibold text-emerald-700">
                            {selectedPayment.couponDiscountLabel ||
                              formatCurrency(
                                selectedPayment.couponDiscountAmount,
                              )}
                          </p>
                        </div>
                      )}

                      {selectedPayment.couponApplied && (
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-[3px] ring-slate-50" />
                          <p className="text-xs text-slate-500">
                            Discount Amount
                          </p>
                          <p className="text-right text-sm font-semibold text-emerald-700">
                            -{" "}
                            {formatCurrency(
                              selectedPayment.couponDiscountAmount,
                            )}
                          </p>
                        </div>
                      )}

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">
                          Declared Paid Amount
                        </p>
                        <p
                          className={`text-sm font-bold ${selectedPaymentComparison.hasReceivedAmount ? "text-emerald-700" : "text-slate-400"}`}
                        >
                          {selectedPaymentComparison.hasReceivedAmount
                            ? formatCurrency(
                                selectedPaymentComparison.receivedAmount,
                              )
                            : "Pending"}
                        </p>
                      </div>

                      <div
                        className={`relative flex items-center justify-between ${selectedPayment.couponApplied ? "rounded-xl border border-violet-200 bg-violet-50/70 px-3 py-2" : ""}`}
                      >
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-rose-400 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">
                          {selectedPayment.couponApplied
                            ? "Variance From Ops Total"
                            : "Payment Difference"}
                        </p>
                        <p
                          className={`text-sm font-bold ${selectedPaymentComparison.varianceClass}`}
                        >
                          {selectedPaymentComparison.hasReceivedAmount
                            ? `${selectedPaymentComparison.variance > 0 ? "+" : ""}${formatCurrency(selectedPaymentComparison.variance)}`
                            : "Pending"}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-between gap-4">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">
                          Payment On Behalf Of
                        </p>
                        <p className="text-right text-sm font-semibold text-slate-800">
                          {selectedPayment.paymentOnBehalfOf || "Not shared"}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-400 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">UTR Number</p>
                        <p className="font-mono text-[10px] font-semibold text-amber-500">
                          {selectedPayment.utrNumber || "Pending"}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Bank Name</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedPayment.bankName || "Pending"}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Payment Date</p>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {selectedPayment.paymentDate}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-between">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">Submitted</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {selectedPayment.submittedAt || "Pending"}
                        </p>
                      </div>

                      <div className="relative flex items-center justify-between gap-4">
                        <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-slate-300 ring-[3px] ring-slate-50" />
                        <p className="text-xs text-slate-500">
                          Assigned Finance
                        </p>
                        <p className="text-right text-sm font-semibold text-slate-800">
                          {selectedPayment.assignedFinanceName ||
                            "Awaiting assignment"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Finance Review Note */}
                  {(selectedPayment.remarks ||
                    !hasSelectedPaymentContext ||
                    !selectedPaymentComparison.isMatched ||
                    selectedPayment.couponApplied) && (
                    <div
                      className={`mt-4 rounded-xl border px-4 py-3 ${!hasSelectedPaymentContext || isExcessPayment ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${!hasSelectedPaymentContext || isExcessPayment ? "text-amber-700" : "text-slate-500"}`}
                      >
                        Finance Review Note
                      </p>
                      {!hasSelectedPaymentContext && (
                        <p className="mt-2 text-xs leading-5 text-amber-800">
                          Agent has not shared who this payment is for.
                          Verification should wait until the behalf detail is
                          submitted.
                        </p>
                      )}
                      {hasSelectedPaymentContext && isPartialPayment && (
                        <p className="mt-2 text-xs leading-5 text-slate-700">
                          This is a partial payment. Verifying it will keep the
                          invoice partially paid and unlock voucher generation
                          and final invoice dispatch.
                        </p>
                      )}
                      {hasSelectedPaymentContext && isExcessPayment && (
                        <p className="mt-2 text-xs leading-5 text-amber-800">
                          The declared amount is higher than the expected
                          invoice total. Use rejection or ask for corrected
                          resubmission.
                        </p>
                      )}
                      {selectedPayment.remarks && (
                        <p className="mt-2 text-xs leading-5 text-slate-700">
                          <span className="font-semibold">Agent note:</span>{" "}
                          {selectedPayment.remarks}
                        </p>
                      )}
                      {selectedPayment.couponApplied && (
                        <p className="mt-2 text-xs leading-5 text-slate-700">
                          <span className="font-semibold">Coupon context:</span>{" "}
                          {selectedPayment.couponSummary ||
                            `${selectedPayment.couponCode} reduced the payable amount for this invoice.`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {isFinalRejected && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-700">
                        Rejection Reason
                      </p>
                      <p className="mt-2 text-sm font-semibold text-red-700">
                        {selectedPayment.rejectionReason ||
                          "Rejected by finance"}
                      </p>
                      {selectedPayment.rejectionRemarks && (
                        <p className="mt-1 text-xs leading-5 text-red-600">
                          {selectedPayment.rejectionRemarks}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Manager Recommendation */}
                  {isAwaitingManager && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                        Team Recommendation
                      </p>
                      <p className="mt-2 text-sm font-semibold text-blue-700">
                        {selectedPayment.teamDecisionStatus === "Rejected"
                          ? "Recommend Rejection"
                          : "Recommend Verification"}
                      </p>
                      {selectedPayment.teamDecisionReason && (
                        <p className="mt-1 text-xs leading-5 text-blue-700">
                          <span className="font-semibold">Reason:</span>{" "}
                          {selectedPayment.teamDecisionReason}
                        </p>
                      )}
                      {selectedPayment.teamDecisionRemarks && (
                        <p className="mt-1 text-xs leading-5 text-blue-700">
                          <span className="font-semibold">Remarks:</span>{" "}
                          {selectedPayment.teamDecisionRemarks}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Area */}
                  {isFinalVerified ? null : isFinalRejected ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">
                            Awaiting corrected resubmission
                          </p>
                          <p className="mt-1 text-xs leading-5 text-red-700">
                            Agent has been notified. Finance review buttons will
                            become relevant again once updated payment details
                            are submitted.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : isAwaitingManager ? (
                    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-700">
                            Awaiting finance manager approval
                          </p>
                          <p className="mt-1 text-xs leading-5 text-blue-700">
                            Your review has been submitted. Final verification
                            or return-to-agent action will be completed by the
                            finance manager.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6">
                      {canCurrentUserReview && !canVerifySelectedPayment && (
                        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <p className="text-xs leading-5 text-amber-800">
                              Verification unlocks when the payment behalf
                              detail is available and the submitted amount is
                              either partial or exactly matched. Excess payment
                              must be corrected first.
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <button
                          onClick={() => setOpenVerifyModal(true)}
                          disabled={
                            submittingAction || !canVerifySelectedPayment
                          }
                          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-[12px] font-semibold text-white transition-all shadow-sm ${submittingAction || !canVerifySelectedPayment ? "cursor-not-allowed bg-gradient-to-r from-green-300/80 to-emerald-300/80 text-white/80 opacity-80" : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-md active:scale-[0.98]"}`}
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 stroke-[2.4]" />
                          </span>
                          {submittingAction ? "Sending..." : "Verify and Send"}
                        </button>
                        <button
                          onClick={() => setOpenRejectModal(true)}
                          disabled={submittingAction || !canCurrentUserReview}
                          className={`inline-flex flex-1 items-center justify-center gap-2.5 rounded-full py-2 text-[12px] font-semibold text-white transition-all shadow-sm ${submittingAction || !canCurrentUserReview ? "cursor-not-allowed bg-gradient-to-r from-red-300/80 to-rose-300/80 text-white/80 opacity-80" : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 hover:shadow-md active:scale-[0.98]"}`}
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0 stroke-[2.4]" />
                          </span>
                          {submittingAction ? "Sending..." : "Reject and Send"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: Receipt + Audit Trail */}
                <div className="flex flex-col gap-5">
                  {/* Receipt */}
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-slate-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Payment Receipt
                      </h3>
                    </div>
                    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white p-2">
                      {selectedPayment.receiptUrl ? (
                        isImageReceipt(selectedPayment) ? (
                          <div className="relative overflow-hidden rounded-lg">
                            <img
                              src={selectedPayment.receiptUrl}
                              alt="Payment Receipt"
                              className="h-72 w-full rounded-lg object-cover"
                            />
                            <button
                              type="button"
                              onClick={handlePreviewReceipt}
                              className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white opacity-100 shadow-lg transition hover:bg-slate-800 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Preview
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-72 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                            <FileText className="mb-3 h-10 w-10 text-slate-400" />
                            <p className="text-sm font-semibold text-slate-700">
                              {selectedPayment.receiptName ||
                                "Payment receipt available"}
                            </p>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                              Preview is not available for this file type.
                              Finance can still download and verify the receipt.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="flex h-72 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                          <AlertCircle className="mb-3 h-10 w-10 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-500">
                            No receipt uploaded
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Agent payment proof is not available yet.
                          </p>
                        </div>
                      )}
                      <div className="mt-5 flex">
                        <button
                          onClick={handleDownloadReceipt}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-3xl cursor-pointer bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-900"
                        >
                          <Download className="h-4 w-4" />
                          Download Receipt
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail â€” fixed height, internal scroll only */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Audit Trail
                      </h3>
                    </div>
                    <div className="custom-scroll h-[400px] space-y-3 overflow-y-auto pr-1">
                      {(selectedPayment.auditTrail || []).length > 0 ? (
                        selectedPayment.auditTrail
                          .slice()
                          .reverse()
                          .map((entry, index) => (
                            <div
                              key={`${entry.action}-${entry.performedAtValue || index}`}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {entry.action} by{" "}
                                    {entry.performedByName || "System"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {formatDateLabel(entry.performedAtValue)} |{" "}
                                    {getTimeAgo(entry.performedAtValue)}
                                  </p>
                                </div>
                                <StatusBadge status={entry.status} />
                              </div>
                              {(entry.reason || entry.remarks) && (
                                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  {entry.reason && (
                                    <p>
                                      <span className="font-semibold">
                                        Reason:
                                      </span>{" "}
                                      {formatAuditText(entry.reason)}
                                    </p>
                                  )}
                                  {entry.remarks && (
                                    <p className="mt-1">
                                      <span className="font-semibold">
                                        Remarks:
                                      </span>{" "}
                                      {formatAuditText(entry.remarks)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400">
                          Audit trail will appear here after payment submission
                          or finance review.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-width Final Invoice Dispatch â€” only when Verified */}
              {isFinalVerified && !isPaymentFullyPaid && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Partial payment verified
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Voucher generation and final invoice dispatch are
                        available.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isFinalVerified && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/60">
                  {/* Top status strip */}
                  <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/80 px-6 py-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700">
                      Invoice workflow unlocked
                    </p>
                    <span className="ml-auto inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                      Verified
                    </span>
                  </div>

                  {/* Main body â€” full width, info left + button right */}
                  <div className="flex items-center gap-6 px-6 py-5">
                    {/* Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Send className="h-5 w-5" />
                    </div>

                    {/* Info â€” takes all remaining space */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                        Final Invoice Dispatch
                      </p>
                      <p className="mt-0.5 text-sm font-semibold leading-5 text-slate-900">
                        {selectedPayment.finalInvoiceStatus === "Sent"
                          ? "Final invoice already shared with the agent"
                          : "Finance can now send the final invoice to the agent"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                        <p className="text-xs text-slate-500">
                          To:{" "}
                          <span className="font-medium text-slate-700">
                            {selectedPayment.finalInvoiceRecipientEmail ||
                              selectedPayment.agentEmail ||
                              "No email available"}
                          </span>
                        </p>
                        {selectedPayment.finalInvoiceSentAt && (
                          <p className="text-xs text-slate-400">
                            Sent {selectedPayment.finalInvoiceSentAt} •{" "}
                            {selectedPayment.finalInvoiceSentByName ||
                              "Finance Team"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Button â€” right edge */}
                    <button
                      type="button"
                      onClick={handleSendFinalInvoice}
                      disabled={sendingFinalInvoice || !canSendFinalInvoice}
                      className={`inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 transform active:scale-95 ${
                        !canSendFinalInvoice
                          ? "cursor-not-allowed bg-slate-200 border border-slate-300 text-slate-400 shadow-none"
                          : sendingFinalInvoice
                            ? selectedPayment.finalInvoiceStatus === "Sent"
                              ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 cursor-not-allowed opacity-75 text-white"
                              : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 cursor-not-allowed opacity-75 text-white"
                            : selectedPayment.finalInvoiceStatus === "Sent"
                              ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 hover:from-blue-600 hover:via-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/25"
                              : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 hover:shadow-lg hover:shadow-emerald-500/25"
                      }`}
                    >
                      {sendingFinalInvoice ? (
                        <div className="relative flex h-4 w-4 items-center justify-center shrink-0">
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                            />
                            <circle
                              className="opacity-80"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="url(#spinner-gradient)"
                              strokeWidth="3"
                              strokeDasharray="30 15"
                              strokeLinecap="round"
                              fill="none"
                            />
                            <defs>
                              <linearGradient
                                id="spinner-gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      ) : (
                        <Send className="h-4 w-4 shrink-0" />
                      )}
                      <span className="whitespace-nowrap">
                        {sendingFinalInvoice
                          ? "Sending..."
                          : selectedPayment.finalInvoiceStatus === "Sent"
                            ? "Resend Invoice"
                            : "Send Final Invoice"}
                      </span>
                    </button>
                  </div>

                  {/* Bottom note */}
                  <div className="border-t border-emerald-100 bg-white/60 px-6 py-2.5">
                    <p className="text-[11px] leading-4 text-slate-400">
                      This payment has been verified by finance. Downstream
                      invoice workflow can continue from here.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default PaymentVerificationContent;
