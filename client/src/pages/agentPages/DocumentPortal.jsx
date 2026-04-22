import {
  Eye,
  ShieldCheck,
  ShieldAlert,
  Clock3,
  FileText,
  AlertCircle,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../../utils/Api";

const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const travelerDocumentOptions = [
  { key: "passport", label: "Passport" },
  { key: "governmentId", label: "Govt ID" },
];

const indianDestinationKeywords = [
  "india", "delhi", "jaipur", "udaipur", "goa", "kerala", "kashmir", "agra",
  "mumbai", "pune", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad",
  "shimla", "manali", "darjeeling", "rajasthan", "himachal", "andaman", "sikkim",
  "varanasi", "amritsar", "rishikesh", "ooty", "mysore", "coorg", "nainital",
  "mussoorie", "jaisalmer", "jodhpur", "pushkar", "kochi", "munnar", "alleppey",
  "leh", "ladakh", "ahmedabad", "surat", "bhopal", "indore", "dehradun",
];

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

const isIndianDestination = (destination) => {
  const normalizedDestination = String(destination || "").trim().toLowerCase();
  if (!normalizedDestination) return false;
  return indianDestinationKeywords.some((keyword) => normalizedDestination.includes(keyword));
};

const getIsInternationalTrip = (booking = {}) => {
  const explicitQuoteCategory = String(
    booking?.quotation?.quoteCategory || booking?.pricingSnapshot?.quoteCategory || booking?.invoice?.pricingSnapshot?.quoteCategory || "",
  )
    .trim()
    .toLowerCase();

  if (explicitQuoteCategory === "international") return true;
  if (explicitQuoteCategory === "domestic") return false;

  return Boolean(booking?.destination) && !isIndianDestination(booking.destination);
};

const formatTravelDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Dates pending";
  }

  const format = (value) =>
    value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return `${format(start)} - ${format(end)}`;
};

const getLeadTravelerName = (travelerDetails = []) => {
  const travelers = Array.isArray(travelerDetails) ? travelerDetails : [];
  const leadAdult = travelers.find((traveler) => traveler?.travelerType !== "Child");
  return leadAdult?.fullName || travelers[0]?.fullName || "Lead Client Pending";
};

const getIssueSummary = (issues = [], rejectionReason = "") => {
  if (Array.isArray(issues) && issues.length > 0) {
    return issues
      .map((issue) => `${issue?.travelerName || "Traveler"} - ${issue?.documentLabel || issue?.documentKey || "Document"}`)
      .join(", ");
  }

  return rejectionReason || "Corrections requested by operations";
};

