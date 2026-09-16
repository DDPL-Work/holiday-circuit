import { DEFAULT_LOGO_BASE64 } from "./defaultLogoBase64.js";

export const DEFAULT_FALLBACK_LOGO = DEFAULT_LOGO_BASE64;

export const DEFAULT_VOUCHER_TERMS = [
  "Welcome to Holiday Circuit. These Terms and Conditions govern your use of the Holiday Circuit services. When You Make a booking or reservation, you agree to be bound by these Terms.",
  "Bookings and Reservations",
  "Booking Process: When you make a booking or reservation through Holiday Circuit, you agree to provide accurate and complete information. Any discrepancies or errors in the information you provide may result in the cancellation of your booking.",
  "Payment: Payments for bookings are due as specified during the booking process. Failure to make payments on time may result in the cancellation of your booking.",
  "Cancellations and Refunds: Cancellation and refund policies vary depending on the type of booking. Please refer to the specific cancellation policy provided at the time of booking. Holiday Circuit reserves the right to charge cancellation fees as applicable.",
  "Intellectual Property",
  "Ownership: All content, trademarks, logos, and intellectual property on the Holiday Circuit website and app are the property of Holiday Circuit or its licensors. You may not use, reproduce, or distribute our content without prior written permission.",
  "Changes to Terms and Conditions: We reserve the right to update and modify these Terms and Conditions at any time. Please review them periodically for changes. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.",
  "By booking with Holiday Circuit, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.",
];

export const formatServiceTypeLabel = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Service";
  if (normalized === "hotel") return "Hotel";
  if (normalized === "transfer" || normalized === "transport" || normalized === "car") return "Transport";
  if (normalized === "activity") return "Activity";
  if (normalized === "sightseeing") return "Sightseeing";
  if (normalized === "flight") return "Flight";
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatTravelDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatTravelerBreakup = ({
  adults = 0,
  children = 0,
  travelerSummary = "",
  passengers = "",
} = {}) => {
  const safeAdults = Number(adults || 0);
  const safeChildren = Number(children || 0);
  const parts = [];

  if (safeAdults > 0) parts.push(`${safeAdults} Adult${safeAdults > 1 ? "s" : ""}`);
  if (safeChildren > 0) parts.push(`${safeChildren} Child${safeChildren > 1 ? "ren" : ""}`);

  if (parts.length) return parts.join(", ");
  if (travelerSummary) return travelerSummary;
  return passengers || "-";
};

export const parseAdminTermContent = (rawContent) => {
  if (!rawContent) return [];
  if (Array.isArray(rawContent)) {
    const list = [];
    rawContent.forEach((item) => {
      if (typeof item === "string") {
        if (/<[a-z][\s\S]*>/i.test(item)) {
          list.push(...parseAdminTermContent(item));
        } else {
          const trimmed = item.replace(/^\d+[\.\)]\s*/, "").trim();
          if (trimmed) list.push(trimmed);
        }
      } else if (item && typeof item === "object") {
        const text = item.content || item.text || item.name || item.item || item.label || "";
        if (text) list.push(...parseAdminTermContent(text));
      }
    });
    return list.filter(Boolean);
  }
  if (typeof rawContent !== "string") return [];

  if (/<[a-z][\s\S]*>/i.test(rawContent)) {
    try {
      const doc = new DOMParser().parseFromString(rawContent, "text/html");
      const lines = [];
      const processNode = (node) => {
        if (!node) return;
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();
          if (["ul", "ol"].includes(tag)) {
            Array.from(node.childNodes).forEach(processNode);
          } else if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "div"].includes(tag)) {
            const text = (node.textContent || "").replace(/^\d+[\.\)]\s*/, "").trim();
            if (text && !lines.includes(text)) {
              lines.push(text);
            }
          } else {
            Array.from(node.childNodes).forEach(processNode);
          }
        }
      };
      Array.from(doc.body.childNodes).forEach(processNode);
      if (lines.length > 0) return lines;
      const plain = (doc.body.textContent || "").trim();
      return plain.split("\n").map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim()).filter(Boolean);
    } catch (e) {
      return rawContent
        .replace(/<br\s*[\/]?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .split("\n")
        .map((t) => t.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter(Boolean);
    }
  }

  return rawContent
    .split("\n")
    .map((t) => t.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);
};

