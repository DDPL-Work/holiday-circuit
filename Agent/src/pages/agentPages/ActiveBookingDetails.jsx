import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API from "../../utils/Api";
import CouponBillingModal from "../../modal/CouponBillingModal";
import ServicesBookingsTab from "../../components/ServicesBookingsTab";
import CreateProformaInvoice from "../../components/accounting/CreateProformaInvoice";

import {
  MAX_UPLOAD_SIZE_BYTES,
  docOptions,
  formatCurrency,
  formatDateRange,
  formatPax,
  getTripDuration,
  buildTrackerPaymentsFromSubmission,
  resolveDocs,
  getDocumentTypeMismatchMessage,
  getOpsPayableAmountFromInvoice,
  isValidPaymentTrackerEntry,
  isIndianDestination,
  getRequiredDocumentKeys,
  normalizeReceipt,
} from "./activeBookingDetails/utils/bookingDetailsHelpers";

import { BookingHeaderCard } from "./activeBookingDetails/components/BookingHeaderCard";
import { BookingTabNavigation } from "./activeBookingDetails/components/BookingTabNavigation";
import { BasicDetailsTab } from "./activeBookingDetails/components/BasicDetailsTab";
import { InternalInvoiceTab } from "./activeBookingDetails/components/InternalInvoiceTab";
import { AccountingTab } from "./activeBookingDetails/components/AccountingTab";
import { TravelerDocsDeskTab } from "./activeBookingDetails/components/TravelerDocsDeskTab";
import { SubmitDocsConfirmModal } from "./activeBookingDetails/components/Modals/SubmitDocsConfirmModal";
import { ToastNotification } from "./activeBookingDetails/components/ToastNotification";

