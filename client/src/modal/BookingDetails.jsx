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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BookingDecisionModal from "./BookingDecisionModal";
import API from "../utils/Api.js";

const normalizeTravelerDocument = (document) => ({
  url: String(document?.url || ""),
  fileName: String(document?.fileName || ""),
  mimeType: String(document?.mimeType || ""),
  size: Number(document?.size || 0),
  uploadedAt: document?.uploadedAt || null,
});

const getTravelerDocumentKey = (documentType = "Passport") => {
  const normalizedType = String(documentType || "").trim().toLowerCase();
  return normalizedType.includes("gov") || normalizedType.includes("id") || normalizedType.includes("aad")
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
  "Government ID is unclear",
  "Required document is missing",
  "Traveler name does not match booking",
  "Document has expired or is invalid",
  "Wrong document uploaded",
];

export default function BookingDetailsModal({ refresh, booking, onClose }) {
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

  useEffect(() => {
    setCurrentBooking(booking);
    setSelectedDocumentIssues(booking?.travelerDocumentVerification?.issues || []);
  }, [booking]);

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
              label: "Government ID",
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
  const travelerDocumentStatusConfig = travelerDocumentVerified
    ? {
        icon: CircleCheck,
        surfaceClassName:
          "border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,1)_0%,rgba(248,250,252,1)_100%)]",
        pillClassName: "border border-emerald-200 bg-emerald-100 text-emerald-700",
        iconClassName: "bg-emerald-600 text-white shadow-[0_12px_30px_rgba(5,150,105,0.28)]",
        eyebrow: "Ops Approved",
        title: "Traveler document set cleared for booking",
        description:
          "Operations has reviewed the uploaded files and marked this traveler document batch as verified.",
      }
    : travelerDocumentRejected
      ? {
          icon: CircleX,
          surfaceClassName:
            "border-red-200 bg-[linear-gradient(135deg,rgba(254,242,242,1)_0%,rgba(255,247,237,1)_100%)]",
          pillClassName: "border border-red-200 bg-red-100 text-red-700",
          iconClassName: "bg-red-600 text-white shadow-[0_12px_30px_rgba(220,38,38,0.25)]",
          eyebrow: "Corrections Needed",
          title: "Agent needs to update one or more traveler documents",
          description:
            "Ops rejected the current document batch. The agent must replace or correct the requested files before resubmitting.",
        }
      : travelerDocumentReviewPending
        ? {
            icon: Clock,
            surfaceClassName:
              "border-blue-200 bg-[linear-gradient(135deg,rgba(239,246,255,1)_0%,rgba(248,250,252,1)_100%)]",
            pillClassName: "border border-blue-200 bg-blue-100 text-blue-700",
            iconClassName: "bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)]",
            eyebrow: "Pending Review",
            title: "Traveler documents are waiting for ops validation",
            description:
              "Review the uploaded passport and government ID files, then approve the set or send it back with a clear correction reason.",
          }
        : {
            icon: FileText,
            surfaceClassName:
              "border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,1)_0%,rgba(241,245,249,1)_100%)]",
            pillClassName: "border border-slate-200 bg-slate-100 text-slate-700",
            iconClassName: "bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.20)]",
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

  const handleClose = () => {
    setOpen(false);

    setTimeout(() => {
      onClose();
    }, 200);
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
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  const status = currentBooking?.opsStatus?.replace("_", " ") || "New Query";

  const handleAcceptClick = () => {
    if (!canAcceptBooking) {
      toast.error("Booking already accepted");
      return;
    }

    setMode("accept");
    setIsModalOpen(true);
  };

  const handleTravelerDocumentView = (document) => {
    if (!document?.url) {
      toast.error("This document has not been uploaded yet.");
      return;
    }

    const target = getDocumentOpenTarget(document);

    if (target.isPdf) {
      toast("Opening PDF as first-page preview.");
    }

    window.open(target.url, "_blank", "noopener,noreferrer");
  };

  const handleTravelerDocumentReview = async (action) => {
    if (!currentBooking?._id) return;

    const resolvedRejectionReason =
      String(customDocumentRejectionReason || "").trim() || String(documentRejectionReason || "").trim();

    if (action === "REJECT" && !resolvedRejectionReason) {
      toast.error("Please add a rejection reason before sending the documents back.");
      return;
    }

    try {
      setDocumentReviewLoading(true);
      const { data } = await API.patch(`/ops/queries/${currentBooking._id}/traveler-documents/review`, {
        action,
        reason: resolvedRejectionReason,
        remarks: documentRejectionRemarks,
        issues: selectedDocumentIssues,
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
      toast.success(
        action === "APPROVE"
          ? "Traveler documents verified successfully."
          : "Traveler documents sent back to the agent.",
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to review traveler documents right now.");
    } finally {
      setDocumentReviewLoading(false);
    }
  };

  const isDocumentIssueSelected = (travelerId, documentKey) =>
    selectedDocumentIssues.some((issue) => issue.travelerId === travelerId && issue.documentKey === documentKey);

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
            className="fixed inset-0 z-40 bg-linear-to-br from-black/70 via-black/60 to-black/80 backdrop-blur-md"
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
              className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
            >
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>

              <motion.h2 variants={item} className="mb-2 text-sm font-semibold text-slate-900">
                Booking Details - {currentBooking.queryId}
              </motion.h2>

              <motion.div variants={item} className="mb-3 flex gap-2">
                <span className="flex items-center gap-1 rounded-full border bg-purple-100 px-2 py-1.5 text-xs text-purple-600">
                  <Clock className="mt-0.5 h-3 w-3" />
                  {status}
                </span>
                <p className="mt-1 text-xs text-[#62748E]">
                  Created : {formatDate(currentBooking.createdAt)}
                </p>
              </motion.div>

              <div className="custom-scroll flex-1 overflow-y-auto pr-1">
                <motion.div
                  className="grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2"
                  initial="hidden"
                  animate="visible"
                  transition={{ staggerChildren: 0.08 }}
                >
                  <motion.div variants={item}>
                    <p className="text-xs text-gray-400">Agent Name</p>
                    <p>{currentBooking?.agent?.name || "-"}</p>
                  </motion.div>

                  <motion.div variants={item}>
                    <p className="text-xs text-gray-400">Destination</p>
                    <p className="flex items-center gap-1">
                      <MapPin size={14} /> {currentBooking.destination}
                    </p>
                  </motion.div>

                  <motion.div variants={item}>
                    <p className="text-xs text-gray-400">Travel Date</p>
                    <p className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(currentBooking.startDate)} - {formatDate(currentBooking.endDate)}
                    </p>
                  </motion.div>

                  <motion.div variants={item}>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p>{getDuration(currentBooking.startDate, currentBooking.endDate)}</p>
                  </motion.div>

                  <motion.div variants={item}>
                    <p className="text-xs text-gray-400">Number of Passengers</p>
                    <p className="flex items-center gap-1">
                      <Users size={14} /> {totalPax} PAX
                    </p>
                  </motion.div>

                  <motion.div variants={item}>
                    <p className="text-xs text-gray-400">Estimated Value</p>
                    <p className="font-semibold text-green-600">Rs {currentBooking.customerBudget || 0}</p>
                  </motion.div>
                </motion.div>

                <motion.div
                  variants={item}
                  className={`mt-5 overflow-hidden rounded-[28px] border p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] ${travelerDocumentStatusConfig.surfaceClassName}`}
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${travelerDocumentStatusConfig.iconClassName}`}>
                          <TravelerDocumentStatusIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${travelerDocumentStatusConfig.pillClassName}`}>
                              {travelerDocumentStatus}
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {travelerDocumentStatusConfig.eyebrow}
                            </span>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
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
                        <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Users className="h-4 w-4" />
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Traveler Readiness</p>
                          </div>
                          <p className="mt-3 text-2xl font-semibold text-slate-900">
                            {uploadedTravelerCount}
                            <span className="ml-1 text-sm font-medium text-slate-400">/ {travelerDocumentRows.length}</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Travelers with at least one uploaded document.</p>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="h-4 w-4" />
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Timeline</p>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-900">{travelerDocumentReviewDateLabel}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {travelerDocumentReviewPending
                              ? "Submission date captured for ops queue."
                              : travelerDocumentVerified || travelerDocumentRejected
                                ? `Handled by ${travelerDocumentReviewedByLabel}.`
                                : "No review activity yet."}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
                          <div className="flex items-center gap-2 text-slate-500">
                            <FileText className="h-4 w-4" />
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Review Notes</p>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-900">
                            {travelerDocumentVerified
                              ? "Cleared for booking ops workflow"
                              : travelerDocumentRejected
                                ? currentBooking?.travelerDocumentVerification?.rejectionReason || "Corrections requested"
                                : travelerDocumentReviewPending
                                  ? "Manual validation in progress"
                                  : "Waiting for agent submission"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
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
                      <div className="rounded-[24px] border border-red-200/80 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
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
                          <div className="rounded-2xl bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                            Agent must update the document set and resubmit before ops can continue verification.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                      <div className="rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Review Checklist
                            </p>
                            <h4 className="mt-2 text-sm font-semibold text-slate-900">
                              What ops should validate before approval
                            </h4>
                          </div>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                            Production Flow
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-700">
                              <FileText className="h-4 w-4" />
                              <p className="text-sm font-semibold">File Quality</p>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Confirm the uploaded file is readable, complete, and belongs to the correct traveler.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Users className="h-4 w-4" />
                              <p className="text-sm font-semibold">Identity Match</p>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Names and child-age references should align with the active booking traveler list.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Clock className="h-4 w-4" />
                              <p className="text-sm font-semibold">Validity Check</p>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Passport validity and mandatory document coverage should match trip requirements.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                        {travelerDocumentReviewPending ? (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                  Action Panel
                                </p>
                                <h4 className="mt-2 text-sm font-semibold text-slate-900">
                                  Approve now or return with a correction note
                                </h4>
                              </div>
                              <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                                Review Active
                              </div>
                            </div>

                            <div className="mt-4 space-y-3">
                              <select
                                value={documentRejectionReason}
                                onChange={(e) => setDocumentRejectionReason(e.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                              >
                                <option value="">Select rejection reason</option>
                                {travelerDocumentRejectionOptions.map((reason) => (
                                  <option key={reason} value={reason}>
                                    {reason}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={customDocumentRejectionReason}
                                onChange={(e) => setCustomDocumentRejectionReason(e.target.value)}
                                placeholder="Or type a custom rejection reason"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                              />
                              <textarea
                                value={documentRejectionRemarks}
                                onChange={(e) => setDocumentRejectionRemarks(e.target.value)}
                                rows={4}
                                placeholder="Optional review remarks for the agent"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                  onClick={() => handleTravelerDocumentReview("APPROVE")}
                                  disabled={documentReviewLoading}
                                  className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                                    documentReviewLoading ? "cursor-not-allowed bg-slate-300" : "bg-slate-950 hover:bg-slate-800"
                                  }`}
                                >
                                  <CircleCheck className="mr-2 h-4 w-4" />
                                  {documentReviewLoading ? "Saving..." : "Verify Docs"}
                                </button>
                                <button
                                  onClick={() => handleTravelerDocumentReview("REJECT")}
                                  disabled={documentReviewLoading}
                                  className={`inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                                    documentReviewLoading
                                      ? "cursor-not-allowed border-slate-200 text-slate-400"
                                      : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                  }`}
                                >
                                  <CircleX className="mr-2 h-4 w-4" />
                                  Request Fix
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full flex-col justify-between rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Review State
                              </p>
                              <h4 className="mt-2 text-sm font-semibold text-slate-900">
                                {travelerDocumentVerified
                                  ? "Verification completed successfully"
                                  : travelerDocumentRejected
                                    ? "Correction cycle is in progress"
                                    : "Waiting for agent submission"}
                              </h4>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {travelerDocumentVerified
                                  ? "All reviewed files are accepted and the booking can continue without any more traveler document checks."
                                  : travelerDocumentRejected
                                    ? "The rejection note has been shared with the agent. This panel will reactivate after resubmission."
                                    : "Once the agent sends the document pack to operations, the action panel will unlock here automatically."}
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                              Review owner: <span className="font-semibold text-slate-700">{travelerDocumentReviewedByLabel}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="mt-5 space-y-3">
                  {travelerDocumentRows.length > 0 ? (
                    travelerDocumentRows.map((traveler) => (
                      <div key={traveler.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{traveler.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {traveler.travelerType}
                              {traveler.childAge ? ` | ${traveler.childAge} yrs` : ""}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                              traveler.documents.some((document) => document.uploaded)
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {traveler.documents.some((document) => document.uploaded) ? "Uploaded" : "Pending"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {traveler.documents.map((document) => {
                            const documentIssueSelected = isDocumentIssueSelected(traveler.id, document.key);
                            const rejectedIssueMatched = (currentBooking?.travelerDocumentVerification?.issues || []).some(
                              (issue) => issue?.travelerId === traveler.id && issue?.documentKey === document.key,
                            );
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
                                    chip: "Government ID",
                                    accentClassName:
                                      "border-violet-200 bg-[linear-gradient(135deg,rgba(245,243,255,1)_0%,rgba(248,250,252,1)_100%)]",
                                    iconClassName:
                                      "bg-violet-600 text-white shadow-[0_12px_28px_rgba(124,58,237,0.24)]",
                                    chipClassName: "bg-violet-100 text-violet-700",
                                    metaLabel: "Compliance Proof",
                                  };
                            const DocumentIcon = documentCardConfig.icon;

                            return (
                              <div
                                key={document.key}
                                className={`overflow-hidden rounded-[22px] border p-4 shadow-sm ${
                                  documentIssueSelected || rejectedIssueMatched
                                    ? "border-red-300 bg-[linear-gradient(135deg,rgba(254,242,242,1)_0%,rgba(255,247,237,1)_100%)] shadow-[0_18px_40px_rgba(220,38,38,0.08)]"
                                    : document.uploaded
                                    ? `${documentCardConfig.accentClassName} shadow-[0_18px_40px_rgba(15,23,42,0.06)]`
                                    : "border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,1)_0%,rgba(241,245,249,1)_100%)]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                      document.uploaded ? documentCardConfig.iconClassName : "bg-slate-200 text-slate-500"
                                    }`}>
                                      <DocumentIcon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{document.label}</p>
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                          documentIssueSelected || rejectedIssueMatched
                                            ? "bg-red-100 text-red-700"
                                            : document.uploaded
                                              ? documentCardConfig.chipClassName
                                              : "bg-slate-200 text-slate-600"
                                        }`}>
                                          {documentIssueSelected || rejectedIssueMatched ? "Correction Flagged" : documentCardConfig.chip}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                                        {documentCardConfig.metaLabel}
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                      document.uploaded ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {document.uploaded ? "Ready" : "Missing"}
                                  </span>
                                </div>

                                <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 backdrop-blur">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Uploaded File
                                  </p>
                                  <p className="mt-2 truncate text-sm font-medium text-slate-800">
                                    {document.fileName || "No file uploaded"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {documentIssueSelected || rejectedIssueMatched
                                      ? "This file is marked for correction or recheck."
                                      : document.uploaded
                                      ? `Attached for ops verification${document.uploadedAt ? ` on ${formatDate(document.uploadedAt)}` : ""}.`
                                      : "Waiting for the agent to upload this document."}
                                  </p>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => handleTravelerDocumentView(document)}
                                    disabled={!document.uploaded}
                                    className={`inline-flex items-center rounded-2xl border px-3.5 py-2 text-sm font-semibold transition ${
                                      document.uploaded
                                        ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    <DocumentIcon className="mr-2 h-4 w-4" />
                                    View Document
                                  </button>

                                  {travelerDocumentReviewPending && document.uploaded && (
                                    <button
                                      onClick={() => toggleDocumentIssue(traveler, document)}
                                      className={`inline-flex items-center rounded-2xl border px-3.5 py-2 text-sm font-semibold transition ${
                                        documentIssueSelected
                                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      <CircleX className="mr-2 h-4 w-4" />
                                      {documentIssueSelected ? "Issue Selected" : "Mark Issue"}
                                    </button>
                                  )}
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
              </div>

              <motion.div variants={item} className="mt-6 flex justify-end gap-3">
                {canOpenQuotationBuilder && (
                  <button
                    onClick={() => {
                      handleClose();
                      navigate("/ops/quotation-builder", { state: currentBooking });
                    }}
                    className="flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 transition hover:bg-indigo-100 cursor-pointer"
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
                  className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 cursor-pointer"
                >
                  <CircleX className="h-4 w-4" />
                  Reject
                </button>

                <button
                  onClick={handleAcceptClick}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm transition ${
                    canAcceptBooking
                      ? "cursor-pointer bg-green-600 text-white hover:scale-[1.03] hover:bg-green-700 active:scale-[0.97]"
                      : "cursor-not-allowed bg-green-200 text-green-700"
                  }`}
                >
                  <CircleCheck className="h-4 w-4" />
                  {canAcceptBooking ? "Accept" : canOpenQuotationBuilder ? "Ready" : "Accepted"}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>

          <BookingDecisionModal
            isOpen={isModalOpen}
            mode={mode}
            refresh={async () => {
              await refresh();
            }}
            queryId={currentBooking._id}
            onClose={() => {
              setIsModalOpen(false);
              handleClose();
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
