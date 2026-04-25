import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  X,
  Shield,
  ChevronDown,
} from 'lucide-react';
import API from '../utils/Api';
import { AnimatePresence, motion } from 'framer-motion';

const rejectionReasons = [
  'Rate Mismatch with System',
  'Incorrect Invoice Amount',
  'Missing Supporting Documents',
  'Invalid or Incomplete Details',
  'Duplicate Invoice Submission',
  'Unauthorized Invoice',
  'Other (Specify via remarks)',
];

const uploadedDocs = [
  { name: 'DMC_Invoice_INV-2024-001.pdf', size: '245 kB' },
  { name: 'Supporting_Documents.pdf', size: '102 kB' },
];

const getNumericAmount = (value) => {
  const cleaned = String(value || '').replace(/[^0-9.]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatRoundedCurrency = (value, currency = 'INR') =>
  `${currency} ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

const formatIntegerInput = (value) => {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  if (!digitsOnly) return '';

  return Number(digitsOnly).toLocaleString('en-IN');
};

const formatRoundedAmount = (value, fallbackCurrency = 'INR') => {
  if (typeof value === 'number') {
    return formatRoundedCurrency(value, fallbackCurrency);
  }

  const amount = getNumericAmount(value);
  const currencyMatch = String(value || '').match(/[A-Za-z]{3}/);
  const currency = currencyMatch?.[0]?.toUpperCase() || fallbackCurrency;

  return formatRoundedCurrency(amount, currency);
};

const bankReferenceKeywords = {
  'HDFC Bank': ['HDFC'],
  'ICICI Bank': ['ICICI'],
  'State Bank of India': ['SBI', 'STATEBANK', 'STATEBANKOFINDIA'],
  'Axis Bank': ['AXIS'],
  'Kotak Bank': ['KOTAK'],
};

const referenceMatchesSelectedBank = (reference, bank) => {
  if (!reference || !bank) return false;

  const normalizedReference = String(reference).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const keywords = bankReferenceKeywords[bank] || [];

  return keywords.some((keyword) => normalizedReference.includes(keyword));
};

const formatDisplayDate = (value) => {
  if (!value) return '';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);

  return parsedDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getFileUrl = (filePath = "") => {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const apiBaseUrl = API.defaults.baseURL || "";
  const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
  return `${serverBaseUrl}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
};

const getFallbackDocumentPath = (document) => {
  const documentName = String(document?.name || "").trim();
  if (!documentName) return "";

  if (documentName.startsWith("DMC_Internal_Invoice_")) {
    return `/uploads/internal-invoices/${documentName}`;
  }

  return "";
};

const getDocumentMeta = (document) => {
  const parts = [document?.size, "Uploaded 2 days ago"].filter(Boolean);
  return parts.join(" | ");
};

const getDisplayDocuments = (invoiceDocuments = [], invoiceId = "") => {
  if (!invoiceDocuments.length) {
    return uploadedDocs.map((doc, index) => ({
      name: index === 0 ? `DMC_Internal_Invoice_${invoiceId || 'INV'}.pdf` : doc.name,
      size: doc.size,
      filePath: "",
    }));
  }

  const generatedInvoiceDocument =
    invoiceDocuments.find((document) => document?.kind === "invoice") ||
    invoiceDocuments.find((document) =>
      String(document?.name || "").startsWith("DMC_Internal_Invoice_"),
    );

  const supportingDocument = invoiceDocuments.find(
    (document) => document?.kind !== "invoice",
  );

  return [
    generatedInvoiceDocument && {
      ...generatedInvoiceDocument,
      name: generatedInvoiceDocument.name || `DMC_Internal_Invoice_${invoiceId || 'INV'}.pdf`,
    },
    supportingDocument && {
      ...supportingDocument,
      name: "Supporting_Documents.pdf",
    },
  ].filter(Boolean);
};

const feedbackConfig = {
  success: {
    icon: CheckCircle,
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    iconWrap: 'bg-white text-emerald-600',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'border-amber-200 bg-amber-50 text-amber-700',
    iconWrap: 'bg-white text-amber-600',
  },
  error: {
    icon: AlertTriangle,
    accent: 'border-rose-200 bg-rose-50 text-rose-700',
    iconWrap: 'bg-white text-rose-600',
  },
};

const RejectInvoiceModal = ({ invoice, onClose, onConfirm }) => {
  const [selectedReason, setSelectedReason] = useState('');

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl bg-white shadow-none"
      >
        <div className="flex items-center gap-3 px-6 pb-4 pt-6">
          <div className="rounded-full bg-red-50 p-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Reject Invoice</h2>
            <p className="mt-0.5 text-xs font-medium text-red-400">{invoice?.id}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option value="">-- Select rejection reason --</option>
                {rejectionReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">Note:</span> DMC will be notified of the rejection
              reason. Ensure accuracy before proceeding.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedReason}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                selectedReason
                  ? 'bg-red-400 text-white hover:bg-red-500'
                  : 'cursor-not-allowed bg-red-100 text-red-300'
              }`}
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const InvoiceDocumentModal = ({ invoice, onClose, onInvoiceUpdated, sidePanelOpen = false }) => {
  if (!invoice) return null;

  const [isOpen, setIsOpen] = useState(true);

  const [utrInput, setUtrInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [sourceBank, setSourceBank] = useState('');
  const [transferAmount, setTransferAmount] = useState(
    invoice.payoutAmount ? formatIntegerInput(Math.round(invoice.payoutAmount)) : "",
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const agreedRate =
    invoice.agreedRate ||
    invoice.opsServicesTotal ||
    'Rs 1,15,000';
  const invoicedAmount =
    invoice.dmcInvoiceAmount ||
    invoice.internalInvoiceServicesTotal ||
    'Rs 1,25,000';
  const taxAmount = invoice.tax || 'Rs 10,000';
  const roundedAgreedRate = formatRoundedAmount(
    invoice.agreedRateValue ?? invoice.opsServicesTotal ?? agreedRate,
  );
  const roundedInvoicedAmount = formatRoundedAmount(
    invoice.dmcInvoiceAmountValue ?? invoice.internalInvoiceServicesTotal ?? invoicedAmount,
  );
  const roundedTaxAmount = formatRoundedAmount(invoice.taxValue ?? invoice.tax ?? taxAmount);
  const ratesMatch =
    (invoice.agreedRateValue ?? getNumericAmount(agreedRate)) ===
    (invoice.dmcInvoiceAmountValue ?? getNumericAmount(invoicedAmount));
  const isPaid = invoice.status === 'Paid';
  const expectedPayoutAmount = Number(invoice.amountValue || getNumericAmount(invoice.amount) || 0);
  const roundedExpectedPayoutAmount = Math.round(expectedPayoutAmount);
  const transferAmountValue = Math.round(getNumericAmount(transferAmount));
  const payoutAmountMatches =
    transferAmount !== "" &&
    transferAmountValue === roundedExpectedPayoutAmount;
  const bankReferenceMatched = referenceMatchesSelectedBank(utrInput, sourceBank);
  const payoutReferenceDetailsComplete = Boolean(utrInput && dateInput && sourceBank);
  const payoutDetailsComplete = payoutReferenceDetailsComplete && bankReferenceMatched;

  const bankOptions = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank'];
  const documentList = getDisplayDocuments(invoice.documents || [], invoice.id);
  const settledAmount = formatRoundedAmount(
    invoice.payoutAmount || invoice.amountValue || invoice.amount || expectedPayoutAmount,
  );
  const settledDate = formatDisplayDate(invoice.payoutDateValue || invoice.payoutDate);

  const handleClose = () => {
    setIsOpen(false);
    window.setTimeout(() => {
      onClose?.();
    }, 240);
  };

  useEffect(() => {
    if (!feedback) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, feedback.type === 'error' ? 4500 : 3200);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const showFeedback = (type, title, message) => {
    setFeedback({ type, title, message });
  };

  const handleReject = () => setShowRejectModal(true);

  const handleDownloadDocument = (document) => {
    const fileUrl = getFileUrl(document?.filePath || getFallbackDocumentPath(document));
    if (!fileUrl) {
      showFeedback('warning', 'Document Not Ready', 'This file is not available for download yet.');
      return;
    }

    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRejectConfirm = async (reason) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { data } = await API.patch(`/admin/internal-invoices/${invoice._id}/status`, {
        status: 'Rejected',
        reason,
      });

      onInvoiceUpdated?.(data?.data);
      setShowRejectModal(false);
      showFeedback(
        'warning',
        'Invoice Rejected',
        'Finance rejected this invoice and the DMC has been notified.',
      );
      window.setTimeout(() => {
        handleClose();
      }, 1100);
    } catch (error) {
      showFeedback(
        'error',
        'Unable To Reject',
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Failed to reject invoice',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!payoutDetailsComplete) {
      showFeedback(
        'warning',
        'Payout Details Incomplete',
        'Add payout reference, transfer date, and a matching bank before confirming.',
      );
      return;
    }

    if (!payoutAmountMatches) {
      showFeedback(
        'warning',
        'Amount Check Pending',
        'Transfer amount should match the displayed invoice total before payout is confirmed.',
      );
      return;
    }

    if (!ratesMatch) {
      showFeedback(
        'warning',
        'Rate Validation Failed',
        'Ops total and DMC invoice total should match before finance settles the payout.',
      );
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { data } = await API.patch(`/admin/internal-invoices/${invoice._id}/status`, {
        status: 'Paid',
        payoutReference: utrInput,
        payoutDate: dateInput,
        payoutBank: sourceBank,
        payoutAmount: transferAmountValue,
      });

      onInvoiceUpdated?.(data?.data);
      showFeedback(
        'success',
        'Payout Recorded',
        `Finance marked this invoice as paid for ${formatRoundedAmount(transferAmountValue)}.`,
      );
    } catch (error) {
      showFeedback(
        'error',
        'Unable To Confirm Payout',
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Failed to confirm payout',
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`fixed inset-0 flex items-center justify-center overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-[1px] sm:p-4 ${
            sidePanelOpen ? "z-[65] lg:pr-[352px]" : "z-50"
          }`}
        >
      {feedback && (
        <div className="pointer-events-none fixed right-4 top-4 z-[70] w-full max-w-[320px] sm:right-6 sm:top-6">
          <div
            className={`pointer-events-auto rounded-2xl border px-3 py-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-sm ${feedbackConfig[feedback.type]?.accent || feedbackConfig.success.accent}`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`mt-0.5 rounded-full p-1.5 ${feedbackConfig[feedback.type]?.iconWrap || feedbackConfig.success.iconWrap}`}>
                {React.createElement(
                  feedbackConfig[feedback.type]?.icon || feedbackConfig.success.icon,
                  { className: 'h-3.5 w-3.5' },
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                  {feedback.title}
                </p>
                <p className="mt-1 text-[10px] leading-4 opacity-90">{feedback.message}</p>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="rounded-full p-1 text-current/60 transition-colors hover:bg-white/60 hover:text-current"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="relative my-auto flex max-h-[calc(100vh-24px)] w-full max-w-[460px] flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-32px)]"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[12px] font-semibold text-slate-900">Internal Invoice View</h2>
              {isPaid && (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  Paid
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[9px] text-slate-400">
              {invoice.id} | {invoice.ref}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="custom-scroll flex-1 space-y-3 overflow-y-auto px-3 py-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="mb-2.5 flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Rate Validation / Match
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-emerald-100 bg-white p-2">
                <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Ops Selected Services Total
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />
                  <span className="text-[16px] font-bold leading-none text-emerald-600">
                    {roundedAgreedRate}
                  </span>
                </div>
                <p className="mt-1 text-[8px] text-slate-400">
                  Total of the services selected by ops in the quotation
                </p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-white p-2">
                <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  DMC Internal Invoice Services Total
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {ratesMatch ? (
                    <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                  )}
                  <span className="text-[16px] font-bold leading-none text-emerald-600">
                    {roundedInvoicedAmount}
                  </span>
                </div>
                <p className="mt-1 text-[8px] text-slate-400">
                  Total of DMC service prices. Invoice tax shown separately: {roundedTaxAmount}
                </p>
              </div>
            </div>

            <div className={`mt-2 rounded-lg border px-2.5 py-2 ${
              ratesMatch
                ? 'border-emerald-200 bg-white/80'
                : 'border-amber-200 bg-amber-50'
            }`}>
              <p className={`text-[8px] leading-4 ${
                ratesMatch ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {ratesMatch
                  ? 'Both service totals match, so finance can continue with verification and payout processing.'
                  : 'Service totals do not match. Finance should reject the invoice or review the reason before moving ahead. Rejection will notify the DMC on their dashboard bell icon.'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h3 className="mb-2 text-[9px] font-semibold text-slate-700">Payment Details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="text-[8px] text-slate-400">Party Name</p>
                <p className="truncate text-[10px] font-semibold text-slate-700">{invoice.party}</p>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[8px] text-slate-400">Invoice Number</p>
                <p className="truncate text-[10px] font-semibold text-slate-700">{invoice.id}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] text-slate-400">Due Date</p>
                <p className="text-[10px] font-semibold text-slate-700">{invoice.date}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2">
              <h3 className="text-[9px] font-semibold text-slate-700">Uploaded Documents</h3>
              <p className="mt-0.5 text-[8px] text-slate-400">
                DMC uploaded internal invoice files. Finance team can download and verify them here.
              </p>
            </div>
            <div className="space-y-2">
              {documentList.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-medium text-slate-700">{doc.name}</p>
                      <p className="text-[8px] text-slate-400">{getDocumentMeta(doc)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[8px] font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    <Download className="h-2.5 w-2.5" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          {isPaid ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2.5 flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Payout Completed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
                  <p className="text-[8px] text-slate-400">Settled Amount</p>
                  <p className="mt-1 text-[10px] font-bold text-emerald-700">{settledAmount}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
                  <p className="text-[8px] text-slate-400">Source Bank</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-700">
                    {invoice.payoutBank || 'Recorded'}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
                  <p className="text-[8px] text-slate-400">Payout Reference</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-700">
                    {invoice.payoutReference || 'Recorded'}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
                  <p className="text-[8px] text-slate-400">Settled On</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-700">
                    {settledDate || 'Recorded'}
                  </p>
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-emerald-100 bg-white/90 px-2.5 py-2">
                <p className="text-[8px] leading-4 text-emerald-700">
                  This invoice has already been settled by finance. The payout has been recorded,
                  and the DMC has been notified of the completed payment status.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
              <div className="mb-2.5 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-sky-600" />
                <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-sky-700">
                  Record Company Payout
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-[8px] font-semibold text-slate-500">
                    UTR/Reference Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter UTR or transaction reference number"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    className="h-8 w-full rounded-lg border border-sky-100 bg-white px-2.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-300 focus:border-sky-300"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[8px] font-semibold text-slate-500">
                    Transfer Amount *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter transfer amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(formatIntegerInput(e.target.value))}
                    className="h-8 w-full rounded-lg border border-sky-100 bg-white px-2.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-300 focus:border-sky-300"
                  />
                  <p className="mt-1 text-[8px] text-slate-400">
                    Expected: {formatRoundedAmount(invoice.amountValue ?? invoice.amount ?? expectedPayoutAmount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[8px] font-semibold text-slate-500">
                      Date of Transfer *
                    </label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="h-8 w-full rounded-lg border border-sky-100 bg-white px-2.5 text-[10px] text-slate-700 outline-none focus:border-sky-300"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[8px] font-semibold text-slate-500">
                      Source Bank *
                    </label>
                    <div className="relative">
                      <select
                        value={sourceBank}
                        onChange={(e) => setSourceBank(e.target.value)}
                        className="h-8 w-full appearance-none rounded-lg border border-sky-100 bg-white px-2.5 pr-7 text-[10px] text-slate-700 outline-none focus:border-sky-300"
                      >
                        <option value="">Select Bank</option>
                        {bankOptions.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-sky-100 bg-white/80 px-2.5 py-2">
                  <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Verification Checklist
                  </p>
                  <div className="space-y-1">
                    <div className={`flex items-center justify-between text-[8px] ${ratesMatch ? "text-emerald-700" : "text-amber-700"}`}>
                      <span>Rate validation matched</span>
                      <span>{ratesMatch ? "Pass" : "Check"}</span>
                    </div>
                    <div className={`flex items-center justify-between text-[8px] ${payoutAmountMatches ? "text-emerald-700" : "text-amber-700"}`}>
                      <span>Transfer amount matches invoice total</span>
                      <span>{payoutAmountMatches ? "Pass" : "Check"}</span>
                    </div>
                    <div className={`flex items-center justify-between text-[8px] ${payoutDetailsComplete ? "text-emerald-700" : "text-amber-700"}`}>
                      <span>Payout reference, date and bank entered</span>
                      <span>{payoutDetailsComplete ? "Pass" : "Pending"}</span>
                    </div>
                  </div>
                  {!bankReferenceMatched && payoutReferenceDetailsComplete && (
                    <p className="mt-1 text-[8px] leading-4 text-amber-700">
                      Selected bank should match the bank name/code present in the payout reference.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-sky-100 bg-white/80 px-2.5 py-2">
                  <p className="text-[8px] leading-4 text-slate-500">
                    Important: Ensure all details match the actual bank transaction before
                    confirming payout.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {isPaid ? (
          <div className="border-t border-slate-100 px-3 py-3">
            <div className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
              <CheckCircle className="h-3 w-3" />
              Invoice Settled & Paid
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-3 py-3">
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white text-[10px] font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              <X className="h-3 w-3" />
              Reject Invoice
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || !ratesMatch || !payoutAmountMatches || !payoutDetailsComplete}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-[10px] font-semibold text-white transition-colors ${
                isSubmitting || !ratesMatch || !payoutAmountMatches || !payoutDetailsComplete
                  ? "cursor-not-allowed bg-emerald-200"
                  : "bg-emerald-400 hover:bg-emerald-500"
              }`}
            >
              <CheckCircle className="h-3 w-3" />
              {isSubmitting ? 'Processing...' : 'Confirm Payout & Settle'}
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showRejectModal && (
          <RejectInvoiceModal
            invoice={invoice}
            onClose={() => setShowRejectModal(false)}
            onConfirm={handleRejectConfirm}
          />
        )}
      </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceDocumentModal;
