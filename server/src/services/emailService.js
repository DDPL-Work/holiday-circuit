import { createTransporter, MAIL_FROM_ADDRESS, MAIL_REPLY_TO_ADDRESS, } from "./mailer.js";
import { generateVoucherPdf } from "./voucherPdfService.js";
import { generatePDF } from "./pdfService.js";

const INR_SYMBOL = "\u20B9";

const formatCurrency = (value, currency = "INR") => {
  const symbol = String(currency || "INR").toUpperCase() === "INR" ? INR_SYMBOL : currency;
  return `${symbol} ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
};

const formatDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildServiceMeta = (service = {}) => {
  const details = [];

  if (service.location) details.push(service.location);
  if (service.serviceDateLabel) details.push(service.serviceDateLabel);
  if (service.quantityLabel) details.push(service.quantityLabel);

  return details.join(" | ");
};

const sanitizeQuoteList = (items = []) =>
  Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const buildQuoteListText = (items = []) =>
  sanitizeQuoteList(items).length
    ? sanitizeQuoteList(items).map((item, index) => `${index + 1}. ${item}`).join("\n")
    : "None";

const buildQuoteListHtml = (items = [], emptyLabel = "None provided") => {
  const normalizedItems = sanitizeQuoteList(items);

  if (!normalizedItems.length) {
    return `<div style="color:#6b7280; font-size:11px;">${escapeHtml(emptyLabel)}</div>`;
  }

  return `
    <ul style="margin:0; padding-left:18px; color:#222; line-height:1.6;">
      ${normalizedItems.map((item) => `<li style="margin:0 0 6px;">${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
};

const sanitizeItineraryItems = (items = []) =>
  Array.isArray(items)
    ? items
      .map((item, index) => ({
        dayNumber: Math.max(1, Number(item?.dayNumber || index + 1)),
        dayLabel: String(item?.dayLabel || "").trim(),
        title: String(item?.title || item?.heading || "").trim(),
        description: String(item?.description || "").trim(),
      }))
      .filter((item) => item.title || item.description)
    : [];

const buildItineraryText = (items = []) => {
  const normalizedItems = sanitizeItineraryItems(items);

  return normalizedItems.length
    ? normalizedItems
      .map((item) => {
        const heading = [item.dayLabel, item.title].filter(Boolean).join(": ");
        return [heading, item.description].filter(Boolean).join("\n");
      })
      .join("\n\n")
    : "None";
};

const buildItineraryHtml = (items = [], emptyLabel = "No itinerary shared.") => {
  const normalizedItems = sanitizeItineraryItems(items);

  if (!normalizedItems.length) {
    return `<div style="color:#6b7280; font-size:11px;">${escapeHtml(emptyLabel)}</div>`;
  }

  return normalizedItems
    .map((item) => {
      const heading = [item.dayLabel, item.title].filter(Boolean).join(": ");
      return `
        <div style="margin:0 0 10px; border:1px solid #fed7aa; border-radius:12px; background:#fffaf5; padding:10px 12px;">
          <div style="font-size:11px; font-weight:700; color:#9a3412;">${escapeHtml(heading || `Day ${item.dayNumber}`)}</div>
          ${item.description ? `<div style="margin-top:4px; color:#374151; font-size:11px; line-height:1.6; white-space:pre-line;">${escapeHtml(item.description)}</div>` : ""}
        </div>
      `;
    })
    .join("");
};

const DEFAULT_SELLER_BANK_DETAILS = Object.freeze([
  { label: "Bank Name", value: "HDFC Bank" },
  { label: "A/c Holder Name", value: "Holiday Circuit" },
  { label: "A/c No.", value: "50200103968171" },
  { label: "IFSC", value: "HDFC0004413" },
  { label: "Branch", value: "RAMPHAL CHOWK SEC VII DWARKA" },
]);

const normalizeSellerBankDetails = (items = []) => {
  const normalizedItems = Array.isArray(items)
    ? items
      .map((item) => ({
        label: String(item?.label || "").trim(),
        value: String(item?.value || "").trim(),
      }))
      .filter((item) => item.label && item.value)
    : [];

  return normalizedItems.length ? normalizedItems : [...DEFAULT_SELLER_BANK_DETAILS];
};

const normalizeServiceTypeLabel = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase().replace(/_/g, " ");

  if (!normalizedValue) return "Travel Service";
  if (normalizedValue === "hotel") return "Hotel";
  if (normalizedValue === "transfer" || normalizedValue === "transport" || normalizedValue === "car") {
    return "Transport";
  }
  if (normalizedValue === "activity") return "Activity";
  if (normalizedValue === "sightseeing") return "Sightseeing";

  return normalizedValue.replace(/\b\w/g, (character) => character.toUpperCase());
};

const getTypeBadgeColors = (typeLabel = "") => {
  const normalizedType = String(typeLabel || "").trim().toLowerCase();

  if (normalizedType.includes("hotel")) {
    return { background: "#dbeafe", border: "#93c5fd", text: "#1d4ed8" };
  }
  if (normalizedType.includes("transport")) {
    return { background: "#dcfce7", border: "#86efac", text: "#15803d" };
  }
  if (normalizedType.includes("activity")) {
    return { background: "#fef3c7", border: "#fcd34d", text: "#b45309" };
  }
  if (normalizedType.includes("sightseeing")) {
    return { background: "#ede9fe", border: "#c4b5fd", text: "#6d28d9" };
  }

  return { background: "#e2e8f0", border: "#cbd5e1", text: "#10213a" };
};

const buildServiceDescriptionLines = (description = "") => {
  const normalizedDescription = String(description || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s*\n\s*/g, "\n")
    .trim();

  if (!normalizedDescription) return [];

  return normalizedDescription
    .split("\n")
    .flatMap((line) =>
      line
        .replace(/\s+(?=Extra km rate:|Note:)/gi, "\n")
        .split("\n")
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter(Boolean),
    )
    .map((line) => ({
      text: line,
      highlighted: /^(Extra km rate:|Note:)/i.test(line),
    }));
};

const escapeEmailText = (value = "") =>
  escapeHtml(value).replace(/\u20B9/g, "&#8377;");

const buildServiceDescriptionHtml = (description = "") => {
  const lines = buildServiceDescriptionLines(description);

  if (!lines.length) return "";

  return `
    <div style="margin-top:6px;font-size:11px;line-height:1.6;">
      ${lines
        .map(
          (line) => {
            if (line.highlighted) {
              return `
                <div style="margin:6px 0;padding:6px 10px;border-left:3px solid #f97316;background-color:#fff7ed;color:#c2410c;font-weight:700;border-radius:4px;display:block;">
                  ${escapeEmailText(line.text)}
                </div>
              `;
            }
            return `
              <div style="margin:0;color:#334155;font-weight:400;">
                ${escapeEmailText(line.text)}
              </div>
            `;
          }
        )
        .join("")}
    </div>
  `;
};

const buildAgentClientQuotationText = (quoteDetails = {}) => {
  const servicesText = (quoteDetails.services || [])
    .map((service, index) => {
      const meta = buildServiceMeta(service);
      const description = String(service?.description || "").trim();

      return [
        `${index + 1}. ${service?.title || "Service"} (${normalizeServiceTypeLabel(service?.typeLabel)})`,
        meta ? `   ${meta}` : "",
        description ? `   ${description}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    quoteDetails.agentBrandingName ? `${quoteDetails.agentBrandingName} - Client Quotation Summary` : "Holiday Circuit - Client Quotation Summary",
    "",
    `Quotation Number: ${quoteDetails.quotationNumber || "-"}`,
    `Destination: ${quoteDetails.destination || "-"}`,
    `Travel Dates: ${quoteDetails.travelDates || "-"}`,
    `Duration: ${quoteDetails.durationLabel || "-"}`,
    `Travelers: ${quoteDetails.travelerSummary || "-"}`,
    `Valid Till: ${quoteDetails.validTill || "-"}`,
    `Client Total: ${formatCurrency(quoteDetails.totalAmount, quoteDetails.currency)}`,
    "",
    "Day Wise Itinerary",
    buildItineraryText(quoteDetails.dayWiseItinerary),
    "",
    "Services",
    servicesText || "No service details available.",
    "",
    "Inclusions",
    buildQuoteListText(quoteDetails.inclusions),
    "",
    "Exclusions",
    buildQuoteListText(quoteDetails.exclusions),
    "",
    "Additional Notes",
    buildQuoteListText(quoteDetails.additionalNotes),
  ]
    .filter(Boolean)
    .join("\n");
};

const numberToWords = (num) => {
  if (!num || isNaN(num)) return "";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  let n = Math.floor(Number(num));
  if (n === 0) return "Zero";
  if (n > 999999999) return num.toString();

  let str = "";
  const crore = Math.floor(n / 10000000);
  n -= crore * 10000000;
  const lakh = Math.floor(n / 100000);
  n -= lakh * 100000;
  const thousand = Math.floor(n / 1000);
  n -= thousand * 1000;
  const hundred = Math.floor(n / 100);
  n -= hundred * 100;

  if (crore > 0) {
    str += (crore < 20 ? a[crore] : b[Math.floor(crore / 10)] + (crore % 10 !== 0 ? "-" + a[crore % 10] : "")) + " Crore ";
  }
  if (lakh > 0) {
    str += (lakh < 20 ? a[lakh] : b[Math.floor(lakh / 10)] + (lakh % 10 !== 0 ? "-" + a[lakh % 10] : "")) + " Lakh ";
  }
  if (thousand > 0) {
    str += (thousand < 20 ? a[thousand] : b[Math.floor(thousand / 10)] + (thousand % 10 !== 0 ? "-" + a[thousand % 10] : "")) + " Thousand ";
  }
  if (hundred > 0) {
    str += a[hundred] + " Hundred ";
  }
  if (n > 0) {
    if (str !== "") str += "and ";
    str += (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : ""));
  }
  return str.trim() + " Only";
};

const QUOTATION_BRAND = Object.freeze({
  name: "Holiday Circuit",
  subline: "Travel Quotation",
  address: "2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058",
  email: "ops@leelatravels.com",
  phone: "+91 8851346665, +91 9971706003",
  logoUrl: "https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png",
});

