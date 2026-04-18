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
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/80 hover:shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide">
                  <Users size={14} />
                  Pax
                </div>
                <p className="text-sm font-medium text-slate-800 mt-2">
                  {selectedQuery?.passengers || 0} PAX
                </p>
                <p className="mt-1 text-[11px] text-blue-700/80">
                  Open verified traveler documents
                </p>
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
        {showTravelerDocsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[6px] sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="relative flex max-h-[calc(100vh-24px)] w-full max-w-[1180px] overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] sm:max-h-[calc(100vh-32px)]"
            >
              <div className="grid min-h-0 w-full lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="custom-scroll relative min-h-0 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.35),_transparent_34%),linear-gradient(160deg,#0f172a_0%,#111827_52%,#172554_100%)] px-5 py-5 pb-6 text-white">
                  <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                  <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100/70">
                    Traveler Vault
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight">
                    PAX Documents Console
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Review the current query's traveler files in one place. Once operations verification is complete, every approved document is ready to open or download for supplier coordination.
                  </p>

                  <div
                    className={`mt-5 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      travelerDocumentVerification.status === "Verified"
                        ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100"
                        : travelerDocumentVerification.status === "Pending"
                        ? "border-amber-300/35 bg-amber-400/15 text-amber-100"
                        : travelerDocumentVerification.status === "Rejected"
                        ? "border-rose-300/35 bg-rose-400/15 text-rose-100"
                        : "border-white/15 bg-white/10 text-slate-200"
                    }`}
                  >
                    {travelerDocumentVerification.status || "Draft"}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        Query Reference
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {selectedQuery?.queryId || "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        {selectedQuery?.destination || "Destination not available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          Travelers
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {travelerProfiles.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          Files Ready
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {uploadedTravelerDocumentCount}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">
                        Supplier Handoff
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {travelersReadyForSupplierHandoff} traveler{travelersReadyForSupplierHandoff === 1 ? "" : "s"} ready
                      </p>
                      <p className="mt-1 text-xs leading-5 text-cyan-50/80">
                        Documents shown on the right can be opened for review or downloaded for onward sharing with suppliers.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        Ops Review
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {travelerDocumentVerification.reviewedByName || "Awaiting operations review"}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Submitted: {formatDocumentDateTime(travelerDocumentVerification.submittedAt)}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Reviewed: {formatDocumentDateTime(travelerDocumentVerification.reviewedAt)}
                      </p>
                    </div>

                    {travelerDocumentVerification.rejectionReason && (
                      <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-rose-200/80">
                          Latest Ops Comment
                        </p>
                        <p className="mt-2 font-semibold">
                          {travelerDocumentVerification.rejectionReason}
                        </p>
                        {travelerDocumentVerification.rejectionRemarks && (
                          <p className="mt-1 text-xs leading-5 text-rose-100/85">
                            {travelerDocumentVerification.rejectionRemarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex min-h-0 flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_40%,#f8fafc_100%)]">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        Verified Access Window
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">
                        Agent Traveler Documents
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Browse traveler files with names, status, upload time, and direct actions for review or supplier handoff.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTravelerDocsModal(false)}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="custom-scroll flex-1 overflow-y-auto px-5 py-5">
                    <div className="mb-5 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          Verified Set
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {uploadedTravelerDocumentCount}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Approved files currently visible in this workspace
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] px-4 py-3 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          Review Status
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {travelerDocumentVerification.status || "Draft"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Managed by {travelerDocumentVerification.reviewedByName || "Operations team"}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fcf9_100%)] px-4 py-3 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          Supplier Ready
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {travelersReadyForSupplierHandoff}/{travelerProfiles.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Travelers with at least one downloadable document
                        </p>
                      </div>
                    </div>

                    {travelerDocumentVerification.status !== "Verified" ? (
                      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                          {travelerDocumentVerification.status === "Rejected" ? (
                            <AlertCircle size={30} />
                          ) : travelerDocumentVerification.status === "Pending" ? (
                            <ShieldCheck size={30} />
                          ) : (
                            <Users size={30} />
                          )}
                        </div>
                        <h4 className="mt-5 text-xl font-semibold text-slate-900">
                          {travelerDocumentVerification.status === "Pending"
                            ? "Operations verification in progress"
                            : travelerDocumentVerification.status === "Rejected"
                            ? "Documents returned to the agent"
                            : "Traveler documents not unlocked yet"}
                        </h4>
                        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                          {travelerDocumentVerification.status === "Pending"
                            ? "The operations team is reviewing the uploaded traveler files. As soon as verification is completed, open and download actions will unlock in this modal."
                            : travelerDocumentVerification.status === "Rejected"
                            ? "Operations requested corrections on one or more documents. Once the agent resubmits the revised files and they are approved, the verified set will appear here."
                            : "The agent has not completed the traveler document set yet, or operations review has not started for this query."}
                        </p>

                        {travelerDocumentVerification.issues?.length > 0 && (
                          <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 p-4 text-left">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                              Operations flagged items
                            </p>
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              {travelerDocumentVerification.issues.map((issue, index) => (
                                <div
                                  key={`${issue.travelerId || issue.travelerName}-${issue.documentKey}-${index}`}
                                  className="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700"
                                >
                                  <p className="font-semibold text-slate-900">
                                    {issue.travelerName || "Traveler"}
                                  </p>
                                  <p className="mt-1 text-slate-500">
                                    {issue.documentLabel || issue.documentKey || "Document issue"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : travelerProfiles.length > 0 ? (
                      <div className="space-y-4">
                        {travelerProfiles.map((traveler, index) => (
                          <div
                            key={traveler.id}
                            className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_26%),linear-gradient(120deg,#eef6ff_0%,#ffffff_58%,#f7fbff_100%)] px-5 py-4">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.18em] text-blue-700/70">
                                  Traveler {index + 1}
                                </p>
                                <h4 className="mt-1 text-lg font-semibold text-slate-900">
                                  {traveler.fullName}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500">
                                  {traveler.travelerType}
                                  {traveler.travelerType === "Child" && traveler.childAge
                                    ? ` | ${traveler.childAge} yrs`
                                    : ""}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-right">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                  Document Coverage
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {traveler.uploadedCount}/{traveler.documentSlots.length} files
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 p-5 md:grid-cols-2">
                              {traveler.documentSlots.map((travelerDocument) => (
                                <div
                                  key={`${traveler.id}-${travelerDocument.key}`}
                                  className={`rounded-[24px] border p-4 transition ${
                                    travelerDocument.uploaded
                                      ? "border-emerald-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_24%),linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] shadow-[0_10px_30px_rgba(16,185,129,0.06)]"
                                      : "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                        {travelerDocument.label}
                                      </p>
                                      <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {travelerDocument.fileName || "File not uploaded"}
                                      </p>
                                    </div>
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                        travelerDocument.uploaded
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-slate-200 text-slate-500"
                                      }`}
                                    >
                                      {travelerDocument.uploaded ? "Ready" : "Missing"}
                                    </span>
                                  </div>

                                  <div className="mt-4 grid grid-cols-2 gap-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                        Uploaded
                                      </p>
                                      <p className="mt-1 text-xs font-medium leading-5 text-slate-700">
                                        {formatDocumentDateTime(travelerDocument.uploadedAt)}
                                      </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                        Size
                                      </p>
                                      <p className="mt-1 text-xs font-medium leading-5 text-slate-700">
                                        {formatDocumentSize(travelerDocument.size)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      onClick={() => handleTravelerDocumentOpen(traveler, travelerDocument)}
                                      disabled={!travelerDocument.uploaded}
                                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <ExternalLink size={14} />
                                      Open
                                    </button>
                                    <button
                                      onClick={() => handleTravelerDocumentDownload(traveler, travelerDocument)}
                                      disabled={
                                        !travelerDocument.uploaded ||
                                        downloadingDocumentId === `${traveler.id}-${travelerDocument.key}`
                                      }
                                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
                                    >
                                      <Download size={14} />
                                      {downloadingDocumentId === `${traveler.id}-${travelerDocument.key}`
                                        ? "Downloading..."
                                        : "Download"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
                        No traveler records are mapped to this query yet.
                      </div>
                    )}
                  </div>
                </div>
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