export const getVoucherStatusNote = (services = [], isAlreadySent = false) => {
  const missingServices = (services || []).filter(
    (service) => !String(service?.title || service?.name || "").trim(),
  );
  const missingConfirmations = (services || []).filter((service) => {
    const confirmation = String(service?.confirmation || "").trim().toLowerCase();
    return !confirmation || confirmation === "pending";
  });

  if (!services.length) {
    return {
      tone: "red",
      title: "Voucher Services Missing",
      message: "No services are mapped in this voucher yet. Add services before sending it to the client.",
      canSend: false,
    };
  }

  if (missingServices.length && missingConfirmations.length) {
    return {
      tone: "red",
      title: "Services And Confirmations Missing",
      message: "Some voucher services are missing and some DMC confirmation numbers are still pending. Client sharing will stay blocked until both are complete.",
      canSend: false,
    };
  }

  if (missingServices.length) {
    return {
      tone: "red",
      title: "Service Details Missing",
      message: "Some voucher services are missing. Complete all service names before sending the voucher to the client.",
      canSend: false,
    };
  }

  if (missingConfirmations.length) {
    return {
      tone: "red",
      title: "DMC Confirmation Pending",
      message: "Some DMC confirmation numbers are still pending. Client sharing will stay blocked until all confirmations are updated.",
      canSend: false,
    };
  }

  if (isAlreadySent) {
    return {
      tone: "green",
      title: "Voucher Already Shared",
      message: "This voucher has already been sent successfully. You can review or download the final shared copy here.",
      canSend: false,
    };
  }

  return {
    tone: "green",
    title: "Client Ready To Send",
    message: "All services and DMC confirmation numbers are available. This voucher is ready to share with the client.",
    canSend: true,
  };
};

