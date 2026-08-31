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
  const resolvedTravelDate = data?.travelDate || data?.date || null;
  const voucherFooterSrc = String(
    data?.voucherFooterImage || data?.footerBanner || data?.pdfFooterImage || data?.agentFooterImage || ""
  ).trim();
  const passengerBreakup = formatTravelerBreakup({
    adults: data.adults,
    children: data.children,
    travelerSummary: data.travelerSummary,
    passengers: data.passengers,
  });

  const agentLogoUrl = String(agentBranding?.logo || "").trim();
  const agentCompanyName = String(agentBranding?.name || "").trim();
  const hasAgentBranding = showBranding && (agentLogoUrl || agentCompanyName);

  const serviceRowsHtml = (data.services || [])
    .map((service, idx) => {
      const confirmation = service.confirmation || "Pending";
      const statusDisplay = getConfirmationStatusDisplay(confirmation, service.status);
      const confNumber = confirmation && confirmation.toLowerCase() !== "pending" ? confirmation : "-";

      return `
        <tr>
          <td class="svc-type">${formatServiceTypeLabel(service.type)}</td>
          <td class="svc-name">${service.title || service.name || "Service details missing"}</td>
          <td class="svc-status"><span class="${statusDisplay.cssClass}">${statusDisplay.label}</span></td>
          <td class="svc-conf">${confNumber}</td>
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
        <title>Travel Voucher - ${data.voucherNumber || data.query}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background-color: #f0f4f8;
            padding: 40px 20px;
            font-family: 'Plus Jakarta Sans', 'Inter', Arial, sans-serif;
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

          /* ── HEADER ── */
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
            padding: 12px 18px;
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
            height: 62px;
            width: auto;
            object-fit: contain;
          }
          .brand-mark {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .brand-mark-letters {
            display: inline-flex;
            align-items: flex-end;
            font-family: 'Inter', sans-serif;
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -1px;
          }
          .brand-mark-t {
            color: #0f1d32;
          }
          .brand-mark-v {
            background: linear-gradient(180deg, #5a8aa8 0%, #3d6a8e 55%, #1a3352 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            margin-left: 1px;
          }
          .brand-mark-sub {
            margin-top: 3px;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.18em;
            color: #7badc8;
            text-transform: uppercase;
          }
          .brand-name {
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.5px;
            z-index: 2;
            position: relative;
          }

          /* ── TITLE BAR ── */
          .title-bar {
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            color: #ffffff;
            text-align: center;
            font-size: 17px;
            font-weight: 700;
            padding: 15px 20px;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-family: 'Inter', sans-serif;
            border-top: 2px solid #5a8aa8;
            border-bottom: 2px solid #0f1d32;
          }

          /* ── BODY ── */
          .voucher-body {
            padding: 28px 30px 30px;
          }

          /* ── METADATA CARDS ── */
          .metadata-card {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
            margin-bottom: 18px;
          }
          .metadata-card tr td {
            border-bottom: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
            padding: 11px 14px;
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
            background-color: #f1f5f9;
            font-weight: 700;
            color: #334155;
            width: 32%;
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            letter-spacing: 0.2px;
          }
          .metadata-card td.value-cell {
            background-color: #ffffff;
            color: #0f172a;
            font-weight: 600;
          }

          /* ── SECTION HEADING ── */
          .section-heading {
            margin: 24px 0 12px;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #ffffff;
            background: linear-gradient(135deg, #0f1d32 0%, #1a3352 50%, #264a6e 100%);
            padding: 11px 16px;
            font-family: 'Inter', sans-serif;
            border-top: 2px solid #5a8aa8;
            border-bottom: 2px solid #0f1d32;
          }

          /* ── SERVICES TABLE ── */
          .services-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d5e3ee;
            font-size: 13px;
          }
          .services-table thead th {
            background: linear-gradient(180deg, #edf3f8 0%, #e2ecf3 100%);
            border-bottom: 2px solid #a3bdd0;
            border-right: 1px solid #d5e3ee;
            padding: 12px 14px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #1a3352;
            text-align: left;
            letter-spacing: 0.8px;
            font-family: 'Inter', sans-serif;
          }
          .services-table thead th:last-child {
            border-right: none;
          }
          .services-table tbody td {
            border-bottom: 1px solid #d5e3ee;
            border-right: 1px solid #d5e3ee;
            padding: 12px 14px;
            color: #1a3352;
            background-color: #ffffff;
            vertical-align: middle;
          }
          .services-table tbody tr:last-child td {
            border-bottom: none;
          }
          .services-table tbody td:last-child {
            border-right: none;
          }
          .services-table tbody tr:nth-child(even) td {
            background-color: #f4f8fc;
          }
          .services-table tbody tr:hover td {
            background-color: #eaf1f8;
          }
          .svc-type {
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            color: #1a3352;
            width: 16%;
          }
          .svc-name {
            font-weight: 600;
            color: #0f1d32;
            width: 40%;
          }
          .svc-status {
            width: 18%;
            text-align: center;
          }
          .svc-conf {
            font-weight: 600;
            color: #334155;
            width: 26%;
            font-family: 'Inter', monospace;
            font-size: 12px;
          }
          .status-confirmed {
            display: inline-block;
            background: #f0f9f4;
            color: #166534;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            border: 1px solid #b4dfc8;
            letter-spacing: 0.3px;
          }
          .status-pending {
            display: inline-block;
            background: #fef9f0;
            color: #92400e;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            border: 1px solid #f5dea0;
            letter-spacing: 0.3px;
          }
          .status-cancelled {
            display: inline-block;
            background: #fef4f4;
            color: #991b1b;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            border: 1px solid #f5c6c6;
            letter-spacing: 0.3px;
          }

          /* ── EMPTY STATE ── */
          .empty-row td {
            text-align: center;
            color: #94a3b8;
            padding: 22px 14px;
            font-style: italic;
            font-size: 13px;
          }

          /* ── GENERATED NOTE ── */
          .generated-note {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            margin: 24px 0 0;
            font-weight: 500;
            letter-spacing: 0.2px;
          }

          /* ── FOOTER ── */
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
        ? `<div class="brand-mark"><div class="brand-mark-letters"><span class="brand-mark-t">${(agentCompanyName || 'A').charAt(0).toUpperCase()}</span></div><div class="brand-mark-sub">Travel Voucher</div></div>`
        : showBranding
          ? `<img src="${DEFAULT_FALLBACK_LOGO}" alt="Holiday Circuit Logo" class="brand-logo">`
          : `<div class="brand-mark"><div class="brand-mark-letters"><span class="brand-mark-t">T</span><span class="brand-mark-v">V</span></div><div class="brand-mark-sub">Travel Voucher</div></div>`
    }
            </div>
            <div class="brand-name">${hasAgentBranding ? (agentCompanyName || "Travel Voucher") : showBranding ? "Holiday Circuit" : "Travel Voucher"}</div>
          </div>

          <!-- TITLE BAR -->
          <div class="title-bar">Travel Voucher</div>

          <!-- BODY -->
          <div class="voucher-body">
            <!-- VOUCHER INFO -->
            <table class="metadata-card">
              <tr>
                <td class="label-cell">Voucher Number</td>
                <td class="value-cell">${data.voucherNumber || data.query}</td>
              </tr>
              <tr>
                <td class="label-cell">Destination</td>
                <td class="value-cell">${data.destination || "-"}</td>
              </tr>
              <tr>
                <td class="label-cell">Duration</td>
                <td class="value-cell">${data.duration || "-"}</td>
              </tr>
              <tr>
                <td class="label-cell">Passengers</td>
                <td class="value-cell">${data.passengers || "-"}</td>
              </tr>
            </table>

            <!-- GUEST INFO -->
            <table class="metadata-card">
              <tr>
                <td class="label-cell">Guest Details</td>
                <td class="value-cell">${data.name || data.guestName || "-"}</td>
              </tr>
              <tr>
                <td class="label-cell">Pax Details</td>
                <td class="value-cell">${passengerBreakup}</td>
              </tr>
              <tr>
                <td class="label-cell">Travel Date</td>
                <td class="value-cell">${formatTravelDate(resolvedTravelDate)}</td>
              </tr>
            </table>

            <!-- SERVICE DETAILS -->
            <div class="section-heading">Service Details</div>
            <table class="services-table">
              <thead>
                <tr>
                  <th width="16%">Type</th>
                  <th width="40%">Service Description</th>
                  <th width="18%" style="text-align:center;">Status</th>
                  <th width="26%">Confirmation No.</th>
                </tr>
              </thead>
              <tbody>
                ${serviceRowsHtml || '<tr class="empty-row"><td colspan="4">No services available</td></tr>'}
              </tbody>
            </table>

            <!-- GENERATED NOTE -->
            <div class="generated-note">
              This is a computer generated document. No signature/stamp required.
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
                <div class="footer-item">Phone: ${data.agencyPhone || '+91 8851346665'} | Email: ${data.agencyEmail || 'ops@holidaycircuit.com'}</div>
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
