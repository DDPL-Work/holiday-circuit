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
  User,
  Mail,
  History,
  PieChart,
  IndianRupee,
  Loader2,
} from "lucide-react";
import API from "../../utils/Api";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";
import PaymentVerificationContent from "./PaymentVerificationComponents/PaymentVerificationContent";
import PaymentTrackerModal from "./PaymentVerificationComponents/Modals/PaymentTrackerModal";
import FeedbackToast from "./PaymentVerificationComponents/Modals/FeedbackToast";
import ReviewActionModal from "./PaymentVerificationComponents/Modals/ReviewActionModal";
import VerifyInstallmentConfirmationModal from "./PaymentVerificationComponents/Modals/VerifyInstallmentConfirmationModal";
import SendAgentReceiptModal from "./PaymentVerificationComponents/Modals/SendAgentReceiptModal";


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

const normalizeWhatsAppPhoneNumber = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const getApiOrigin = () => {
  const baseUrl = API?.defaults?.baseURL || "";
  try {
    return new URL(baseUrl).origin;
  } catch {
    return "";
  }
};

const triggerFileDownload = async (url, fileName = "Payment_Receipt.pdf") => {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
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

const AUDIT_AMOUNT_LABEL_PATTERN =
  /(amount|invoice total|difference|variance|discount|payable)/i;

const formatAuditAmountToken = (rawValue = "") => {
  const normalized = String(rawValue || "")
    .replace(/INR|₹/gi, "")
    .replace(/\s+/g, "")
    .trim();
  const isNegative = normalized.startsWith("-");
  const isPositive = normalized.startsWith("+");
  const digitsOnly = normalized.replace(/^[+-]/, "").replace(/,/g, "");

  if (!/^\d+$/.test(digitsOnly)) {
    return String(rawValue || "").trim();
  }

  const formattedAmount = formatCurrency(Number(digitsOnly));
  if (isNegative) return `-${formattedAmount}`;
  if (isPositive) return `+${formattedAmount}`;
  return formattedAmount;
};

const formatAuditValue = (label = "", value = "") => {
  const normalizedLabel = String(label || "").trim();
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) return "";

  if (AUDIT_AMOUNT_LABEL_PATTERN.test(normalizedLabel)) {
    return formatAuditAmountToken(trimmedValue);
  }

  return trimmedValue.replace(/INR\s*([+-]?\s*[\d,]+)/gi, (_, amount) =>
    formatAuditAmountToken(amount),
  );
};

