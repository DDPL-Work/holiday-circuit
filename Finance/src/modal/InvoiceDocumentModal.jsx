import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import API from '../utils/Api';

import {
  getNumericAmount,
  getCurrencySymbol,
  formatRoundedAmount,
  formatIntegerInput,
  amountsMatch,
  getItemSubtotal,
  getExpectedInvoiceSummary,
  getUploadedInvoiceSummary,
  referenceMatchesSelectedBank,
  formatDisplayDate,
  getFileUrl,
  getFallbackDocumentPath,
  getDisplayDocuments,
  normalizeWhatsAppPhoneNumber,
  triggerFileDownload,
  feedbackConfig,
} from './invoiceDocument/utils/invoiceHelpers.jsx';

import RejectInvoiceModal from './invoiceDocument/components/RejectInvoiceModal.jsx';
import PayoutDispatchModal from './invoiceDocument/components/PayoutDispatchModal.jsx';
import RateValidationCard from './invoiceDocument/components/RateValidationCard.jsx';
import PaymentDetailsSection from './invoiceDocument/components/PaymentDetailsSection.jsx';

const InvoiceDocumentModal = ({ invoice, onClose, onInvoiceUpdated, sidePanelOpen = false }) => {
  const shouldRender = Boolean(invoice);
  invoice = invoice || {};

  const [isOpen, setIsOpen] = useState(true);
  const [utrInput, setUtrInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [sourceBank, setSourceBank] = useState('');

  const payoutInstallments =
    Array.isArray(invoice.payoutInstallments) && invoice.payoutInstallments.length > 0
      ? invoice.payoutInstallments
      : Number(invoice.payoutAmount || 0) > 0
        ? [
            {
              amount: Number(invoice.payoutAmount),
              utrNumber: invoice.payoutReference || invoice.utr || "Recorded",
              bankName: invoice.payoutBank || invoice.bank || "Bank Transfer",
              paymentDate: invoice.payoutDate || invoice.date || "Settled",
            },
          ]
        : [];

  const cumulativePaid = payoutInstallments.reduce(
    (sum, inst) => sum + Number(inst.amount || 0),
    0
  );
  const expectedPayoutAmount = Number(invoice.amountValue || getNumericAmount(invoice.amount) || 0);
  const remainingBalance = Math.max(0, expectedPayoutAmount - cumulativePaid);
  const roundedRemainingBalance = Math.round(remainingBalance);

  const invoiceItems = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : Array.isArray(invoice.services) && invoice.services.length > 0
      ? invoice.services
      : [];

  const [selectedItemIndices, setSelectedItemIndices] = useState([]);

  const [transferAmount, setTransferAmount] = useState(
    invoiceItems.length > 0
      ? ""
      : remainingBalance > 0
        ? formatIntegerInput(Math.round(remainingBalance))
        : ""
  );

  const getItemTotal = (item) => getItemSubtotal(item);

  const calculateTransferAmountFromIndices = (indices) => {
    if (!invoiceItems.length) return;
    const subtotal = invoiceItems.reduce((sum, item) => sum + getItemTotal(item), 0) || 1;
    const selectedSubtotal = invoiceItems.reduce(
      (sum, item, idx) => (indices.includes(idx) ? sum + getItemTotal(item) : sum),
      0,
    );
    const expectedSum = getExpectedInvoiceSummary(invoice);
    const ratio = subtotal > 0 ? selectedSubtotal / subtotal : 0;
    const computedTotal = Math.round((expectedSum.grandTotal || remainingBalance) * ratio);
    setTransferAmount(computedTotal > 0 ? formatIntegerInput(computedTotal) : "");
  };

  const handleToggleItem = (index) => {
    setSelectedItemIndices((prev) => {
      const next = prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index];
      calculateTransferAmountFromIndices(next);
      return next;
    });
  };

  const handleSelectAllItems = () => {
    const all = invoiceItems.map((_, idx) => idx);
    setSelectedItemIndices(all);
    calculateTransferAmountFromIndices(all);
  };

  const handleDeselectAllItems = () => {
    setSelectedItemIndices([]);
    setTransferAmount("");
  };

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedDispatchChannel, setSelectedDispatchChannel] = useState('EMAIL');
  const [dispatchRecipientEmail, setDispatchRecipientEmail] = useState(invoice.dmcEmail || '');
  const [dispatchRecipientPhone, setDispatchRecipientPhone] = useState(invoice.dmcPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  const getInitialCheckState = () => {
    const isAlreadyVerified = 
      invoice?.status === 'Partially Paid' || 
      invoice?.status === 'Paid' || 
      invoice?.status === 'Settled' ||
      cumulativePaid > 0;
      
    return {
      subtotal: isAlreadyVerified ? 'pass' : 'pending',
      tax: isAlreadyVerified ? 'pass' : 'pending',
      grandTotal: isAlreadyVerified ? 'pass' : 'pending',
      totalCheck: isAlreadyVerified ? 'pass' : 'pending',
    };
  };

  const [manualChecks, setManualChecks] = useState(() => getInitialCheckState());

  useEffect(() => {
    setManualChecks(getInitialCheckState());
  }, [invoice?._id, invoice?.status]);

  const [showHelpPanel, setShowHelpPanel] = useState(false);

  useEffect(() => {
    setShowHelpPanel(false);
    if (!invoice?._id) return;
    const timer = setTimeout(() => {
      setShowHelpPanel(true);
    }, 1200);
    return () => clearTimeout(timer);
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
  const showManualChecks = isUploadedInvoice || (invoice.documents && invoice.documents.length > 0);
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
  
  const allChecksPassed = !showManualChecks || (
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

  const handleVerifyPass = (key, value, expectedValue, label) => {
    if (manualChecks[key] === 'pass') {
      setManualChecks(prev => ({
        ...prev,
        [key]: 'pending'
      }));
    } else {
      if (Number(value || 0) === 0 || Number(expectedValue || 0) === 0) {
        showFeedback('error', 'Verification Error', `Cannot verify ${label} as Pass because either DMC or System price is 0.`);
        return;
      }
      setManualChecks(prev => ({
        ...prev,
        [key]: 'pass'
      }));
    }
  };

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
      await triggerFileDownload(fileUrl, document?.name || 'internal-invoice-document');
    } catch (error) {
      console.error('Internal invoice download failed:', error);
      showFeedback('error', 'Download Failed', 'Unable to download this file right now. Please try again.');
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
          className={`fixed inset-0 flex items-center justify-center overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-[1px] sm:p-4 ${
            sidePanelOpen ? "z-[65] lg:pr-[352px]" : "z-50"
          }`}
        >
          {feedback && (
            <div className="pointer-events-none fixed right-4 top-4 z-[70] w-full max-w-[320px] sm:right-6 sm:top-6">
              <div
                className={`pointer-events-auto rounded-2xl border px-3 py-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-sm ${
                  feedbackConfig[feedback.type]?.accent || feedbackConfig.success.accent
                }`}
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
                    className="rounded-full p-1 text-current/60 transition-colors hover:bg-white/60 hover:text-current cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative my-auto">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className={`relative my-auto flex max-h-[calc(100vh-24px)] w-full max-w-[490px] flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] sm:max-h-[calc(100vh-32px)] ${
                (showDispatchModal || showRejectModal) ? 'hidden' : ''
              }`}
            >
              <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Internal Invoice View</h2>
                    {isPaid && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[10.5px] text-slate-500 font-medium">
                    {invoice.id} | {invoice.ref}
                  </p>
                  <span className="mt-1 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-700">
                    Invoice Source: {invoiceSourceLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setShowHelpPanel(!showHelpPanel)}
                    className={`rounded-full p-1 transition-colors cursor-pointer ${
                      showHelpPanel ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                    title="Toggle Process Guidelines"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="hide-scrollbar flex-1 space-y-3 overflow-y-auto px-3.5 py-3.5">
                <RateValidationCard
                  financeValidationPassed={financeValidationPassed}
                  roundedAgreedRate={roundedAgreedRate}
                  roundedInvoicedAmount={roundedInvoicedAmount}
                  ratesMatch={ratesMatch}
                  roundedTaxAmount={roundedTaxAmount}
                  showManualChecks={showManualChecks}
                  invoiceExtraction={invoiceExtraction}
                  extractionPassed={extractionPassed}
                  extractionFailed={extractionFailed}
                  extractionFieldChecks={extractionFieldChecks}
                  extractionWarnings={extractionWarnings}
                  extractionNotes={extractionNotes}
                  manualVerificationStatus={manualVerificationStatus}
                  amountValidationRows={amountValidationRows}
                  manualChecks={manualChecks}
                  setManualChecks={setManualChecks}
                  handleVerifyPass={handleVerifyPass}
                  uploadedSummary={uploadedSummary}
                  expectedSummary={expectedSummary}
                  allChecksPassed={allChecksPassed}
                />

                <PaymentDetailsSection
                  invoice={invoice}
                  documentList={documentList}
                  handlePreviewDocument={handlePreviewDocument}
                  handleDownloadDocument={handleDownloadDocument}
                  payoutInstallments={payoutInstallments}
                  cumulativePaid={cumulativePaid}
                  expectedPayoutAmount={expectedPayoutAmount}
                  isPaid={isPaid}
                  settledAmount={settledAmount}
                  settledDate={settledDate}
                  remainingBalance={remainingBalance}
                  roundedRemainingBalance={roundedRemainingBalance}
                  utrInput={utrInput}
                  setUtrInput={setUtrInput}
                  dateInput={dateInput}
                  setDateInput={setDateInput}
                  sourceBank={sourceBank}
                  setSourceBank={setSourceBank}
                  bankOptions={bankOptions}
                  bankReferenceMatched={bankReferenceMatched}
                  payoutReferenceDetailsComplete={payoutReferenceDetailsComplete}
                  payoutDetailsComplete={payoutDetailsComplete}
                  transferAmount={transferAmount}
                  setTransferAmount={setTransferAmount}
                  formatIntegerInput={formatIntegerInput}
                  payoutAmountMatches={payoutAmountMatches}
                  isBankDropdownOpen={isBankDropdownOpen}
                  setIsBankDropdownOpen={setIsBankDropdownOpen}
                  ratesMatch={ratesMatch}
                  allChecksPassed={allChecksPassed}
                  handleReject={handleReject}
                  handleConfirm={handleConfirm}
                  isSubmitting={isSubmitting}
                  invoiceItems={invoiceItems}
                  selectedItemIndices={selectedItemIndices}
                  handleToggleItem={handleToggleItem}
                  handleSelectAllItems={handleSelectAllItems}
                  handleDeselectAllItems={handleDeselectAllItems}
                />
              </div>
            </motion.div>

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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceDocumentModal;