export const buildAgentClientQuotationTemplate = (quoteDetails = {}) => {
  const isClientQuote = Boolean(
    quoteDetails.isClientQuotation ||
    quoteDetails.includeSellerBankDetails === false
  );
  const isOps = !isClientQuote && Boolean(
    quoteDetails.isOpsQuotation ||
    quoteDetails.fromOpsSide ||
    quoteDetails.agentBrandingName === QUOTATION_BRAND.name ||
    quoteDetails.agentBrandingName === "Holiday Circuit" ||
    quoteDetails.agencyName === "Holiday Circuit"
  );
  const showBankDetails = !isClientQuote && Boolean(
    quoteDetails.includeSellerBankDetails ||
    isOps
  );
  const showPriceBreakup = Boolean(quoteDetails.showPriceBreakup);
  const brandName = isOps 
    ? QUOTATION_BRAND.name 
    : (quoteDetails.agentBrandingName || quoteDetails.agencyName || QUOTATION_BRAND.name);
  const recipientName = quoteDetails.recipientName || "Guest";
  const queryId = quoteDetails.queryId || "-";
  const destination = quoteDetails.destination || "-";
  const startDate = quoteDetails.travelDates?.split(" - ")[0] || quoteDetails.startDate || "-";
  const durationLabel = quoteDetails.durationLabel || "-";
  const travelerSummary = quoteDetails.travelerSummary || "-";
  const rawCurrency = quoteDetails.currency || "INR";
  const safeTotalAmount = escapeHtml(formatCurrency(quoteDetails.totalAmount, quoteDetails.currency));
  const gstPercent = quoteDetails.gstPercent !== undefined ? Number(quoteDetails.gstPercent) : 5;
  const taxText = gstPercent > 0 ? `(including ${gstPercent}% GST & other Taxes)` : `(including Taxes & Charges)`;
  
  const companyAddress = isOps 
    ? QUOTATION_BRAND.address 
    : (quoteDetails.agentCompanyAddress || quoteDetails.companyAddress || "KG 3/69, Ground Floor, Vikas Puri, New Delhi, Delhi - 110018");
  const agentPhone = isOps 
    ? QUOTATION_BRAND.phone 
    : (quoteDetails.agentPhone || "");
  const agentEmail = isOps 
    ? QUOTATION_BRAND.email 
    : (quoteDetails.agentEmail || "");
  const rawLogo = isOps 
    ? QUOTATION_BRAND.logoUrl 
    : (quoteDetails.agentLogo || "");
  const rawFooter = isOps 
    ? "" 
    : (quoteDetails.agentFooterImage || "");

  const logoUrl = rawLogo ? escapeHtml(rawLogo) : "";
  const footerUrl = rawFooter ? escapeHtml(rawFooter) : "";

  const allServices = Array.isArray(quoteDetails.services) ? quoteDetails.services : [];

  const getNormalizedServiceCategory = (s) => {
    const rawType = String(s?.type || s?.category || s?.serviceType || "").trim().toLowerCase();
    if (rawType === "activity" || rawType === "sightseeing" || rawType === "tour") return "activity";
    if (rawType === "transfer" || rawType === "transport" || rawType === "cab" || rawType === "car" || rawType === "flight") return "transfer";
    if (rawType === "hotel" || rawType === "accommodation" || rawType === "stay") return "hotel";

    const title = String(s?.title || s?.hotelName || s?.name || s?.particulars || "").trim().toLowerCase();
    if (title.includes("tour") || title.includes("sightseeing") || title.includes("aarti") || title.includes("hopping") || title.includes("boating") || title.includes("safari") || title.includes("cruise") || title.includes("water sports") || title.includes("basilica") || title.includes("activity")) {
      return "activity";
    }
    if (title.includes("drop") || title.includes("pickup") || title.includes("transfer") || title.includes("airport") || title.includes("cab") || title.includes("car")) {
      return "transfer";
    }
    if (title.includes("hotel") || title.includes("resort") || title.includes("villas") || title.includes("inn") || title.includes("suites") || title.includes("ramada") || title.includes("alka") || title.includes("hyatt") || title.includes("taj") || title.includes("eden") || title.includes("kandyan") || title.includes("amari")) {
      return "hotel";
    }

    if (s?.roomType && !title.includes("tour") && !title.includes("activity") && !title.includes("sightseeing")) return "hotel";

    return "activity";
  };

  const hotelServices = allServices.filter((s) => getNormalizedServiceCategory(s) === "hotel");
  const transferServices = allServices.filter((s) => getNormalizedServiceCategory(s) === "transfer");
  const activityServices = allServices.filter((s) => getNormalizedServiceCategory(s) === "activity");

  const hotelRowsHtml = hotelServices.length > 0 ? hotelServices.map((service, index) => {
    const resolveHotelName = (srv) => {
      const hName = String(srv?.hotelName || srv?.actualHotelName || srv?.hotel_name || srv?.hotel || "").trim();
      if (hName) return hName;
      const desc = String(srv?.description || srv?.desc || "");
      const pipeParts = desc.split("|").map(p => p.trim());
      const hotelPart = pipeParts.find(p => /hotel|resort|villas|inn|suites|hyatt|taj|ramada|alka|eden|kandyan|amari|marriott|beach/i.test(p));
      if (hotelPart && !hotelPart.toLowerCase().startsWith("standard room") && !hotelPart.toLowerCase().startsWith("deluxe")) {
        return hotelPart.replace(/^Hotel:\s*/i, "");
      }
      return "";
    };

    const serviceName = escapeHtml(service.title || service.name || service.particulars || service.hotelName || "Hotel Service");
    const resolvedHotelName = resolveHotelName(service);
    const hotelNameHtml = resolvedHotelName && resolvedHotelName !== service.title && resolvedHotelName !== service.name
      ? `<div style="font-size:11px; color:#334155; font-weight:600; margin-top:2px;">Hotel: ${escapeHtml(resolvedHotelName)}</div>`
      : "";

    const location = escapeHtml(service.location || service.city || destination);
    const rawDateLabel = service.serviceDateLabel || service.checkIn || service.startDate || service.date;
    const dateLabel = rawDateLabel ? escapeHtml(rawDateLabel) : "";
    const quantity = escapeHtml(service.quantityLabel || service.pax || travelerSummary);
    const description = buildServiceDescriptionHtml(service.description || service.roomType || "Standard Room");
    const combinedHText = `${service.title || ""} ${service.name || ""} ${service.hotelName || ""} ${service.description || ""} ${service.roomType || ""} ${service.hotelCategory || ""} ${service.starCategory || ""} ${service.starRating || ""}`.toLowerCase();
    let count = 4;
    if (combinedHText.includes("3-star") || combinedHText.includes("3 star") || combinedHText.includes("3star") || combinedHText.includes("citymax") || combinedHText.includes("budget")) {
      count = 3;
    } else if (combinedHText.includes("5-star") || combinedHText.includes("5 star") || combinedHText.includes("5star") || combinedHText.includes("luxury") || combinedHText.includes("atlantis")) {
      count = 5;
    } else {
      const rawStars = service.hotelCategory || service.starCategory || service.starRating || "4 Star";
      const starMatch = String(rawStars).match(/(\d+)/);
      if (starMatch) count = Math.min(5, Math.max(1, Number(starMatch[1])));
    }
    const starIcons = "⭐".repeat(count);
    const starDisplay = `${starIcons} ${count} Star`;

    // Resolve Meal Plan details (EP, CP, MAP, AP) with checkmark ✅ and cross ❌
    const resolveMealPlanDisplay = (srv) => {
      const mealRaw = String(srv?.mealPlan || srv?.meals || "").trim();
      const descRaw = String(srv?.description || srv?.roomType || "").trim();
      const combined = `${mealRaw} ${descRaw}`.toUpperCase();

      const hasAP = /\bAP\b|AMERICAN PLAN/i.test(combined) && !/\bMAP\b/i.test(combined);
      const hasMAP = /\bMAP\b|MODIFIED AMERICAN|BREAKFAST AND DINNER|BREAKFAST & DINNER/i.test(combined);
      const hasCP = (/\bCP\b|CONTINENTAL|BREAKFAST ONLY|ONLY BREAKFAST/i.test(combined)) && !hasMAP && !hasAP;
      const hasEP = (/\bEP\b|EUROPEAN|ROOM ONLY|ONLY ROOM|NO MEALS/i.test(combined)) && !hasCP && !hasMAP && !hasAP;

      if (hasAP) return `AP Plan (✅ Breakfast • ✅ Lunch • ✅ Dinner)`;
      if (hasMAP) return `MAP Plan (✅ Breakfast • ✅ Dinner)`;
      if (hasCP) return `CP Plan (✅ Breakfast • ❌ Dinner)`;
      if (hasEP) return `EP Plan (❌ Breakfast • ❌ Dinner)`;

      if (/dinner/i.test(mealRaw) && /breakfast/i.test(mealRaw)) return `MAP Plan (✅ Breakfast • ✅ Dinner)`;
      if (/breakfast/i.test(mealRaw)) return `CP Plan (✅ Breakfast • ❌ Dinner)`;
      if (/\bCP\b/.test(descRaw)) return `CP Plan (✅ Breakfast • ❌ Dinner)`;

      return mealRaw ? escapeHtml(mealRaw) : `CP Plan (✅ Breakfast • ❌ Dinner)`;
    };

    const mealPlanDisplay = resolveMealPlanDisplay(service);
    
    let numNights = Number(service.nights || service.nightCount || 0);
    if (!numNights && service.quantityLabel) {
      const match = String(service.quantityLabel).match(/(\d+)\s*N/i);
      if (match) numNights = Number(match[1]);
    }
    if (!numNights && service.stayLabel) {
      const match = String(service.stayLabel).match(/(\d+)\s*N/i);
      if (match) numNights = Number(match[1]);
    }
    if (!numNights && service.description) {
      const match = String(service.description).match(/(\d+)\s*N/i);
      if (match) numNights = Number(match[1]);
    }
    if (!numNights) {
      numNights = 1;
    }
    const nightText = `${numNights} Night${numNights > 1 ? 's' : ''}`;

    let checkOutVal = service.checkOut || service.endDate || "";
    let dateRangeDisplay = "";

    if (rawDateLabel && rawDateLabel !== "-") {
      const rawStr = String(rawDateLabel).trim();
      if (rawStr.includes(" - ") || rawStr.includes(" to ")) {
        dateRangeDisplay = escapeHtml(rawStr);
      } else if (checkOutVal && checkOutVal !== "-") {
        dateRangeDisplay = `${escapeHtml(rawStr)} - ${escapeHtml(checkOutVal)}`;
      } else {
        const parsedStart = new Date(rawStr);
        if (!isNaN(parsedStart.getTime())) {
          const parsedEnd = new Date(parsedStart);
          parsedEnd.setDate(parsedEnd.getDate() + numNights);
          const startStr = parsedStart.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          const endStr = parsedEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          dateRangeDisplay = `${startStr} - ${endStr}`;
        } else {
          dateRangeDisplay = escapeHtml(rawStr);
        }
      }
    }

    const firstColText = dateRangeDisplay 
      ? `<strong>${nightText}</strong><br/><span style="font-size:11px; color:#475569; display:inline-block; margin-top:2px;">(${dateRangeDisplay})</span>`
      : `<strong>${nightText}</strong>`;

    const resolvedRoomType = escapeHtml(
      service.roomType ||
      (service.description && String(service.description).split("|")[0].trim()) ||
      "Standard Room"
    );
    const resolvedRoomCategory = escapeHtml(service.roomCategory || service.bedType || "");

    return `
      <tr>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          ${firstColText}
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b; font-weight:bold;">
          ${location}
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${serviceName}</strong><br/>
          ${hotelNameHtml}
          <span style="font-size:11px; color:#d97706; font-weight:600; display:inline-block; margin-top:3px;">${starDisplay}</span>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${mealPlanDisplay}</strong>
          <div style="font-size:11px; color:#475569; line-height:1.4; margin-top:3px;">${description}</div>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <div style="font-weight:600; color:#0f172a;">${quantity}</div>
          ${resolvedRoomType ? `<div style="font-size:11px; color:#475569; font-weight:500; margin-top:3px;">• ${resolvedRoomType}${resolvedRoomCategory ? ` (${resolvedRoomCategory})` : ''}</div>` : ''}
        </td>
      </tr>
    `;
  }).join("") : "";

  const transferRowsHtml = transferServices.map((service, index) => {
    const serviceName = escapeHtml(service.title || service.name || service.particulars || "Airport Transfer");
    const location = escapeHtml(service.location || service.city || destination);
    const dateLabel = escapeHtml(service.serviceDateLabel || service.date || (service.serviceDate ? new Date(service.serviceDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : `Day ${index + 1}`));
    const quantity = escapeHtml(service.quantityLabel || service.pax || travelerSummary);
    const pickupTime = escapeHtml(service.pickupTime || service.time || service.selectedSlot || "");
    const vehicleType = escapeHtml(service.vehicleType || "");
    const usageLabel = escapeHtml(service.transportUsageLabel || service.usageType || "");
    const description = buildServiceDescriptionHtml(service.description || service.vehicle || service.vehicleType || "AC Sedan | Driver Included");
    
    return `
      <tr>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${dateLabel}</strong>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong style="color: #0f172a; font-size: 13px;">${serviceName}</strong>
          ${location ? `<div style="font-size:11px; color:#64748b; font-weight:500; margin-top:2px;">📍 ${location}</div>` : ""}
          ${pickupTime ? `<div style="font-size:11px; color:#b45309; font-weight:600; margin-top:3px; display:inline-block; background-color:#fef3c7; border:1px solid #fde68a; padding:2px 6px; border-radius:4px;">⏰ Pickup Time: ${pickupTime}</div>` : ""}
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          ${description}
          ${(vehicleType || usageLabel || pickupTime) ? `
            <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px; font-size:11px;">
              ${pickupTime ? `<span style="background-color:#fef3c7; border:1px solid #fde68a; color:#b45309; font-weight:600; padding:2px 6px; border-radius:4px; display:inline-block;">⏰ Pickup: ${pickupTime}</span>` : ""}
              ${vehicleType ? `<span style="background-color:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; font-weight:600; padding:2px 6px; border-radius:4px; display:inline-block;">🚗 ${vehicleType}</span>` : ""}
              ${usageLabel ? `<span style="background-color:#f1f5f9; border:1px solid #cbd5e1; color:#475569; font-weight:500; padding:2px 6px; border-radius:4px; display:inline-block;">🏷️ ${usageLabel}</span>` : ""}
            </div>
          ` : ""}
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${quantity}</strong>
        </td>
      </tr>
    `;
  }).join("");

  const activityRowsHtml = activityServices.map((service, index) => {
    const serviceName = escapeHtml(service.title || service.name || service.particulars || service.activityName || service.sightseeingName || "Sightseeing Tour");
    const location = escapeHtml(service.location || service.city || destination);
    const dateLabel = escapeHtml(service.serviceDateLabel || service.date || (service.serviceDate ? new Date(service.serviceDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : `Day ${index + 1}`));
    const quantity = escapeHtml(service.quantityLabel || service.pax || travelerSummary);

    // Tour Type (e.g., Private Tour / Sharing Tour)
    const tourType = escapeHtml(service.tourType || service.tour_type || "Sharing Tour");

    // Format Duration nicely (e.g. 600 -> 10 Hours, 150 -> 2.5 Hours)
    const rawDuration = String(service.duration || "").trim();
    let formattedDuration = "";
    if (rawDuration) {
      const numDur = Number(rawDuration);
      if (!isNaN(numDur) && numDur > 0) {
        const hrs = numDur / 60;
        formattedDuration = hrs >= 1 ? `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)} Hours` : `${numDur} Mins`;
      } else {
        formattedDuration = rawDuration;
      }
    }

    // Selected Slot / Time (e.g., 08:00 AM)
    const slotTime = escapeHtml(service.selectedSlot || service.slot || service.time || service.openingTime || "");

    // Operating Days & Timings
    const opDays = escapeHtml(service.operatingDays || "");
    const openTime = escapeHtml(service.openingTime || "");
    const closeTime = escapeHtml(service.closingTime || "");
    let timingsDisplay = "";
    if (openTime && closeTime) {
      timingsDisplay = `${openTime} - ${closeTime}`;
    } else if (openTime) {
      timingsDisplay = openTime;
    }

    // Adult / Child Pricing Badges
    const adultPriceNum = Number(service.adultPrice || service.adult_price || 0);
    const childPriceNum = Number(service.childPrice || service.child_price || 0);

    const description = buildServiceDescriptionHtml(service.description || "Guided Sightseeing Tour & Activity");

    // Build Rich Info Badges HTML
    const extraDetailsHtml = `
      <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; font-size: 11px;">
        ${tourType ? `<span style="background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-weight: 600; padding: 2px 6px; border-radius: 4px; display: inline-block;">● ${tourType}</span>` : ""}
        ${slotTime ? `<span style="background-color: #fef3c7; border: 1px solid #fde68a; color: #b45309; font-weight: 600; padding: 2px 6px; border-radius: 4px; display: inline-block;">⏰ Slot: ${slotTime}</span>` : ""}
        ${formattedDuration ? `<span style="background-color: #f3e8ff; border: 1px solid #e9d5ff; color: #6b21a8; font-weight: 600; padding: 2px 6px; border-radius: 4px; display: inline-block;">⏱️ Duration: ${escapeHtml(formattedDuration)}</span>` : ""}
        ${opDays ? `<span style="background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-weight: 500; padding: 2px 6px; border-radius: 4px; display: inline-block;">📅 ${opDays}</span>` : ""}
        ${timingsDisplay ? `<span style="background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-weight: 500; padding: 2px 6px; border-radius: 4px; display: inline-block;">⌛ ${timingsDisplay}</span>` : ""}
      </div>
      ${(showPriceBreakup && (adultPriceNum > 0 || childPriceNum > 0)) ? `
        <div style="margin-top: 4px; font-size: 11px; color: #047857; font-weight: 600;">
          ${adultPriceNum > 0 ? `Adult: ₹${adultPriceNum.toLocaleString("en-IN")}` : ""}${childPriceNum > 0 ? ` | Child: ₹${childPriceNum.toLocaleString("en-IN")}` : ""}
        </div>
      ` : ""}
    `;

    // Resolve exact Total Pax & Adults/Children Breakdown
    const resolveActivityPaxHtml = (srv) => {
      const numAdults = Number(srv.adults !== undefined && srv.adults !== null ? srv.adults : 0);
      const numChildren = Number(srv.children !== undefined && srv.children !== null ? srv.children : 0);
      const numInfants = Number(srv.infants !== undefined && srv.infants !== null ? srv.infants : 0);
      
      const hasExplicitBreakdown = (numAdults > 0 || numChildren > 0 || numInfants > 0);
      const calcTotalPax = hasExplicitBreakdown ? (numAdults + numChildren + numInfants) : Number(srv.pax || 0);

      const parts = [];
      if (numAdults > 0) parts.push(`${numAdults} Adult${numAdults > 1 ? 's' : ''}`);
      if (numChildren > 0) parts.push(`${numChildren} Child${numChildren > 1 ? 'ren' : ''}`);
      if (numInfants > 0) parts.push(`${numInfants} Infant${numInfants > 1 ? 's' : ''}`);

      if (hasExplicitBreakdown) {
        return `<strong style="color: #0f172a; font-size: 13px;">${calcTotalPax} Pax</strong>${parts.length > 0 ? `<br/><span style="font-size:11px; color:#475569; font-weight:600;">(${parts.join(", ")})</span>` : ""}`;
      }

      if (calcTotalPax > 1) {
        return `<strong style="color: #0f172a; font-size: 13px;">${calcTotalPax} Pax</strong>${travelerSummary && travelerSummary !== "-" ? `<br/><span style="font-size:11px; color:#475569; font-weight:600;">(${escapeHtml(travelerSummary)})</span>` : ""}`;
      }

      if (travelerSummary && travelerSummary !== "-") {
        return `<strong style="color: #0f172a; font-size: 12px;">${escapeHtml(travelerSummary)}</strong>`;
      }

      return `<strong style="color: #0f172a; font-size: 12px;">1 Pax</strong>`;
    };

    const paxDisplayHtml = resolveActivityPaxHtml(service);

    return `
      <tr>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${dateLabel}</strong>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong style="color: #0f172a; font-size: 13px;">${serviceName}</strong>
          ${location ? `<div style="font-size:11px; color:#64748b; font-weight:500; margin-top:2px;">📍 ${location}</div>` : ""}
          <div style="font-size:11px; color:#2563eb; font-weight:600; margin-top:2px;">Tour Type: ${tourType}</div>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          ${description}
          ${extraDetailsHtml}
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          ${paxDisplayHtml}
        </td>
      </tr>
    `;
  }).join("");

  const inclusionsList = Array.isArray(quoteDetails.inclusions) && quoteDetails.inclusions.length > 0
    ? quoteDetails.inclusions
    : [
        "Stay as mentioned above or in Similar hotels",
        "Meals as mentioned in the Itinerary",
        "Enterances only as mentioned in Itinerary",
        "Transport as per Itinerary - Point to Point Basis",
        "Taxes as on Date"
      ];
      
  const exclusionsList = Array.isArray(quoteDetails.exclusions) && quoteDetails.exclusions.length > 0
    ? quoteDetails.exclusions
    : [
        "Airfare",
        "Early Check and Late Check out charges",
        "Personal Expenses - Room Service, Laundry, Porterage or Mini Bar etc",
        "Hotel Security Deposit - Refundable at time of checkout",
        "TCS and GST - 2 and 5 % (if not Included)",
        "Any services not mentioned above",
        "Visa Fees if not added in Inclusions",
        "Travel Insurance - recommended"
      ];

  const inclusionsHtml = inclusionsList.map(item => `<li style="margin-bottom:6px; list-style-type:none;"><span style="color:#059669; font-weight:bold; margin-right:6px;">✔</span>${escapeHtml(item)}</li>`).join("");
  const exclusionsHtml = exclusionsList.map(item => `<li style="margin-bottom:6px; list-style-type:none;"><span style="color:#dc2626; font-weight:bold; margin-right:6px;">✖</span>${escapeHtml(item)}</li>`).join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5; max-width: 100%; margin: 0 auto; background: #ffffff; padding: 16px;">
      
      <!-- AGENT BRAND HEADER BANNER -->
      <div style="background-color: #ffffff; border-bottom: 2px solid #e2e8f0; padding: 14px 20px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            ${logoUrl ? `
              <td style="vertical-align: middle; padding-right: 12px; width: 110px; text-align: left;">
                <img src="${logoUrl}" alt="${escapeHtml(brandName)}" style="width: 105px; height: 75px; object-fit: contain; object-position: left; display: block; margin-left: 0;" />
              </td>
            ` : ""}
            <td style="vertical-align: middle; text-align: left; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; padding: 0;">
              <h2 style="margin: 0 0 3px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; line-height: 1.2;">
                ${escapeHtml(brandName)}
              </h2>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569; line-height: 1.4;">
                ${escapeHtml(companyAddress)}
              </p>
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #3252C3; line-height: 1.4;">
                ${agentPhone ? `Phone: ${escapeHtml(agentPhone)}` : ""}${agentPhone && agentEmail ? ` &bull; ` : ""}${agentEmail ? `Email: ${escapeHtml(agentEmail)}` : ""}
              </p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Greeting Header -->
      <div style="margin-bottom: 20px; font-size: 13px; color: #1e293b;">
        <p style="margin: 0 0 10px 0;">Dear <strong>${escapeHtml(recipientName)}</strong>,</p>
        <p style="margin: 0 0 10px 0;">Greetings from <strong>${escapeHtml(brandName)} !!!</strong></p>
        <p style="margin: 0;">As per our discussion, following is the <strong>Updated Quote after Conversion</strong> details.</p>
      </div>

      <!-- 1. PACKAGE OVERVIEW -->
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
            <td width="75%" style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${escapeHtml(queryId)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Destination</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; color: #0f172a;">
              <strong>${escapeHtml(destination)}</strong><br/>
              <span style="background-color: #fef08a; border: 1px solid #fde047; color: #854d0e; font-weight: bold; padding: 2px 6px; font-size: 11px; display: inline-block; margin-top: 4px; border-radius: 2px;">
                ${escapeHtml(destination)} (${escapeHtml(durationLabel)})
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Start Date</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${escapeHtml(startDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Trip Duration</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${escapeHtml(durationLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Pax</td>
            <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${escapeHtml(travelerSummary)}</td>
          </tr>
        </tbody>
      </table>

      <!-- 2. HOTELS (IF ANY) -->
      ${hotelRowsHtml ? `
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
          ${hotelRowsHtml}
        </tbody>
      </table>
      ` : `
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
          <tr>
            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px;"><strong>1 Night</strong> (${escapeHtml(startDate)})</td>
            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; font-weight:bold;">${escapeHtml(destination)}</td>
            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px;"><strong>As per Itinerary / Similar</strong><br/><span style="font-size:11px; color:#d97706; font-weight:600; display:inline-block; margin-top:3px;">⭐⭐⭐⭐⭐ 5 Star</span></td>
            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px;">
              <strong>Breakfast and Dinner</strong>
              <div style="font-size:11px; color:#475569; line-height:1.4; margin-top:3px;">Standard Room</div>
            </td>
            <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; font-weight:600;">
              ${escapeHtml(travelerSummary)}
            </td>
          </tr>
        </tbody>
      </table>
      `}

      <!-- 2.1 TRANSFERS & TRANSPORT (IF ANY) -->
      ${transferRowsHtml ? `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th colspan="4" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Transfers & Transport
            </th>
          </tr>
          <tr style="background-color: #ffffff; text-align: left;">
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 18%;">Service Date</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Service / Route</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Transport Details</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 14%;">Pax / Qty</th>
          </tr>
        </thead>
        <tbody>
          ${transferRowsHtml}
        </tbody>
      </table>
      ` : ""}

      <!-- 2.2 ACTIVITIES & SIGHTSEEING (IF ANY) -->
      ${activityRowsHtml ? `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th colspan="4" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Activities & Sightseeing
            </th>
          </tr>
          <tr style="background-color: #ffffff; text-align: left;">
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 18%;">Service Date</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Activity / Tour Name</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Inclusions & Description</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 14%;">Pax / Qty</th>
          </tr>
        </thead>
        <tbody>
          ${activityRowsHtml}
        </tbody>
      </table>
      ` : ""}

      <!-- 3. TOTAL PRICE -->
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
                Prices (${escapeHtml(rawCurrency)})
              </div>
              <div style="font-size: 14px; font-weight: bold; color: #0f172a;">
                Total: ${safeTotalAmount} /- <span style="font-weight: 600; font-style: italic; color: #2563eb; font-size: 12px;">${taxText}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 3.1 BANK DETAILS FOR PAYMENT -->
      ${showBankDetails ? `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th colspan="2" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Bank Account Details for Payment
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569; width: 35%;">Bank Name</td>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">HDFC Bank</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">Account Holder Name</td>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">Holiday Circuit</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">Account Number</td>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">50200103968171</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">IFSC Code</td>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">HDFC0004413</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">Branch</td>
            <td style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">RAMPHAL CHOWK SEC VII DWARKA</td>
          </tr>
        </tbody>
      </table>
      ` : ""}

      <!-- 4. INCLUSIONS & EXCLUSIONS -->
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
              <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">
                ${inclusionsHtml}
              </ul>
            </td>
            <td valign="top" style="padding: 12px 16px; border: 1px solid #d1d5db; font-size: 12px; color: #1e293b;">
              <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">
                ${exclusionsHtml}
              </ul>
              <p style="margin: 12px 0 0 0; font-weight: bold; color: #0f766e; font-size: 11px;">
                NOTE: Anything not mentioned in the inclusions is excluded.
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 5. TERMS AND CONDITIONS -->
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
            <td style="padding: 14px 16px; font-size: 12px; color: #1e293b; line-height: 1.6;">
              ${Array.isArray(quoteDetails.additionalNotes) && quoteDetails.additionalNotes.filter(Boolean).length > 0 ? `
                <p style="font-weight: bold; font-size: 12px; margin: 0 0 6px 0; color: #0f172a;">Special Quotation Terms & Notes:</p>
                <ol style="margin: 0 0 14px 0; padding-left: 18px; color: #334155;">
                  ${quoteDetails.additionalNotes.filter(Boolean).map(item => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`).join("")}
                </ol>
              ` : ""}
              <p style="font-weight: bold; font-size: 13px; margin: 0 0 10px 0; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">Holiday Circuit Official Terms and Conditions</p>
              <p style="font-size: 11.5px; color: #334155; margin-0 0 10px 0;">Welcome to <strong>Holiday Circuit</strong>. These Terms and Conditions govern your use of the Holiday Circuit services. When You Make a booking or reservation, you agree to be bound by these Terms.</p>
              
              <ol style="margin: 0; padding-left: 18px; color: #334155; font-size: 11.5px; line-height: 1.65;">
                <li style="margin-bottom: 10px;">
                  <strong style="color: #0f172a;">Bookings and Reservations:</strong>
                  <ul style="margin: 4px 0 0 0; padding-left: 16px; list-style-type: disc;">
                    <li style="margin-bottom: 4px;"><strong>Booking Process:</strong> When you make a booking through Holiday Circuit, you agree to provide accurate and complete information. Any discrepancies may result in cancellation.</li>
                    <li style="margin-bottom: 6px;">
                      <strong>Payment Terms:</strong> Payments are due as specified during booking. Failure to pay on time may result in cancellation.
                      <ol style="margin: 4px 0 4px 0; padding-left: 16px; color: #1e293b;">
                        <li style="margin-bottom: 3px;"><span style="color: #b91c1c; font-weight: 700; background-color: #fef2f2; padding: 1px 4px; border-radius: 3px;">Minimum 50%</span> of the booking amount is required at the time of booking confirmation.</li>
                        <li style="margin-bottom: 3px;">Remaining 50% in 2 parts: <span style="color: #c2410c; font-weight: 600;">25% within 30 Days prior to departure</span> and <span style="color: #c2410c; font-weight: 600;">25% within 20 days prior to departure</span>.</li>
                        <li style="margin-bottom: 3px;">In Case of Airline booking/Train Tickets, <span style="color: #b91c1c; font-weight: 700;">100% ticket cost</span> to be paid at confirmation.</li>
                        <li style="margin-bottom: 3px;">If a booking is under 100% cancellation period, <span style="color: #b91c1c; font-weight: 700;">100% booking amount</span> is required at confirmation.</li>
                      </ol>
                    </li>
                    <li style="margin-bottom: 4px;"><strong>Confirmation:</strong> Booking is confirmed only upon receipt of payment. <span style="color: #dc2626; font-weight: 700; background-color: #fef2f2; padding: 1px 5px; border-radius: 3px;">*Booking will be auto cancelled in case of non-payment within stipulated time.*</span></li>
                    <li style="margin-bottom: 4px;"><strong>Credit Card:</strong> Credit Card payments may attract an additional charge from <span style="color: #d97706; font-weight: 700;">3% to 5%</span> depending on card type (charged over & above actual package cost).</li>
                    <li style="margin-bottom: 4px;"><strong>Confirmation Vouchers:</strong> Vouchers will only be provided <span style="color: #2563eb; font-weight: 700;">7 days before the arrival date</span>.</li>
                    <li style="margin-bottom: 4px;"><strong>Airport Transfers & Tour Pick Ups:</strong> Includes <span style="color: #d97706; font-weight: 700; background-color: #fffbeb; padding: 1px 4px; border-radius: 3px;">60 minutes waiting time</span> for Airport pick-ups. Delayed at immigration/luggage requires calling emergency number to extend. For all other pick-ups, driver will wait for <span style="color: #d97706; font-weight: 700; background-color: #fffbeb; padding: 1px 4px; border-radius: 3px;">10 minutes</span> at Hotel Lobby / Reception.</li>
                    <li style="margin-bottom: 4px;"><strong>Taxes:</strong> Any changes in taxes (GST/TCS/Government Tax) at confirmation will be adjusted as per prevailing tax regulations.</li>
                    <li style="margin-bottom: 4px;"><strong>Changes & Cancellations:</strong> Subject to fees or penalties determined by service providers and Holiday Circuit.</li>
                  </ul>
                </li>

                <li style="margin-bottom: 10px;">
                  <strong style="color: #0f172a;">Travel Documents and Requirements:</strong>
                  <ul style="margin: 4px 0 0 0; padding-left: 16px; list-style-type: disc;">
                    <li style="margin-bottom: 4px;"><strong>Valid ID Proof:</strong> Responsibility of guest to possess valid ID/Visas. <span style="color: #b91c1c; font-weight: 700; background-color: #fef2f2; padding: 2px 6px; border-radius: 3px; display: inline-block; margin-top: 2px;">⚠️ To Enter Nepal by Air: Valid Passport or Election Card is Mandatory. Aadhar Card is NOT valid for Travel.</span></li>
                    <li style="margin-bottom: 4px;"><strong>Health & Vaccinations:</strong> Guest is responsible for meeting health and vaccination requirements.</li>
                    <li style="margin-bottom: 4px;"><strong>Travel Insurance:</strong> We strongly recommend purchasing travel insurance to protect against unexpected events or emergencies.</li>
                  </ul>
                </li>

                <li style="margin-bottom: 10px;">
                  <strong style="color: #0f172a;">Changes to Itineraries & Liability:</strong>
                  <ul style="margin: 4px 0 0 0; padding-left: 16px; list-style-type: disc;">
                    <li style="margin-bottom: 4px;"><strong>Changes by Holiday Circuit:</strong> Right reserved to modify itinerary/accommodations due to unforeseen circumstances with prompt notice.</li>
                    <li style="margin-bottom: 4px;"><strong>Service Providers Liability:</strong> Intermediary role; not liable for third-party service provider negligence or omissions.</li>
                    <li style="margin-bottom: 4px;"><strong>Force Majeure:</strong> Not liable for disruptions, cancellations, or delays caused by natural disasters, strikes, political unrest, or force majeure.</li>
                    <li style="margin-bottom: 4px;"><strong>Governing Law:</strong> Governed by the laws of <span style="color: #0f172a; font-weight: 700;">New Delhi Jurisdiction</span>.</li>
                  </ul>
                </li>

                <li style="margin-bottom: 6px;">
                  <strong style="color: #0f172a;">Contact Information:</strong><br/>
                  <span style="color: #475569; font-size: 11px;">
                    Holiday Circuit: KG 3/69, Ground Floor, Vikas Puri, New Delhi - 110018 (Near UK Nursing Home)<br/>
                    Email: <a href="mailto:varun@holidaycircuit.com" style="color: #2563eb; text-decoration: underline;">varun@holidaycircuit.com</a> | Phone: +91 8851346665, +91 9971706003
                  </span>
                </li>
              </ol>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 6. AGENT BRAND FOOTER BANNER -->
      ${footerUrl
        ? `
          <div style="width: 100%; margin-top: 24px; text-align: center;">
            <img src="${footerUrl}" alt="Footer Banner" style="width: 100%; max-width: 100%; height: auto; display: block; border-radius: 4px; border: 0;" />
          </div>
        `
        : `
          <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; font-family: Arial, sans-serif; line-height: 1.5; padding-top: 12px;">
            <p style="margin: 0;"><strong>${escapeHtml(brandName)}</strong> ${agentPhone ? `&bull; Phone: ${escapeHtml(agentPhone)}` : ""} ${agentEmail ? `&bull; Email: ${escapeHtml(agentEmail)}` : ""}</p>
            ${companyAddress ? `<p style="margin: 2px 0 0 0; color: #94a3b8;">${escapeHtml(companyAddress)}</p>` : ""}
          </div>
        `
      }

    </div>
  `;
};






//---------------------- Voucher template builder----------------------------------

const getVoucherStatusNote = (services = [], isAlreadySent = false) => {
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

export const buildVoucherTemplate = (voucherDetails, branding = "with") => {
  const showBranding = branding === "with";
  const VOUCHER_LOGO_URL =
    "https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png";

  const formatServiceTypeLabel = (value = "") => {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return "Service";
    if (normalized === "hotel") return "Hotel";
    if (normalized === "transfer" || normalized === "transport" || normalized === "car") return "Transport";
    if (normalized === "activity") return "Activity";
    if (normalized === "sightseeing") return "Sightseeing";
    if (normalized === "flight") return "Flight";
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatTravelDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTravelerBreakup = ({
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

  const voucherFooterSrc = String(
    voucherDetails?.voucherFooterImage ||
    voucherDetails?.footerBanner ||
    voucherDetails?.pdfFooterImage ||
    voucherDetails?.agentFooterImage ||
    ""
  ).trim();
  const resolvedTravelDate = voucherDetails.travelDate || voucherDetails.date || null;
  const passengerBreakup = formatTravelerBreakup({
    adults: voucherDetails.adults,
    children: voucherDetails.children,
    travelerSummary: voucherDetails.travelerSummary,
    passengers: voucherDetails.passengers,
  });

  const serviceRowsHtml = (voucherDetails.services || [])
    .map((service) => {
      const confirmation = service.confirmation || "Pending";
      const isConfirmed = confirmation && confirmation.toLowerCase() !== "pending";
      const confClass = isConfirmed ? "conf-cell" : "conf-cell pending";
      const confColor = isConfirmed ? "#15803d" : "#d97706";

      return `
        <tr>
          <td class="type-cell" style="border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563; width: 22%; font-family: 'Outfit', sans-serif;">${formatServiceTypeLabel(service.type)}</td>
          <td class="name-cell" style="border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; padding: 12px 14px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(service.title || service.name || "Service details missing")}</td>
          <td class="${confClass}" style="border-bottom: 1px solid #d6dde7; padding: 12px 14px; font-size: 13px; font-weight: 700; color: ${confColor}; text-align: right; white-space: nowrap; vertical-align: middle; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(confirmation)}${service.status ? ` (${escapeHtml(service.status)})` : ""}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Voucher - ${escapeHtml(voucherDetails.voucherNumber || voucherDetails.query || "")}</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            background-color: #eef2f6;
            padding: 40px 20px;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
          }
          .voucher-container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #cfd6de;
            overflow: hidden;
          }
          .brand-header {
            background-color: #151d31;
            height: 102px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 34px 0 28px;
            border-bottom: 3px solid #d95508;
          }
          .brand-logo-box {
            background: #ffffff;
            padding: 10px 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #244a7a;
            z-index: 2;
            position: relative;
            margin-left: 18px;
          }
          .brand-logo {
            height: 46px;
            width: auto;
            object-fit: contain;
          }
          .brand-name {
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            font-size: 30px;
            font-weight: 800;
            letter-spacing: -0.4px;
            z-index: 2;
            position: relative;
          }
          .title-bar {
            background: linear-gradient(135deg, #020617, #0f172a, #d95508);
            color: #ffffff;
            text-align: center;
            font-size: 18px;
            font-weight: 700;
            padding: 16px 20px;
            letter-spacing: 3px;
            text-transform: uppercase;
            font-family: 'Outfit', sans-serif;
            border-top: 2px solid #2f5b90;
            border-bottom: 2px solid #101b31;
          }
          .voucher-body {
            padding: 28px 30px 30px;
          }
          .metadata-card {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cfd6de;
            margin-bottom: 18px;
          }
          .metadata-card tr td {
            border-bottom: 1px solid #d6dde7;
            border-right: 1px solid #d6dde7;
            padding: 12px 14px;
            font-size: 13px;
            vertical-align: middle;
          }
          .metadata-card tr:last-child td {
            border-bottom: none;
          }
          .metadata-card tr td:last-child {
            border-right: none;
          }
          .metadata-card td.label-cell {
            background-color: #f2f4f7;
            font-weight: 700;
            color: #1f2937;
            width: 32%;
            font-family: 'Outfit', sans-serif;
          }
          .metadata-card td.value-cell {
            background-color: #ffffff;
            color: #0f172a;
            font-weight: 600;
          }
          .section-heading {
            margin: 24px 0 12px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.8px;
            color: #ffffff;
            background: linear-gradient(135deg, #020617, #0f172a, #d95508);
            padding: 10px 14px;
            font-family: 'Outfit', sans-serif;
            border-top: 2px solid #2f5b90;
            border-bottom: 2px solid #101b31;
          }
          .services-table-card {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cfd6de;
          }
          .services-table-card th {
            background-color: #f2f4f7;
            border-bottom: 1px solid #d6dde7;
            border-right: 1px solid #d6dde7;
            padding: 12px 14px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #1f2937;
            text-align: left;
            letter-spacing: 0.8px;
            font-family: 'Outfit', sans-serif;
          }
          .services-table-card th:last-child {
            border-right: none;
          }
          .services-table-card td {
            border-bottom: 1px solid #d6dde7;
            border-right: 1px solid #d6dde7;
            padding: 12px 14px;
            font-size: 13px;
            color: #334155;
            background-color: #ffffff;
          }
          .services-table-card tr:last-child td {
            border-bottom: none;
          }
          .services-table-card td:last-child {
            border-right: none;
          }
          .services-table-card tr:nth-child(even) td {
            background-color: #fbfcfd;
          }
          .services-table-card td.type-cell {
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            color: #4b5563;
            width: 22%;
          }
          .services-table-card td.name-cell {
            font-weight: 600;
            color: #0f172a;
          }
          .services-table-card td.conf-cell {
            font-weight: 700;
            color: #15803d;
            text-align: right;
            white-space: nowrap;
            vertical-align: middle;
          }
          .services-table-card td.conf-cell.pending {
            color: #d97706;
          }
          .generated-note {
            text-align: center;
            font-size: 11px;
            color: #64748b;
            margin: 24px 0 0;
            font-weight: 500;
          }
          .brand-footer {
            background: linear-gradient(135deg, #020617, #0f172a, #d95508);
            padding: 16px 24px;
            border-top: 4px solid #d95508;
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
        <div class="voucher-container" style="border: 1px solid #cfd6de; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          <table class="brand-header-table" width="100%" cellpadding="0" cellspacing="0" style="background-color: #151d31; border-bottom: 3px solid #d95508; height: 102px;">
            <tr>
              <td style="padding: 15px 28px; text-align: left; vertical-align: middle;">
                <div class="brand-logo-box" style="background: #ffffff; padding: 10px 16px; display: inline-block; border: 2px solid #244a7a;">
                  ${showBranding
                    ? `<img src="${VOUCHER_LOGO_URL}" alt="Holiday Circuit Logo" style="height: 46px; width: auto; display: block;">`
                    : `<div style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #151d31;">TV</div>`
                  }
                </div>
              </td>
              <td style="padding: 15px 34px; text-align: right; vertical-align: middle;">
                <div style="color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 30px; font-weight: 800; letter-spacing: -0.4px;">
                  ${showBranding ? "Holiday Circuit" : "Travel Voucher"}
                </div>
              </td>
            </tr>
          </table>

          <div class="title-bar" style="background: linear-gradient(135deg, #020617, #0f172a, #d95508); color: #ffffff; text-align: center; font-size: 18px; font-weight: 700; padding: 16px 20px; letter-spacing: 3px; text-transform: uppercase; font-family: 'Outfit', sans-serif; border-bottom: 2px solid #101b31;">
            Travel Voucher
          </div>

          <div class="voucher-body" style="padding: 28px 30px 30px;">
            <table class="metadata-card" width="100%" style="width: 100%; border-collapse: collapse; border: 1px solid #cfd6de; margin-bottom: 18px;">
              <tr>
                <td class="label-cell" style="background-color: #f2f4f7; font-weight: 700; color: #1f2937; width: 32%; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; font-family: 'Outfit', sans-serif;">Voucher Number</td>
                <td class="value-cell" style="background-color: #ffffff; color: #0f172a; font-weight: 600; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(voucherDetails.voucherNumber || voucherDetails.query || "")}</td>
              </tr>
              <tr>
                <td class="label-cell" style="background-color: #f2f4f7; font-weight: 700; color: #1f2937; width: 32%; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; font-family: 'Outfit', sans-serif;">Destination</td>
                <td class="value-cell" style="background-color: #ffffff; color: #0f172a; font-weight: 600; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(voucherDetails.destination || "-")}</td>
              </tr>
              <tr>
                <td class="label-cell" style="background-color: #f2f4f7; font-weight: 700; color: #1f2937; width: 32%; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; font-family: 'Outfit', sans-serif;">Duration</td>
                <td class="value-cell" style="background-color: #ffffff; color: #0f172a; font-weight: 600; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(voucherDetails.duration || "-")}</td>
              </tr>
              <tr>
                <td class="label-cell" style="background-color: #f2f4f7; font-weight: 700; color: #1f2937; width: 32%; padding: 12px 14px; font-size: 13px; border-right: 1px solid #d6dde7; font-family: 'Outfit', sans-serif;">Passengers</td>
                <td class="value-cell" style="background-color: #ffffff; color: #0f172a; font-weight: 600; padding: 12px 14px; font-size: 13px; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(voucherDetails.passengers || "-")}</td>
              </tr>
            </table>

            <table class="metadata-card" width="100%" style="width: 100%; border-collapse: collapse; border: 1px solid #cfd6de; margin-bottom: 18px;">
              <tr>
                <td class="label-cell" style="background-color: #f2f4f7; font-weight: 700; color: #1f2937; width: 32%; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; font-family: 'Outfit', sans-serif;">Guest Details</td>
                <td class="value-cell" style="background-color: #ffffff; color: #0f172a; font-weight: 600; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(voucherDetails.name || voucherDetails.guestName || "-")}</td>
              </tr>
              <tr>
                <td class="label-cell" style="background-color: #f2f4f7; font-weight: 700; color: #1f2937; width: 32%; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; font-family: 'Outfit', sans-serif;">Pax Details</td>
                <td class="value-cell" style="background-color: #ffffff; color: #0f172a; font-weight: 600; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #d6dde7; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(passengerBreakup)}</td>
              </tr>
              <tr>
                <td class="label-cell" style="background-color: #f2f4f7; font-weight: 700; color: #1f2937; width: 32%; padding: 12px 14px; font-size: 13px; border-right: 1px solid #d6dde7; font-family: 'Outfit', sans-serif;">Travel Date</td>
                <td class="value-cell" style="background-color: #ffffff; color: #0f172a; font-weight: 600; padding: 12px 14px; font-size: 13px; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">${escapeHtml(formatTravelDate(resolvedTravelDate))}</td>
              </tr>
            </table>

            <div class="section-heading" style="margin: 24px 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; color: #ffffff; background: linear-gradient(135deg, #020617, #0f172a, #d95508); padding: 10px 14px; font-family: 'Outfit', sans-serif; border-bottom: 2px solid #101b31;">
              Service Details
            </div>
            
            <table class="services-table-card" width="100%" style="width: 100%; border-collapse: collapse; border: 1px solid #cfd6de;">
              <thead>
                <tr style="background-color: #f2f4f7;">
                  <th width="22%" style="background-color: #f2f4f7; border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1f2937; text-align: left; letter-spacing: 0.8px; font-family: 'Outfit', sans-serif;">Type</th>
                  <th width="53%" style="background-color: #f2f4f7; border-bottom: 1px solid #d6dde7; border-right: 1px solid #d6dde7; padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1f2937; text-align: left; letter-spacing: 0.8px; font-family: 'Outfit', sans-serif;">Service Description</th>
                  <th width="25%" style="background-color: #f2f4f7; border-bottom: 1px solid #d6dde7; padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1f2937; text-align: right; letter-spacing: 0.8px; font-family: 'Outfit', sans-serif;">DMC Confirmation</th>
                </tr>
              </thead>
              <tbody>
                ${serviceRowsHtml || '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:18px;font-family: \'Plus Jakarta Sans\', Arial, sans-serif;">No services available</td></tr>'}
              </tbody>
            </table>

            <div class="generated-note" style="text-align: center; font-size: 11px; color: #64748b; margin: 24px 0 0; font-weight: 500; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
              This is a computer generated document. No signature/stamp required.
            </div>
          </div>

          ${voucherFooterSrc ? `
            <div style="width:100%; margin-top:16px; text-align:center;">
              <img src="${voucherFooterSrc}" alt="Footer Banner" style="width:100%; max-width:100%; height:auto; display:block;" />
            </div>
          ` : `
            <div class="brand-footer" style="background: linear-gradient(135deg, #020617, #0f172a, #d95508); padding: 16px 24px; border-top: 4px solid #d95508; color: #ffffff; font-size: 12px; text-align: center; line-height: 1.8; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
              <div class="footer-info" style="font-weight: 600; margin-bottom: 4px;">
                <span style="color: #cbd5e1;">Phone: ${escapeHtml(voucherDetails.agencyPhone || '+91 8851346665')} | Email: ${escapeHtml(voucherDetails.agencyEmail || 'ops@holidaycircuit.com')}</span>
              </div>
              <div class="footer-address" style="color: #94a3b8; font-size: 11px; font-weight: 500;">
                ${escapeHtml(voucherDetails.agencyAddress || '2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058')}
              </div>
            </div>
          `}
        </div>
      </body>
    </html>
  `;
};




const normalizeInvoiceServiceType = (value = "") =>
  String(value || "").trim().toLowerCase();

const formatTripDurationLabel = (trip = {}) => {
  const start = trip?.startDate ? new Date(trip.startDate) : null;
  const end = trip?.endDate ? new Date(trip.endDate) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const totalNights = Math.max(0, totalDays - 1);
  return `${totalNights} Nights / ${totalDays} Days`;
};

const formatTravelerSummaryLabel = (trip = {}) => {
  const adults = Number(trip?.numberOfAdults || 0);
  const children = Number(trip?.numberOfChildren || 0);
  const parts = [];

  if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);

  return parts.join(", ") || "-";
};

const formatTravelerCompactLabel = (trip = {}) => {
  const adults = Number(trip?.numberOfAdults || 0);
  const children = Number(trip?.numberOfChildren || 0);
  const parts = [];

  if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);

  return parts.join(" + ") || "-";
};

const formatRangeLabel = (startDate, endDate) =>
  `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;

const inferMealPlan = (item = {}) => {
  const notes = String(item?.notes || "").toLowerCase();
  if (notes.includes("breakfast") || notes.includes("(cp)") || notes.includes(" cp")) return "Breakfast (CP)";
  if (notes.includes("map")) return "Breakfast & Dinner (MAP)";
  if (notes.includes("ap")) return "All Meals (AP)";
  return "As per itinerary";
};

const inferRoomType = (item = {}, trip = {}) => {
  const roomCount = Number(item?.rooms || 0);
  const pax = Number(item?.pax || 0) || Number(trip?.numberOfAdults || 0) + Number(trip?.numberOfChildren || 0);
  if (roomCount > 0 && pax > 0) {
    return `${roomCount} Room${roomCount > 1 ? "s" : ""} - ${pax} Pax`;
  }
  if (roomCount > 0) return `${roomCount} Room${roomCount > 1 ? "s" : ""}`;
  if (pax > 0) return `${pax} Pax`;
  return "As per plan";
};

const buildInvoiceDayLabel = (dateValue, index) => {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return `Day ${index + 1}`;
  }

  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const day = date.toLocaleDateString("en-GB", { day: "2-digit" });
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `Day ${index + 1} - ${weekday} ${day} ${month}`;
};

const TRANSPORT_USAGE_LABELS = Object.freeze({
  "one-way-airport-transfer": "One Way / Airport Transfer",
  "inter-hotel-transfer": "Inter Hotel Transfer",
  "full-day": "Full Day",
  "half-day": "Half Day",
  "point-to-point": "One Way / Airport Transfer",
  "round-trip": "Two Way",
});

const TRANSPORT_USAGE_LIMIT_LABELS = Object.freeze({
  "full-day": "80 km / 8 hours",
  "full-day-80-km": "80 km / 8 hours",
  "full-day-8-hours": "80 km / 8 hours",
  "half-day": "40 km / 4 hours",
  "half-day-40-km": "40 km / 4 hours",
  "half-day-4-hours": "40 km / 4 hours",
});

const normalizeTransportUsageOptionKeyForQuote = (value = "") => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return "";
  if (normalizedValue.includes("inter hotel") || normalizedValue.includes("inter-hotel")) return "inter-hotel-transfer";
  if (normalizedValue.includes("airport") || normalizedValue.includes("one way") || normalizedValue.includes("one-way")) return "one-way-airport-transfer";
  if (normalizedValue.includes("full")) return "full-day";
  if (normalizedValue.includes("half")) return "half-day";
  if (normalizedValue.includes("round") || normalizedValue.includes("two way")) return "round-trip";
  if (normalizedValue.includes("point")) return "point-to-point";
  return normalizedValue;
};

const getTransportUsageDisplayLabelForQuote = (service = {}) => {
  const key = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );

  return (
    service?.transportUsageLabel ||
    TRANSPORT_USAGE_LABELS[key] ||
    String(service?.usageType || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

const getTransportLimitLabelForQuote = (service = {}) => {
  const optionKey = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );
  const limitKeys = String(service?.transportUsageLimitOptionKey || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const explicitLimitLabel = limitKeys
    .map((key) => TRANSPORT_USAGE_LIMIT_LABELS[key])
    .filter(Boolean)[0];

  return explicitLimitLabel || TRANSPORT_USAGE_LIMIT_LABELS[optionKey] || "";
};

const buildServiceQuantityLabel = (service = {}, fallbackPax = 0) => {
  const normalizedType = String(service?.type || "").trim().toLowerCase();
  const details = [];

  if (normalizedType === "hotel") {
    const hotelPax = Number(fallbackPax || 0) || Number(service?.pax || 0);
    if (Number(service?.nights || 0) > 0) details.push(`${service.nights}N`);
    if (Number(service?.rooms || 0) > 0) details.push(`${service.rooms} Room${Number(service.rooms) > 1 ? "s" : ""}`);
    if (hotelPax > 0) details.push(`${hotelPax} Pax`);
    return details.join(" | ");
  }

  if (normalizedType === "transfer" || normalizedType === "car" || normalizedType === "transport") {
    const usageLabel = getTransportUsageDisplayLabelForQuote(service);
    const limitLabel = getTransportLimitLabelForQuote(service);
    if (usageLabel) details.push(usageLabel);
    if (limitLabel) details.push(limitLabel);
    if (Number(service?.passengerCapacity || 0) > 0) {
      details.push(`${service.passengerCapacity} Pax`);
    } else if (Number(service?.pax || 0) > 0) {
      details.push(`${service.pax} Pax`);
    }
    if (service?.vehicleType) details.push(service.vehicleType);
    return details.join(" | ");
  }

  if (Number(service?.days || 0) > 0) details.push(`${service.days}D`);
  if (Number(service?.pax || 0) > 0) details.push(`${service.pax} Pax`);
  if (service?.vehicleType) details.push(service.vehicleType);

  return details.join(" | ");
};

const buildTransportQuotationNotes = (service = {}) => {
  const optionKey = normalizeTransportUsageOptionKeyForQuote(
    service?.transportUsageOptionKey ||
    service?.transportUsageLabel ||
    service?.usageType,
  );

  if (!["full-day", "half-day"].includes(optionKey)) return [];

  const usageLabel = getTransportUsageDisplayLabelForQuote(service);
  const limitLabel = getTransportLimitLabelForQuote(service);
  const extraKmRate = Number(service?.fullDayExtraPerKmRate || service?.halfDayExtraPerKmRate || service?.extraPerKmRate || 0);
  const notes = [];

  if (extraKmRate > 0) {
    notes.push(`Extra km rate: \u20B9 ${extraKmRate.toLocaleString("en-IN")}/km.`);
  }

  if (limitLabel) {
    notes.push(`Note: ${usageLabel} limit selected as ${limitLabel}. Extra km will attract extra charges where applicable.`);
  }

  return notes;
};

export const buildFinalInvoiceTemplate = (invoiceDetails = {}) => {
  const currency = invoiceDetails.currency || "INR";
  const trip = invoiceDetails.tripSnapshot || {};
  const pricing = invoiceDetails.pricingSnapshot || {};
  const agentName = escapeHtml(invoiceDetails.agentName || "Guest");
  const invoiceNumber = escapeHtml(invoiceDetails.invoiceNumber || "-");
  const destination = escapeHtml(trip.destination || invoiceDetails.destination || "-");
  const tripId = escapeHtml(trip.queryId || invoiceDetails.invoiceNumber || "-");
  const invoiceDate = formatDateLabel(invoiceDetails.invoiceDate || new Date());
  const travelerSummary = escapeHtml(formatTravelerSummaryLabel(trip));
  const travelerCompact = escapeHtml(formatTravelerCompactLabel(trip));
  const durationLabel = escapeHtml(formatTripDurationLabel(trip));
  const travelDateRange = escapeHtml(formatRangeLabel(trip.startDate, trip.endDate));
  const lineItems = Array.isArray(invoiceDetails.lineItems) ? invoiceDetails.lineItems : [];
  const preparedByName = escapeHtml(invoiceDetails.sentByName || "Holiday Circuit");
  const preparedByEmail = escapeHtml(MAIL_REPLY_TO_ADDRESS || "support@holidaycircuit.com");
  const totalAmount = pricing.grandTotal || invoiceDetails.totalAmount || 0;
  const opsMarkupAmount = Number(pricing.opsMarkupAmount || 0);
  const serviceChargeAmount = Number(pricing.serviceCharge || 0);
  const handlingFeeAmount = Number(pricing.handlingFee || 0);
  const gstAmount = Number(pricing.gstAmount || 0);
  const gstPercent = Number(pricing.gstPercent || 0);
  const fallbackPax = Number(trip.numberOfAdults || 0) + Number(trip.numberOfChildren || 0);

  const sectionHeading = (label, colspan = 1) => `
    <tr>
      <td colspan="${colspan}" style="background:#14213d;color:#ffffff;padding:8px 10px;border:1px solid #0f172a;font-size:11pt;font-weight:700;letter-spacing:0.02em;">
        ${label}
      </td>
    </tr>
  `;

  const detailCell = (label, value, width = "25%") => `
    <td style="border:1px solid #d1d5db;padding:10px 12px;vertical-align:top;width:${width};">
      <p style="margin:0;font-size:8.5pt;font-weight:700;color:#6b7280;letter-spacing:0.04em;">${label}</p>
      <p style="margin:6px 0 0;font-size:10.5pt;font-weight:700;color:#111827;">${value}</p>
    </td>
  `;

  const buildListItems = (items = []) =>
    items
      .map(
        (item) => `
          <li style="margin:0 0 6px;">${item}</li>
        `,
      )
      .join("");

  const getServiceInfo = (item, index) => {
    const quoteService = invoiceDetails.quotation?.services?.[index] || 
                         invoiceDetails.quotation?.services?.find(s => s.title === item.title && s.serviceDate && new Date(s.serviceDate).getTime() === new Date(item.serviceDate).getTime());

    if (quoteService) {
      return {
        title: quoteService.title || item.title || "Service",
        description: quoteService.description || "",
        quantityLabel: quoteService.quantityLabel || buildServiceQuantityLabel(quoteService, fallbackPax) || "-",
        serviceDate: quoteService.serviceDate || item.serviceDate,
        location: quoteService.location || item.location || "-",
        typeLabel: normalizeServiceTypeLabel(quoteService.typeLabel || quoteService.type || item.serviceType)
      };
    }

    const notesParts = String(item.notes || "").split(" | ");
    let qtyVal = "-";
    const descParts = [];
    const extraNotes = [];

    notesParts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.startsWith("QTY:")) {
        qtyVal = trimmed.replace(/^QTY:\s*/i, "");
      } else if (/^(Extra km rate:|Note:)/i.test(trimmed)) {
        extraNotes.push(trimmed);
      } else {
        descParts.push(trimmed);
      }
    });

    if (qtyVal === "-" && normalizeInvoiceServiceType(item.serviceType) === "hotel") {
      const parts = [];
      if (item.nights) parts.push(`${item.nights}N`);
      if (item.rooms) parts.push(`${item.rooms} Room${item.rooms > 1 ? "s" : ""}`);
      if (item.pax) parts.push(`${item.pax} Pax`);
      qtyVal = parts.join(" | ") || "-";
    }

    const fullDesc = [descParts.join(" | "), ...extraNotes].filter(Boolean).join("\n");

    return {
      title: item.title || "Service",
      description: fullDesc,
      quantityLabel: qtyVal,
      serviceDate: item.serviceDate,
      location: item.location || "-",
      typeLabel: normalizeServiceTypeLabel(item.serviceType)
    };
  };

  const mappedAccommodation = [];
  const mappedSpecial = [];
  const mappedTransport = [];

  lineItems.forEach((item, index) => {
    const info = getServiceInfo(item, index);
    const type = normalizeInvoiceServiceType(item?.serviceType);
    const titleLower = String(item?.title || "").toLowerCase();

    if (type === "hotel") {
      mappedAccommodation.push({ ...item.toObject ? item.toObject() : item, ...info });
    } else if (titleLower.includes("visa") || titleLower.includes("insurance") || type.includes("visa") || type.includes("insurance")) {
      mappedSpecial.push(info);
    } else {
      mappedTransport.push(info);
    }
  });

  const accommodationRows = mappedAccommodation.length
    ? mappedAccommodation.map((item) => `
        <tr>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(`${Number(item?.nights || 0) || "-"} Night${Number(item?.nights || 0) === 1 ? "" : "s"}`)}</td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;font-weight:700;">${escapeHtml(item?.location || "-")}</td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>${escapeHtml(item?.title || "-")}</strong></td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;text-align:center;">${escapeHtml(inferMealPlan(item))}</td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(inferRoomType(item, trip))}</td>
        </tr>
      `).join("")
    : `
      <tr>
        <td colspan="5" style="border:1px solid #d1d5db;padding:10px;text-align:center;font-size:10pt;color:#6b7280;">Accommodation details will appear here.</td>
      </tr>
    `;

  const transportRows = mappedTransport.length
    ? mappedTransport.map((item, idx) => {
        const descriptionHtml = buildServiceDescriptionHtml(item.description);
        return `
          <tr>
            <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;width:15%;">${escapeHtml(buildInvoiceDayLabel(item?.serviceDate, idx))}</td>
            <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;width:55%;">
              <div style="font-weight:700;color:#10213a;">${escapeHtml(item.title)}</div>
              ${descriptionHtml}
            </td>
            <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;width:30%;font-weight:600;">${escapeHtml(item.quantityLabel)}</td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td colspan="3" style="border:1px solid #d1d5db;padding:10px;text-align:center;font-size:10pt;color:#6b7280;">Transportation and activity details will appear here.</td>
      </tr>
    `;

  const specialRows = mappedSpecial.length
    ? mappedSpecial.map((item, idx) => `
        <tr>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(buildInvoiceDayLabel(item?.serviceDate, idx))}</td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>${escapeHtml(item?.title || "-")}</strong></td>
        </tr>
      `).join("")
    : `
      <tr>
        <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">All Days</td>
        <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>As per confirmed itinerary</strong></td>
      </tr>
    `;

  const pricingRows = lineItems.length
    ? lineItems.map((item) => `
        <tr>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(item?.title || "-")}</td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(formatCurrency(item?.unitPrice || 0, item?.currency || currency))}</td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>${escapeHtml(formatCurrency(item?.total || 0, item?.currency || currency))}</strong></td>
        </tr>
      `).join("")
    : `
      <tr>
        <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">Confirmed Booking Amount</td>
        <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">-</td>
        <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>${escapeHtml(formatCurrency(totalAmount, pricing.currency || currency))}</strong></td>
      </tr>
    `;

  const chargeRows = `
    <tr>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">Ops Markup</td>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">-</td>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>${escapeHtml(formatCurrency(opsMarkupAmount, pricing.currency || currency))}</strong></td>
    </tr>
    <tr>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">Service Charges</td>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">-</td>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>${escapeHtml(formatCurrency(serviceChargeAmount, pricing.currency || currency))}</strong></td>
    </tr>
    <tr>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">Handling Fees</td>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">-</td>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>${escapeHtml(formatCurrency(handlingFeeAmount, pricing.currency || currency))}</strong></td>
    </tr>
    <tr>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">GST${gstPercent ? ` (${escapeHtml(gstPercent)}%)` : ""}</td>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">-</td>
      <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;"><strong>${escapeHtml(formatCurrency(gstAmount, pricing.currency || currency))}</strong></td>
    </tr>
  `;

  const finalTotal = escapeHtml(formatCurrency(totalAmount, pricing.currency || currency));
  const rawInclusions = Array.isArray(invoiceDetails.inclusions) && invoiceDetails.inclusions.length > 0
    ? invoiceDetails.inclusions
    : [
        "Stay as mentioned or similar category hotels.",
        "Meals as mentioned in the itinerary.",
        "Airport or point-to-point transfers as confirmed.",
        "Sightseeing and entrance tickets as per confirmed services.",
        "Applicable taxes calculated on the date of issue.",
        "Visa and insurance only if specifically mentioned above.",
      ];

  const rawExclusions = Array.isArray(invoiceDetails.exclusions) && invoiceDetails.exclusions.length > 0
    ? invoiceDetails.exclusions
    : [
        "International or domestic airfare unless specified.",
        "Early check-in, late check-out, and hotel deposits.",
        "Personal expenses such as laundry, room service, and tips.",
        "Any increase in tax, surcharge, or rate of exchange.",
        "Travel insurance where not explicitly included.",
        "Any service not listed in the invoice inclusions.",
      ];

  const inclusionsList = buildListItems(rawInclusions);
  const exclusionsList = buildListItems(rawExclusions);
  const termsList = buildListItems([
    "A non-refundable deposit is required to confirm the booking.",
    "Full payment must be cleared before departure as per booking deadline.",
    "Rates are subject to availability and ROE changes until complete payment.",
    "Cancellation charges will apply as per airline, hotel, and supplier policies.",
    "Standard check-in and check-out timings of hotels will apply.",
    "Passport, visa, and travel documentation remain the traveler's responsibility.",
    "Travel insurance is recommended for all travelers.",
    "By confirming the booking, you accept the quoted inclusions and terms.",
  ]);

  return `
    <div style="box-sizing:border-box;font-family:Verdana,Arial,sans-serif;font-size:10pt;line-height:1.45;color:#111827;background:#ffffff;padding:14px;">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tbody>
          <tr>
            <td style="vertical-align:top;text-align:left;padding-right:18px;">
              <p style="margin:0;font-size:22pt;font-weight:700;color:#111827;">HOLIDAY CIRCUIT</p>
              <p style="margin:4px 0 0;font-size:10pt;color:#4b5563;"><em>Your Trusted Travel Partner</em></p>
              <p style="margin:8px 0 0;font-size:9.5pt;color:#374151;">ops@leelatravels.com | +91 8851346665</p>
              <p style="margin:4px 0 0;font-size:9.5pt;color:#374151;">2nd Floor, 632, Block B1, Janakpuri, New Delhi - 110058</p>
            </td>
            <td style="vertical-align:top;text-align:right;min-width:250px;">
              <p style="margin:0;font-size:18pt;font-weight:700;color:#111827;letter-spacing:0.03em;">FINAL INVOICE</p>
              <p style="margin:10px 0 0;font-size:10pt;color:#374151;"><strong>Trip ID:</strong> ${tripId}</p>
              <p style="margin:4px 0 0;font-size:10pt;color:#374151;"><strong>Date:</strong> ${escapeHtml(invoiceDate)}</p>
              <p style="margin:4px 0 0;font-size:10pt;color:#374151;"><strong>Invoice No:</strong> ${invoiceNumber}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <p style="margin:0 0 6px;font-size:10pt;"><strong>Dear ${agentName},</strong></p>
      <p style="margin:0 0 14px;font-size:10pt;line-height:1.6;">
        Greetings from Holiday Circuit. Please find below the final travel invoice for your ${destination} booking, prepared in the same document style as the approved travel file.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:14px;">
        <tbody>
          ${sectionHeading("CLIENT DETAILS", 2)}
          <tr>
            <td style="border:1px solid #d1d5db;padding:12px;vertical-align:top;width:50%;">
              <p style="margin:0;font-size:10pt;font-weight:700;color:#374151;">CLIENT</p>
              <p style="margin:8px 0 0;font-size:10pt;"><strong>${agentName}</strong></p>
              <p style="margin:4px 0 0;font-size:10pt;">${travelerSummary}</p>
            </td>
            <td style="border:1px solid #d1d5db;padding:12px;vertical-align:top;width:50%;">
              <p style="margin:0;font-size:10pt;font-weight:700;color:#374151;">PREPARED BY</p>
              <p style="margin:8px 0 0;font-size:10pt;"><strong>${preparedByName}</strong></p>
              <p style="margin:4px 0 0;font-size:10pt;">${preparedByEmail}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tbody>
          ${sectionHeading("TRIP OVERVIEW", 4)}
          <tr>
            ${detailCell("DESTINATION", destination)}
            ${detailCell("DURATION", durationLabel)}
            ${detailCell("TRAVEL DATE", travelDateRange)}
            ${detailCell("TRAVELERS", travelerCompact)}
          </tr>
        </tbody>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <thead>
          ${sectionHeading("ACCOMMODATION", 5)}
          <tr style="background:#e8eef9;">
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">NIGHTS</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">CITY</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">HOTEL</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:10pt;">MEAL PLAN</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">ROOM TYPE</th>
          </tr>
        </thead>
        <tbody>${accommodationRows}</tbody>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <thead>
          ${sectionHeading("TRANSPORTATION & ACTIVITIES", 3)}
          <tr style="background:#e8eef9;">
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;width:15%;">DAY</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;width:55%;">SERVICE</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;width:30%;">QTY</th>
          </tr>
        </thead>
        <tbody>${transportRows}</tbody>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <thead>
          ${sectionHeading("SPECIAL INCLUSIONS", 2)}
          <tr style="background:#e8eef9;">
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">DAY</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">SERVICE</th>
          </tr>
        </thead>
        <tbody>${specialRows}</tbody>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <thead>
          ${sectionHeading("TOUR PRICING", 3)}
          <tr style="background:#e8eef9;">
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">PRICING BREAKDOWN</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">PER PERSON</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${pricingRows}
          ${chargeRows}
          <tr>
            <td style="border:1px solid #d1d5db;padding:9px 10px;font-size:10pt;"><strong>GRAND TOTAL${Number(pricing.tcsPercent || 0) ? ` (incl. TCS @ ${pricing.tcsPercent}%)` : ""}</strong></td>
            <td style="border:1px solid #d1d5db;padding:9px 10px;font-size:10pt;"></td>
            <td style="border:1px solid #d1d5db;padding:9px 10px;font-size:10pt;"><strong>${finalTotal}</strong></td>
          </tr>
        </tbody>
      </table>
      <p style="margin:0 0 18px;font-size:9pt;color:#4b5563;"><em>* Prices are calculated as per the current ROE. Any amendment or supplier revision may change the final billing.</em></p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <tbody>
          ${sectionHeading("INCLUSIONS & EXCLUSIONS", 2)}
          <tr>
            <td style="border:1px solid #d1d5db;padding:12px;vertical-align:top;width:50%;">
              <p style="margin:0 0 8px;font-size:10pt;font-weight:700;">INCLUSIONS</p>
              <ul style="margin:0;padding-left:18px;line-height:1.55;">
                ${inclusionsList}
              </ul>
            </td>
            <td style="border:1px solid #d1d5db;padding:12px;vertical-align:top;width:50%;">
              <p style="margin:0 0 8px;font-size:10pt;font-weight:700;">EXCLUSIONS</p>
              <ul style="margin:0;padding-left:18px;line-height:1.55;">
                ${exclusionsList}
              </ul>
            </td>
          </tr>
        </tbody>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <tbody>
          ${sectionHeading("TERMS & CONDITIONS")}
          <tr>
            <td style="border:1px solid #d1d5db;padding:12px 14px;vertical-align:top;">
              <ul style="margin:0;padding-left:18px;line-height:1.6;">
                ${termsList}
              </ul>
            </td>
          </tr>
        </tbody>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <tbody>
          ${sectionHeading("PAYMENT INFORMATION")}
          <tr>
            <td style="border:1px solid #d1d5db;padding:12px;vertical-align:top;">
              <p style="margin:0 0 6px;font-size:10pt;font-weight:700;">Accepted Modes</p>
              <p style="margin:0 0 10px;font-size:10pt;">UPI | Bank Transfer | Credit Card | Cash (Delhi only) | Cheque subject to clearance</p>
              <p style="margin:0 0 6px;font-size:10pt;font-weight:700;">Billing Amount</p>
              <p style="margin:0 0 10px;font-size:10pt;">${finalTotal}</p>
              <p style="margin:0 0 6px;font-size:10pt;font-weight:700;">For Queries &amp; Bookings</p>
              <p style="margin:0;font-size:10pt;">Holiday Circuit | 2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058</p>
              <p style="margin:4px 0 0;font-size:10pt;">Email: ops@leelatravels.com | Phone: +91 8851346665, +91 9971706003</p>
            </td>
          </tr>
        </tbody>
      </table>

      <p style="margin:0 0 8px;font-size:10pt;"><em>Thank you for choosing Holiday Circuit. We look forward to making your journey smooth and memorable.</em></p>
      <p style="margin:0;font-size:10pt;">This invoice is system generated and shared by the finance team for the confirmed booking amount.</p>
    </div>
  `;
};

const processInlineCidImages = (rawHtml = "") => {
  const inlineAttachments = [];
  let cidCounter = 0;

  const cleanHtml = String(rawHtml || "").replace(
    /src=["'](data:(image\/[a-zA-Z0-9.+-]+);base64,([^"']+))["']/gi,
    (match, dataUrl, mimeType, base64Data) => {
      cidCounter++;
      const cid = `inline_img_${cidCounter}_${Date.now()}`;
      const ext = mimeType.split("/")[1] || "png";
      const buffer = Buffer.from(base64Data, "base64");

      inlineAttachments.push({
        filename: `inline_image_${cidCounter}.${ext}`,
        content: buffer,
        cid: cid,
      });

      return `src="cid:${cid}"`;
    }
  );

  return { html: cleanHtml, inlineAttachments };
};

export const sendEmailQuote = async (email, quoteDetails) => {
  const transporter = createTransporter();
  const opsQuoteDetails = {
    ...quoteDetails,
    isOpsQuotation: true,
    agentBrandingName: QUOTATION_BRAND.name,
    agentLogo: QUOTATION_BRAND.logoUrl,
    agentCompanyAddress: QUOTATION_BRAND.address,
    agentPhone: QUOTATION_BRAND.phone,
    agentEmail: QUOTATION_BRAND.email,
    recipientName: quoteDetails?.recipientName || quoteDetails?.name || "Customer",
    quotationNumber: quoteDetails?.quotationNumber || "",
    queryId: quoteDetails?.queryId || "",
    destination: quoteDetails?.destination || "",
    travelDates: quoteDetails?.travelDates || "",
    durationLabel: quoteDetails?.durationLabel || (quoteDetails?.days ? `${quoteDetails.days} Days` : "-"),
    travelerSummary: quoteDetails?.travelerSummary || "",
    validTill: quoteDetails?.validTill || "",
    totalAmount: Number(quoteDetails?.totalAmount ?? quoteDetails?.price ?? 0),
    currency: quoteDetails?.currency || "INR",
    inclusions: quoteDetails?.inclusions || [],
    exclusions: quoteDetails?.exclusions || [],
    additionalNotes: quoteDetails?.additionalNotes || [],
    dayWiseItinerary: quoteDetails?.dayWiseItinerary || [],
    sellerBankDetails: quoteDetails?.sellerBankDetails || [],
    services: Array.isArray(quoteDetails?.services) ? quoteDetails.services : [],
  };

  const rawHtmlTemplate = buildAgentClientQuotationTemplate(opsQuoteDetails);

  const { html: htmlTemplate, inlineAttachments } = processInlineCidImages(rawHtmlTemplate);

  const text = buildAgentClientQuotationText(opsQuoteDetails);

  let attachments = [...inlineAttachments];
  try {
    const pdfResult = await generatePDF(opsQuoteDetails);
    if (pdfResult && pdfResult.filePath) {
      attachments.push({
        filename: pdfResult.fileName || `Quotation_${quoteDetails.quotationNumber || "Details"}.pdf`,
        path: pdfResult.filePath,
      });
    }
  } catch (pdfError) {
    console.error("Failed to generate PDF for email attachment:", pdfError);
  }

  const info = await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    subject: `Your Quotation - ${quoteDetails.destination}`,
    replyTo: MAIL_REPLY_TO_ADDRESS,
    html: htmlTemplate,
    text,
    attachments,
  });

  console.log("EMAIL SENT:", info.response);
  return { status: "sent", email };
};



export const sendAgentClientQuotationMail = async (email, quoteDetails = {}) => {
  const transporter = createTransporter();
  const rawHtml = buildAgentClientQuotationTemplate(quoteDetails);
  const text = buildAgentClientQuotationText(quoteDetails);

  const { html, inlineAttachments } = processInlineCidImages(rawHtml);

  let attachments = [...inlineAttachments];
  try {
    const pdfResult = await generatePDF(quoteDetails);
    if (pdfResult && pdfResult.filePath) {
      attachments.push({
        filename: pdfResult.fileName || `Quotation_${quoteDetails.quotationNumber || "Details"}.pdf`,
        path: pdfResult.filePath,
      });
    }
  } catch (pdfError) {
    console.error("Failed to generate PDF for agent quotation email attachment:", pdfError);
  }

  const info = await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    replyTo: MAIL_REPLY_TO_ADDRESS,
    subject: `Your Quotation - ${quoteDetails.destination || quoteDetails.quotationNumber || "Holiday Circuit"}`,
    html,
    text,
    attachments,
  });

  console.log("CLIENT QUOTATION EMAIL SENT:", {
    response: info.response,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    pending: info.pending,
    recipient: email,
  });

  return {
    status: "sent",
    email,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
};



export const sendEmailVoucher = async (
  email,
  voucherDetails,
  branding = "with",
  supportingAttachments = [],
) => {
  const transporter = createTransporter();
  const html = buildVoucherTemplate(voucherDetails, branding);
  const pdfResult = await generateVoucherPdf(voucherDetails);
  const attachments = [
    {
      filename: pdfResult.fileName,
      path: pdfResult.absoluteFilePath,
    },
    ...supportingAttachments,
  ];

  const info = await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    subject: `Your Travel Voucher - ${voucherDetails.voucherNumber || voucherDetails.destination || "Holiday Circuit"}`,
    html,
    attachments,
  });

  console.log("VOUCHER EMAIL SENT:", info.response);
  return { status: "sent", email };
};




