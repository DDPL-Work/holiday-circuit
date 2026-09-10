import {
  X,
  Calendar,
  MapPin,
  Users,
  CircleCheck,
  CircleX,
  Clock,
  FileText,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BookingDecisionModal from "./BookingDecisionModal";
import API from "../utils/Api.js";

// A premium, beautifully designed glassmorphic toast notification system
const premiumToast = {
  custom: (message, type = "info") => {
    toast.custom(
      (t) => (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={t.visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className={`max-w-[480px] w-full pointer-events-auto rounded border border-slate-200/90 bg-white p-3 pr-10 shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center gap-3 relative overflow-hidden transition-all duration-300`}
        >
          {/* Sleek solid color accent bar */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${
              type === "error" ? "bg-red-500" : type === "success" ? "bg-emerald-500" : "bg-blue-500"
            }`}
          />

          {/* Clean Circular Icon without bulky background container */}
          <div className="flex shrink-0 items-center justify-center pl-0.5">
            {type === "error" ? (
              <CircleX className="h-5 w-5 text-red-500 stroke-[2]" />
            ) : type === "success" ? (
              <CircleCheck className="h-5 w-5 text-emerald-500 stroke-[2]" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500 stroke-[2]" />
            )}
          </div>

          {/* Text and Description block */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-[13.5px] font-semibold text-slate-800 leading-tight">
              {type === "error"
                ? "Verification Blocked"
                : type === "success"
                ? "Action Success"
                : "System Notification"}
            </p>
            <p className="mt-0.5 text-[12px] font-normal leading-normal text-slate-500 whitespace-nowrap">
              {message}
            </p>
          </div>

          {/* Slim Close Button (Vertically Centered) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer z-50 flex items-center justify-center hover:bg-slate-50"
            aria-label="Close"
          >
            <X size={16} className="stroke-[2.5]" />
          </button>
        </motion.div>
      ),
      {
        duration: 5000,
        position: "top-right",
      }
    );
  },
  error: (message) => premiumToast.custom(message, "error"),
  success: (message) => premiumToast.custom(message, "success"),
  info: (message) => premiumToast.custom(message, "info"),
};


const normalizeTravelerDocument = (document) => ({
  url: String(document?.url || ""),
  fileName: String(document?.fileName || ""),
  mimeType: String(document?.mimeType || ""),
  size: Number(document?.size || 0),
  uploadedAt: document?.uploadedAt || null,
});

const getTravelerDocumentKey = (documentType = "Passport") => {
  const normalizedType = String(documentType || "").trim().toLowerCase();
  return normalizedType.includes("gov") || normalizedType.includes("id") || normalizedType.includes("aad") || normalizedType.includes("pan")
    ? "governmentId"
    : "passport";
};

const resolveTravelerDocuments = (traveler = {}) => {
  const documents = {
    passport: normalizeTravelerDocument(traveler?.documents?.passport),
    governmentId: normalizeTravelerDocument(traveler?.documents?.governmentId || traveler?.documents?.govtId),
  };
  const legacyDocument = normalizeTravelerDocument(traveler?.document);

  if (legacyDocument.url && !documents.passport.url && !documents.governmentId.url) {
    documents[getTravelerDocumentKey(traveler?.documentType)] = legacyDocument;
  }

  return documents;
};

const buildCloudinaryPdfPreviewUrl = (url) => {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl || !normalizedUrl.includes("/res.cloudinary.com/")) return normalizedUrl;
  if (!normalizedUrl.includes("/image/upload/")) return normalizedUrl;
  return normalizedUrl.replace("/image/upload/", "/image/upload/pg_1,f_jpg/");
};

const getDocumentOpenTarget = (document = {}) => {
  const normalizedUrl = String(document?.url || "").trim();
  const normalizedMimeType = String(document?.mimeType || "").toLowerCase();
  const normalizedFileName = String(document?.fileName || "").toLowerCase();
  const isPdf =
    normalizedMimeType.includes("pdf") ||
    normalizedFileName.endsWith(".pdf") ||
    normalizedUrl.toLowerCase().includes(".pdf");

  return {
    url: isPdf ? buildCloudinaryPdfPreviewUrl(normalizedUrl) : normalizedUrl,
    isPdf,
  };
};

const travelerDocumentRejectionOptions = [
  "Passport scan is unclear",
  "PAN Card is unclear",
  "Required document is missing",
  "Traveler name does not match booking",
  "Document has expired or is invalid",
  "Wrong document uploaded",
];

const isValidDateValue = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const getLatestRejectedAuditAt = (booking = {}) => {
  const auditTrail = Array.isArray(booking?.travelerDocumentAuditTrail)
    ? booking.travelerDocumentAuditTrail
    : [];

  const timestamps = auditTrail
    .filter((entry) => String(entry?.status || "").trim() === "Rejected")
    .map((entry) => (isValidDateValue(entry?.performedAt) ? new Date(entry.performedAt) : null))
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime());

  return timestamps[0] || null;
};

export default function BookingDetailsModal({ refresh, booking, onClose, viewMode = "details" }) {
  const CLOSE_ANIMATION_MS = 140;
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState("accept");
  const [currentBooking, setCurrentBooking] = useState(booking);
  const [documentReviewLoading, setDocumentReviewLoading] = useState(false);
  const [documentRejectionReason, setDocumentRejectionReason] = useState("");
  const [customDocumentRejectionReason, setCustomDocumentRejectionReason] = useState("");
  const [documentRejectionRemarks, setDocumentRejectionRemarks] = useState("");
  const [selectedDocumentIssues, setSelectedDocumentIssues] = useState([]);
  const [selectedVerifiedDocuments, setSelectedVerifiedDocuments] = useState([]);
  const [pendingDocumentReviewAction, setPendingDocumentReviewAction] = useState(null);
  const [documentVerificationError, setDocumentVerificationError] = useState(null);
  const [showBlockedBanner, setShowBlockedBanner] = useState(true);

  useEffect(() => {
    setCurrentBooking(booking);
    setSelectedDocumentIssues(booking?.travelerDocumentVerification?.issues || []);
    setSelectedVerifiedDocuments(booking?.travelerDocumentVerification?.verifiedDocuments || []);
  }, [booking]);

  useEffect(() => {
    if (selectedDocumentIssues.length > 0) {
      setShowBlockedBanner(true);
    }
  }, [selectedDocumentIssues.length]);

  const canAcceptBooking = ["New_Query", "Pending_Accept", "Rejected"].includes(
    currentBooking?.opsStatus,
  );
  const canOpenQuotationBuilder = ["Invoice_Requested", "Revision_Query"].includes(
    currentBooking?.opsStatus,
  );
  const travelerDocumentStatus = currentBooking?.travelerDocumentVerification?.status || "Draft";
  const travelerDocumentReviewPending = travelerDocumentStatus === "Pending";
  const travelerDocumentVerified = travelerDocumentStatus === "Verified";
  const travelerDocumentRejected = travelerDocumentStatus === "Rejected";
  const isDocumentsView = viewMode === "documents";
  const isDetailsView = !isDocumentsView;

  const hasPreviousRejection = useMemo(() => {
    const auditTrail = Array.isArray(currentBooking?.travelerDocumentAuditTrail)
      ? currentBooking.travelerDocumentAuditTrail
      : [];
    return auditTrail.some(
      (entry) => String(entry?.status || "").trim() === "Rejected",
    );
  }, [currentBooking?.travelerDocumentAuditTrail]);

  const travelerDocumentReview = travelerDocumentVerified
    ? {
        status: "Verified",
        label: "Documents Verified",
        tone: "bg-emerald-100 text-emerald-700",
      }
    : travelerDocumentRejected
      ? {
          status: "Rejected",
          label: "Correction Required",
          tone: "bg-red-100 text-red-600",
        }
      : travelerDocumentReviewPending
        ? {
            status: "Pending",
            label: hasPreviousRejection ? "Resubmitted for Review" : "Pending First Review",
            tone: "bg-blue-100 text-blue-700",
          }
        : {
            status: "Draft",
            label: "Docs Not Submitted",
            tone: "bg-slate-100 text-slate-600",
          };

  const travelerDocumentRows = useMemo(
    () => {
      const travelerDetails = Array.isArray(currentBooking?.travelerDetails) ? currentBooking.travelerDetails : [];

      return (
      travelerDetails.map((traveler, index) => {
        const documents = resolveTravelerDocuments(traveler);

        return {
          id: traveler?._id || `traveler-${index}`,
          name: traveler?.fullName || `Traveler ${index + 1}`,
          travelerType: traveler?.travelerType || "Adult",
          childAge: traveler?.childAge || null,
          documents: [
            {
              key: "passport",
              label: "Passport",
              ...documents.passport,
              uploaded: Boolean(documents.passport?.url),
            },
            {
              key: "governmentId",
              label: "PAN Card",
              ...documents.governmentId,
              uploaded: Boolean(documents.governmentId?.url),
            },
          ],
        };
      })
      );
    },
    [currentBooking?.travelerDetails],
  );

  const uploadedTravelerCount = useMemo(
    () => travelerDocumentRows.filter((traveler) => traveler.documents.some((document) => document.uploaded)).length,
    [travelerDocumentRows],
  );
  const hasAnyTravelerDocumentUpload = uploadedTravelerCount > 0;
  const travelerDocumentStatusConfig = travelerDocumentVerified
    ? {
        icon: CircleCheck,
        surfaceClassName:
          "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/10 shadow-[0_12px_30px_rgba(16,185,129,0.04)]",
        pillClassName: "border border-emerald-200 bg-emerald-100/50 text-emerald-700",
        iconClassName: "bg-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.2)]",
        eyebrow: "Ops Approved",
        title: "Traveler document set cleared for booking",
        description:
          "Operations has reviewed the uploaded files and marked this traveler document batch as verified.",
      }
    : travelerDocumentRejected
      ? {
          icon: CircleX,
          surfaceClassName:
            "border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50/10 shadow-[0_12px_30px_rgba(239,68,68,0.04)]",
          pillClassName: "border border-red-200 bg-red-100/50 text-red-700",
          iconClassName: "bg-red-600 text-white shadow-[0_8px_20px_rgba(220,38,38,0.2)]",
          eyebrow: "Corrections Needed",
          title: "Agent needs to update one or more traveler documents",
          description:
            "Ops rejected the current document batch. The agent must replace or correct the requested files before resubmitting.",
        }
      : travelerDocumentReviewPending
        ? {
            icon: Clock,
            surfaceClassName:
              "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/10 shadow-[0_12px_30px_rgba(37,99,235,0.04)]",
            pillClassName: "border border-blue-200 bg-blue-100/50 text-blue-700",
            iconClassName: "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.2)]",
            eyebrow: hasPreviousRejection ? "Resubmitted for Review" : "Pending Review",
            title: hasPreviousRejection
              ? "Traveler documents have been resubmitted for review"
              : "Traveler documents are waiting for ops validation",
            description: hasPreviousRejection
              ? "The agent has updated the documents after the rejection. Please re-verify the files and approve the set or send it back again."
              : "Review the uploaded passport and government ID files, then approve the set or send it back with a clear correction reason.",
          }
        : {
            icon: FileText,
            surfaceClassName:
              "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/10 shadow-[0_12px_30px_rgba(0,0,0,0.02)]",
            pillClassName: "border border-slate-200 bg-slate-100 text-slate-600",
            iconClassName: "bg-slate-700 text-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.1)]",
            eyebrow: "Awaiting Submission",
            title: "Agent has not submitted the traveler document pack yet",
            description:
              "Documents can be reviewed only after the agent uploads the full traveler set and explicitly submits it to operations.",
          };
  const travelerDocumentReviewDateLabel = travelerDocumentVerified
    ? formatDate(currentBooking?.travelerDocumentVerification?.reviewedAt)
    : travelerDocumentRejected
      ? formatDate(currentBooking?.travelerDocumentVerification?.reviewedAt)
      : travelerDocumentReviewPending
        ? formatDate(currentBooking?.travelerDocumentVerification?.submittedAt || currentBooking?.updatedAt)
        : "Waiting for submission";
  const travelerDocumentReviewedByLabel = travelerDocumentVerified || travelerDocumentRejected
    ? currentBooking?.travelerDocumentVerification?.reviewedByName || "Operations"
    : travelerDocumentReviewPending
      ? "Ops queue"
      : "Not assigned";
  const TravelerDocumentStatusIcon = travelerDocumentStatusConfig.icon;
  const latestRejectedAuditAt = useMemo(
    () => getLatestRejectedAuditAt(currentBooking),
    [currentBooking],
  );

  const handleClose = () => {
    setOpen(false);

    setTimeout(() => {
      onClose();
    }, CLOSE_ANIMATION_MS);
  };

  function formatDate(date) {
    if (!date) return "Pending";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return String(date);

    return parsedDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const getDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const days = nights + 1;
    return `${days}D / ${nights}N`;
  };

  const totalPax =
    Number(currentBooking?.numberOfAdults || 0) + Number(currentBooking?.numberOfChildren || 0);

  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modal = {
    hidden: { opacity: 0, scale: 0.972, y: 24 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.99,
      y: 10,
      transition: { duration: 0.14, ease: "easeOut" },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  const bookingHubStatusKey =
    currentBooking?.agentStatus === "Revision Requested" || currentBooking?.opsStatus === "Revision_Query"
      ? "Revision_Requested"
      : currentBooking?.opsStatus === "Rejected"
        ? "Pending_Accept"
        : currentBooking?.opsStatus || "New_Query";

  const bookingHubStatusConfig = {
    New_Query: {
      label: "New_Query",
      className: "border-purple-200 bg-purple-100 text-purple-600",
      icon: Clock,
    },
    Received_Query: {
      label: "Received_Query",
      className: "border-amber-200 bg-amber-100 text-amber-700",
      icon: FileText,
    },
    Pending_Accept: {
      label: "Pending_Accept",
      className: "border-orange-200 bg-orange-100 text-orange-600",
      icon: Clock,
    },
    Revision_Requested: {
      label: "Quotation_Rejected",
      className: "border-rose-200 bg-rose-100 text-rose-700",
      icon: FileText,
    },
    Booking_Accepted: {
      label: "Query_Accepted",
      className: "border-blue-200 bg-blue-100 text-blue-600",
      icon: CircleCheck,
    },
    Invoice_Requested: {
      label: "Amount/Docs Pending",
      className: "border-indigo-200 bg-indigo-100 text-indigo-700",
      icon: FileText,
    },
    Confirmed: {
      label: "Confirmed",
      className: "border-cyan-200 bg-cyan-100 text-cyan-600",
      icon: CircleCheck,
    },
    Vouchered: {
      label: "Vouchered",
      className: "border-green-200 bg-green-100 text-green-600",
      icon: FileText,
    },
  };

  const bookingHubStatus = bookingHubStatusConfig[bookingHubStatusKey] || bookingHubStatusConfig.New_Query;
  const BookingHubStatusIcon = bookingHubStatus.icon;

  const handleAcceptClick = () => {
    if (!canAcceptBooking) {
      handleClose();
      navigate("/ops/quotation-builder", { state: currentBooking });
      return;
    }

    setMode("accept");
    setIsModalOpen(true);
  };

  const handleTravelerDocumentView = (document) => {
    if (!document?.url) {
      premiumToast.error("This document has not been uploaded yet.");
      return;
    }

    const target = getDocumentOpenTarget(document);

    if (target.isPdf) {
      premiumToast.info("Opening PDF as first-page preview.");
    }

    window.open(target.url, "_blank", "noopener,noreferrer");
  };

  const handleTravelerDocumentReview = async (action) => {
    if (!currentBooking?._id) return;

    const resolvedRejectionReason =
      String(customDocumentRejectionReason || "").trim() || String(documentRejectionReason || "").trim();

    if (action === "REJECT" && !resolvedRejectionReason) {
      premiumToast.error("Please add a rejection reason before sending the documents back.");
      return;
    }

    try {
      setDocumentReviewLoading(true);
      const { data } = await API.patch(`/ops/queries/${currentBooking._id}/traveler-documents/review`, {
        action,
        reason: resolvedRejectionReason,
        remarks: documentRejectionRemarks,
        issues: selectedDocumentIssues,
        verifiedDocuments: selectedVerifiedDocuments,
      });

      setCurrentBooking((prev) => ({
        ...prev,
        ...(data?.query || {}),
        agent: prev?.agent || data?.query?.agent,
      }));
      await refresh?.();
      setDocumentRejectionReason("");
      setCustomDocumentRejectionReason("");
      setDocumentRejectionRemarks("");
      setSelectedDocumentIssues([]);
      setSelectedVerifiedDocuments([]);
      premiumToast.success(
        action === "APPROVE"
          ? "Traveler documents verified successfully."
          : "Traveler documents sent back to the agent.",
      );
    } catch (error) {
      premiumToast.error(error?.response?.data?.message || "Unable to review traveler documents right now.");
    } finally {
      setDocumentReviewLoading(false);
    }
  };

  const openTravelerDocumentReviewConfirm = (action) => {
    if (action === "APPROVE" && selectedDocumentIssues.length > 0) {
      const issueCount = selectedDocumentIssues.length;
      setDocumentVerificationError(
        `Cannot verify documents: ${issueCount} active document issue${
          issueCount > 1 ? "s are" : " is"
        } currently flagged. Please request a fix or clear all issues before verifying.`
      );
      return;
    }

    const resolvedRejectionReason =
      String(customDocumentRejectionReason || "").trim() || String(documentRejectionReason || "").trim();

    if (action === "REJECT" && !resolvedRejectionReason) {
      premiumToast.error("Please add a rejection reason before sending the documents back.");
      return;
    }

    setPendingDocumentReviewAction(action);
  };

  const confirmTravelerDocumentReview = async () => {
    if (!pendingDocumentReviewAction) return;

    const action = pendingDocumentReviewAction;
    setPendingDocumentReviewAction(null);
    await handleTravelerDocumentReview(action);
  };

  const isDocumentIssueSelected = (travelerId, documentKey) =>
    selectedDocumentIssues.some((issue) => issue.travelerId === travelerId && issue.documentKey === documentKey);

  const isDocumentVerifiedSelected = (travelerId, documentKey) =>
    selectedVerifiedDocuments.some(
      (document) => document.travelerId === travelerId && document.documentKey === documentKey,
    );

  const toggleDocumentIssue = (traveler, document) => {
    const travelerId = traveler?.id || "";
    if (!travelerId || !document?.key) return;

    setSelectedDocumentIssues((prev) => {
      const exists = prev.some((issue) => issue.travelerId === travelerId && issue.documentKey === document.key);

      if (exists) {
        return prev.filter((issue) => !(issue.travelerId === travelerId && issue.documentKey === document.key));
      }

      return [
        ...prev,
        {
          travelerId,
          travelerName: traveler?.name || "Traveler",
          documentKey: document.key,
          documentLabel: document.label,
        },
      ];
    });

    setSelectedVerifiedDocuments((prev) =>
      prev.filter(
        (verifiedDocument) =>
          !(verifiedDocument.travelerId === travelerId && verifiedDocument.documentKey === document.key),
      ),
    );
  };

  const toggleVerifiedDocument = (traveler, document) => {
    const travelerId = traveler?.id || "";
    if (!travelerId || !document?.key || !document.uploaded) return;

    setSelectedVerifiedDocuments((prev) => {
      const exists = prev.some(
        (verifiedDocument) =>
          verifiedDocument.travelerId === travelerId && verifiedDocument.documentKey === document.key,
      );

      if (exists) {
        return prev.filter(
          (verifiedDocument) =>
            !(verifiedDocument.travelerId === travelerId && verifiedDocument.documentKey === document.key),
        );
      }

      return [
        ...prev,
        {
          travelerId,
          travelerName: traveler?.name || "Traveler",
          documentKey: document.key,
          documentLabel: document.label,
        },
      ];
    });

    setSelectedDocumentIssues((prev) =>
      prev.filter(
        (issue) => !(issue.travelerId === travelerId && issue.documentKey === document.key),
      ),
    );
  };

  return (
    <AnimatePresence>
      {open && currentBooking && (
        <>
          <motion.div
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-linear-to-br from-black/70 via-black/60 to-black/80"
            onClick={handleClose}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              variants={modal}
              className={`relative flex max-h-[90vh] w-full transform-gpu flex-col overflow-hidden rounded-xl bg-white border border-slate-200/80 shadow-[0_30px_70px_rgba(15,23,42,0.18)] text-slate-800 ${isDocumentsView ? "max-w-5xl" : "max-w-[560px]"}`}
            >
              {/* Premium Navy Blue Gradient Header Banner */}
              <div className="bg-gradient-to-br from-[#0c142c] via-[#102454] to-[#060a18] text-white p-7 pb-5 relative shrink-0">
                <button
                  onClick={handleClose}
                  className="absolute right-5 top-5 text-white/70 hover:text-white cursor-pointer transition-colors z-30"
                >
                  <X size={18} />
                </button>

                <motion.h2 variants={item} className="mb-2 text-sm font-semibold text-white/95">
                  {isDocumentsView
                    ? `Traveler Documents - ${currentBooking.queryId}`
                    : `Booking Details - ${currentBooking.queryId}`}
                </motion.h2>

                {isDocumentsView ? (
                  <motion.div variants={item} className="flex gap-2.5 items-center">
                    <span className={`inline-flex h-9 min-w-[176px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium leading-none ${travelerDocumentStatusConfig.pillClassName}`}>
                      <TravelerDocumentStatusIcon className="h-3 w-3" />
                      {travelerDocumentReview.label}
                    </span>
                    <p className="text-xs text-white/65">
                      Last Update : {travelerDocumentReviewDateLabel}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div variants={item} className="flex gap-2.5 items-center">
                    <span className={`inline-flex h-9 min-w-[156px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium leading-none ${bookingHubStatus.className}`}>
                      <BookingHubStatusIcon className="h-3 w-3" />
                      {bookingHubStatus.label}
                    </span>
                    <p className="text-xs text-white/65">
                      Created : {formatDate(currentBooking.createdAt)}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Clean White Body Area */}
              <div className="custom-scroll flex-1 overflow-y-auto p-7 pt-6 bg-white text-slate-800">
                {isDetailsView ? (
                  <motion.div
                    className="grid grid-cols-1 gap-4.5 text-sm text-slate-700 md:grid-cols-2 bg-slate-50/50 p-5.5 rounded-2xl border border-slate-100"
                    initial="hidden"
                    animate="visible"
                    transition={{ staggerChildren: 0.08 }}
                  >
                    <motion.div variants={item}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Agent Name</p>
                      <p className="font-semibold text-slate-900 mt-1">{currentBooking?.agent?.name || "-"}</p>
                    </motion.div>

                    <motion.div variants={item}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Destination</p>
                      <p className="flex items-center gap-1.5 font-semibold text-slate-900 mt-1">
                        <MapPin size={14.5} className="text-rose-500" /> {currentBooking.destination}
                      </p>
                    </motion.div>

                    <motion.div variants={item}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Travel Date</p>
                      <p className="flex items-center gap-1.5 font-semibold text-slate-900 mt-1">
                        <Calendar size={14.5} className="text-indigo-500" />
                        {formatDate(currentBooking.startDate)} - {formatDate(currentBooking.endDate)}
                      </p>
                    </motion.div>

                    <motion.div variants={item}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Duration</p>
                      <p className="font-semibold text-slate-900 mt-1">{getDuration(currentBooking.startDate, currentBooking.endDate)}</p>
                    </motion.div>

                    <motion.div variants={item}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Number of Passengers</p>
                      <p className="flex items-center gap-1.5 font-semibold text-slate-900 mt-1">
                        <Users size={14.5} className="text-blue-500" /> {totalPax} PAX
                      </p>
                    </motion.div>

                    <motion.div variants={item}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estimated Value</p>
                      <p className="font-bold text-emerald-600 mt-1">Rs {currentBooking.customerBudget || 0}</p>
                    </motion.div>
                  </motion.div>
                ) : null}

                {isDocumentsView ? (
                  <motion.div
                    variants={item}
                    className={`mt-5 overflow-hidden rounded-xl border p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)] ${travelerDocumentStatusConfig.surfaceClassName}`}
                  >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${travelerDocumentStatusConfig.iconClassName}`}>
                          <TravelerDocumentStatusIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${travelerDocumentStatusConfig.pillClassName}`}>
                              {travelerDocumentStatus}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                              {travelerDocumentStatusConfig.eyebrow}
                            </span>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                            Traveler Document Review
                          </h3>
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            {travelerDocumentStatusConfig.title}
                          </p>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            {travelerDocumentStatusConfig.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[420px] xl:grid-cols-1">
                        {/* Traveler Readiness */}
                        <div className="group rounded-lg border border-slate-200/60 bg-slate-50/50 px-4.5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:bg-slate-50">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                              <Users className="h-4.5 w-4.5" />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Traveler Readiness</p>
                          </div>
                          <p className="mt-3.5 text-2xl font-bold tracking-tight text-slate-800">
                            {uploadedTravelerCount}
                            <span className="ml-1 text-sm font-semibold text-slate-400">/ {travelerDocumentRows.length}</span>
                          </p>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">Travelers with at least one uploaded document.</p>
                        </div>

                        {/* Timeline */}
                        <div className="group rounded-lg border border-slate-200/60 bg-slate-50/50 px-4.5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-slate-50">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                              <Clock className="h-4.5 w-4.5" />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">Timeline</p>
                          </div>
                          <p className="mt-3.5 text-[15px] font-bold tracking-tight text-slate-800">{travelerDocumentReviewDateLabel}</p>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                            {travelerDocumentReviewPending
                              ? "Submission date captured for ops queue."
                              : travelerDocumentVerified || travelerDocumentRejected
                                ? `Handled by ${travelerDocumentReviewedByLabel}.`
                                : "No review activity yet."}
                          </p>
                        </div>

                        {/* Review Notes */}
                        <div className="group rounded-lg border border-slate-200/60 bg-slate-50/50 px-4.5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:bg-slate-50">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
                              <FileText className="h-4.5 w-4.5" />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600">Review Notes</p>
                          </div>
                          <p className="mt-3.5 text-[13.5px] font-bold leading-snug tracking-tight text-slate-700 line-clamp-1">
                            {travelerDocumentVerified
                              ? "Cleared for booking ops workflow"
                              : travelerDocumentRejected
                                ? currentBooking?.travelerDocumentVerification?.rejectionReason || "Corrections requested"
                                : travelerDocumentReviewPending
                                  ? "Manual validation in progress"
                                  : "Waiting for agent submission"}
                          </p>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                            {travelerDocumentRejected
                              ? "Reason captured below for fast agent correction."
                              : travelerDocumentReviewPending
                                ? "Use the action panel to approve or request changes."
                                : "Status updates will appear here as the flow progresses."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {travelerDocumentRejected && (
                      <div className="rounded-xl border border-red-200 bg-red-50/30 px-4.5 py-4 shadow-[0_4px_12px_rgba(220,38,38,0.02)]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="max-w-2xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500">
                              Rejection Summary
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {currentBooking?.travelerDocumentVerification?.rejectionReason || "Corrections requested"}
                            </p>
                            {currentBooking?.travelerDocumentVerification?.rejectionRemarks && (
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {currentBooking.travelerDocumentVerification.rejectionRemarks}
                              </p>
                            )}
                          </div>
                          <div className="rounded-lg bg-red-100/50 px-4 py-3 text-xs leading-5 text-red-700 border border-red-200/50 font-medium">
                            Agent must update the document set and resubmit before ops can continue verification.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.02)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Review Checklist
                          </p>
                          <h4 className="mt-2 text-sm font-semibold text-slate-800">
                            What ops should validate before approval
                          </h4>
                        </div>
                        <span className="rounded-full bg-indigo-600 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
                          Production Flow
                        </span>
                      </div>

                      <div className="mt-4.5 grid gap-3 sm:grid-cols-3">
                        {/* File Quality */}
                        <div className="group rounded-lg border border-slate-200/60 bg-white px-4.5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:bg-slate-50/40">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition-transform group-hover:scale-105">
                              <FileText className="h-4.5 w-4.5" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">File Quality</p>
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-500">
                            Confirm the uploaded file is readable, complete, and belongs to the correct traveler.
                          </p>
                        </div>

                        {/* Identity Match */}
                        <div className="group rounded-lg border border-slate-200/60 bg-white px-4.5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:bg-slate-50/40">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
                              <Users className="h-4.5 w-4.5" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">Identity Match</p>
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-500">
                            Names and child-age references should align with the active booking traveler list.
                          </p>
                        </div>

                        {/* Validity Check */}
                        <div className="group rounded-lg border border-slate-200/60 bg-white px-4.5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-500/30 hover:bg-slate-50/40">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600 transition-transform group-hover:scale-105">
                              <Clock className="h-4.5 w-4.5" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">Validity Check</p>
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-500">
                            Passport validity and mandatory document coverage should match trip requirements.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                ) : null}

                {isDocumentsView ? (
                  <motion.div
                    variants={item}
                    className="mt-5 space-y-5"
                  >
                    {travelerDocumentRows.length > 0 ? (
                      travelerDocumentRows.map((traveler) => (
                      <div key={traveler.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{traveler.name}</p>
                            <p className="mt-1 text-xs text-slate-500 font-medium">
                              {traveler.travelerType}
                              {traveler.childAge ? ` | ${traveler.childAge} yrs` : ""}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                              traveler.documents.some((document) => document.uploaded)
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200/60"
                            }`}
                          >
                            {traveler.documents.some((document) => document.uploaded) ? "Uploaded" : "Pending"}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-col gap-4">
                          {traveler.documents.map((document, docIdx) => {
                            const documentIssueSelected = isDocumentIssueSelected(traveler.id, document.key);
                            const documentVerifiedSelected = isDocumentVerifiedSelected(traveler.id, document.key);
                            const rejectedIssueMatched = (currentBooking?.travelerDocumentVerification?.issues || []).some(
                              (issue) => issue?.travelerId === traveler.id && issue?.documentKey === document.key,
                            );
                            const verifiedDocumentMatched = (currentBooking?.travelerDocumentVerification?.verifiedDocuments || []).some(
                              (verifiedDocument) => verifiedDocument?.travelerId === traveler.id && verifiedDocument?.documentKey === document.key,
                            );
                            const documentWasResubmitted =
                              travelerDocumentReviewPending &&
                                Boolean(latestRejectedAuditAt) &&
                                Boolean(document.uploadedAt) &&
                                isValidDateValue(document.uploadedAt) &&
                                new Date(document.uploadedAt).getTime() > latestRejectedAuditAt.getTime();

                            const isVerified = documentVerifiedSelected || verifiedDocumentMatched;
                            const isIssue = documentIssueSelected || rejectedIssueMatched;
                            const isUploaded = document.uploaded;

                            const documentCardConfig =
                              document.key === "passport"
                                ? {
                                    icon: FileText,
                                    chip: "Passport File",
                                    accentClassName:
                                      "border-sky-200 bg-[linear-gradient(135deg,rgba(240,249,255,1)_0%,rgba(248,250,252,1)_100%)]",
                                    iconClassName:
                                      "bg-sky-600 text-white shadow-[0_12px_28px_rgba(2,132,199,0.24)]",
                                    chipClassName: "bg-sky-100 text-sky-700",
                                    metaLabel: "Travel Identity",
                                  }
                                : {
                                    icon: ShieldCheck,
                                    chip: "PAN Card",
                                    accentClassName:
                                      "border-violet-200 bg-[linear-gradient(135deg,rgba(245,243,255,1)_0%,rgba(248,250,252,1)_100%)]",
                                    iconClassName:
                                      "bg-violet-600 text-white shadow-[0_12px_28px_rgba(124,58,237,0.24)]",
                                    chipClassName: "bg-violet-100 text-violet-700",
                                    metaLabel: "Compliance Proof",
                                  };
                            const DocumentIcon = documentCardConfig.icon;

                            return (
                              <div key={document.key} className="relative pl-12">
                                {/* Timeline Track */}
                                <div className="absolute left-[12px] top-0 bottom-0 w-6 flex flex-col items-center z-20">
                                  {/* Top part of line segment (fixed height to align indicator with card header) */}
                                  <div className={`w-[2px] shrink-0 ${
                                    docIdx === 0 
                                      ? 'h-[28px] bg-transparent' 
                                      : `h-[28px] ${
                                          (docIdx > 0 && (
                                            documentVerifiedSelected || 
                                            (currentBooking?.travelerDocumentVerification?.verifiedDocuments || []).some(
                                              (vd) => vd?.travelerId === traveler.id && vd?.documentKey === traveler.documents[docIdx - 1].key
                                            )
                                          )) ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-slate-200'
                                        }`
                                  }`} />

                                  {/* Indicator Node */}
                                  <div className="my-1 shrink-0">
                                    {isVerified ? (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-all duration-300">
                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                      </div>
                                    ) : isIssue ? (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all duration-300">
                                        <X className="h-3.5 w-3.5 stroke-[3]" />
                                      </div>
                                    ) : isUploaded ? (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white shadow-[0_0_8px_rgba(37,99,235,0.2)] animate-pulse">
                                        <div className="h-2.5 w-2.5 rounded-full bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.4)]" />
                                      </div>
                                    ) : (
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                                        <div className="h-1.5 w-1.5 bg-slate-300 rounded-full" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Bottom part of line segment (takes remaining height to next card, or half height for the last card) */}
                                  {docIdx === traveler.documents.length - 1 ? (
                                    <div className={`w-[2px] h-[110px] shrink-0 bg-gradient-to-b ${
                                      isVerified 
                                        ? 'from-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.15)]' 
                                        : isIssue
                                        ? 'from-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                                        : 'from-slate-200 to-transparent'
                                    }`} />
                                  ) : (
                                    <div className={`w-[2px] flex-grow ${
                                      isVerified ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-slate-200'
                                    }`} />
                                  )}
                                </div>

                                 {/* Card element */}
                                <div
                                  className={`overflow-hidden rounded-lg border p-4 shadow-xs transition-all duration-300 ${
                                    isIssue
                                      ? "border-red-200 bg-gradient-to-br from-red-50/50 via-white to-red-50/10 shadow-[0_8px_24px_rgba(220,38,38,0.04)]"
                                      : isVerified
                                      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/10 shadow-[0_8px_24px_rgba(16,185,129,0.04)]"
                                      : isUploaded
                                      ? "border-indigo-200 bg-gradient-to-br from-indigo-50/30 via-white to-indigo-50/5 shadow-[0_8px_24px_rgba(99,102,241,0.03)]"
                                      : "border-slate-200 bg-slate-50/50 shadow-xs"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                                        document.uploaded ? documentCardConfig.iconClassName : "bg-slate-100 text-slate-400"
                                      }`}>
                                        <DocumentIcon className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm font-semibold text-slate-800">{document.label}</p>
                                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${
                                            isIssue
                                              ? "bg-red-50 text-red-700 border-red-200"
                                              : isVerified
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : document.uploaded
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                          }`}>
                                            {isIssue
                                              ? "Correction Flagged"
                                              : isVerified
                                                ? "Verified"
                                                : documentCardConfig.chip}
                                          </span>
                                          {documentWasResubmitted ? (
                                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-semibold text-amber-700 animate-pulse">
                                              Resubmitted
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                                          {documentCardConfig.metaLabel}
                                        </p>
                                      </div>
                                    </div>
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${
                                        isIssue
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : isVerified
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : document.uploaded
                                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                              : "bg-slate-100 text-slate-500 border-slate-200"
                                      }`}
                                    >
                                      {isIssue
                                        ? "Issue"
                                        : isVerified
                                          ? "Verified"
                                          : document.uploaded
                                            ? "Ready"
                                            : "Missing"}
                                    </span>
                                  </div>

                                  <div className="mt-4 rounded-lg border border-slate-200/60 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                      Uploaded File
                                    </p>
                                    <p className="mt-2 truncate text-sm font-semibold text-slate-700">
                                      {document.fileName || "No file uploaded"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                      {isIssue
                                        ? "This file is marked for correction or recheck."
                                        : isVerified
                                        ? "This file has been individually verified by operations."
                                        : documentWasResubmitted
                                        ? `Re-uploaded by the agent after the last correction request${document.uploadedAt ? ` on ${formatDate(document.uploadedAt)}` : ""}.`
                                        : document.uploaded
                                        ? `Attached for ops verification${document.uploadedAt ? ` on ${formatDate(document.uploadedAt)}` : ""}.`
                                        : "Waiting for the agent to upload this document."}
                                    </p>
                                  </div>

                                  <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <button
                                      onClick={() => handleTravelerDocumentView(document)}
                                      disabled={!document.uploaded}
                                      className={`inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
                                        document.uploaded
                                          ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
                                          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                                      }`}
                                    >
                                      <DocumentIcon className="mr-2 h-4 w-4" />
                                      View Document
                                    </button>

                                    {travelerDocumentReviewPending && document.uploaded && (
                                      <button
                                        onClick={() => toggleVerifiedDocument(traveler, document)}
                                        className={`inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
                                          documentVerifiedSelected
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-xs"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-xs"
                                        }`}
                                      >
                                        <CircleCheck className="mr-2 h-4 w-4" />
                                        {documentVerifiedSelected ? "Verified" : "Mark Verify"}
                                      </button>
                                    )}

                                    {travelerDocumentReviewPending && document.uploaded && (
                                      <button
                                        onClick={() => toggleDocumentIssue(traveler, document)}
                                        className={`inline-flex items-center rounded-lg border px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
                                          documentIssueSelected
                                            ? "border-red-300 bg-red-100/50 text-red-700 hover:bg-red-100 shadow-xs"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-xs"
                                        }`}
                                      >
                                        <CircleX className="mr-2 h-4 w-4" />
                                        {documentIssueSelected ? "Issue Selected" : "Mark Issue"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-400">
                      No traveler document records are available for this booking yet.
                    </div>
                  )}
                </motion.div>
                ) : null}

                {isDocumentsView ? (
                <motion.div
                  variants={item}
                  className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-xs"
                >
                  {travelerDocumentReviewPending ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200 shadow-xs">
                              <CircleCheck className="h-4 w-4" />
                            </span>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                              Action Panel
                            </p>
                          </div>
                          <h4 className="mt-2 text-sm font-semibold text-slate-800">
                            Approve now or return with a correction note
                          </h4>
                        </div>
                        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 border border-blue-200 shadow-xs">
                          Review Active
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <AnimatePresence>
                          {selectedDocumentIssues.length > 0 && showBlockedBanner && (
                            <motion.div
                              key="verification-blocked-banner"
                              initial={{ opacity: 0, height: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
                              exit={{ 
                                opacity: 0, 
                                height: 0, 
                                y: -10, 
                                scale: 0.95,
                                transition: { 
                                  height: { duration: 0.25, ease: "easeInOut" },
                                  opacity: { duration: 0.15 },
                                  y: { duration: 0.2 }
                                } 
                              }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="relative overflow-hidden rounded-lg border border-red-200 bg-red-50 p-4.5 pr-10 shadow-[0_12px_24px_rgba(220,38,38,0.03)]"
                            >
                              <button
                                type="button"
                                onClick={() => setShowBlockedBanner(false)}
                                className="absolute right-3.5 top-3.5 rounded-full p-1 text-red-400 hover:bg-red-100 hover:text-red-600 transition cursor-pointer"
                                aria-label="Dismiss warning"
                              >
                                <X size={15} />
                              </button>
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 border border-red-200 shadow-xs">
                                  <CircleX className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-700">
                                    Verification Blocked
                                  </p>
                                  <h5 className="mt-1 text-xs font-semibold text-slate-900">
                                    {selectedDocumentIssues.length} Active Document Issue{selectedDocumentIssues.length > 1 ? "s" : ""}
                                  </h5>
                                  <p className="mt-1 text-xs leading-relaxed text-slate-650">
                                    Please resolve all flagged issues or click <strong className="text-red-700 font-bold">"Request Fix"</strong> to send corrections back to the agent. You cannot verify documents until active issues are cleared.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                              Rejection Reason
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Pick the main reason for requesting a fix
                            </span>
                          </div>
                          <select
                            value={documentRejectionReason}
                            onChange={(e) => setDocumentRejectionReason(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white text-slate-800 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white shadow-xs"
                          >
                            <option value="">Select rejection reason</option>
                            {travelerDocumentRejectionOptions.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </div>
 
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                              Custom Reason
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Use this if the exact reason is not listed above
                            </span>
                          </div>
                          <input
                            value={customDocumentRejectionReason}
                            onChange={(e) => setCustomDocumentRejectionReason(e.target.value)}
                            placeholder="Example: passport file is cut, unreadable, or missing details"
                            className="w-full rounded-lg border border-slate-300 bg-white text-slate-800 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white shadow-xs"
                          />
                        </div>
 
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                              Agent Remarks
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Explain what the agent should correct before resubmitting
                            </span>
                          </div>
                          <textarea
                            value={documentRejectionRemarks}
                            onChange={(e) => setDocumentRejectionRemarks(e.target.value)}
                            rows={4}
                            placeholder="Example: upload a clear passport first page and child age proof for traveler 2"
                            className="w-full rounded-lg border border-slate-300 bg-white text-slate-800 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white shadow-xs"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => openTravelerDocumentReviewConfirm("APPROVE")}
                            disabled={documentReviewLoading}
                            className={`inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition cursor-pointer ${
                              documentReviewLoading
                                ? "cursor-not-allowed bg-slate-350"
                                : "cursor-pointer bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                            }`}
                          >
                            <CircleCheck className="mr-2 h-4 w-4" />
                            {documentReviewLoading ? "Saving..." : "Verify Docs"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openTravelerDocumentReviewConfirm("REJECT")}
                            disabled={documentReviewLoading}
                            className={`inline-flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                              documentReviewLoading
                                ? "cursor-not-allowed border-slate-105 text-slate-400 bg-slate-50"
                                : "cursor-pointer border-red-300 bg-red-100/50 text-red-700 hover:bg-red-100 hover:border-red-400 hover:text-red-800 shadow-[0_4px_12px_rgba(239,68,68,0.06)]"
                            }`}
                          >
                            <CircleX className="mr-2 h-4 w-4" />
                            Request Fix
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Review State
                        </p>
                        <h4 className="mt-2 text-sm font-semibold text-slate-800">
                          {travelerDocumentVerified
                            ? "Verification completed successfully"
                            : travelerDocumentRejected
                              ? "Correction cycle is in progress"
                              : "Waiting for agent submission"}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-slate-650">
                          {travelerDocumentVerified
                            ? "All reviewed files are accepted and the booking can continue without any more traveler document checks."
                            : travelerDocumentRejected
                              ? "The rejection note has been shared with the agent. This panel will reactivate after resubmission."
                              : "Once the agent sends the document pack to operations, the action panel will unlock here automatically."}
                        </p>
                      </div>

                      <div className="mt-4 rounded-lg bg-slate-100 text-slate-600 px-4 py-3 text-xs leading-5 border border-slate-200/50">
                        Review owner: <span className="font-semibold text-slate-800">{travelerDocumentReviewedByLabel}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
                ) : null}
              </div>

              {isDetailsView && !hasAnyTravelerDocumentUpload ? (
                <motion.div
                  variants={item}
                  className="px-7 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-[32px]"
                >
                  {canOpenQuotationBuilder && (
                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/ops/quotation-builder", { state: currentBooking });
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700 transition hover:bg-indigo-100 hover:text-indigo-800 active:scale-95 cursor-pointer"
                    >
                      <CircleCheck className="h-4 w-4" />
                      Open Builder
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMode("reject");
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-red-650 transition hover:bg-red-50/60 hover:text-red-700 hover:border-red-200 active:scale-95 cursor-pointer"
                  >
                    <CircleX className="h-4 w-4" />
                    Reject
                  </button>

                  <button
                    onClick={handleAcceptClick}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm transition cursor-pointer hover:scale-[1.03] active:scale-[0.97] ${
                      canAcceptBooking
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <CircleCheck className="h-4 w-4" />
                    {canAcceptBooking ? "Accept" : "Proceed to Quotation Builder"}
                  </button>
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>

          <BookingDecisionModal
            isOpen={isModalOpen}
            mode={mode}
            refresh={async () => {
              await refresh();
            }}
            queryId={currentBooking._id}
            onDecisionSuccess={(updatedQuery) => {
              if (!updatedQuery) return;

              const newBookingState = {
                ...currentBooking,
                ...updatedQuery,
                agent: updatedQuery?.agent || currentBooking?.agent,
              };

              setCurrentBooking(newBookingState);

              if (mode === "accept") {
                handleClose();
                navigate("/ops/quotation-builder", { state: newBookingState });
              }
            }}
            onClose={() => {
              setIsModalOpen(false);
            }}
          />

          <AnimatePresence>
            {pendingDocumentReviewAction && (
              <motion.div
                className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5.5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] text-slate-800"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border shadow-xs ${
                        pendingDocumentReviewAction === "APPROVE"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-50/50"
                          : "bg-red-50 text-red-600 border-red-200 shadow-red-50/50"
                      }`}
                    >
                      {pendingDocumentReviewAction === "APPROVE" ? (
                        <CircleCheck className="h-5 w-5" />
                      ) : (
                        <CircleX className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Confirm Action
                      </p>
                      <h4 className="mt-1 text-base font-bold text-slate-800">
                        {pendingDocumentReviewAction === "APPROVE"
                          ? "Verify traveler docs?"
                          : "Send docs for correction?"}
                      </h4>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
                        {pendingDocumentReviewAction === "APPROVE"
                          ? "Select Yes to approve this traveler document set."
                          : "Select Yes to notify the agent and request corrected documents."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5.5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPendingDocumentReviewAction(null)}
                      disabled={documentReviewLoading}
                      className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition shadow-xs disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={confirmTravelerDocumentReview}
                      disabled={documentReviewLoading}
                      className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${
                        pendingDocumentReviewAction === "APPROVE"
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                          : "bg-red-600 hover:bg-red-700 shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
                      } ${documentReviewLoading ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      Yes
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {documentVerificationError && (
              <motion.div
                className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] text-slate-800 relative overflow-hidden"
                >
                  {/* Decorative subtle top bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />

                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200 shadow-xs">
                      <CircleX className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-500">
                        Verification Blocked
                      </p>
                      <h4 className="mt-1.5 text-base font-bold text-slate-800">
                        Active Issues Flagged
                      </h4>
                      <p className="mt-2.5 text-[13.5px] leading-relaxed text-slate-500">
                        {documentVerificationError}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDocumentVerificationError(null)}
                      className="w-full sm:w-auto inline-flex cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 hover:from-slate-900 hover:via-slate-800 hover:to-blue-900 text-white px-6 py-3 text-sm font-semibold transition-all duration-300 shadow-md shadow-blue-950/20 active:scale-[0.98] border border-slate-800/80"
                    >
                      Got It, Let me check
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
