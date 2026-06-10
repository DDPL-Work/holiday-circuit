import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Mail,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  X,
  Shield,
  ChevronDown,
  XCircle,
  Check,
  AlertCircle,
  Info,
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

const BANK_LOGOS = {
  'HDFC Bank': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-blue-900/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" fill="#004C8F" />
      <rect x="3" y="3" width="5" height="5" fill="#E31E24" />
      <rect x="16" y="3" width="5" height="5" fill="#E31E24" />
      <rect x="3" y="16" width="5" height="5" fill="#E31E24" />
      <rect x="16" y="16" width="5" height="5" fill="#E31E24" />
      <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
    </svg>
  ),
  'ICICI Bank': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-full border border-orange-500/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#F58220" />
      <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM10.5 7H13.5V9H10.5V7ZM10.5 10.5H13.5V17H10.5V10.5Z" fill="#7A1C1C" />
    </svg>
  ),
  'State Bank of India': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-full border border-sky-600/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#00B3E3" />
      <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
      <rect x="11" y="12" width="2" height="9" fill="#FFFFFF" />
    </svg>
  ),
  'Axis Bank': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-[2px] border border-red-950/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" fill="#841A41" />
      <path d="M12 4L4 18H8.5L12 11L15.5L18 18H22.5L12 4Z" fill="#FFFFFF" />
      <path d="M12 14.5L10 18H14L12 14.5Z" fill="#841A41" />
    </svg>
  ),
  'Kotak Bank': (
    <svg className="h-3.5 w-3.5 shrink-0 rounded-full border border-red-600/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)]" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#EE1C25" />
      <path d="M8 7H10V11L14 7H16.5L12.5 11.5L17 17H14.5L11 12.8V17H8V7Z" fill="#FFFFFF" />
    </svg>
  ),
};