export const sendEmailFinalInvoice = async (email, invoiceDetails) => {
  const transporter = createTransporter();
  const html = buildFinalInvoiceTemplate(invoiceDetails);
  const safeInvoiceNumber = String(invoiceDetails.invoiceNumber || "Final_Invoice")
    .replace(/[^a-z0-9_-]+/gi, "_");
  const attachmentHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${html}</body></html>`;

  const info = await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    subject: `Final Invoice - ${invoiceDetails.invoiceNumber || invoiceDetails.destination || "Holiday Circuit"}`,
    html,
    attachments: [
      {
        filename: `Final_Invoice_${safeInvoiceNumber}.doc`,
        content: attachmentHtml,
        contentType: "application/msword",
      },
    ],
  });

  console.log("FINAL INVOICE EMAIL SENT:", info.response);
  return {
    status: "sent",
    email,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
};

export const sendDmcPayoutReceiptMail = async (email, receiptDetails = {}) => {
  const transporter = createTransporter();
  const safeInvoiceNumber = String(receiptDetails.invoiceNumber || receiptDetails.queryCode || "Payout_Receipt")
    .replace(/[^a-zA-Z0-9-_]/g, "");
  const safeDmcName = escapeHtml(receiptDetails.dmcName || "DMC Partner");
  const safeAmount = escapeHtml(formatCurrency(receiptDetails.payoutAmount || 0, receiptDetails.currency || "INR"));
  const safePayoutDate = escapeHtml(formatDateLabel(receiptDetails.payoutDate));
  const safeReference = escapeHtml(receiptDetails.payoutReference || "-");
  const safeQueryCode = escapeHtml(receiptDetails.queryCode || "-");
  const safeDestination = escapeHtml(receiptDetails.destination || "-");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#f8fafc;border:1px solid #dbeafe;border-radius:24px;overflow:hidden;">
      <div style="padding:28px 32px;background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);color:#ffffff;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.86;">Holiday Circuit</p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;">Payment Receipt Shared</h1>
        <p style="margin:10px 0 0;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.84);">
          Finance has completed the payout for your internal invoice and attached the payment receipt below.
        </p>
      </div>
      <div style="padding:28px 32px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#334155;">Hello ${safeDmcName},</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
          The payment against your submitted internal invoice has been processed successfully. Please find the payout summary below and refer to the attached PDF for the formal receipt copy.
        </p>
        <div style="border:1px solid #cbd5e1;border-radius:18px;background:#ffffff;overflow:hidden;">
          <div style="padding:16px 18px;background:#ecfeff;border-bottom:1px solid #cbd5e1;">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#0f766e;">Payout Snapshot</p>
          </div>
          <div style="padding:16px 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Invoice Number</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${escapeHtml(receiptDetails.invoiceNumber || "-")}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Trip ID</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safeQueryCode}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Destination</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safeDestination}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Payment Date</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safePayoutDate}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Reference ID</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safeReference}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Amount Paid</td><td style="padding:8px 0;font-size:14px;font-weight:800;color:#0f766e;text-align:right;">${safeAmount}</td></tr>
            </table>
          </div>
        </div>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
          If you need any clarification regarding this payout, please reply to this email and our finance team will assist you.
        </p>
      </div>
      <div style="padding:18px 32px;background:#f1f5f9;border-top:1px solid #dbeafe;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#0f172a;">Holiday Circuit Finance Desk</p>
        <p style="margin:6px 0 0;font-size:12px;color:#64748b;">2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058</p>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Email: support@holidaycircuit.com | Phone: +91 8851346665, +91 9971706003</p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    replyTo: MAIL_REPLY_TO_ADDRESS,
    to: email,
    subject: `Payment Receipt - ${receiptDetails.invoiceNumber || receiptDetails.queryCode || "Holiday Circuit"}`,
    html,
    attachments: receiptDetails.attachmentPath
      ? [
        {
          filename: receiptDetails.attachmentName || `DMC_Payout_Receipt_${safeInvoiceNumber}.pdf`,
          path: receiptDetails.attachmentPath,
        },
      ]
      : [],
  });

  return {
    status: "sent",
    email,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
};

export const sendAgentPaymentReceiptMail = async (email, receiptDetails = {}) => {
  const transporter = createTransporter();
  const safeAgentName = escapeHtml(receiptDetails.agentName || "Agent Partner");
  const safeClientName = escapeHtml(receiptDetails.clientName || "Client");
  const safeQueryCode = escapeHtml(receiptDetails.queryCode || "-");
  const safeDestination = escapeHtml(receiptDetails.destination || "-");
  const safeAmount = escapeHtml(formatCurrency(receiptDetails.amountPaid || 0, "INR"));
  const safeCumulativeAmount = escapeHtml(formatCurrency(receiptDetails.cumulativePaid || receiptDetails.amountPaid || 0, "INR"));
  const safeRemainingAmount = escapeHtml(formatCurrency(receiptDetails.remainingAmount || 0, "INR"));
  const safePaymentDate = escapeHtml(formatDateLabel(receiptDetails.paymentDate));
  const safeReference = escapeHtml(receiptDetails.paymentReference || "-");
  const safeReceiptTitle = escapeHtml(receiptDetails.receiptTitle || "Payment Receipt");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#f8fafc;border:1px solid #dbeafe;border-radius:24px;overflow:hidden;">
      <div style="padding:28px 32px;background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);color:#ffffff;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.86;">Holiday Circuit</p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;">Payment Receipt Shared</h1>
        <p style="margin:10px 0 0;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.84);">
          Finance has verified your payment and attached the receipt copy below for your records.
        </p>
      </div>
      <div style="padding:28px 32px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#334155;">Hello ${safeAgentName},</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
          Your payment for booking <strong>${safeQueryCode}</strong> has been verified successfully. Please find the ${safeReceiptTitle.toLowerCase()} summary below and the attached PDF for the formal receipt.
        </p>
        <div style="border:1px solid #cbd5e1;border-radius:18px;background:#ffffff;overflow:hidden;">
          <div style="padding:16px 18px;background:#ecfeff;border-bottom:1px solid #cbd5e1;">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#0f766e;">Receipt Snapshot</p>
          </div>
          <div style="padding:16px 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Trip ID</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safeQueryCode}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Destination</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safeDestination}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Client</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safeClientName}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Payment Date</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safePaymentDate}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Reference ID</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safeReference}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Amount Paid</td><td style="padding:8px 0;font-size:14px;font-weight:800;color:#0f766e;text-align:right;">${safeAmount}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Received So Far</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">${safeCumulativeAmount}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Outstanding Balance</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#b45309;text-align:right;">${safeRemainingAmount}</td></tr>
            </table>
          </div>
        </div>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
          If you need any clarification regarding this payment confirmation, please reply to this email and our finance team will assist you.
        </p>
      </div>
      <div style="padding:18px 32px;background:#f1f5f9;border-top:1px solid #dbeafe;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#0f172a;">Holiday Circuit Finance Desk</p>
        <p style="margin:6px 0 0;font-size:12px;color:#64748b;">2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058</p>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Email: support@holidaycircuit.com | Phone: +91 8851346665, +91 9971706003</p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    replyTo: MAIL_REPLY_TO_ADDRESS,
    to: email,
    subject: `Payment Receipt - ${receiptDetails.queryCode || receiptDetails.invoiceNumber || "Holiday Circuit"}`,
    html,
    attachments: receiptDetails.attachmentPath
      ? [
        {
          filename: receiptDetails.attachmentName || "Agent_Payment_Receipt.pdf",
          path: receiptDetails.attachmentPath,
        },
      ]
      : [],
  });

  return {
    status: "sent",
    email,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
};



//------- Coupon Email Template -------------

const buildCouponEmailTemplate = (couponDetails = {}) => {
  const agentName = escapeHtml(couponDetails.agentName || "Partner");
  const code = escapeHtml(couponDetails.code || "-");
  const discount = escapeHtml(couponDetails.discount || "-");
  const description = escapeHtml(couponDetails.description || "Special savings from Holiday Circuit");
  const startDate = escapeHtml(couponDetails.startDate ? formatDateLabel(couponDetails.startDate) : "Immediately");
  const endDate = escapeHtml(couponDetails.endDate ? formatDateLabel(couponDetails.endDate) : "No end date");
  const usageLimit = couponDetails.usageLimit ? `${couponDetails.usageLimit}` : "Unlimited";

  return `
    <div style="margin:0;padding:32px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 50%,#60a5fa 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;">Holiday Circuit</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;">Your Coupon Is Ready</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hello ${agentName},</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">
            A discount coupon has been created for your account. You can use the details below while completing your next payment.
          </p>
          <div style="border:1px solid #dbeafe;background:#eff6ff;border-radius:20px;padding:18px 20px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;">Coupon Code</p>
            <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:0.08em;color:#1e3a8a;">${code}</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:20px;">
            <div style="border:1px solid #e2e8f0;border-radius:18px;padding:16px;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Discount</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${discount}</p>
            </div>
            <div style="border:1px solid #e2e8f0;border-radius:18px;padding:16px;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Usage Limit</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(usageLimit)}</p>
            </div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:18px;padding:18px 20px;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Description</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">${description}</p>
            <p style="margin:0 0 6px;font-size:14px;color:#0f172a;"><strong>Start Date:</strong> ${startDate}</p>
            <p style="margin:0;font-size:14px;color:#0f172a;"><strong>End Date:</strong> ${endDate}</p>
          </div>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
            If you need help using this coupon, reply to this email and our team will assist you.
          </p>
        </div>
      </div>
    </div>
  `;
};

//-------------------------------- Send Coupon Email Service ------------------------

export const sendCouponEmail = async (email, couponDetails = {}) => {
  const transporter = createTransporter();
  const html = buildCouponEmailTemplate(couponDetails);
  const text = [
    "Holiday Circuit - Coupon Details",
    "",
    `Coupon Code: ${couponDetails.code || "-"}`,
    `Discount: ${couponDetails.discount || "-"}`,
    `Description: ${couponDetails.description || "-"}`,
    `Start Date: ${couponDetails.startDate ? formatDateLabel(couponDetails.startDate) : "Immediately"}`,
    `End Date: ${couponDetails.endDate ? formatDateLabel(couponDetails.endDate) : "No end date"}`,
    `Usage Limit: ${couponDetails.usageLimit || "Unlimited"}`,
  ].join("\n");

  const info = await transporter.sendMail({
    from: MAIL_FROM_ADDRESS,
    to: email,
    subject: `Coupon Code ${couponDetails.code || ""} from Holiday Circuit`,
    html,
    text,
  });

  return {
    status: "sent",
    email,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
};