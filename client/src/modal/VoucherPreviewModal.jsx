import React, { useMemo, useState } from "react";
import { X, Download, Send } from "lucide-react";

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

const buildVoucherHtml = (data, branding) => {
  const showBranding = branding === "with";
  const statusNote = getVoucherStatusNote(data.services || [], data?.status === "sent");
  const serviceRows = (data.services || [])
    .map(
      (service) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${service.type || "Service"}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${service.title || service.name || "Service missing"}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${service.confirmation || "Pending"}</td>
        </tr>
      `
    )
    .join("");

  return `
    <html>
      <head>
        <title>${data.voucherNumber || data.query}</title>
      </head>
      <body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;">
        <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          ${
            showBranding
              ? `<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-align:center;padding:28px 20px;">
                  <h1 style="margin:0;font-size:28px;">Holiday Circuit</h1>
                  <p style="margin:8px 0 0;font-size:12px;letter-spacing:1px;">TRAVEL VOUCHER</p>
                </div>`
              : `<div style="padding:22px 20px;border-bottom:1px solid #e5e7eb;text-align:center;">
                  <h1 style="margin:0;font-size:24px;color:#111827;">Travel Voucher</h1>
                </div>`
          }
          <div style="padding:24px;">
            <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:20px;">
              <div>
                <div style="font-size:12px;color:#6b7280;">Voucher No.</div>
                <div style="font-size:16px;font-weight:700;color:#111827;">${data.voucherNumber || data.query}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px;color:#6b7280;">Destination</div>
                <div style="font-size:16px;font-weight:700;color:#111827;">${data.destination || "-"}</div>
              </div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:8px 0;color:#6b7280;">Guest Name</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">${data.name || "-"}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Passengers</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">${data.passengers || "-"}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Duration</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">${data.duration || "-"}</td></tr>
            </table>
            <div style="margin:0 0 16px;border:1px solid ${
              statusNote.tone === "red" ? "#fecaca" : "#bbf7d0"
            };background:${statusNote.tone === "red" ? "#fef2f2" : "#f0fdf4"};border-radius:14px;padding:12px 14px;">
              <p style="margin:0;font-size:11px;font-weight:700;color:${
                statusNote.tone === "red" ? "#b91c1c" : "#15803d"
              };text-transform:uppercase;letter-spacing:0.04em;">${statusNote.title}</p>
              <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:${
                statusNote.tone === "red" ? "#991b1b" : "#166534"
              };">${statusNote.message}</p>
            </div>
            <h3 style="margin:0 0 12px;color:#111827;">Service Details</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="text-align:left;padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">Type</th>
                  <th style="text-align:left;padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">Service</th>
                  <th style="text-align:right;padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">Confirmation</th>
                </tr>
              </thead>
              <tbody>
                ${serviceRows || '<tr><td colspan="3" style="padding:12px 0;color:#6b7280;">No services available</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
};

