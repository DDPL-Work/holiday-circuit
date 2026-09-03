const DEFAULT_FALLBACK_LOGO = "https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png";

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
      message:
        "No services are mapped in this voucher yet. Add services before sending it to the client.",
      canSend: false,
    };
  }

  if (missingServices.length && missingConfirmations.length) {
    return {
      tone: "red",
      title: "Services And Confirmations Missing",
      message:
        "Some voucher services are missing and some DMC confirmation numbers are still pending. Client sharing will stay blocked until both are complete.",
      canSend: false,
    };
  }

  if (missingServices.length) {
    return {
      tone: "red",
      title: "Service Details Missing",
      message:
        "Some voucher services are missing. Complete all service names before sending the voucher to the client.",
      canSend: false,
    };
  }

  if (missingConfirmations.length) {
    return {
      tone: "red",
      title: "DMC Confirmation Pending",
      message:
        "Some DMC confirmation numbers are still pending. Client sharing will stay blocked until all confirmations are updated.",
      canSend: false,
    };
  }

  if (isAlreadySent) {
    return {
      tone: "green",
      title: "Voucher Already Shared",
      message:
        "This voucher has already been sent successfully. You can review or download the final shared copy here.",
      canSend: false,
    };
  }

  return {
    tone: "green",
    title: "Client Ready To Send",
    message:
      "All services and DMC confirmation numbers are available. This voucher is ready to share with the client.",
    canSend: true,
  };
};

