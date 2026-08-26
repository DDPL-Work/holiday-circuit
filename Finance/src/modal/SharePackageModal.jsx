import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import API from "../utils/Api";
import { buildVoucherHtml } from "../utils/voucherTemplate";

import {
  DEFAULT_SELLER_BANK_DETAILS,
  GENERAL_TERMS_AND_CONDITIONS,
  DEFAULT_INCLUSIONS,
  DEFAULT_EXCLUSIONS,
  toDisplayList,
  getPackageDurationDetails,
  getTransportUsageLabel,
} from "./sharePackage/utils/sharePackageHelpers.js";

import SendEmailModal from "./sharePackage/components/SendEmailModal.jsx";
import SharePackageSidebar from "./sharePackage/components/SharePackageSidebar.jsx";

export default function SharePackageModal({
  isOpen,
  onClose,
  query = {},
  quote = {},
  selectedPkg = null,
  currentUser = {},
  brandLogoUrl = "",
  onMarkShared,
  onSendEmail,
  getClientPdfUrl,
  shareMode = "QUOTATION",
}) {
  const reduxUser = useSelector((state) => state.auth?.user) || {};
  const effectiveUser = useMemo(() => ({
    ...reduxUser,
    ...currentUser,
  }), [reduxUser, currentUser]);

  const isVoucherMode = shareMode === "VOUCHER";
  const isPackageMode = shareMode === "PACKAGE";
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [targetEmailInput, setTargetEmailInput] = useState("");
  const [emailSubjectInput, setEmailSubjectInput] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const destination = query?.destination || quote?.destination || selectedPkg?.destination || "Destination";
  const tripId = query?.queryId || query?._id?.slice(-7) || "TRIP-001";

  const handleOpenSendEmailModal = () => {
    const defaultEmail = String(
      query?.clientEmail || query?.email || quote?.clientEmail || effectiveUser?.email || ""
    ).trim();

    const voucherNum = query?.voucherNumber || `VCH-${query?.queryId || tripId}`;
    const defaultSubj = isVoucherMode
      ? `Official Travel Voucher (${voucherNum}) for ${destination} - Trip #${tripId}`
      : isPackageMode
      ? `Package Details: ${destination || "Trip"} - Trip #${tripId}`
      : `Quotation Details: ${destination || "Trip"} - Trip #${tripId}`;

    setTargetEmailInput(defaultEmail);
    setEmailSubjectInput(defaultSubj);
    setIsSendEmailModalOpen(true);
  };

  const handleConfirmSendEmail = async (e) => {
    if (e) e.preventDefault();
    const recipientEmail = String(targetEmailInput || "").trim();

    if (!recipientEmail) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      toast.error("Please enter a valid email address (e.g. client@example.com).");
      return;
    }

    setIsSendingEmail(true);
    try {
      if (isVoucherMode) {
        const voucherHtml = emailPreviewHtml || emailContentRef.current?.innerHTML;
        const voucherNum = query?.voucherNumber || `VCH-${query?.queryId || tripId}`;
        const queryTargetId = query?._id || query?.queryId;

        await API.post(`/agent/queries/${queryTargetId}/send-voucher-email`, {
          recipientEmail: recipientEmail,
          subject: emailSubjectInput || `Official Travel Voucher (${voucherNum}) for ${destination} - Trip #${tripId}`,
          html: voucherHtml,
          voucherNumber: voucherNum,
        });

        toast.success(`Travel Voucher email successfully sent to ${recipientEmail}!`);
      } else if (isPackageMode) {
        const packageHtml = emailPreviewHtml || emailContentRef.current?.innerHTML;
        const queryTargetId = query?._id || query?.queryId;

        if (queryTargetId) {
          await API.post(`/agent/queries/${queryTargetId}/send-voucher-email`, {
            recipientEmail: recipientEmail,
            subject: emailSubjectInput || `Package Details: ${destination || "Trip"} - Trip #${tripId}`,
            html: packageHtml,
            voucherNumber: `PKG-${tripId}`,
          });
        } else if (quote?._id) {
          await API.patch(`/agent/quotations/${quote._id}/accept`, {
            action: "SEND_TO_CLIENT",
            recipientEmail: recipientEmail,
          });
        }

        if (typeof onMarkShared === "function" && quote?._id) {
          await onMarkShared(quote);
        }
        toast.success(`Package email successfully sent to ${recipientEmail}!`);
      } else {
        if (quote?._id && typeof onSendEmail === "function") {
          await onSendEmail(quote, recipientEmail);
        } else if (quote?._id) {
          await API.patch(`/agent/quotations/${quote._id}/accept`, {
            action: "SEND_TO_CLIENT",
            recipientEmail: recipientEmail,
          });
          if (typeof onMarkShared === "function") {
            await onMarkShared(quote);
          }
        } else {
          const queryTargetId = query?._id || query?.queryId;
          const quotationHtml = emailPreviewHtml || emailContentRef.current?.innerHTML;

          await API.post(`/agent/queries/${queryTargetId}/send-voucher-email`, {
            recipientEmail: recipientEmail,
            subject: emailSubjectInput || `Quotation Details: ${destination || "Trip"} - Trip #${tripId}`,
            html: quotationHtml,
            voucherNumber: `QTN-${tripId}`,
          });
        }
        toast.success(`Quotation email successfully sent to ${recipientEmail}!`);
      }
      setIsSendEmailModalOpen(false);
    } catch (err) {
      console.error("Email send error:", err);
      toast.error(err?.response?.data?.message || "Failed to send email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const [activeTab, setActiveTab] = useState("email");
  const [emailPreviewHtml, setEmailPreviewHtml] = useState("");
  const [isEmailPreviewLoading, setIsEmailPreviewLoading] = useState(false);
  const [emailPreviewError, setEmailPreviewError] = useState("");
  const [emailPreviewVersion, setEmailPreviewVersion] = useState(0);

  // Options Toggles state
  const [showIncExc, setShowIncExc] = useState(false);
  const [showPriceBreakup, setShowPriceBreakup] = useState(false);
  const [hideTotalPrice, setHideTotalPrice] = useState(true);
  const [removeItinerary, setRemoveItinerary] = useState(false);
  const [removeTerms, setRemoveTerms] = useState(false);
  const [removeTransport, setRemoveTransport] = useState(false);
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [similarHotelWord, setSimilarHotelWord] = useState(true);

  const emailContentRef = useRef(null);
  const emailPreviewIframeRef = useRef(null);

  const resizeEmailPreview = () => {
    const iframe = emailPreviewIframeRef.current;
    const previewDocument = iframe?.contentDocument;
    if (!iframe || !previewDocument) return;

    const height = Math.max(
      720,
      previewDocument.documentElement.scrollHeight || 0,
      previewDocument.body?.scrollHeight || 0,
    );
    iframe.style.height = `${height}px`;
  };

  useEffect(() => {
    if (isOpen) setActiveTab("email");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEmailPreviewHtml("");
      setEmailPreviewError("");
      setIsEmailPreviewLoading(false);
      return undefined;
    }

    if (shareMode === "VOUCHER") {
      setIsEmailPreviewLoading(true);
      setEmailPreviewError("");
      try {
        const voucherHtml = buildVoucherHtml({
          query,
          quote,
          effectiveUser,
          brandLogoUrl,
        });
        setEmailPreviewHtml(voucherHtml);
      } catch (error) {
        setEmailPreviewHtml("");
        setEmailPreviewError("Unable to load Travel Voucher email preview.");
      } finally {
        setIsEmailPreviewLoading(false);
      }
      return undefined;
    }

    if (!quote?._id && shareMode !== "PACKAGE" && !selectedPkg) {
      setEmailPreviewHtml("");
      setEmailPreviewError("");
      setIsEmailPreviewLoading(false);
      return undefined;
    }

    let cancelled = false;
    const loadEmailPreview = async () => {
      setIsEmailPreviewLoading(true);
      setEmailPreviewError("");

      try {
        const queryTargetId = query?._id || query?.queryId;
        const res = await API.get(`/agent/quotations/${quote._id || "preview"}/email-preview`, {
          params: {
            showIncExc,
            showPriceBreakup,
            hideTotalPrice,
            removeItinerary,
            removeTerms,
            removeTransport,
            similarHotelWord,
            isPdfMode,
            queryId: queryTargetId,
          },
        });

        if (!cancelled) {
          setEmailPreviewHtml(res.data?.html || "");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Email preview fetch error:", err);
          setEmailPreviewError("Unable to load live email preview.");
        }
      } finally {
        if (!cancelled) {
          setIsEmailPreviewLoading(false);
        }
      }
    };

    loadEmailPreview();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    shareMode,
    quote?._id,
    selectedPkg,
    query,
    effectiveUser,
    brandLogoUrl,
    showIncExc,
    showPriceBreakup,
    hideTotalPrice,
    removeItinerary,
    removeTerms,
    removeTransport,
    similarHotelWord,
    isPdfMode,
    emailPreviewVersion,
  ]);

  const handleCopyLink = () => {
    const link = quote?.shareableLink || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Quotation link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRefreshPreview = () => {
    setEmailPreviewVersion((v) => v + 1);
    toast.success("Preview updated!");
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      if (typeof getClientPdfUrl === "function") {
        const pdfUrl = await getClientPdfUrl();
        if (pdfUrl) {
          window.open(pdfUrl, "_blank");
          toast.success("PDF generated successfully!");
          return;
        }
      }

      toast.error("PDF generation is unavailable for this view.");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF document.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex h-[92vh] max-h-[850px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
        >
          {/* Top Modal Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-800">
                Share {isVoucherMode ? "Travel Voucher" : isPackageMode ? "Package" : "Quotation"} Details
              </h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 border border-blue-100">
                {destination}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-0">
            {/* Sidebar Controls */}
            <SharePackageSidebar
              showIncExc={showIncExc}
              setShowIncExc={setShowIncExc}
              showPriceBreakup={showPriceBreakup}
              setShowPriceBreakup={setShowPriceBreakup}
              hideTotalPrice={hideTotalPrice}
              setHideTotalPrice={setHideTotalPrice}
              removeItinerary={removeItinerary}
              setRemoveItinerary={setRemoveItinerary}
              removeTerms={removeTerms}
              setRemoveTerms={setRemoveTerms}
              removeTransport={removeTransport}
              setRemoveTransport={setRemoveTransport}
              isPdfMode={isPdfMode}
              setIsPdfMode={setIsPdfMode}
              similarHotelWord={similarHotelWord}
              setSimilarHotelWord={setSimilarHotelWord}
              isVoucherMode={isVoucherMode}
              isPackageMode={isPackageMode}
              handleCopyLink={handleCopyLink}
              handleRefreshPreview={handleRefreshPreview}
              handleDownloadPdf={handleDownloadPdf}
              handleOpenSendEmailModal={handleOpenSendEmailModal}
              copiedLink={copiedLink}
              isGeneratingPdf={isGeneratingPdf}
            />

            {/* Email / Voucher Preview Content */}
            <div className="flex-1 bg-slate-100 p-4 lg:p-6 overflow-y-auto min-h-0 hide-scrollbar">
              <div className="mx-auto max-w-3xl rounded-xl bg-white p-2 shadow-sm border border-slate-200 min-h-[500px]">
                {isEmailPreviewLoading ? (
                  <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <p className="text-xs font-semibold text-slate-500">Loading document preview...</p>
                  </div>
                ) : emailPreviewError ? (
                  <div className="flex h-96 flex-col items-center justify-center gap-2 text-rose-500 p-6 text-center">
                    <AlertTriangle size={24} />
                    <p className="text-xs font-bold">{emailPreviewError}</p>
                    <button
                      onClick={handleRefreshPreview}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                ) : emailPreviewHtml ? (
                  <iframe
                    ref={emailPreviewIframeRef}
                    srcDoc={emailPreviewHtml}
                    onLoad={resizeEmailPreview}
                    title="Document Preview"
                    className="w-full border-none rounded-lg"
                    style={{ minHeight: "680px" }}
                  />
                ) : (
                  <div className="flex h-96 flex-col items-center justify-center text-slate-400">
                    <p className="text-xs font-semibold">No preview available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <SendEmailModal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        targetEmailInput={targetEmailInput}
        setTargetEmailInput={setTargetEmailInput}
        emailSubjectInput={emailSubjectInput}
        setEmailSubjectInput={setEmailSubjectInput}
        handleConfirmSendEmail={handleConfirmSendEmail}
        isSendingEmail={isSendingEmail}
        isVoucherMode={isVoucherMode}
        isPackageMode={isPackageMode}
      />
    </AnimatePresence>
  );
}