const getNumericAmount = (value) => {
  const cleaned = String(value || '').replace(/[^0-9.]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCurrencySymbol = (currency) => {
  const cur = String(currency || '').trim().toUpperCase();
  if (cur === 'INR') return '₹';
  if (cur === 'USD') return '$';
  if (cur === 'EUR') return '€';
  if (cur === 'GBP') return '£';
  if (cur === 'THB') return '฿';
  return cur;
};

const formatRoundedCurrency = (value, currency = 'INR') =>
  `${getCurrencySymbol(currency)} ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

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

const roundCurrencyValue = (value) => Math.round(Number(value || 0));

const amountsMatch = (left, right) =>
  roundCurrencyValue(left) === roundCurrencyValue(right);

const getItemSubtotal = (item = {}) => {
  const subtotal = Number(item.subtotal);
  if (Number.isFinite(subtotal)) return subtotal;

  return Number(item.qty || 0) * Number(item.rate || 0);
};

const getInvoiceTaxConfig = (invoice = {}) => {
  const taxConfig = invoice.taxConfig || {};

  return {
    gstRate: Number(taxConfig.gstRate ?? invoice.gstRate ?? 0),
    tcsRate: Number(taxConfig.tcsRate ?? invoice.tcsRate ?? 0),
    otherTax: Number(
      taxConfig.otherTax ??
      taxConfig.otherTaxAmount ??
      invoice.otherTax ??
      invoice.otherTaxAmount ??
      0,
    ),
  };
};

const getExpectedInvoiceSummary = (invoice = {}) => {
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const taxConfig = getInvoiceTaxConfig(invoice);
  const fallbackSummary = invoice.summary || {};
  const fallbackSubtotal = Number(
    fallbackSummary.subtotal ?? invoice.dmcInvoiceAmountValue ?? invoice.agreedRateValue ?? 0,
  );
  const subtotal = items.length
    ? items.reduce((sum, item) => sum + getItemSubtotal(item), 0)
    : fallbackSubtotal;
  const gstRate = Number(taxConfig.gstRate || 0);
  const tcsRate = Number(taxConfig.tcsRate || 0);
  const itemTaxTotal = items.reduce((sum, item) => {
    const itemTax = Number(item.tax);
    const hasItemTax = item.tax !== undefined && item.tax !== null && item.tax !== "";
    return hasItemTax && Number.isFinite(itemTax) ? sum + itemTax : sum;
  }, 0);
  const gstAmount = gstRate > 0
    ? (subtotal * gstRate) / 100
    : itemTaxTotal || Number(fallbackSummary.gstAmount || 0);
  const tcsAmount = (subtotal * tcsRate) / 100;
  const otherTaxAmount = Number(taxConfig.otherTax || 0);
  const totalTax = gstAmount + tcsAmount + otherTaxAmount;

  return {
    subtotal,
    gstAmount,
    tcsAmount,
    otherTaxAmount,
    totalTax,
    grandTotal: subtotal + totalTax,
  };
};

const getUploadedInvoiceSummary = (invoice = {}) => {
  const claimedSummary = invoice.claimedSummary || {};

  return {
    subtotal: Number(
      claimedSummary.subtotal ??
      invoice.summary?.subtotal ??
      invoice.dmcInvoiceAmountValue ??
      0,
    ),
    taxAmount: Number(
      claimedSummary.taxAmount ??
      claimedSummary.totalTax ??
      invoice.summary?.totalTax ??
      invoice.taxValue ??
      0,
    ),
    grandTotal: Number(
      claimedSummary.grandTotal ??
      invoice.summary?.grandTotal ??
      invoice.amountValue ??
      0,
    ),
  };
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

const payoutDispatchOptions = [
  {
    key: "EMAIL",
    label: "Email",
    description: "Send payout receipt directly to the DMC email inbox",
    icon: Mail,
  },
  {
    key: "WHATSAPP",
    label: "WhatsApp",
    description: "Open WhatsApp with the payout receipt link ready to share",
    icon: (props) => (
      <svg viewBox="0 0 24 24" className={props.className} fill="currentColor">
        <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.479 1.332 5.006L2 22l5.127-1.343c1.479.807 3.141 1.231 4.88 1.231 5.506 0 9.988-4.482 9.988-9.988C22.002 6.482 17.518 2 12.012 2zm0 1.636c4.606 0 8.352 3.746 8.352 8.352 0 4.606-3.746 8.352-8.352 8.352-1.579 0-3.082-.442-4.385-1.279l-.315-.203-3.255.854.87-3.176-.222-.352c-.917-1.455-1.402-3.136-1.402-4.847-.001-4.605 3.745-8.351 8.351-8.351zm-2.022 3.148c-.222-.008-.432.091-.564.24-.265.298-.823.948-.823 2.308 0 1.36.988 2.673 1.125 2.859.137.185 1.942 2.964 4.708 4.156.658.284 1.171.453 1.572.58.66.21 1.261.18 1.737.11.53-.08 1.626-.665 1.854-1.275.228-.61.228-1.134.16-1.242-.068-.108-.25-.172-.523-.309-.273-.137-1.625-.802-1.875-.893-.25-.09-.432-.136-.614.137-.182.273-.706.893-.865 1.074-.159.182-.319.205-.592.068-.273-.137-1.15-.424-2.19-1.353-.808-.72-1.354-1.611-1.513-1.884-.159-.273-.017-.42.12-.556.123-.122.273-.319.41-.478.136-.159.182-.273.273-.455.091-.182.045-.341-.023-.478-.068-.136-.614-1.478-.841-2.024-.222-.533-.443-.455-.614-.464z" />
      </svg>
    ),
  },
  {
    key: "PDF",
    label: "PDF Download",
    description: "Download the payout receipt PDF to your system",
    icon: Download,
  },
];

const normalizeWhatsAppPhoneNumber = (value = "") => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const triggerFileDownload = async (fileUrl, fileName = 'document.pdf') => {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
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
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);

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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 backdrop-blur-[5px] p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.975 }}
        transition={{ type: 'spring', damping: 26, stiffness: 240 }}
        className="w-full max-w-[450px] rounded-[24px] bg-white border border-slate-100/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] overflow-hidden relative"
      >
        {/* Top Premium Gradient Line */}
        <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-[#0b1e36] via-[#f43f5e] to-[#be123c]" />

        <div className="flex items-start justify-between border-b border-slate-100 px-6 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-50 p-2 text-rose-500 ring-4 ring-rose-50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] bg-gradient-to-r from-[#0b1e36] to-rose-600 bg-clip-text text-transparent">
                Reject Invoice
              </p>
              <h2 className="mt-1 text-base font-bold text-slate-800 leading-tight">
                Reason for <span className="text-rose-600 underline decoration-rose-400 decoration-2 underline-offset-4">Rejection</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 active:scale-90 animate-none shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Invoice Number
              </label>
              <span className="text-[10px] font-mono font-bold text-rose-500">{invoice?.id}</span>
            </div>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsReasonDropdownOpen(!isReasonDropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-[11px] text-slate-700 outline-none focus:border-rose-400 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {selectedReason ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-bold text-slate-800">{selectedReason}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-medium">-- Select rejection reason --</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isReasonDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isReasonDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90] bg-transparent"
                    onClick={() => setIsReasonDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full z-[100] mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] hide-scrollbar">
                    {rejectionReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setSelectedReason(reason);
                          setIsReasonDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-slate-700 transition-colors hover:bg-rose-50/50 cursor-pointer"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${selectedReason === reason ? "bg-rose-500" : "bg-slate-300"}`} />
                        <span className={selectedReason === reason ? "font-bold text-rose-600" : "font-semibold text-slate-700"}>
                          {reason}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] leading-relaxed text-amber-700">
              <span className="font-bold">Note:</span> DMC will be notified of the rejection
              reason on their dashboard immediately. Please ensure accuracy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedReason}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-sm ${selectedReason
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 hover:shadow-md hover:shadow-red-500/10'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
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

const PayoutDispatchModal = ({
  selectedChannel,
  recipientEmail,
  recipientPhone,
  onSelectChannel,
  onEmailChange,
  onPhoneChange,
  onClose,
  onConfirm,
  isSubmitting,
  dmcName,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
    className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 backdrop-blur-[5px] p-4"
  >
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.975 }}
      transition={{ type: 'spring', damping: 26, stiffness: 240 }}
      className="w-full max-w-[450px] rounded-[24px] bg-white border border-slate-100/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] overflow-hidden relative"
    >
      {/* Top Premium Gradient Line */}
      <div className="absolute top-0 inset-x-0 h-[4px] bg-gradient-to-r from-[#0b1e36] via-[#10b981] to-[#107c41]" />

      <div className="flex items-start justify-between border-b border-slate-100 px-6 pb-4 pt-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] bg-gradient-to-r from-[#0b1e36] to-[#10b981] bg-clip-text text-transparent">
            Send Payout Receipt
          </p>
          <h2 className="mt-1 text-base font-bold text-slate-800 leading-tight">
            Share with <span className="text-slate-900 underline decoration-emerald-400 decoration-2 underline-offset-4">{dmcName || 'DMC Partner'}</span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 px-6 py-5">
        {payoutDispatchOptions.map((option) => {
          const Icon = option.icon;
          const isActive = selectedChannel === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelectChannel(option.key)}
              className={`w-full rounded-xl border px-4 py-2.5 text-left transition-all duration-300 relative group overflow-hidden ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/30 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.12)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 transition-all duration-300 ${
                  isActive
                    ? option.key === 'WHATSAPP'
                      ? 'bg-[#25D366] text-white shadow-sm shadow-[#25D366]/20 rotate-3 scale-105'
                      : 'bg-gradient-to-br from-[#0b1e36] to-[#10b981] text-white shadow-sm shadow-emerald-500/10 rotate-3 scale-105'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className={`text-sm font-bold transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}

        {/* Smooth Slide & Fade for Inputs */}
        <AnimatePresence mode="wait">
          {selectedChannel === 'EMAIL' && (
            <motion.div
              key="email-field"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 mt-1 shadow-[inset_0_1px_2px_rgba(241,245,249,0.5)]">
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.2 h-1.2 rounded-full bg-emerald-500" />
                  DMC Email Address
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="Enter DMC email address"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-950 shadow-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                />
              </div>
            </motion.div>
          )}
          {selectedChannel === 'WHATSAPP' && (
            <motion.div
              key="phone-field"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 mt-1 shadow-[inset_0_1px_2px_rgba(241,245,249,0.5)]">
                <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.2 h-1.2 rounded-full bg-emerald-500" />
                  DMC WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(event) => onPhoneChange(event.target.value)}
                  placeholder="Enter DMC WhatsApp number (e.g. 9876543210)"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-950 shadow-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-5 py-4">
        <button
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className={`inline-flex h-10 items-center justify-center rounded-xl text-xs font-bold text-white transition-all duration-200 active:scale-95 shadow-md ${
            isSubmitting
              ? 'cursor-not-allowed bg-slate-300 shadow-none'
              : 'bg-gradient-to-r from-[#0b1e36] to-[#1d3d63] hover:from-[#132d52] hover:to-[#234b7a] hover:shadow-lg hover:shadow-slate-900/12'
          }`}
        >
          {isSubmitting
            ? 'Processing...'
            : selectedChannel === 'PDF'
            ? 'Confirm & Download'
            : selectedChannel === 'WHATSAPP'
            ? 'Confirm & Open'
            : 'Confirm & Send'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const InvoiceDocumentModal = ({ invoice, onClose, onInvoiceUpdated, sidePanelOpen = false }) => {
  const shouldRender = Boolean(invoice);
  invoice = invoice || {};

  const [isOpen, setIsOpen] = useState(true);

  const [utrInput, setUtrInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [sourceBank, setSourceBank] = useState('');

  const payoutInstallments = invoice.payoutInstallments || [];
  const cumulativePaid = payoutInstallments.reduce(
    (sum, inst) => sum + Number(inst.amount || 0),
    0
  );
  const expectedPayoutAmount = Number(invoice.amountValue || getNumericAmount(invoice.amount) || 0);
  const remainingBalance = Math.max(0, expectedPayoutAmount - cumulativePaid);
  const roundedRemainingBalance = Math.round(remainingBalance);

  const [transferAmount, setTransferAmount] = useState(
    remainingBalance > 0 ? formatIntegerInput(Math.round(remainingBalance)) : ""
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedDispatchChannel, setSelectedDispatchChannel] = useState('EMAIL');
  const [dispatchRecipientEmail, setDispatchRecipientEmail] = useState(invoice.dmcEmail || '');
  const [dispatchRecipientPhone, setDispatchRecipientPhone] = useState(invoice.dmcPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  const [manualChecks, setManualChecks] = useState({
    subtotal: 'pending',
    tax: 'pending',
    grandTotal: 'pending',
    totalCheck: 'pending',
  });

  useEffect(() => {
    setManualChecks({
      subtotal: 'pending',
      tax: 'pending',
      grandTotal: 'pending',
      totalCheck: 'pending',
    });
  }, [invoice?._id]);

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
  const isUploadedInvoice = invoice.invoiceSource === "uploaded_invoice";
  const invoiceExtraction = invoice.invoiceExtraction || {};
  const extractionFields = invoiceExtraction.fields || {};
  const extractionWarnings = invoiceExtraction.verification?.warnings || [];
  const extractionNotes = invoiceExtraction.verification?.notes || [];
  const extractionPassed =
    invoiceExtraction.status === "parsed" &&
    invoiceExtraction.verification?.passed !== false &&
    !extractionWarnings.length;
  const extractionFailed = invoiceExtraction.status === "parsed" && !extractionPassed;
  const expectedSummary = getExpectedInvoiceSummary(invoice);
  const uploadedSummary = getUploadedInvoiceSummary(invoice);
  const getExtractionFieldCheckDetails = (key, label, expectedValue, isAmount = false) => {
    const matched = isAmount 
      ? Number(expectedValue || 0) === 0
        ? amountsMatch(extractionFields[key], 0)
        : Number(extractionFields[key] || 0) > 0 && amountsMatch(extractionFields[key], expectedValue)
      : Boolean(extractionFields[key]);
    
    let primaryValue = extractionFields[key] || "-";
    let secondaryValue = null;

    if (isAmount) {
      primaryValue = formatRoundedAmount(extractionFields[key] || 0, extractionFields.currency || "INR");
      const originalValue = extractionFields.originalAmounts?.[key];
      if (extractionFields.conversionApplied && Number(originalValue || 0) > 0) {
        secondaryValue = `from ${getCurrencySymbol(extractionFields.originalCurrency)} ${Number(originalValue || 0).toLocaleString("en-IN")}`;
      }
    }

    return { key, label, primaryValue, secondaryValue, matched };
  };

  const extractionFieldChecks = [
    {
      key: "invoiceNumber",
      label: "Invoice",
      primaryValue: extractionFields.invoiceNumber || "-",
      secondaryValue: null,
      matched: Boolean(extractionFields.invoiceNumber),
    },
    {
      key: "invoiceDate",
      label: "Date",
      primaryValue: extractionFields.invoiceDate || "-",
      secondaryValue: null,
      matched: Boolean(extractionFields.invoiceDate),
    },
    getExtractionFieldCheckDetails("subtotal", "Subtotal", expectedSummary.subtotal, true),
    getExtractionFieldCheckDetails("taxAmount", "Tax", expectedSummary.totalTax, true),
    getExtractionFieldCheckDetails("grandTotal", "Total", expectedSummary.grandTotal, true),
  ];
  const subtotalMatches = amountsMatch(uploadedSummary.subtotal, expectedSummary.subtotal);
  const taxMatches = amountsMatch(uploadedSummary.taxAmount, expectedSummary.totalTax);
  const grandTotalMatches = amountsMatch(uploadedSummary.grandTotal, expectedSummary.grandTotal);
  const amountValidationRows = [
    {
      key: "subtotal",
      label: "Subtotal",
      uploaded: uploadedSummary.subtotal,
      expected: expectedSummary.subtotal,
      matched: subtotalMatches,
    },
    {
      key: "tax",
      label: "Tax",
      uploaded: uploadedSummary.taxAmount,
      expected: expectedSummary.totalTax,
      matched: taxMatches,
    },
    {
      key: "grandTotal",
      label: "Grand Total",
      uploaded: uploadedSummary.grandTotal,
      expected: expectedSummary.grandTotal,
      matched: grandTotalMatches,
    },
  ];
  const ratesMatch = amountsMatch(
    invoice.agreedRateValue ?? getNumericAmount(agreedRate),
    invoice.dmcInvoiceAmountValue ?? getNumericAmount(invoicedAmount),
  );
  
  const allChecksPassed = !isUploadedInvoice || (
    manualChecks.subtotal === 'pass' &&
    manualChecks.tax === 'pass' &&
    manualChecks.grandTotal === 'pass' &&
    manualChecks.totalCheck === 'pass'
  );

  const financeValidationPassed = ratesMatch && allChecksPassed;

  const manualVerificationStatus = (() => {
    const values = Object.values(manualChecks);
    if (values.every(v => v === 'pass')) return 'pass';
    if (values.includes('fail')) return 'fail';
    return 'pending';
  })();
  const isPaid = invoice.status === 'Paid';
  const transferAmountValue = Math.round(getNumericAmount(transferAmount));
  const payoutAmountMatches =
    transferAmount !== "" &&
    transferAmountValue > 0 &&
    transferAmountValue <= roundedRemainingBalance;
  const bankReferenceMatched = referenceMatchesSelectedBank(utrInput, sourceBank);
  const payoutReferenceDetailsComplete = Boolean(utrInput && dateInput && sourceBank);
  const payoutDetailsComplete = payoutReferenceDetailsComplete && bankReferenceMatched;

  const bankOptions = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank'];
  const documentList = getDisplayDocuments(invoice.documents || [], invoice.id);
  const settledAmount = formatRoundedAmount(cumulativePaid || expectedPayoutAmount);
  const settledDate = formatDisplayDate(invoice.payoutDateValue || invoice.payoutDate);
  const invoiceSourceLabel =
    invoice.invoiceSource === "uploaded_invoice"
      ? "Uploaded by DMC"
      : "Company Template";

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

  if (!shouldRender) return null;

  const showFeedback = (type, title, message) => {
    setFeedback({ type, title, message });
  };

  const handleReject = () => setShowRejectModal(true);

  const handlePreviewDocument = (document) => {
    const fileUrl = getFileUrl(document?.filePath || getFallbackDocumentPath(document));
    if (!fileUrl) {
      showFeedback('warning', 'Document Not Ready', 'This file is not available for preview yet.');
      return;
    }

    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDocument = async (document) => {
    const fileUrl = getFileUrl(document?.filePath || getFallbackDocumentPath(document));
    if (!fileUrl) {
      showFeedback('warning', 'Document Not Ready', 'This file is not available for download yet.');
      return;
    }

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = document?.name || 'internal-invoice-document';
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Internal invoice download failed:', error);
      showFeedback(
        'error',
        'Download Failed',
        'Unable to download this file right now. Please try again.',
      );
    }
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

  const handleDispatchSuccess = async (dispatch = {}, receiptDocument = null) => {
    if (selectedDispatchChannel === 'PDF' && receiptDocument?.filePath) {
      const receiptUrl = getFileUrl(receiptDocument.filePath);
      if (receiptUrl) {
        await triggerFileDownload(receiptUrl, receiptDocument.name || 'DMC_Payout_Receipt.pdf');
      }
    }

    if (selectedDispatchChannel === 'WHATSAPP') {
      const normalizedPhone = normalizeWhatsAppPhoneNumber(
        dispatch?.recipientPhone || dispatchRecipientPhone,
      );
      if (normalizedPhone && dispatch?.whatsappMessage) {
        const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(dispatch.whatsappMessage)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleConfirm = () => {
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

    if (!allChecksPassed) {
      showFeedback(
        'warning',
        'Verification Checklist Pending',
        'Please manually verify and pass all checklist items under Uploaded Amount Check before confirming payout.',
      );
      return;
    }

    setShowDispatchModal(true);
  };

  const handleDispatchConfirm = async () => {
    if (selectedDispatchChannel === 'EMAIL' && !String(dispatchRecipientEmail || '').trim()) {
      showFeedback('warning', 'DMC Email Required', 'Please enter the DMC email before sending the payout receipt.');
      return;
    }

    if (selectedDispatchChannel === 'WHATSAPP' && !normalizeWhatsAppPhoneNumber(dispatchRecipientPhone)) {
      showFeedback('warning', 'DMC WhatsApp Required', 'Please enter the DMC WhatsApp number before sharing the payout receipt.');
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
        dispatchChannel: selectedDispatchChannel,
        dispatchRecipientEmail: selectedDispatchChannel === 'EMAIL' ? dispatchRecipientEmail : '',
        dispatchRecipientPhone: selectedDispatchChannel === 'WHATSAPP' ? dispatchRecipientPhone : '',
      });

      onInvoiceUpdated?.(data?.data);
      setShowDispatchModal(false);
      await handleDispatchSuccess(data?.dispatch, data?.receiptDocument);

      // Reset input fields for the next installment if not fully paid
      const nextRemaining = Math.max(0, expectedPayoutAmount - (cumulativePaid + transferAmountValue));
      if (nextRemaining > 0) {
        setUtrInput('');
        setDateInput('');
        setSourceBank('');
        setTransferAmount(formatIntegerInput(Math.round(nextRemaining)));
      }

      if (data?.dispatch?.status === 'failed') {
        showFeedback(
          'warning',
          'Payout Recorded',
          `Finance recorded this payout for ${formatRoundedAmount(transferAmountValue)}. ${data?.dispatch?.message || 'Receipt dispatch could not be completed.'}`,
        );
        return;
      }

      showFeedback(
        'success',
        'Payout Recorded',
        `Finance recorded this payout for ${formatRoundedAmount(transferAmountValue)}.`,
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
          className={`fixed inset-0 flex items-center justify-center overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-[1px] sm:p-4 ${sidePanelOpen ? "z-[65] lg:pr-[352px]" : "z-50"
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
            className={`relative my-auto flex max-h-[calc(100vh-24px)] w-full max-w-[460px] flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-32px)] ${
              (showDispatchModal || showRejectModal) ? 'hidden' : ''
            }`}
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
                <span className="mt-1 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-blue-700">
                  Invoice Source: {invoiceSourceLabel}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="hide-scrollbar flex-1 space-y-3 overflow-y-auto px-3 py-3">
              <div className={`rounded-xl border p-3 ${financeValidationPassed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
                }`}>
                <div className="mb-2.5 flex items-center gap-1.5">
                  {financeValidationPassed ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  )}
                  <span className={`text-[8px] font-bold uppercase tracking-[0.14em] ${financeValidationPassed ? "text-emerald-700" : "text-amber-700"
                    }`}>
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
                      <span className={`text-[16px] font-bold leading-none ${ratesMatch ? "text-emerald-600" : "text-amber-600"
                        }`}>
                        {roundedInvoicedAmount}
                      </span>
                    </div>
                    <p className="mt-1 text-[8px] text-slate-400">
                      Total of DMC service prices. Invoice tax shown separately: {roundedTaxAmount}
                    </p>
                  </div>
                </div>

                {isUploadedInvoice && (
                  <div className="mt-2 rounded-lg border border-white/70 bg-white/85 px-2.5 py-2">
                    {invoiceExtraction.status ? (
                      <div className={`mb-2 rounded-lg border px-2 py-1.5 ${
                        extractionPassed
                          ? "border-emerald-100 bg-emerald-50/70"
                          : extractionFailed
                            ? "border-rose-100 bg-rose-50/80"
                          : "border-amber-100 bg-amber-50/80"
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[8px] font-bold uppercase tracking-[0.12em] ${
                            extractionPassed
                              ? "text-emerald-700"
                              : extractionFailed
                                ? "text-rose-700"
                                : "text-amber-700"
                          }`}>
                            OCR / PDF Parser
                          </p>
                          <span className="text-[8px] font-bold text-slate-500">
                            {(invoiceExtraction.source || "parser").replace(/_/g, " ")} · {invoiceExtraction.confidence || 0}%
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[8.5px]">
                          {extractionFieldChecks.map((field) => (
                            <div
                              key={field.key}
                              className={`flex flex-col justify-between p-1.5 rounded-lg border shadow-sm transition-all duration-200 cursor-default ${
                                field.key === 'grandTotal' ? 'col-span-2' : ''
                              } ${
                                field.matched 
                                  ? "bg-emerald-500/10 border-emerald-200/50 text-emerald-950" 
                                  : "bg-rose-500/10 border-rose-200/50 text-rose-950"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5 mb-1 opacity-80">
                                <span className="text-[7.5px] font-extrabold uppercase tracking-wider">
                                  {field.label}
                                </span>
                                {field.matched ? (
                                  <CheckCircle size={9} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle size={9} className="text-rose-600 shrink-0" />
                                )}
                              </div>
                              <span className="font-extrabold text-[9px] leading-tight">
                                {field.primaryValue}
                              </span>
                              {field.secondaryValue && (
                                <span className="mt-0.5 text-[7.5px] font-medium text-slate-500/80 leading-normal">
                                  {field.secondaryValue}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {extractionWarnings.length ? (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-200/50 p-2 text-[8px] leading-relaxed text-amber-950 shadow-sm">
                            <AlertCircle size={10} className="mt-0.5 shrink-0 text-amber-600" />
                            <span>{extractionWarnings.join(" ")}</span>
                          </div>
                        ) : null}
                        {extractionNotes.length ? (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-blue-500/10 border border-blue-200/50 p-2 text-[8px] leading-relaxed text-blue-950 shadow-sm">
                            <Info size={10} className="mt-0.5 shrink-0 text-blue-600" />
                            <span>{extractionNotes.join(" ")}</span>
                          </div>
                        ) : null}
                        {invoiceExtraction.error ? (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-500/10 border border-rose-200/50 p-2 text-[8px] leading-relaxed text-rose-950 shadow-sm">
                            <AlertCircle size={10} className="mt-0.5 shrink-0 text-rose-700" />
                            <span>{invoiceExtraction.error}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        Uploaded Amount Check
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[8px] font-bold ${
                        manualVerificationStatus === 'pass'
                          ? "text-emerald-700"
                          : manualVerificationStatus === 'fail'
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`}>
                        {manualVerificationStatus === 'pass' ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>Verified</span>
                          </>
                        ) : manualVerificationStatus === 'fail' ? (
                          <>
                            <XCircle className="h-3 w-3 text-rose-500 shrink-0" />
                            <span>Failed</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                            <span>Pending Verification</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {amountValidationRows.map((row) => (
                        <div
                          key={row.label}
                          className={`grid grid-cols-[84px_1fr_auto] items-center gap-2 text-[8px] ${
                            manualChecks[row.key] === 'pass'
                              ? "text-emerald-700 font-semibold"
                              : manualChecks[row.key] === 'fail'
                              ? "text-rose-600 font-semibold"
                              : "text-slate-500"
                          }`}
                        >
                          <span className="font-semibold">{row.label}</span>
                          <span className="truncate">
                            DMC {formatRoundedAmount(row.uploaded)} / System {formatRoundedAmount(row.expected)}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setManualChecks(prev => ({
                                ...prev,
                                [row.key]: prev[row.key] === 'pass' ? 'pending' : 'pass'
                              }))}
                              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out transform active:scale-75 cursor-pointer ${
                                manualChecks[row.key] === 'pass'
                                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_4px_rgba(16,185,129,0.2)] scale-105 font-bold'
                                  : 'border-slate-200 bg-slate-50/40 text-slate-300 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/20'
                              }`}
                              title="Mark as Pass"
                            >
                              <Check className={`h-2 w-2 stroke-[4.5px] transition-transform duration-200 ${manualChecks[row.key] === 'pass' ? 'scale-110' : 'scale-100'}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualChecks(prev => ({
                                ...prev,
                                [row.key]: prev[row.key] === 'fail' ? 'pending' : 'fail'
                              }))}
                              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out transform active:scale-75 cursor-pointer ${
                                manualChecks[row.key] === 'fail'
                                  ? 'border-rose-500 bg-rose-500 text-white shadow-[0_2px_4px_rgba(244,63,94,0.2)] scale-105 font-bold'
                                  : 'border-slate-200 bg-slate-50/40 text-slate-300 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50/20'
                              }`}
                              title="Mark as Fail"
                            >
                              <X className={`h-2 w-2 stroke-[4.5px] transition-transform duration-200 ${manualChecks[row.key] === 'fail' ? 'scale-110' : 'scale-100'}`} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className={`grid grid-cols-[84px_1fr_auto] items-center gap-2 text-[8px] ${
                        manualChecks.totalCheck === 'pass'
                          ? "text-emerald-700 font-semibold"
                          : manualChecks.totalCheck === 'fail'
                          ? "text-rose-600 font-semibold"
                          : "text-slate-500"
                      }`}>
                        <span className="font-semibold">Total Check</span>
                        <span className="truncate">
                          DMC subtotal + tax = {formatRoundedAmount(uploadedSummary.subtotal + uploadedSummary.taxAmount)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setManualChecks(prev => ({
                              ...prev,
                              totalCheck: prev.totalCheck === 'pass' ? 'pending' : 'pass'
                            }))}
                            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out transform active:scale-75 cursor-pointer ${
                              manualChecks.totalCheck === 'pass'
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_4px_rgba(16,185,129,0.2)] scale-105 font-bold'
                                : 'border-slate-200 bg-slate-50/40 text-slate-300 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/20'
                            }`}
                            title="Mark as Pass"
                          >
                            <Check className={`h-2 w-2 stroke-[4.5px] transition-transform duration-200 ${manualChecks.totalCheck === 'pass' ? 'scale-110' : 'scale-100'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setManualChecks(prev => ({
                              ...prev,
                              totalCheck: prev.totalCheck === 'fail' ? 'pending' : 'fail'
                            }))}
                            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out transform active:scale-75 cursor-pointer ${
                              manualChecks.totalCheck === 'fail'
                                ? 'border-rose-500 bg-rose-500 text-white shadow-[0_2px_4px_rgba(244,63,94,0.2)] scale-105 font-bold'
                                : 'border-slate-200 bg-slate-50/40 text-slate-300 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50/20'
                            }`}
                            title="Mark as Fail"
                          >
                            <X className={`h-2 w-2 stroke-[4.5px] transition-transform duration-200 ${manualChecks.totalCheck === 'fail' ? 'scale-110' : 'scale-100'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`mt-2 rounded-lg border px-2.5 py-2 ${ratesMatch
                    ? allChecksPassed
                      ? 'border-emerald-200 bg-white/80'
                      : 'border-amber-200 bg-white/80'
                    : 'border-amber-200 bg-amber-50'
                  }`}>
                  <p className={`text-[8px] leading-4 ${financeValidationPassed ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                    {financeValidationPassed
                      ? 'Service totals and uploaded invoice amount match, so finance can continue with verification and payout processing.'
                      : ratesMatch
                        ? 'Service total matches, but manual uploaded subtotal, tax, grand total, or total check is pending or failed. Finance must manually verify and pass all checks before payout settlement.'
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
                  <div className="min-w-0 text-right">
                    <p className="text-[8px] text-slate-400">Credit Period</p>
                    <p className="text-[10px] font-semibold text-slate-700">
                      {invoice.creditTermLabel || `${Number(invoice.creditPeriodDays || 7)}-day credit`}
                    </p>
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
                      <div className="ml-2 flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => handlePreviewDocument(doc)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[8px] font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                        >
                          <Eye className="h-2.5 w-2.5" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[8px] font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                        >
                          <Download className="h-2.5 w-2.5" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {payoutInstallments.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-700">DMC Payout Statement</h3>
                    <span className="text-[8px] font-bold text-slate-500">
                      Paid: {formatRoundedAmount(cumulativePaid)} / {formatRoundedAmount(expectedPayoutAmount)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {payoutInstallments.map((inst, index) => (
                      <div
                        key={inst.id || index}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-[9px]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">Installment {index + 1}</span>
                            <span className="text-[8px] text-slate-400">({inst.paymentDate || inst.date})</span>
                          </div>
                          <p className="mt-0.5 truncate text-[8px] text-slate-400">
                            Ref: {inst.utrNumber} | Bank: {inst.bankName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600">
                            {formatRoundedAmount(inst.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                        Remaining Balance: {formatRoundedAmount(remainingBalance)} (Total: {formatRoundedAmount(expectedPayoutAmount)})
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
                          <button
                            type="button"
                            onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                            className="flex h-8 w-full items-center justify-between rounded-lg border border-sky-100 bg-white px-2.5 text-[10px] text-slate-700 outline-none focus:border-sky-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          >
                            <div className="flex items-center gap-2">
                              {sourceBank ? (
                                <>
                                  {BANK_LOGOS[sourceBank]}
                                  <span className="font-semibold text-slate-700">{sourceBank}</span>
                                </>
                              ) : (
                                <span className="text-slate-400 font-medium">Select Bank</span>
                              )}
                            </div>
                            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isBankDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isBankDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-[60] bg-transparent"
                                onClick={() => setIsBankDropdownOpen(false)}
                              />
                              <div className="absolute left-0 right-0 top-full z-[70] mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-slate-100 bg-white p-1 shadow-[0_4px_20px_rgba(15,23,42,0.12)] hide-scrollbar">
                                {bankOptions.map((bank) => (
                                  <button
                                    key={bank}
                                    type="button"
                                    onClick={() => {
                                      setSourceBank(bank);
                                      setIsBankDropdownOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] text-slate-700 transition-colors hover:bg-slate-50"
                                  >
                                    {BANK_LOGOS[bank]}
                                    <span className={sourceBank === bank ? "font-bold text-sky-600" : "font-medium"}>
                                      {bank}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-sky-100 bg-white/80 px-2.5 py-2">
                      <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Verification Checklist
                      </p>
                      <div className="space-y-1">
                        <div className={`flex items-center justify-between text-[8px] ${ratesMatch ? "text-emerald-700" : "text-rose-600"}`}>
                          <span>Rate validation matched</span>
                          <span className={`inline-flex items-center gap-1 font-bold ${ratesMatch ? "text-emerald-600" : "text-rose-500"}`}>
                            {ratesMatch ? (
                              <>
                                <Check className="h-2.5 w-2.5 stroke-[3px]" />
                                <span>Pass</span>
                              </>
                            ) : (
                              <>
                                <X className="h-2.5 w-2.5 stroke-[3px]" />
                                <span>Check</span>
                              </>
                            )}
                          </span>
                        </div>
                        {isUploadedInvoice && (
                          <div className={`flex items-center justify-between text-[8px] ${allChecksPassed ? "text-emerald-700" : "text-rose-600"}`}>
                            <span>Manual Uploaded Amount checks verified</span>
                            <span className={`inline-flex items-center gap-1 font-bold ${allChecksPassed ? "text-emerald-600" : "text-rose-500"}`}>
                              {allChecksPassed ? (
                                <>
                                  <Check className="h-2.5 w-2.5 stroke-[3px]" />
                                  <span>Pass</span>
                                </>
                              ) : (
                                <>
                                  <X className="h-2.5 w-2.5 stroke-[3px]" />
                                  <span>Pending</span>
                                </>
                              )}
                            </span>
                          </div>
                        )}
                        <div className={`flex items-center justify-between text-[8px] ${payoutAmountMatches ? "text-emerald-700" : "text-rose-600"}`}>
                          <span>Transfer amount is within remaining balance</span>
                          <span className={`inline-flex items-center gap-1 font-bold ${payoutAmountMatches ? "text-emerald-600" : "text-rose-500"}`}>
                            {payoutAmountMatches ? (
                              <>
                                <Check className="h-2.5 w-2.5 stroke-[3px]" />
                                <span>Pass</span>
                              </>
                            ) : (
                              <>
                                <X className="h-2.5 w-2.5 stroke-[3px]" />
                                <span>Check</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div className={`flex items-center justify-between text-[8px] ${payoutDetailsComplete ? "text-emerald-700" : "text-rose-600"}`}>
                          <span>Payout reference, date and bank entered</span>
                          <span className={`inline-flex items-center gap-1 font-bold ${payoutDetailsComplete ? "text-emerald-600" : "text-rose-500"}`}>
                            {payoutDetailsComplete ? (
                              <>
                                <Check className="h-2.5 w-2.5 stroke-[3px]" />
                                <span>Pass</span>
                              </>
                            ) : (
                              <>
                                <X className="h-2.5 w-2.5 stroke-[3px]" />
                                <span>Pending</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      {!bankReferenceMatched && payoutReferenceDetailsComplete && (
                        <p className="mt-1 text-[8px] leading-4 text-rose-600">
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
                  disabled={isSubmitting || !financeValidationPassed || !payoutAmountMatches || !payoutDetailsComplete}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-[10px] font-semibold text-white transition-colors ${isSubmitting || !financeValidationPassed || !payoutAmountMatches || !payoutDetailsComplete
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
            {showDispatchModal && (
              <PayoutDispatchModal
                selectedChannel={selectedDispatchChannel}
                recipientEmail={dispatchRecipientEmail}
                recipientPhone={dispatchRecipientPhone}
                onSelectChannel={setSelectedDispatchChannel}
                onEmailChange={setDispatchRecipientEmail}
                onPhoneChange={setDispatchRecipientPhone}
                onClose={() => setShowDispatchModal(false)}
                onConfirm={handleDispatchConfirm}
                isSubmitting={isSubmitting}
                dmcName={invoice.party}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceDocumentModal;