const getConfirmationStatusDisplay = (confirmation = "", status = "") => {
  const conf = String(confirmation || "").trim().toLowerCase();
  const stat = String(status || "").trim().toLowerCase();

  if (!conf || conf === "pending") {
    return { label: "Pending", cssClass: "status-pending" };
  }
  if (stat === "cancelled" || conf === "cancelled") {
    return { label: "Cancelled", cssClass: "status-cancelled" };
  }
  return { label: "Confirmed", cssClass: "status-confirmed" };
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

  const rawAgentCompanyName = String(agentBranding?.name || agentBranding?.brandingName || agentBranding?.companyName || data?.agentName || data?.agencyName || "").trim();
  const agentCompanyName = rawAgentCompanyName ? normalizeCompanyName(rawAgentCompanyName, "Holiday Circuit") : "";
  const isAgentHolidayCircuit = !agentCompanyName || agentCompanyName.toLowerCase() === "holiday circuit";
  const agentLogoUrl = isAgentHolidayCircuit ? "" : String(agentBranding?.logo || data?.agentLogo || "").trim();
  const hasAgentBranding = showBranding && !isAgentHolidayCircuit && Boolean(agentLogoUrl || agentCompanyName);

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

    return "EP ( Room Only )";
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
  const fallbackIssuedBy = agentCompanyName || "Holiday Circuit";
  const rawIssuedBy = data?.issuedBy || data?.agencyName || agentCompanyName || "Holiday Circuit";
  const isUserName = rawIssuedBy && (rawIssuedBy.toLowerCase().includes("user") || rawIssuedBy.toLowerCase().includes("guest"));
  const issuedByVal = (!rawIssuedBy || isUserName) ? fallbackIssuedBy : normalizeCompanyName(rawIssuedBy, fallbackIssuedBy);
  const helplinePhone = data?.agencyPhone || "+91-8851346665";
  const helplineCompany = "Holiday Circuit";

  const rawServices = Array.isArray(data?.services) && data.services.length > 0 ? data.services : [];
  const hotelServices = rawServices.filter((s) => String(s.type || s.category || "").toLowerCase().includes("hotel"));
  const nonHotelServices = rawServices.filter((s) => !String(s.type || s.category || "").toLowerCase().includes("hotel"));

  const displayHotels = hotelServices.length > 0 ? hotelServices : (rawServices.length === 0 ? [
    {
      title: `${destinationVal} Heritage Resort & Spa`,
      rating: "5 star",
      address: `${destinationVal}, India`,
      confirmation: "97739SG008801",
      roomType: "Superior King Room",
      mealPlan: "Breakfast",
      numberOfRooms: 1,
      pax: paxVal,
      nights: nights,
    }
  ] : []);

  let runningHotelDate = startObj && !isNaN(startObj.getTime()) ? new Date(startObj.getTime()) : new Date();

  const hotelsHtml = displayHotels.map((h, idx) => {
    const rawTitle = String(h.title || "").trim();
    const rawHotelName = String(h.hotelName || h.hotel || "").trim();
    const rawServiceName = String(h.serviceName || h.name || "").trim();

    const hHotelName = rawHotelName || (rawTitle && !rawTitle.toLowerCase().includes("hotel stay") && !rawTitle.toLowerCase().includes("service") ? rawTitle : (rawServiceName || `${destinationVal} Heritage Resort`));
    const hServiceName = rawServiceName && rawServiceName !== hHotelName ? rawServiceName : (rawTitle && rawTitle !== hHotelName ? rawTitle : "");

    const hRating = h.rating || h.starRating || h.hotelCategory || h.category || "5 star";
    const hAddress = h.address || h.hotelAddress || h.location || (h.city ? `${h.city}, ${destinationVal}` : `${destinationVal}, India`);
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
    } else if (h.endDate && idx === displayHotels.length - 1 && displayHotels.length === 1) {
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
  }).join("");

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

  // TERMS AND CONDITIONS SECTION (Replaces old "Notes:" section)
  const rawTerms = data?.termsAndConditions || data?.terms || [];
  let termsList = [];
  if (Array.isArray(rawTerms)) {
    termsList = rawTerms.filter((t) => typeof t === "string" && t.trim().length > 0);
  } else if (typeof rawTerms === "string" && rawTerms.trim()) {
    termsList = rawTerms.split("\n").map((t) => t.trim()).filter((t) => t.length > 0);
  }

  const termsHtml = termsList.length > 0 ? `
    <!-- TERMS & CONDITIONS SECTION -->
    <div style="margin-top: 18px; margin-bottom: 18px; font-family: Arial, sans-serif;">
      <div style="font-size: 13.5px; font-weight: 800; color: #9a3412; margin-bottom: 8px;">
        Terms &amp; Conditions:
      </div>
      <ol style="margin: 0; padding-left: 20px; font-size: 11.5px; color: #1e293b; line-height: 1.65;">
        ${termsList.map((t) => `<li style="margin-bottom: 5px;">${t.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`).join("")}
      </ol>
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Voucher - ${tripIdVal}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background-color: #f0f4f8;
            padding: 40px 20px;
            font-family: Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
          }
          .voucher-container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            border-radius: 2px;
          }
          .brand-header {
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            height: 110px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 36px 0 32px;
            border-bottom: 3px solid #3d6a8e;
          }
          .brand-header::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 140px;
            height: 100%;
            background: linear-gradient(180deg, #264a6e 0%, #3d6a8e 100%);
            transform: skewX(-28deg);
            transform-origin: top left;
            z-index: 1;
          }
          .brand-header::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 72px;
            height: 100%;
            background: linear-gradient(180deg, #264a6e 0%, #3d6a8e 100%);
            transform: skewX(-28deg);
            transform-origin: top right;
            z-index: 1;
          }
          .brand-logo-box {
            background: #ffffff;
            padding: 10px 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #5a8aa8;
            z-index: 2;
            position: relative;
            margin-left: 20px;
            border-radius: 4px;
          }
          .brand-logo {
            height: 60px;
            width: auto;
            object-fit: contain;
          }
          .brand-name {
            color: #ffffff;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            z-index: 2;
            position: relative;
          }
          .title-bar {
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            color: #ffffff;
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            padding: 13px 20px;
            letter-spacing: 4px;
            text-transform: uppercase;
            border-top: 2px solid #5a8aa8;
            border-bottom: 2px solid #0f1d32;
          }
          .voucher-body {
            padding: 24px 28px;
          }
          .brand-footer {
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            padding: 18px 28px;
            border-top: 3px solid #3d6a8e;
            color: #ffffff;
            font-size: 12px;
            text-align: center;
            line-height: 1.8;
          }
          .footer-info {
            font-weight: 600;
            margin-bottom: 4px;
          }
          .footer-item {
            color: #cbd5e1;
          }
          .footer-address {
            color: #94a3b8;
            font-size: 11px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="voucher-container">
          <!-- HEADER -->
          <div class="brand-header">
            <div class="brand-logo-box">
              ${hasAgentBranding && agentLogoUrl
      ? `<img src="${agentLogoUrl}" alt="${agentCompanyName || 'Agent'} Logo" class="brand-logo">`
      : hasAgentBranding
        ? `<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">${(agentCompanyName || 'A').charAt(0).toUpperCase()}</div>`
        : showBranding
          ? `<img src="${DEFAULT_FALLBACK_LOGO}" alt="Holiday Circuit Logo" class="brand-logo">`
          : `<div style="font-size: 24px; font-weight: 800; color: #0f1d32;">TV</div>`
    }
            </div>
            <div class="brand-name">${hasAgentBranding ? (agentCompanyName || "Travel Voucher") : showBranding ? "Holiday Circuit" : "Travel Voucher"}</div>
          </div>

          <!-- TITLE BAR -->
          <div class="title-bar">Travel Voucher</div>

          <!-- BODY -->
          <div class="voucher-body">
            <!-- OVERVIEW TABLE -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; border: 1px solid #b3cae8;">
              <thead>
                <tr style="background-color: #dce8f6;">
                  <th colspan="4" style="padding: 9px 14px; font-size: 13px; font-weight: 800; color: #000000; text-align: center; border: 1px solid #b3cae8; letter-spacing: 0.3px;">
                    Trip ID: ${tripIdVal}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; width: 18%; font-weight: 500; border: 1px solid #b3cae8;">Start Date</td>
                  <td style="padding: 8px 12px; color: #000000; width: 32%; font-weight: 700; border: 1px solid #b3cae8;">${startDateOrdinal}</td>
                  <td style="padding: 8px 12px; color: #1e293b; width: 20%; font-weight: 500; border: 1px solid #b3cae8;">Trip Duration</td>
                  <td style="padding: 8px 12px; color: #000000; width: 30%; font-weight: 700; border: 1px solid #b3cae8;">${durationVal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Destination</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${destinationVal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Name</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${guestNameVal}</td>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Guest Ph.</td>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 600; border: 1px solid #b3cae8;">${guestPhoneVal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">Pax Details</td>
                  <td colspan="3" style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">${paxVal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #000000; font-weight: 700; border: 1px solid #b3cae8;">Issued By</td>
                  <td colspan="3" style="padding: 8px 12px; color: #1e293b; font-weight: 500; border: 1px solid #b3cae8;">${issuedByVal}</td>
                </tr>
              </tbody>
            </table>

            <!-- HOTELS SECTION -->
            ${hotelsHtml}

            <!-- TRANSFERS & ACTIVITIES SECTION -->
            ${nonHotelServicesHtml}

            <!-- TERMS & CONDITIONS SECTION -->
            ${termsHtml}

            <!-- HELPLINE SECTION -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; border: 1px solid #b3cae8; font-family: Arial, sans-serif;">
              <thead>
                <tr style="background-color: #fef08a;">
                  <th colspan="3" style="padding: 8px 12px; font-size: 13px; font-weight: 800; color: #000000; text-align: center; border: 1px solid #b3cae8;">
                    Helpline
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 9px 12px; color: #000000; font-weight: 600; width: 34%; border: 1px solid #b3cae8;">Holiday Circuit</td>
                  <td style="padding: 9px 12px; color: #000000; font-weight: 500; width: 33%; border: 1px solid #b3cae8;">24x7 Operational</td>
                  <td style="padding: 9px 12px; color: #000000; font-weight: 700; width: 33%; border: 1px solid #b3cae8;">+91-8851346665</td>
                </tr>
              </tbody>
            </table>

            <!-- GENERATED NOTE -->
            <div style="text-align: right; font-size: 11px; color: #64748b; margin-top: 14px; font-family: Arial, sans-serif;">
              Generated On - ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} - ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} Hrs UTC
            </div>
          </div>

          <!-- FOOTER -->
          ${voucherFooterSrc ? `
            <div style="width:100%; margin-top:16px; text-align:center;">
              <img src="${voucherFooterSrc}" alt="Footer Banner" style="width:100%; max-width:100%; height:auto; display:block;" />
            </div>
          ` : `
            <div class="brand-footer">
              <div class="footer-info">
                <div class="footer-item">Phone: ${data.agencyPhone || helplinePhone} | Email: ${data.agencyEmail || 'ops@holidaycircuit.com'}</div>
              </div>
              <div class="footer-address">
                ${data.agencyAddress || '2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058'}
              </div>
            </div>
          `}
        </div>
      </body>
    </html>
  `;
};
