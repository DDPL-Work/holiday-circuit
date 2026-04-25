import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Search,
  ChevronDown,
  Eye,
  FileDown,
  Image as ImageIcon,
  Download,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Building2,
  Send,
} from "lucide-react";
import API from "../../utils/Api";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";

const rejectionReasons = [
  "Incorrect UTR Number",
  "Short Payment",
  "Amount Mismatch",
  "Incorrect Bank Name",
  "Receipt Missing or Invalid",
  "UTR Not Found in Bank Statement",
  "Duplicate Payment Entry",
  "Other",
];

const createEmptyData = () => ({
  summary: {
    totalPayments: 0,
    pendingReview: 0,
    sentToManager: 0,
    verified: 0,
    rejected: 0,
    totalAmount: 0,
  },
  payments: [],
});

const formatCurrency = (value) =>
  `INR ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const getPaymentComparisonMeta = (payment = {}) => {
  const expectedAmount = Math.round(Number(payment?.expectedAmount ?? payment?.amount ?? 0));
  const opsInvoiceAmount = Math.round(Number(payment?.opsInvoiceAmount ?? expectedAmount ?? 0));
  const receivedAmount = Math.round(Number(payment?.receivedAmount || 0));
  const hasReceivedAmount = receivedAmount > 0;
  const couponApplied = Boolean(payment?.couponApplied);
  const verificationVariance = hasReceivedAmount ? receivedAmount - expectedAmount : 0;
  const displayVariance = hasReceivedAmount
    ? couponApplied
      ? receivedAmount - opsInvoiceAmount
      : verificationVariance
    : 0;
  const isMatched = hasReceivedAmount && verificationVariance === 0;
  const expectedAmountLabel = couponApplied ? "Coupon-adjusted amount" : "Ops invoice amount";

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
      label: "Amount Needed",
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
      label: "Perfect Match",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      varianceClass: couponApplied ? "text-rose-700" : "text-emerald-700",
      note: couponApplied
        ? "Declared amount matches the coupon-adjusted payable amount exactly, while the variance below shows the gap from the original ops total."
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
      label: "Short Payment",
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
    label: "Excess Payment",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
    varianceClass: "text-orange-700",
    note: couponApplied
      ? "Declared amount is higher than the coupon-adjusted payable amount."
      : "Declared amount is higher than the expected invoice total.",
  };
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

const withinDateFilter = (value, dateFilter) => {
  if (!value || dateFilter === "All Time") return true;
  const recordDate = new Date(value);
  if (Number.isNaN(recordDate.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  recordDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((today - recordDate) / (1000 * 60 * 60 * 24));
  if (dateFilter === "Last 7 Days") return diffDays >= 0 && diffDays <= 7;
  if (dateFilter === "Last 30 Days") return diffDays >= 0 && diffDays <= 30;
  if (dateFilter === "This Month") {
    return (
      recordDate.getMonth() === today.getMonth() &&
      recordDate.getFullYear() === today.getFullYear()
    );
  }
  return true;
};

const isImageReceipt = (payment) => {
  const mimeType = String(payment?.receiptMimeType || "").toLowerCase();
  const receiptUrl = String(payment?.receiptUrl || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((ext) => receiptUrl.endsWith(ext))
  );
};

const AmountCheckBadge = ({ payment }) => {
  const meta = getPaymentComparisonMeta(payment);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${meta.badgeClass}`}>
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
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {icons[status]}
      {status}
    </span>
  );
};

