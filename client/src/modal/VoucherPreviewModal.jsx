import React, { useMemo, useState, useEffect } from "react";
import { X, Download, Send, Mail, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  buildVoucherHtml,
  formatServiceTypeLabel,
  getVoucherStatusNote,
} from "../utils/voucherTemplate";

const voucherDispatchOptions = [
  {
    key: "EMAIL",
    label: "Email",
    description: "Send voucher directly to the agent's email inbox",
    icon: Mail,
    colorClass: "bg-[#2563eb]",
  },
  {
    key: "WHATSAPP",
    label: "WhatsApp",
    description: "Open WhatsApp with the voucher link ready to share",
    icon: MessageCircle,
    colorClass: "bg-[#16a34a]",
  },
  {
    key: "PDF",
    label: "PDF Download",
    description: "Download the voucher HTML to your system",
    icon: Download,
    colorClass: "bg-[#f59e0b]",
  },
];

const normalizeWhatsAppPhoneNumber = (value = "") => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const VoucherDispatchModal = ({
  selectedChannel,
  recipientEmail,
  recipientPhone,
  onSelectChannel,
  onEmailChange,
  onPhoneChange,
  onClose,
  onConfirm,
  isSubmitting,
  agentName,
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-8 md:py-10">
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="w-full max-w-[400px] overflow-hidden rounded-[28px] border border-[#e2e8f0] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.25)]"
    >
      {/* Header with soft navy gradient */}
      <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#f0f4ff_0%,#f8faff_52%,#ffffff_100%)] px-5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white shadow-md">
              <Send size={15} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                Send Travel Voucher
              </p>
              <h3 className="mt-0.5 text-[17px] font-semibold leading-none text-slate-900">
                Share with {agentName || 'Agent'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="px-5 py-3">
        {/* Navy & Black Gradient Option Cards */}
        <div className="space-y-2">
          {voucherDispatchOptions.map((option) => {
            const Icon = option.icon;
            const isActive = selectedChannel === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelectChannel(option.key)}
                className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-2.5 text-left transition ${
                  isActive
                    ? "border-slate-800 bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)]"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] ${
                    isActive
                      ? "border-white/15 bg-white/10 text-white"
                      : `${option.colorClass} text-white`
                  }`}
                >
                  <Icon size={14} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${isActive ? "text-white" : "text-slate-900"}`}>
                    {option.label}
                  </span>
                  <span className={`mt-0.5 block text-[11px] leading-4 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <AnimatePresence initial={false} mode="wait">
          {selectedChannel === "EMAIL" ? (
            <motion.div
              key="send-email-input"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#1e3a8a] text-white">
                    <Mail size={11} />
                  </span>
                  Agent Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="Enter agent email"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>
            </motion.div>
          ) : selectedChannel === "WHATSAPP" ? (
            <motion.div
              key="send-whatsapp-input"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2.5">
                <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#16a34a] text-white">
                    <MessageCircle size={11} />
                  </span>
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="Enter WhatsApp number"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Soft navy explanation block */}
        <div className="mt-2.5 rounded-2xl border border-blue-100/70 bg-blue-50/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-600">
              {selectedChannel === "EMAIL" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#1e3a8a] text-white">
                  <Mail size={12} />
                </span>
              ) : selectedChannel === "WHATSAPP" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#16a34a] text-white">
                  <MessageCircle size={12} />
                </span>
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-[20px] bg-[#f59e0b] text-white">
                  <Download size={12} />
                </span>
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">What will happen</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {selectedChannel === "EMAIL"
                  ? "The travel voucher with all confirmed service information will be sent directly to the agent's email."
                  : selectedChannel === "WHATSAPP"
                    ? "WhatsApp will open with a ready-to-share message linking to the agent's online travel voucher."
                    : "A clean travel voucher copy will be downloaded in HTML format for offline sharing."}
              </p>
            </div>
          </div>
        </div>

        {/* Actions Button Panel */}
        <div className="mt-3 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-full bg-gradient-to-br from-[#1e3a8a] via-[#0f172a] to-black px-6 py-2.5 text-sm font-semibold text-white transition hover:from-[#1d4ed8] hover:to-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70 shadow-[0_4px_15px_rgba(30,58,138,0.25)]"
          >
            {isSubmitting
              ? selectedChannel === "EMAIL"
                ? "Sending..."
                : "Preparing..."
              : selectedChannel === "EMAIL"
                ? "Send Email"
                : selectedChannel === "WHATSAPP"
                  ? "Open WhatsApp"
                  : "Download"}
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

const VoucherPreviewModal = ({
  data,
  onClose,
  onSend,
  onDownload,
  mode = "preview",
  loading = false,
}) => {
  const [brandingSelections, setBrandingSelections] = useState({});
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedDispatchChannel, setSelectedDispatchChannel] = useState("EMAIL");
  const [dispatchRecipientEmail, setDispatchRecipientEmail] = useState(data?.agentEmail || "agent@holidaycircuit.com");
  const [dispatchRecipientPhone, setDispatchRecipientPhone] = useState(data?.agentPhone || "9876543210");

  useEffect(() => {
    if (data) {
      setDispatchRecipientEmail(data.agentEmail || "agent@holidaycircuit.com");
      setDispatchRecipientPhone(data.agentPhone || "9876543210");
    }
  }, [data]);

  const voucherKey = data?.voucherNumber || data?.query || "default";

  const isSentView = mode === "view";
  const branding = brandingSelections[voucherKey] ?? data?.branding ?? "with";
  const statusNote = useMemo(
    () => getVoucherStatusNote(data?.services || [], data?.status === "sent" || isSentView),
    [data?.services, data?.status, isSentView],
  );
  const footerText = useMemo(
    () => `Voucher will ${branding === "with" ? "include" : "not include"} branding`,
    [branding],
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

  const handleDispatchConfirm = async () => {
    if (selectedDispatchChannel === "EMAIL" && !String(dispatchRecipientEmail || "").trim()) {
      alert("Please enter a valid email address");
      return;
    }
    if (selectedDispatchChannel === "WHATSAPP" && !normalizeWhatsAppPhoneNumber(dispatchRecipientPhone)) {
      alert("Please enter a valid phone number");
      return;
    }

    try {
      if (onSend) {
        await onSend(
          branding,
          selectedDispatchChannel,
          dispatchRecipientEmail,
          dispatchRecipientPhone
        );
      }

      if (selectedDispatchChannel === "WHATSAPP") {
        const normalizedPhone = normalizeWhatsAppPhoneNumber(dispatchRecipientPhone);
        if (normalizedPhone) {
          const msg = `Hello ${data.agentName || 'Agent'}, here is the voucher for your query ${data.query || data.voucherNumber}. Direct Link: ${window.location.origin}/voucher/${data.id}`;
          const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(msg)}`;
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }
      } else if (selectedDispatchChannel === "PDF") {
        handleDownload();
      }

      setShowDispatchModal(false);
    } catch (err) {
      console.error("Voucher dispatch confirm failed", err);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px] ${showDispatchModal ? "hidden" : ""}`}>
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

          <div className="custom-scroll flex-1 overflow-y-auto px-4 py-3">
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
                <p className="font-medium text-gray-900">{data.name || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Passengers</p>
                <p className="font-medium text-gray-900">{data.passengers || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Destination</p>
                <p className="font-medium text-gray-900">{data.destination || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">{data.duration || "-"}</p>
              </div>
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
                      {formatServiceTypeLabel(service.type)}
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
                        <p className="text-gray-900">
                          {service.confirmation || "Pending"}
                          {service.status ? ` (${service.status})` : ""}
                        </p>
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
                  onClick={() => setShowDispatchModal(true)}
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

      <AnimatePresence>
        {showDispatchModal && (
          <VoucherDispatchModal
            selectedChannel={selectedDispatchChannel}
            recipientEmail={dispatchRecipientEmail}
            recipientPhone={dispatchRecipientPhone}
            onSelectChannel={setSelectedDispatchChannel}
            onEmailChange={setDispatchRecipientEmail}
            onPhoneChange={setDispatchRecipientPhone}
            onClose={() => setShowDispatchModal(false)}
            onConfirm={handleDispatchConfirm}
            isSubmitting={loading}
            agentName={data.agentName}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default VoucherPreviewModal;
