import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

const formatCurrency = (value, currency = "INR") =>
  `${currency} ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

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

const buildAgentClientQuotationText = (quoteDetails = {}) => {
  const servicesText = (quoteDetails.services || [])
    .map((service, index) => {
      const meta = buildServiceMeta(service);
      const description = String(service?.description || "").trim();

      return [
        `${index + 1}. ${service?.title || "Service"} (${service?.typeLabel || "Travel Service"})`,
        meta ? `   ${meta}` : "",
        description ? `   ${description}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    "Holiday Circuit - Client Quotation Summary",
    "",
    `Quotation Number: ${quoteDetails.quotationNumber || "-"}`,
    `Destination: ${quoteDetails.destination || "-"}`,
    `Travel Dates: ${quoteDetails.travelDates || "-"}`,
    `Duration: ${quoteDetails.durationLabel || "-"}`,
    `Travelers: ${quoteDetails.travelerSummary || "-"}`,
    `Valid Till: ${quoteDetails.validTill || "-"}`,
    `Client Total: ${formatCurrency(quoteDetails.totalAmount, quoteDetails.currency)}`,
    "",
    "Services",
    servicesText || "No service details available.",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildAgentClientQuotationTemplate = (quoteDetails = {}) => {
  const servicesHtml = (quoteDetails.services || [])
    .map(
      (service, index) => `
        <tr>
          <td style="padding:16px 0 16px 0;border-bottom:1px solid #edf2f7;vertical-align:top;color:#94a3b8;font-size:12px;font-weight:700;">
            ${String(index + 1).padStart(2, "0")}
          </td>
          <td style="padding:16px 14px;border-bottom:1px solid #edf2f7;vertical-align:top;">
            <div style="font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(service.title || "Service")}</div>
            <div style="margin-top:4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">${escapeHtml(service.typeLabel || "Travel Service")}</div>
            <div style="margin-top:6px;font-size:12px;line-height:1.7;color:#64748b;">${escapeHtml(buildServiceMeta(service) || "Configured service")}</div>
            ${
              service.description
                ? `<div style="margin-top:6px;font-size:12px;line-height:1.7;color:#475569;">${escapeHtml(service.description)}</div>`
                : ""
            }
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="background:#f8fafc;padding:32px 14px;font-family:Arial,sans-serif;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12);">
        <div style="padding:34px 34px 28px;background:radial-gradient(circle at top right, rgba(56,189,248,0.3), transparent 28%),linear-gradient(135deg,#0f172a 0%,#172554 52%,#1d4ed8 100%);">
          <div style="display:inline-block;padding:7px 14px;border:1px solid rgba(191,219,254,0.24);border-radius:999px;background:rgba(255,255,255,0.08);color:#dbeafe;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
            Client Quotation Summary
          </div>
          <h1 style="margin:18px 0 0;font-size:30px;line-height:1.2;color:#ffffff;">Holiday Circuit</h1>
          <p style="margin:10px 0 0;max-width:520px;font-size:14px;line-height:1.8;color:rgba(255,255,255,0.82);">
            Your travel quotation is ready. Here is a clean summary of the trip plan, selected services, and final commercials shared for review.
          </p>
        </div>

        <div style="padding:30px 34px 34px;">
          <p style="margin:0 0 10px;font-size:14px;line-height:1.8;color:#475569;">
            Hello <strong style="color:#0f172a;">${escapeHtml(quoteDetails.recipientName || "Guest")}</strong>,
          </p>
          <p style="margin:0 0 22px;font-size:14px;line-height:1.8;color:#475569;">
            Please review the quotation shared for <strong>${escapeHtml(quoteDetails.destination || "your trip")}</strong>. The summary below includes the selected services, inclusions, validity window, and the final amount to be shared with your client.
          </p>

          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:22px;">
            <div style="border:1px solid #dbeafe;border-radius:18px;background:#f8fbff;padding:16px 18px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Quotation Number</p>
              <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(quoteDetails.quotationNumber || "-")}</p>
              <p style="margin:10px 0 0;font-size:12px;color:#64748b;">${escapeHtml(quoteDetails.queryId || "Travel Query")}</p>
            </div>
            <div style="border:1px solid #dbeafe;border-radius:18px;background:#f8fbff;padding:16px 18px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Final Client Amount</p>
              <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#14532d;">${escapeHtml(formatCurrency(quoteDetails.totalAmount, quoteDetails.currency))}</p>
              <p style="margin:10px 0 0;font-size:12px;color:#64748b;">Valid till ${escapeHtml(quoteDetails.validTill || "-")}</p>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:24px;">
            <div style="border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;padding:14px 16px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Travel Dates</p>
              <p style="margin:8px 0 0;font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(quoteDetails.travelDates || "-")}</p>
            </div>
            <div style="border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;padding:14px 16px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Travelers</p>
              <p style="margin:8px 0 0;font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(quoteDetails.travelerSummary || "-")}</p>
            </div>
            <div style="border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;padding:14px 16px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Trip Duration</p>
              <p style="margin:8px 0 0;font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(quoteDetails.durationLabel || "-")}</p>
            </div>
          </div>

          <div style="border:1px solid #dbeafe;border-radius:22px;background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);padding:22px 24px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px;">
              <div>
                <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Selected Services</p>
                <h2 style="margin:8px 0 0;font-size:20px;color:#0f172a;">Travel plan breakdown</h2>
              </div>
              <div style="padding:8px 12px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;font-size:11px;font-weight:700;color:#1d4ed8;">
                ${quoteDetails.services?.length || 0} services
              </div>
            </div>

            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:0 0 12px;text-align:left;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">#</th>
                  <th style="padding:0 14px 12px;text-align:left;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Service</th>
                </tr>
              </thead>
              <tbody>
                ${
                  servicesHtml ||
                  `<tr><td colspan="2" style="padding:18px 0;text-align:center;font-size:13px;color:#64748b;">Service details are not available in this quotation.</td></tr>`
                }
              </tbody>
            </table>
          </div>

          <div style="border:1px solid #dcfce7;border-radius:20px;background:linear-gradient(180deg,#f0fdf4 0%,#ffffff 100%);padding:20px 22px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#16a34a;">Final Quotation Amount</p>
            <div style="display:flex;justify-content:space-between;gap:12px;padding-top:10px;font-size:18px;color:#14532d;">
              <span style="font-weight:700;">Total Amount</span>
              <strong>${escapeHtml(formatCurrency(quoteDetails.totalAmount, quoteDetails.currency))}</strong>
            </div>
            <p style="margin:14px 0 0;font-size:12px;line-height:1.7;color:#166534;">
              Please review and confirm within the validity period to avoid rate or availability changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const buildVoucherTemplate = (voucherDetails, branding = "with") => {
  const showBranding = branding === "with";
  const servicesHtml = (voucherDetails.services || [])
    .map(
      (service) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #1f2937; font-size: 14px;">
            ${service.type || "Service"}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #1f2937; font-size: 14px;">
            ${service.title || service.name || "-"}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #edf2f7; color: #6b7280; font-size: 13px; text-align: right;">
            ${service.confirmation || "Pending"}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="background:#f8fafc; padding:32px 16px; font-family:Arial, sans-serif;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
        ${
          showBranding
            ? `
          <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af); color:#fff; text-align:center; padding:28px 20px;">
            <h1 style="margin:0; font-size:26px;">Holiday Circuit</h1>
            <p style="margin:8px 0 0; font-size:12px; letter-spacing:1px;">TRAVEL VOUCHER</p>
          </div>
        `
            : `
          <div style="padding:24px 20px; border-bottom:1px solid #e5e7eb; text-align:center;">
            <h1 style="margin:0; font-size:22px; color:#111827;">Travel Voucher</h1>
          </div>
        `
        }
        <div style="padding:24px 24px 12px;">
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:20px;">
            <div>
              <p style="margin:0; font-size:12px; color:#6b7280;">Voucher No.</p>
              <p style="margin:4px 0 0; font-size:16px; font-weight:700; color:#111827;">${voucherDetails.voucherNumber || "-"}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0; font-size:12px; color:#6b7280;">Destination</p>
              <p style="margin:4px 0 0; font-size:16px; font-weight:700; color:#111827;">${voucherDetails.destination || "-"}</p>
            </div>
          </div>

          <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px;">Guest Name</td>
              <td style="padding:8px 0; color:#111827; font-size:14px; font-weight:600; text-align:right;">${voucherDetails.name || voucherDetails.guestName || "-"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px;">Passengers</td>
              <td style="padding:8px 0; color:#111827; font-size:14px; font-weight:600; text-align:right;">${voucherDetails.passengers || "-"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#6b7280; font-size:13px;">Duration</td>
              <td style="padding:8px 0; color:#111827; font-size:14px; font-weight:600; text-align:right;">${voucherDetails.duration || "-"}</td>
            </tr>
          </table>

          <h3 style="margin:0 0 12px; font-size:15px; color:#111827;">Service Details</h3>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left; padding:10px 0; color:#6b7280; font-size:12px; border-bottom:1px solid #e5e7eb;">Type</th>
                <th style="text-align:left; padding:10px 0; color:#6b7280; font-size:12px; border-bottom:1px solid #e5e7eb;">Service</th>
                <th style="text-align:right; padding:10px 0; color:#6b7280; font-size:12px; border-bottom:1px solid #e5e7eb;">Confirmation</th>
              </tr>
            </thead>
            <tbody>
              ${servicesHtml || '<tr><td colspan="3" style="padding:12px 0; color:#6b7280; font-size:13px;">No services available</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
  const preparedByEmail = escapeHtml(process.env.EMAIL_USER || "ops@leelatravels.com");
  const totalAmount = pricing.grandTotal || invoiceDetails.totalAmount || 0;
  const opsMarkupAmount = Number(pricing.opsMarkupAmount || 0);
  const serviceChargeAmount = Number(pricing.serviceCharge || 0);
  const handlingFeeAmount = Number(pricing.handlingFee || 0);
  const gstAmount = Number(pricing.gstAmount || 0);
  const gstPercent = Number(pricing.gstPercent || 0);

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

  const accommodationItems = lineItems.filter((item) => normalizeInvoiceServiceType(item?.serviceType) === "hotel");
  const specialInclusionItems = lineItems.filter((item) => {
    const type = normalizeInvoiceServiceType(item?.serviceType);
    const title = String(item?.title || "").toLowerCase();
    return title.includes("visa") || title.includes("insurance") || type.includes("visa") || type.includes("insurance");
  });
  const transportActivityItems = lineItems.filter((item) => {
    const type = normalizeInvoiceServiceType(item?.serviceType);
    const title = String(item?.title || "").toLowerCase();
    if (title.includes("visa") || title.includes("insurance") || type.includes("visa") || type.includes("insurance")) return false;
    return type !== "hotel";
  });

  const accommodationRows = accommodationItems.length
    ? accommodationItems.map((item) => `
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

  const transportRows = transportActivityItems.length
    ? transportActivityItems.map((item, index) => `
        <tr>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(buildInvoiceDayLabel(item?.serviceDate, index))}</td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(item?.title || "-")}</td>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(item?.notes || item?.serviceType || "Included service")}</td>
        </tr>
      `).join("")
    : `
      <tr>
        <td colspan="3" style="border:1px solid #d1d5db;padding:10px;text-align:center;font-size:10pt;color:#6b7280;">Transportation and activity details will appear here.</td>
      </tr>
    `;

  const specialRows = specialInclusionItems.length
    ? specialInclusionItems.map((item, index) => `
        <tr>
          <td style="border:1px solid #d1d5db;padding:9px 10px;vertical-align:top;font-size:10pt;">${escapeHtml(buildInvoiceDayLabel(item?.serviceDate, index))}</td>
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
  const inclusionsList = buildListItems([
    "Stay as mentioned or similar category hotels.",
    "Meals as mentioned in the itinerary.",
    "Airport or point-to-point transfers as confirmed.",
    "Sightseeing and entrance tickets as per confirmed services.",
    "Applicable taxes calculated on the date of issue.",
    "Visa and insurance only if specifically mentioned above.",
  ]);
  const exclusionsList = buildListItems([
    "International or domestic airfare unless specified.",
    "Early check-in, late check-out, and hotel deposits.",
    "Personal expenses such as laundry, room service, and tips.",
    "Any increase in tax, surcharge, or rate of exchange.",
    "Travel insurance where not explicitly included.",
    "Any service not listed in the invoice inclusions.",
  ]);
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
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">DAY</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">SERVICE</th>
            <th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10pt;">TYPE</th>
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

  const htmlTemplate = `
    <div style="background: #f0ede8; padding: 40px 20px; font-family: Georgia, serif;">
      <div style="max-width: 580px; margin: auto; background: #fff; border-radius: 2px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.12);">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 48px 40px 36px; text-align: center;">
          <div style="display: inline-block; border: 1px solid rgba(212,175,55,0.4); padding: 4px 18px; border-radius: 20px; margin-bottom: 16px;">
            <span style="color: #d4af37; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-family: Arial, sans-serif;">Travel Quotation</span>
          </div>
          <h1 style="color: #fff; margin: 0 0 6px; font-size: 28px; font-weight: normal; letter-spacing: 2px;">Holiday Circuit</h1>
          <div style="width: 40px; height: 2px; background: linear-gradient(90deg, #d4af37, #f0c040); margin: 12px auto 0;"></div>
        </div>
        <div style="padding: 40px 40px 32px;">
          <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 6px;">
            Dear <strong style="color: #1a1a2e;">${quoteDetails.name || "Customer"}</strong>,
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
            We're delighted to present your personalized travel quotation. Please review the details below.
          </p>
          <div style="background: linear-gradient(135deg, #f8f4ef, #f0ede8); border-left: 3px solid #d4af37; padding: 16px 20px; margin-bottom: 28px; border-radius: 0 4px 4px 0;">
            <p style="margin: 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #999; font-family: Arial, sans-serif;">Your Destination</p>
            <p style="margin: 6px 0 0; font-size: 22px; color: #1a1a2e; letter-spacing: 0.5px;">${quoteDetails.destination}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #f0ede8; color: #999; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif; width: 45%;">Duration</td>
              <td style="padding: 14px 0; border-bottom: 1px solid #f0ede8; color: #1a1a2e; font-size: 15px; font-weight: bold; text-align: right;">${quoteDetails.days} Days</td>
            </tr>
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #f0ede8; color: #999; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif;">Total Amount</td>
              <td style="padding: 14px 0; border-bottom: 1px solid #f0ede8; color: #1a1a2e; font-size: 18px; font-weight: bold; text-align: right;">INR ${quoteDetails.price}</td>
            </tr>
            <tr>
              <td style="padding: 14px 0; color: #999; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif;">Valid Till</td>
              <td style="padding: 14px 0; color: #1a1a2e; font-size: 15px; font-weight: bold; text-align: right;">${quoteDetails.validTill}</td>
            </tr>
          </table>
          <p style="color: #888; font-size: 13px; line-height: 1.7; text-align: center; margin: 0;">
            Questions? Reply to this email or call us at <strong style="color: #1a1a2e;">+91 XXXXX XXXXX</strong>
          </p>
        </div>
        <div style="background: #f8f4ef; padding: 24px 40px; text-align: center; border-top: 1px solid #e8e3dd;">
          <p style="margin: 0 0 4px; color: #1a1a2e; font-size: 14px; letter-spacing: 1px; font-weight: bold; font-family: Arial, sans-serif;">HOLIDAY CIRCUIT</p>
          <p style="margin: 0; color: #aaa; font-size: 11px; font-family: Arial, sans-serif;">Your Journey, Our Passion</p>
        </div>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Quotation - ${quoteDetails.destination}`,
    html: htmlTemplate,
  });

  console.log("EMAIL SENT:", info.response);
  return { status: "sent", email };
};

export const sendAgentClientQuotationMail = async (email, quoteDetails = {}) => {
  const transporter = createTransporter();
  const html = buildAgentClientQuotationTemplate(quoteDetails);
  const text = buildAgentClientQuotationText(quoteDetails);

  const info = await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    replyTo: process.env.EMAIL_USER,
    subject: `Your Quotation - ${quoteDetails.destination || quoteDetails.quotationNumber || "Holiday Circuit"}`,
    html,
    text,
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

export const sendEmailVoucher = async (email, voucherDetails, branding = "with") => {
  const transporter = createTransporter();
  const html = buildVoucherTemplate(voucherDetails, branding);

  const info = await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Voucher - ${voucherDetails.destination || voucherDetails.voucherNumber || "Holiday Circuit"}`,
    html,
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
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
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
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
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
