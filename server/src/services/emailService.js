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

export const buildFinalInvoiceTemplate = (invoiceDetails = {}) => {
  const currency = invoiceDetails.currency || "INR";
  const lineItemsHtml = (invoiceDetails.lineItems || [])
    .map((item, index) => {
      const quantityBits = [];

      if (Number(item.nights || 0) > 0) quantityBits.push(`${item.nights} night${Number(item.nights) > 1 ? "s" : ""}`);
      if (Number(item.days || 0) > 0) quantityBits.push(`${item.days} day${Number(item.days) > 1 ? "s" : ""}`);
      if (Number(item.pax || 0) > 0) quantityBits.push(`${item.pax} pax`);
      if (Number(item.rooms || 0) > 0) quantityBits.push(`${item.rooms} room${Number(item.rooms) > 1 ? "s" : ""}`);

      const meta = [
        item.serviceType ? item.serviceType.toUpperCase() : "",
        item.location || "",
        formatDateLabel(item.serviceDate),
      ]
        .filter((value) => value && value !== "-")
        .join(" | ");

      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #ece8df;vertical-align:top;">
            <div style="font-size:13px;color:#8a7d67;margin-bottom:6px;">${String(index + 1).padStart(2, "0")}</div>
          </td>
          <td style="padding:16px 14px 16px 0;border-bottom:1px solid #ece8df;vertical-align:top;">
            <div style="font-size:14px;font-weight:700;color:#16213e;">${item.title || "-"}</div>
            <div style="margin-top:5px;font-size:12px;color:#7c8698;line-height:1.6;">${meta || "-"}</div>
            <div style="margin-top:6px;font-size:12px;color:#4b5563;line-height:1.6;">${quantityBits.join(" | ") || item.notes || "Configured service"}</div>
          </td>
          <td style="padding:16px 14px;border-bottom:1px solid #ece8df;vertical-align:top;text-align:right;font-size:13px;color:#334155;">
            ${formatCurrency(item.unitPrice, item.currency || currency)}
          </td>
          <td style="padding:16px 0;border-bottom:1px solid #ece8df;vertical-align:top;text-align:right;font-size:13px;font-weight:700;color:#111827;">
            ${formatCurrency(item.total, item.currency || currency)}
          </td>
        </tr>
      `;
    })
    .join("");

  const pricing = invoiceDetails.pricingSnapshot || {};
  const trip = invoiceDetails.tripSnapshot || {};
  const travelerCount =
    Number(trip.numberOfAdults || 0) + Number(trip.numberOfChildren || 0);

  return `
    <div style="background:#f5f1ea;padding:38px 16px;font-family:Arial,sans-serif;">
      <div style="max-width:780px;margin:0 auto;background:#fffdf8;border:1px solid #e7dfd1;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.12);">
        <div style="background:linear-gradient(135deg,#102542 0%,#183b62 55%,#c38a2e 140%);padding:36px 34px 32px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
            <div>
              <div style="display:inline-block;border:1px solid rgba(255,255,255,0.22);padding:6px 14px;border-radius:999px;color:#f8e6be;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Final Invoice</div>
              <h1 style="margin:16px 0 0;font-size:30px;color:#ffffff;letter-spacing:0.4px;">Holiday Circuit</h1>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.84);max-width:420px;">
                A detailed booking invoice with service-wise pricing, taxes, operational charges, and final payable summary.
              </p>
            </div>
            <div style="min-width:190px;border:1px solid rgba(255,255,255,0.16);border-radius:18px;background:rgba(255,255,255,0.08);padding:16px 18px;">
              <p style="margin:0;font-size:11px;color:#d8e5f7;letter-spacing:1.6px;text-transform:uppercase;">Invoice Number</p>
              <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#ffffff;">${invoiceDetails.invoiceNumber || "-"}</p>
              <p style="margin:16px 0 0;font-size:11px;color:#d8e5f7;letter-spacing:1.6px;text-transform:uppercase;">Invoice Date</p>
              <p style="margin:8px 0 0;font-size:14px;font-weight:600;color:#ffffff;">${formatDateLabel(invoiceDetails.invoiceDate || new Date())}</p>
            </div>
          </div>
        </div>

        <div style="padding:28px 34px 16px;">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">
            <div style="border:1px solid #ece8df;border-radius:18px;background:#ffffff;padding:16px 18px;">
              <p style="margin:0;font-size:11px;color:#9a8d76;letter-spacing:1.4px;text-transform:uppercase;">Agent</p>
              <p style="margin:8px 0 0;font-size:17px;font-weight:700;color:#16213e;">${invoiceDetails.agentName || "-"}</p>
              <p style="margin:6px 0 0;font-size:12px;color:#6b7280;">${invoiceDetails.agentEmail || ""}</p>
            </div>
            <div style="border:1px solid #ece8df;border-radius:18px;background:#ffffff;padding:16px 18px;">
              <p style="margin:0;font-size:11px;color:#9a8d76;letter-spacing:1.4px;text-transform:uppercase;">Trip Snapshot</p>
              <p style="margin:8px 0 0;font-size:17px;font-weight:700;color:#16213e;">${trip.destination || "-"}</p>
              <p style="margin:6px 0 0;font-size:12px;color:#6b7280;line-height:1.7;">
                ${trip.queryId || "-"} | ${formatDateLabel(trip.startDate)} - ${formatDateLabel(trip.endDate)} | ${travelerCount || 0} traveler${travelerCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div style="margin-top:26px;border:1px solid #ece8df;border-radius:22px;background:#fff;padding:22px 24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;">
              <div>
                <p style="margin:0;font-size:11px;color:#9a8d76;letter-spacing:1.4px;text-transform:uppercase;">Service Breakdown</p>
                <h2 style="margin:8px 0 0;font-size:20px;color:#111827;">Detailed Final Invoice</h2>
              </div>
              <div style="border-radius:999px;background:#f7f1e5;padding:8px 12px;font-size:11px;color:#946b21;font-weight:700;">
                ${invoiceDetails.lineItems?.length || 0} line items
              </div>
            </div>

            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:0 0 12px;text-align:left;font-size:11px;color:#9a8d76;letter-spacing:1.2px;text-transform:uppercase;">#</th>
                  <th style="padding:0 14px 12px 0;text-align:left;font-size:11px;color:#9a8d76;letter-spacing:1.2px;text-transform:uppercase;">Service</th>
                  <th style="padding:0 14px 12px;text-align:right;font-size:11px;color:#9a8d76;letter-spacing:1.2px;text-transform:uppercase;">Unit Rate</th>
                  <th style="padding:0 0 12px;text-align:right;font-size:11px;color:#9a8d76;letter-spacing:1.2px;text-transform:uppercase;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  lineItemsHtml ||
                  `<tr><td colspan="4" style="padding:18px 0;text-align:center;font-size:13px;color:#8b95a7;">No line items available.</td></tr>`
                }
              </tbody>
            </table>
          </div>

          <div style="display:grid;grid-template-columns:1.15fr 0.85fr;gap:18px;margin-top:20px;padding-bottom:30px;">
            <div style="border:1px solid #ece8df;border-radius:22px;background:#fff;padding:20px 22px;">
              <p style="margin:0;font-size:11px;color:#9a8d76;letter-spacing:1.4px;text-transform:uppercase;">Commercial Notes</p>
              <ul style="margin:14px 0 0;padding-left:18px;color:#475569;font-size:13px;line-height:1.8;">
                <li>This is the final commercial invoice for the confirmed booking.</li>
                <li>All applicable GST, TCS, and operational charges are included below.</li>
                <li>Use the invoice number for payment reference and finance coordination.</li>
              </ul>
            </div>

            <div style="border:1px solid #e3d7be;border-radius:22px;background:linear-gradient(180deg,#fff9ee 0%,#fffdf8 100%);padding:20px 22px;">
              <p style="margin:0 0 14px;font-size:11px;color:#9a8d76;letter-spacing:1.4px;text-transform:uppercase;">Amount Summary</p>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>Base Amount</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.baseAmount, pricing.currency || currency)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>Services Total</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.servicesTotal, pricing.currency || currency)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>Package Template Add-on</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.packageTemplateAmount, pricing.currency || currency)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>Ops Markup</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.opsMarkupAmount, pricing.currency || currency)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>Service Charge</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.serviceCharge, pricing.currency || currency)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>Handling Fee</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.handlingFee, pricing.currency || currency)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>GST ${Number(pricing.gstPercent || 0) ? `(${pricing.gstPercent}%)` : ""}</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.gstAmount, pricing.currency || currency)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>TCS ${Number(pricing.tcsPercent || 0) ? `(${pricing.tcsPercent}%)` : ""}</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.tcsAmount, pricing.currency || currency)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#475569;padding:8px 0;">
                <span>Tourism / Other Fees</span>
                <strong style="color:#16213e;">${formatCurrency(pricing.tourismAmount, pricing.currency || currency)}</strong>
              </div>
              <div style="height:1px;background:#eadfcb;margin:10px 0;"></div>
              <div style="display:flex;justify-content:space-between;gap:12px;font-size:17px;color:#111827;padding-top:4px;">
                <span style="font-weight:700;">Grand Total</span>
                <strong style="color:#9a6c12;">${formatCurrency(pricing.grandTotal || invoiceDetails.totalAmount, pricing.currency || currency)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
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

  const info = await transporter.sendMail({
    from: `"Holiday Circuit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Final Invoice - ${invoiceDetails.invoiceNumber || invoiceDetails.destination || "Holiday Circuit"}`,
    html,
  });

  console.log("FINAL INVOICE EMAIL SENT:", info.response);
  return { status: "sent", email };
};
