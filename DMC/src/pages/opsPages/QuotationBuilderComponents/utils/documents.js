import { pageShellVariants, sectionRevealVariants, sideStackVariants, rightCardVariants, INDIAN_DESTINATION_KEYWORDS, DEFAULT_EXCHANGE_RATES, CURRENCY_LABELS, DESTINATION_ALIAS_GROUPS, WHATSAPP_QUOTATION_BRAND, WHATSAPP_SECTION_DIVIDER, WHATSAPP_SUBSECTION_DIVIDER, DEFAULT_WHATSAPP_TERMS, SHOW_SELECTED_HISTORY_COMPARISON, SERVICE_TYPE_LABELS, CONTRACTED_RATE_FILTER_OPTIONS, HOTEL_ROOM_TYPE_OPTIONS, HOTEL_ROOM_CATEGORY_OPTIONS, HOTEL_BED_TYPE_OPTIONS, HOTEL_ROOM_TYPE_FIXED_PRICES, HOTEL_BED_TYPE_FIXED_PRICES, TRANSPORT_USAGE_OPTIONS, TRANSPORT_USAGE_LIMIT_OPTIONS, TRANSPORT_USAGE_FIXED_PRICES, TRANSPORT_USAGE_OPTION_LABELS } from './constants';
import { normalizeCurrencyCode, roundCurrencyAmount, roundExchangeRateValue, getCurrencyLabel, formatAmountValue, formatExchangeRateValue, formatCurrencyValue, getCurrentUserRole, formatShareDate, buildTravelerSummary, getQueryPassengerCount, buildShareServiceQuantityLabel, buildShareServiceLocationLabel, buildPlainTextQuotationSummary, sanitizeDynamicListItems, normalizeDateInputValue, addDaysToNormalizedDate, getOrdinalValue, formatItineraryDateLabel, buildItineraryDayLabel, sanitizeDayWiseItineraryItems, areDayWiseItineraryItemsEqual, reconcileDayWiseItineraryItems, copyTextToClipboard, normalizeComparisonDateValue, normalizeComparisonTextValue, normalizeComparisonCountValue, formatDateInput, addDaysToDate } from './formatters';
import { normalizeWhatsAppPhoneNumber, parseWhatsAppDate, formatWhatsAppDate, formatWhatsAppActivityDate, formatWhatsAppItineraryDate, addDaysForWhatsApp, getWhatsAppDateDiff, inferSharingLabel, buildWhatsAppTravelerSummary, buildWhatsAppNightLabel, buildWhatsAppHotelMeta, buildWhatsAppHotelsSection, buildWhatsAppTransportSection, buildWhatsAppInclusionsSection, buildWhatsAppExclusionsSection, buildWhatsAppSellerBankDetailsSection, buildWhatsAppTermsSection, buildWhatsAppDayWiseItinerary, buildWhatsAppQuotationMessage } from './whatsapp';
import { normalizeServiceFilterType, normalizeBedTypeValue, getBedTypeOptionLabel, formatHotelOptionLabel, buildHotelVariantGroupKey, getHotelVariantServices, buildSelectOptionsWithFallback, normalizeHotelOptionLookupKey, normalizeHotelRoomTypeLookupKey, normalizeTransportUsageValue, normalizeTransportUsageOptionKey, getTransportUsageOptionMeta, getTransportUsageOptionKey, getSelectedTransportUsageOptionKeys, getSelectedTransportUsageOptionLabels, getTransportUsageLimitOptionsForKeys, getDefaultTransportUsageLimitKeyValue, getSelectedTransportUsageLimitLabels, getTransportUsageLimitText, stripTransportUsageSuffix, getServiceSearchAliases, getServiceSearchText, normalizeDestinationMatchText, getDestinationMatchTerms, doesServiceMatchDestination, getServiceTypeLabel, getSelectedServiceIconTone, renderSelectedServiceSummaryIcon, getSelectedServiceIncludedItems, formatServiceDateLabel, getServiceCardDomId, getSelectedServiceSummaryDomId, isIndianDestination, getExchangeRateForCurrency, convertAmountToInr, calculateServiceOriginalTotal, buildServiceEditBaseline, getSelectedServiceQuotationEdits, serviceCardVariants, getHotelVariantOptions, getTransportVehicleOptions, getHotelBaseRateDisplayValue, formatRoomOccupancyLabel } from './serviceHelpers';
import { getFixedHotelRoomTypePrice, inferHotelRoomTypeValue, getFixedHotelBedTypePrice, getFixedTransportUsagePrice, getResolvedHotelBaseRate, normalizeDateOnlyString, isDateInRange, checkBlackoutMatch, resolveSmartSeasonAndBlackoutPrice, resolveHotelSmartRate, resolveTransportSmartRate, resolveActivitySmartRate, getTransportVehicleUsagePrices, resolveTransportVehicleSelection, getTransportUsageOptionDisplayPrice, getFixedHotelOptionDelta, applyFixedHotelOptionPricing, applyFixedTransportUsagePricing, applyTransportUsageOptionPricing, doesHotelVariantMatchField, getHotelVariantForOption, getHotelRoomTypeOptionRate, getAdjustedHotelRoomTypeRate, getInferredHotelMaxOccupancy, scoreHotelVariantMatch, resolveHotelVariantSelection } from './pricing';

