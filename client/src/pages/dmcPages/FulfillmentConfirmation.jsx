import {
  FileText,
  Upload,
  Plus,
  CheckCircle,
  AlertCircle,
  Phone,
  Building2,
  Trash2,
  Layers3,
  CalendarDays,
  MapPin,
  Users,
  Briefcase,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Download,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RotatingLines } from "react-loader-spinner";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import API from "../../utils/Api.js";
import InternalInvoice from "./InternalInvoice";

const createEmptyService = () => ({
  referenceServiceKey: "",
  type: "Hotel",
  serviceName: "",
  serviceDate: "",
  status: "Confirmed",
  confirmationNumber: "",
  voucherNumber: "",
  emergency: "",
});

const serviceTypeLabel = (type) => {
  const normalized = (type || "").toLowerCase();
  if (normalized === "hotel") return "Hotel";
  if (
    normalized === "transfer" ||
    normalized === "transport" ||
    normalized === "car"
  )
    return "Transport";
  if (normalized === "activity") return "Activity";
  if (normalized === "sightseeing") return "Sightseeing";
  if (normalized === "flight") return "Flight";
  return type || "Service";
};

const formatServiceMoney = (currency, amount) => {
  const value = Number(amount || 0);
  return `${currency || "INR"} ${value.toLocaleString("en-IN")}`;
};

const formatServiceDate = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const DEFAULT_HOTEL_CHECK_IN_TIME = "14:00";
const DEFAULT_HOTEL_CHECK_OUT_TIME = "11:00";
const travelerDocumentOptions = [
  { key: "passport", label: "Passport" },
  { key: "governmentId", label: "Govt ID" },
];

const formatServiceTime = (value) => {
  if (!value) return "";

  const trimmedValue = String(value).trim();
  const normalizedValue = trimmedValue.toUpperCase();

  if (/[AP]M$/.test(normalizedValue)) {
    return normalizedValue.replace(/\s+/g, " ");
  }

  const match = trimmedValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return trimmedValue;

  const hours = Number(match[1]);
  const minutes = match[2];
  if (Number.isNaN(hours) || hours > 23) return trimmedValue;

  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 || 12;
  return `${twelveHour}:${minutes} ${period}`;
};

const formatServiceDateTime = (dateValue, timeValue, fallbackTimeValue = "") => {
  if (!dateValue) return "-";

  const dateLabel = formatServiceDate(dateValue);
  const timeLabel = formatServiceTime(timeValue || fallbackTimeValue);

  return timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel;
};

