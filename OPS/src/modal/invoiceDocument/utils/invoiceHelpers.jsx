import React from 'react';
import { Mail, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import API from '../../../utils/Api';

export const rejectionReasons = [
  'Rate Mismatch with System',
  'Incorrect Invoice Amount',
  'Missing Supporting Documents',
  'Invalid or Incomplete Details',
  'Duplicate Invoice Submission',
  'Unauthorized Invoice',
  'Other (Specify via remarks)',
];

export const uploadedDocs = [
  { name: 'DMC_Invoice_INV-2024-001.pdf', size: '245 kB' },
  { name: 'Supporting_Documents.pdf', size: '102 kB' },
];

export const BANK_LOGOS = {
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

export const getNumericAmount = (value) => {
  const cleaned = String(value || '').replace(/[^0-9.]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getCurrencySymbol = (currency) => {
  const cur = String(currency || '').trim().toUpperCase();
  if (cur === 'INR') return '₹';
  if (cur === 'USD') return '$';
  if (cur === 'EUR') return '€';
  if (cur === 'GBP') return '£';
  if (cur === 'THB') return '฿';
  return cur;
};

export const formatRoundedCurrency = (value, currency = 'INR') =>
  `${getCurrencySymbol(currency)} ${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

export const formatIntegerInput = (value) => {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  if (!digitsOnly) return '';
  return Number(digitsOnly).toLocaleString('en-IN');
};

export const formatRoundedAmount = (value, fallbackCurrency = 'INR') => {
  if (typeof value === 'number') {
    return formatRoundedCurrency(value, fallbackCurrency);
  }

  const amount = getNumericAmount(value);
  const currencyMatch = String(value || '').match(/[A-Za-z]{3}/);
  const currency = currencyMatch?.[0]?.toUpperCase() || fallbackCurrency;

  return formatRoundedCurrency(amount, currency);
};

export const roundCurrencyValue = (value) => Math.round(Number(value || 0));

export const amountsMatch = (left, right) =>
  roundCurrencyValue(left) === roundCurrencyValue(right);

export const getItemSubtotal = (item = {}) => {
  const subtotal = Number(item.subtotal ?? item.total ?? item.amount);
  if (Number.isFinite(subtotal) && subtotal > 0) return subtotal;
  const qty = Number(item.qty ?? item.quantity ?? 1);
  const rate = Number(item.rate ?? item.price ?? item.cost ?? 0);
  return qty * rate;
};

export const getInvoiceTaxConfig = (invoice = {}) => {
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

export const getExpectedInvoiceSummary = (invoice = {}) => {
  const fallbackSummary = invoice.summary || {};
  if (invoice.invoiceSource === "uploaded_invoice") {
    const totalTax = Number(fallbackSummary.totalTax ?? 0);
    const subtotal = Number(fallbackSummary.subtotal ?? 0);
    return {
      subtotal,
      gstAmount: Number(fallbackSummary.gstAmount ?? 0),
      tcsAmount: Number(fallbackSummary.tcsAmount ?? 0),
      otherTaxAmount: Number(fallbackSummary.otherTaxAmount ?? totalTax ?? 0),
      totalTax,
      grandTotal: Number(fallbackSummary.grandTotal ?? subtotal + totalTax ?? 0),
    };
  }

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const taxConfig = getInvoiceTaxConfig(invoice);
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

export const getUploadedInvoiceSummary = (invoice = {}) => {
  const isUploaded = invoice.invoiceSource === "uploaded_invoice";
  const claimedSummary = invoice.claimedSummary || {};

  if (!isUploaded) {
    return {
      subtotal: Number(invoice.summary?.subtotal ?? invoice.dmcInvoiceAmountValue ?? 0),
      taxAmount: Number(invoice.summary?.totalTax ?? invoice.taxValue ?? 0),
      grandTotal: Number(invoice.summary?.grandTotal ?? invoice.amountValue ?? 0),
    };
  }

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

export const bankReferenceKeywords = {
  'HDFC Bank': ['HDFC'],
  'ICICI Bank': ['ICICI'],
  'State Bank of India': ['SBI', 'STATEBANK', 'STATEBANKOFINDIA'],
  'Axis Bank': ['AXIS'],
  'Kotak Bank': ['KOTAK'],
};

export const referenceMatchesSelectedBank = (reference, bank) => {
  if (!reference || !bank) return false;
  const normalizedReference = String(reference).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const keywords = bankReferenceKeywords[bank] || [];
  return keywords.some((keyword) => normalizedReference.includes(keyword));
};

export const formatDisplayDate = (value) => {
  if (!value) return '';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);

  return parsedDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getFileUrl = (filePath = "") => {
  if (!filePath) return "";
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const apiBaseUrl = API.defaults.baseURL || "";
  const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
  return `${serverBaseUrl}${filePath.startsWith("/") ? filePath : `/${filePath}`}`;
};

export const getFallbackDocumentPath = (document) => {
  const documentName = String(document?.name || "").trim();
  if (!documentName) return "";

  if (documentName.startsWith("DMC_Internal_Invoice_")) {
    return `/uploads/internal-invoices/${documentName}`;
  }

  return "";
};

export const getDocumentMeta = (document) => {
  const parts = [document?.size, "Uploaded 2 days ago"].filter(Boolean);
  return parts.join(" | ");
};

export const getDisplayDocuments = (invoiceDocuments = [], invoiceId = "") => {
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

export const payoutDispatchOptions = [
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

export const normalizeWhatsAppPhoneNumber = (value = "") => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const triggerFileDownload = async (fileUrl, fileName = 'document.pdf') => {
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

export const feedbackConfig = {
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