﻿export const getPublicBaseUrl = () => {
  const browserOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const baseUrl = API.defaults.baseURL || browserOrigin;
  return new URL(baseUrl, browserOrigin).origin;
};

export const createPublicAssetUrl = (filePath = "") => {
  if (!filePath) return "";
  return new URL(filePath, getPublicBaseUrl()).toString();
};

export const downloadFileFromUrl = async (fileUrl, fileName = "download") => {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error("Unable to download the generated file.");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};

export const escapeWordHtml = (value = "") =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildWordQuotationDocumentHtml = (quotation = {}) => {
  const servicesMarkup = (quotation.services || [])
    .map(
      (service, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeWordHtml(service.title || "Service")}</td>
      <td>${escapeWordHtml(service.typeLabel || "Service")}</td>
      <td>${escapeWordHtml(service.location || "-")}</td>
      <td>${escapeWordHtml(service.serviceDateLabel || "-")}</td>
      <td>${escapeWordHtml(service.quantityLabel || "-")}</td>
      <td>${escapeWordHtml(service.description || "-")}</td>
    </tr>
  `,
    )
    .join("");

  const itineraryMarkup = (quotation.dayWiseItinerary || [])
    .map(
      (item) => `
    <div class="block">
      <h4>${escapeWordHtml(item.heading || item.dayLabel || "Day Plan")}</h4>
      <p>${escapeWordHtml(item.description || "-")}</p>
    </div>
  `,
    )
    .join("");

  const listMarkup = (items = []) =>
    items.length
      ? `<ul>${items.map((item) => `<li>${escapeWordHtml(item)}</li>`).join("")}</ul>`
      : `<p class="muted">Not specified</p>`;

  const parseStructuredTerms = (rawContent) => {
    if (!rawContent) return [];
    let text = "";
    if (Array.isArray(rawContent)) {
      text = rawContent
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            return item.content || item.text || item.name || item.item || item.label || "";
          }
          return String(item || "");
        })
        .join("\n");
    } else if (typeof rawContent === "string") {
      text = rawContent;
    } else {
      text = String(rawContent || "");
    }

    text = text
      .replace(/<\/(p|li|div|h[1-6]|tr|blockquote)>/gi, "\n")
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

    const majorSections = [
      "Bookings and Reservations",
      "Travel Documents and Requirements",
      "Changes to Itineraries & Liability",
      "Contact Information",
      "Intellectual Property",
      "Changes to Terms and Conditions",
    ];

    majorSections.forEach((sec) => {
      const reg = new RegExp(`(^|\\s|\\.|\\n)(${sec})(:?)`, "gi");
      text = text.replace(reg, "\n\n__HEADER__$2:\n");
    });

    const subItems = [
      "Booking Process",
      "Payment Terms",
      "Payment",
      "Confirmation",
      "Credit Card",
      "Confirmation Vouchers",
      "Airport Transfers & Tour Pick Ups",
      "Airport Transfers",
      "Taxes",
      "Changes & Cancellations",
      "Cancellations and Refunds",
      "Valid ID Proof",
      "Health & Vaccinations",
      "Travel Insurance",
      "Changes by [^:\n]+",
      "Service Providers Liability",
      "Force Majeure",
      "Governing Law",
      "Ownership",
    ];

    subItems.forEach((sub) => {
      const reg = new RegExp(`(^|\\s|\\.|\\n)(${sub}):`, "gi");
      text = text.replace(reg, "\n__SUB__$2:");
    });

    text = text
      .replace(/(\.|\n)\s*(Minimum 50%[^\.]+?\.)/gi, "\n__NESTED__$2")
      .replace(/(\.|\n)\s*(Remaining 50%[^\.]+?\.)/gi, "\n__NESTED__$2")
      .replace(/(\.|\n)\s*(In Case of Airline[^\.]+?\.)/gi, "\n__NESTED__$2")
      .replace(/(\.|\n)\s*(If a booking is under[^\.]+?\.)/gi, "\n__NESTED__$2");

    text = text.replace(/([.!?])([A-Z0-9])/g, "$1\n$2");

    const rawLines = text
      .split("\n")
      .map((l) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    let headerCount = 0;
    let nestedCount = 0;

    const items = [];
    rawLines.forEach((line) => {
      if (line.startsWith("__HEADER__")) {
        headerCount++;
        nestedCount = 0;
        const cleanLine = line.replace("__HEADER__", "").trim();
        items.push({
          type: "header",
          level: 1,
          number: headerCount,
          text: `${headerCount}. ${cleanLine.replace(/:$/, "")}`,
          rawText: cleanLine,
        });
      } else if (line.startsWith("__SUB__")) {
        nestedCount = 0;
        const cleanLine = line.replace("__SUB__", "").trim();
        items.push({
          type: "subitem",
          level: 2,
          text: `• ${cleanLine}`,
          rawText: cleanLine,
        });
      } else if (line.startsWith("__NESTED__")) {
        nestedCount++;
        const cleanLine = line.replace("__NESTED__", "").trim();
        items.push({
          type: "nested",
          level: 3,
          number: nestedCount,
          text: `${nestedCount}. ${cleanLine}`,
          rawText: cleanLine,
        });
      } else {
        items.push({
          type: "text",
          level: 0,
          text: line,
          rawText: line,
        });
      }
    });

    return items;
  };

  const formatTermsForWordDoc = (terms) => {
    const items = parseStructuredTerms(terms);
    if (!items.length) {
      return `<p class="muted">Not specified</p>`;
    }

    let html = "";
    let inSubList = false;
    let inNestedList = false;

    items.forEach((item) => {
      if (item.type === "text") {
        if (inNestedList) { html += "</ol>"; inNestedList = false; }
        if (inSubList) { html += "</ul>"; inSubList = false; }
        html += `<p style="margin: 0 0 8px 0; font-size: 11pt; color: #1e293b; line-height: 1.5;">${escapeWordHtml(item.rawText)}</p>`;
      } else if (item.type === "header") {
        if (inNestedList) { html += "</ol>"; inNestedList = false; }
        if (inSubList) { html += "</ul>"; inSubList = false; }
        html += `<h4 style="margin: 12px 0 6px 0; font-size: 11pt; font-weight: bold; color: #0f172a;">${escapeWordHtml(item.text)}</h4>`;
      } else if (item.type === "subitem") {
        if (inNestedList) { html += "</ol>"; inNestedList = false; }
        if (!inSubList) { html += '<ul style="margin: 4px 0 8px 20px; padding: 0; list-style-type: disc;">'; inSubList = true; }
        
        const colonIdx = item.rawText.indexOf(":");
        if (colonIdx > 0 && colonIdx < 40) {
          const label = item.rawText.slice(0, colonIdx + 1);
          const rest = item.rawText.slice(colonIdx + 1);
          html += `<li style="margin-bottom: 5px; font-size: 10.5pt; color: #1e293b; line-height: 1.45;"><strong>${escapeWordHtml(label)}</strong>${escapeWordHtml(rest)}</li>`;
        } else {
          html += `<li style="margin-bottom: 5px; font-size: 10.5pt; color: #1e293b; line-height: 1.45;">${escapeWordHtml(item.rawText)}</li>`;
        }
      } else if (item.type === "nested") {
        if (!inNestedList) {
          if (!inSubList) { html += '<ul style="margin: 4px 0 8px 20px; padding: 0; list-style-type: disc;">'; inSubList = true; }
          html += '<ol style="margin: 4px 0 6px 22px; padding: 0; list-style-type: decimal;">';
          inNestedList = true;
        }
        html += `<li style="margin-bottom: 4px; font-size: 10pt; color: #1e293b; line-height: 1.4;">${escapeWordHtml(item.rawText)}</li>`;
      }
    });

    if (inNestedList) html += "</ol>";
    if (inSubList) html += "</ul>";

    return html;
  };

  const bankMarkup = (quotation.sellerBankDetails || [])
    .map(
      (item) => `
    <tr>
      <td>${escapeWordHtml(item.label || "")}</td>
      <td>${escapeWordHtml(item.value || "-")}</td>
    </tr>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Quotation ${escapeWordHtml(quotation.queryId || "Quote")}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; color: #1f2937; margin: 28px; line-height: 1.5; }
      h1, h2, h3, h4 { margin: 0; }
      h1 { font-size: 26px; margin-bottom: 6px; color: #111827; }
      h2 { font-size: 18px; margin: 22px 0 10px; color: #1d4ed8; }
      h3 { font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
      h4 { font-size: 14px; margin-bottom: 6px; color: #0f172a; }
      p { margin: 0 0 8px; }
      .muted { color: #64748b; }
      .hero { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 18px; }
      .grid { width: 100%; border-collapse: collapse; margin-top: 12px; }
      .grid td { padding: 8px 10px; border: 1px solid #dbeafe; vertical-align: top; }
      .services th, .services td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
      .services th { background: #eff6ff; color: #1e3a8a; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-top: 12px; }
      .block { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
      .block:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
      ul { margin: 8px 0 0 18px; padding: 0; }
      li { margin-bottom: 4px; }
      .amount { font-size: 20px; font-weight: 700; color: #15803d; }
    </style>
  </head>
  <body>
    <div class="hero">
      <h1>Holiday Circuit Quotation</h1>
      <p class="muted">Quotation No: ${escapeWordHtml(quotation.quotationNumber || "-")}</p>
      <p class="muted">Query ID: ${escapeWordHtml(quotation.queryId || "-")}</p>
    </div>

    <h2>Trip Overview</h2>
    <table class="grid">
      <tr><td><strong>Agent</strong></td><td>${escapeWordHtml(quotation.recipientCompanyName || quotation.recipientName || "-")}</td></tr>
      <tr><td><strong>Destination</strong></td><td>${escapeWordHtml(quotation.destination || "-")}</td></tr>
      <tr><td><strong>Travel Dates</strong></td><td>${escapeWordHtml(quotation.travelDates || "-")}</td></tr>
      <tr><td><strong>Duration</strong></td><td>${escapeWordHtml(quotation.durationLabel || "-")}</td></tr>
      <tr><td><strong>Travellers</strong></td><td>${escapeWordHtml(quotation.travelerSummary || "-")}</td></tr>
      <tr><td><strong>Valid Till</strong></td><td>${escapeWordHtml(quotation.validTill || "-")}</td></tr>
      <tr><td><strong>Total Amount</strong></td><td class="amount">${escapeWordHtml(quotation.currency || "INR")} ${escapeWordHtml(quotation.totalAmount || 0)}</td></tr>
    </table>

    <h2>Services</h2>
    <table class="services" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>#</th>
          <th>Service</th>
          <th>Type</th>
          <th>Location</th>
          <th>Date</th>
          <th>Quantity</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${servicesMarkup || `<tr><td colspan="7">No services selected</td></tr>`}
      </tbody>
    </table>

    <h2>Inclusions</h2>
    <div class="card">${listMarkup(quotation.inclusions || [])}</div>

    <h2>Exclusions</h2>
    <div class="card">${listMarkup(quotation.exclusions || [])}</div>

    <h2>Additional Notes</h2>
    <div class="card">${listMarkup(quotation.additionalNotes || [])}</div>

    <h2>Day-wise Itinerary</h2>
    <div class="card">${itineraryMarkup || `<p class="muted">No itinerary added</p>`}</div>

    <h2>Bank Details</h2>
    <table class="grid">
      ${bankMarkup}
    </table>

    <h2>Terms and Conditions</h2>
    <div class="card">${formatTermsForWordDoc(quotation.termsAndConditions)}</div>
  </body>
</html>`;
};

export const downloadWordDocument = (quotation = {}, fileName = "quotation.doc") => {
  const html = buildWordQuotationDocumentHtml(quotation);
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};