export default function ActiveBookingDetails({
  onClose,
  booking,
  onBookingUpdated,
  documentPortalContext,
  initialTab,
  isPaymentDesk = false,
  currentUser,
}) {
  const isTravelerDocsDesk =
    Boolean(documentPortalContext?.documentsOnly) ||
    initialTab === "documents" ||
    initialTab === "docs" ||
    (typeof window !== "undefined" && window.location.pathname.includes("/agent/documents"));
  const defaultTab = initialTab || (documentPortalContext?.documentsOnly ? "docs" : isTravelerDocsDesk ? "docs" : "accounting");
  const [detailTab, setDetailTab] = useState(defaultTab === "documents" ? "docs" : defaultTab === "payments" ? "accounting" : defaultTab);
  const [accountingSubTab, setAccountingSubTab] = useState("payments");
  const [isCreatingProforma, setIsCreatingProforma] = useState(false);
  const [proformaInvoiceData, setProformaInvoiceData] = useState(null);
  const activeTab = detailTab === "docs" ? "documents" : "payments";
  
  const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } };

  const paymentSubmission = useMemo(() => booking?.paymentSubmission || {}, [booking?.paymentSubmission]);
  const paymentVerification = booking?.paymentVerification || {};
  const travelerVerification = booking?.travelerDocumentVerification || { status: "Draft" };
  const invoiceId = booking?.invoiceId || booking?.invoice?._id || "";
  const queryId = booking?._id || booking?.query?._id || "";
  const currency = booking?.currency || booking?.invoice?.currency || "INR";
  const paymentStatus = paymentVerification?.status || (paymentSubmission?.submittedAt ? "Pending" : "Draft");
  const isRejectedPayment = paymentStatus === "Rejected";
  const isPaymentVerified = paymentStatus === "Verified" || booking?.paymentStatus === "Paid";
  const currentReceipt = isRejectedPayment || paymentSubmission?.submittedAt ? {} : paymentSubmission?.receipt || {};
  const docsUnlocked = true;

  const headerBookingId = booking?.queryId || booking?.bookingReference || booking?.invoiceNumber || booking?.query?.queryId || "Record";
  const headerClientName = booking?.customerName || booking?.clientName || booking?.query?.clientName || booking?.travelerDetails?.[0]?.fullName || "Lead Client";
  const headerDestination = booking?.destination || booking?.query?.destination || "Destination";
  const headerTravelDates = booking?.dates || booking?.travelDates || (booking?.startDate && booking?.endDate ? formatDateRange(booking.startDate, booking.endDate) : "Dates Pending");
  const headerAdultCount = Number(booking?.numberOfAdults || booking?.query?.numberOfAdults || 0);
  const headerChildCount = Number(booking?.numberOfChildren || booking?.query?.numberOfChildren || 0);
  const headerPaxSummary = formatPax(headerAdultCount || 1, headerChildCount);
  const headerDuration = getTripDuration(booking?.startDate || booking?.query?.startDate, booking?.endDate || booking?.query?.endDate);
  const headerClientPhone = booking?.clientPhone || booking?.query?.clientPhone || booking?.travelerDetails?.[0]?.phone || "";

  const [feedback, setFeedback] = useState(null);
  const [utrNumber, setUtrNumber] = useState(isRejectedPayment ? "" : paymentSubmission?.utrNumber || "");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [remarks, setRemarks] = useState(isRejectedPayment ? "" : booking?.remarks || "");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [preparingInvoice, setPreparingInvoice] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [removingKey, setRemovingKey] = useState("");
  const [documentUploadErrors, setDocumentUploadErrors] = useState({});
  const [submittingDocs, setSubmittingDocs] = useState(false);
  const [isSubmitDocsConfirmOpen, setIsSubmitDocsConfirmOpen] = useState(false);
  const [payableQuotationAmount, setPayableQuotationAmount] = useState(0);

  // ── Payment tracker state ──
  const [trackerPayments, setTrackerPayments] = useState([]);
  const [trackerIdCounter, setTrackerIdCounter] = useState(1);

  const approvedQuotationAmount = useMemo(() => {
    const opsQuotationAmount = Math.round(Number(booking?.quotation?.pricingTotalAmount || 0));
    if (opsQuotationAmount > 0) return opsQuotationAmount;

    const invoiceOpsAmount = getOpsPayableAmountFromInvoice(booking?.invoice);
    if (invoiceOpsAmount > 0) return invoiceOpsAmount;

    return Math.round(Number(booking?.quotation?.clientTotalAmount || booking?.totalAmount || 0));
  }, [booking?.invoice, booking?.quotation?.clientTotalAmount, booking?.quotation?.pricingTotalAmount, booking?.totalAmount]);

  const travelers = useMemo(() => (Array.isArray(booking?.travelerDetails) ? booking.travelerDetails : []).map((t) => ({ ...t, docs: resolveDocs(t) })), [booking?.travelerDetails]);
  const initialQuotationAmount = useMemo(
    () => Math.round(Number(paymentSubmission?.couponApplication?.payableAmount || approvedQuotationAmount || 0)),
    [approvedQuotationAmount, paymentSubmission?.couponApplication?.payableAmount],
  );
  const expectedPaymentAmount = useMemo(
    () => Math.round(Number(payableQuotationAmount || initialQuotationAmount || 0)),
    [initialQuotationAmount, payableQuotationAmount],
  );
  const validTrackerPayments = useMemo(
    () => trackerPayments.filter((payment) => isValidPaymentTrackerEntry(payment)),
    [trackerPayments],
  );
  const newTrackerPayments = useMemo(
    () => validTrackerPayments.filter((payment) => !payment?.persisted),
    [validTrackerPayments],
  );

  const totalPaidAmount = useMemo(() => {
    if (booking?.paidAmount) return Number(booking.paidAmount);
    return validTrackerPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [booking?.paidAmount, validTrackerPayments]);
  const remainingPaymentAmount = Math.max(0, expectedPaymentAmount - totalPaidAmount);

  const isFullPaymentVerified = useMemo(() => {
    if (!isPaymentVerified) return false;
    if (booking?.paymentStatus === "Paid") return true;
    if (expectedPaymentAmount > 0 && totalPaidAmount >= expectedPaymentAmount) return true;
    return false;
  }, [booking?.paymentStatus, expectedPaymentAmount, isPaymentVerified, totalPaidAmount]);

  const isInternationalTrip = useMemo(() => {
    const explicitQuoteCategory = String(
      booking?.quotation?.quoteCategory || booking?.pricingSnapshot?.quoteCategory || booking?.invoice?.pricingSnapshot?.quoteCategory || "",
    ).trim().toLowerCase();
    if (explicitQuoteCategory === "international") return true;
    if (explicitQuoteCategory === "domestic") return false;
    return Boolean(booking?.destination) && !isIndianDestination(booking.destination);
  }, [booking?.destination, booking?.invoice?.pricingSnapshot?.quoteCategory, booking?.pricingSnapshot?.quoteCategory, booking?.quotation?.quoteCategory]);

  const tripTypeLabel = isInternationalTrip ? "International" : "Domestic";
  const requiredDocKeys = useMemo(() => getRequiredDocumentKeys(isInternationalTrip), [isInternationalTrip]);
  const documentIssues = useMemo(
    () =>
      Array.isArray(documentPortalContext?.issues) && documentPortalContext.issues.length
        ? documentPortalContext.issues
        : Array.isArray(travelerVerification?.issues)
          ? travelerVerification.issues
          : [],
    [documentPortalContext?.issues, travelerVerification?.issues],
  );
  const hasStructuredDocumentIssues = documentIssues.length > 0;
  const verifiedDocuments = useMemo(
    () => Array.isArray(travelerVerification?.verifiedDocuments) ? travelerVerification.verifiedDocuments : [],
    [travelerVerification?.verifiedDocuments],
  );
  const documentIssueTitle = String(travelerVerification?.rejectionReason || "").trim() || "Document corrections requested";
  const documentIssueMessage = String(travelerVerification?.rejectionRemarks || "").trim() || "Operations highlighted this document for correction. Please replace it and submit again.";

  const travelersWithStatus = useMemo(
    () =>
      travelers.map((traveler) => {
        const requiredReadyCount = requiredDocKeys.filter((key) => {
          const hasUrl = Boolean(traveler.docs?.[key]?.url);
          if (!hasUrl) return false;

          const hasIssue = documentIssues.some((issue) => {
            const issueTravelerId = String(issue?.travelerId || "").trim();
            const issueTravelerName = String(issue?.travelerName || "").trim().toLowerCase();
            const issueDocumentKey = String(issue?.documentKey || "").trim();
            const travelerId = String(traveler?._id || "").trim();
            const travelerName = String(traveler?.fullName || "").trim().toLowerCase();
            return issueDocumentKey === key && (
              (issueTravelerId && travelerId && issueTravelerId === travelerId) ||
              (issueTravelerName && travelerName && issueTravelerName === travelerName)
            );
          });
          return !hasIssue;
        }).length;
        const uploadedDocCount = docOptions.filter((option) => Boolean(traveler.docs?.[option.key]?.url)).length;
        const mismatchedDocuments = docOptions
          .map((option) => ({
            key: option.key,
            label: option.label,
            message: getDocumentTypeMismatchMessage(option.key, traveler.docs?.[option.key]),
          }))
          .filter((item) => item.message);
        return {
          ...traveler,
          requiredReadyCount,
          uploadedDocCount,
          mismatchedDocuments,
          isDocDeskComplete: requiredReadyCount === requiredDocKeys.length && mismatchedDocuments.length === 0,
        };
      }),
    [requiredDocKeys, travelers, documentIssues],
  );
  const requiredDocCount = useMemo(
    () => travelersWithStatus.reduce((sum, traveler) => sum + traveler.requiredReadyCount, 0),
    [travelersWithStatus],
  );
  const totalRequiredDocSlots = travelers.length * requiredDocKeys.length;
  const allDocsReady = travelers.length > 0 && travelersWithStatus.every((traveler) => traveler.isDocDeskComplete);
  const documentMismatchRows = useMemo(
    () =>
      travelersWithStatus.flatMap((traveler) =>
        (traveler.mismatchedDocuments || []).map((document) => ({
          travelerName: traveler.fullName || "Traveler",
          documentLabel: document.label,
          message: document.message,
        })),
      ),
    [travelersWithStatus],
  );
  const hasDocumentTypeMismatch = documentMismatchRows.length > 0;
  const docProgress = totalRequiredDocSlots ? Math.round((requiredDocCount / totalRequiredDocSlots) * 100) : 0;

  const travelerIssuesList = useMemo(() => {
    return travelersWithStatus.map((t) => {
      const issues = requiredDocKeys.map((key) => {
        const hasUrl = Boolean(t.docs?.[key]?.url);
        if (!hasUrl) return null;
        const matchedIssue = documentIssues.find((issue) => {
          const issueTravelerId = String(issue?.travelerId || "").trim();
          const issueTravelerName = String(issue?.travelerName || "").trim().toLowerCase();
          const issueDocumentKey = String(issue?.documentKey || "").trim();
          const travelerId = String(t?._id || "").trim();
          const travelerName = String(t?.fullName || "").trim().toLowerCase();
          return issueDocumentKey === key && (
            (issueTravelerId && travelerId && issueTravelerId === travelerId) ||
            (issueTravelerName && travelerName && issueTravelerName === travelerName)
          );
        });
        if (matchedIssue) {
          return key === "passport" ? "Passport" : "PAN Card";
        }
        return null;
      }).filter(Boolean);

      if (issues.length > 0) {
        return {
          name: t.fullName || "Traveler",
          issues: issues.join(", ")
        };
      }
      return null;
    }).filter(Boolean);
  }, [travelersWithStatus, requiredDocKeys, documentIssues]);

  const verifiedRequiredDocumentCount = useMemo(() => {
    if (!verifiedDocuments.length) return 0;

    return travelersWithStatus.reduce((count, traveler) => (
      count + requiredDocKeys.filter((documentKey) => (
        verifiedDocuments.some((verifiedDocument) => {
          const verifiedTravelerId = String(verifiedDocument?.travelerId || "").trim();
          const verifiedTravelerName = String(verifiedDocument?.travelerName || "").trim().toLowerCase();
          const currentTravelerId = String(traveler?._id || "").trim();
          const currentTravelerName = String(traveler?.fullName || "").trim().toLowerCase();

          if (String(verifiedDocument?.documentKey || "").trim() !== documentKey) return false;

          return (
            (verifiedTravelerId && currentTravelerId && verifiedTravelerId === currentTravelerId) ||
            (verifiedTravelerName && currentTravelerName && verifiedTravelerName === currentTravelerName)
          );
        })
      )).length
    ), 0);
  }, [requiredDocKeys, travelersWithStatus, verifiedDocuments]);

  const hasVerifiedAllRequiredDocuments = verifiedDocuments.length
    ? verifiedRequiredDocumentCount >= totalRequiredDocSlots && totalRequiredDocSlots > 0
    : allDocsReady;

  const isTravelerDocumentsVerifiedComplete = (
    travelerVerification?.status === "Verified" &&
    allDocsReady &&
    !hasStructuredDocumentIssues &&
    hasVerifiedAllRequiredDocuments
  );

  const notify = (type, title, message) => setFeedback({ type, title, message });
  const currentSubmissionPayments = isRejectedPayment ? validTrackerPayments : newTrackerPayments;
  const latestCurrentSubmissionPayment = currentSubmissionPayments.length ? currentSubmissionPayments[currentSubmissionPayments.length - 1] : null;
  const latestInstallmentNeedsReceipt = Boolean(latestCurrentSubmissionPayment) && !receiptFile;
  const effectivePaymentDate = latestCurrentSubmissionPayment?.rawDate || "";
  const effectiveRemarks = remarks.trim() || latestCurrentSubmissionPayment?.note || "";
  const snapshotUtr = utrNumber;
  const snapshotPaymentAmount = Math.round(Number(latestCurrentSubmissionPayment?.amount || 0));
  const snapshotPaymentDate = effectivePaymentDate;
  const snapshotReceiptName = receiptFile?.name || "";
  const receiptRequiredMessage = latestInstallmentNeedsReceipt
    ? "Please upload a receipt for this installment before submitting."
    : isRejectedPayment
      ? "Please upload the corrected payment receipt before resubmitting."
      : "Please upload the payment receipt before submitting.";

  const isPaymentOnlyMode = isPaymentDesk || Boolean(documentPortalContext?.paymentOnly || documentPortalContext?.hideDocuments);
  const canSubmitPayment =
    Boolean(invoiceId) &&
    !preparingInvoice &&
    !submittingPayment &&
    (isTravelerDocumentsVerifiedComplete || isPaymentOnlyMode);

  const trackerTotalAmount = payableQuotationAmount || initialQuotationAmount || 0;

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setUtrNumber(isRejectedPayment ? paymentSubmission?.utrNumber || "" : "");
    setPayableQuotationAmount(initialQuotationAmount);
    setRemarks(isRejectedPayment ? booking?.remarks || "" : "");
    const hydratedTrackerPayments = buildTrackerPaymentsFromSubmission(paymentSubmission);
    setTrackerPayments(hydratedTrackerPayments);
    setTrackerIdCounter(hydratedTrackerPayments.length + 1);
    setReceiptFile(null);
  }, [
    booking?.invoiceId,
    initialQuotationAmount,
    booking?.remarks,
    isRejectedPayment,
    paymentSubmission?.amount,
    paymentSubmission?.paymentDate,
    paymentSubmission?.receipt?.fileName,
    paymentSubmission?.receipt?.url,
    paymentSubmission?.submittedAt,
    paymentSubmission?.trackerPayments,
    paymentSubmission?.utrNumber,
    paymentSubmission,
  ]);

  useEffect(() => {
    let cancelled = false;

    const prepareInvoiceForActiveBooking = async () => {
      if (invoiceId || !booking?.quotation?._id) return;

      try {
        setPreparingInvoice(true);
        const { data } = await API.post(`/agent/quotations/${booking.quotation._id}/ensure-invoice`);
        if (cancelled) return;

        if (data?.invoice) {
          onBookingUpdated?.({
            type: "payment",
            invoice: data.invoice,
            query: data.query,
          });
        }
      } catch (error) {
        if (cancelled) return;
        notify(
          "error",
          "Amount Setup Failed",
          error?.response?.data?.message || "Unable to prepare booking amount right now.",
        );
      } finally {
        if (!cancelled) {
          setPreparingInvoice(false);
        }
      }
    };

    prepareInvoiceForActiveBooking();

    return () => {
      cancelled = true;
    };
  }, [booking?.quotation?._id, invoiceId, onBookingUpdated]);

  const handleView = (doc) => doc?.url && window.open(doc.url, "_blank", "noopener,noreferrer");
  
  const handleDownloadInstallmentReceipt = async (receipt, installmentIndex, options = {}) => {
    if (receipt?.url) {
      window.open(receipt.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (!options?.isInstallmentVerified || !invoiceId) return;

    try {
      const { data } = await API.post(`/agent/invoices/${invoiceId}/payment-receipts/${installmentIndex}/generate`);
      const financeReceipt = normalizeReceipt(data?.receipt);

      if (!financeReceipt.url) {
        notify("warning", "Receipt Missing", "Finance receipt is not available for this installment yet.");
        return;
      }

      setTrackerPayments((prev) =>
        prev.map((entry, index) => (
          index === installmentIndex
            ? { ...entry, financeReceipt }
            : entry
        )),
      );
      window.open(financeReceipt.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      notify("error", "Download Failed", error?.response?.data?.message || "Unable to download finance receipt right now.");
    }
  };

  const handleAddTrackerPayment = (p) => {
    setTrackerPayments((prev) => [...prev, { id: trackerIdCounter, persisted: false, ...p }]);
    setTrackerIdCounter((c) => c + 1);
  };

  const handleEditTrackerPayment = (updatedP) => {
    setTrackerPayments((prev) =>
      prev.map((item) => (item.id === updatedP.id ? { ...item, ...updatedP } : item)),
    );
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceId) return notify("error", "Invoice Missing", "This booking does not have an invoice ready for payment submission.");
    const submissionTrackerPayments = isRejectedPayment ? validTrackerPayments : newTrackerPayments;
    const submissionPaidAmount = submissionTrackerPayments.reduce(
      (sum, payment) => sum + Math.round(Number(payment?.amount || 0)),
      0,
    );
    if (!submissionTrackerPayments.length || submissionPaidAmount <= 0) {
      return notify(
        "warning",
        "Add Payment First",
        "Please enter amount and payment date, then click Add so the new instalment appears in Payment History before submitting.",
      );
    }
    if (!isTravelerDocumentsVerifiedComplete && !isPaymentOnlyMode) {
      return notify(
        "warning",
        "Traveler Documents Pending",
        "The Payment Submit option will be enabled only after the Operations team has verified all required traveler documents and no document has any pending issues.",
      );
    }
    if (!utrNumber.trim() || !effectivePaymentDate || !expectedPaymentAmount) return notify("error", "Missing Fields", "UTR, payment date, and payable amount are required.");
    if (!receiptFile && (!currentReceipt?.url || latestInstallmentNeedsReceipt)) return notify("error", "Receipt Missing", receiptRequiredMessage);
    try {
      setSubmittingPayment(true);
      const fd = new FormData();
      fd.append("utrNumber", utrNumber.trim().toUpperCase());
      fd.append("paymentDate", effectivePaymentDate);
      fd.append("remarks", effectiveRemarks);
      fd.append("paymentAmount", String(submissionPaidAmount));
      fd.append("trackerPayments", JSON.stringify(submissionTrackerPayments));
      fd.append("onBehalfOf", booking?.invoiceNumber || booking?.bookingReference || "Booking Payment");
      if (receiptFile) fd.append("paymentReceipt", receiptFile);
      const { data } = await API.put(`/agent/invoices/${invoiceId}/payment-status`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onBookingUpdated?.({ type: "payment", invoice: data?.invoice });
      setReceiptFile(null);
      notify("success", "Payment Submitted", data?.message || "Payment submitted for verification.");
    } catch (error) {
      notify("error", "Submission Failed", error?.response?.data?.message || "Unable to submit payment right now.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUploadDoc = async (e, traveler, option) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const key = `${traveler?._id}-${option.key}`;
    const mismatchMessage = getDocumentTypeMismatchMessage(option.key, { fileName: file.name });
    if (mismatchMessage) {
      setDocumentUploadErrors((prev) => ({
        ...prev,
        [key]: mismatchMessage,
      }));
      notify("error", "Wrong Document Slot", mismatchMessage);
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setDocumentUploadErrors((prev) => ({
        ...prev,
        [key]: "Please upload a file smaller than 5 MB for this document.",
      }));
      return;
    }
    try {
      setDocumentUploadErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setUploadingKey(key);
      const fd = new FormData();
      fd.append("travelerDocument", file);
      fd.append("documentType", option.label);
      const { data } = await API.put(`/agent/queries/${queryId}/travelers/${traveler?._id}/document`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onBookingUpdated?.({ type: "traveler-document", query: data?.query });
      notify("success", "Document Uploaded", data?.message || `${option.label} uploaded successfully.`);
    } catch (error) {
      notify("error", "Upload Failed", error?.response?.data?.message || "Unable to upload traveler document right now.");
    } finally {
      setUploadingKey("");
    }
  };

  const handleRemoveDoc = async (traveler, option) => {
    const documentKey = option?.key;
    const travelerId = traveler?._id;
    if (!queryId || !travelerId || !documentKey) return;
    const key = `${travelerId}-${documentKey}`;
    try {
      setRemovingKey(key);
      const { data } = await API.delete(`/agent/queries/${queryId}/travelers/${travelerId}/document/${documentKey}`);
      setDocumentUploadErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      onBookingUpdated?.({ type: "traveler-document", query: data?.query });
      notify("success", "Document Removed", data?.message || `${option.label} removed successfully.`);
    } catch (error) {
      notify("error", "Remove Failed", error?.response?.data?.message || "Unable to remove traveler document right now.");
    } finally {
      setRemovingKey("");
    }
  };

  const handleSubmitDocs = async () => {
    if (isTravelerDocumentsVerifiedComplete) {
      notify(
        "info",
        "Already Verified",
        "All required traveler documents have already been verified and marked as correct by operations. No further submission is required."
      );
      return;
    }
    if (hasDocumentTypeMismatch) {
      notify(
        "error",
        "Wrong Document Slot",
        "Please remove or replace documents uploaded in the wrong slot before submitting.",
      );
      return;
    }
    if (!allDocsReady) {
      notify(
        "warning",
        "Required Documents Missing",
        isInternationalTrip
          ? "For international trips, every traveler must upload both a Passport and a PAN Card."
          : "For domestic trips, every traveler must upload at least one PAN Card. Passport is optional.",
      );
      return;
    }
    try {
      setSubmittingDocs(true);
      const { data } = await API.patch(`/agent/queries/${queryId}/traveler-documents/submit`);
      onBookingUpdated?.({ type: "traveler-document", query: data?.query });
      notify("success", "Documents Submitted", data?.message || "Traveler documents submitted for ops review.");
    } catch (error) {
      notify("error", "Submission Failed", error?.response?.data?.message || "Unable to submit traveler documents right now.");
    } finally {
      setSubmittingDocs(false);
    }
  };

  const handleOpenSubmitDocsConfirm = () => {
    if (isTravelerDocumentsVerifiedComplete) {
      notify(
        "info",
        "Already Verified",
        "All required traveler documents have already been verified and marked as correct by operations. No further submission is required."
      );
      return;
    }
    if (hasDocumentTypeMismatch) {
      notify(
        "error",
        "Wrong Document Slot",
        "Please remove or replace documents uploaded in the wrong slot before submitting.",
      );
      return;
    }
    if (!allDocsReady) {
      notify(
        "warning",
        "Required Documents Missing",
        isInternationalTrip
          ? "For international trips, every traveler must upload both a Passport and a PAN Card."
          : "For domestic trips, every traveler must upload at least one PAN Card. Passport is optional.",
      );
      return;
    }
    setIsSubmitDocsConfirmOpen(true);
  };

  if (isCreatingProforma) {
    return (
      <div className="w-full min-h-screen bg-white font-sans antialiased">
        <CreateProformaInvoice
          onClose={() => setIsCreatingProforma(false)}
          onSave={(data) => {
            setProformaInvoiceData(data);
            setIsCreatingProforma(false);
            toast.success("Proforma Invoice saved successfully");
          }}
          queryData={booking}
        />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="min-h-screen bg-[#f5f8fc] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      <ToastNotification feedback={feedback} onClose={() => setFeedback(null)} />
      
      <SubmitDocsConfirmModal
        isOpen={isSubmitDocsConfirmOpen}
        onClose={() => setIsSubmitDocsConfirmOpen(false)}
        requiredDocCount={requiredDocCount}
        totalRequiredDocSlots={totalRequiredDocSlots}
        submittingDocs={submittingDocs}
        onSubmit={async () => { await handleSubmitDocs(); setIsSubmitDocsConfirmOpen(false); }}
      />

      <BookingHeaderCard
        onClose={onClose}
        detailTab={detailTab}
        headerBookingId={headerBookingId}
        headerClientName={headerClientName}
        headerDestination={headerDestination}
        headerTravelDates={headerTravelDates}
        headerDuration={headerDuration}
        headerPaxSummary={headerPaxSummary}
        headerAdultCount={headerAdultCount}
        booking={booking}
        isFullPaymentVerified={isFullPaymentVerified}
        isPaymentVerified={isPaymentVerified}
        expectedPaymentAmount={expectedPaymentAmount}
        approvedQuotationAmount={approvedQuotationAmount}
      />

      <BookingTabNavigation
        isPaymentDesk={isPaymentDesk}
        isTravelerDocsDesk={isTravelerDocsDesk}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
      />

      {detailTab === "basic" && (
        <BasicDetailsTab
          headerClientName={headerClientName}
          headerClientPhone={headerClientPhone}
          headerDestination={headerDestination}
          headerTravelDates={headerTravelDates}
          headerPaxSummary={headerPaxSummary}
          headerDuration={headerDuration}
        />
      )}

      {detailTab === "services" && (
        <div className="mb-6 font-sans">
          <ServicesBookingsTab
            activeQuote={booking?.selectedQuotation || booking?.quotation}
            query={booking}
            currentUser={currentUser}
          />
        </div>
      )}

      {detailTab === "internal_invoice" && (
        <InternalInvoiceTab
          booking={booking}
          headerBookingId={headerBookingId}
          expectedPaymentAmount={expectedPaymentAmount}
        />
      )}

      {detailTab === "accounting" && (
        <AccountingTab
          accountingSubTab={accountingSubTab}
          setAccountingSubTab={setAccountingSubTab}
          totalPaidAmount={totalPaidAmount}
          expectedPaymentAmount={expectedPaymentAmount}
          remainingPaymentAmount={remainingPaymentAmount}
          headerBookingId={headerBookingId}
          validTrackerPayments={validTrackerPayments}
          handleDownloadInstallmentReceipt={handleDownloadInstallmentReceipt}
          booking={booking}
          setCouponModalOpen={setCouponModalOpen}
          invoiceId={invoiceId}
          preparingInvoice={preparingInvoice}
          trackerTotalAmount={trackerTotalAmount}
          trackerPayments={trackerPayments}
          handleAddTrackerPayment={handleAddTrackerPayment}
          handleEditTrackerPayment={handleEditTrackerPayment}
          notify={notify}
          utrNumber={utrNumber}
          setUtrNumber={setUtrNumber}
          remarks={remarks}
          setRemarks={setRemarks}
          receiptFile={receiptFile}
          setReceiptFile={setReceiptFile}
          handlePaymentSubmit={handlePaymentSubmit}
          canSubmitPayment={canSubmitPayment}
          submittingPayment={submittingPayment}
          snapshotPaymentAmount={snapshotPaymentAmount}
          snapshotUtr={snapshotUtr}
          snapshotPaymentDate={snapshotPaymentDate}
          snapshotReceiptName={snapshotReceiptName}
          currency={currency}
          paymentStatus={paymentStatus}
          paymentSubmission={paymentSubmission}
        />
      )}

      {detailTab === "docs" && (
        <TravelerDocsDeskTab
          item={item}
          isInternationalTrip={isInternationalTrip}
          travelers={travelers}
          tripTypeLabel={tripTypeLabel}
          requiredDocCount={requiredDocCount}
          totalRequiredDocSlots={totalRequiredDocSlots}
          docProgress={docProgress}
          travelerVerification={travelerVerification}
          allDocsReady={allDocsReady}
          isTravelerDocumentsVerifiedComplete={isTravelerDocumentsVerifiedComplete}
          travelerIssuesList={travelerIssuesList}
          booking={booking}
          hasStructuredDocumentIssues={hasStructuredDocumentIssues}
          documentPortalContext={documentPortalContext}
          hasDocumentTypeMismatch={hasDocumentTypeMismatch}
          travelersWithStatus={travelersWithStatus}
          requiredDocKeys={requiredDocKeys}
          documentIssues={documentIssues}
          verifiedDocuments={verifiedDocuments}
          documentIssueTitle={documentIssueTitle}
          documentIssueMessage={documentIssueMessage}
          docsUnlocked={docsUnlocked}
          uploadingKey={uploadingKey}
          removingKey={removingKey}
          documentUploadErrors={documentUploadErrors}
          handleUploadDoc={handleUploadDoc}
          handleView={handleView}
          handleRemoveDoc={handleRemoveDoc}
          handleOpenSubmitDocsConfirm={handleOpenSubmitDocsConfirm}
          submittingDocs={submittingDocs}
        />
      )}

      <CouponBillingModal
        open={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        invoiceId={invoiceId}
        subtotalAmount={Number(approvedQuotationAmount || 0)}
        currency={currency}
        existingCouponApplication={booking?.paymentSubmission?.couponApplication || null}
        onApplyCoupon={({ payableAmount, invoice }) => {
          setPayableQuotationAmount(Math.round(Number(payableAmount || 0)));
          if (invoice) onBookingUpdated?.({ type: "payment", invoice });
          setCouponModalOpen(false);
          notify("success", "Coupon Applied", "Discounted quotation amount has been added to the payment form.");
        }}
      />
    </motion.div>
  );
}