const FeedbackToast = ({ feedback, onClose }) => {
  if (!feedback) return null;
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };
  const Icon = feedback.type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className="fixed right-4 top-4 z-[70] w-full max-w-sm sm:right-6 sm:top-6">
      <div className={`rounded-2xl border px-4 py-3 shadow-xl ${styles[feedback.type] || styles.success}`}>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-white/80 p-1.5"><Icon className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{feedback.title}</p>
            <p className="mt-1 text-sm leading-5">{feedback.message}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-current/60 transition-colors hover:bg-white/60 hover:text-current">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectionModal = ({ payment, submitting, userRole, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rejectionTarget, setRejectionTarget] = useState(
    userRole === "finance_partner" ? "agent" : "agent",
  );
  const [submitted, setSubmitted] = useState(false);
  const showTargetOptions = userRole === "finance_partner";

  const handleSubmit = () => {
    if (!reason) {
      setSubmitted(true);
      return;
    }
    onConfirm({ reason, remarks, rejectionTarget });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-red-100 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Reject Payment Verification</h2>
            <p className="mt-1 text-xs text-slate-400">{payment?.bookingReference} | {payment?.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="custom-scroll space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Rejection Reason <span className="text-red-500">*</span></label>
            <div className="relative">
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${submitted && !reason ? "border-red-300 bg-red-50/40 text-slate-500" : "border-slate-200 bg-white text-slate-700 focus:border-blue-300"}`}>
                <option value="">Select rejection reason</option>
                {rejectionReasons.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            {submitted && !reason && <p className="mt-1.5 text-xs text-red-500">A rejection reason is required.</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Remarks</label>
            <textarea rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add optional remarks for the agent and finance audit trail..." className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-300" />
          </div>
          {showTargetOptions && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Send Rejection To</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "agent",
                    title: "Agent",
                    description: "Agent will correct payment details and resubmit directly.",
                  },
                  {
                    value: "manager",
                    title: "Manager",
                    description: "This payment will move to finance manager for final review.",
                  },
                ].map((option) => {
                  const isActive = rejectionTarget === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRejectionTarget(option.value)}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{option.title}</p>
                          <p className="mt-1 text-xs leading-5">{option.description}</p>
                        </div>
                        <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${
                          isActive
                            ? "border-blue-400 bg-white text-blue-600"
                            : "border-slate-300 text-transparent"
                        }`}>
                          ✓
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs leading-5 text-amber-800">
                {showTargetOptions
                  ? "This action records reviewer, timestamp, rejection reason, and routes the payment to the selected correction owner."
                  : "This action records reviewer, timestamp, rejection reason, and notifies the agent."}
              </p>
            </div>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${submitting ? "cursor-not-allowed bg-red-300" : "bg-red-500 hover:bg-red-600"}`}>
            {submitting ? "Rejecting..." : "Confirm Rejection"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PaymentVerification = () => {
  const user = useSelector((state) => state.auth.user);
  const [paymentData, setPaymentData] = useState(createEmptyData());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [sendingFinalInvoice, setSendingFinalInvoice] = useState(false);
  const itemsPerPage = 8;
  const selectedWorkflowStatus = selectedPayment?.workflowStatus || selectedPayment?.status || "Pending";
  const isAwaitingManager = selectedWorkflowStatus === "Manager Review";
  const isFinalVerified = selectedWorkflowStatus === "Verified";
  const isFinalRejected = selectedWorkflowStatus === "Rejected";
  const canCurrentUserReview =
    selectedPayment &&
    (
      user?.role === "admin"
        ? selectedPayment.status === "Pending"
        : user?.role === "finance_partner"
          ? selectedPayment.status === "Pending" && !selectedPayment.teamDecisionStatus
          : false
    );
  const selectedPaymentComparison = useMemo(
    () => getPaymentComparisonMeta(selectedPayment || {}),
    [selectedPayment],
  );
  const hasSelectedPaymentContext = Boolean(String(selectedPayment?.paymentOnBehalfOf || "").trim());
  const canVerifySelectedPayment =
    canCurrentUserReview &&
    selectedPaymentComparison.isMatched &&
    hasSelectedPaymentContext;
  const canSendFinalInvoice =
    isFinalVerified &&
    Boolean(String(selectedPayment?.agentEmail || "").trim());

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/admin/payment-verifications");
        setPaymentData(data?.data || createEmptyData());
      } catch (fetchError) {
        console.error(fetchError);
        setError(fetchError?.response?.data?.message || "Failed to load payment verification data");
        setPaymentData(createEmptyData());
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const statsData = useMemo(
    () => [
      { title: "Total Payments", value: paymentData.summary.totalPayments, icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
      { title: "Pending Review", value: paymentData.summary.pendingReview, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
      { title: "Awaiting Manager", value: paymentData.summary.sentToManager, icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-50" },
      { title: "Verified", value: paymentData.summary.verified, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
      { title: "Rejected", value: paymentData.summary.rejected, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
      { title: "Total Amount", value: formatCurrency(paymentData.summary.totalAmount), icon: DollarSign, color: "text-yellow-500", bg: "bg-yellow-50" },
    ],
    [paymentData.summary],
  );

  const filteredPayments = useMemo(() => {
    return (paymentData.payments || []).filter((payment) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        String(payment.bookingReference || "").toLowerCase().includes(searchLower) ||
        String(payment.agentName || "").toLowerCase().includes(searchLower) ||
        String(payment.paymentOnBehalfOf || "").toLowerCase().includes(searchLower) ||
        String(payment.utrNumber || "").toLowerCase().includes(searchLower) ||
        String(payment.invoiceNumber || "").toLowerCase().includes(searchLower);
      const workflowStatus = payment.workflowStatus || payment.status;
      const matchesStatus = statusFilter === "All Status" || workflowStatus === statusFilter;
      const matchesDate = withinDateFilter(payment.paymentDateValue || payment.submittedAtValue, dateFilter);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, paymentData.payments, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, paymentData.payments.length]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const refreshPaymentRecord = (updatedPayment) => {
    setPaymentData((prev) => {
      const nextPayments = (prev.payments || []).map((payment) =>
        payment.id === updatedPayment.id ? updatedPayment : payment,
      );

      return {
        payments: nextPayments,
        summary: {
          totalPayments: nextPayments.length,
          pendingReview: nextPayments.filter((payment) => (payment.workflowStatus || payment.status) === "Pending").length,
          sentToManager: nextPayments.filter((payment) => (payment.workflowStatus || payment.status) === "Manager Review").length,
          verified: nextPayments.filter((payment) => (payment.workflowStatus || payment.status) === "Verified").length,
          rejected: nextPayments.filter((payment) => (payment.workflowStatus || payment.status) === "Rejected").length,
          totalAmount: nextPayments.reduce((sum, payment) => sum + Number(payment.expectedAmount ?? payment.amount ?? 0), 0),
        },
      };
    });

    setSelectedPayment(updatedPayment);
  };

  const handleDownloadReceipt = () => {
    if (!selectedPayment?.receiptUrl) {
      setFeedback({ type: "warning", title: "Receipt Missing", message: "No receipt file is available for this payment submission yet." });
      return;
    }

    window.open(selectedPayment.receiptUrl, "_blank", "noopener,noreferrer");
  };

  const handleVerify = async () => {
    if (!selectedPayment || submittingAction) return;

    if (!selectedPaymentComparison.hasReceivedAmount) {
      setFeedback({
        type: "warning",
        title: "Amount Missing",
        message: "Agent must submit the transferred amount before finance can verify this payment.",
      });
      return;
    }

    if (!selectedPaymentComparison.isMatched) {
      setFeedback({
        type: "warning",
        title: "Amount Mismatch",
        message: "Declared payment does not match the expected invoice amount. Reject or ask for correction before verifying.",
      });
      return;
    }

    if (!hasSelectedPaymentContext) {
      setFeedback({
        type: "warning",
        title: "Behalf Details Missing",
        message: "Payment on behalf of is required before finance can verify this payment.",
      });
      return;
    }

    try {
      setSubmittingAction(true);
      const { data } = await API.patch(`/admin/payment-verifications/${selectedPayment.id}/status`, {
        status: "Verified",
      });
      refreshPaymentRecord(data?.data);
      setFeedback({
        type: "success",
        title: user?.role === "finance_partner" ? "Sent to Manager" : "Payment Verified",
        message:
          user?.role === "finance_partner"
            ? "Your verification recommendation has been sent to the finance manager for final approval."
            : "UTR and payment proof have been verified. Invoice workflow is now unlocked.",
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Verification Failed",
        message:
          actionError?.response?.data?.message ||
          actionError?.response?.data?.error ||
          "Unable to verify this payment right now.",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async ({ reason, remarks, rejectionTarget }) => {
    if (!selectedPayment || submittingAction) return;

    try {
      setSubmittingAction(true);
      const { data } = await API.patch(`/admin/payment-verifications/${selectedPayment.id}/status`, {
        status: "Rejected",
        rejectionReason: reason,
        rejectionRemarks: remarks,
        rejectionTarget,
      });
      refreshPaymentRecord(data?.data);
      setOpenRejectModal(false);
      const isFinanceMember = user?.role === "finance_partner";
      const sentToAgent = rejectionTarget === "agent";
      setFeedback({
        type: "warning",
        title: isFinanceMember
          ? sentToAgent
            ? "Returned To Agent"
            : "Sent To Manager"
          : "Payment Rejected",
        message:
          isFinanceMember
            ? sentToAgent
              ? "Payment was sent back to the agent for correction. Once resubmitted, it will return to your queue."
              : "Your rejection recommendation has been sent to the finance manager for final review."
            : "Finance marked this payment as rejected and the agent has been notified.",
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Rejection Failed",
        message:
          actionError?.response?.data?.message ||
          actionError?.response?.data?.error ||
          "Unable to reject this payment right now.",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSendFinalInvoice = async () => {
    if (!selectedPayment || sendingFinalInvoice) return;

    if (!selectedPayment.agentEmail) {
      setFeedback({
        type: "warning",
        title: "Agent Email Missing",
        message: "This final invoice cannot be sent because the agent email is not available.",
      });
      return;
    }

    try {
      setSendingFinalInvoice(true);
      const { data } = await API.post(`/admin/payment-verifications/${selectedPayment.id}/send-final-invoice`);
      refreshPaymentRecord(data?.data);
      setFeedback({
        type: "success",
        title: "Final Invoice Sent",
        message: data?.message || "Finance has shared the final invoice with the agent successfully.",
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Send Failed",
        message:
          actionError?.response?.data?.message ||
          actionError?.response?.data?.error ||
          "Unable to send the final invoice right now.",
      });
    } finally {
      setSendingFinalInvoice(false);
    }
  };

  return (
    <>
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="mx-auto flex max-w-7xl flex-col gap-6  pb-1 text-slate-800">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Verification</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review and verify agent payment submissions before invoice workflow continues
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700">
            <FileDown className="h-4 w-4" />
            Export Finance Report
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="flex min-h-[92px] items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="mb-2 text-[11px] font-semibold leading-4 text-slate-500">{stat.title}</p>
                  <p className={`text-sm font-bold leading-5 ${stat.color}`}>
                    {loading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
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

        <AnimatePresence mode="wait">
          {!selectedPayment ? (
            <motion.div
              key="payment-list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
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
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="All Status">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Manager Review">Awaiting Manager</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="relative">
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="All Time">All Time</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="This Month">This Month</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mt-3">
              <div className="custom-scroll overflow-x-auto pb-2">
                <table className="w-full min-w-[1240px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-slate-50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Booking Reference</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount Check</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">UTR Number</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="9" className="py-12 text-center text-sm text-slate-400">Loading payment submissions...</td></tr>
                    ) : paginatedPayments.length > 0 ? (
                      paginatedPayments.map((payment) => (
                        <tr key={payment.id} className="transition-colors hover:bg-slate-50">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-xs font-semibold text-slate-800">{payment.bookingReference}</p>
                                <p className="text-[10px] text-slate-400">{payment.invoiceNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">{payment.agentName}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{formatCurrency(payment.expectedAmount || payment.amount)}</p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                Paid: {payment.receivedAmount ? formatCurrency(payment.receivedAmount) : "Pending"}
                              </p>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <AmountCheckBadge payment={payment} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4"><span className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] tracking-wide text-slate-500">{payment.utrNumber || "Pending"}</span></td>
                          <td className="whitespace-nowrap px-6 py-4"><div className="flex items-center gap-1.5 text-xs text-slate-600"><Clock className="h-3.5 w-3.5 text-slate-400" />{payment.paymentDate}</div></td>
                          <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">{payment.bankName || "Pending"}</td>
                          <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={payment.workflowStatus || payment.status} /></td>
                          <td className="whitespace-nowrap px-6 py-4 text-center">
                            <button onClick={() => setSelectedPayment(payment)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700">
                              <Eye className="h-3.5 w-3.5" />
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="9" className="py-12 text-center text-sm text-slate-500">No payment records match your current filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="mt-3 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
                <span className="text-xs font-medium text-gray-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length} entries
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
          ) : (
            <motion.div
              key="payment-details"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Payment Verification Details</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedPayment.bookingReference} | {selectedPayment.invoiceNumber}</p>
              </div>
              <button onClick={() => { setSelectedPayment(null); setOpenRejectModal(false); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50">Back to List</button>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className={`rounded-xl border px-4 py-3 ${isFinalVerified ? "border-emerald-200 bg-emerald-50" : isFinalRejected ? "border-red-200 bg-red-50" : isAwaitingManager ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Verification Status</p>
                <div className="mt-2"><StatusBadge status={selectedWorkflowStatus} /></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {isAwaitingManager ? "Recommended By" : selectedPayment.status === "Pending" ? "Assigned To" : "Reviewed By"}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {isAwaitingManager
                    ? selectedPayment.teamDecisionByName || selectedPayment.assignedFinanceName || "Finance Executive"
                    : selectedPayment.status === "Pending"
                    ? selectedPayment.assignedFinanceName || "Awaiting assignment"
                    : selectedPayment.reviewedByName || selectedPayment.assignedFinanceName || "Awaiting finance review"}
                </p>
                {selectedPayment.assignedFinanceEmail && (
                  <p className="mt-1 text-xs text-slate-400">{selectedPayment.assignedFinanceEmail}</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {isAwaitingManager ? "Sent To Manager On" : selectedPayment.status === "Pending" ? "Assigned On" : "Reviewed On"}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {isAwaitingManager
                    ? selectedPayment.sentToManagerAt || selectedPayment.teamDecisionAt || "Pending"
                    : selectedPayment.status === "Pending"
                    ? selectedPayment.assignedAt || "Pending"
                    : selectedPayment.reviewedAt || "Pending"}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-[26px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_rgba(255,255,255,1)_42%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_50%,_#eef8f2_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">Verification Match Deck</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">Check ops amount, declared payment, and behalf context together</h3>
                  <p className="mt-1 text-sm text-slate-500">{selectedPaymentComparison.note}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AmountCheckBadge payment={selectedPayment} />
                  {selectedPayment.couponApplied && (
                    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
                      Coupon Applied
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${
                    hasSelectedPaymentContext
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}>
                    {hasSelectedPaymentContext ? "Behalf captured" : "Behalf missing"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{selectedPaymentComparison.expectedAmountLabel}</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(selectedPaymentComparison.expectedAmount)}</p>
                  {selectedPayment.couponApplied && (
                    <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">Original Ops Total</span>
                      <span className="text-[11px] font-bold text-amber-900">{formatCurrency(selectedPaymentComparison.opsInvoiceAmount)}</span>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Agent Declared Amount</p>
                  <p className={`mt-2 text-xl font-bold ${selectedPaymentComparison.hasReceivedAmount ? "text-slate-900" : "text-slate-400"}`}>
                    {selectedPaymentComparison.hasReceivedAmount
                      ? formatCurrency(selectedPaymentComparison.receivedAmount)
                      : "Pending"}
                  </p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${
                  selectedPayment.couponApplied
                    ? "border-violet-200 bg-violet-50/70"
                    : "border-white/70 bg-white/90"
                }`}>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Variance</p>
                  <p className={`mt-2 text-xl font-bold ${selectedPaymentComparison.varianceClass}`}>
                    {selectedPaymentComparison.hasReceivedAmount
                      ? `${selectedPaymentComparison.variance > 0 ? "+" : ""}${formatCurrency(selectedPaymentComparison.variance)}`
                      : "Pending"}
                  </p>
                  {selectedPayment.couponApplied ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Variance from original ops total after coupon
                    </p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Payment On Behalf Of</p>
                  <p className={`mt-2 text-sm font-semibold leading-5 ${hasSelectedPaymentContext ? "text-slate-900" : "text-slate-400"}`}>
                    {selectedPayment.paymentOnBehalfOf || "Not shared by agent"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="flex flex-col">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-800">Agent Payment Details</h3>
                </div>
                <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-4">
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Agent Name</p>
                      <p className="text-sm font-bold text-slate-900">{selectedPayment.agentName}</p>
                      {selectedPayment.agentEmail && <p className="mt-1 text-xs text-slate-400">{selectedPayment.agentEmail}</p>}
                    </div>
                    <StatusBadge status={selectedWorkflowStatus} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Booking Reference</p><p className="text-sm font-bold text-slate-900">{selectedPayment.bookingReference}</p></div>
                    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Invoice Number</p><p className="text-sm font-semibold text-slate-800">{selectedPayment.invoiceNumber}</p></div>
                    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">{selectedPayment.couponApplied ? "Expected Payable Amount" : "Expected Invoice Amount"}</p><p className="text-lg font-bold text-slate-900">{formatCurrency(selectedPaymentComparison.expectedAmount)}</p></div>
                    {selectedPayment.couponApplied && <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"><p className="text-xs font-semibold text-amber-700">Ops Invoice Total</p><p className="text-sm font-bold text-amber-900">{formatCurrency(selectedPaymentComparison.opsInvoiceAmount)}</p></div>}
                    {selectedPayment.couponApplied && <div className="flex items-center justify-between gap-4"><p className="text-xs text-slate-500">Coupon Code</p><p className="text-right text-sm font-semibold text-violet-700">{selectedPayment.couponCode || "Applied"}</p></div>}
                    {selectedPayment.couponApplied && <div className="flex items-center justify-between gap-4"><p className="text-xs text-slate-500">Coupon Discount</p><p className="text-right text-sm font-semibold text-emerald-700">{selectedPayment.couponDiscountLabel || formatCurrency(selectedPayment.couponDiscountAmount)}</p></div>}
                    {selectedPayment.couponApplied && <div className="flex items-center justify-between gap-4"><p className="text-xs text-slate-500">Discount Amount</p><p className="text-right text-sm font-semibold text-emerald-700">- {formatCurrency(selectedPayment.couponDiscountAmount)}</p></div>}
                    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Declared Paid Amount</p><p className={`text-sm font-bold ${selectedPaymentComparison.hasReceivedAmount ? "text-emerald-700" : "text-slate-400"}`}>{selectedPaymentComparison.hasReceivedAmount ? formatCurrency(selectedPaymentComparison.receivedAmount) : "Pending"}</p></div>
                    <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${selectedPayment.couponApplied ? "border border-violet-200 bg-violet-50/70" : ""}`}><p className="text-xs text-slate-500">{selectedPayment.couponApplied ? "Variance From Ops Total" : "Payment Difference"}</p><p className={`text-sm font-bold ${selectedPaymentComparison.varianceClass}`}>{selectedPaymentComparison.hasReceivedAmount ? `${selectedPaymentComparison.variance > 0 ? "+" : ""}${formatCurrency(selectedPaymentComparison.variance)}` : "Pending"}</p></div>
                    <div className="flex items-center justify-between gap-4"><p className="text-xs text-slate-500">Payment On Behalf Of</p><p className="text-right text-sm font-semibold text-slate-800">{selectedPayment.paymentOnBehalfOf || "Not shared"}</p></div>
                    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">UTR Number</p><p className="font-mono text-[10px] font-semibold text-amber-500">{selectedPayment.utrNumber || "Pending"}</p></div>
                    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Bank Name</p><p className="text-sm font-semibold text-slate-800">{selectedPayment.bankName || "Pending"}</p></div>
                    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Payment Date</p><p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Calendar className="h-3.5 w-3.5 text-slate-400" />{selectedPayment.paymentDate}</p></div>
                    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Submitted</p><p className="text-sm font-semibold text-slate-800">{selectedPayment.submittedAt || "Pending"}</p></div>
                    <div className="flex items-center justify-between gap-4"><p className="text-xs text-slate-500">Assigned Finance</p><p className="text-right text-sm font-semibold text-slate-800">{selectedPayment.assignedFinanceName || "Awaiting assignment"}</p></div>
                  </div>
                </div>

                {(selectedPayment.remarks || !hasSelectedPaymentContext || !selectedPaymentComparison.isMatched || selectedPayment.couponApplied) && (
                  <div className={`mt-4 rounded-xl border px-4 py-3 ${
                    !hasSelectedPaymentContext || !selectedPaymentComparison.isMatched
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                      !hasSelectedPaymentContext || !selectedPaymentComparison.isMatched
                        ? "text-amber-700"
                        : "text-slate-500"
                    }`}>
                      Finance Review Note
                    </p>
                    {!hasSelectedPaymentContext && (
                      <p className="mt-2 text-xs leading-5 text-amber-800">
                        Agent has not shared who this payment is for. Verification should wait until the behalf detail is submitted.
                      </p>
                    )}
                    {hasSelectedPaymentContext && !selectedPaymentComparison.isMatched && (
                      <p className="mt-2 text-xs leading-5 text-amber-800">
                        The declared amount does not match the ops invoice total. Use rejection or ask for corrected resubmission.
                      </p>
                    )}
                    {selectedPayment.remarks && (
                      <p className="mt-2 text-xs leading-5 text-slate-700">
                        <span className="font-semibold">Agent note:</span> {selectedPayment.remarks}
                      </p>
                    )}
                    {selectedPayment.couponApplied && (
                      <p className="mt-2 text-xs leading-5 text-slate-700">
                        <span className="font-semibold">Coupon context:</span> {selectedPayment.couponSummary || `${selectedPayment.couponCode} reduced the payable amount for this invoice.`}
                      </p>
                    )}
                  </div>
                )}

                {isFinalRejected && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-700">Rejection Reason</p>
                    <p className="mt-2 text-sm font-semibold text-red-700">{selectedPayment.rejectionReason || "Rejected by finance"}</p>
                    {selectedPayment.rejectionRemarks && <p className="mt-1 text-xs leading-5 text-red-600">{selectedPayment.rejectionRemarks}</p>}
                  </div>
                )}

                {isAwaitingManager && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Team Recommendation</p>
                    <p className="mt-2 text-sm font-semibold text-blue-700">
                      {selectedPayment.teamDecisionStatus === "Rejected" ? "Recommend Rejection" : "Recommend Verification"}
                    </p>
                    {selectedPayment.teamDecisionReason && (
                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        <span className="font-semibold">Reason:</span> {selectedPayment.teamDecisionReason}
                      </p>
                    )}
                    {selectedPayment.teamDecisionRemarks && (
                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        <span className="font-semibold">Remarks:</span> {selectedPayment.teamDecisionRemarks}
                      </p>
                    )}
                  </div>
                )}

                {isFinalVerified ? (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">Invoice workflow unlocked</p>
                        <p className="mt-1 text-xs leading-5 text-emerald-700">This payment has been verified by finance. Downstream invoice workflow can continue.</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-emerald-200/80 bg-white/80 px-4 py-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Final Invoice Dispatch</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedPayment.finalInvoiceStatus === "Sent" ? "Final invoice already shared with the agent" : "Finance can now send the final invoice to the agent"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Recipient: {selectedPayment.finalInvoiceRecipientEmail || selectedPayment.agentEmail || "No email available"}
                          </p>
                          {selectedPayment.finalInvoiceSentAt ? (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Sent on {selectedPayment.finalInvoiceSentAt} by {selectedPayment.finalInvoiceSentByName || "Finance Team"}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={handleSendFinalInvoice}
                          disabled={sendingFinalInvoice || !canSendFinalInvoice}
                          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                            sendingFinalInvoice || !canSendFinalInvoice
                              ? "cursor-not-allowed bg-slate-300"
                              : selectedPayment.finalInvoiceStatus === "Sent"
                                ? "bg-blue-500 hover:bg-blue-600"
                                : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          <Send className="h-4 w-4" />
                          {sendingFinalInvoice
                            ? "Sending..."
                            : selectedPayment.finalInvoiceStatus === "Sent"
                              ? "Resend Final Invoice"
                              : "Send Final Invoice"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : isFinalRejected ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Awaiting corrected resubmission</p>
                        <p className="mt-1 text-xs leading-5 text-red-700">Agent has been notified. Finance review buttons will become relevant again once updated payment details are submitted.</p>
                      </div>
                    </div>
                  </div>
                ) : isAwaitingManager ? (
                  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-blue-700">Awaiting finance manager approval</p>
                        <p className="mt-1 text-xs leading-5 text-blue-700">Your review has been submitted. Final verification or return-to-agent action will be completed by the finance manager.</p>
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
                            Verification unlocks only when the agent-declared amount matches the invoice total and the payment behalf detail is available.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={handleVerify}
                        disabled={submittingAction || !canVerifySelectedPayment}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl py-2 text-[12px] font-medium text-white transition-colors ${
                          (submittingAction || !canVerifySelectedPayment)
                            ? "cursor-not-allowed bg-green-300"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 stroke-[2.4]" />
                        </span>
                        {submittingAction ? "Saving..." : user?.role === "finance_partner" ? "Send Verify To Manager" : "Approve & Verify"}
                      </button>
                      <button
                        onClick={() => setOpenRejectModal(true)}
                        disabled={submittingAction || !canCurrentUserReview}
                        className={`inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl py-3 text-[12px] font-medium text-white transition-colors ${
                          (submittingAction || !canCurrentUserReview)
                            ? "cursor-not-allowed bg-red-300"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <AlertCircle className="h-4.5 w-4.5 shrink-0 stroke-[2.4]" />
                        </span>
                        {user?.role === "finance_partner" ? "Send Reject To Manager" : "Reject / Dispute"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-800">Payment Receipt</h3>
                  </div>
                  <div className="flex min-h-[360px] flex-col rounded-xl border border-slate-200 bg-white p-2">
                    {selectedPayment.receiptUrl ? (
                      isImageReceipt(selectedPayment) ? (
                        <img src={selectedPayment.receiptUrl} alt="Payment Receipt" className="h-72 w-full rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-72 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                          <FileText className="mb-3 h-10 w-10 text-slate-400" />
                          <p className="text-sm font-semibold text-slate-700">{selectedPayment.receiptName || "Payment receipt available"}</p>
                          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">Preview is not available for this file type. Finance can still download and verify the receipt.</p>
                        </div>
                      )
                    ) : (
                      <div className="flex h-72 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                        <AlertCircle className="mb-3 h-10 w-10 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-500">No receipt uploaded</p>
                        <p className="mt-1 text-xs text-slate-400">Agent payment proof is not available yet.</p>
                      </div>
                    )}
                    <button onClick={handleDownloadReceipt} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                      <Download className="h-4 w-4" />
                      Download Receipt
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-800">Audit Trail</h3>
                  </div>
                  <div className="space-y-3">
                    {(selectedPayment.auditTrail || []).length > 0 ? (
                      selectedPayment.auditTrail.slice().reverse().map((entry, index) => (
                        <div key={`${entry.action}-${entry.performedAtValue || index}`} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{entry.action} by {entry.performedByName || "System"}</p>
                              <p className="mt-1 text-xs text-slate-400">{formatDateLabel(entry.performedAtValue)} | {getTimeAgo(entry.performedAtValue)}</p>
                            </div>
                            <StatusBadge status={entry.status} />
                          </div>
                          {(entry.reason || entry.remarks) && (
                            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                              {entry.reason && <p><span className="font-semibold">Reason:</span> {entry.reason}</p>}
                              {entry.remarks && <p className="mt-1"><span className="font-semibold">Remarks:</span> {entry.remarks}</p>}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400">Audit trail will appear here after payment submission or finance review.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {openRejectModal && selectedPayment && (
          <RejectionModal payment={selectedPayment} submitting={submittingAction} userRole={user?.role} onClose={() => setOpenRejectModal(false)} onConfirm={handleReject} />
        )}
      </AnimatePresence>
    </>
  );
};

export default PaymentVerification;
