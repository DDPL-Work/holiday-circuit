const VOUCHER_LOGO_URL =
  "https://res.cloudinary.com/dszadvuz6/image/upload/e_trim/v1777932524/unzssx1sjkrigbgldg7h.png";

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

export const buildVoucherHtml = (data, branding) => {
  const showBranding = branding === "with";
  const resolvedTravelDate = data.travelDate || data.date || null;
  const passengerBreakup = formatTravelerBreakup({
    adults: data.adults,
    children: data.children,
    travelerSummary: data.travelerSummary,
    passengers: data.passengers,
  });

  const serviceRowsHtml = (data.services || [])
    .map((service) => {
      const confirmation = service.confirmation || "Pending";
      const isConfirmed = confirmation && confirmation.toLowerCase() !== "pending";
      const confClass = isConfirmed ? "conf-cell" : "conf-cell pending";

      return `
        <tr>
          <td class="type-cell">${formatServiceTypeLabel(service.type)}</td>
          <td class="name-cell">${service.title || service.name || "Service details missing"}</td>
          <td class="${confClass}">${confirmation}${service.status ? `(${service.status})` : ""}</td>
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
          .brand-header::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 132px;
            height: 100%;
            background: #ff7a00;
            transform: skewX(-28deg);
            transform-origin: top left;
            z-index: 1;
          }
          .brand-header::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 68px;
            height: 100%;
            background: #ff7a00;
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
            font-family: 'Outfit', sans-serif;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -1px;
          }
          .brand-mark-t {
            color: #151d31;
          }
          .brand-mark-v {
            background: linear-gradient(180deg, #3f6ea5 0%, #1f3f67 55%, #101b31 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            margin-left: 1px;
          }
          .brand-mark-sub {
            margin-top: 2px;
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 7px;
            font-weight: 700;
            letter-spacing: 0.18em;
            color: #3b567b;
            text-transform: uppercase;
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
        <div class="voucher-container">
          <div class="brand-header">
            <div class="brand-logo-box">
              ${showBranding
      ? `<img src="${VOUCHER_LOGO_URL}" alt="Holiday Circuit Logo" class="brand-logo">`
      : `<div class="brand-mark"><div class="brand-mark-letters"><span class="brand-mark-t">T</span><span class="brand-mark-v">V</span></div><div class="brand-mark-sub">Travel Voucher</div></div>`
    }
            </div>
            <div class="brand-name">${showBranding ? "Holiday Circuit" : "Travel Voucher"}</div>
          </div>
          <div class="title-bar">Travel Voucher</div>
          <div class="voucher-body">
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

            <div class="section-heading">Service Details</div>
            <table class="services-table-card">
              <thead>
                <tr>
                  <th width="22%">Type</th>
                  <th width="53%">Service Description</th>
                  <th width="25%" style="text-align:right;">DMC Confirmation</th>
                </tr>
              </thead>
              <tbody>
                ${serviceRowsHtml || '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:18px;">No services available</td></tr>'}
              </tbody>
            </table>

            <div class="generated-note">
              This is a computer generated document. No signature/stamp required.
            </div>
          </div>

          <div class="brand-footer">
            <div class="footer-info">
              <div class="footer-item">Phone: +91 8851346665, +91 9971706003 | Email: ops@holidaycircuit.com | Web: www.holidaycircuit.com</div>
            </div>
            <div class="footer-address">
              2nd Floor, 632 Block B1, Janakpuri, New Delhi - 110058
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
