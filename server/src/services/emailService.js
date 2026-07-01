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
  { label: "A/c Holder Name", value: "Leela Travels" },
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

const buildAgentClientQuotationTemplate = (quoteDetails = {}) => {
  const brandName = quoteDetails.agentBrandingName || QUOTATION_BRAND.name;
  const brandLogo = quoteDetails.agentLogo || QUOTATION_BRAND.logoUrl;
  const brandSubline = quoteDetails.agentBrandingName ? "Travel Quotation" : QUOTATION_BRAND.subline;
  let brandDetails = "";
  if (quoteDetails.agentBrandingName) {
    const details = [];
    details.push(`Prepared by ${escapeHtml(brandName)}`);
    if (quoteDetails.agentEmail) {
      details.push(`Email: ${escapeHtml(quoteDetails.agentEmail)}`);
    }
    if (quoteDetails.agentPhone) {
      details.push(`Phone: ${escapeHtml(quoteDetails.agentPhone)}`);
    }
    if (quoteDetails.agentGstNumber) {
      details.push(`GST: ${escapeHtml(quoteDetails.agentGstNumber)}`);
    }
    brandDetails = details.join("<br/>");
  } else {
    brandDetails = `${escapeHtml(QUOTATION_BRAND.address)}<br/>${escapeHtml(QUOTATION_BRAND.email)} | ${escapeHtml(QUOTATION_BRAND.phone)}`;
  }

  const issueDate = formatDateLabel(new Date());
  const rawCurrency = quoteDetails.currency || "INR";
  const safeCurrencySymbol = escapeHtml(String(rawCurrency).toUpperCase() === "INR" ? INR_SYMBOL : rawCurrency);
  const safeTotalAmount = escapeHtml(formatCurrency(quoteDetails.totalAmount, quoteDetails.currency));
  const safeAmountInWords = escapeHtml(`${safeCurrencySymbol}: ${numberToWords(quoteDetails.totalAmount)}`);
  const includeSellerBankDetails = quoteDetails?.includeSellerBankDetails !== false;
  const sellerBankDetails = normalizeSellerBankDetails(quoteDetails.sellerBankDetails);
  const snapshotItems = [
    { label: "Quotation No.", value: quoteDetails.quotationNumber || "-" },
    { label: "Trip ID", value: quoteDetails.queryId || "-" },
    { label: "Destination", value: quoteDetails.destination || "-" },
    { label: "Total Services", value: String(Array.isArray(quoteDetails.services) ? quoteDetails.services.length : 0) },
    { label: "Travel Dates", value: quoteDetails.travelDates || "-" },
    { label: "Duration", value: quoteDetails.durationLabel || "-" },
    { label: "Travelers", value: quoteDetails.travelerSummary || "-" },
    { label: "Valid Till", value: quoteDetails.validTill || "-" },
  ];
  const terms = [
    "Rates are subject to availability and confirmation at the time of booking.",
    "Only the services listed in this quotation are included in the shared amount.",
    "Any amendment after confirmation may affect availability and final pricing.",
    "Hotel check-in, check-out, and supplier-specific policies will apply as per service rules.",
    "Please review and confirm within the validity period to avoid fare or rate changes.",
  ];



  const snapshotHtml = snapshotItems
    .map((item) => `
      <td width="25%" style="padding:12px 10px;border:1px solid #cbd5e1;">
        <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;">${escapeHtml(item.label)}</div>
        <div style="font-size:13px;font-weight:700;color:#10213a;line-height:1.4;">${escapeHtml(item.value)}</div>
      </td>
    `)
    .reduce((rows, cell, index) => {
      const rowIndex = Math.floor(index / 4);
      rows[rowIndex] = rows[rowIndex] || [];
      rows[rowIndex].push(cell);
      return rows;
    }, [])
    .map((row) => `<tr>${row.join("")}</tr>`)
    .join("");

  const servicesHtml = (quoteDetails.services || [])
    .map((service, index) => {
      const normalizedTypeLabel = normalizeServiceTypeLabel(service.typeLabel);
      const badge = getTypeBadgeColors(normalizedTypeLabel);
      const descriptionHtml = buildServiceDescriptionHtml(service.description);

      return `
        <tr style="background:${index % 2 === 0 ? "#ffffff" : "#f8fafc"};">
          <td width="7%" style="padding:12px 8px;border:1px solid #cbd5e1;text-align:center;font-size:12px;font-weight:700;color:#10213a;">${index + 1}</td>
          <td width="32%" style="padding:12px 10px;border:1px solid #cbd5e1;">
            <div style="font-size:13px;font-weight:700;color:#10213a;">${escapeHtml(service.title || "Service")}</div>
            ${descriptionHtml}
          </td>
          <td width="16%" style="padding:12px 8px;border:1px solid #cbd5e1;text-align:center;">
            <span style="display:inline-block;padding:5px 10px;border-radius:999px;background:${badge.background};border:1px solid ${badge.border};color:${badge.text};font-size:11px;font-weight:700;">
              ${escapeHtml(normalizedTypeLabel)}
            </span>
          </td>
          <td width="15%" style="padding:12px 8px;border:1px solid #cbd5e1;text-align:center;font-size:12px;color:#334155;">${escapeHtml(service.serviceDateLabel || "-")}</td>
          <td width="17%" style="padding:12px 10px;border:1px solid #cbd5e1;font-size:12px;color:#334155;">${escapeHtml(service.location || "-")}</td>
          <td width="13%" style="padding:12px 8px;border:1px solid #cbd5e1;text-align:center;font-size:12px;color:#334155;">${escapeHtml(service.quantityLabel || "-")}</td>
        </tr>
      `;
    })
    .join("");

  const fallbackServiceHtml = `
    <tr>
      <td style="padding:14px 8px;border:1px solid #cbd5e1;text-align:center;font-size:12px;font-weight:700;color:#10213a;">1</td>
      <td style="padding:14px 10px;border:1px solid #cbd5e1;">
        <div style="font-size:13px;font-weight:700;color:#10213a;">Quotation for ${escapeHtml(quoteDetails.destination || "Trip")}</div>
        <div style="margin-top:6px;font-size:11px;line-height:1.6;color:#334155;">Travelers: ${escapeHtml(quoteDetails.travelerSummary || "-")}<br/>Dates: ${escapeHtml(quoteDetails.travelDates || "-")}</div>
      </td>
      <td style="padding:14px 8px;border:1px solid #cbd5e1;text-align:center;"><span style="display:inline-block;padding:5px 10px;border-radius:999px;background:#e2e8f0;border:1px solid #cbd5e1;color:#10213a;font-size:11px;font-weight:700;">Travel</span></td>
      <td style="padding:14px 8px;border:1px solid #cbd5e1;text-align:center;font-size:12px;color:#334155;">-</td>
      <td style="padding:14px 10px;border:1px solid #cbd5e1;font-size:12px;color:#334155;">${escapeHtml(quoteDetails.destination || "-")}</td>
      <td style="padding:14px 8px;border:1px solid #cbd5e1;text-align:center;font-size:12px;color:#334155;">-</td>
    </tr>
  `;

  const inclusionsHtml = buildQuoteListHtml(quoteDetails.inclusions, "No inclusions shared.");
  const exclusionsHtml = buildQuoteListHtml(quoteDetails.exclusions, "No exclusions shared.");
  const additionalNotesHtml = buildQuoteListHtml(quoteDetails.additionalNotes, "No additional notes shared.");
  const itineraryHtml = buildItineraryHtml(quoteDetails.dayWiseItinerary, "No itinerary shared.");
  const sellerBankDetailsHtml = includeSellerBankDetails
    ? sellerBankDetails
      .map(
        (item, index) => `
            <tr>
              <td style="padding:12px 14px;border-bottom:${index === sellerBankDetails.length - 1 ? "0" : "1px solid #cbd5e1"};font-size:12px;font-weight:700;color:#64748b;width:34%;">${escapeHtml(item.label)}</td>
              <td style="padding:12px 14px;border-bottom:${index === sellerBankDetails.length - 1 ? "0" : "1px solid #cbd5e1"};font-size:12px;font-weight:700;color:#10213a;">${escapeHtml(item.value)}</td>
            </tr>
          `,
      )
      .join("")
    : "";
  const termsHtml = terms
    .map(
      (term, index) =>
        `<div style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#334155;">${index + 1}. ${escapeHtml(term)}</div>`,
    )
    .join("");

  return `
    <div style="margin:0;padding:32px 14px;background:#f8fafc;font-family:Arial,sans-serif;color:#10213a;">
      <div style="max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #7dd3c7;border-radius:18px;overflow:hidden;">
        <div style="background:#0f766e;padding:10px 18px;text-align:center;">
          <span style="font-size:11px;font-weight:700;letter-spacing:0.24em;color:#ffffff;">${escapeHtml(brandName.toUpperCase())} QUOTATION</span>
        </div>

        <div style="padding:24px 24px 8px;">
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
            <tr>
              <td width="55%" valign="top">
                <table cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="top" style="padding-right:14px;">
                      <div style="width:58px;height:58px;border:1px solid #cbd5e1;border-radius:12px;background:#ffffff;text-align:center;overflow:hidden;">
                        <img src="${brandLogo}" alt="${escapeHtml(brandName)}" width="58" style="display:block;width:58px;height:58px;object-fit:contain;" />
                      </div>
                    </td>
                    <td valign="top">
                      <div style="font-size:24px;font-weight:700;color:#10213a;line-height:1.2;">${escapeHtml(brandName)}</div>
                      <div style="margin-top:4px;font-size:12px;letter-spacing:0.14em;color:#64748b;text-transform:uppercase;">${escapeHtml(brandSubline)}</div>
                      <div style="margin-top:8px;font-size:12px;line-height:1.6;color:#334155;">${brandDetails}</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="45%" valign="top" align="right">
                <div style="display:inline-block;min-width:240px;padding:14px 16px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;text-align:left;">
                  <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px;">Quotation Meta</div>
                  <div style="font-size:12px;line-height:1.8;color:#334155;"><strong style="color:#10213a;">Issue Date:</strong> ${escapeHtml(issueDate)}</div>
                  <div style="font-size:12px;line-height:1.8;color:#334155;"><strong style="color:#10213a;">Valid Till:</strong> ${escapeHtml(quoteDetails.validTill || "-")}</div>
                  <div style="font-size:12px;line-height:1.8;color:#334155;"><strong style="color:#10213a;">Quotation No.:</strong> ${escapeHtml(quoteDetails.quotationNumber || "-")}</div>
                  <div style="font-size:12px;line-height:1.8;color:#334155;"><strong style="color:#10213a;">Recipient:</strong> ${escapeHtml(quoteDetails.recipientName || "Guest")}</div>
                </div>
              </td>
            </tr>
          </table>

          <div style="margin-bottom:16px;padding:10px 12px;border-radius:8px;background:#ecfeff;border:1px solid #7dd3c7;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#0f766e;">TRIP SNAPSHOT</div>
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
            ${snapshotHtml}
          </table>

          <div style="margin-bottom:16px;padding:10px 12px;border-radius:8px;background:#ecfeff;border:1px solid #7dd3c7;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#0f766e;">SERVICES INCLUDED</div>
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px;">
            <tr style="background:#f0fdfa;">
              <td width="7%" style="padding:10px 8px;border:1px solid #7dd3c7;text-align:center;font-size:11px;font-weight:700;color:#10213a;">S.NO.</td>
              <td width="32%" style="padding:10px 8px;border:1px solid #7dd3c7;font-size:11px;font-weight:700;color:#10213a;">PARTICULARS</td>
              <td width="16%" style="padding:10px 8px;border:1px solid #7dd3c7;text-align:center;font-size:11px;font-weight:700;color:#10213a;">CATEGORY</td>
              <td width="15%" style="padding:10px 8px;border:1px solid #7dd3c7;text-align:center;font-size:11px;font-weight:700;color:#10213a;">SERVICE DATE</td>
              <td width="17%" style="padding:10px 8px;border:1px solid #7dd3c7;font-size:11px;font-weight:700;color:#10213a;">LOCATION</td>
              <td width="13%" style="padding:10px 8px;border:1px solid #7dd3c7;text-align:center;font-size:11px;font-weight:700;color:#10213a;">QTY</td>
            </tr>
            ${servicesHtml || fallbackServiceHtml}
          </table>

          <div style="margin-bottom:16px;padding:10px 12px;border-radius:8px;background:#ecfeff;border:1px solid #7dd3c7;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#0f766e;">QUOTATION SUMMARY</div>
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
            <tr>
              <td width="66%" valign="top" style="padding-right:12px;">
                <div style="height:100%;padding:16px 18px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;">
                  <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">Amount Chargeable (In Words)</div>
                  <div style="font-size:15px;font-weight:700;color:#10213a;line-height:1.6;">${safeAmountInWords}</div>
                  <div style="margin-top:10px;font-size:12px;line-height:1.7;color:#334155;">Selected services: ${Array.isArray(quoteDetails.services) ? quoteDetails.services.length : 0} | Recipient: ${escapeHtml(quoteDetails.recipientName || "Guest")}</div>
                </div>
              </td>
              <td width="34%" valign="top">
                <div style="height:100%;padding:16px 18px;border:1px solid #bbf7d0;border-radius:14px;background:#ecfdf5;text-align:center;">
                  <div style="font-size:11px;font-weight:700;color:#166534;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">Final Amount</div>
                  <div style="font-size:24px;font-weight:700;color:#166534;line-height:1.3;">${safeTotalAmount}</div>
                  <div style="margin-top:8px;font-size:11px;line-height:1.6;color:#334155;">Taxes and charges are already reflected in the total shared by operations.</div>
                </div>
              </td>
            </tr>
          </table>

          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
            <tr>
              <td width="50%" valign="top" style="padding-right:10px;">
                <div style="height:100%;padding:16px 18px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;">
                  <div style="font-size:11px;font-weight:700;color:#0f766e;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">Inclusions</div>
                  ${inclusionsHtml}
                </div>
              </td>
              <td width="50%" valign="top" style="padding-left:10px;">
                <div style="height:100%;padding:16px 18px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;">
                  <div style="font-size:11px;font-weight:700;color:#0f766e;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">Exclusions</div>
                  ${exclusionsHtml}
                </div>
              </td>
            </tr>
          </table>

          <div style="margin-bottom:16px;padding:10px 12px;border-radius:8px;background:#ecfeff;border:1px solid #7dd3c7;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#0f766e;">DAY WISE ITINERARY</div>
          <div style="margin-bottom:18px;">${itineraryHtml}</div>

          <div style="margin-bottom:16px;padding:10px 12px;border-radius:8px;background:#ecfeff;border:1px solid #7dd3c7;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#0f766e;">IMPORTANT NOTES</div>
          <div style="margin-bottom:18px;padding:16px 18px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;">
            ${additionalNotesHtml}
          </div>

          ${includeSellerBankDetails ? `
            <div style="margin-bottom:16px;padding:10px 12px;border-radius:8px;background:#ecfeff;border:1px solid #7dd3c7;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#0f766e;">SELLER'S BANK DETAILS</div>
            <div style="margin-bottom:18px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;overflow:hidden;">
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                ${sellerBankDetailsHtml}
              </table>
            </div>
          ` : ""}

          <div style="margin-bottom:16px;padding:10px 12px;border-radius:8px;background:#ecfeff;border:1px solid #7dd3c7;text-align:center;font-size:12px;font-weight:700;letter-spacing:0.12em;color:#0f766e;">TERMS AND CONDITIONS</div>
          <div style="padding:16px 18px;border:1px solid #cbd5e1;border-radius:14px;background:#ffffff;">
            ${termsHtml}
          </div>

          <div style="margin-top:24px;text-align:center;font-size:11px;color:#64748b;">
            This is a computer-generated quotation prepared by ${escapeHtml(brandName)} and does not require a signature.
          </div>
        </div>
      </div>
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

          <div class="brand-footer" style="background: linear-gradient(135deg, #020617, #0f172a, #d95508); padding: 16px 24px; border-top: 4px solid #d95508; color: #ffffff; font-size: 12px; text-align: center; line-height: 1.8; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            <div class="footer-info" style="font-weight: 600; margin-bottom: 4px;">
              <span style="color: #cbd5e1;">Phone: +91 8851346665, +91 9971706003 | Email: ops@holidaycircuit.com | Web: www.holidaycircuit.com</span>
            </div>
            <div class="footer-address" style="color: #94a3b8; font-size: 11px; font-weight: 500;">
              2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058
            </div>
          </div>
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

export const sendEmailQuote = async (email, quoteDetails) => {
  const transporter = createTransporter();
  const htmlTemplate = buildAgentClientQuotationTemplate({
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
  });
  const text = buildAgentClientQuotationText({
    recipientName: quoteDetails?.recipientName || quoteDetails?.name || "Customer",
    quotationNumber: quoteDetails?.quotationNumber || "",
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
    services: Array.isArray(quoteDetails?.services) ? quoteDetails.services : [],
  });

  let attachments = [];
  try {
    const pdfResult = await generatePDF(quoteDetails);
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
  const html = buildAgentClientQuotationTemplate(quoteDetails);
  const text = buildAgentClientQuotationText(quoteDetails);

  let attachments = [];
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