const VoucherPreviewModal = ({
  data,
  onClose,
  onSend,
  onDownload,
  mode = "preview",
  loading = false,
}) => {
  const [brandingSelections, setBrandingSelections] = useState({});
  const voucherKey = data?.voucherNumber || data?.query || "default";

  const isSentView = mode === "view";
  const branding = brandingSelections[voucherKey] ?? data?.branding ?? "with";
  const statusNote = useMemo(
    () => getVoucherStatusNote(data?.services || [], data?.status === "sent" || isSentView),
    [data?.services, data?.status, isSentView]
  );
  const footerText = useMemo(
    () => `Voucher will ${branding === "with" ? "include" : "not include"} branding`,
    [branding]
  );

  if (!data) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload(data, branding);
      return;
    }

    const html = buildVoucherHtml(data, branding);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.voucherNumber || data.query}-${branding}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px]">
      <div className="flex min-h-full items-center justify-center px-3 py-2">
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[94vh] w-full max-w-[445px] flex-col overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-2xl animate-scaleIn"
        >
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[14px] font-semibold text-gray-900">Voucher Preview - {data.query}</h2>
                <p className="text-[10px] text-gray-500">
                  Review and {mode === "send" ? "send" : "download"} the voucher for {data.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-red-600 transition hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            className="custom-scroll flex-1 overflow-y-auto px-4 py-3"
          >
            <div className="rounded-[18px] bg-gradient-to-r from-blue-600 to-blue-800 py-4 text-center text-white">
              <h1 className="text-base font-semibold">{branding === "with" ? "Holiday Circuit" : "Travel Voucher"}</h1>
              <p className="mt-1 text-[10px]">{branding === "with" ? "Travel Voucher" : "Clean Voucher Copy"}</p>

              <div className="mt-2 inline-block rounded-xl bg-white/20 px-6 py-1.5">
                <p className="text-[10px]">Voucher No.</p>
                <p className="text-xs font-semibold">{data.voucherNumber || data.query}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 text-[11px]">
              <div>
                <p className="text-gray-500">Guest Name</p>
                <p className="font-medium text-gray-900">{data.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Passengers</p>
                <p className="font-medium text-gray-900">{data.passengers}</p>
              </div>
              <div>
                <p className="text-gray-500">Destination</p>
                <p className="font-medium text-gray-900">{data.destination}</p>
              </div>
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">{data.duration}</p>
              </div>
            </div>

            <div
              className={`mt-3 rounded-[14px] border px-3 py-2.5 ${
                statusNote.tone === "red"
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.04em] ${
                  statusNote.tone === "red" ? "text-red-700" : "text-green-700"
                }`}
              >
                {statusNote.title}
              </p>
              <p
                className={`mt-1 text-[11px] leading-5 ${
                  statusNote.tone === "red" ? "text-red-700" : "text-green-700"
                }`}
              >
                {statusNote.message}
              </p>
            </div>

            <div className="mt-3">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Service Details</h3>
              <div className="space-y-2">
                {(data.services || []).map((service, index) => (
                  <div
                    key={index}
                    className="rounded-[14px] border border-gray-200 bg-sky-50 px-3 py-2.5"
                  >
                    <p className="mb-1 text-sm font-medium text-gray-900">
                      {(service.type?.charAt(0).toUpperCase() + service.type?.slice(1)) || "Service"}
                    </p>
                    <div className="flex justify-between gap-3 text-[11px]">
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-500">Service</p>
                        <p className="truncate text-gray-900">
                          {service.title || service.name || "Service missing"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">Confirmation</p>
                        <p className="text-gray-900">{service.confirmation || "Pending"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Template Options</h3>

              <label className={`mb-2 flex items-start gap-2 rounded-[14px] border border-gray-200 bg-white p-2.5 ${isSentView ? "opacity-70" : "cursor-pointer"}`}>
                <input
                  type="radio"
                  name="branding"
                  checked={branding === "with"}
                  onChange={() =>
                    setBrandingSelections((prev) => ({
                      ...prev,
                      [voucherKey]: "with",
                    }))
                  }
                  disabled={isSentView}
                />
                <div>
                  <p className="text-xs font-medium text-gray-900">With Branding</p>
                  <p className="text-[10px] text-gray-500">Include company logo and branded header</p>
                </div>
              </label>

              <label className={`flex items-start gap-2 rounded-[14px] border border-gray-200 bg-white p-2.5 ${isSentView ? "opacity-70" : "cursor-pointer"}`}>
                <input
                  type="radio"
                  name="branding"
                  checked={branding === "without"}
                  onChange={() =>
                    setBrandingSelections((prev) => ({
                      ...prev,
                      [voucherKey]: "without",
                    }))
                  }
                  disabled={isSentView}
                />
                <div>
                  <p className="text-xs font-medium text-gray-900">Without Branding</p>
                  <p className="text-[10px] text-gray-500">Clean version for agent-facing share</p>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <p className="text-[10px] text-gray-500">{footerText}</p>

            <div className="mt-2 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-[12px] border border-gray-300 bg-white px-4 py-2 text-[11px] font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Close
              </button>
              {mode === "send" ? (
                <button
                  onClick={() => onSend?.(branding)}
                  disabled={loading || !statusNote.canSend}
                  className="flex flex-1 items-center justify-center gap-1 rounded-[12px] bg-green-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  <Send size={13} />
                  {loading ? "Sending..." : statusNote.canSend ? "Send to Agent" : "Blocked"}
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="flex flex-1 items-center justify-center gap-1 rounded-[12px] bg-green-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-green-700"
                >
                  <Download size={13} />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherPreviewModal;