export const buildVoucherHtml = (data, branding, agentBranding = {}) => {
  const showBranding = branding === "with";
  const resolvedTravelDate = data?.travelDate || data?.startDate || data?.date || null;
  const voucherFooterSrc = String(
    data?.voucherFooterImage || data?.footerBanner || data?.pdfFooterImage || data?.agentFooterImage || ""
  ).trim();

  const normalizeCompanyName = (name, fallback = "Holiday Circuit") => {
    const str = String(name || "").trim();
    if (!str) return fallback;
    return str;
  };

  const rawAgentCompanyName = String(
    agentBranding?.name || agentBranding?.brandingName || agentBranding?.companyName || data?.agentName || data?.agencyName || ""
  ).trim();
  const agentCompanyName = rawAgentCompanyName ? normalizeCompanyName(rawAgentCompanyName, "Holiday Circuit") : "Holiday Circuit";

  const rawLogo = String(
    agentBranding?.logo ||
    agentBranding?.brandingLogo ||
    agentBranding?.brandLogoUrl ||
    data?.agentLogo ||
    data?.brandingLogo ||
    ""
  ).trim();

  const agentLogoUrl = rawLogo || (showBranding ? DEFAULT_FALLBACK_LOGO : "");

  const formatOrdinalDate = (d) => {
    if (!d || isNaN(new Date(d).getTime())) return "-";
    const dateObj = new Date(d);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("en-US", { month: "short" });
    const year = dateObj.getFullYear();
    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";
    return `${day}${suffix} ${month}, ${year}`;
  };

  const formatShortDate = (d) => {
    if (!d || isNaN(new Date(d).getTime())) return "-";
    const dateObj = new Date(d);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("en-US", { month: "short" });
    const year = dateObj.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const normalizeRoomType = (rt) => {
    if (!rt) return "Standard Room";
    let clean = String(rt).replace(/\(.*?\)/g, "").trim();
    clean = clean.replace(/^(standard|deluxe|executive|superior|suite|family|classic)\s*room$/i, "$1 Room");
    return clean || "Standard Room";
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

    const fallbackRaw = candidates[0] || h.description || h.roomType || "";
    return fallbackRaw.trim() ? fallbackRaw.trim() : "As per hotel policy";
  };

  const startObj = resolvedTravelDate ? new Date(resolvedTravelDate) : new Date();
  const startDateOrdinal = !isNaN(startObj.getTime()) ? formatOrdinalDate(startObj) : "22nd Dec, 2026";
  const startDateShort = !isNaN(startObj.getTime()) ? formatShortDate(startObj) : "22 Dec, 2026";

  const nights = Number(data?.nights || data?.numberOfNights || 4);
  const days = Number(data?.days || data?.numberOfDays || (nights + 1));
  const endObj = data?.endDate ? new Date(data.endDate) : new Date(startObj.getTime() + nights * 86400000);
  const endDateOrdinal = !isNaN(endObj.getTime()) ? formatOrdinalDate(endObj) : "26th Dec, 2026";

  const rawTripId = data?.queryId || data?.tripId || data?.query || data?.queryNumber || data?.quotationNumber;
  let tripIdVal = "QRY-4304633";
  if (rawTripId) {
    const cleanId = String(rawTripId).replace(/^#\s*/, "").trim();
    tripIdVal = cleanId.toUpperCase().startsWith("QRY-") ? cleanId.toUpperCase() : `QRY-${cleanId}`;
  } else if (data?.voucherNumber) {
    const cleanVch = String(data.voucherNumber).replace(/^VCH-?/i, "").trim();
    tripIdVal = cleanVch ? `QRY-${cleanVch}` : "QRY-001";
  }

  const destinationVal = data?.destination || "India";
  const durationVal = data?.duration || `${nights} Night${nights > 1 ? "s" : ""} / ${days} Days`;
  const guestNameVal = data?.name || data?.guestName || data?.clientName || data?.leadTraveler || "Valued Client";

  const rawPhone = data?.clientPhone || data?.guestPhone || data?.phone || "";
  const isDummyPhone = !rawPhone || String(rawPhone).includes("8287725270") || String(rawPhone).trim() === "" || String(rawPhone).trim() === "-";
  const guestPhoneVal = isDummyPhone ? "-" : String(rawPhone).trim();

  const paxVal = data?.passengers || data?.travelerSummary || `${data?.adults || 2} Adults${Number(data?.children || 0) > 0 ? `, ${data.children} Children` : ""}`;
  const issuedByVal = agentCompanyName || "Holiday Circuit";
  const helplinePhone = data?.agencyPhone || data?.companyPhone || data?.phone || "+91-8851346665";
  const helplineCompany = agentCompanyName || "Holiday Circuit";

  const rawServices = Array.isArray(data?.services) && data.services.length > 0 ? data.services : [];
  const hotelServices = rawServices.filter((s) => String(s.type || s.category || "").toLowerCase().includes("hotel"));
  const nonHotelServices = rawServices.filter((s) => !String(s.type || s.category || "").toLowerCase().includes("hotel"));

  let runningHotelDate = startObj && !isNaN(startObj.getTime()) ? new Date(startObj.getTime()) : new Date();

  // Helper to render hotel card
  const renderHotelCard = (h, idx) => {
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

    const hNights = Number(h.nights || h.numberOfNights || (hotelServices.length > 1 ? 2 : nights) || 2);

    let hCheckInObj;
    if (h.checkIn) {
      hCheckInObj = new Date(h.checkIn);
    } else if (h.startDate && idx === 0) {
      hCheckInObj = new Date(h.startDate);
    } else if (h.startDate && h.startDate !== data?.startDate && h.startDate !== data?.travelDate) {
      hCheckInObj = new Date(h.startDate);
    } else if (idx > 0) {
      hCheckInObj = new Date(runningHotelDate.getTime());
    } else {
      hCheckInObj = startObj && !isNaN(startObj.getTime()) ? startObj : new Date();
    }

    let hCheckOutObj;
    if (h.checkOut) {
      hCheckOutObj = new Date(h.checkOut);
    } else if (h.endDate && idx === hotelServices.length - 1 && hotelServices.length === 1) {
      hCheckOutObj = new Date(h.endDate);
    } else if (h.endDate && h.endDate !== data?.endDate) {
      hCheckOutObj = new Date(h.endDate);
    } else {
      hCheckOutObj = new Date(hCheckInObj.getTime() + hNights * 86400000);
    }

    runningHotelDate = new Date(hCheckOutObj.getTime());

    const hCheckInDate = hCheckInObj && !isNaN(hCheckInObj.getTime()) ? formatOrdinalDate(hCheckInObj) : startDateOrdinal;
    const hCheckInShort = hCheckInObj && !isNaN(hCheckInObj.getTime()) ? formatShortDate(hCheckInObj) : startDateShort;
    const hCheckInTime = h.checkInTime || "14:00 hrs";
    const hCheckOutDate = hCheckOutObj && !isNaN(hCheckOutObj.getTime()) ? formatOrdinalDate(hCheckOutObj) : endDateOrdinal;
    const hCheckOutTime = h.checkOutTime || "12:00 hrs";

    const formattedMeal = resolveHotelMealPlanText(h);
    const nightMealStr = `${hCheckInShort} (${hNights > 1 ? `${hNights} Nights` : '1 Night'}) - ${formattedMeal}`;
    const rawRoomType = h.roomType || h.roomCategory || "Standard Room";
    const formattedRoomType = normalizeRoomType(rawRoomType);
    const roomTypeStr = `${h.numberOfRooms || h.rooms || 1} x ${formattedRoomType}`;
    const paxDetailStr = h.pax || paxVal || "2 Adults";
    const roomDesc = h.roomDescription || h.roomDetails || "";

    return `
      <table class="voucher-card" style="width: 100%; border-collapse: collapse; margin-bottom: 7px; font-size: 10px; border: 1px solid #94a3b8; font-family: Arial, sans-serif; background: #ffffff; page-break-inside: avoid; break-inside: avoid;">
        <thead>
          <tr style="background: #1e3a8a;">
            <th colspan="2" style="padding: 4.5px 8px; font-size: 11px; font-weight: 800; color: #ffffff; text-align: left; border: 1px solid #1e3a8a; letter-spacing: 0.3px;">
              Hotel Accommodation
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2" style="padding: 6px 8px; background-color: #ffffff; border: 1px solid #94a3b8;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.2;">
                      ${hHotelName}
                    </div>
                    ${hServiceName ? `<div style="font-size: 9.5px; font-weight: 700; color: #2563eb; margin-top: 1px;">Service: ${hServiceName}</div>` : ''}
                    <div style="font-size: 9.5px; color: #475569; margin-top: 1px;">
                      ${hRating ? `<span style="font-weight: 600; color: #d97706;">★ ${hRating}</span> • ` : ''}${hAddress}
                    </div>
                    ${hDesc ? `<div style="font-size: 9px; color: #64748b; line-height: 1.2; margin-top: 2px;">${hDesc}</div>` : ''}
                  </td>
                  <td style="vertical-align: top; text-align: right; width: 35%;">
                    <div style="font-size: 10px; font-weight: 800; color: #0f172a;">
                      CNF: <span style="color: #1e3a8a;">${cnfDisplay}</span>
                      <span style="font-size: 9.5px; font-weight: 700; color: ${isHotelConfirmed ? '#15803d' : '#e11d48'}; margin-left: 2px;">(${hStatLabel})</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CHECK-IN & CHECK-OUT HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin: 4px 0 6px 0; border: 1px solid #cbd5e1;">
                <tr>
                  <td style="width: 16%; background-color: #fef08a; padding: 4px 6px; font-weight: 700; color: #713f12; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">
                    Check-in
                  </td>
                  <td style="width: 34%; padding: 4px 6px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 9.5px; color: #0f172a;">
                    <strong>${hCheckInDate}</strong> <span style="color: #64748b; font-size: 9px;">at ${hCheckInTime}</span>
                  </td>
                  <td style="width: 16%; background-color: #fef08a; padding: 4px 6px; font-weight: 700; color: #713f12; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">
                    Check-out
                  </td>
                  <td style="width: 34%; padding: 4px 6px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 9.5px; color: #0f172a;">
                    <strong>${hCheckOutDate}</strong> <span style="color: #64748b; font-size: 9px;">(${hNights}N at ${hCheckOutTime})</span>
                  </td>
                </tr>
              </table>

              <!-- NIGHT AND MEALS & ROOM TYPE SUB-TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
                    <th style="width: 56%; padding: 3.5px 6px; font-size: 9.5px; font-weight: 700; color: #334155; text-align: left; border: 1px solid #cbd5e1;">
                      Night and Meals
                    </th>
                    <th style="width: 44%; padding: 3.5px 6px; font-size: 9.5px; font-weight: 700; color: #334155; text-align: left; border: 1px solid #cbd5e1;">
                      Room Type &amp; Pax
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 4px 6px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 9.5px; color: #0f172a; vertical-align: top;">
                      <div style="font-weight: 600; color: #0f172a;">${nightMealStr}</div>
                      ${h.mealDescription ? `<div style="font-size: 9px; color: #475569; margin-top: 1px;">${h.mealDescription}</div>` : ''}
                    </td>
                    <td style="padding: 4px 6px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 9.5px; color: #0f172a; vertical-align: top;">
                      <div style="font-weight: 700; color: #0f172a;">${roomTypeStr}</div>
                      <div style="font-size: 9px; color: #475569; margin-top: 1px;">Booked: ${paxDetailStr}</div>
                      ${roomDesc ? `<div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">${roomDesc}</div>` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `;
  };

  // Helper to render non-hotel cards (transfers, activities, sightseeing)
  const renderNonHotelCard = (s) => {
    const sTypeRaw = String(s.type || s.category || "Service").toLowerCase();
    const sTitle = s.title || s.name || s.serviceName || `${destinationVal} Service`;
    const sDesc = s.description || s.details || s.notes || "";
    const isTransport = sTypeRaw.includes("transfer") || sTypeRaw.includes("transport") || sTypeRaw.includes("cab") || sTypeRaw.includes("car");

    const rawUsage = String(s.usageType || s.transferType || s.tripType || s.serviceMode || s.direction || "").trim();
    let usageLabel = "One Way Transfer";
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
    }

    const vType = s.vehicleType || s.carType || s.vehicle || (isTransport ? "Private AC Vehicle" : "Standard Vehicle");
    const vCount = s.vehicleCount || s.numberOfVehicles || s.quantity || 1;
    const vehicleTitle = `${vCount > 1 ? `${vCount} x ` : ''}${vType}`;

    let passCap = s.passengerCapacity || s.maxPassengers || s.maxPax || s.seatingCapacity || s.seats || s.paxCapacity || (isTransport ? "Max 4 Pax" : "4 Pax");
    let luggCap = s.luggageCapacity || s.maxLuggage || s.luggage || s.baggageCapacity || s.bags || (isTransport ? "2-3 Bags" : "2 Bags");

    if (passCap && !String(passCap).toLowerCase().includes("pax")) passCap = `Max ${passCap} Pax`;
    if (luggCap && !String(luggCap).toLowerCase().includes("bag")) luggCap = `${luggCap} Bags`;

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
      badge2Label = "Timing / Slot";
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
    const sTimeFormatted = s.time || s.pickupTime || "10:00 hrs";

    const sPaxVehicleStr = s.vehicleType ? `${s.vehicleType} • ${paxVal}` : (s.pax || paxVal || "2 Pax");
    const sDetailsStr = `${sTitle} - ${statLabel === "Confirmed" ? "Confirmed Service" : "Service"}`;

    return `
      <table class="voucher-card" style="width: 100%; border-collapse: collapse; margin-bottom: 7px; font-size: 10px; border: 1px solid #94a3b8; font-family: Arial, sans-serif; background: #ffffff; page-break-inside: avoid; break-inside: avoid;">
        <thead>
          <tr style="background: #1e3a8a;">
            <th colspan="2" style="padding: 4.5px 8px; font-size: 11px; font-weight: 800; color: #ffffff; text-align: left; border: 1px solid #1e3a8a; letter-spacing: 0.3px;">
              ${sectionTitle}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2" style="padding: 6px 8px; background-color: #ffffff; border: 1px solid #94a3b8;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 12px; font-weight: 800; color: #0f172a; line-height: 1.2;">
                      ${sTitle}
                    </div>
                    <div style="font-size: 9.5px; color: #475569; margin-top: 1px;">
                      ${sectionTitle} • ${destinationVal}
                    </div>
                    ${sDesc ? `<div style="font-size: 9px; color: #64748b; line-height: 1.2; margin-top: 2px;">${sDesc}</div>` : ''}
                  </td>
                  <td style="vertical-align: top; text-align: right; width: 35%;">
                    <div style="font-size: 10px; font-weight: 800; color: #0f172a;">
                      CNF: <span style="color: #1e3a8a;">${cnfDisplay}</span>
                      <span style="font-size: 9.5px; font-weight: 700; color: ${isConfirmed ? '#15803d' : '#e11d48'}; margin-left: 2px;">(${statLabel})</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- SERVICE DATE & DETAILS HIGHLIGHT BOX -->
              <table style="width: 100%; border-collapse: collapse; margin: 4px 0 6px 0; border: 1px solid #cbd5e1;">
                <tr>
                  <td style="width: 16%; background-color: #fef08a; padding: 4px 6px; font-weight: 700; color: #713f12; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">
                    ${badge1Label}
                  </td>
                  <td style="width: 34%; padding: 4px 6px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 9.5px; color: #0f172a;">
                    <strong>${sDateFormatted}</strong> <span style="color: #64748b; font-size: 9px;">at ${sTimeFormatted}</span>
                  </td>
                  <td style="width: 16%; background-color: #fef08a; padding: 4px 6px; font-weight: 700; color: #713f12; border: 1px solid #cbd5e1; font-size: 9.5px; text-align: center;">
                    ${badge2Label}
                  </td>
                  <td style="width: 34%; padding: 4px 6px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 9.5px; color: #0f172a;">
                    <strong>${badge2Value}</strong>
                  </td>
                </tr>
              </table>

              <!-- SERVICE SUB-TABLE -->
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
                    <th style="width: 58%; padding: 3.5px 6px; font-size: 9.5px; font-weight: 700; color: #334155; text-align: left; border: 1px solid #cbd5e1;">
                      ${subCol1Title}
                    </th>
                    <th style="width: 42%; padding: 3.5px 6px; font-size: 9.5px; font-weight: 700; color: #334155; text-align: left; border: 1px solid #cbd5e1;">
                      ${subCol2Title}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 4px 6px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 9.5px; color: #0f172a; vertical-align: top;">
                      <div style="font-weight: 600; color: #0f172a;">${sDetailsStr}</div>
                      ${isTransport ? `
                        <div style="margin-top: 2px; font-size: 9px; color: #2563eb; font-weight: 600;">
                          ${usageLabel}${s.pickupLocation || s.dropLocation ? ` • ${s.pickupLocation || 'Pickup'} ➔ ${s.dropLocation || 'Drop'}` : ''}
                        </div>
                      ` : ''}
                      ${sDesc ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px; line-height: 1.3;">${sDesc}</div>` : ''}
                    </td>
                    <td style="padding: 4px 6px; background-color: #ffffff; border: 1px solid #cbd5e1; font-size: 9.5px; color: #0f172a; vertical-align: top;">
                      ${isTransport ? `
                        <div style="font-weight: 700; color: #0f172a; font-size: 9.5px; margin-bottom: 2px;">${vehicleTitle}</div>
                        <div style="font-size: 9px; color: #475569;">Pax Cap: <strong style="color: #0f172a;">${passCap}</strong> • Luggage: <strong style="color: #0f172a;">${luggCap}</strong></div>
                      ` : `
                        <div style="font-weight: 600; color: #0f172a;">${sPaxVehicleStr}</div>
                        <div style="font-size: 9px; color: #475569; margin-top: 1px;">Booked Pax: <strong style="color: #0f172a;">${paxVal}</strong></div>
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
  };

  // Overview Table
  const renderOverviewTable = () => `
    <table class="voucher-overview-table" style="width: 100%; border-collapse: collapse; margin-bottom: 7px; font-size: 10px; border: 1px solid #94a3b8; font-family: Arial, sans-serif; background: #ffffff; page-break-inside: avoid;">
      <thead>
        <tr style="background: #e2e8f0;">
          <th colspan="4" style="padding: 4px 8px; font-size: 11px; font-weight: 800; color: #0f172a; text-align: center; border: 1px solid #94a3b8; letter-spacing: 0.4px;">
            Trip ID: ${tripIdVal}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 4px 8px; color: #475569; width: 18%; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc;">Start Date</td>
          <td style="padding: 4px 8px; color: #0f172a; width: 32%; font-weight: 700; border: 1px solid #cbd5e1;">${startDateOrdinal}</td>
          <td style="padding: 4px 8px; color: #475569; width: 18%; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc;">Trip Duration</td>
          <td style="padding: 4px 8px; color: #0f172a; width: 32%; font-weight: 700; border: 1px solid #cbd5e1;">${durationVal}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #475569; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc;">Destination</td>
          <td colspan="3" style="padding: 4px 8px; color: #0f172a; font-weight: 700; border: 1px solid #cbd5e1;">${destinationVal}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #475569; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc;">Guest Name</td>
          <td style="padding: 4px 8px; color: #0f172a; font-weight: 700; border: 1px solid #cbd5e1;">${guestNameVal}</td>
          <td style="padding: 4px 8px; color: #475569; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc;">Guest Ph.</td>
          <td style="padding: 4px 8px; color: #0f172a; font-weight: 600; border: 1px solid #cbd5e1;">${guestPhoneVal}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #475569; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc;">Pax Details</td>
          <td colspan="3" style="padding: 4px 8px; color: #0f172a; font-weight: 700; border: 1px solid #cbd5e1;">${paxVal}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #475569; font-weight: 600; border: 1px solid #cbd5e1; background: #f8fafc;">Issued By</td>
          <td colspan="3" style="padding: 4px 8px; color: #1e3a8a; font-weight: 700; border: 1px solid #cbd5e1;">${issuedByVal}</td>
        </tr>
      </tbody>
    </table>
  `;

  // Header Component (Identical on both pages)
  const renderHeader = () => `
    <!-- HEADER -->
    <table style="width: 100%; border-collapse: collapse; background: #0f1d32; border-bottom: 2px solid #2563eb; font-family: Arial, sans-serif;">
      <tr>
        <td style="padding: 6px 14px; vertical-align: middle; text-align: left; width: 35%;">
          <div style="background: #ffffff; padding: 2px 6px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; height: 42px; width: 140px; box-sizing: border-box; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            ${agentLogoUrl
              ? `<img src="${agentLogoUrl}" alt="${agentCompanyName || 'Holiday Circuit'}" style="max-height: 38px; max-width: 130px; width: auto; height: auto; object-fit: contain; display: block;" />`
              : `<div style="font-size: 14px; font-weight: 800; color: #0f1d32; line-height: 1.15; text-align: center; letter-spacing: -0.2px;">${agentCompanyName || 'Holiday Circuit'}</div>`
            }
          </div>
        </td>
        <td style="padding: 6px 14px; vertical-align: middle; text-align: right; width: 65%;">
          <div style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.3px; font-family: Arial, sans-serif; line-height: 1.2;">
            ${agentCompanyName || (showBranding ? "Holiday Circuit" : "Travel Voucher")}
          </div>
        </td>
      </tr>
    </table>
  `;

  // Title Bar Component
  const renderTitleBar = (isContinuation = false) => `
    <!-- TITLE BAR -->
    <table style="width: 100%; border-collapse: collapse; background: #1a3352; border-top: 1px solid #3b82f6; border-bottom: 1px solid #0f1d32; margin-bottom: 6px;">
      <tr>
        <td style="text-align: center; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3.5px 10px; letter-spacing: 2px; text-transform: uppercase; font-family: Arial, sans-serif;">
          Travel Voucher ${isContinuation ? "(Continued)" : ""}
        </td>
      </tr>
    </table>
  `;

  // Terms & Conditions Component
  const rawTerms =
    data?.termsAndConditions ||
    data?.terms ||
    data?.voucherDetails?.termsAndConditions ||
    data?.voucher?.termsAndConditions ||
    [];
  let termsList = parseAdminTermContent(rawTerms);

  if (!termsList || termsList.length === 0) {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("voucher_admin_terms_cached");
        if (cached) {
          const parsedCached = JSON.parse(cached);
          if (Array.isArray(parsedCached) && parsedCached.length > 0) {
            termsList = parseAdminTermContent(parsedCached);
          }
        }
      } catch (e) {}
    }
  }

  if (!termsList || termsList.length === 0) {
    termsList = DEFAULT_VOUCHER_TERMS;
  }

  const renderTermsAndConditions = () => `
    <!-- TERMS & CONDITIONS SECTION -->
    <div style="margin: 5px 0 5px 0; font-family: Arial, sans-serif; page-break-inside: avoid; break-inside: avoid; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 5px 8px;">
      <div style="font-size: 10px; font-weight: 800; color: #c2410c; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.3px;">
        Terms &amp; Conditions
      </div>
      <ol style="margin: 0; padding-left: 14px; font-size: 8px; color: #334155; line-height: 1.3;">
        ${termsList.map((t) => `<li style="margin-bottom: 1.5px;">${t.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`).join("")}
      </ol>
    </div>
  `;

  // Helpline Section (Content element, placed above footer)
  const renderHelpline = () => `
    <!-- HELPLINE SECTION -->
    <table class="voucher-helpline" style="width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 6px; font-size: 9.5px; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; page-break-inside: avoid; break-inside: avoid;">
      <thead>
        <tr style="background-color: #fef08a;">
          <th colspan="3" style="padding: 3.5px 6px; font-size: 9.5px; font-weight: 800; color: #713f12; text-align: center; border: 1px solid #cbd5e1; letter-spacing: 0.2px;">
            24x7 Customer Helpline &amp; Operations Support
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 3.5px 6px; color: #0f172a; font-weight: 700; width: 34%; border: 1px solid #cbd5e1; text-align: center;">${helplineCompany}</td>
          <td style="padding: 3.5px 6px; color: #166534; font-weight: 600; width: 33%; border: 1px solid #cbd5e1; text-align: center;">24x7 Operational Support</td>
          <td style="padding: 3.5px 6px; color: #1e3a8a; font-weight: 700; width: 33%; border: 1px solid #cbd5e1; text-align: center;">${helplinePhone}</td>
        </tr>
      </tbody>
    </table>
  `;

  // Pinned Bottom Footer (Identical on every page, ONLY footer banner & page numbering)
  const renderFooter = (pageNum, totalPages) => `
    <!-- PINNED FOOTER WRAPPER: Fixed at bottom of every page -->
    <div class="voucher-page-footer" style="margin-top: auto; width: 100%; background: #ffffff; page-break-inside: avoid; break-inside: avoid;">
      <!-- GENERATED NOTE & PAGE NUMBER -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 10px; font-size: 8px; color: #64748b; font-family: Arial, sans-serif; border-top: 1px solid #e2e8f0;">
        <span>Generated On - ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
        <span style="font-weight: 700; color: #1e293b;">Page ${pageNum} of ${totalPages}</span>
      </div>

      <!-- FOOTER BANNER / CONTACT FOOTER -->
      ${voucherFooterSrc ? `
        <div style="width:100%; text-align:center;">
          <img src="${voucherFooterSrc}" alt="Footer Banner" style="width:100%; max-width:100%; height:auto; display:block;" />
        </div>
      ` : `
        <table style="width: 100%; border-collapse: collapse; background: #0f1d32; border-top: 2px solid #2563eb; color: #ffffff; font-family: Arial, sans-serif;">
          <tr>
            <td style="padding: 5px 14px; text-align: center;">
              <div style="color: #f1f5f9; font-size: 9.5px; font-weight: 700; line-height: 1.3;">
                Phone: ${helplinePhone} &nbsp;|&nbsp; Email: ${data.agencyEmail || 'ops@holidaycircuit.com'}
              </div>
              <div style="color: #94a3b8; font-size: 8px; font-weight: 500; line-height: 1.2; margin-top: 1px;">
                ${data.agencyAddress || '2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058'}
              </div>
            </td>
          </tr>
        </table>
      `}
    </div>
  `;

  // Render generic service card
  const renderServiceCard = (s, idx) => {
    const isHotel = String(s.type || s.category || "").toLowerCase().includes("hotel");
    return isHotel ? renderHotelCard(s, idx) : renderNonHotelCard(s);
  };

  // Combine all services: hotels first, then other services
  const allServices = [...hotelServices, ...nonHotelServices];

  const getServiceHeight = (s) => {
    const isHotel = String(s.type || s.category || "").toLowerCase().includes("hotel");
    return isHotel ? 155 : 125;
  };

  const termsEstHeight = Math.min(220, 35 + termsList.length * 12);
  const helplineEstHeight = 45;
  const overviewEstHeight = 135;
  const pageContentBudget = 930; // Safe height budget for body content on A4


  const totalServicesEstHeight = allServices.reduce((sum, s) => sum + getServiceHeight(s), 0);
  const singlePageTotalNeeded = overviewEstHeight + totalServicesEstHeight + termsEstHeight + helplineEstHeight;

  let pageConfigs = [];

  if (singlePageTotalNeeded <= pageContentBudget && allServices.length <= 3) {
    // Single Page Voucher
    pageConfigs.push({
      hasOverview: true,
      services: allServices,
      hasTerms: true,
      hasHelpline: true,
    });
  } else {
    // Multi-page voucher: Fill Page 1 nicely, overflow remaining to Page 2
    let remainingServices = [...allServices];
    let page1Services = [];
    let page1UsedHeight = overviewEstHeight;

    while (remainingServices.length > 0) {
      const nextS = remainingServices[0];
      const sHeight = getServiceHeight(nextS);

      // If this is the last remaining service and it + terms + helpline fit on page 1, keep it on page 1
      if (remainingServices.length === 1 && (page1UsedHeight + sHeight + termsEstHeight + helplineEstHeight <= pageContentBudget)) {
        page1Services.push(remainingServices.shift());
        page1UsedHeight += sHeight;
        break;
      }

      // If adding next service would exceed page 1 budget (leaving margin for bottom), stop
      if (page1UsedHeight + sHeight > pageContentBudget - 20) {
        break;
      }

      // If only 1 service is left and terms wouldn't fit, don't put all services on page 1
      // so page 2 gets at least 1 service
      if (remainingServices.length === 1 && (page1UsedHeight + sHeight + termsEstHeight + helplineEstHeight > pageContentBudget)) {
        break;
      }

      page1Services.push(remainingServices.shift());
      page1UsedHeight += sHeight;
    }

    pageConfigs.push({
      hasOverview: true,
      services: page1Services,
      hasTerms: false,
      hasHelpline: false,
    });

    // Distribute remaining services across subsequent pages
    while (remainingServices.length > 0) {
      let pageServices = [];
      let pageUsed = 0;

      while (remainingServices.length > 0) {
        const nextS = remainingServices[0];
        const sHeight = getServiceHeight(nextS);
        if (pageUsed + sHeight > pageContentBudget - 60) {
          break;
        }
        pageServices.push(remainingServices.shift());
        pageUsed += sHeight;
      }

      const fitsTerms = (pageUsed + termsEstHeight + helplineEstHeight <= pageContentBudget);
      const isLastChunk = remainingServices.length === 0;

      if (fitsTerms || isLastChunk) {
        pageConfigs.push({
          hasOverview: false,
          services: pageServices,
          hasTerms: true,
          hasHelpline: true,
        });
      } else {
        pageConfigs.push({
          hasOverview: false,
          services: pageServices,
          hasTerms: false,
          hasHelpline: false,
        });
      }
    }

    // Ensure terms and helpline are attached if not already
    if (!pageConfigs.some((p) => p.hasTerms)) {
      pageConfigs.push({
        hasOverview: false,
        services: [],
        hasTerms: true,
        hasHelpline: true,
      });
    }
  }

  const totalPages = pageConfigs.length;

  const pagesHtml = pageConfigs.map((cfg, idx) => {
    const pageNum = idx + 1;
    const isFirstPage = pageNum === 1;

    return `
      <!-- PAGE ${pageNum} -->
      <div class="voucher-page" style="width: 794px; min-height: 1120px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; margin: 0 auto 20px auto; border: 1px solid #cbd5e1; overflow: hidden; page-break-after: always; break-after: page;">
        <div>
          ${renderHeader()}
          ${renderTitleBar(!isFirstPage)}
          <div style="padding: 0 10px;">
            ${cfg.hasOverview ? renderOverviewTable() : ""}
            ${cfg.services.map((s, sIdx) => renderServiceCard(s, sIdx)).join("")}
            ${cfg.hasTerms ? renderTermsAndConditions() : ""}
            ${cfg.hasHelpline ? renderHelpline() : ""}
          </div>
        </div>
        ${renderFooter(pageNum, totalPages)}
      </div>
    `;
  }).join("\n");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Voucher - ${tripIdVal}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
          }
          .voucher-page {
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          table {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
    </html>
  `;
};

export { exportVoucherAsPdf } from "./voucherPdf.js";