const getStatusConfig = (row) => {
  if (row.reviewStatus === "Rejected") {
    return {
      label: "Correction Required",
      icon: ShieldAlert,
      className: "bg-red-100 text-red-700",
    };
  }

  if (row.hasMissingDocuments) {
    return {
      label: "Missing Documents",
      icon: ShieldAlert,
      className: "bg-amber-100 text-amber-700",
    };
  }

  if (row.reviewStatus === "Pending") {
    return {
      label: "Under Review",
      icon: Clock3,
      className: "bg-blue-100 text-blue-700",
    };
  }

  if (row.reviewStatus === "Verified") {
    return {
      label: "Verified",
      icon: ShieldCheck,
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  return {
    label: "Ready to Submit",
    icon: FileText,
    className: "bg-slate-100 text-slate-700",
  };
};

const DocumentPortal = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchRows = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/agent/active-bookings");
        const bookings = Array.isArray(data) ? data : [];

        const mappedRows = bookings.map((booking) => {
          const travelers = Array.isArray(booking?.travelerDetails) ? booking.travelerDetails : [];
          const internationalTrip = getIsInternationalTrip(booking);
          const travelerRows = travelers.map((traveler) => {
            const documents = resolveTravelerDocuments(traveler);
            const documentSlots = travelerDocumentOptions.map((option) => ({
              ...option,
              uploaded: Boolean(documents[option.key]?.url),
            }));
            const uploadedCount = documentSlots.filter((document) => document.uploaded).length;
            return {
              travelerId: traveler?._id || "",
              travelerName: traveler?.fullName || "Traveler",
              isComplete: internationalTrip ? uploadedCount === documentSlots.length : Boolean(documents.governmentId?.url),
            };
          });

          const verification = booking?.travelerDocumentVerification || { status: "Draft" };
          const hasMissingDocuments = travelerRows.some((traveler) => !traveler.isComplete);
          const reviewStatus = verification?.status || "Draft";
          const missingTravelerNames = travelerRows
            .filter((traveler) => !traveler.isComplete)
            .map((traveler) => traveler.travelerName);
          const requiredDocsLabel = internationalTrip ? "Passport and Govt ID" : "Govt ID";
          const issueSummary =
            reviewStatus === "Rejected"
              ? getIssueSummary(verification?.issues, verification?.rejectionReason)
              : hasMissingDocuments
                ? `${missingTravelerNames.join(", ") || "One or more travelers"} still have missing required ${requiredDocsLabel} uploads.`
                : "";

          return {
            _id: booking?._id,
            leadClientName: getLeadTravelerName(travelers),
            bookingReference: booking?.queryId || booking?.bookingReference || "Booking Pending",
            destination: booking?.destination || "Destination Pending",
            travelDates: formatTravelDates(booking?.startDate, booking?.endDate),
            travelersCount: travelers.length || Number(booking?.numberOfAdults || 0) + Number(booking?.numberOfChildren || 0),
            hasMissingDocuments,
            reviewStatus,
            issueSummary,
            issues: verification?.issues || [],
          };
        });

        setRows(mappedRows);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || "Unable to load traveler document tracker right now.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        if (row.reviewStatus === "Verified") acc.verified += 1;
        else if (row.reviewStatus === "Pending") acc.reviewing += 1;
        else if (row.reviewStatus === "Rejected" || row.hasMissingDocuments) acc.actionRequired += 1;
        else acc.ready += 1;
        return acc;
      },
      { verified: 0, reviewing: 0, actionRequired: 0, ready: 0 },
    );
  }, [rows]);

  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = rows.slice(startIndex, startIndex + itemsPerPage);

  return (
    <motion.section
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-4 p-1"
    >
      <motion.header variants={itemVariant} className="relative z-10 flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-1 py-1 shadow-sm">
        <div className="space-y-1 p-2">
          <h1 className="text-2xl font-bold">Document Portal</h1>
          <p className="text-sm text-gray-500">
            Track traveler document readiness booking-wise and jump straight to the upload screen when corrections are needed.
          </p>
        </div>
      </motion.header>

      <motion.div variants={itemVariant} className="grid gap-4 md:grid-cols-4">
        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Verified</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.verified}</p>
          <p className="mt-1 text-xs text-slate-500">Bookings fully cleared by ops</p>
        </div>
        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Under Review</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{summary.reviewing}</p>
          <p className="mt-1 text-xs text-slate-500">Submitted and waiting for ops</p>
        </div>
        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Action Required</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{summary.actionRequired}</p>
          <p className="mt-1 text-xs text-slate-500">Missing files or correction requests</p>
        </div>
        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Ready to Submit</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{summary.ready}</p>
          <p className="mt-1 text-xs text-slate-500">All files uploaded, waiting for agent submission</p>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariant}
          className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}

      <motion.div variants={itemVariant} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-slate-100 bg-white px-4 py-4">
          <h2 className="font-semibold text-md">Traveler Document Tracker</h2>
          <p className="text-xs text-gray-500">
            Only the lead client name is shown here. Click `View` to open the booking-level upload screen for the full traveler set.
          </p>
        </div>

        <div className="custom-scroll overflow-x-auto overflow-y-visible rounded-xl bg-white">
          <table className="w-full min-w-[1080px] table-fixed text-xs">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[15%]" />
              <col className="w-[13%]" />
              <col className="w-[16%]" />
              <col className="w-[22%]" />
              <col className="w-[10%]" />
            </colgroup>

            <thead className="sticky top-0 z-10 border-b border-b-gray-300 bg-white text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Lead Client</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Booking Ref</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Trip</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Travelers</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Document Status</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Issue Summary</th>
                <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-2 py-12 text-center text-sm text-gray-400">
                    Loading document tracker...
                  </td>
                </tr>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row) => {
                  const status = getStatusConfig(row);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={row._id}>
                      <td className="px-4 py-4 align-center">
                        <div>
                          <p className="font-medium leading-5 text-slate-800 wrap-break-words">{row.leadClientName}</p>
                          <p className=" text-[11px] leading-4 text-slate-400 wrap-break-words">{row.destination}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-center">
                        <span className="inline-flex max-w-full rounded-xl border border-gray-300 px-2.5 py-1 text-xs leading-4 break-all">
                          {row.bookingReference}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-center text-slate-500">
                        <p className="whitespace-nowrap leading-5">{row.travelDates}</p>
                      </td>
                      <td className="px-4 py-4 align-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-700 leading-4">
                          <Users className="h-3.5 w-3.5" />
                          {row.travelersCount} Travelers
                        </span>
                      </td>
                      <td className="px-2 py-4 align-center">
                        <span className={`inline-flex w-fit max-w-full items-center gap-1 rounded-full px-3 py-1 text-xs font-medium leading-4 ${status.className}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-1 py-2 align-center ">
                        <p className="text-xs leading-4 text-slate-500 break-words">
                          {row.reviewStatus === "Rejected" || row.hasMissingDocuments
                            ? row.issueSummary
                            : row.reviewStatus === "Pending"
                              ? "Operations is currently reviewing the uploaded traveler documents."
                              : row.reviewStatus === "Verified"
                                ? "All traveler documents have been approved by operations."
                                : "Files are uploaded. Submit them from Active Bookings when ready."}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-center text-right">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            navigate("/agent/bookings", {
                              state: {
                                openBookingId: row._id,
                                documentIssues: row.issues,
                                issueSummary: row.issueSummary,
                                reviewStatus: row.reviewStatus,
                              },
                            })
                          }
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-800 transition hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </motion.button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-2 py-12 text-center text-sm text-gray-400">
                    No active booking documents are available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-2 pt-4 sm:flex-row">
            <span className="text-xs font-medium text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, rows.length)} of {rows.length} entries
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

      <motion.div
        variants={itemVariant}
        className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800"
      >
        <ShieldCheck size={18} />
        <p>
          <strong>Portal Note:</strong> Upload actions are handled only from <strong>Active Bookings</strong> now.
          This page is for booking-wise tracking, verification status, and quick navigation to the correct correction screen.
        </p>
      </motion.div>
    </motion.section>
  );
};

export default DocumentPortal;