const parseAuditDetailItems = (value = "") =>
  String(value || "")
    .split("|")
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item, index) => {
      const separatorIndex = item.indexOf(":");
      if (separatorIndex === -1) {
        return {
          id: `${index}-${item}`,
          label: "",
          value: formatAuditValue("", item),
          isAmount: false,
        };
      }

      const label = item.slice(0, separatorIndex).trim();
      const rawValue = item.slice(separatorIndex + 1).trim();
      return {
        id: `${index}-${label}`,
        label,
        value: formatAuditValue(label, rawValue),
        isAmount: AUDIT_AMOUNT_LABEL_PATTERN.test(label),
      };
    });


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
  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openPaymentTrackerModal, setOpenPaymentTrackerModal] = useState(false);
  const [openSendAgentReceiptModal, setOpenSendAgentReceiptModal] =
    useState(false);
  const [openReceiptPreview, setOpenReceiptPreview] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [sendingFinalInvoice, setSendingFinalInvoice] = useState(false);
  const [sendingAgentReceipt, setSendingAgentReceipt] = useState(false);
  const [verifyingInstallmentIndex, setVerifyingInstallmentIndex] =
    useState(null);
  const [agentReceiptEmail, setAgentReceiptEmail] = useState("");
  const [agentReceiptPhone, setAgentReceiptPhone] = useState("");
  const [agentReceiptChannel, setAgentReceiptChannel] = useState("EMAIL");
  const [selectedReceiptInstallmentIndex, setSelectedReceiptInstallmentIndex] =
    useState(null);
  const [installmentToVerifyConfirmIndex, setInstallmentToVerifyConfirmIndex] =
    useState(null);
  const itemsPerPage = 8;
  const selectedWorkflowStatus =
    selectedPayment?.workflowStatus || selectedPayment?.status || "Pending";
  const isAwaitingManager = selectedWorkflowStatus === "Manager Review";
  const isFinalVerified = selectedWorkflowStatus === "Verified";
  const isFinalRejected = selectedWorkflowStatus === "Rejected";
  const canCurrentUserReview =
    selectedPayment &&
    (user?.role === "admin"
      ? selectedPayment.status === "Pending"
      : user?.role === "finance_partner"
        ? selectedPayment.status === "Pending" &&
          !selectedPayment.teamDecisionStatus
        : false);
  const selectedPaymentComparison = useMemo(
    () => getPaymentComparisonMeta(selectedPayment || {}),
    [selectedPayment],
  );
  const hasSelectedPaymentContext = Boolean(
    String(selectedPayment?.paymentOnBehalfOf || "").trim(),
  );
  const isPartialPayment =
    selectedPaymentComparison.hasReceivedAmount &&
    selectedPaymentComparison.verificationVariance < 0;
  const isExcessPayment =
    selectedPaymentComparison.hasReceivedAmount &&
    selectedPaymentComparison.verificationVariance > 0;
  const isPaymentFullyPaid = selectedPayment?.invoicePaymentStatus === "Paid";
  const canVerifySelectedPayment =
    canCurrentUserReview &&
    hasSelectedPaymentContext &&
    (selectedPaymentComparison.isMatched || isPartialPayment);
  const canSendFinalInvoice =
    isFinalVerified &&
    ["Partially Paid", "Paid"].includes(
      selectedPayment?.invoicePaymentStatus,
    ) &&
    selectedPayment?.canSendFinalInvoice === true &&
    Boolean(String(selectedPayment?.agentEmail || "").trim());
  const canSendPaymentReceipt =
    Math.round(
      Number(
        selectedPayment?.paymentTrackerPaidAmount ||
          selectedPayment?.receivedAmount ||
          0,
      ),
    ) > 0;
  const canVerifyInstallments =
    Boolean(selectedPayment) &&
    !isAwaitingManager &&
    !isFinalRejected &&
    (canCurrentUserReview || isFinalVerified);
  const selectedReceiptTrackerEntry =
    selectedReceiptInstallmentIndex !== null &&
    Array.isArray(selectedPayment?.paymentTrackerEntries)
      ? selectedPayment.paymentTrackerEntries[
          selectedReceiptInstallmentIndex
        ] || null
      : null;

  useEffect(() => {
    setOpenReceiptPreview(false);
    setOpenPaymentTrackerModal(false);
    setOpenSendAgentReceiptModal(false);
    setAgentReceiptEmail(
      String(
        selectedPayment?.paymentReceiptRecipientEmail ||
          selectedPayment?.agentEmail ||
          "",
      ).trim(),
    );
    setAgentReceiptPhone(String(selectedPayment?.agentPhone || "").trim());
    setAgentReceiptChannel("EMAIL");
    setSelectedReceiptInstallmentIndex(null);
    setVerifyingInstallmentIndex(null);
    setInstallmentToVerifyConfirmIndex(null);
  }, [selectedPayment?.id, selectedPayment?.receiptUrl]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/admin/payment-verifications");
        setPaymentData(data?.data || createEmptyData());
      } catch (fetchError) {
        console.error(fetchError);
        setError(
          fetchError?.response?.data?.message ||
            "Failed to load payment verification data",
        );
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
      {
        title: "Total Payments",
        value: paymentData.summary.totalPayments,
        icon: FileText,
        color: "text-blue-600",
        accentColor: "border-b-blue-500",
        cardBg: "from-blue-50/90 via-white to-blue-50/20",
        borderColor: "border-blue-100 hover:border-blue-300",
        iconBg: "bg-blue-100/80 text-blue-600",
        shadowColor: "shadow-blue-500/5",
      },
      {
        title: "Pending Review",
        value: paymentData.summary.pendingReview,
        icon: Clock,
        color: "text-amber-600",
        accentColor: "border-b-amber-500",
        cardBg: "from-amber-50/90 via-white to-amber-50/20",
        borderColor: "border-amber-100 hover:border-amber-300",
        iconBg: "bg-amber-100/80 text-amber-600",
        shadowColor: "shadow-amber-500/5",
      },
      {
        title: "Awaiting Manager",
        value: paymentData.summary.sentToManager,
        icon: ShieldCheck,
        color: "text-indigo-600",
        accentColor: "border-b-indigo-500",
        cardBg: "from-indigo-50/90 via-white to-indigo-50/20",
        borderColor: "border-indigo-100 hover:border-indigo-300",
        iconBg: "bg-indigo-100/80 text-indigo-600",
        shadowColor: "shadow-indigo-500/5",
      },
      {
        title: "Verified",
        value: paymentData.summary.verified,
        icon: CheckCircle2,
        color: "text-emerald-600",
        accentColor: "border-b-emerald-500",
        cardBg: "from-emerald-50/90 via-white to-emerald-50/20",
        borderColor: "border-emerald-100 hover:border-emerald-300",
        iconBg: "bg-emerald-100/80 text-emerald-600",
        shadowColor: "shadow-emerald-500/5",
      },
      {
        title: "Rejected",
        value: paymentData.summary.rejected,
        icon: XCircle,
        color: "text-rose-600",
        accentColor: "border-b-rose-500",
        cardBg: "from-rose-50/90 via-white to-rose-50/20",
        borderColor: "border-rose-100 hover:border-rose-300",
        iconBg: "bg-rose-100/80 text-rose-600",
        shadowColor: "shadow-rose-500/5",
      },
      {
        title: "Total Amount",
        value: formatCurrency(paymentData.summary.totalAmount),
        icon: IndianRupee,
        color: "text-yellow-600",
        accentColor: "border-b-yellow-500",
        cardBg: "from-yellow-50/90 via-white to-yellow-50/20",
        borderColor: "border-yellow-100 hover:border-yellow-300",
        iconBg: "bg-yellow-100/80 text-yellow-600",
        shadowColor: "shadow-yellow-500/5",
      },
    ],
    [paymentData.summary],
  );

  const filteredPayments = useMemo(() => {
    return (paymentData.payments || []).filter((payment) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        String(payment.bookingReference || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(payment.agentName || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(payment.paymentOnBehalfOf || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(payment.utrNumber || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(payment.invoiceNumber || "")
          .toLowerCase()
          .includes(searchLower);
      const workflowStatus = payment.workflowStatus || payment.status;
      const matchesStatus =
        statusFilter === "All Status" || workflowStatus === statusFilter;
      const matchesDate = withinDateFilter(
        payment.paymentDateValue || payment.submittedAtValue,
        dateFilter,
      );
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, paymentData.payments, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, paymentData.payments.length]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const refreshPaymentRecord = (updatedPayment) => {
    setPaymentData((prev) => {
      const nextPayments = (prev.payments || []).map((payment) =>
        payment.id === updatedPayment.id ? updatedPayment : payment,
      );
      return {
        payments: nextPayments,
        summary: {
          totalPayments: nextPayments.length,
          pendingReview: nextPayments.filter(
            (p) => (p.workflowStatus || p.status) === "Pending",
          ).length,
          sentToManager: nextPayments.filter(
            (p) => (p.workflowStatus || p.status) === "Manager Review",
          ).length,
          verified: nextPayments.filter(
            (p) => (p.workflowStatus || p.status) === "Verified",
          ).length,
          rejected: nextPayments.filter(
            (p) => (p.workflowStatus || p.status) === "Rejected",
          ).length,
          totalAmount: nextPayments.reduce(
            (sum, p) => sum + Number(p.expectedAmount ?? p.amount ?? 0),
            0,
          ),
        },
      };
    });
    setSelectedPayment(updatedPayment);
  };

  const handleDownloadReceipt = async () => {
    if (!selectedPayment?.receiptUrl) {
      setFeedback({
        type: "warning",
        title: "Receipt Missing",
        message:
          "No receipt file is available for this payment submission yet.",
      });
      return;
    }

    try {
      const fileUrl = selectedPayment.receiptUrl;
      const fileName =
        selectedPayment.receiptName ||
        `receipt-${selectedPayment.transactionId || Date.now()}`;

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed, falling back to new tab:", error);
      window.open(selectedPayment.receiptUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handlePreviewReceipt = () => {
    if (!selectedPayment?.receiptUrl) {
      setFeedback({
        type: "warning",
        title: "Receipt Missing",
        message: "No receipt file is available for preview yet.",
      });
      return;
    }

    if (isImageReceipt(selectedPayment)) {
      setOpenReceiptPreview(true);
      return;
    }

    window.open(selectedPayment.receiptUrl, "_blank", "noopener,noreferrer");
  };

  const handleVerify = async ({ remarks = "", reviewTarget = "" } = {}) => {
    if (!selectedPayment || submittingAction) return;
    if (!selectedPaymentComparison.hasReceivedAmount) {
      setFeedback({
        type: "warning",
        title: "Amount Missing",
        message:
          "Agent must submit the transferred amount before finance can verify this payment.",
      });
      return;
    }
    if (!selectedPaymentComparison.isMatched && !isPartialPayment) {
      setFeedback({
        type: "warning",
        title: isExcessPayment ? "Excess Amount" : "Amount Mismatch",
        message: isExcessPayment
          ? "Declared payment is higher than the expected invoice amount. Reject or ask for correction before verifying."
          : "Declared payment does not match the expected invoice amount. Reject or ask for correction before verifying.",
      });
      return;
    }
    if (!hasSelectedPaymentContext) {
      setFeedback({
        type: "warning",
        title: "Behalf Details Missing",
        message:
          "Payment on behalf of is required before finance can verify this payment.",
      });
      return;
    }
    try {
      setSubmittingAction(true);
      const { data } = await API.patch(
        `/admin/payment-verifications/${selectedPayment.id}/status`,
        { status: "Verified", reviewRemarks: remarks, reviewTarget },
      );
      refreshPaymentRecord(data?.data);
      setOpenVerifyModal(false);
      const isFinanceMember = user?.role === "finance_partner";
      const sentToManager = isFinanceMember && reviewTarget === "manager";
      setFeedback({
        type: "success",
        title: sentToManager ? "Sent To Manager" : "Payment Verified",
        message: sentToManager
          ? "Your verification remarks have been sent to the finance manager for final approval."
          : isFinanceMember
            ? isPartialPayment
              ? "Partial payment has been verified at team level. Service confirmation workflow can continue."
              : "Payment has been verified at team level and sent forward to the agent."
            : isPartialPayment
              ? "Partial payment proof has been verified. Voucher generation is now available for service confirmations."
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
      const { data } = await API.patch(
        `/admin/payment-verifications/${selectedPayment.id}/status`,
        {
          status: "Rejected",
          rejectionReason: reason,
          rejectionRemarks: remarks,
          rejectionTarget,
        },
      );
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
        message: isFinanceMember
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
    if (!canSendFinalInvoice) {
      setFeedback({
        type: "warning",
        title: "Final Invoice Locked",
        message:
          "Final invoice dispatch unlocks only after the full remaining payment is verified.",
      });
      return;
    }
    if (!selectedPayment.agentEmail) {
      setFeedback({
        type: "warning",
        title: "Agent Email Missing",
        message:
          "This final invoice cannot be sent because the agent email is not available.",
      });
      return;
    }
    try {
      setSendingFinalInvoice(true);
      const { data } = await API.post(
        `/admin/payment-verifications/${selectedPayment.id}/send-final-invoice`,
      );
      refreshPaymentRecord(data?.data);
      setFeedback({
        type: "success",
        title: "Final Invoice Sent",
        message:
          data?.message ||
          "Finance has shared the final invoice with the agent successfully.",
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

  const handleVerifyInstallment = async (installmentIndex) => {
    if (!selectedPayment || verifyingInstallmentIndex !== null) return;

    try {
      setVerifyingInstallmentIndex(installmentIndex);
      const { data } = await API.post(
        `/admin/payment-verifications/${selectedPayment.id}/tracker-installments/${installmentIndex}/verify`,
      );
      refreshPaymentRecord(data?.data);
      setFeedback({
        type: "success",
        title: "Installment Verified",
        message:
          data?.message ||
          `Instalment ${Number(installmentIndex) + 1} verified successfully.`,
      });
    } catch (actionError) {
      setFeedback({
        type: "error",
        title: "Verification Failed",
        message:
          actionError?.response?.data?.message ||
          actionError?.response?.data?.error ||
          "Unable to verify this installment right now.",
      });
    } finally {
      setVerifyingInstallmentIndex(null);
    }
  };

  const handleOpenAgentReceiptModal = (installmentIndex = null) => {
    if (!selectedPayment) return;
    const targetedEntry =
      Number.isInteger(installmentIndex) &&
      Array.isArray(selectedPayment?.paymentTrackerEntries)
        ? selectedPayment.paymentTrackerEntries[installmentIndex] || null
        : null;
    const isInstallmentVerified =
      targetedEntry?.verificationStatus === "Verified" ||
      (targetedEntry === null && isFinalVerified);

    if (!isInstallmentVerified) {
      setFeedback({
        type: "warning",
        title: "Verify Installment First",
        message:
          "The finance team must verify the payment before sending the installment receipt.",
      });
      return;
    }
    setSelectedReceiptInstallmentIndex(
      Number.isInteger(installmentIndex) ? installmentIndex : null,
    );
    setAgentReceiptEmail(
      String(
        selectedPayment.paymentReceiptRecipientEmail ||
          selectedPayment.agentEmail ||
          "",
      ).trim(),
    );
    setAgentReceiptPhone(String(selectedPayment?.agentPhone || "").trim());
    setAgentReceiptChannel("EMAIL");
    setOpenSendAgentReceiptModal(true);
  };

  const handleSendAgentReceipt = async () => {
    if (!selectedPayment || sendingAgentReceipt) return;
    if (agentReceiptChannel === "EMAIL" && !agentReceiptEmail.trim()) {
      setFeedback({
        type: "warning",
        title: "Agent Email Missing",
        message: "Please enter the agent email before sending the receipt.",
      });
      return;
    }
    if (
      agentReceiptChannel === "WHATSAPP" &&
      !normalizeWhatsAppPhoneNumber(agentReceiptPhone)
    ) {
      setFeedback({
        type: "warning",
        title: "WhatsApp Number Missing",
        message:
          "Please enter a valid agent WhatsApp number before sharing the receipt.",
      });
      return;
    }

    let whatsappWindow = null;
    if (agentReceiptChannel === "WHATSAPP" && typeof window !== "undefined") {
      whatsappWindow = window.open("about:blank", "_blank");
      if (whatsappWindow) whatsappWindow.opener = null;
    }

    try {
      setSendingAgentReceipt(true);
      const { data } = await API.post(
        `/admin/payment-verifications/${selectedPayment.id}/send-payment-receipt`,
        {
          dispatchChannel: agentReceiptChannel,
          recipientEmail: agentReceiptEmail.trim(),
          recipientPhone: agentReceiptPhone.trim(),
          ...(selectedReceiptInstallmentIndex !== null
            ? { installmentIndex: selectedReceiptInstallmentIndex }
            : {}),
        },
      );

      const receiptPath = data?.receiptDocument?.filePath || "";
      const receiptUrl = receiptPath ? `${getApiOrigin()}${receiptPath}` : "";
      if (agentReceiptChannel === "PDF" && receiptUrl) {
        await triggerFileDownload(
          receiptUrl,
          data?.receiptDocument?.name || "Agent_Payment_Receipt.pdf",
        );
      }
      if (agentReceiptChannel === "WHATSAPP") {
        const normalizedPhone = normalizeWhatsAppPhoneNumber(agentReceiptPhone);
        const message = data?.dispatch?.whatsappMessage || "";
        if (normalizedPhone && message) {
          const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
          if (whatsappWindow && !whatsappWindow.closed) {
            whatsappWindow.location.href = whatsappUrl;
          } else {
            window.open(whatsappUrl, "_blank", "noopener,noreferrer");
          }
        } else if (whatsappWindow && !whatsappWindow.closed) {
          whatsappWindow.close();
        }
      }

      refreshPaymentRecord(data?.data);
      setOpenSendAgentReceiptModal(false);
      setSelectedReceiptInstallmentIndex(null);
      setFeedback({
        type: "success",
        title:
          agentReceiptChannel === "PDF"
            ? "Receipt Downloaded"
            : agentReceiptChannel === "WHATSAPP"
              ? "WhatsApp Ready"
              : "Receipt Sent",
        message:
          data?.message ||
          "Holiday Circuit payment receipt has been shared successfully.",
      });
    } catch (actionError) {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close();
      }
      setFeedback({
        type: "error",
        title: "Send Failed",
        message:
          actionError?.response?.data?.message ||
          actionError?.response?.data?.error ||
          "Unable to send the payment receipt right now.",
      });
    } finally {
      setSendingAgentReceipt(false);
    }
  };
  const [exportingReport, setExportingReport] = useState(false);

  const handleExportFinanceReport = async () => {
    try {
      setExportingReport(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const items = (paymentData?.payments || []).map((p) => ({
        bookingId: p.bookingReference || p.bookingId || p.id || "",
        agentName: p.agentName || p.customerName || "",
        amount: p.expectedAmount ?? p.amount ?? 0,
        paymentMethod: p.paymentMethod || p.method || "Bank Transfer",
        transactionId: p.utrNumber || p.transactionId || p.utr || "",
        status: p.workflowStatus || p.status || "Pending",
        date: p.paymentDateValue || p.submittedAtValue || p.date || "",
      }));

      // 1. Create report payload for Finance Manager
      const reportPayload = {
        id: `report-pv-${Date.now()}`,
        title: "Payment Verification Finance Report",
        type: "Payment Verification",
        source: "Payment Verification Desk",
        generatedAt: new Date().toLocaleString(),
        totalItems: items.length,
        items,
      };

      // 2. Save report to storage for Finance Manager portal & dispatch event
      try {
        const existingReports = JSON.parse(
          localStorage.getItem("finance_reports_history") || "[]",
        );
        localStorage.setItem(
          "finance_reports_history",
          JSON.stringify([reportPayload, ...existingReports]),
        );
        window.dispatchEvent(new Event("finance-report-submitted"));
      } catch (err) {
        console.warn("Error saving payment verification report:", err);
      }

      setFeedback({
        type: "success",
        title: "Finance Report Exported",
        message: "Report sent to Finance Manager successfully!",
      });
    } catch (error) {
      console.error("Export payment report error:", error);
      setFeedback({
        type: "error",
        title: "Export Failed",
        message:
          "Failed to export Payment Verification report. Please try again.",
      });
    } finally {
      setExportingReport(false);
    }
  };

  return (
    <>
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <PaymentVerificationContent
        selectedPayment={selectedPayment}
        setSelectedPayment={setSelectedPayment}
        selectedWorkflowStatus={selectedWorkflowStatus}
        handleExportFinanceReport={handleExportFinanceReport}
        exportingReport={exportingReport}
        statsData={statsData}
        loading={loading}
        error={error}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        filteredPayments={filteredPayments}
        paginatedPayments={paginatedPayments}
        totalPages={totalPages}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        hasSelectedPaymentContext={hasSelectedPaymentContext}
        selectedPaymentComparison={selectedPaymentComparison}
        isPartialPayment={isPartialPayment}
        isExcessPayment={isExcessPayment}
        isPaymentFullyPaid={isPaymentFullyPaid}
        isFinalVerified={isFinalVerified}
        isFinalRejected={isFinalRejected}
        isAwaitingManager={isAwaitingManager}
        canCurrentUserReview={canCurrentUserReview}
        canVerifySelectedPayment={canVerifySelectedPayment}
        canSendFinalInvoice={canSendFinalInvoice}
        sendingFinalInvoice={sendingFinalInvoice}
        submittingAction={submittingAction}
        handleSendFinalInvoice={handleSendFinalInvoice}
        handleDownloadReceipt={handleDownloadReceipt}
        handlePreviewReceipt={handlePreviewReceipt}
        setOpenVerifyModal={setOpenVerifyModal}
        setOpenRejectModal={setOpenRejectModal}
        setOpenPaymentTrackerModal={setOpenPaymentTrackerModal}
      />

      <AnimatePresence>
        {openPaymentTrackerModal && selectedPayment && (
          <PaymentTrackerModal
            payment={selectedPayment}
            onClose={() => setOpenPaymentTrackerModal(false)}
            onSendAgentReceipt={handleOpenAgentReceiptModal}
            onVerifyInstallment={(index) =>
              setInstallmentToVerifyConfirmIndex(index)
            }
            sendingAgentReceipt={sendingAgentReceipt}
            verifyingInstallmentIndex={verifyingInstallmentIndex}
            canSendAgentReceipt={canSendPaymentReceipt}
            canVerifyInstallments={canVerifyInstallments}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {installmentToVerifyConfirmIndex !== null && selectedPayment && (
          <VerifyInstallmentConfirmationModal
            installmentIndex={installmentToVerifyConfirmIndex}
            payment={selectedPayment}
            submitting={verifyingInstallmentIndex !== null}
            onClose={() => setInstallmentToVerifyConfirmIndex(null)}
            onConfirm={async () => {
              await handleVerifyInstallment(installmentToVerifyConfirmIndex);
              setInstallmentToVerifyConfirmIndex(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openSendAgentReceiptModal && selectedPayment && (
          <SendAgentReceiptModal
            payment={selectedPayment}
            trackerEntry={selectedReceiptTrackerEntry}
            installmentIndex={selectedReceiptInstallmentIndex}
            recipientEmail={agentReceiptEmail}
            recipientPhone={agentReceiptPhone}
            dispatchChannel={agentReceiptChannel}
            onRecipientEmailChange={setAgentReceiptEmail}
            onRecipientPhoneChange={setAgentReceiptPhone}
            onDispatchChannelChange={setAgentReceiptChannel}
            sending={sendingAgentReceipt}
            onClose={() => {
              setOpenSendAgentReceiptModal(false);
              setSelectedReceiptInstallmentIndex(null);
            }}
            onSend={handleSendAgentReceipt}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openVerifyModal && selectedPayment && (
          <ReviewActionModal
            mode="verify"
            payment={selectedPayment}
            submitting={submittingAction}
            userRole={user?.role}
            onClose={() => setOpenVerifyModal(false)}
            onConfirm={handleVerify}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openRejectModal && selectedPayment && (
          <ReviewActionModal
            mode="reject"
            payment={selectedPayment}
            submitting={submittingAction}
            userRole={user?.role}
            onClose={() => setOpenRejectModal(false)}
            onConfirm={handleReject}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openReceiptPreview &&
          selectedPayment?.receiptUrl &&
          isImageReceipt(selectedPayment) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
              onClick={() => setOpenReceiptPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative flex max-h-[90vh] w-full max-w-5xl items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpenReceiptPreview(false)}
                  className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                >
                  <X className="h-5 w-5" />
                </button>
                <img
                  src={selectedPayment.receiptUrl}
                  alt={selectedPayment.receiptName || "Payment Receipt"}
                  className="max-h-[86vh] w-auto max-w-full object-contain"
                />
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
};

export default PaymentVerification;
