import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { X, Copy, RefreshCw, AlertTriangle, FileText, CheckCircle2, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import API from "../utils/Api";
import { buildVoucherHtml, parseAdminTermContent, DEFAULT_VOUCHER_TERMS } from "../utils/voucherTemplate";

// Clean Dynamic Default Fallbacks
const DEFAULT_SELLER_BANK_DETAILS = [];
const GENERAL_TERMS_AND_CONDITIONS = [];
const DEFAULT_INCLUSIONS = [];
const DEFAULT_EXCLUSIONS = [];

const toDisplayList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,|•/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const getPackageDurationDetails = (pkg = {}, query = {}) => {
  const startDate = query?.startDate ? new Date(query.startDate) : null;
  const endDate = query?.endDate ? new Date(query.endDate) : null;
  if (
    startDate &&
    endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate > startDate
  ) {
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
    return {
      nights,
      days: nights + 1,
      label: `${nights} Nights / ${nights + 1} Days`,
    };
  }

  const rawDuration = String(pkg?.duration || query?.duration || "").trim();
  const nightsMatch = rawDuration.match(/(\d+)\s*(?:n|nights?)/i);
  const daysMatch = rawDuration.match(/(\d+)\s*(?:d|days?)/i);
  const nights = Number(nightsMatch?.[1] || pkg?.nights || pkg?.numberOfNights || query?.numberOfNights || query?.nights || 0);
  const days = Number(daysMatch?.[1] || pkg?.days || pkg?.numberOfDays || query?.numberOfDays || query?.days || 0);

  return {
    nights,
    days: days || (nights ? nights + 1 : 0),
    label: nights
      ? `${nights} Nights / ${days || nights + 1} Days`
      : (rawDuration || "Duration on Request"),
  };
};

const getTransportUsageLabel = (transport = {}) => {
  const value = String(
    transport?.usageType ||
    transport?.usage ||
    transport?.transportUsageLabel ||
    transport?.transportUsageOptionKey ||
    transport?.transferType ||
    transport?.serviceType ||
    ""
  ).trim();
  const normalized = value.toLowerCase().replace(/[_\s]+/g, "-");
  const labels = {
    "one-way-airport-transfer": "One Way / Airport Transfer",
    "inter-hotel-transfer": "Inter Hotel Transfer",
    "full-day": "Full Day",
    "half-day": "Half Day",
    "round-trip": "Round Trip",
  };
  return labels[normalized] || value.replace(/-/g, " ");
};

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

        // Resolve tourists from localStorage
        let savedTourists = null;
        if (typeof window !== "undefined" && (query?._id || query?.queryId || quote?.queryId)) {
          const qId = query?._id || query?.queryId || quote?.queryId;
          try {
            const rawSaved =
              localStorage.getItem(`trip_tourists_${qId}`) ||
              localStorage.getItem(`trip_tourists_${String(qId).replace(/^#\s*/, "")}`);
            if (rawSaved) savedTourists = JSON.parse(rawSaved);
          } catch (e) {}
        }
        const primaryTourist = Array.isArray(savedTourists) && savedTourists.length > 0
          ? (savedTourists.find((t) => t.isFlagged) || savedTourists[0])
          : null;
        const touristName = primaryTourist ? [primaryTourist.salutation, primaryTourist.name].filter(Boolean).join(" ").trim() : "";
        const primaryPhoneObj = primaryTourist?.phones?.find((p) => p.isPrimary) || primaryTourist?.phones?.[0];
        const touristPhoneRaw = primaryPhoneObj?.number ? String(primaryPhoneObj.number).trim() : "";
        const touristPhoneCode = primaryPhoneObj?.countryCode ? `+${primaryPhoneObj.countryCode.split("-")[0]}-` : "+91-";
        const touristPhone = touristPhoneRaw ? (touristPhoneRaw.startsWith("+") ? touristPhoneRaw : `${touristPhoneCode}${touristPhoneRaw}`) : "";

        const travelerDetailsPhone = query?.travelerDetails?.[0]?.phone || quote?.travelerDetails?.[0]?.phone || "";
        const travelerDetailsName = query?.travelerDetails?.[0]?.fullName || quote?.travelerDetails?.[0]?.fullName || "";

        const finalGuestName =
          touristName ||
          travelerDetailsName ||
          query?.clientName ||
          query?.leadTraveler ||
          query?.name ||
          query?.customerName ||
          query?.guestName ||
          quote?.clientName ||
          quote?.guestName ||
          "Valued Client";

        const finalGuestPhone =
          touristPhone ||
          query?.clientPhone ||
          query?.phone ||
          query?.contactNumber ||
          travelerDetailsPhone ||
          quote?.clientPhone ||
          quote?.phone ||
          "-";

        const rawTripNum = query?.queryId || query?.queryNumber || quote?.queryId || tripId || "";
        const cleanTripNum = String(rawTripNum).replace(/^#\s*/, "").trim();
        const finalTripId = cleanTripNum
          ? (cleanTripNum.toUpperCase().startsWith("QRY-") ? cleanTripNum.toUpperCase() : `QRY-${cleanTripNum.replace(/^VCH-?/i, "")}`)
          : "QRY-1109";

        const resolvedAddress =
          effectiveUser?.companyAddress ||
          effectiveUser?.address ||
          currentUser?.companyAddress ||
          currentUser?.address ||
          "KG 3/69, Ground Floor, Vikas Puri, New Delhi, Near UK Nursing Home, New Delhi, Delhi, India - 110018";

        const resolvedCompany =
          effectiveUser?.brandingName ||
          effectiveUser?.companyName ||
          currentUser?.companyName ||
          "DDLC Company";

        await API.post(`/agent/queries/${queryTargetId}/send-voucher-email`, {
          recipientEmail: recipientEmail,
          subject: emailSubjectInput || `Official Travel Voucher (${voucherNum}) for ${destination} - Trip #${finalTripId}`,
          html: voucherHtml,
          voucherNumber: voucherNum,
          tripId: finalTripId,
          guestName: finalGuestName,
          guestPhone: finalGuestPhone,
          clientName: finalGuestName,
          clientPhone: finalGuestPhone,
          companyAddress: resolvedAddress,
          companyName: resolvedCompany,
          companyPhone: effectiveUser?.phone || currentUser?.phone || "+91-8851346665",
          companyEmail: effectiveUser?.email || currentUser?.email || "",
          brandingLogo: effectiveUser?.brandingLogo || effectiveUser?.brandLogoUrl || brandLogoUrl || "",
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
  const [availableAdminTerms, setAvailableAdminTerms] = useState([]);
  const [availableAgentTerms, setAvailableAgentTerms] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState("default");
  const [loadingTerms, setLoadingTerms] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchVoucherTerms = async () => {
      try {
        setLoadingTerms(true);
        let termList = [];
        try {
          const res = await API.get("/admin/terms");
          termList = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];
        } catch (e) {
          try {
            const res2 = await API.get("/agent/terms");
            termList = Array.isArray(res2?.data)
              ? res2.data
              : Array.isArray(res2?.data?.data)
              ? res2.data.data
              : [];
          } catch (err2) {
            console.warn("Could not fetch terms:", err2);
          }
        }

        const parsed = termList
          .map((item) => {
            const items = parseAdminTermContent(item.content || "");
            return {
              id: String(item.id || item._id),
              name: item.name || "Terms & Conditions",
              by: item.by || item.createdBy?.name || "Admin",
              content: item.content || "",
              items,
            };
          })
          .filter((t) => t.items.length > 0);

        if (isMounted) {
          setAvailableAgentTerms(parsed);
        }
      } catch (err) {
        console.error("Failed to load agent terms for voucher preview:", err);
      } finally {
        if (isMounted) setLoadingTerms(false);
      }
    };
    fetchVoucherTerms();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

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

  // Always open on the same quotation email format received from Operations.
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
        const normalizeCompanyName = (name, fallback = "Holiday Circuit") => {
          const str = String(name || "").trim();
          if (!str) return fallback;
          return str;
        };

        const companyNameVal = normalizeCompanyName(
          effectiveUser?.brandingName || effectiveUser?.companyName || effectiveUser?.agencyName || currentUser?.brandingName || currentUser?.companyName,
          "DDLC Company"
        );
        const issuedByVal = "Holiday Circuit";
        const targetQueryId = query?._id || query?.queryId || quote?.queryId;
        let savedTourists = null;
        if (typeof window !== "undefined" && targetQueryId) {
          try {
            const rawSaved =
              localStorage.getItem(`trip_tourists_${targetQueryId}`) ||
              localStorage.getItem(`trip_tourists_${String(targetQueryId).replace(/^#\s*/, "")}`);
            if (rawSaved) savedTourists = JSON.parse(rawSaved);
          } catch (e) {}
        }
        const primaryTourist = Array.isArray(savedTourists) && savedTourists.length > 0
          ? (savedTourists.find((t) => t.isFlagged) || savedTourists[0])
          : null;
        const touristName = primaryTourist ? [primaryTourist.salutation, primaryTourist.name].filter(Boolean).join(" ").trim() : "";
        const primaryPhoneObj = primaryTourist?.phones?.find((p) => p.isPrimary) || primaryTourist?.phones?.[0];
        const touristPhoneRaw = primaryPhoneObj?.number ? String(primaryPhoneObj.number).trim() : "";
        const touristPhoneCode = primaryPhoneObj?.countryCode ? `+${primaryPhoneObj.countryCode.split("-")[0]}-` : "+91-";
        const touristPhone = touristPhoneRaw ? (touristPhoneRaw.startsWith("+") ? touristPhoneRaw : `${touristPhoneCode}${touristPhoneRaw}`) : "";

        const travelerDetailsPhone = query?.travelerDetails?.[0]?.phone || quote?.travelerDetails?.[0]?.phone || "";
        const travelerDetailsName = query?.travelerDetails?.[0]?.fullName || quote?.travelerDetails?.[0]?.fullName || "";

        const clientNameVal =
          touristName ||
          travelerDetailsName ||
          query?.clientName ||
          query?.leadTraveler ||
          query?.name ||
          query?.customerName ||
          query?.guestName ||
          quote?.clientName ||
          quote?.guestName ||
          "Valued Client";

        const clientPhoneVal =
          touristPhone ||
          query?.clientPhone ||
          query?.phone ||
          query?.contactNumber ||
          travelerDetailsPhone ||
          quote?.clientPhone ||
          quote?.phone ||
          "-";
        const voucherNo = query?.voucherNumber || `VCH-${query?.queryId || "001"}`;
        const tripIdVal = query?.queryId || query?.tripId || quote?.tripId || quote?.quotationNumber || String(voucherNo).replace(/^VCH-/, "") || "4304633";
        const destinationVal = query?.destination || quote?.destination || "India";

        // Date calculation & formatting
        const startObj = query?.startDate ? new Date(query.startDate) : (quote?.startDate ? new Date(quote.startDate) : null);
        const endObj = query?.endDate ? new Date(query.endDate) : (quote?.endDate ? new Date(quote.endDate) : null);

        const getOrdinalSuffix = (n) => {
          const s = ["th", "st", "nd", "rd"];
          const v = n % 100;
          return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };

        const formatLongDate = (d) => {
          if (!d || isNaN(d.getTime())) return "-";
          return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        };

        const formatOrdinalDate = (d) => {
          if (!d || isNaN(d.getTime())) return "-";
          const day = d.getDate();
          const month = d.toLocaleDateString("en-GB", { month: "short" });
          const year = d.getFullYear();
          return `${getOrdinalSuffix(day)} ${month}, ${year}`;
        };

        const formatShortDate = (d) => {
          if (!d || isNaN(d.getTime())) return "-";
          return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        };

        let calcNights = 0;
        if (startObj && endObj && !isNaN(startObj.getTime()) && !isNaN(endObj.getTime())) {
          const diffTime = Math.abs(endObj - startObj);
          calcNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        const nights = query?.nights || quote?.nights || calcNights || 1;
        const days = query?.days || quote?.days || (nights > 0 ? nights + 1 : 2);
        const tripDurationFormatted = `${nights} Night${nights > 1 ? "s" : ""} / ${days} Day${days > 1 ? "s" : ""}`;

        const startDateLong = startObj && !isNaN(startObj.getTime()) ? formatLongDate(startObj) : (query?.startDate || "22 December, 2026");
        const startDateOrdinal = startObj && !isNaN(startObj.getTime()) ? formatOrdinalDate(startObj) : "22nd Dec, 2026";
        const startDateShort = startObj && !isNaN(startObj.getTime()) ? formatShortDate(startObj) : "22 Dec, 2026";
        const endDateOrdinal = endObj && !isNaN(endObj.getTime()) ? formatOrdinalDate(endObj) : (startObj && !isNaN(startObj.getTime()) ? formatOrdinalDate(new Date(startObj.getTime() + nights * 86400000)) : "23rd Dec, 2026");

        const paxVal = `${(query?.numberOfAdults || quote?.numberOfAdults || 2)} Adults${(query?.numberOfChildren || quote?.numberOfChildren) > 0 ? `, ${query?.numberOfChildren || quote?.numberOfChildren} Child${(query?.numberOfChildren || quote?.numberOfChildren) > 1 ? "ren" : ""}` : ""}`;

        const rawServices = Array.isArray(quote?.services) && quote.services.length > 0
          ? quote.services
          : (Array.isArray(query?.services) && query.services.length > 0
              ? query.services
              : (Array.isArray(query?.voucherServices) && query.voucherServices.length > 0
                  ? query.voucherServices
                  : []));

        const hotelServices = rawServices.filter((s) => String(s.type || s.category || "").toLowerCase().includes("hotel"));
        const nonHotelServices = rawServices.filter((s) => !String(s.type || s.category || "").toLowerCase().includes("hotel"));

        const displayHotels = hotelServices;

        const isHcCompany = !companyNameVal || companyNameVal.toLowerCase() === "holiday circuit";

        const companyAddressVal = !isHcCompany && (effectiveUser?.address || effectiveUser?.companyAddress)
          ? (effectiveUser?.address || effectiveUser?.companyAddress)
          : "KG 3/69, Ground Floor, Vikas Puri, New Delhi, Near UK Nursing Home, New Delhi, Delhi, India - 110018";

        const companyPhoneVal = !isHcCompany && effectiveUser?.phone
          ? effectiveUser?.phone
          : "+91-8851346665";

        const companyEmailVal = !isHcCompany && effectiveUser?.email
          ? effectiveUser?.email
          : "ops@holidaycircuit.com";

        const rawLogo = String(
          effectiveUser?.brandingLogo ||
          effectiveUser?.brandLogoUrl ||
          effectiveUser?.logo ||
          brandLogoUrl ||
          quote?.agentLogo ||
          (typeof window !== "undefined" ? localStorage.getItem("agentBrandLogo") : "") ||
          "",
        ).trim();

        const agencyLogoSrc = rawLogo
          ? rawLogo
          : "https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png";

        const rawVoucherFooter = String(
          effectiveUser?.voucherFooterImage ||
          effectiveUser?.footerBanner ||
          effectiveUser?.pdfFooterImage ||
          quote?.voucherFooterImage ||
          quote?.agentFooterImage ||
          ""
        ).trim();

        const voucherFooterSrc = rawVoucherFooter;

        const normalizeRoomType = (rt) => {
          if (!rt) return "Standard Room";
          let clean = String(rt).trim();
          if (/^(standard|deluxe|superior|executive|luxury|premium|classic)$/i.test(clean)) {
            return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() + " Room";
          }
          if (clean.toLowerCase() === "standard") return "Standard Room";
          return clean;
        };

        const resolveHotelMealPlanText = (h = {}) => {
          const candidates = [
            h.mealPlan,
            h.meal_plan,
            h.meal,
            h.meals,
            h.mealType,
          ].filter((v) => typeof v === "string" && v.trim().length > 0);

          for (const candidate of candidates) {
            const upper = candidate.trim().toUpperCase();
            if (upper === "EP" || upper.includes("ROOM ONLY") || upper.includes("ONLY ROOM") || upper.includes("NO MEAL")) {
              return "EP ( Room Only )";
            }
            if (upper === "MAP" || upper.includes("HALF BOARD") || upper.includes("BREAKFAST & DINNER") || upper.includes("BREAKFAST AND DINNER") || upper.includes("BREAKFAST + DINNER")) {
              return "MAP ( Breakfast & Dinner Included )";
            }
            if (upper === "AP" || upper.includes("FULL BOARD") || upper.includes("ALL MEAL")) {
              return "AP ( Breakfast, Lunch & Dinner Included )";
            }
            if (upper === "AI" || upper.includes("ALL INCLUSIVE")) {
              return "AI ( All Inclusive )";
            }
            if (upper === "CP" || upper.includes("BREAKFAST") || upper.includes("BED & BREAKFAST") || upper.includes("B&B")) {
              return "CP ( Breakfast Included )";
            }
          }

          const textSources = [
            h.description,
            h.roomDescription,
            h.hotelDescription,
            h.roomType,
            h.roomCategory,
            h.inclusions,
            h.notes,
          ].filter(Boolean);

          for (const source of textSources) {
            const segments = String(source).split("|").map((s) => s.trim().toUpperCase());
            for (const seg of segments) {
              if (seg === "EP" || seg === "ROOM ONLY" || seg === "ONLY ROOM" || seg === "NO MEALS" || seg === "NO MEAL") {
                return "EP ( Room Only )";
              }
              if (seg === "MAP" || seg === "HALF BOARD" || seg === "BREAKFAST & DINNER" || seg === "BREAKFAST AND DINNER" || seg === "BREAKFAST + DINNER") {
                return "MAP ( Breakfast & Dinner Included )";
              }
              if (seg === "AP" || seg === "FULL BOARD" || seg === "ALL MEALS" || seg === "ALL MEAL") {
                return "AP ( Breakfast, Lunch & Dinner Included )";
              }
              if (seg === "AI" || seg === "ALL INCLUSIVE") {
                return "AI ( All Inclusive )";
              }
              if (seg === "CP" || seg === "BREAKFAST INCLUDED" || seg === "BREAKFAST" || seg === "BED & BREAKFAST" || seg === "B&B") {
                return "CP ( Breakfast Included )";
              }
            }
          }

          const fullDesc = textSources.join(" ");
          if (/\b(EP|ROOM\s*ONLY|ONLY\s*ROOM|EUROPEAN\s*PLAN|NO\s*MEALS?)\b/i.test(fullDesc)) {
            return "EP ( Room Only )";
          }
          if (/\b(MAP|HALF\s*BOARD|BREAKFAST\s*(?:AND|&|\+)\s*DINNER)\b/i.test(fullDesc)) {
            return "MAP ( Breakfast & Dinner Included )";
          }
          if (/\b(AP|FULL\s*BOARD|ALL\s*MEALS?)\b/i.test(fullDesc)) {
            return "AP ( Breakfast, Lunch & Dinner Included )";
          }
          if (/\b(AI|ALL\s*INCLUSIVE)\b/i.test(fullDesc)) {
            return "AI ( All Inclusive )";
          }
          if (/\b(CP|BREAKFAST(?:\s*INCLUDED)?|BED\s*&\s*BREAKFAST)\b/i.test(fullDesc)) {
            return "CP ( Breakfast Included )";
          }

          const fallbackRaw = candidates[0] || h.description || h.roomType || "";
          return fallbackRaw.trim() ? fallbackRaw.trim() : "As per hotel policy";
        };

        let runningHotelDate = startObj && !isNaN(startObj.getTime()) ? new Date(startObj.getTime()) : new Date();

        const hotelsHtml = displayHotels.length > 0 ? displayHotels.map((h, idx) => {
          const rawTitle = String(h.title || "").trim();
          const rawHotelName = String(h.hotelName || h.hotel || "").trim();
          const rawServiceName = String(h.serviceName || h.name || "").trim();

          const hHotelName = rawHotelName || (rawTitle && !rawTitle.toLowerCase().includes("hotel stay") && !rawTitle.toLowerCase().includes("service") ? rawTitle : (rawServiceName || "Hotel Accommodation"));
          const hServiceName = rawServiceName && rawServiceName !== hHotelName ? rawServiceName : (rawTitle && rawTitle !== hHotelName ? rawTitle : "");

          const hRating = h.rating || h.starRating || h.hotelCategory || h.category || "";
          const hAddress = h.address || h.hotelAddress || h.location || (h.city ? `${h.city}, ${destinationVal}` : (destinationVal ? `${destinationVal}, India` : ""));
          const hDesc = h.description || h.hotelDescription || h.details || "";

          const realCnfNum = h.confirmationNumber || h.cnfNumber || h.supplierConfirmation || h.voucherNumber || (h.confirmation && h.confirmation !== "Confirmed(Confirmed)" && h.confirmation !== "Confirmed" && h.confirmation !== "Pending" ? h.confirmation : null);
          const isHotelConfirmed = Boolean(
            realCnfNum ||
            (h.status && String(h.status).toLowerCase() === "confirmed") ||
            (h.confirmation && !String(h.confirmation).toLowerCase().includes("pending")) ||
            h.isVoucherGenerated
          );
          const hStatLabel = isHotelConfirmed ? "Confirmed" : "Pending";
          const cnfDisplay = realCnfNum ? String(realCnfNum).trim() : (isHotelConfirmed ? "Confirmed" : "Pending");

          // Calculate dates per hotel
          const hNights = Number(h.nights || h.numberOfNights || (displayHotels.length > 1 ? 2 : nights) || 2);
          
          let hCheckInObj;
          if (h.checkIn) {
            hCheckInObj = new Date(h.checkIn);
          } else if (h.startDate && idx === 0) {
            hCheckInObj = new Date(h.startDate);
          } else if (h.startDate && h.startDate !== query?.startDate && h.startDate !== quote?.startDate) {
            hCheckInObj = new Date(h.startDate);
          } else if (idx > 0) {
            hCheckInObj = new Date(runningHotelDate.getTime());
          } else {
            hCheckInObj = startObj && !isNaN(startObj.getTime()) ? startObj : new Date();
          }

          let hCheckOutObj;
          if (h.checkOut) {
            hCheckOutObj = new Date(h.checkOut);
          } else if (h.endDate && idx === displayHotels.length - 1 && displayHotels.length === 1) {
            hCheckOutObj = new Date(h.endDate);
          } else if (h.endDate && h.endDate !== query?.endDate && h.endDate !== quote?.endDate) {
            hCheckOutObj = new Date(h.endDate);
          } else {
            hCheckOutObj = new Date(hCheckInObj.getTime() + hNights * 86400000);
          }

          runningHotelDate = new Date(hCheckOutObj.getTime());

          const hCheckInDate = hCheckInObj && !isNaN(hCheckInObj.getTime()) ? formatOrdinalDate(hCheckInObj) : startDateOrdinal;
          const hCheckInTime = h.checkInTime || "14:00 hrs";
          const hCheckOutDate = hCheckOutObj && !isNaN(hCheckOutObj.getTime()) ? formatOrdinalDate(hCheckOutObj) : endDateOrdinal;
          const hCheckOutTime = h.checkOutTime || "12:00 hrs";

          const hCheckInShort = hCheckInObj && !isNaN(hCheckInObj.getTime()) ? formatShortDate(hCheckInObj) : startDateShort;
          const formattedMeal = resolveHotelMealPlanText(h);
          const nightMealStr = `${hCheckInShort} (${hNights > 1 ? `${hNights} Nights` : '1 Night'}) - ${formattedMeal}`;
          const rawRoomType = h.roomType || h.roomCategory || "Standard Room";
          const formattedRoomType = normalizeRoomType(rawRoomType);
          const roomTypeStr = `${h.numberOfRooms || h.rooms || 1} x ${formattedRoomType}`;
          const paxDetailStr = h.pax || paxVal || "2 Adults";
          const roomDesc = h.roomDescription || h.roomDetails || "";

          return `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
              <thead>
                <tr style="background-color: #dce8f6;">
                  <th colspan="2" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: left; border: 1px solid #b3cae8; letter-spacing: 0.2px;">
                    Hotel
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="2" style="padding: 14px; background-color: #ffffff; border: 1px solid #b3cae8;">
                    <div style="font-size: 15px; font-weight: 800; color: #000000; margin-bottom: 2px; line-height: 1.3;">
                      ${hHotelName}
                    </div>
                    ${hServiceName ? `<div style="font-size: 12px; font-weight: 700; color: #2B5083; margin-bottom: 3px;">Service: ${hServiceName}</div>` : ''}
                    <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                      ${hRating}
                    </div>
                    <div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: ${hDesc ? '6px' : '12px'};">
                      ${hAddress}
                    </div>
                    ${hDesc ? `<div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 12px;">${hDesc}</div>` : ''}
                    <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                      Confirmation: ${cnfDisplay} <span style="font-style: italic; font-size: 12px; color: ${hStatLabel === 'Confirmed' ? '#15803d' : '#e11d48'}; font-weight: 700; margin-left: 6px;">( ${hStatLabel} )</span>
                    </div>

                    <!-- CHECK-IN & CHECK-OUT HIGHLIGHT BOX -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                      <tr>
                        <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                          Check-in
                        </td>
                        <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                          <strong style="color: #000000;">${hCheckInDate}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${hCheckInTime}</span>
                        </td>
                        <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                          Check-out
                        </td>
                        <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                          <strong style="color: #000000;">${hCheckOutDate} ( ${hNights} Night${hNights > 1 ? "s" : ""} )</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${hCheckOutTime}</span> <span style="font-style: italic; font-size: 11px; color: ${hStatLabel === 'Confirmed' ? '#15803d' : '#e11d48'}; font-weight: 700; margin-left: 4px;">( ${hStatLabel} )</span>
                        </td>
                      </tr>
                    </table>

                    <!-- NIGHT AND MEALS & ROOM TYPE SUB-TABLE -->
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #b3cae8;">
                      <thead>
                        <tr style="background-color: #dce8f6;">
                          <th style="width: 55%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                            Night and Meals
                          </th>
                          <th style="width: 45%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                            Room Type
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                            <div style="font-weight: 600; color: #000000;">${nightMealStr}</div>
                            ${h.mealDescription ? `<div style="font-size: 11px; color: #475569; margin-top: 4px;">${h.mealDescription}</div>` : ''}
                          </td>
                          <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                            <div style="font-weight: 700; color: #000000;">${roomTypeStr}</div>
                            <div style="font-size: 11px; color: #475569; margin-top: 4px;">${paxDetailStr}</div>
                            ${roomDesc ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${roomDesc}</div>` : ''}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          `;
        }).join("") : `<div style="padding: 16px 20px; text-align: center; color: #64748b; font-style: italic; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">No specific hotel accommodations listed for this voucher.</div>`;

        const nonHotelServicesHtml = nonHotelServices.map((s) => {
          const sTypeRaw = String(s.type || s.category || "Service").toLowerCase();
          const sTitle = s.title || s.name || s.serviceName || `${destinationVal} Service`;
          const sDesc = s.description || s.details || s.notes || "";

          const isTransport = sTypeRaw.includes("transfer") || sTypeRaw.includes("transport") || sTypeRaw.includes("cab") || sTypeRaw.includes("car");

          // Format Transport Specifics (Usage/Trip Type, Passenger & Luggage Capacity)
          const rawUsage = String(s.usageType || s.transferType || s.tripType || s.serviceMode || s.direction || "").trim();
          let usageLabel = "";
          if (rawUsage) {
            const lowUsage = rawUsage.toLowerCase();
            if (lowUsage.includes("point") || lowUsage.includes("oneway") || lowUsage.includes("one-way") || lowUsage.includes("one way")) {
              usageLabel = "One Way (Point to Point)";
            } else if (lowUsage.includes("round")) {
              usageLabel = "Round Trip";
            } else if (lowUsage.includes("full") || lowUsage.includes("day")) {
              usageLabel = "Full Day Disposal";
            } else if (lowUsage.includes("half")) {
              usageLabel = "Half Day Disposal";
            } else if (lowUsage.includes("pickup") || lowUsage.includes("pick-up")) {
              usageLabel = "Airport / Station Pickup";
            } else if (lowUsage.includes("drop")) {
              usageLabel = "Airport / Station Drop";
            } else {
              usageLabel = rawUsage;
            }
          } else {
            const titleLow = String(sTitle || "").toLowerCase();
            if (titleLow.includes("round trip") || titleLow.includes("round-trip")) {
              usageLabel = "Round Trip";
            } else if (titleLow.includes("disposal") || titleLow.includes("full day")) {
              usageLabel = "Full Day Disposal";
            } else if (titleLow.includes("half day")) {
              usageLabel = "Half Day Disposal";
            } else {
              usageLabel = "One Way Transfer";
            }
          }

          const vType = s.vehicleType || s.carType || s.vehicle || (isTransport ? "Private AC Vehicle" : "Standard Vehicle");
          const vCount = s.vehicleCount || s.numberOfVehicles || s.quantity || 1;
          const vehicleTitle = `${vCount > 1 ? `${vCount} x ` : ''}${vType}`;

          let passCap = s.passengerCapacity || s.maxPassengers || s.maxPax || s.seatingCapacity || s.seats || s.paxCapacity || null;
          let luggCap = s.luggageCapacity || s.maxLuggage || s.luggage || s.baggageCapacity || s.bags || null;

          if (!passCap && isTransport) {
            const vtLow = String(vType).toLowerCase();
            if (vtLow.includes("sedan") || vtLow.includes("etios") || vtLow.includes("dzire") || vtLow.includes("car")) {
              passCap = "Max 4 Pax";
            } else if (vtLow.includes("innova") || vtLow.includes("suv") || vtLow.includes("ertiga") || vtLow.includes("crysta")) {
              passCap = "Max 6 Pax";
            } else if (vtLow.includes("tempo") || vtLow.includes("van") || vtLow.includes("minivan")) {
              passCap = "Max 12 Pax";
            } else if (vtLow.includes("coach") || vtLow.includes("bus")) {
              passCap = "Max 25 Pax";
            } else {
              passCap = "Max 4 Pax";
            }
          } else if (passCap && !String(passCap).toLowerCase().includes("pax")) {
            passCap = `Max ${passCap} Pax`;
          }

          if (!luggCap && isTransport) {
            const vtLow = String(vType).toLowerCase();
            if (vtLow.includes("sedan") || vtLow.includes("etios") || vtLow.includes("dzire") || vtLow.includes("car")) {
              luggCap = "2 Bags";
            } else if (vtLow.includes("innova") || vtLow.includes("suv") || vtLow.includes("ertiga") || vtLow.includes("crysta")) {
              luggCap = "4 Bags";
            } else if (vtLow.includes("tempo") || vtLow.includes("van") || vtLow.includes("minivan")) {
              luggCap = "8 Bags";
            } else if (vtLow.includes("coach") || vtLow.includes("bus")) {
              luggCap = "20 Bags";
            } else {
              luggCap = "2-3 Bags";
            }
          } else if (luggCap && !String(luggCap).toLowerCase().includes("bag")) {
            luggCap = `${luggCap} Bags`;
          }

          let sectionTitle = "Service";
          let badge1Label = "Service Date";
          let badge2Label = "Service Type";
          let badge2Value = s.transferType || s.vehicleType || s.category || "Standard Service";
          let subCol1Title = "Service Details";
          let subCol2Title = "Pax / Vehicle Details";

          if (isTransport) {
            sectionTitle = "Transfer";
            badge1Label = "Transfer Date";
            badge2Label = "Vehicle & Trip";
            badge2Value = `${vType} (${usageLabel})`;
            subCol1Title = "Transfer Description & Route";
            subCol2Title = "Vehicle & Capacity Details";
          } else if (sTypeRaw.includes("activity")) {
            sectionTitle = "Activity";
            badge1Label = "Activity Date";
            badge2Label = "Timing / Duration";
            badge2Value = s.timing || s.duration || s.slot || "As per schedule";
            subCol1Title = "Activity Description";
            subCol2Title = "Pax Details";
          } else if (sTypeRaw.includes("sightseeing")) {
            sectionTitle = "Sightseeing";
            badge1Label = "Tour Date";
            badge2Label = "Tour Type";
            badge2Value = s.tourType || "Sightseeing Tour";
            subCol1Title = "Sightseeing Description";
            subCol2Title = "Pax Details";
          } else if (sTypeRaw.includes("flight")) {
            sectionTitle = "Flight";
            badge1Label = "Flight Date";
            badge2Label = "Flight / Sector";
            badge2Value = s.flightNumber || s.sector || "Flight Service";
            subCol1Title = "Flight Details";
            subCol2Title = "Pax Details";
          }

          const realCnf = s.confirmationNumber || s.cnfNumber || s.supplierConfirmation || s.voucherNumber || (s.confirmation && s.confirmation !== "Confirmed(Confirmed)" && s.confirmation !== "Confirmed" && s.confirmation !== "Pending" ? s.confirmation : null);
          const isConfirmed = Boolean(
            realCnf ||
            (s.status && String(s.status).toLowerCase() === "confirmed") ||
            (s.confirmation && !String(s.confirmation).toLowerCase().includes("pending")) ||
            s.isVoucherGenerated
          );
          const statLabel = isConfirmed ? "Confirmed" : "Pending";
          const cnfDisplay = realCnf ? String(realCnf).trim() : (isConfirmed ? "Confirmed" : "Pending");

          const sDateObj = s.serviceDate ? new Date(s.serviceDate) : (s.date ? new Date(s.date) : (s.startDate ? new Date(s.startDate) : startObj));
          const sDateFormatted = sDateObj && !isNaN(sDateObj.getTime()) ? formatOrdinalDate(sDateObj) : startDateOrdinal;
          const sTimeFormatted = s.time || s.pickupTime || s.serviceDate || "10:00 hrs";

          const sPaxVehicleStr = s.vehicleType ? `${s.vehicleType} • ${paxVal}` : (s.pax || paxVal || "2 Pax");
          const sDetailsStr = `${sTitle} - ${statLabel === "Confirmed" ? "Confirmed Service" : "Service"}`;

          return `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
              <thead>
                <tr style="background-color: #dce8f6;">
                  <th colspan="2" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: left; border: 1px solid #b3cae8; letter-spacing: 0.2px;">
                    ${sectionTitle}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="2" style="padding: 14px; background-color: #ffffff; border: 1px solid #b3cae8;">
                    <div style="font-size: 14px; font-weight: 800; color: #000000; margin-bottom: 3px; line-height: 1.3;">
                      ${sTitle}
                    </div>
                    <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
                      ${sectionTitle} • ${destinationVal}
                    </div>
                    ${sDesc ? `<div style="font-size: 12px; color: #1e293b; line-height: 1.4; margin-bottom: 12px;">${sDesc}</div>` : `<div style="margin-bottom: 8px;"></div>`}
                    
                    <div style="font-size: 13px; font-weight: 800; color: #713f12; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-bottom: 12px;">
                      Confirmation: ${cnfDisplay}
                    </div>

                    <!-- SERVICE DATE & DETAILS HIGHLIGHT BOX -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #b3cae8;">
                      <tr>
                        <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                          ${badge1Label}
                        </td>
                        <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                          <strong style="color: #000000;">${sDateFormatted}</strong> <span style="font-style: italic; font-size: 11px; color: #334155;">at ${sTimeFormatted}</span>
                        </td>
                        <td style="width: 14%; background-color: #fef08a; padding: 10px 12px; font-weight: 700; color: #000000; border: 1px solid #b3cae8; font-size: 13px; text-align: center;">
                          ${badge2Label}
                        </td>
                        <td style="width: 36%; padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 13px;">
                          <strong style="color: #000000;">${badge2Value}</strong> <span style="font-style: italic; font-size: 11px; color: ${statLabel === 'Confirmed' ? '#15803d' : '#334155'}; font-weight: 600;">( ${statLabel} )</span>
                        </td>
                      </tr>
                    </table>

                    <!-- SERVICE SUB-TABLE -->
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #b3cae8;">
                      <thead>
                        <tr style="background-color: #dce8f6;">
                          <th style="width: 58%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                            ${subCol1Title}
                          </th>
                          <th style="width: 42%; padding: 8px 12px; font-size: 13px; font-weight: 700; color: #000000; text-align: left; border: 1px solid #b3cae8;">
                            ${subCol2Title}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                            <div style="font-weight: 600; color: #000000;">${sDetailsStr}</div>
                            ${isTransport ? `
                              <div style="margin-top: 4px; font-size: 11px; color: #1e40af; font-weight: 600;">
                                ${usageLabel}${s.pickupLocation || s.dropLocation ? ` &nbsp;•&nbsp; ${s.pickupLocation || 'Pickup'} ➔ ${s.dropLocation || 'Drop'}` : ''}
                              </div>
                            ` : ''}
                            ${sDesc ? `<div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">${sDesc}</div>` : ''}
                          </td>
                          <td style="padding: 10px 12px; background-color: #ffffff; border: 1px solid #b3cae8; font-size: 12px; color: #000000; vertical-align: top;">
                            ${isTransport ? `
                              <div style="font-weight: 700; color: #000000; font-size: 12px; margin-bottom: 6px;">${vehicleTitle}</div>
                              <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #1e293b;">
                                <tr>
                                  <td style="padding: 2px 0; color: #475569;"><strong>Passenger Capacity:</strong></td>
                                  <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${passCap}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 2px 0; color: #475569;"><strong>Luggage Capacity:</strong></td>
                                  <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${luggCap}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 2px 0; color: #475569;"><strong>Booked Pax:</strong></td>
                                  <td style="padding: 2px 0; font-weight: 700; color: #0f172a; text-align: right;">${paxVal}</td>
                                </tr>
                              </table>
                            ` : `
                              <div style="font-weight: 600; color: #000000;">${sPaxVehicleStr}</div>
                              <div style="font-size: 11px; color: #475569; margin-top: 4px;"><strong>Booked Pax:</strong> ${paxVal}</div>
                            `}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          `;
        }).join("");

        const now = new Date();
        const genDay = now.getDate();
        const genMonth = now.toLocaleDateString("en-GB", { month: "short" });
        const genYear = now.getFullYear();
        const genHours = String(now.getUTCHours()).padStart(2, "0");
        const genMins = String(now.getUTCMinutes()).padStart(2, "0");
        const generatedOnStr = `${genDay} ${genMonth}, ${genYear} - ${genHours}:${genMins} Hrs UTC`;

        // Dynamic Terms & Conditions from Voucher / Query / Quote (sent by OPS or set by Admin)
        const candidateTerms =
          query?.voucherDetails?.termsAndConditions ||
          query?.voucher?.termsAndConditions ||
          query?.termsAndConditions ||
          query?.voucherTerms ||
          query?.voucherDetails?.terms ||
          query?.voucher?.terms ||
          quote?.voucherDetails?.termsAndConditions ||
          quote?.voucher?.termsAndConditions ||
          quote?.termsAndConditions ||
          quote?.voucherTerms ||
          quote?.voucherDetails?.terms ||
          quote?.voucher?.terms ||
          query?.activeQuote?.termsAndConditions ||
          query?.quotation?.termsAndConditions ||
          query?.terms ||
          quote?.terms ||
          selectedPkg?.termsAndConditions ||
          selectedPkg?.terms;

        let parsedVoucherTerms = [];
        if (!removeTerms && selectedTermId !== "none") {
          if (selectedTermId && selectedTermId !== "default") {
            const matchedCustomTerm = availableAgentTerms.find((t) => t.id === selectedTermId);
            if (matchedCustomTerm && matchedCustomTerm.items?.length > 0) {
              parsedVoucherTerms = matchedCustomTerm.items;
            }
          }
          if (parsedVoucherTerms.length === 0) {
            if (candidateTerms && (!Array.isArray(candidateTerms) || candidateTerms.length > 0)) {
              parsedVoucherTerms = parseAdminTermContent(candidateTerms);
            }

            // Fallback to voucher template matching "voucher" from availableAgentTerms (e.g. "voucher T&C (9 points)" selected by OPS)
            if (parsedVoucherTerms.length === 0 && availableAgentTerms.length > 0) {
              const matchedVoucherTerm = availableAgentTerms.find((t) =>
                t.name.toLowerCase().includes("voucher")
              );
              if (matchedVoucherTerm && matchedVoucherTerm.items?.length > 0) {
                parsedVoucherTerms = matchedVoucherTerm.items;
              } else if (availableAgentTerms[0]?.items?.length > 0) {
                parsedVoucherTerms = availableAgentTerms[0].items;
              }
            }

            if (parsedVoucherTerms.length === 0 && DEFAULT_VOUCHER_TERMS?.length > 0) {
              parsedVoucherTerms = DEFAULT_VOUCHER_TERMS;
            }
          }
        }

        const voucherTermsHtml = (!removeTerms && selectedTermId !== "none" && parsedVoucherTerms.length > 0) ? `
          <!-- TERMS & CONDITIONS SECTION -->
          <div style="margin-top: 18px; margin-bottom: 18px; font-family: Arial, sans-serif;">
            <div style="font-size: 13.5px; font-weight: 800; color: #9a3412; margin-bottom: 8px;">
              Terms &amp; Conditions:
            </div>
            <ol style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #1e293b; line-height: 1.65;">
              ${parsedVoucherTerms.map((t) => `<li style="margin-bottom: 5px;">${t.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`).join("")}
            </ol>
          </div>
        ` : "";

        const emailVoucherHtml = `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #1e293b; width: 100%; padding: 0px; box-sizing: border-box; background: #ffffff;">
            
            <!-- AGENT BRAND HEADER BANNER (KEPT AS REQUESTED) -->
            <div style="background-color: #ffffff; border-bottom: 2px solid #e2e8f0; padding: 14px 20px; margin-bottom: 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <!-- AGENT LOGO IMAGE -->
                  <td style="width: 110px; vertical-align: middle; padding-right: 12px; text-align: left;">
                    <div style="width: 105px; height: 75px; display: flex; align-items: center; justify-content: flex-start; overflow: hidden;">
                      <img src="${agencyLogoSrc}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; object-position: left;" />
                    </div>
                  </td>

                  <!-- AGENT COMPANY DETAILS -->
                  <td style="vertical-align: middle; text-align: left;">
                    <h2 style="margin: 0 0 3px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                      ${companyNameVal}
                    </h2>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569; line-height: 1.4;">
                      ${companyAddressVal}
                    </p>
                    <p style="margin: 0; font-size: 12px; font-weight: 600; color: #3252C3;">
                      ${companyPhoneVal} &nbsp;•&nbsp; ${companyEmailVal}
                    </p>
                  </td>
                </tr>
              </table>
            </div>

            <!-- VOUCHER CONTENT BODY (MATCHING REFERENCE IMAGE 1 EXACTLY) -->
            <div style="padding: 0 20px 10px 20px;">
              
              <!-- TRIP DETAILS TABLE -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
                <thead>
                  <tr style="background-color: #dce8f6;">
                    <th colspan="4" style="padding: 10px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: center; border: 1px solid #b3cae8; letter-spacing: 0.3px;">
                      Trip ID: ${tripIdVal}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 8px 12px; color: #1e293b; width: 18%; font-weight: 500; background-color: #ffffff; border: 1px solid #b3cae8;">Start Date</td>
                    <td style="padding: 8px 12px; color: #000000; width: 32%; font-weight: 700; background-color: #ffffff; border: 1px solid #b3cae8;">${startDateLong}</td>
                    <td style="padding: 8px 12px; color: #1e293b; width: 20%; font-weight: 500; background-color: #ffffff; border: 1px solid #b3cae8;">Trip Duration</td>
                    <td style="padding: 8px 12px; color: #000000; width: 30%; font-weight: 700; background-color: #ffffff; border: 1px solid #b3cae8;">${tripDurationFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; background-color: #ffffff; border: 1px solid #b3cae8;">Destination</td>
                    <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; background-color: #ffffff; border: 1px solid #b3cae8;">${destinationVal}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; background-color: #ffffff; border: 1px solid #b3cae8;">Guest Name</td>
                    <td style="padding: 8px 12px; color: #000000; font-weight: 700; background-color: #ffffff; border: 1px solid #b3cae8;">${clientNameVal}</td>
                    <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; background-color: #ffffff; border: 1px solid #b3cae8;">Guest Ph.</td>
                    <td style="padding: 8px 12px; color: #000000; font-weight: 600; background-color: #ffffff; border: 1px solid #b3cae8;">${clientPhoneVal}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; background-color: #ffffff; border: 1px solid #b3cae8;">Pax Details</td>
                    <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; background-color: #ffffff; border: 1px solid #b3cae8;">${paxVal}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 12px; color: #000000; font-weight: 700; background-color: #ffffff; border: 1px solid #b3cae8;">Issued By</td>
                    <td colspan="3" style="padding: 8px 12px; color: #1e293b; font-weight: 500; background-color: #ffffff; border: 1px solid #b3cae8;">${issuedByVal}</td>
                  </tr>
                </tbody>
              </table>

              <!-- HOTEL SECTION(S) -->
              ${hotelsHtml}

              <!-- TRANSFERS & ACTIVITIES SECTION (IF ANY) -->
              ${nonHotelServicesHtml}

              <!-- TERMS & CONDITIONS SECTION -->
              ${voucherTermsHtml}

              <!-- HELPLINE SECTION -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #fde047; font-family: Arial, sans-serif; font-size: 12px;">
                <thead>
                  <tr style="background-color: #fef08a;">
                    <th colspan="3" style="padding: 8px 14px; font-size: 13px; font-weight: 800; color: #713f12; text-align: center; border: 1px solid #fde047;">
                      Helpline
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="width: 35%; padding: 9px 14px; font-weight: 700; color: #000000; background-color: #ffffff; border: 1px solid #fde047;">
                      Holiday Circuit
                    </td>
                    <td style="width: 30%; padding: 9px 14px; font-weight: 500; color: #1e293b; background-color: #ffffff; border: 1px solid #fde047;">
                      24x7 Operational
                    </td>
                    <td style="width: 35%; padding: 9px 14px; font-weight: 700; color: #000000; background-color: #ffffff; border: 1px solid #fde047;">
                      +91-8851346665
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- GENERATED ON FOOTNOTE -->
              <div style="text-align: right; font-size: 11px; color: #64748b; margin-top: 10px; margin-bottom: 16px; font-family: Arial, sans-serif;">
                Generated On - ${generatedOnStr}
              </div>

            </div>

            <!-- FOOTER BANNER / DETAILS (KEPT AS REQUESTED) -->
            ${voucherFooterSrc
              ? `
                <div style="width: 100%; margin-top: 16px; text-align: center;">
                  <img src="${voucherFooterSrc}" alt="Footer Banner" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 0px;" />
                </div>
              `
              : `
                <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #334155; line-height: 1.5;">
                    Phone: ${companyPhoneVal} | Email: ${companyEmailVal}
                  </p>
                  <p style="margin: 0; font-size: 11px; font-weight: 500; color: #64748b; line-height: 1.4;">
                    ${companyAddressVal}
                  </p>
                </div>
              `
            }
          </div>
        `;

        setEmailPreviewHtml(emailVoucherHtml);
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

      if (quote?._id && shareMode !== "PACKAGE") {
        try {
          const { data } = await API.get(`/agent/quotations/${quote._id}/email-preview`, {
            params: {
              showIncExc,
              showPriceBreakup,
              hideTotalPrice,
              removeItinerary,
              removeTerms,
              removeTransport,
              similarHotelWord,
              isPdfMode,
              queryId: query?._id || query?.queryId,
            },
          });
          if (!cancelled) {
            setEmailPreviewHtml(data?.html || "");
            setEmailPreviewError("");
          }
        } catch (error) {
          console.error("Error fetching quotation email preview:", error);
          if (!cancelled) {
            setEmailPreviewHtml("");
            setEmailPreviewError(error?.response?.data?.message || "Unable to load quotation email preview.");
          }
        } finally {
          if (!cancelled) {
            setIsEmailPreviewLoading(false);
          }
        }
        return;
      }

      if (shareMode === "PACKAGE" || selectedPkg) {
        try {
          const clientNameVal = query?.name || query?.clientName || query?.customerName || query?.guestName || query?.contactName || "Valued Guest";
          const companyNameVal = effectiveUser?.brandingName || effectiveUser?.companyName || effectiveUser?.name || "Holiday Circuit";
          const companyAddressVal = effectiveUser?.address || effectiveUser?.companyAddress || "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110018";
          const companyPhoneVal = effectiveUser?.phone || "+91 8851346665";
          const companyEmailVal = effectiveUser?.email || "ops@holidaycircuit.com";

          const agencyLogoSrc = String(
            effectiveUser?.brandingLogo ||
            effectiveUser?.brandLogoUrl ||
            brandLogoUrl ||
            (typeof window !== "undefined" ? localStorage.getItem("agentBrandLogo") : "") ||
            ""
          ).trim();

          const rawVoucherFooterSrc = String(
            effectiveUser?.voucherFooterImage ||
            effectiveUser?.footerBanner ||
            effectiveUser?.pdfFooterImage ||
            ""
          ).trim();
          const isPlaceholderFooterImage =
            rawVoucherFooterSrc.toLowerCase().includes("ddlccompany") ||
            rawVoucherFooterSrc.toLowerCase().includes("container") ||
            rawVoucherFooterSrc.toLowerCase().includes("placeholder") ||
            rawVoucherFooterSrc.toLowerCase().includes("sample") ||
            rawVoucherFooterSrc.toLowerCase().includes("xxxx");
          const voucherFooterSrc = isPlaceholderFooterImage ? "" : rawVoucherFooterSrc;

          const pkgObj = selectedPkg || quote || {};
          const queryId = query?.queryId || query?._id?.slice(-7) || "QRY-1070";
          const destination = pkgObj?.destination || query?.destination || "Destination";
          const { nights, days, label: durationLabel } = getPackageDurationDetails(pkgObj, query);
          const startDateStr = query?.startDate && !isNaN(new Date(query.startDate).getTime())
            ? new Date(query.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
            : "Dates on Request";
          const endDateStr = query?.endDate && !isNaN(new Date(query.endDate).getTime())
            ? new Date(query.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
            : "Dates on Request";

          const adults = Number(query?.numberOfAdults || 2);
          const children = Number(query?.numberOfChildren || 0);
          const paxSummary = `${adults} Adults${children > 0 ? `, ${children} Children` : ""}`;

          const rawPrice = Number(pkgObj?.price || pkgObj?.basePrice || quote?.clientTotalAmount || quote?.pricing?.totalAmount || 225000);
          const safeTotalAmount = `INR ${Math.round(rawPrice).toLocaleString("en-IN")}`;

          // Separate Activities and Sightseeing
          const rawActivities = Array.isArray(pkgObj?.activities) ? pkgObj.activities : [];
          const rawSightseeing = Array.isArray(pkgObj?.sightseeing) ? pkgObj.sightseeing : [];

          const getItemDayAndDate = (item, idx, defaultStartDay = 2) => {
            const baseStartObj = query?.startDate && !isNaN(new Date(query.startDate).getTime())
              ? new Date(query.startDate)
              : new Date();
            const raw = String(item?.dayRange || item?.day || item?.serviceDate || item?.dayNumber || "").trim();
            const nums = raw.match(/\d+/g)?.map(Number) || [];

            let dayNum = defaultStartDay + idx;
            let dayLabel = "";

            if (nums.length >= 2) {
              dayLabel = `Day ${nums[0]} - Day ${nums[1]}`;
              dayNum = nums[0];
            } else if (nums.length === 1) {
              dayNum = nums[0];
              dayLabel = `Day ${dayNum}`;
            } else {
              dayLabel = `Day ${dayNum}`;
            }

            const itemDateObj = new Date(baseStartObj.getTime() + (dayNum - 1) * 86400000);
            const dateSubtext = !isNaN(itemDateObj.getTime())
              ? itemDateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
              : "";

            return { dayLabel, dateSubtext };
          };

          const activityRowsHtml = rawActivities.map((a, idx) => {
            const { dayLabel, dateSubtext } = getItemDayAndDate(a, idx, 2);
            return `
              <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; line-height: 1.4;">
                  <strong style="color: #0f172a;">${dayLabel}</strong><br/>
                  <span style="font-size: 11px; color: #64748b; font-weight: 500;">(${dateSubtext})</span>
                </td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">
                  ${a?.name || a?.title || "Tour Activity"}
                </td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; color: #334155;">
                  ${a?.description || "Includes activity experience."}
                </td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 600;">
                  ${(a?.quantity || adults)} • ${a?.unit || "person"}
                </td>
              </tr>
            `;
          }).join("");

          const sightseeingRowsHtml = rawSightseeing.map((s, idx) => {
            const { dayLabel, dateSubtext } = getItemDayAndDate(s, idx, 2);
            return `
              <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; line-height: 1.4;">
                  <strong style="color: #0f172a;">${dayLabel}</strong><br/>
                  <span style="font-size: 11px; color: #64748b; font-weight: 500;">(${dateSubtext})</span>
                </td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">
                  ${s?.name || s?.title || "Sightseeing Tour"}
                </td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; color: #334155;">
                  ${s?.description || "Includes entry tickets and guided access."}
                </td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 600;">
                  ${(s?.quantity || adults)} • ${s?.unit || "person"}
                </td>
              </tr>
            `;
          }).join("");

          // Inclusions & Exclusions
          const incList = toDisplayList(pkgObj?.inclusions);
          const excList = toDisplayList(pkgObj?.exclusions);

          const inclusionsListHtml = incList.map((i) => `<li style="margin-bottom: 6px; color: #1e293b;">✅ ${i}</li>`).join("");
          const exclusionsListHtml = excList.map((e) => `<li style="margin-bottom: 6px; color: #1e293b;">❌ ${e}</li>`).join("");

          // Seller Bank Details
          const templateSellerBankDetails = (Array.isArray(pkgObj?.sellerBankDetails) && pkgObj.sellerBankDetails.length > 0)
            ? pkgObj.sellerBankDetails
            : (Array.isArray(quote?.sellerBankDetails) && quote.sellerBankDetails.length > 0)
            ? quote.sellerBankDetails
            : DEFAULT_SELLER_BANK_DETAILS;

          // Day Wise Schedule
          const getOrdinal = (n) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
          };

          const rawSchedule = Array.isArray(pkgObj?.schedule || pkgObj?.dayWiseItinerary || pkgObj?.itinerary) && (pkgObj.schedule || pkgObj.dayWiseItinerary || pkgObj.itinerary).length > 0
            ? (pkgObj.schedule || pkgObj.dayWiseItinerary || pkgObj.itinerary)
            : Array.from({ length: Math.max(1, days) }, (_, i) => {
                const dayNum = i + 1;
                if (dayNum === 1) {
                  return {
                    day: 1,
                    title: `Day 1: Arrival in ${destination} & Hotel Check-in`,
                    details: `Arrival at ${destination}. Meet & transfer to hotel. Check-in and relax at leisure.`,
                  };
                }
                if (dayNum === days) {
                  return {
                    day: dayNum,
                    title: `Day ${dayNum}: Check-out & Departure from ${destination}`,
                    details: `Breakfast at hotel. Complete check-out formalities and transfer for departure with wonderful memories.`,
                  };
                }
                return {
                  day: dayNum,
                  title: `Day ${dayNum}: ${destination} Exploration & Leisure`,
                  details: `Breakfast at hotel. Enjoy leisure time and exploration around ${destination}.`,
                };
              });

          const scheduleRowsHtml = rawSchedule.map((d, idx) => {
            const dayNum = Number(d?.day || (idx + 1));
            const baseStartObj = query?.startDate && !isNaN(new Date(query.startDate).getTime())
              ? new Date(query.startDate)
              : new Date();
            const dObj = new Date(baseStartObj.getTime() + (dayNum - 1) * 86400000);

            const weekDayStr = !isNaN(dObj.getTime())
              ? dObj.toLocaleDateString("en-GB", { weekday: "long" })
              : "";
            const dateFormatted = !isNaN(dObj.getTime())
              ? dObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "";
            const ordinalLabel = `${getOrdinal(dayNum)} Day`;

            const titleText = d?.title || d?.dayTitle || `Day ${dayNum}: Itinerary`;
            const detailsText = d?.details || d?.description || d?.content || "Scheduled activities and sightseeing.";

            return `
              <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                <td width="24%" style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; line-height: 1.4; vertical-align: top;">
                  <div style="color: #0284c7; font-weight: bold; font-size: 12px; margin-bottom: 2px;">${ordinalLabel}</div>
                  <div style="color: #64748b; font-size: 11px;">${weekDayStr}</div>
                  <strong style="color: #0f172a; font-size: 12px;">${dateFormatted}</strong>
                </td>
                <td width="76%" style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; color: #1e293b; vertical-align: top; line-height: 1.5;">
                  <strong style="color: #0f172a; font-size: 13px; text-decoration: underline;">${titleText}</strong>
                  <p style="margin: 6px 0 0 0; color: #334155; font-size: 12px;">• ${detailsText.startsWith("•") ? detailsText.slice(1).trim() : detailsText}</p>
                </td>
              </tr>
            `;
          }).join("");

          const pkgEmailHtml = `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #1e293b; width: 100%; padding: 0px; box-sizing: border-box; background: #ffffff;">
              <!-- AGENT BRAND HEADER BANNER -->
              <div style="background-color: #ffffff; border-bottom: 2px solid #e2e8f0; padding: 14px 20px; margin-bottom: 16px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    ${agencyLogoSrc ? `
                      <td style="width: 110px; vertical-align: middle; padding-right: 12px; text-align: left;">
                        <div style="width: 105px; height: 75px; display: flex; align-items: center; justify-content: flex-start; overflow: hidden;">
                          <img src="${agencyLogoSrc}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; object-position: left;" />
                        </div>
                      </td>
                    ` : ""}
                    <td style="vertical-align: middle; text-align: left;">
                      <h2 style="margin: 0 0 3px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                        ${companyNameVal}
                      </h2>
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569; line-height: 1.4;">
                        ${companyAddressVal}
                      </p>
                      <p style="margin: 0; font-size: 12px; font-weight: 600; color: #3252C3;">
                        ${companyPhoneVal} &nbsp;•&nbsp; ${companyEmailVal}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Greeting Header -->
              <div style="margin-bottom: 20px; font-size: 13px; color: #1e293b; padding: 0 0px;">
                <p style="margin: 0 0 8px 0;">Dear <strong>${clientNameVal}</strong>,</p>
                <p style="margin: 0 0 8px 0;">Greetings from <strong>${companyNameVal} !!!</strong></p>
                <p style="margin: 0;">As per our discussion, following is the <strong>Package</strong> details.</p>
              </div>

              <div style="padding: 0 0px;">
                <!-- 1. PACKAGE OVERVIEW TABLE (EXACT QUOTATION FORMAT) -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th colspan="2" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Package Overview
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td width="25%" style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Trip ID</td>
                      <td width="75%" style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${queryId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Destination</td>
                      <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; color: #0f172a;">
                        <strong>${destination}</strong><br/>
                        <span style="background-color: #fef08a; border: 1px solid #fde047; color: #854d0e; font-weight: bold; padding: 2px 6px; font-size: 11px; display: inline-block; margin-top: 4px; border-radius: 2px;">
                          ${destination} (${durationLabel})
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Travel Dates</td>
                      <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${startDateStr} - ${endDateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Trip Duration</td>
                      <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${durationLabel}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Pax</td>
                      <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${paxSummary}</td>
                    </tr>
                  </tbody>
                </table>

                <!-- 2. HOTELS TABLE (EXACT QUOTATION FORMAT) -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th colspan="5" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Hotels
                      </th>
                    </tr>
                    <tr style="background-color: #ffffff; text-align: left;">
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 18%; line-height: 1.3;">Service Date /<br/>Check-in - Check-out</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 12%;">City</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 22%;">Service Name / Hotel Name</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 32%;">Meal / Accommodation</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 16%;">Pax / Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(() => {
                        const allServicesList = Array.isArray(pkgObj?.services) && pkgObj.services.length > 0
                          ? pkgObj.services
                          : Array.isArray(quote?.services) && quote.services.length > 0
                          ? quote.services
                          : Array.isArray(query?.services) && query.services.length > 0
                          ? query.services
                          : [];
                        const hotelsList = (Array.isArray(pkgObj?.hotels) && pkgObj.hotels.length > 0)
                          ? pkgObj.hotels
                          : allServicesList.filter(s => {
                              const type = String(s.type || s.category || s.serviceType || "").toLowerCase();
                              const title = String(s.title || s.name || s.hotelName || "").toLowerCase();
                              return type === "hotel" || type === "accommodation" || type === "stay" ||
                                (!type && (title.includes("hotel") || title.includes("resort") || title.includes("stay") || title.includes("heritage") || title.includes("budget")));
                            });

                        if (hotelsList.length > 0) {
                          return hotelsList.map((h, idx) => {
                            const actualHotel = h?.hotelName || h?.hotel_name || h?.actualHotelName || h?.name || h?.title || "Hotel Stay";
                            const serviceTitle = h?.serviceTitle || h?.serviceName || h?.title || h?.name || actualHotel;

                            const combinedHText = `${h?.starRating || ""} ${h?.hotelCategory || ""} ${h?.stars || ""} ${h?.category || ""} ${actualHotel} ${serviceTitle} ${h?.description || ""} ${h?.meal || ""} ${h?.mealPlan || ""} ${pkgObj?.description || ""} ${pkgObj?.title || ""}`.toLowerCase();
                            let starCount = (() => {
                              if (combinedHText.includes("3-star") || combinedHText.includes("3 star") || combinedHText.includes("3star") || combinedHText.includes("citymax") || combinedHText.includes("budget")) return 3;
                              if (combinedHText.includes("5-star") || combinedHText.includes("5 star") || combinedHText.includes("5star") || combinedHText.includes("luxury") || combinedHText.includes("atlantis")) return 5;
                              if (combinedHText.includes("4-star") || combinedHText.includes("4 star") || combinedHText.includes("4star")) return 4;
                              const num = Number(String(h?.starRating || h?.hotelCategory || h?.stars || h?.category || "").replace(/\D/g, ""));
                              if (num > 0 && num <= 5) return num;
                              return combinedHText.includes("budget") ? 3 : 4;
                            })();
                            const starStr = "⭐".repeat(Math.min(5, Math.max(1, starCount))) + ` ${starCount} Star`;
                            const roomType = h?.roomType || h?.room_type || h?.roomCategory || "Standard Room";
                            const meal = h?.description || h?.mealPlan || "CP Plan (✅ Breakfast • ❌ Dinner)";
                            const city = h?.city || destination;
                            const nVal = Number(h?.nights || h?.numberOfNights || pkgObj?.nights || nights) || nights;

                            const baseStartObj = query?.startDate && !isNaN(new Date(query.startDate).getTime())
                              ? new Date(query.startDate)
                              : new Date();
                            const hCheckIn = h?.checkIn && !isNaN(new Date(h.checkIn).getTime())
                              ? new Date(h.checkIn)
                              : baseStartObj;
                            const hCheckOut = h?.checkOut && !isNaN(new Date(h.checkOut).getTime())
                              ? new Date(h.checkOut)
                              : new Date(hCheckIn.getTime() + nVal * 86400000);

                            const checkInFormatted = !isNaN(hCheckIn.getTime())
                              ? hCheckIn.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                              : "-";
                            const checkOutFormatted = !isNaN(hCheckOut.getTime())
                              ? hCheckOut.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                              : "-";

                            return `
                              <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; line-height: 1.4;">
                                  <strong style="color: #0f172a;">${nVal} Nights</strong><br/>
                                  <span style="font-size: 11px; color: #64748b; font-weight: 500;">(${checkInFormatted} - ${checkOutFormatted})</span>
                                </td>
                                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${city}</td>
                                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px;">
                                  <strong style="color: #0f172a;">${serviceTitle}</strong>
                                  ${actualHotel && actualHotel !== serviceTitle ? `<div style="font-size: 11px; color: #334155; font-weight: 600; margin-top: 2px;">Hotel: ${actualHotel}</div>` : ""}
                                  <div style="font-size: 11px; color: #d97706; font-weight: 600; margin-top: 3px;">${starStr}</div>
                                </td>
                                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px;">
                                  <strong>${meal}</strong>
                                  <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-top: 3px;">${roomType}</div>
                                </td>
                                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 600;">
                                  ${nVal}N | 1 Room | ${paxSummary}<br/>
                                  <span style="font-size: 11px; color: #64748b; font-weight: normal;">• ${roomType}</span>
                                </td>
                              </tr>
                            `;
                          }).join("");
                        }

                        const baseStartObj = query?.startDate && !isNaN(new Date(query.startDate).getTime())
                          ? new Date(query.startDate)
                          : new Date();
                        const fallbackCheckInStr = !isNaN(baseStartObj.getTime())
                          ? baseStartObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                          : "-";
                        const fallbackCheckOutObj = new Date(baseStartObj.getTime() + nights * 86400000);
                        const fallbackCheckOutStr = !isNaN(fallbackCheckOutObj.getTime())
                          ? fallbackCheckOutObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                          : "-";
                        return `
                          <tr>
                            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; line-height:1.4;">
                              <strong style="color: #0f172a;">${nights} Nights</strong><br/>
                              <span style="font-size:11px; color:#64748b; font-weight: 500;">(${fallbackCheckInStr} - ${fallbackCheckOutStr})</span>
                            </td>
                            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; font-weight:bold;">${destination}</td>
                            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px;">
                              <strong style="color: #0f172a;">5-Star Luxury Oceanfront Resort Stay</strong>
                              <div style="font-size: 11px; color: #334155; font-weight: 600; margin-top: 2px;">Hotel: Atlantis, The Palm</div>
                              <div style="font-size: 11px; color: #d97706; font-weight: 600; margin-top: 3px;">⭐⭐⭐⭐⭐ 5 Star</div>
                            </td>
                            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px;">
                              <strong>CP Plan (✅ Breakfast • ❌ Dinner)</strong>
                              <div style="font-size:11px; color:#475569; line-height:1.4; margin-top:3px;">Ocean Deluxe Room | Includes Aquaventure Waterpark access</div>
                            </td>
                            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; font-weight:600;">
                              ${nights}N | 1 Room | ${paxSummary}<br/>
                              <span style="font-size:11px; color:#64748b; font-weight:normal;">• Ocean Deluxe Room</span>
                            </td>
                          </tr>
                        `;
                      })()}
                  </tbody>
                </table>

                <!-- 3. TRANSFERS & TRANSPORT TABLE (EXACT QUOTATION FORMAT) -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th colspan="4" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Transfers & Transport
                      </th>
                    </tr>
                    <tr style="background-color: #ffffff; text-align: left;">
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 16%;">Service Date</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 30%;">Service / Route</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 30%;">Transport Details</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 24%;">Pax / Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(Array.isArray(pkgObj?.transfers) && pkgObj.transfers.length > 0)
                      ? pkgObj.transfers.map((t, idx) => {
                          const baseStartObj = query?.startDate && !isNaN(new Date(query.startDate).getTime())
                            ? new Date(query.startDate)
                            : new Date();
                          const rawStr = String(t?.dayRange || t?.day || t?.serviceDate || t?.days || "").trim();
                          const nums = rawStr.match(/\d+/g)?.map(Number) || [];

                          let dayLabel = "";
                          let dateRangeSubtext = "";

                          if (nums.length >= 2) {
                            const sDay = nums[0];
                            const eDay = nums[1];
                            dayLabel = `Day ${sDay} - Day ${eDay}`;
                            const dStart = new Date(baseStartObj.getTime() + (sDay - 1) * 86400000);
                            const dEnd = new Date(baseStartObj.getTime() + (eDay - 1) * 86400000);
                            const sStr = !isNaN(dStart.getTime()) ? dStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                            const eStr = !isNaN(dEnd.getTime()) ? dEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                            dateRangeSubtext = sStr && eStr ? `(${sStr} - ${eStr})` : "";
                          } else if (nums.length === 1) {
                            const sDay = nums[0];
                            dayLabel = `Day ${sDay}`;
                            const dStart = new Date(baseStartObj.getTime() + (sDay - 1) * 86400000);
                            const sStr = !isNaN(dStart.getTime()) ? dStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                            dateRangeSubtext = sStr ? `(${sStr})` : "";
                          } else {
                            if (idx === 0) {
                              dayLabel = "Day 1";
                              const sStr = !isNaN(baseStartObj.getTime()) ? baseStartObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                              dateRangeSubtext = sStr ? `(${sStr})` : "";
                            } else {
                              dayLabel = "Day 2 - Day 4";
                              const dStart = new Date(baseStartObj.getTime() + 1 * 86400000);
                              const dEnd = new Date(baseStartObj.getTime() + 3 * 86400000);
                              const sStr = !isNaN(dStart.getTime()) ? dStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                              const eStr = !isNaN(dEnd.getTime()) ? dEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                              dateRangeSubtext = sStr && eStr ? `(${sStr} - ${eStr})` : "";
                            }
                          }

                          const serviceName = t?.name || t?.serviceName || t?.title || (idx === 0 ? "Airport Pick-up Transfer" : "City Transfer");
                          const vehicleName = t?.vehicle_type || t?.vehicleType || t?.vehicle || (idx === 0 ? "Private SUV / Sedan Transfer" : "Private SUV (Toyota Fortuner / Innova / Land Cruiser)");
                          const usageType = getTransportUsageLabel(t) || "One Way / Airport Transfer";
                          const passengerCapacity = Number(t?.passengerCapacity || t?.passenger_capacity || t?.capacity || (/suv|innova/i.test(vehicleName) ? 6 : (/tempo|traveller/i.test(vehicleName) ? 12 : 4)));
                          const luggageCapacity = Number(t?.luggageCapacity || t?.luggage_capacity || t?.luggage || (/suv|innova/i.test(vehicleName) ? 4 : (/tempo|traveller/i.test(vehicleName) ? 8 : 2)));
                          const descriptionText = t?.description || (idx === 0 ? "Arrival airport pick-up and hotel drop transfer service." : "Full-Day Private Chauffeur Services in SUV | Available for 10 hours/day for comfortable transfers between hotel, shopping malls & sightseeing spots.");

                          return `
                            <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                              <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; line-height: 1.4;">
                                <strong style="color: #0f172a;">${dayLabel}</strong><br/>
                                <span style="font-size: 11px; color: #64748b; font-weight: 500;">${dateRangeSubtext}</span>
                              </td>
                              <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">
                                ${serviceName}
                              </td>
                              <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px;">
                                <strong style="color: #0f172a;">${vehicleName}</strong>
                                ${descriptionText ? `<div style="font-size: 11px; color: #475569; line-height: 1.4; margin-top: 3px;">${descriptionText}</div>` : ""}
                              </td>
                              <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 600;">
                                <strong style="color: #0f172a;">${t?.pax || paxSummary}</strong>
                                ${usageType ? `<div style="font-size: 11px; color: #475569; font-weight: 600; margin-top: 3px;">${usageType}</div>` : ""}
                                ${(passengerCapacity > 0 || luggageCapacity > 0) ? `
                                  <div style="font-size: 10px; color: #475569; font-weight: 700; margin-top: 3px; letter-spacing: 0.2px;">
                                    ${passengerCapacity > 0 ? `CAPACITY: ${passengerCapacity} Pax` : ""}
                                    ${passengerCapacity > 0 && luggageCapacity > 0 ? `<span style="color: #94a3b8; margin: 0 4px;">•</span>` : ""}
                                    ${luggageCapacity > 0 ? `LUGGAGE: ${luggageCapacity} Bags` : ""}
                                  </div>
                                ` : ""}
                              </td>
                            </tr>
                          `;
                        }).join("")
                      : (() => {
                          const fallbackStartObj = query?.startDate && !isNaN(new Date(query.startDate).getTime())
                            ? new Date(query.startDate)
                            : new Date();
                          const d1Str = !isNaN(fallbackStartObj.getTime()) ? fallbackStartObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-";
                          const d2Obj = new Date(fallbackStartObj.getTime() + 1 * 86400000);
                          const d2Date = !isNaN(d2Obj.getTime()) ? d2Obj.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-";
                          const d4Obj = new Date(fallbackStartObj.getTime() + 3 * 86400000);
                          const d4Date = !isNaN(d4Obj.getTime()) ? d4Obj.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-";
                          return `
                            <tr>
                              <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; line-height:1.4;">
                                <strong style="color: #0f172a;">Day 1</strong><br/>
                                <span style="font-size:11px; color:#64748b; font-weight:500;">(${d1Str})</span>
                              </td>
                              <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; font-weight:bold; color:#0f172a;">Airport Pick-up Transfer</td>
                              <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px;">
                                <strong style="color: #0f172a;">Private SUV / Sedan Transfer</strong>
                                <div style="font-size:11px; color:#475569; line-height:1.4; margin-top:3px;">Arrival airport pick-up and hotel drop transfer service.</div>
                              </td>
                              <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; font-weight:600;">
                                <strong style="color: #0f172a;">${paxSummary}</strong>
                                <div style="font-size: 11px; color: #475569; font-weight: 600; margin-top: 3px;">One Way / Airport Transfer</div>
                                <div style="font-size: 10px; color: #475569; font-weight: 700; margin-top: 3px; letter-spacing: 0.2px;">CAPACITY: 4 Pax <span style="color: #94a3b8; margin: 0 4px;">•</span> LUGGAGE: 2 Bags</div>
                              </td>
                            </tr>
                            <tr style="background-color: #f8fafc;">
                              <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; line-height:1.4;">
                                <strong style="color: #0f172a;">Day 2 - Day 4</strong><br/>
                                <span style="font-size:11px; color:#64748b; font-weight:500;">(${d2Date} - ${d4Date})</span>
                              </td>
                              <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; font-weight:bold; color:#0f172a;">City Transfer</td>
                              <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px;">
                                <strong style="color: #0f172a;">Private SUV (Toyota Fortuner / Innova / Land Cruiser)</strong>
                                <div style="font-size:11px; color:#475569; line-height:1.4; margin-top:3px;">Full-Day Private Chauffeur Services in SUV | Available for 10 hours/day for comfortable transfers between hotel, shopping malls & sightseeing spots.</div>
                              </td>
                              <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; font-weight:600;">
                                <strong style="color: #0f172a;">${paxSummary}</strong>
                                <div style="font-size: 11px; color: #475569; font-weight: 600; margin-top: 3px;">Full Day / Disposal</div>
                                <div style="font-size: 10px; color: #475569; font-weight: 700; margin-top: 3px; letter-spacing: 0.2px;">CAPACITY: 6 Pax <span style="color: #94a3b8; margin: 0 4px;">•</span> LUGGAGE: 4 Bags</div>
                              </td>
                            </tr>
                          `;
                        })()}
                  </tbody>
                </table>

                <!-- 4. ACTIVITIES TABLE (ONLY IF ACTIVITIES EXIST) -->
                ${rawActivities.length > 0 ? `
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th colspan="4" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Activities
                      </th>
                    </tr>
                    <tr style="background-color: #ffffff; text-align: left;">
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 16%;">Service Date</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 30%;">Activity Name</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Inclusions & Description</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 20%;">Pax / Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activityRowsHtml}
                  </tbody>
                </table>
                ` : ""}

                <!-- 5. SIGHTSEEING TABLE (ONLY IF SIGHTSEEING EXISTS) -->
                ${rawSightseeing.length > 0 ? `
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th colspan="4" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Sightseeing
                      </th>
                    </tr>
                    <tr style="background-color: #ffffff; text-align: left;">
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 16%;">Service Date</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 30%;">Sightseeing Tour Name</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Inclusions & Description</th>
                      <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 20%;">Pax / Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sightseeingRowsHtml}
                  </tbody>
                </table>
                ` : ""}

                <!-- 6. TOTAL PRICE TABLE -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="padding: 12px; font-size: 13px;">
                        <div style="display: inline-block; background-color: #fef08a; border: 1px solid #fde047; color: #854d0e; font-weight: bold; padding: 3px 8px; font-size: 12px; margin-bottom: 8px; border-radius: 2px;">
                          Prices (INR)
                        </div>
                        <div style="font-size: 14px; font-weight: bold; color: #0f172a;">
                          Total: ${safeTotalAmount} /- <span style="font-weight: 600; font-style: italic; color: #2563eb; font-size: 12px;">(inc. GST 5% + other taxes)</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- 7. INCLUSIONS & EXCLUSIONS TABLE -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th width="50%" style="background-color: #ecfeff; color: #047857; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Inclusions
                      </th>
                      <th width="50%" style="background-color: #ecfeff; color: #b91c1c; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Exclusions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td valign="top" style="padding: 12px 16px; border: 1px solid #d1d5db; font-size: 12px; color: #1e293b;">
                        <ul style="margin: 0; padding-left: 0; list-style: none; line-height: 1.6;">
                          ${inclusionsListHtml}
                        </ul>
                      </td>
                      <td valign="top" style="padding: 12px 16px; border: 1px solid #d1d5db; font-size: 12px; color: #1e293b;">
                        <ul style="margin: 0; padding-left: 0; list-style: none; line-height: 1.6;">
                          ${exclusionsListHtml}
                        </ul>
                        <p style="margin: 12px 0 0 0; font-weight: bold; color: #0f766e; font-size: 11px;">
                          NOTE: Anything not mentioned in the inclusions is excluded.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- 8. DAY WISE SCHEDULE TABLE -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th colspan="2" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Day Wise Schedule
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    ${scheduleRowsHtml}
                  </tbody>
                </table>

                <!-- 9. BANK DETAILS TABLE -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th colspan="2" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Bank Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    ${templateSellerBankDetails.map((b, idx) => `
                      <tr style="${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                        <td width="30%" style="padding: 9px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #334155;">
                          ${b.label || b.name || "Detail"}
                        </td>
                        <td width="70%" style="padding: 9px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 600; color: #0f172a;">
                          ${b.value || "-"}
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>

                <!-- 10. TERMS AND CONDITIONS TABLE -->
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
                  <thead>
                    <tr>
                      <th style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                        Terms and Conditions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="padding: 16px 20px; font-size: 12px; color: #1e293b; line-height: 1.6;">
                        <p style="margin: 0 0 12px 0; color: #334155;">
                          Welcome to <strong style="color: #0f766e;">${companyNameVal}</strong>. These Terms and Conditions govern your use of the <strong style="color: #0f766e;">${companyNameVal}</strong> services. When You Make a booking or reservation, you agree to be bound by these Terms.
                        </p>

                        <p style="font-weight: bold; font-size: 13px; margin: 14px 0 6px 0; color: #0f766e; border-bottom: 1px solid #ccfbf1; padding-bottom: 3px;">Bookings and Reservations</p>
                        <ul style="margin: 0 0 12px 0; padding-left: 18px; color: #334155;">
                          <li style="margin-bottom: 6px;">
                            <strong style="color: #0f172a;">Booking Process:</strong> When you make a booking or reservation through <strong style="color: #0f766e;">${companyNameVal}</strong>, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.
                          </li>
                        </ul>

                        <p style="margin: 0 0 6px 0; color: #334155;">
                          <strong style="color: #0f172a;">Payment:</strong> Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.
                        </p>
                        <ol style="margin: 0 0 12px 0; padding-left: 18px; color: #334155; font-weight: 500;">
                          <li style="margin-bottom: 4px;"><strong style="color: #047857;">Minimum 50%</strong> of the booking amount is required at the time of booking confirmation.</li>
                          <li style="margin-bottom: 4px;">Remaining 50% in 2 parts i.e. 25% of total booking amount within 30 Days prior to departure and 25% within 20 days prior to departure.</li>
                          <li style="margin-bottom: 4px;">In Case of Airline booking/Train Tickets, <strong style="color: #b91c1c;">100% ticket cost</strong> to be paid at the time of confirmation.</li>
                          <li style="margin-bottom: 4px;">In Case a booking is under 100% cancellation period, then <strong style="color: #b91c1c;">100% booking amount</strong> is required at the time of booking confirmation.</li>
                        </ol>

                        <p style="margin: 0 0 8px 0; color: #334155;">
                          <strong style="color: #0f172a;">Confirmation:</strong> Your booking is considered confirmed only upon receipt of payment and confirmation from <strong style="color: #0f766e;">${companyNameVal}</strong>. Please review all booking details carefully to ensure accuracy.
                        </p>

                        <div style="margin: 8px 0 12px 0; font-weight: bold; color: #dc2626; background-color: #fef2f2; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 4px; display: inline-block;">
                          ⚠️ Booking will be auto cancelled in case of non-payment within stipulated time
                        </div>

                        <p style="margin: 0 0 10px 0; color: #334155;">
                          <strong style="color: #0f172a;">Credit Card:</strong> We accept payments through Credit Cards which may attract an additional charge from <strong style="color: #d97706;">3% to 5%</strong> depends upon the card type. Card charges shall be over and above the actual service/package cost.
                        </p>

                        <p style="margin: 0 0 10px 0; color: #334155;">
                          <strong style="color: #0f172a;">Confirmation Vouchers:</strong> The service will be confirmed once the advance payment is made. However, the confirmation vouchers will only be provided <strong style="color: #0284c7;">7 days before the arrival date</strong>.
                        </p>

                        <p style="margin: 0 0 10px 0; color: #334155;">
                          <strong style="color: #0f172a;">Airport Transfers & Tour Pick Ups:</strong> The service includes <strong style="color: #0284c7;">60 minutes of waiting time</strong> for Airport pick-ups. If you are delayed at immigration or luggage claim, please call the emergency number to extend the waiting time. Additional parking and waiting time charges may apply. For all other pick-ups, the driver will wait for <strong style="color: #0284c7;">10 mins at the meeting point</strong> i.e. Hotel Lobby or Reception or any other fixed meeting point.
                        </p>

                        <p style="margin: 0 0 10px 0; color: #334155;">
                          <strong style="color: #0f172a;">Taxes:</strong> In case of any changes in taxes (such as GST/Government Tax/TCS) at the time of confirmation, the price will be adjusted accordingly and shall be charged as per the prevailing law. This means that if there is an increase or decrease in applicable taxes between the time of booking confirmation and the actual provision of services, the final price will be adjusted to reflect these changes in accordance with the relevant tax regulations.
                        </p>

                        <p style="margin: 0 0 14px 0; color: #334155;">
                          <strong style="color: #0f172a;">Changes and Cancellations:</strong> Changes to bookings or cancellations may be subject to fees or penalties, as determined by the service providers (e.g., airlines, hotels, tour operators) and <strong style="color: #0f766e;">${companyNameVal}</strong>. These fees and penalties may vary depending on the service and the timing of the change or cancellation.
                        </p>

                        <p style="font-weight: bold; font-size: 13px; margin: 14px 0 6px 0; color: #0f766e; border-bottom: 1px solid #ccfbf1; padding-bottom: 3px;">Travel Documents and Requirements</p>
                        <ul style="margin: 0 0 14px 0; padding-left: 18px; color: #334155;">
                          <li style="margin-bottom: 6px;">
                            <strong style="color: #0f172a;">Valid Id Proof:</strong> It is your responsibility to ensure that you have a valid ID as per destination entry requirements and any required visas or travel documents for your trip. <strong style="color: #0f766e;">${companyNameVal}</strong> is not responsible for any issues arising from the lack of proper travel documents.<br/>
                            <span style="color: #c2410c; background-color: #fff7ed; border: 1px solid #ffedd5; padding: 3px 8px; border-radius: 4px; font-weight: bold; display: inline-block; margin-top: 4px;">
                              (To Enter Nepal by Air- Valid Passport or Election Card is Mandatory. Aadhar Card is not valid for Travel)
                            </span>
                          </li>
                          <li style="margin-bottom: 6px;">
                            <strong style="color: #0f172a;">Health and Vaccinations:</strong> You are responsible for ensuring that you meet all health and vaccination requirements for your travel destinations.
                          </li>
                          <li style="margin-bottom: 6px;">
                            <strong style="color: #0f172a;">Travel Insurance:</strong> We strongly recommend that you purchase travel insurance to protect against unexpected events such as trip cancellations, delays, or emergencies during your travel. <strong style="color: #0f766e;">${companyNameVal}</strong> can assist you in obtaining travel insurance, but the decision to purchase it is ultimately yours.
                          </li>
                        </ul>

                        <p style="font-weight: bold; font-size: 13px; margin: 14px 0 6px 0; color: #0f766e; border-bottom: 1px solid #ccfbf1; padding-bottom: 3px;">Changes to Itineraries</p>
                        <ul style="margin: 0 0 14px 0; padding-left: 18px; color: #334155;">
                          <li style="margin-bottom: 6px;">
                            <strong style="color: #0f172a;">By ${companyNameVal}:</strong> We reserve the right to make changes to your itinerary or accommodations due to unforeseen circumstances. We will make every effort to inform you of such changes as soon as possible.
                          </li>
                          <li style="margin-bottom: 6px;">
                            <strong style="color: #0f172a;">By You:</strong> Any changes requested by you to your itinerary may be subject to fees or penalties, as determined by the service providers and <strong style="color: #0f766e;">${companyNameVal}</strong>.
                          </li>
                        </ul>

                        <p style="font-weight: bold; font-size: 13px; margin: 14px 0 6px 0; color: #0f766e; border-bottom: 1px solid #ccfbf1; padding-bottom: 3px;">Liability</p>
                        <ul style="margin: 0 0 14px 0; padding-left: 18px; color: #334155;">
                          <li style="margin-bottom: 6px;">
                            <strong style="color: #0f172a;">Service Providers:</strong> <strong style="color: #0f766e;">${companyNameVal}</strong> acts as an intermediary between you and service providers such as airlines, hotels, and tour operators. We are not liable for any actions, omissions, or negligence on the part of these service providers.
                          </li>
                          <li style="margin-bottom: 6px;">
                            <strong style="color: #0f172a;">Force Majeure:</strong> <strong style="color: #0f766e;">${companyNameVal}</strong> is not liable for any disruptions, cancellations, or delays caused by circumstances beyond our control, including natural disasters, strikes, political unrest, or other force majeure events.
                          </li>
                        </ul>

                        <p style="margin: 0 0 10px 0; color: #334155;">
                          <strong style="color: #0f172a;">Governing Law and Jurisdiction:</strong> These Terms and your use of <strong style="color: #0f766e;">${companyNameVal}</strong> services are governed by the laws of New Delhi Jurisdiction, and any disputes shall be resolved in the courts of New Delhi Jurisdiction.
                        </p>

                        <p style="margin: 0 0 10px 0; color: #334155;">
                          <strong style="color: #0f172a;">Changes to Terms and Conditions:</strong> We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.
                        </p>

                        <p style="margin: 0 0 14px 0; color: #334155; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px;">
                          <strong style="color: #0f172a;">Contact Information:</strong> For any inquiries, please contact us at: <strong style="color: #0f766e;">${companyNameVal}</strong> ${companyAddressVal}, Email id - <a href="mailto:${companyEmailVal}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">${companyEmailVal}</a> <span style="color: #0284c7; font-weight: bold;">${companyPhoneVal}</span>
                        </p>

                        <p style="margin: 10px 0 0 0; font-weight: bold; font-style: italic; color: #0f766e; border-top: 2px solid #ccfbf1; padding-top: 10px; text-align: center;">
                          By booking with ${companyNameVal}, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- FOOTER BANNER -->
              ${voucherFooterSrc ? `
                <div style="width: 100%; margin-top: 16px; text-align: center;">
                  <img src="${voucherFooterSrc}" alt="Footer Banner" style="width: 100%; max-width: 100%; height: auto; display: block;" />
                </div>
              ` : `
                <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #334155;">
                    Phone: ${companyPhoneVal} | Email: ${companyEmailVal}
                  </p>
                  <p style="margin: 0; font-size: 11px; font-weight: 500; color: #64748b;">
                    ${companyAddressVal}
                  </p>
                </div>
              `}
            </div>
          `;

          if (!cancelled) {
            setEmailPreviewHtml(pkgEmailHtml);
            setEmailPreviewError("");
          }
        } catch (err) {
          console.error("Error building package email HTML:", err);
          if (!cancelled) {
            setEmailPreviewError("Unable to render package email template.");
          }
        } finally {
          if (!cancelled) {
            setIsEmailPreviewLoading(false);
          }
        }
        return;
      }

      try {
        const { data } = await API.get(`/agent/quotations/${quote._id}/email-preview`);
        if (!cancelled) setEmailPreviewHtml(data?.html || "");
      } catch (error) {
        if (!cancelled) {
          setEmailPreviewHtml("");
          setEmailPreviewError(error?.response?.data?.message || "Unable to load the Operations email template.");
        }
      } finally {
        if (!cancelled) setIsEmailPreviewLoading(false);
      }
    };

    loadEmailPreview();
  }, [
    isOpen,
    quote?._id,
    emailPreviewVersion,
    shareMode,
    selectedPkg,
    removeTerms,
    showIncExc,
    showPriceBreakup,
    hideTotalPrice,
    removeItinerary,
    removeTransport,
    similarHotelWord,
    isPdfMode,
    availableAdminTerms,
    availableAgentTerms,
    selectedTermId,
  ]);

  // Check if terms are disabled
  const isTermsDisabled = quote?.termsDisabled || query?.termsDisabled || true;

  // Extracted Dynamic Data
  const clientName =
    quote?.clientName ||
    quote?.recipientName ||
    query?.name ||
    query?.clientName ||
    query?.leadGuestName ||
    query?.customerName ||
    query?.guestName ||
    "Guest";
  const tripId = query?.queryId || query?._id?.slice(-7) || "3934580";
  const destination = selectedPkg?.destination || quote?.destination || query?.destination || "Sri Lanka";

  const startDateRaw = query?.startDate || "2026-08-19";
  const startDateFormatted = useMemo(() => {
    if (!startDateRaw) return "19 August, 2026";
    const d = new Date(startDateRaw);
    if (isNaN(d.getTime())) return String(startDateRaw);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }, [startDateRaw]);

  const endDateRaw = query?.endDate || "";
  const endDateFormatted = useMemo(() => {
    if (!endDateRaw) return "Dates on Request";
    const d = new Date(endDateRaw);
    if (isNaN(d.getTime())) return String(endDateRaw);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }, [endDateRaw]);

  const shortStartDateFormatted = useMemo(() => {
    if (!startDateRaw) return "19 Aug, 2026";
    const d = new Date(startDateRaw);
    if (isNaN(d.getTime())) return String(startDateRaw);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }, [startDateRaw]);

  const nightsCount = useMemo(() => {
    const pkgObj = selectedPkg || quote || {};
    return getPackageDurationDetails(pkgObj, query).nights;
  }, [selectedPkg, quote, query]);

  const daysCount = useMemo(() => {
    const pkgObj = selectedPkg || quote || {};
    return getPackageDurationDetails(pkgObj, query).days;
  }, [selectedPkg, quote, query]);

  const durationText = useMemo(() => {
    const pkgObj = selectedPkg || quote || {};
    return getPackageDurationDetails(pkgObj, query).label;
  }, [selectedPkg, quote, query]);

  const adults = query?.numberOfAdults || 2;
  const children = query?.numberOfChildren || 0;
  const infants = query?.numberOfInfants || 0;

  const paxText = useMemo(() => {
    const parts = [];
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
    if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);
    if (infants > 0) parts.push(`${infants} Infant${infants > 1 ? "s" : ""}`);
    return parts.join(", ") || "2 Adults";
  }, [adults, children, infants]);

  const totalPrice = Math.round(
    Number(quote?.clientTotalAmount ?? quote?.pricing?.totalAmount ?? quote?.totalAmount ?? 14500)
  );

  const gstPercent = Number(
    quote?.gstPercent ??
    quote?.pricing?.tax?.gst?.percent ??
    quote?.pricing?.gstPercent ??
    5
  );
  const taxLabel = gstPercent > 0 ? `(inc. ${gstPercent}% GST & other Taxes)` : `(inc. Taxes & Charges)`;

  const allModalServices = useMemo(() => {
    return Array.isArray(quote?.services) ? quote.services : [];
  }, [quote?.services]);

  const isHotelItem = (s) => {
    const type = String(s?.type || s?.category || "").trim().toLowerCase();
    const title = String(s?.title || s?.hotelName || s?.name || "").trim().toLowerCase();
    if (type === "hotel" || type === "accommodation" || type === "stay") return true;
    if (s?.roomType || s?.starCategory || s?.hotelCategory || s?.starRating) return true;
    if (title.includes("hotel") || title.includes("resort") || title.includes("villas") || title.includes("inn") || title.includes("suites") || title.includes("ramada") || title.includes("alka") || title.includes("hyatt") || title.includes("taj") || title.includes("eden") || title.includes("kandyan") || title.includes("amari")) return true;
    return false;
  };

  const isTransferItem = (s) => {
    const type = String(s?.type || s?.category || "").trim().toLowerCase();
    const title = String(s?.title || s?.name || s?.particulars || "").trim().toLowerCase();
    if (type === "transfer" || type === "transport" || type === "cab" || type === "car" || type === "flight") return true;
    if (title.includes("drop") || title.includes("pickup") || title.includes("transfer") || title.includes("airport") || title.includes("cab") || title.includes("car")) return true;
    return false;
  };

  const isActivityItem = (s) => {
    const type = String(s?.type || s?.category || "").trim().toLowerCase();
    const title = String(s?.title || s?.name || s?.particulars || "").trim().toLowerCase();
    if (type === "activity" || type === "sightseeing") return true;
    if (title.includes("sightseeing") || title.includes("tour") || title.includes("aarti") || title.includes("hopping") || title.includes("boating") || title.includes("safari") || title.includes("cruise") || title.includes("water sports")) return true;
    return false;
  };

  const modalHotelServices = useMemo(() => {
    const hs = allModalServices.filter((s) => isHotelItem(s));
    if (hs.length > 0) return hs;
    if (allModalServices.length === 0) {
      return [
        {
          city: "Colombo",
          title: "Amari Colombo",
          hotelCategory: "5 Star",
          nights: 1,
          mealPlan: "Breakfast and Dinner",
          roomType: "1 Superior City View",
          pax: `${adults} Pax`,
          checkIn: "19 Aug",
          checkOut: "20 Aug",
          nightLabel: "1st Night",
        },
      ];
    }
    return [];
  }, [allModalServices, adults]);

  const modalTransferServices = useMemo(() => {
    const quoteTransfers = allModalServices.filter((s) => !isHotelItem(s) && isTransferItem(s));
    const packageTransfers = Array.isArray(selectedPkg?.transfers) ? selectedPkg.transfers : [];

    if (quoteTransfers.length === 0) return packageTransfers;

    return quoteTransfers.map((service, index) => {
      const serviceName = String(service?.name || service?.serviceName || service?.title || "").toLowerCase();
      const matchingPackageTransfer = packageTransfers.find((transfer) => {
        const transferName = String(transfer?.name || transfer?.serviceName || transfer?.title || "").toLowerCase();
        return serviceName && transferName && (serviceName === transferName || serviceName.includes(transferName) || transferName.includes(serviceName));
      }) || packageTransfers[index] || {};

      return {
        ...matchingPackageTransfer,
        ...service,
        usageType: service?.usageType || service?.usage || service?.transportUsageLabel || service?.transportUsageOptionKey || matchingPackageTransfer?.usageType || matchingPackageTransfer?.usage || "",
        passengerCapacity: service?.passengerCapacity || service?.passenger_capacity || service?.capacity || matchingPackageTransfer?.passengerCapacity || matchingPackageTransfer?.passenger_capacity || matchingPackageTransfer?.capacity || "",
        luggageCapacity: service?.luggageCapacity || service?.luggage_capacity || service?.luggage || matchingPackageTransfer?.luggageCapacity || matchingPackageTransfer?.luggage_capacity || matchingPackageTransfer?.luggage || "",
      };
    });
  }, [allModalServices, selectedPkg?.transfers]);

  const modalActivityServices = useMemo(() => {
    return allModalServices.filter((s) => !isHotelItem(s) && !isTransferItem(s) && isActivityItem(s));
  }, [allModalServices]);

  const modalOtherServices = useMemo(() => {
    return allModalServices.filter((s) => !isHotelItem(s) && !isTransferItem(s) && !isActivityItem(s));
  }, [allModalServices]);

  const hotelServices = modalHotelServices;

  const cityStayBreakdown = useMemo(() => {
    return hotelServices
      .map((h) => `${h.city || "City"} ${h.nights || 1} Night${(h.nights || 1) > 1 ? "s" : ""}`)
      .join(" / ");
  }, [hotelServices]);

  const inclusions = useMemo(() => {
    const packageItems = toDisplayList(selectedPkg?.inclusions);
    if (packageItems.length > 0) return packageItems;
    const quoteItems = toDisplayList(quote?.inclusions);
    return quoteItems.length > 0 ? quoteItems : DEFAULT_INCLUSIONS;
  }, [selectedPkg?.inclusions, quote?.inclusions]);

  const exclusions = useMemo(() => {
    const packageItems = toDisplayList(selectedPkg?.exclusions);
    if (packageItems.length > 0) return packageItems;
    const quoteItems = toDisplayList(quote?.exclusions);
    return quoteItems.length > 0 ? quoteItems : DEFAULT_EXCLUSIONS;
  }, [selectedPkg?.exclusions, quote?.exclusions]);

  const sellerBankDetails = useMemo(() => {
    const pkg = selectedPkg || quote || {};
    if (Array.isArray(pkg?.sellerBankDetails) && pkg.sellerBankDetails.length > 0) {
      return pkg.sellerBankDetails;
    }
    if (Array.isArray(quote?.sellerBankDetails) && quote.sellerBankDetails.length > 0) {
      return quote.sellerBankDetails;
    }
    return DEFAULT_SELLER_BANK_DETAILS;
  }, [selectedPkg, quote]);

  const companyName = currentUser?.companyName || "Holiday Circuit";

  // Build WhatsApp Plain Text matching reference Image 1
  const whatsappPlainText = useMemo(() => {
    const lines = [];

    if (shareMode === "VOUCHER") {
      const vNum = query?.voucherNumber || `VCH-${query?.queryId || "001"}`;
      lines.push(`Hi *${clientName}*,`);
      lines.push("");
      lines.push(`Greetings from *${companyName}*! 🙏`);
      lines.push("");
      lines.push(`Your official *Travel Voucher (${vNum})* for your trip to *${destination}* has been issued.`);
      lines.push("");
      lines.push(`📑 *TRAVEL VOUCHER OVERVIEW*`);
      lines.push(`----------------------------------------`);
      lines.push(`• *Voucher Number:* ${vNum}`);
      lines.push(`• *Guest Details:* ${clientName}`);
      lines.push(`• *Destination:* ${destination}`);
      lines.push(`• *Duration:* ${durationText}`);
      lines.push(`• *Travel Date:* ${shortStartDateFormatted}`);
      lines.push(`• *Passengers:* ${paxText}`);
      lines.push(`• *Voucher Status:* ✅ *Confirmed*`);
      lines.push(`----------------------------------------`);
      lines.push("");
      lines.push(`📋 *BOOKED SERVICES & CONFIRMATIONS*`);
      lines.push(`----------------------------------------`);

      const rawServices = Array.isArray(quote?.services) && quote.services.length > 0 
        ? quote.services 
        : (Array.isArray(query?.services) && query.services.length > 0
            ? query.services
            : (Array.isArray(query?.voucherServices) && query.voucherServices.length > 0
                ? query.voucherServices
                : []));

      if (rawServices.length === 0) {
        lines.push("_No specific services listed for this voucher._");
        lines.push("");
      } else {
        rawServices.forEach((s) => {
          const sType = String(s.type || "service").toLowerCase();
          let icon = "📌";
          if (sType.includes("hotel")) icon = "🏨";
          else if (sType.includes("transport") || sType.includes("transfer") || sType.includes("cab")) icon = "🚗";
          else if (sType.includes("activity") || sType.includes("sightseeing") || sType.includes("tour")) icon = "🪂";
          else if (sType.includes("flight")) icon = "✈️";

          const sTitle = s.title || s.name || "Service";
          const realCnfNum = s.confirmationNumber || s.cnfNumber || s.supplierConfirmation || s.voucherNumber || (s.confirmation && s.confirmation !== "Confirmed(Confirmed)" && s.confirmation !== "Confirmed" && s.confirmation !== "Pending" ? s.confirmation : null);
          const cnfNumDisplay = realCnfNum ? String(realCnfNum).trim() : "-";
          const isPending = (String(s.confirmation || "").toLowerCase().includes("pending") || cnfNumDisplay === "-");
          const statusText = isPending ? "⏳ *Pending*" : "✅ *Confirmed*";

          lines.push(`${icon} *${sTitle}*`);
          lines.push(`   └ Status: ${statusText}`);
          lines.push(`   └ Confirmation No: *${cnfNumDisplay}*`);
          lines.push("");
        });
      }

      let parsedVoucherTerms = [];
      if (!removeTerms && selectedTermId !== "none") {
        if (selectedTermId && selectedTermId !== "default") {
          const matched = availableAgentTerms.find((t) => t.id === selectedTermId);
          if (matched && matched.items?.length > 0) {
            parsedVoucherTerms = matched.items;
          }
        }
        if (parsedVoucherTerms.length === 0) {
          const rawVoucherTerms =
            query?.termsAndConditions ||
            quote?.termsAndConditions ||
            query?.terms ||
            quote?.terms ||
            query?.voucher?.termsAndConditions ||
            quote?.voucher?.termsAndConditions ||
            [];
          if (Array.isArray(rawVoucherTerms)) {
            parsedVoucherTerms = rawVoucherTerms.filter((t) => typeof t === "string" && t.trim().length > 0);
          } else if (typeof rawVoucherTerms === "string" && rawVoucherTerms.trim()) {
            parsedVoucherTerms = rawVoucherTerms.split("\n").map((t) => t.trim()).filter((t) => t.length > 0);
          }
          if (parsedVoucherTerms.length === 0 && availableAgentTerms.length > 0) {
            const matchedVoucherTerm = availableAgentTerms.find((t) =>
              t.name.toLowerCase().includes("voucher")
            );
            if (matchedVoucherTerm && matchedVoucherTerm.items?.length > 0) {
              parsedVoucherTerms = matchedVoucherTerm.items;
            } else if (availableAgentTerms[0]?.items?.length > 0) {
              parsedVoucherTerms = availableAgentTerms[0].items;
            }
          }
          if (parsedVoucherTerms.length === 0 && DEFAULT_VOUCHER_TERMS?.length > 0) {
            parsedVoucherTerms = DEFAULT_VOUCHER_TERMS;
          }
        }
      }

      if (parsedVoucherTerms.length > 0) {
        lines.push(`📋 *TERMS & CONDITIONS*`);
        lines.push(`----------------------------------------`);
        parsedVoucherTerms.forEach((pt) => lines.push(`• ${pt}`));
        lines.push("");
      }

      lines.push(`----------------------------------------`);
      lines.push(`Please review your official Travel Voucher details above.`);
      lines.push(`Have a safe and wonderful trip! ✈️🌟`);
      return lines.join("\n");
    }

    if (shareMode === "PACKAGE" || (!quote?._id && selectedPkg)) {
      const pkgObj = selectedPkg || quote || {};
      const pkgTitle = pkgObj.title || "Pre-Defined Package";
      const rawPrice = Number(pkgObj.price || pkgObj.basePrice || 225000);
      const pkgPrice = Math.round(rawPrice).toLocaleString("en-IN");
      const paxCount = Math.max(1, query?.numberOfAdults || 2);
      const perPersonPrice = Math.round(rawPrice / paxCount).toLocaleString("en-IN");

      lines.push(`Hi *${clientName}*,`);
      lines.push("");
      lines.push(`Greetings from *${companyName}*! 🙏`);
      lines.push("");
      lines.push(`Here is the package details for your upcoming trip to *${destination}*:`);
      lines.push("");
      lines.push(`📦 *PACKAGE: ${pkgTitle.toUpperCase()}*`);
      lines.push(`----------------------------------------`);
      lines.push(`• *Total Package Price:* INR ${pkgPrice} (INR ${perPersonPrice} / Person)`);
      lines.push(`• *Destination:* ${destination}`);
      lines.push(`• *Duration:* ${durationText}`);
      lines.push(`• *Travel Date:* ${shortStartDateFormatted}`);
      lines.push(`• *Passengers:* ${paxText}`);
      lines.push(`----------------------------------------`);
      lines.push("");

      const hotels = Array.isArray(pkgObj.hotels) ? pkgObj.hotels : [];
      if (hotels.length > 0) {
        lines.push(`🏨 *ACCOMMODATIONS*`);
        hotels.forEach((h) => {
          lines.push(`• *${h.serviceTitle || h.title || h.name || "Hotel Stay"}*`);
          if (h.hotel_name || h.hotelName || h.actualHotelName) {
            lines.push(`  └ Hotel: ${h.hotel_name || h.hotelName || h.actualHotelName}`);
          }
          lines.push(`  └ Room: ${h.room_type || h.roomType || "Standard Room"}`);
        });
        lines.push("");
      }

      lines.push(`Please let us know if you need any adjustments. Have a great trip! ✈️🌟`);
      return lines.join("\n");
    }

    lines.push(`Hi ${clientName},`);
    lines.push("");
    lines.push(`Greetings from ${companyName}.`);
    lines.push("");
    lines.push(`As per our discussion, following is the *updated quote after conversion* details.`);
    lines.push("");
    lines.push(`*After Conversion Updated Quote*`);
    lines.push("");
    lines.push(`*Trip ID ${tripId}*`);
    lines.push(`---------`);
    lines.push(`*${destination} Trip*`);
    lines.push(`• *${shortStartDateFormatted}* _for_ *${nightsCount} Nights, ${daysCount} Days*`);
    lines.push(`• *${paxText}*`);
    lines.push("");

    if (!hideTotalPrice) {
      lines.push(`*Total Price (INR): ${totalPrice.toLocaleString("en-IN")} /-* _${taxLabel}_`);
      lines.push("");
    }

    if (hotelServices.length > 0) {
      lines.push(`🏨 _*Hotels*_`);
      lines.push(`---------`);
      hotelServices.forEach((h, idx) => {
        const nightStr = h.nightLabel || (idx === 0 ? "1st Night" : `${idx + 1}th Night`);
        lines.push(`*${nightStr}* _at_ *${h.city || destination}*`);
        lines.push(`_Check-in: ${h.checkIn || shortStartDateFormatted} & Check-out: ${h.checkOut || ""}_`);
        lines.push(`*${h.title || h.hotelName || "Hotel"}* (${h.hotelCategory || "5 Star"}${similarHotelWord ? " / Similar" : ""})`);
        lines.push(`${h.mealPlan || h.meals || "Breakfast and Dinner"} • ${h.roomType || "Standard Room"} (${h.pax || `${adults} Pax`})`);
        lines.push("");
      });
    }

    if (modalTransferServices.length > 0) {
      lines.push(`🚗 _*Transfers & Transport*_`);
      lines.push(`---------`);
      modalTransferServices.forEach((t) => {
        const tTitle = t.title || t.name || t.particulars || "Transfer";
        const tDate = t.serviceDateLabel || t.date || "";
        lines.push(`• *${tTitle}*${tDate ? ` (${tDate})` : ""}`);
        if (t.description) lines.push(`  _${t.description}_`);
        lines.push("");
      });
    }

    if (modalActivityServices.length > 0) {
      lines.push(`🪂 _*Activities & Sightseeing*_`);
      lines.push(`---------`);
      modalActivityServices.forEach((a) => {
        const aTitle = a.title || a.name || a.particulars || "Activity";
        const aDate = a.serviceDateLabel || a.date || "";
        lines.push(`• *${aTitle}*${aDate ? ` (${aDate})` : ""}`);
        if (a.description) lines.push(`  _${a.description}_`);
        lines.push("");
      });
    }

    if (showIncExc) {
      if (inclusions.length > 0) {
        lines.push(`✅ *Inclusions:*`);
        inclusions.forEach((inc) => lines.push(`• ${inc}`));
        lines.push("");
      }
      if (exclusions.length > 0) {
        lines.push(`❌ *Exclusions:*`);
        exclusions.forEach((exc) => lines.push(`• ${exc}`));
        lines.push("");
      }
    }

    if (sellerBankDetails.length > 0) {
      lines.push(`🏦 _*Bank Details*_`);
      lines.push(`---------`);
      sellerBankDetails.forEach((b) => {
        lines.push(`• *${b.label || "Detail"}:* ${b.value || "-"}`);
      });
      lines.push("");
    }

    if (!removeTerms && selectedTermId !== "none") {
      let quoteTerms = [];
      if (selectedTermId && selectedTermId !== "default") {
        const matched = availableAgentTerms.find((t) => t.id === selectedTermId);
        if (matched && matched.items?.length > 0) {
          quoteTerms = matched.items;
        }
      }
      lines.push(`📋 *Terms & Conditions:*`);
      if (quoteTerms.length > 0) {
        quoteTerms.forEach((pt) => lines.push(`• ${pt}`));
      } else {
        lines.push(`• 25% non-refundable deposit required to confirm booking.`);
        lines.push(`• Standard Check-in: 14:00-15:00, Check-out: 11:00-12:00.`);
        lines.push(`• Rates & availability subject to change until confirmed.`);
      }
      lines.push("");
    }

    return lines.join("\n").trim();
  }, [
    clientName,
    companyName,
    tripId,
    destination,
    shortStartDateFormatted,
    nightsCount,
    daysCount,
    paxText,
    hotelServices,
    modalTransferServices,
    modalActivityServices,
    similarHotelWord,
    showIncExc,
    inclusions,
    exclusions,
    sellerBankDetails,
    hideTotalPrice,
    totalPrice,
    removeTerms,
    adults,
    shareMode,
    query?.voucherNumber,
    query?.queryId,
    durationText,
    selectedTermId,
    availableAgentTerms,
  ]);

  const handleSendWhatsApp = async () => {
    const rawPhone = String(query?.clientPhone || "").replace(/\D/g, "");
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappPlainText)}`;

    window.open(url, "_blank");

    if (onMarkShared && quote) {
      try {
        await onMarkShared(quote);
      } catch (err) {
        console.error("Mark shared failed:", err);
      }
    }
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsappPlainText);
    toast.success("WhatsApp text copied to clipboard!");
  };

  const handleDownloadPDF = async () => {
    if (getClientPdfUrl && quote?._id) {
      try {
        const url = await getClientPdfUrl(quote._id);
        window.open(url, "_blank");
      } catch (err) {
        toast.error("Unable to generate PDF.");
      }
    } else {
      window.print();
    }
  };

  const handleCopyEmailHtml = () => {
    const htmlString = emailPreviewHtml || emailContentRef.current?.innerHTML;
    if (!htmlString) return;
    navigator.clipboard.writeText(htmlString);
    toast.success("Email template copied to clipboard!");
  };

  const handleDownloadWord = () => {
    const contentHtml = emailPreviewHtml || emailContentRef.current?.innerHTML;
    if (!contentHtml) return;

    const fullDocHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Quotation - ${clientName}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 13px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          .header-banner { background-color: #fca5a5; font-weight: bold; text-align: center; padding: 8px; color: #881337; }
          .yellow-badge { background-color: #fef08a; padding: 3px 6px; font-weight: bold; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", fullDocHtml], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quotation_${tripId}_${clientName.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Word document downloaded!");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-center items-start bg-slate-950/70 p-2 sm:p-4 pt-2 sm:pt-3 overflow-y-auto custom-scrollbar">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-none lg:w-[calc(100vw-7rem)] my-4 sm:my-6 flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-2xl shrink-0">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {shareMode === "VOUCHER" ? "Share Travel Voucher" : shareMode === "PACKAGE" ? "Share Package" : "Share Quotation"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* DISABLED TERMS AND CONDITIONS ALERT BANNER */}
          {shareMode !== "PACKAGE" && shareMode !== "VOUCHER" && (
            <div className="bg-[#fff9e6] border-b border-[#ffe599] px-6 py-3 flex items-start gap-3 text-amber-900 shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#b45309]">Disabled Terms and Conditions</h4>
                <p className="text-[11px] text-[#d97706] mt-0.5 font-medium leading-relaxed">
                  TnC used in this quote has been disabled. Please edit Inclusions/Exclusions and select valid terms and conditions before sharing.
                </p>
              </div>
            </div>
          )}

          {/* TOP TABS & OPTIONS BAR CONTAINER */}
          <div className="border-b border-slate-200 bg-white shrink-0">
            {/* TABS */}
            <div className="flex border-b border-slate-200 px-6 gap-8">
              <button
                type="button"
                onClick={() => setActiveTab("whatsapp")}
                className={`py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "whatsapp"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className={`py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "email"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Email
              </button>
            </div>

            {/* SUBTITLE */}
            <div className="px-6 pt-2.5 pb-1 text-[12px] text-slate-500 flex items-center gap-1.5 font-normal">
              <span>💡</span>
              <span>Use toggles and terms template dropdown to customize the voucher content according to your needs.</span>
            </div>

            {/* OPTIONS ROW WITH TERMS DROPDOWN AND BUTTON ON RIGHT */}
            <div className="px-6 pb-3 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-5 font-medium">
                {activeTab === "whatsapp" ? (
                  <>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={showIncExc}
                        onChange={(e) => setShowIncExc(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Inc/Exc</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={showPriceBreakup}
                        onChange={(e) => setShowPriceBreakup(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Price Breakup (Component Wise Total) ˅</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={hideTotalPrice}
                        onChange={(e) => setHideTotalPrice(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Hide Total Price</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={isPdfMode}
                        onChange={(e) => setIsPdfMode(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>PDF</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={removeTerms}
                        onChange={(e) => {
                          setRemoveTerms(e.target.checked);
                          if (e.target.checked) setSelectedTermId("none");
                          else setSelectedTermId("default");
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Remove Terms</span>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={showPriceBreakup}
                        onChange={(e) => setShowPriceBreakup(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Price Breakup (Item Wise Detailed)</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={removeItinerary}
                        onChange={(e) => setRemoveItinerary(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Remove Itinerary</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={removeTerms}
                        onChange={(e) => {
                          setRemoveTerms(e.target.checked);
                          if (e.target.checked) setSelectedTermId("none");
                          else setSelectedTermId("default");
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Remove Terms</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={removeTransport}
                        onChange={(e) => setRemoveTransport(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Remove Transports & Activities</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={isPdfMode}
                        onChange={(e) => setIsPdfMode(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>PDF</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-emerald-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={similarHotelWord}
                        onChange={(e) => setSimilarHotelWord(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Similar Word In Hotel</span>
                    </label>
                  </>
                )}
              </div>

              {/* RIGHT SIDE: AGENT TERMS & CONDITIONS DROPDOWN & ACTIONS */}
              <div className="flex items-center gap-2.5 ml-auto flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                    <FileText size={12} className="text-amber-600" />
                    <span>Terms:</span>
                  </span>
                  <select
                    value={selectedTermId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTermId(val);
                      if (val === "none") {
                        setRemoveTerms(true);
                      } else {
                        setRemoveTerms(false);
                      }
                    }}
                    disabled={loadingTerms}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-800 shadow-2xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer max-w-[200px] sm:max-w-[240px] truncate disabled:opacity-50"
                  >
                    <option value="default">Default (OPS / Voucher T&amp;C)</option>
                    {availableAgentTerms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.items?.length || 0} pts)
                      </option>
                    ))}
                    <option value="none">None (Exclude Terms)</option>
                  </select>
                </div>

                {activeTab === "whatsapp" && (
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="px-4 py-1.5 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-md font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 active:scale-95"
                  >
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MAIN TAB CONTENT AREA */}
          <div className={`transition-colors ${activeTab === "whatsapp" ? "p-6 sm:p-8 bg-[#faf8f2]" : "p-0 bg-white"}`}>
            {activeTab === "whatsapp" ? (
              /* WHATSAPP TAB PREVIEW MATCHING REFERENCE IMAGE 1 PERFECTLY */
              <div className="w-full max-w-[490px] mx-auto flex flex-col items-center">
                {/* WHATSAPP GREEN BUBBLE */}
                <div className="w-full bg-[#e8f5e9] border border-[#c8e6c9] rounded-2xl p-5 sm:p-7 text-[#0f172a] text-xs sm:text-[13px] font-sans leading-relaxed shadow-2xs whitespace-pre-wrap select-text">
                  {shareMode === "VOUCHER" ? (
                    <div className="space-y-3 font-sans text-slate-900">
                      <p className="font-normal text-slate-900">Hi <strong>{clientName}</strong>,</p>
                      <p>Greetings from <strong>{companyName}</strong>.</p>
                      <p>
                        Your official <strong>Travel Voucher ({query?.voucherNumber || `VCH-${query?.queryId || "001"}`})</strong> for your trip to <strong>{destination}</strong> has been issued.
                      </p>

                      <div className="mt-4 pt-3 border-t border-emerald-300/60">
                        <p className="font-bold text-black text-sm">📋 Travel Voucher Details</p>
                        <p className="text-slate-400 font-mono text-xs select-none">---------</p>
                        <div className="mt-2 space-y-1 text-slate-900 font-medium">
                          <p>• <strong>Voucher Number:</strong> {query?.voucherNumber || `VCH-${query?.queryId || "001"}`}</p>
                          <p>• <strong>Destination:</strong> {destination}</p>
                          <p>• <strong>Travel Dates:</strong> {shortStartDateFormatted}</p>
                          <p>• <strong>Duration:</strong> {durationText}</p>
                          <p>• <strong>Passengers:</strong> {paxText}</p>
                          <p>• <strong>Voucher Status:</strong> <span className="text-emerald-700 font-bold">✓ Confirmed</span></p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-300/60">
                        <p className="font-bold text-black text-xs uppercase tracking-wide">Included Services & Confirmations</p>
                        <p className="text-slate-400 font-mono text-xs select-none">---------</p>
                        <div className="mt-2 space-y-2.5 text-xs text-slate-900">
                          {(() => {
                            const previewServices = Array.isArray(quote?.services) && quote.services.length > 0 
                              ? quote.services 
                              : (Array.isArray(query?.services) && query.services.length > 0
                                  ? query.services
                                  : (Array.isArray(query?.voucherServices) && query.voucherServices.length > 0
                                      ? query.voucherServices
                                      : []));
                            if (previewServices.length === 0) {
                              return <p className="italic text-slate-400">No specific services listed for this voucher.</p>;
                            }
                            return previewServices.map((s, idx) => {
                              const sTitle = s.title || s.name || "Service";
                              const realCnfNum = s.confirmationNumber || s.cnfNumber || s.supplierConfirmation || s.voucherNumber || (s.confirmation && s.confirmation !== "Confirmed(Confirmed)" && s.confirmation !== "Confirmed" && s.confirmation !== "Pending" ? s.confirmation : null);
                              const cnfNumDisplay = realCnfNum ? String(realCnfNum).trim() : "-";
                              const isPending = !realCnfNum && String(s.confirmation || "").toLowerCase().includes("pending");

                              return (
                                <div key={idx} className="space-y-0.5">
                                  <p className="font-bold text-black">• {sTitle}</p>
                                  <p className="pl-3 text-slate-800">
                                    Status: <span className={isPending ? "text-amber-800 font-semibold" : "text-emerald-800 font-bold"}>{isPending ? "⏳ Pending" : "✓ Confirmed"}</span> &nbsp;|&nbsp; Confirmation No: <strong>{cnfNumDisplay}</strong>
                                  </p>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {!removeTerms && selectedTermId !== "none" && (
                        <div className="mt-4 pt-3 border-t border-emerald-300/60">
                          <p className="font-bold text-black text-xs uppercase tracking-wide">📋 Terms &amp; Conditions</p>
                          <p className="text-slate-400 font-mono text-xs select-none">---------</p>
                          <div className="mt-2 space-y-1 text-xs text-slate-900">
                            {(() => {
                              let termsToShow = [];
                              if (selectedTermId && selectedTermId !== "default") {
                                const matched = availableAgentTerms.find((t) => t.id === selectedTermId);
                                if (matched && matched.items?.length > 0) termsToShow = matched.items;
                              }
                              if (termsToShow.length === 0) {
                                const raw = query?.termsAndConditions || quote?.termsAndConditions || query?.terms || quote?.terms || query?.voucher?.termsAndConditions || quote?.voucher?.termsAndConditions || [];
                                if (Array.isArray(raw)) termsToShow = raw.filter((t) => typeof t === "string" && t.trim().length > 0);
                                else if (typeof raw === "string" && raw.trim()) termsToShow = raw.split("\n").map(t => t.trim()).filter(Boolean);
                              }
                              if (termsToShow.length === 0 && availableAgentTerms.length > 0) {
                                const matchedVoucher = availableAgentTerms.find((t) => t.name.toLowerCase().includes("voucher"));
                                if (matchedVoucher && matchedVoucher.items?.length > 0) termsToShow = matchedVoucher.items;
                                else if (availableAgentTerms[0]?.items?.length > 0) termsToShow = availableAgentTerms[0].items;
                              }
                              if (termsToShow.length === 0 && DEFAULT_VOUCHER_TERMS?.length > 0) {
                                termsToShow = DEFAULT_VOUCHER_TERMS;
                              }
                              if (termsToShow.length === 0) {
                                termsToShow = [
                                  "25% non-refundable deposit required to confirm booking.",
                                  "Standard Check-in: 14:00-15:00, Check-out: 11:00-12:00.",
                                  "Rates & availability subject to change until confirmed."
                                ];
                              }
                              return termsToShow.map((pt, idx) => (
                                <p key={idx}>• {pt}</p>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-emerald-300/60 text-slate-800 italic">
                        <p>Please find your official Travel Voucher details attached above. Have a wonderful trip! ✈️</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-normal text-slate-900">Hi {clientName},</p>
                      <p className="mt-3">Greetings from {companyName}.</p>
                      <p className="mt-3">
                        As per our discussion, following is the <strong className="font-bold text-black">updated quote after conversion</strong> details.
                      </p>
                      <p className="mt-4 font-bold text-black text-xs sm:text-sm">After Conversion Updated Quote</p>
                      
                      <p className="mt-3 font-bold text-black">Trip ID {tripId}</p>
                      <p className="text-slate-500 font-mono text-xs select-none">---------</p>

                      <div className="mt-3">
                        <p className="font-bold text-black">{destination} Trip</p>
                        <p className="text-slate-900">• <strong className="font-bold">{shortStartDateFormatted}</strong> <span className="font-normal italic">for</span> <strong className="font-bold">{nightsCount} Nights, {daysCount} Days</strong></p>
                        <p className="text-slate-900">• <strong className="font-bold">{paxText}</strong></p>
                      </div>

                      {!hideTotalPrice && (
                        <div className="mt-4">
                          <p className="font-bold text-black">
                            Total Price (INR): {totalPrice.toLocaleString("en-IN")} /- <span className="font-normal italic text-slate-800">{taxLabel}</span>
                          </p>
                        </div>
                      )}

                      {hotelServices.length > 0 && (
                        <>
                          <div className="mt-5">
                            <p className="font-bold text-black flex items-center gap-1.5 text-sm sm:text-base">
                              <span>🏨</span> <span className="italic">Hotels</span>
                            </p>
                            <p className="text-slate-500 font-mono text-xs select-none">---------</p>
                          </div>

                          <div className="mt-4 space-y-4">
                            {hotelServices.map((h, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <p className="font-bold text-black">
                                  {h.nightLabel || `${idx + 1}st Night`} <span className="font-normal italic">at</span> {h.city || "Destination"}
                                </p>
                                <p className="text-slate-800 italic">
                                  Check-in: {h.checkIn || shortStartDateFormatted} & Check-out: {h.checkOut || ""}
                                </p>
                                <p className="font-bold text-slate-900">
                                  {h.title || h.hotelName || "Hotel"} <span className="font-normal">({h.hotelCategory || "5 Star"}${similarHotelWord ? " / Similar" : ""})</span>
                                </p>
                                <p className="text-slate-900 font-normal">
                                  {h.mealPlan || h.meals || "Breakfast and Dinner"} • {h.roomType || "Standard Room"} ({h.pax || `${adults} Pax`})
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {modalTransferServices.length > 0 && (
                        <>
                          <div className="mt-5">
                            <p className="font-bold text-black flex items-center gap-1.5 text-sm sm:text-base">
                              <span>🚗</span> <span className="italic">Transfers & Transport</span>
                            </p>
                            <p className="text-slate-500 font-mono text-xs select-none">---------</p>
                          </div>
                          <div className="mt-3 space-y-3">
                            {modalTransferServices.map((t, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <p className="font-bold text-black">• {t.title || t.name || t.particulars || "Transfer Service"}{t.serviceDateLabel || t.date ? ` (${t.serviceDateLabel || t.date})` : ""}</p>
                                {t.description && <p className="text-slate-700 italic pl-3">{t.description}</p>}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {modalActivityServices.length > 0 && (
                        <>
                          <div className="mt-5">
                            <p className="font-bold text-black flex items-center gap-1.5 text-sm sm:text-base">
                              <span>🪂</span> <span className="italic">Activities & Sightseeing</span>
                            </p>
                            <p className="text-slate-500 font-mono text-xs select-none">---------</p>
                          </div>
                          <div className="mt-3 space-y-3">
                            {modalActivityServices.map((a, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <p className="font-bold text-black">• {a.title || a.name || a.particulars || "Activity / Tour"}{a.serviceDateLabel || a.date ? ` (${a.serviceDateLabel || a.date})` : ""}</p>
                                {a.description && <p className="text-slate-700 italic pl-3">{a.description}</p>}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {showIncExc && (
                        <div className="mt-5 pt-4 border-t border-emerald-300/60 space-y-3">
                          <div>
                            <p className="font-bold text-emerald-950">Inclusions</p>
                            <ul className="list-disc pl-5 mt-1 text-slate-900 space-y-0.5">
                              {inclusions.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-bold text-rose-950">Exclusions</p>
                            <ul className="list-disc pl-5 mt-1 text-slate-900 space-y-0.5">
                              {exclusions.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {!removeTerms && (
                        <div className="mt-5 pt-4 border-t border-emerald-300/60 text-slate-800">
                          <p className="font-semibold text-slate-950">📋 Terms & Conditions:</p>
                          <ul className="mt-1 text-xs leading-relaxed space-y-1 text-slate-700">
                            <li>• 25% non-refundable deposit required to confirm booking.</li>
                            <li>• Standard Check-in: 14:00-15:00, Check-out: 11:00-12:00.</li>
                            <li>• Rates & availability subject to change until confirmed.</li>
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* WHATSAPP ACTION BUTTONS */}
                <div className="mt-5 flex items-center justify-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="px-6 py-2.5 bg-[#25d366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Send size={15} />
                    <span>Send via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyWhatsAppText}
                    className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs sm:text-sm rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Copy size={15} />
                    <span>Copy</span>
                  </button>
                </div>

                <p className="mt-4 text-[11px] text-slate-400 font-medium text-center">
                  ðŸ’¡ <strong>ProTip!</strong> Install <a href="https://www.whatsapp.com/download" target="_blank" rel="noreferrer" className="underline text-slate-500 hover:text-slate-700">WhatsApp</a> (mobile or desktop application) for easy messaging.
                </p>
              </div>
            ) : (
              /* EMAIL TAB PREVIEW (EXACT MATCHING REFERENCE SCREENSHOTS) */
              <div className="relative w-full select-text" ref={emailContentRef}>
                {/* FLUSH TOP-RIGHT ACTION BUTTONS BOX MATCHING REFERENCE SCREENSHOT */}
                <div className="absolute top-2 right-5 border border-slate-200 bg-white rounded-lg p-1 flex items-center gap-1.5 shadow-2xs z-20">
                  <button
                    type="button"
                    onClick={() => setEmailPreviewVersion((version) => version + 1)}
                    title="Refresh Preview"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSendEmailModal}
                    title="Send Email directly to Client"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer active:scale-95"
                  >
                    <Mail size={13} />
                    <span>Send Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadWord}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer active:scale-95"
                  >
                    <FileText size={13} />
                    <span>Word</span>
                  </button>
                </div>

                {isEmailPreviewLoading ? (
                  <div className="min-h-[360px] flex items-center justify-center text-sm font-medium text-slate-500">
                    Loading Operations email template…
                  </div>
                ) : emailPreviewHtml ? (
                  <iframe
                    ref={emailPreviewIframeRef}
                    title="Operations quotation email preview"
                    srcDoc={emailPreviewHtml}
                    onLoad={() => requestAnimationFrame(resizeEmailPreview)}
                    className="w-full border-0 bg-white"
                    style={{ height: "720px" }}
                    scrolling="no"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {emailPreviewError || "Operations email template is unavailable for this quotation."}
                  </div>
                )}

                <div className="hidden">
                                {/* GREETING TEXT */}
                <div className="w-full">
                  <p className="text-slate-900 font-semibold text-sm sm:text-base">Dear {clientName},</p>
                  <p className="text-slate-700 mt-2 text-xs sm:text-sm">Greetings from <strong>{companyName}</strong> !!!</p>
                  <p className="text-slate-700 mt-2 text-xs sm:text-sm">
                    As per our discussion, following is the <strong>Updated Quote after Conversion</strong> details.
                  </p>
                </div>

                {/* PACKAGE OVERVIEW TABLE (LEFT ALIGNED MAX-W 520PX) */}
                <div className="w-full">
                  <div className="bg-[#ecfeff] text-[#0f766e] border border-[#7dd3c7] border-b-0 font-bold text-center py-2 px-3 text-xs sm:text-sm">
                    Package Overview
                  </div>
                  <table className="w-full border-collapse border border-slate-200 text-xs sm:text-sm bg-white">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="w-1/3 py-2.5 px-4 font-semibold bg-slate-50 border-r border-slate-200 text-slate-700">Trip ID</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{tripId}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2.5 px-4 font-semibold bg-slate-50 border-r border-slate-200 text-slate-700">Destination</td>
                        <td className="py-2.5 px-4 font-bold">
                          <span className="bg-[#fef08a] border border-amber-300 px-2.5 py-0.5 rounded text-amber-900 text-xs inline-block">
                            {destination} ({durationText})
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2.5 px-4 font-semibold bg-slate-50 border-r border-slate-200 text-slate-700">Travel Dates</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{startDateFormatted} - {endDateFormatted}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="py-2.5 px-4 font-semibold bg-slate-50 border-r border-slate-200 text-slate-700">Trip Duration</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{durationText}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold bg-slate-50 border-r border-slate-200 text-slate-700">Pax</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{paxText}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* HOTELS TABLE (FULL 100% WIDTH MATCHING REFERENCE IMAGE) */}
                {modalHotelServices.length > 0 && (
                  <div className="w-full">
                    <div className="bg-[#ecfeff] text-[#0f766e] border border-[#7dd3c7] border-b-0 font-bold text-center py-2 px-3 text-xs sm:text-sm">
                      Hotels
                    </div>
                    <div className="overflow-x-auto border border-slate-200 bg-white">
                      <table className="w-full border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left w-24">Nights</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left w-28">City</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left">Hotel Name</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left">Meal Plan</th>
                            <th className="py-2.5 px-3 text-left">Accommodation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {modalHotelServices.map((h, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-800">
                                {h.nightLabel || `${idx + 1}st`}
                                {h.checkIn && (
                                  <span className="block text-[11px] text-slate-500 font-normal">({h.checkIn})</span>
                                )}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200 font-bold text-slate-900">{h.city}</td>
                              <td className="py-3 px-3 border-r border-slate-200">
                                <span className="font-bold text-slate-900">
                                  {h.title || h.hotelName}{similarHotelWord ? " / Similar" : ""}
                                </span>
                                {h.hotelCategory && (
                                  <span className="block text-[11px] text-slate-500 font-medium">{h.hotelCategory}</span>
                                )}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200 text-slate-700">
                                {h.mealPlan || h.meals || "Breakfast and Dinner"}
                              </td>
                              <td className="py-3 px-3 text-slate-800">
                                <span className="font-bold block">{h.roomType || "Standard Room"}</span>
                                <span className="text-[11px] text-slate-500 block">{h.pax || `${adults} Pax`}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TRANSFERS & TRANSPORT TABLE (IF ANY) */}
                {modalTransferServices.length > 0 && (
                  <div className="w-full">
                    <div className="bg-[#ecfeff] text-[#0f766e] border border-[#7dd3c7] border-b-0 font-bold text-center py-2 px-3 text-xs sm:text-sm">
                      Transfers & Transport
                    </div>
                    <div className="overflow-x-auto border border-slate-200 bg-white">
                      <table className="w-full border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left w-24 sm:w-28">Service Date</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left">Service / Route</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left">Transport Details</th>
                            <th className="py-2.5 px-3 text-left w-52 sm:w-64">Pax / Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {modalTransferServices.map((t, idx) => {
                            const vName = t.vehicle || t.vehicle_type || t.vehicleType || "Private AC Vehicle";
                            const pCap = Number(t.passengerCapacity || t.passenger_capacity || t.capacity || (/suv|innova/i.test(vName) ? 6 : (/tempo|traveller/i.test(vName) ? 12 : 4)));
                            const lCap = Number(t.luggageCapacity || t.luggage_capacity || t.luggage || (/suv|innova/i.test(vName) ? 4 : (/tempo|traveller/i.test(vName) ? 8 : 2)));
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-800">
                                  {t.serviceDate ? new Date(t.serviceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : `${idx + 1}st Day`}
                                </td>
                                <td className="py-3 px-3 border-r border-slate-200 font-bold text-slate-900">
                                  {t.title || t.name || t.particulars || "Airport Transfer"}
                                </td>
                                <td className="py-3 px-3 border-r border-slate-200 text-slate-700">
                                  <span className="font-bold text-slate-900">
                                    {vName}
                                  </span>
                                  {t.description && (
                                    <span className="mt-1 block text-[11px] text-slate-600">{t.description}</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-slate-800 font-medium">
                                  <span className="block font-bold text-slate-900">{t.pax || `${adults} Pax`}</span>
                                  <span className="mt-1 block text-[11px] font-semibold text-slate-600">
                                    {getTransportUsageLabel(t) || "One Way / Airport Transfer"}
                                  </span>
                                  {(pCap > 0 || lCap > 0) && (
                                    <span className="mt-1 block text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                      {pCap > 0 && `CAPACITY: ${pCap} Pax`}
                                      {pCap > 0 && lCap > 0 && <span className="text-slate-400 mx-1">•</span>}
                                      {lCap > 0 && `LUGGAGE: ${lCap} Bags`}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ACTIVITIES & SIGHTSEEING TABLE (IF ANY) */}
                {modalActivityServices.length > 0 && (
                  <div className="w-full">
                    <div className="bg-[#ecfeff] text-[#0f766e] border border-[#7dd3c7] border-b-0 font-bold text-center py-2 px-3 text-xs sm:text-sm">
                      Activities & Sightseeing
                    </div>
                    <div className="overflow-x-auto border border-slate-200 bg-white">
                      <table className="w-full border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left w-24">Date</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left">Activity / Tour Name</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 text-left">Inclusions & Description</th>
                            <th className="py-2.5 px-3 text-left">Pax</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {modalActivityServices.map((act, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-800">
                                {act.serviceDate ? new Date(act.serviceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : `${idx + 1}st Day`}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200 font-bold text-slate-900">
                                {act.title || act.name || act.particulars || "Sightseeing Tour"}
                              </td>
                              <td className="py-3 px-3 border-r border-slate-200 text-slate-700">
                                {act.description || "Guided Sightseeing Tour | Inclusions Included"}
                              </td>
                              <td className="py-3 px-3 text-slate-800 font-medium">
                                {act.pax || `${adults} Pax`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TOTAL PRICE SECTION (NO EXTRA OUTER CARD, MATCHING REFERENCE IMAGE 3) */}
                {!hideTotalPrice && (
                  <div className="w-full">
                    <div className="bg-[#ecfeff] text-[#0f766e] border border-[#7dd3c7] border-b-0 font-bold text-center py-2 px-3 text-xs sm:text-sm">
                      Total Price
                    </div>
                    <div className="border border-t-0 border-slate-200 p-4 space-y-2 bg-white">
                      <span className="bg-[#fef08a] border border-amber-300 px-2.5 py-0.5 rounded text-amber-900 text-xs font-bold inline-block">
                        Prices (INR)
                      </span>
                      <p className="font-bold text-slate-900 text-sm sm:text-base">
                        Total: {totalPrice.toLocaleString("en-IN")} /- <span className="font-normal italic text-slate-600 text-xs sm:text-sm">(including Taxes)</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* INCLUSIONS & EXCLUSIONS (UNIFIED DIVIDED TABLE LAYOUT MATCHING REFERENCE IMAGE 3) */}
                <div className="w-full border border-slate-200">
                  <div className="grid grid-cols-2 text-center font-bold text-xs sm:text-sm bg-[#ecfeff] text-[#0f766e] divide-x divide-[#7dd3c7] border-b border-[#7dd3c7]">
                    <div className="py-2 px-3">Inclusions</div>
                    <div className="py-2 px-3">Exclusions</div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-200 text-xs sm:text-sm text-slate-800 bg-white">
                    <ul className="p-4 list-disc pl-6 space-y-2">
                      {inclusions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    <ul className="p-4 list-disc pl-6 space-y-2">
                      {exclusions.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                      <li className="font-bold text-amber-900 list-none pt-1">
                        NOTE: Anything not mentioned in the inclusions is excluded.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* BANK DETAILS TABLE */}
                <div className="w-full">
                  <div className="bg-[#ecfeff] text-[#0f766e] border border-[#7dd3c7] border-b-0 font-bold text-center py-2 px-3 text-xs sm:text-sm">
                    Bank Details
                  </div>
                  <div className="overflow-x-auto border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-xs sm:text-sm">
                      <tbody className="divide-y divide-slate-200">
                        {sellerBankDetails.map((b, idx) => (
                          <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                            <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-700 w-1/3 text-xs sm:text-[13px]">
                              {b.label || b.name || "Detail"}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 text-xs sm:text-[13px]">
                              {b.value || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TERMS AND CONDITIONS (NO ROUNDED OUTER CARD MATCHING REFERENCE IMAGE 4) */}
                {!removeTerms && (
                  <div className="w-full">
                    <div className="bg-[#ecfeff] text-[#0f766e] border border-[#7dd3c7] border-b-0 font-bold text-center py-2 px-3 text-xs sm:text-sm">
                      Terms and Conditions
                    </div>
                    <div className="pt-4 space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed bg-white">
                      <p className="font-bold text-slate-900 text-sm">General Terms and Conditions</p>
                      {GENERAL_TERMS_AND_CONDITIONS.map((term, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="font-bold text-slate-900">{term.title}</p>
                          <p className="whitespace-pre-line text-slate-700">{term.text}</p>
                        </div>
                      ))}
                      <p className="font-bold text-slate-900 pt-3 text-center">
                        By booking with {companyName}, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                      </p>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* TOP RECIPIENT EMAIL PROMPT MODAL */}
      <AnimatePresence>
        {isSendEmailModalOpen && (
          <div className="fixed inset-0 z-[160] flex justify-center items-start pt-12 sm:pt-16 bg-slate-950/65 backdrop-blur-xs p-4 overflow-y-auto custom-scrollbar">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 border-t-4 border-t-emerald-600 overflow-hidden text-slate-800"
            >
              {/* MODAL HEADER MATCHING SHARE MODAL & AGENT UI */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                      {isVoucherMode
                        ? "Send Travel Voucher Email"
                        : isPackageMode
                        ? "Send Package Email"
                        : "Send Quotation Email"}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal">
                      {isVoucherMode
                        ? "Verify recipient email address before dispatching official voucher"
                        : isPackageMode
                        ? "Verify recipient email address before dispatching package details"
                        : "Verify recipient email address before dispatching quotation"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSendEmailModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* FORM BODY MATCHING AGENT UI DESIGN */}
              <form onSubmit={handleConfirmSendEmail} className="p-6 space-y-4 bg-white">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Recipient Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={targetEmailInput}
                      onChange={(e) => setTargetEmailInput(e.target.value)}
                      placeholder="e.g. client@example.com"
                      className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900 bg-white transition-all shadow-2xs"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-normal">
                    Pre-filled with registered/client email. You can modify or enter an alternate email.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubjectInput}
                    onChange={(e) => setEmailSubjectInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900 bg-white transition-all shadow-2xs"
                  />
                </div>

                {/* ACTION BUTTONS MATCHING AGENT UI */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSendEmailModalOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Email…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isVoucherMode ? "Send Voucher Email" : "Send Email Now"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