const normalizeTravelerDocument = (document = {}) => ({
  url: String(document?.url || "").trim(),
  fileName: String(document?.fileName || "").trim(),
  mimeType: String(document?.mimeType || "").trim(),
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

const buildCloudinaryAttachmentUrl = (url, fileName = "document") => {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl || !normalizedUrl.includes("/res.cloudinary.com/")) return normalizedUrl;
  if (!normalizedUrl.includes("/upload/")) return normalizedUrl;
  const encodedFileName = encodeURIComponent(String(fileName || "document"));
  return normalizedUrl.replace("/upload/", `/upload/fl_attachment:${encodedFileName}/`);
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

const formatDocumentDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDocumentSize = (value) => {
  const size = Number(value || 0);
  if (!size) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FulfillmentConfirmation() {
  const [confirmedQueries, setConfirmedQueries] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showTravelerDocsModal, setShowTravelerDocsModal] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState("");
  const [services, setServices] = useState([createEmptyService()]);
  const [activeTab, setActiveTab] = useState("confirmation");
  const [files, setFiles] = useState({
    supplier: null,
    voucher: null,
    terms: null,
  });
  const [loading, setLoading] = useState({
    supplier: false,
    voucher: false,
    terms: false,
  });
  const [successPopup, setSuccessPopup] = useState({
    open: false,
    status: "submitted",
    queryId: "",
    serviceCount: 0,
  });

  const queryServices = useMemo(
    () => selectedQuery?.services || [],
    [selectedQuery],
  );

  const referenceServices = useMemo(
    () =>
      queryServices.map((service, index) => ({
        ...service,
        referenceServiceKey: `${index}-${service.serviceName || "service"}`,
        resolvedServiceDate: service.serviceDate || "",
        resolvedCheckInDate: service.checkInDate || "",
        resolvedCheckOutDate: service.checkOutDate || "",
        resolvedCheckInTime: service.checkInTime || "",
        resolvedCheckOutTime: service.checkOutTime || "",
        resolvedServiceEndDate: service.serviceEndDate || service.serviceDate || "",
      })),
    [queryServices],
  );

  const voucherGeneratedNote = useMemo(() => {
    if (!selectedQuery?.isVoucherGenerated) return null;

    return selectedQuery?.voucherNumber
      ? `A voucher has already been generated for all mapped services in this query. Voucher No. ${selectedQuery.voucherNumber} is already active in the ops workflow.`
      : "A voucher has already been generated for all mapped services in this query and is already active in the ops workflow.";
  }, [selectedQuery]);

  const travelerDocumentVerification = useMemo(
    () => selectedQuery?.travelerDocumentVerification || { status: "Draft", issues: [] },
    [selectedQuery],
  );

  const travelerProfiles = useMemo(
    () =>
      (selectedQuery?.travelerDetails || []).map((traveler, index) => {
        const documents = resolveTravelerDocuments(traveler);
        const documentSlots = travelerDocumentOptions.map((option) => ({
          key: option.key,
          label: option.label,
          ...documents[option.key],
          uploaded: Boolean(documents[option.key]?.url),
        }));

        return {
          id: traveler?.id || traveler?._id || `traveler-${index + 1}`,
          fullName: traveler?.fullName || `Traveler ${index + 1}`,
          travelerType: traveler?.travelerType === "Child" ? "Child" : "Adult",
          childAge: traveler?.childAge ?? null,
          documentSlots,
          uploadedCount: documentSlots.filter((document) => document.uploaded).length,
        };
      }),
    [selectedQuery],
  );

  const uploadedTravelerDocumentCount = useMemo(
    () =>
      travelerProfiles.reduce(
        (total, traveler) => total + traveler.documentSlots.filter((item) => item.uploaded).length,
        0,
      ),
    [travelerProfiles],
  );

  const travelersReadyForSupplierHandoff = useMemo(
    () => travelerProfiles.filter((traveler) => traveler.uploadedCount > 0).length,
    [travelerProfiles],
  );

  const resetConfirmationForm = () => {
    setServices([createEmptyService()]);
    setFiles({
      supplier: null,
      voucher: null,
      terms: null,
    });
    setLoading({
      supplier: false,
      voucher: false,
      terms: false,
    });
  };

  const moveToNextQueryAfterSubmit = () => {
    setSelectedQueryId("");
    setSelectedQuery(null);
    setShowTravelerDocsModal(false);
    resetConfirmationForm();
  };

  const addService = () => {
    setServices((prev) => {
      const sharedEmergency =
        prev.find((service) => service.emergency?.trim())?.emergency || "";

      return [
        ...prev,
        {
          ...createEmptyService(),
          emergency: sharedEmergency,
        },
      ];
    });
  };

  const removeService = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFile = (type, file) => {
    setLoading((prev) => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setFiles((prev) => ({ ...prev, [type]: file }));
      setLoading((prev) => ({ ...prev, [type]: false }));
    }, 1500);
  };

  const handleChange = (index, field, value) => {
    setServices((prev) => {
      const updated = [...prev];

      if (field === "emergency") {
        return updated.map((service) => ({
          ...service,
          emergency: value,
        }));
      }

      updated[index][field] = value;
      return updated;
    });
  };

  const handleReferenceServiceSelect = (index, referenceKey) => {
    const selectedReference = referenceServices.find(
      (service) => service.referenceServiceKey === referenceKey,
    );

    setServices((prev) => {
      const updated = [...prev];
      const current = updated[index];

      if (!selectedReference) {
        updated[index] = {
          ...current,
          referenceServiceKey: "",
        };
        return updated;
      }

      updated[index] = {
        ...current,
        referenceServiceKey: selectedReference.referenceServiceKey,
        type: serviceTypeLabel(selectedReference.type),
        serviceName: selectedReference.serviceName || current.serviceName,
        serviceDate:
          selectedReference.resolvedServiceDate || current.serviceDate,
      };

      return updated;
    });
  };

  const hydrateSelectedQuery = (query) => {
    setSelectedQueryId(query?._id || "");
    setSelectedQuery(query || null);
    setShowTravelerDocsModal(false);
    setServices([createEmptyService()]);
  };

  useEffect(() => {
    const fetchConfirmedQueries = async () => {
      try {
        const res = await API.get("/dmc/confirmation/queries");
        const queries = res.data?.data || [];
        setConfirmedQueries(queries);

        const firstQuery = queries[0] || null;
        setSelectedQueryId(firstQuery?._id || "");
        setSelectedQuery(firstQuery);
        setServices([createEmptyService()]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load confirmed queries");
      }
    };

    fetchConfirmedQueries();
  }, []);

  const handleSubmit = async (finalStatus) => {
    try {
      if (!files.supplier) {
        return toast.error("Supplier Confirmation file is mandatory");
      }

      if (!selectedQuery) {
        return toast.error("Please select a confirmed query");
      }

      for (let i = 0; i < services.length; i += 1) {
        const service = services[i];
        if (
          !service.type ||
          !service.serviceName ||
          !service.serviceDate ||
          !service.status ||
          !service.confirmationNumber ||
          !service.emergency
        ) {
          return toast.error(
            `Please fill all required fields in Service ${i + 1}`,
          );
        }
      }

      const formData = new FormData();
      formData.append("queryId", selectedQuery?.queryId || "");
      formData.append("services", JSON.stringify(services));
      formData.append(
        "emergencyContact",
        JSON.stringify(services.map((service) => service.emergency)),
      );
      formData.append("status", finalStatus);
      formData.append("supplierConfirmation", files.supplier);

      if (files.voucher) {
        formData.append("voucherReference", files.voucher);
      }

      if (files.terms) {
        formData.append("termsConditions", files.terms);
      }

      const res = await API.post("/dmc/confirmation", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Confirmation:", res.data);
      setSuccessPopup({
        open: true,
        status: finalStatus,
        queryId: selectedQuery?.queryId || "",
        serviceCount: services.length,
      });

      if (finalStatus === "submitted") {
        moveToNextQueryAfterSubmit();
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while saving confirmation");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-700 border-green-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-400";
      case "Waitlisted":
        return "bg-red-100 text-red-700 border-red-400";
      default:
        return "bg-gray-100";
    }
  };

  const handleTravelerDocumentOpen = (traveler, document) => {
    if (!document?.url) {
      toast.error(`No ${document?.label || "document"} uploaded for ${traveler?.fullName || "this traveler"} yet.`);
      return;
    }

    const documentTarget = getDocumentOpenTarget(document);

    if (documentTarget.isPdf) {
      toast("Opening a preview image of page one because direct PDF delivery can be restricted on this Cloudinary setup.");
    }

    window.open(documentTarget.url, "_blank", "noopener,noreferrer");
  };

  const handleTravelerDocumentDownload = async (traveler, travelerDocument) => {
    if (!travelerDocument?.url) {
      toast.error(`No ${travelerDocument?.label || "document"} available to download for ${traveler?.fullName || "this traveler"}.`);
      return;
    }

    const fileName =
      travelerDocument.fileName ||
      `${traveler?.fullName || "traveler"}-${travelerDocument?.label || "document"}`;
    const downloadId = `${traveler.id}-${travelerDocument.key}`;

    try {
      setDownloadingDocumentId(downloadId);

      const response = await fetch(travelerDocument.url, {
        method: "GET",
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      toast.success(`${travelerDocument.label} downloaded successfully.`);
    } catch (error) {
      console.error("Document download failed", error);

      const fallbackUrl = buildCloudinaryAttachmentUrl(travelerDocument.url, fileName);
      const link = window.document.createElement("a");
      link.href = fallbackUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast("Trying a direct attachment download because the file stream was blocked.");
    } finally {
      setDownloadingDocumentId("");
    }
  };

  return (
    <>
      <div className="p- bg-[#F5F7FB] min-h-screen">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-slate-900">
            Fulfillment & Confirmation Entry
          </h1>
          <p className="text-sm text-slate-500">
            DMC Partner: manage confirmation numbers, service references, and
            local support details
          </p>
        </div>

        <div className="mb-5 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/80">
                  Booked Context
                </p>
                <h2 className="text-lg font-semibold mt-1">
                  {selectedQuery?.queryId || "Select a confirmed query"}
                </h2>
                <p className="text-xs text-blue-100/80 mt-1">
                  Use the booking summary below as reference, then add
                  confirmation cards when needed.
                </p>
              </div>

              <div className="min-w-[260px]">
                <label className="text-[11px] uppercase tracking-[0.18em] text-blue-100/80 block mb-2">
                  Confirmed Query
                </label>
                <select
                  value={selectedQueryId}
                  onChange={(e) => {
                    const selected = confirmedQueries.find(
                      (query) => query._id === e.target.value,
                    );
                    hydrateSelectedQuery(selected || null);
                  }}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none"
                >
                  <option value="" className="text-slate-900">
                    Select a confirmed query
                  </option>
                  {confirmedQueries.map((query) => (
                    <option
                      key={query._id}
                      value={query._id}
                      className="text-slate-900"
                    >
                      {query.queryId} - {query.destination}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid lg:grid-cols-4 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide">
                  <Briefcase size={14} />
                  Agent
                </div>
                <p className="text-sm font-medium text-slate-800 mt-2">
                  {selectedQuery?.agentName || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide">
                  <MapPin size={14} />
                  Destination
                </div>
                <p className="text-sm font-medium text-slate-800 mt-2">
                  {selectedQuery?.destination || "-"}
                </p>
              </div>
              <button
  type="button"
  onClick={() => selectedQuery && setShowTravelerDocsModal(true)}
  className={`group relative rounded-2xl border px-4 py-3 text-left overflow-hidden transition-all duration-300 ${
    selectedQuery
      ? "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 hover:border-blue-400 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_8px_24px_rgba(99,102,241,0.14)] cursor-pointer"
      : "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
  }`}
>
  {/* Animated shimmer on hover */}
  {selectedQuery && (
    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
  )}
 
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide">
      <Users size={14} className={selectedQuery ? "text-blue-500" : ""} />
      Pax
    </div>
    {selectedQuery && (
      <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
        <ExternalLink size={9} />
        View Docs
      </span>
    )}
  </div>
 
  <p className="text-sm font-semibold text-slate-800 mt-2">
    {selectedQuery?.passengers || 0} PAX
  </p>
 
  <div className="mt-2 flex items-center gap-1.5">
    <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${selectedQuery ? "bg-blue-500" : "bg-slate-300"}`} />
    <p className="text-[9px] text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
      {selectedQuery ? "Click to open traveler documents" : "Select a query first"}
    </p>
  </div>
</button>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide">
                  <CalendarDays size={14} />
                  Duration
                </div>
                <p className="text-sm font-medium text-slate-800 mt-2">
                  {selectedQuery?.duration || "-"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Layers3 size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                     Booked Services
                  </p>
                  <p className="text-xs text-slate-500">
                    Reference only. Add confirmation cards from this list as
                    needed.
                  </p>
                </div>
              </div>

              {selectedQueryId && queryServices.length > 0 ? (
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  {referenceServices.map((service, index) => (
                    <div
                      key={`${service.serviceName}-${index}`}
                      className="rounded-xl border border-blue-100 bg-white/95 p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-900">
                            {service.serviceName}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {(service.city || service.country)
                              ? [service.city, service.country].filter(Boolean).join(", ")
                              : "Location mapped in quotation"}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-600">
                          {serviceTypeLabel(service.type)}
                        </span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[9px] uppercase tracking-wide text-slate-500">
                            Service Start
                          </p>
                          <p className="mt-1 text-[13px] font-semibold text-slate-900">
                            {formatServiceDate(service.resolvedServiceDate)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[9px] uppercase tracking-wide text-slate-500">
                            {String(service.type || "").toLowerCase() === "hotel"
                              ? "Booked Qty"
                              : "Quantity"}
                          </p>
                          <p className="mt-1 text-[13px] font-semibold text-slate-900">
                            {service.quantityLabel || "-"}
                          </p>
                        </div>

                        {String(service.type || "").toLowerCase() === "hotel" ? (
                          <>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <p className="text-[9px] uppercase tracking-wide text-slate-500">
                                Stay Duration
                              </p>
                              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                {service.stayLabel || "-"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <p className="text-[9px] uppercase tracking-wide text-slate-500">
                                Check-in
                              </p>
                              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                {formatServiceDateTime(
                                  service.checkInDate || service.resolvedCheckInDate,
                                  service.checkInTime || service.resolvedCheckInTime,
                                  DEFAULT_HOTEL_CHECK_IN_TIME,
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <p className="text-[9px] uppercase tracking-wide text-slate-500">
                                Check-out
                              </p>
                              <p className="mt-1 text-[13px] font-semibold text-slate-900">
                                {formatServiceDateTime(
                                  service.checkOutDate || service.resolvedCheckOutDate,
                                  service.checkOutTime || service.resolvedCheckOutTime,
                                  DEFAULT_HOTEL_CHECK_OUT_TIME,
                                )}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                            <p className="text-[9px] uppercase tracking-wide text-slate-500">
                              Service End
                            </p>
                            <p className="mt-1 text-[13px] font-semibold text-slate-900">
                              {formatServiceDate(service.serviceEndDate || service.resolvedServiceEndDate)}
                            </p>
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                          <p className="text-[9px] uppercase tracking-wide text-slate-500">
                            Unit Rate
                          </p>
                          <p className="mt-1 text-[13px] font-semibold text-slate-900">
                            {formatServiceMoney(service.currency, service.rate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.16em] text-blue-700/70">
                              Cost Breakdown
                            </p>
                            <p className="mt-1 text-[11px] leading-4 text-slate-600">
                              {service.calculationText || "Pricing mapped from quotation"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-wide text-slate-500">
                              Total
                            </p>
                            <p className="mt-1 text-[13px] font-semibold text-slate-900">
                              {formatServiceMoney(service.currency, service.total)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="mt-2.5 text-[11px] leading-4 text-slate-500">
                        Only services mapped to your DMC are shown here. Add confirmation below when available.
                      </p>
                    </div>
                  ))}
                </div>
              ) : selectedQueryId ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm text-slate-500">
                  No services from your DMC are mapped to this booking.
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm text-slate-500">
                  Select a confirmed query to view only the services assigned to your DMC.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative mb-6 flex h-10 items-center overflow-hidden rounded-full bg-slate-200 p-3 text-xs">
          <button
            onClick={() => setActiveTab("confirmation")}
            className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl py-1.5 transition-colors duration-200 ${
              activeTab === "confirmation"
                ? "font-medium text-slate-900"
                : "text-slate-600"
            }`}
          >
            {activeTab === "confirmation" && (
              <motion.span
                layoutId="fulfillment-tab-pill"
                className="absolute inset-0 rounded-2xl bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">Confirmation Entry</span>
          </button>

          <button
            onClick={() => setActiveTab("invoice")}
            className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl py-1.5 transition-colors duration-200 ${
              activeTab === "invoice"
                ? "font-medium text-slate-900"
                : "text-slate-600"
            }`}
          >
            {activeTab === "invoice" && (
              <motion.span
                layoutId="fulfillment-tab-pill"
                className="absolute inset-0 rounded-2xl bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">$ Internal Invoice</span>
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "confirmation" && (
            <motion.div
              key="confirmation-tab-panel"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
            <div className="p-5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3">
              <div>
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText size={18} />
                  Service Confirmation & Emergency Support Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Add service cards below as needed. Use the booking services
                  panel above as reference.
                </p>
                {voucherGeneratedNote && (
                  <div className="mt-3 flex max-w-3xl items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                      <CheckCircle size={12} />
                    </span>
                    <p className="leading-5">{voucherGeneratedNote}</p>
                  </div>
                )}
              </div>

              <button
                onClick={addService}
                className="flex items-center gap-2 border border-slate-300 rounded-2xl px-4 py-2 text-sm cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <Plus size={16} />
                Add Service
              </button>
            </div>

            <div className="p-5">
              <p className="mb-3 flex items-center gap-2 text-md font-bold text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Layers3 size={15} />
                </span>
                Service Cards
              </p>

              {services.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No services added yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Select a query and click `Add Service` to start entering confirmation details.
                  </p>
                </div>
              ) : (
                services.map((service, index) => (
                <div
                  key={index}
                  className="border border-slate-200 bg-gradient-to-br from-white to-slate-50 rounded-[28px] p-5 flex flex-col mb-4 relative shadow-sm"
                >
                  {services.length > 1 && (
                    <button
                      onClick={() => removeService(index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                    <div className="bg-blue-100 p-2 rounded-xl">
                      <Building2 size={14} />
                    </div>
                    <span>Service {index + 1}</span>
                    <span className="text-[10px] text-green-700 bg-green-50 border border-green-300 px-4 rounded-2xl">
                      {service.type.toUpperCase()}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {selectedQueryId && referenceServices.length > 0 && (
                    <motion.div
                      key={`reference-${index}`}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="mb-4"
                    >
                      <label className="text-xs font-medium text-slate-500">
                        Booked Service Reference
                      </label>
                      <div className="relative mt-1">
                        <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                          <Briefcase size={15} />
                        </div>
                        <select
                          value={service.referenceServiceKey || ""}
                          onChange={(e) =>
                            handleReferenceServiceSelect(index, e.target.value)
                          }
                          className="w-full appearance-none rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-cyan-50/70 py-2.5 pl-14 pr-12 text-xs font-medium text-slate-700 shadow-sm outline-none transition-all duration-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Select booked service</option>
                          {referenceServices.map((reference) => (
                            <option
                              key={reference.referenceServiceKey}
                              value={reference.referenceServiceKey}
                            >
                              {reference.serviceName} | {serviceTypeLabel(reference.type)} | {formatServiceDate(reference.resolvedServiceDate)}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm">
                          <ChevronDown size={15} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                  <AnimatePresence initial={false}>
                    {service.serviceDate && (
                    <motion.div
                      key={`service-date-${index}-${service.serviceDate}`}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.24, ease: "easeOut" }}
                      className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-blue-700/70">
                        Service Start Date
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatServiceDate(service.serviceDate)}
                      </p>
                    </motion.div>
                  )}
                  </AnimatePresence>

                  <div className="grid grid-cols-4 items-center gap-4 mb-4">
                    <div>
                      <label className="text-xs text-slate-700 font-semibold">Type <span className="text-red-500">*</span></label>
                      <select
                        value={service.type}
                        onChange={(e) =>
                          handleChange(index, "type", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded-2xl p-2 text-xs outline-none"
                      >
                        <option>Hotel</option>
                        <option>Flight</option>
                        <option>Transport</option>
                        <option>Activity</option>
                        <option>Sightseeing</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 font-semibold">
                        Service Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={service.serviceName}
                        onChange={(e) =>
                          handleChange(index, "serviceName", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded-2xl p-2 text-xs outline-none"
                        placeholder="e.g. Grand Hyatt Bali"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 font-semibold">
                        Service Date <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center border border-slate-300 rounded-2xl p-2">
                        <input
                          type="date"
                          value={service.serviceDate}
                          onChange={(e) =>
                            handleChange(index, "serviceDate", e.target.value)
                          }
                          className="flex-1 outline-none text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 font-semibold">Status <span className="text-red-500">*</span></label>
                      <select
                        value={service.status}
                        onChange={(e) =>
                          handleChange(index, "status", e.target.value)
                        }
                        className={`w-full border border-slate-300 rounded-2xl p-2 outline-none text-xs transition-all duration-200 ${getStatusColor(service.status)}`}
                      >
                        <option>Confirmed</option>
                        <option>Pending</option>
                        <option>Waitlisted</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="mt-0.5">
                      <label className="text-xs flex items-center gap-1 text-slate-600 font-semibold">
                        <AlertCircle size={14} className="text-red-700" />
                        Confirmation Number{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={service.confirmationNumber}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "confirmationNumber",
                            e.target.value,
                          )
                        }
                        className="w-full border border-slate-300 rounded-2xl p-2.5 text-xs mt-1 outline-none"
                        placeholder="e.g. HTL-ABC-12345"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-700 font-semibold">
                        Voucher Reference
                      </label>
                      <input
                        value={service.voucherNumber}
                        onChange={(e) =>
                          handleChange(index, "voucherNumber", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded-2xl p-2.5 text-xs outline-none"
                        placeholder="Optional voucher reference"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                    <div className="flex-1 ">
                      <div className="flex items-center gap-3">
                      <Phone size={17} className="text-amber-600" />
                      <label className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        Emergency Contact Details (24/7 Local Support) <span className="text-red-500">*</span>
                      </label>
                        </div>
                      <textarea
                        rows="3"
                        value={service.emergency}
                        onChange={(e) =>
                          handleChange(index, "emergency", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded-xl p-2 text-xs mt-2 outline-none"
                        placeholder="Enter local support contact, phone number, and backup contact details"
                      />
                    </div>
                  </div>
                </div>
                ))
              )}

              <div className="mt-6">
                <p className="text-sm text-slate-500 mb-3">
                  Document Upload Vault
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="border-2 border-dashed flex flex-col items-center border-blue-300 rounded-2xl p-6 text-center bg-blue-50">
                    {loading.supplier ? (
                      <RotatingLines
                        width="30"
                        strokeColor="#3b82f6"
                        strokeWidth="4"
                        animationDuration="0.75"
                        className="text-center"
                      />
                    ) : (
                      <Upload className="mx-auto mb-2 text-blue-500" />
                    )}
                    <p className="text-sm font-medium">
                      Upload Supplier Confirmation
                    </p>
                    <p className="text-xs text-slate-400 mb-2">
                      PDF, Word, Excel accepted
                    </p>
                    {files.supplier && (
                      <p className="text-xs text-green-600 mb-2">
                        {files.supplier.name}
                      </p>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      id="supplierUpload"
                      onChange={(e) =>
                        handleFile("supplier", e.target.files[0])
                      }
                    />
                    <button
                      onClick={() =>
                        document.getElementById("supplierUpload").click()
                      }
                      className="mt-1 text-xs border border-slate-300 rounded-xl px-3 py-1 bg-white"
                    >
                      Choose File
                    </button>
                  </div>

                  <div className="border-2 border-dashed flex flex-col items-center border-green-300 rounded-2xl p-6 text-center bg-green-50">
                    {loading.voucher ? (
                      <RotatingLines
                        width="30"
                        strokeColor="#22c55e"
                        strokeWidth="4"
                        animationDuration="0.75"
                      />
                    ) : (
                      <Upload className="mx-auto mb-2 text-green-500" />
                    )}
                    <p className="text-sm font-medium">
                      Upload Voucher Reference
                    </p>
                    <p className="text-xs text-slate-400 mb-2">
                      PDF, Word, Excel accepted
                    </p>
                    {files.voucher && (
                      <p className="text-xs text-green-600 mb-2">
                        {files.voucher.name}
                      </p>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      id="voucherUpload"
                      onChange={(e) => handleFile("voucher", e.target.files[0])}
                    />
                    <button
                      onClick={() =>
                        document.getElementById("voucherUpload").click()
                      }
                      className="mt-1 text-xs border border-slate-300 rounded-xl px-3 py-1 bg-white"
                    >
                      Choose File
                    </button>
                  </div>

                  <div className="border-2 border-dashed flex flex-col items-center border-purple-300 rounded-2xl p-6 text-center bg-purple-50">
                    {loading.terms ? (
                      <RotatingLines
                        width="30"
                        strokeColor="#a855f7"
                        strokeWidth="4"
                        animationDuration="0.75"
                      />
                    ) : (
                      <Upload className="mx-auto mb-2 text-purple-500" />
                    )}
                    <p className="text-sm font-medium">
                      Upload Terms & Conditions
                    </p>
                    <p className="text-xs text-slate-400 mb-2">
                      PDF, Word, Excel accepted
                    </p>
                    {files.terms && (
                      <p className="text-xs text-green-600 mb-2">
                        {files.terms.name}
                      </p>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      id="termsUpload"
                      onChange={(e) => handleFile("terms", e.target.files[0])}
                    />
                    <button
                      onClick={() =>
                        document.getElementById("termsUpload").click()
                      }
                      className="mt-1 text-xs border border-slate-300 rounded-xl px-3 py-1 bg-white"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-200">
              <p className="text-xs text-red-500 px-5 pb-3 mt-3">
                * All mandatory fields (*) must be completed before submission
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSubmit("draft")}
                  className="border border-slate-300 px-4 py-2 rounded-xl text-sm bg-white cursor-pointer"
                >
                  Save as Draft
                </button>

                <button
                  onClick={() => handleSubmit("submitted")}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm cursor-pointer"
                >
                  <CheckCircle size={16} />
                  Submit Confirmation
                </button>
              </div>
            </div>
            </motion.div>
          )}

          {activeTab === "invoice" && (
            <motion.div
              key="invoice-tab-panel"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <InternalInvoice
                key={selectedQueryId || "invoice-default"}
                selectedQuery={selectedQuery}
                queryServices={referenceServices}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
       // ============================================================
// PATCH 2 — Traveler Documents Modal (AnimatePresence ke andar)
// ============================================================
// Poora showTravelerDocsModal block replace karein:
 
{showTravelerDocsModal && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
    style={{
      background: "rgba(10,14,30,0.60)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}
  >
    <div className="absolute inset-0" onClick={() => setShowTravelerDocsModal(false)} />

    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.975 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex max-h-[96vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
      style={{
        background: "linear-gradient(145deg, #eef4ff 0%, #f5f8ff 30%, #edfcf4 65%, #f0f9ff 100%)",
        border: "1px solid rgba(148,193,255,0.35)",
        boxShadow: "0 32px 80px rgba(15,23,42,0.20), 0 0 0 1px rgba(255,255,255,0.7)",
      }}
    >
      {/* Top navy accent bar */}
      <div className="h-1 w-full flex-shrink-0"
        style={{ background: "linear-gradient(90deg, #1e3a8a, #2563eb, #3b82f6, #0891b2)" }} />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-4 px-6 py-5"
        style={{
          borderBottom: "1px solid rgba(148,193,255,0.25)",
          background: "linear-gradient(135deg, rgba(219,234,254,0.55) 0%, rgba(255,255,255,0.60) 55%, rgba(209,250,229,0.35) 100%)",
          backdropFilter: "blur(8px)",
        }}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
              boxShadow: "0 4px 14px rgba(37,99,235,0.32)",
            }}>
            <Users size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] font-bold"
              style={{ color: "#2563eb" }}>
              PAX Document Vault
            </p>
            <h3 className="text-xl font-bold leading-tight mt-0.5 text-slate-900">
              Traveler Files
            </h3>
            <p className="text-xs mt-0.5 text-slate-400">
              {selectedQuery?.queryId} · {selectedQuery?.destination}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              background:
                travelerDocumentVerification.status === "Verified" ? "rgba(220,252,231,0.85)" :
                travelerDocumentVerification.status === "Pending"  ? "rgba(254,249,195,0.85)" :
                travelerDocumentVerification.status === "Rejected" ? "rgba(254,226,226,0.85)" : "rgba(241,245,249,0.85)",
              color:
                travelerDocumentVerification.status === "Verified" ? "#15803d" :
                travelerDocumentVerification.status === "Pending"  ? "#a16207" :
                travelerDocumentVerification.status === "Rejected" ? "#b91c1c" : "#64748b",
              border: `1px solid ${
                travelerDocumentVerification.status === "Verified" ? "#bbf7d0" :
                travelerDocumentVerification.status === "Pending"  ? "#fde047" :
                travelerDocumentVerification.status === "Rejected" ? "#fecaca" : "#e2e8f0"
              }`,
              backdropFilter: "blur(6px)",
            }}>
            <span className={`h-1.5 w-1.5 rounded-full ${travelerDocumentVerification.status !== "Rejected" ? "animate-pulse" : ""}`}
              style={{
                background:
                  travelerDocumentVerification.status === "Verified" ? "#16a34a" :
                  travelerDocumentVerification.status === "Pending"  ? "#ca8a04" :
                  travelerDocumentVerification.status === "Rejected" ? "#dc2626" : "#94a3b8",
              }} />
            {travelerDocumentVerification.status || "Draft"}
          </span>

          <button
            onClick={() => setShowTravelerDocsModal(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition"
            style={{
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(148,193,255,0.35)",
              color: "#94a3b8",
              backdropFilter: "blur(6px)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(219,234,254,0.80)";
              e.currentTarget.style.borderColor = "#bfdbfe";
              e.currentTarget.style.color = "#2563eb";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.65)";
              e.currentTarget.style.borderColor = "rgba(148,193,255,0.35)";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3"
        style={{
          borderBottom: "1px solid rgba(148,193,255,0.22)",
          background: "linear-gradient(90deg, rgba(219,234,254,0.40) 0%, rgba(240,249,255,0.30) 50%, rgba(209,250,229,0.30) 100%)",
        }}>
        {[
          { label: "Travelers",      value: travelerProfiles.length,                              icon: <Users size={13} />,       color: "#2563eb", bg: "rgba(219,234,254,0.60)" },
          { label: "Files Ready",    value: uploadedTravelerDocumentCount,                        icon: <Download size={13} />,    color: "#0891b2", bg: "rgba(207,250,254,0.60)" },
          { label: "Supplier Ready", value: `${travelersReadyForSupplierHandoff}/${travelerProfiles.length}`, icon: <CheckCircle size={13} />, color: "#059669", bg: "rgba(209,250,229,0.60)" },
        ].map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-3 px-5 py-3.5"
            style={{ borderRight: i < 2 ? "1px solid rgba(148,193,255,0.22)" : "none" }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
              style={{ background: stat.bg, color: stat.color, border: `1px solid ${stat.color}22` }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-medium">{stat.label}</p>
              <p className="text-lg font-bold leading-none mt-0.5 text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="custom-scroll flex-1 overflow-y-auto px-6 py-5 space-y-4"
        style={{ background: "linear-gradient(160deg, rgba(238,244,255,0.50) 0%, rgba(240,253,250,0.40) 50%, rgba(240,249,255,0.50) 100%)" }}>

        {travelerDocumentVerification.status !== "Verified" ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{
                background: "rgba(255,255,255,0.70)",
                border: "1px solid rgba(148,193,255,0.35)",
                boxShadow: "0 4px 20px rgba(37,99,235,0.08)",
                backdropFilter: "blur(6px)",
              }}>
              {travelerDocumentVerification.status === "Rejected" ? (
                <AlertCircle size={32} className="text-red-400" />
              ) : travelerDocumentVerification.status === "Pending" ? (
                <ShieldCheck size={32} className="text-amber-400" />
              ) : (
                <Users size={32} className="text-slate-300" />
              )}
              <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-white animate-pulse"
                style={{ background: travelerDocumentVerification.status === "Rejected" ? "#f87171" : "#fbbf24" }} />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              {travelerDocumentVerification.status === "Pending" ? "Verification in progress"
                : travelerDocumentVerification.status === "Rejected" ? "Documents need correction"
                : "Documents not unlocked yet"}
            </h4>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {travelerDocumentVerification.status === "Pending"
                ? "Operations team is reviewing the files. Download actions will unlock after approval."
                : travelerDocumentVerification.status === "Rejected"
                ? "Agent needs to resubmit corrected documents before they appear here."
                : "The agent hasn't completed document upload yet."}
            </p>
            {travelerDocumentVerification.rejectionReason && (
              <div className="mt-5 w-full max-w-lg rounded-2xl px-4 py-3 text-left text-sm"
                style={{ background: "rgba(254,226,226,0.70)", border: "1px solid #fecaca", backdropFilter: "blur(6px)" }}>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5 text-red-500">Ops Comment</p>
                <p className="font-semibold text-red-700">{travelerDocumentVerification.rejectionReason}</p>
                {travelerDocumentVerification.rejectionRemarks && (
                  <p className="mt-1 text-xs text-red-400">{travelerDocumentVerification.rejectionRemarks}</p>
                )}
              </div>
            )}
          </div>

        ) : travelerProfiles.length > 0 ? (
          travelerProfiles.map((traveler, index) => (
            <div
              key={traveler.id}
              className="overflow-hidden rounded-[20px] transition-all"
              style={{
                background: "rgba(255,255,255,0.62)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(148,193,255,0.30)",
                boxShadow: "0 2px 16px rgba(37,99,235,0.06)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(99,155,255,0.50)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.11)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(148,193,255,0.30)";
                e.currentTarget.style.boxShadow = "0 2px 16px rgba(37,99,235,0.06)";
              }}
            >
              {/* Traveler header */}
              <div className="flex items-center justify-between px-5 py-3.5"
                style={{
                  borderBottom: "1px solid rgba(148,193,255,0.20)",
                  background: "linear-gradient(135deg, rgba(219,234,254,0.55) 0%, rgba(255,255,255,0.40) 100%)",
                }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                      boxShadow: "0 2px 8px rgba(37,99,235,0.28)",
                    }}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{traveler.fullName}</p>
                    <p className="text-[11px] text-slate-400">
                      {traveler.travelerType}
                      {traveler.travelerType === "Child" && traveler.childAge ? ` · ${traveler.childAge} yrs` : ""}
                    </p>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: traveler.uploadedCount > 0 ? "rgba(220,252,231,0.85)" : "rgba(241,245,249,0.80)",
                    color: traveler.uploadedCount > 0 ? "#15803d" : "#94a3b8",
                    border: traveler.uploadedCount > 0 ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                  }}>
                  {traveler.uploadedCount}/{traveler.documentSlots.length} docs
                </span>
              </div>

              {/* Document slots */}
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {traveler.documentSlots.map((travelerDocument) => (
                  <div
                    key={`${traveler.id}-${travelerDocument.key}`}
                    className="rounded-2xl p-4 transition-all"
                    style={{
                      background: travelerDocument.uploaded
                        ? "linear-gradient(135deg, rgba(220,252,231,0.55) 0%, rgba(240,253,250,0.50) 100%)"
                        : "rgba(248,250,252,0.65)",
                      border: travelerDocument.uploaded
                        ? "1px solid rgba(134,239,172,0.50)"
                        : "1px solid rgba(226,232,240,0.70)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                          {travelerDocument.label}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {travelerDocument.fileName || "—"}
                        </p>
                      </div>
                      <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          background: travelerDocument.uploaded ? "rgba(220,252,231,0.90)" : "rgba(241,245,249,0.80)",
                          color: travelerDocument.uploaded ? "#15803d" : "#94a3b8",
                          border: travelerDocument.uploaded ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                        }}>
                        {travelerDocument.uploaded ? "✓ Ready" : "Missing"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { label: "Uploaded", value: formatDocumentDateTime(travelerDocument.uploadedAt) },
                        { label: "Size",     value: formatDocumentSize(travelerDocument.size) },
                      ].map(cell => (
                        <div key={cell.label} className="rounded-xl px-3 py-2"
                          style={{
                            background: "rgba(255,255,255,0.70)",
                            border: "1px solid rgba(148,193,255,0.22)",
                            backdropFilter: "blur(4px)",
                          }}>
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">{cell.label}</p>
                          <p className="mt-1 text-xs text-slate-600 leading-4">{cell.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {/* Open */}
                      <button
                        onClick={() => handleTravelerDocumentOpen(traveler, travelerDocument)}
                        disabled={!travelerDocument.uploaded}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          background: "rgba(255,255,255,0.70)",
                          border: "1px solid rgba(148,193,255,0.30)",
                          color: "#475569",
                          backdropFilter: "blur(4px)",
                        }}
                        onMouseEnter={e => { if (travelerDocument.uploaded) {
                          e.currentTarget.style.background = "rgba(219,234,254,0.80)";
                          e.currentTarget.style.borderColor = "#93c5fd";
                          e.currentTarget.style.color = "#1d4ed8";
                        }}}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.70)";
                          e.currentTarget.style.borderColor = "rgba(148,193,255,0.30)";
                          e.currentTarget.style.color = "#475569";
                        }}
                      >
                        <ExternalLink size={13} />
                        Open
                      </button>

                      {/* Download */}
                      <button
                        onClick={() => handleTravelerDocumentDownload(traveler, travelerDocument)}
                        disabled={!travelerDocument.uploaded || downloadingDocumentId === `${traveler.id}-${travelerDocument.key}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          background: travelerDocument.uploaded
                            ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
                            : "rgba(241,245,249,0.70)",
                          border: "1px solid transparent",
                          color: travelerDocument.uploaded ? "#ffffff" : "#94a3b8",
                          boxShadow: travelerDocument.uploaded ? "0 3px 12px rgba(37,99,235,0.30)" : "none",
                        }}
                        onMouseEnter={e => { if (travelerDocument.uploaded) {
                          e.currentTarget.style.boxShadow = "0 5px 18px rgba(37,99,235,0.45)";
                          e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)";
                        }}}
                        onMouseLeave={e => { if (travelerDocument.uploaded) {
                          e.currentTarget.style.boxShadow = "0 3px 12px rgba(37,99,235,0.30)";
                          e.currentTarget.style.background = "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)";
                        }}}
                      >
                        <Download size={13} />
                        {downloadingDocumentId === `${traveler.id}-${travelerDocument.key}` ? "Saving..." : "Download"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-400 text-sm">
            No traveler records mapped to this query.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{
          borderTop: "1px solid rgba(148,193,255,0.22)",
          background: "linear-gradient(90deg, rgba(219,234,254,0.40) 0%, rgba(255,255,255,0.50) 50%, rgba(209,250,229,0.30) 100%)",
          backdropFilter: "blur(8px)",
        }}>
        <p className="text-xs text-slate-400">
          {travelerProfiles.length} traveler{travelerProfiles.length !== 1 ? "s" : ""} ·{" "}
          {uploadedTravelerDocumentCount} file{uploadedTravelerDocumentCount !== 1 ? "s" : ""} verified
        </p>
        <button
          onClick={() => setShowTravelerDocsModal(false)}
          className="rounded-2xl px-5 py-2 text-sm font-semibold transition"
          style={{
            background: "rgba(255,255,255,0.70)",
            border: "1px solid rgba(148,193,255,0.35)",
            color: "#475569",
            backdropFilter: "blur(6px)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(219,234,254,0.80)";
            e.currentTarget.style.color = "#1d4ed8";
            e.currentTarget.style.borderColor = "#93c5fd";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.70)";
            e.currentTarget.style.color = "#475569";
            e.currentTarget.style.borderColor = "rgba(148,193,255,0.35)";
          }}
        >
          Close
        </button>
      </div>
    </motion.div>
  </motion.div>
)}
 
      </AnimatePresence>

      {successPopup.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-2xl">
            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-6 py-7 text-white">
              <button
                onClick={() =>
                  setSuccessPopup((prev) => ({
                    ...prev,
                    open: false,
                  }))
                }
                className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
              >
                <X size={16} />
              </button>

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                {successPopup.status === "submitted" ? (
                  <ShieldCheck size={28} />
                ) : (
                  <Sparkles size={28} />
                )}
              </div>

              <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-50/90">
                Confirmation Saved
              </p>
              <h3 className="mt-2 text-2xl font-semibold leading-tight">
                {successPopup.status === "submitted"
                  ? "Confirmation Submitted Successfully"
                  : "Draft Saved Successfully"}
              </h3>
              <p className="mt-2 text-sm text-white/85">
                Your service confirmation has been recorded and is ready for the
                next fulfillment step.
              </p>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Query
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {successPopup.queryId || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Services
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {successPopup.serviceCount} Added
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {successPopup.status === "submitted"
                  ? "The confirmation entry is now ready for voucher mapping and downstream ops tracking."
                  : "You can continue editing this draft and submit it once final confirmation numbers are ready."}
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() =>
                    setSuccessPopup((prev) => ({
                      ...prev,
                      open: false,
                    }))
                  }
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    setSuccessPopup((prev) => ({
                      ...prev,
                      open: false,
                    }))
                  }
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
