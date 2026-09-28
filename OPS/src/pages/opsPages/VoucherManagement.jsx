import {
  Download,
  Search,
  FileText,
  Eye,
  Send,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  Package,
  Building2,
  Sparkles,
  Layers,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import VoucherPreviewModal from "../../modal/VoucherPreviewModal";
import OfflinePartnerConfirmationModal from "../../modal/OfflinePartnerConfirmationModal";
import API from "../../utils/Api.js";
import { buildVoucherHtml, exportVoucherAsPdf } from "../../utils/voucherTemplate";

const formatDisplayDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function VoucherManagement() {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [modalMode, setModalMode] = useState("preview");
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [selectedOfflineVoucher, setSelectedOfflineVoucher] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState({ ready: 0, generated: 0, sent: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingVoucher, setSendingVoucher] = useState(false);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/ops/vouchers");
      setVouchers(data.vouchers || []);
      setStats(data.stats || { ready: 0, generated: 0, sent: 0 });
    } catch (error) {
      console.error("Failed to fetch vouchers", error);
      toast.error("Failed to fetch vouchers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const filteredVouchers = vouchers.filter((voucher) => {
    const term = search.toLowerCase();

    return (
      voucher.query?.toLowerCase().includes(term) ||
      voucher.name?.toLowerCase().includes(term) ||
      voucher.agentName?.toLowerCase().includes(term) ||
      voucher.destination?.toLowerCase().includes(term) ||
      voucher.businessPartnerName?.toLowerCase().includes(term)
    );
  });

  const handleGenerateVoucher = async (id) => {
    try {
      const { data } = await API.patch(`/ops/vouchers/${id}/generate`);
      toast.success(data?.message || "Voucher generated successfully");
      await fetchVouchers();
    } catch (error) {
      console.error("Failed to generate voucher", error);
      toast.error(error?.response?.data?.message || "Failed to generate voucher");
    }
  };

  const handleSendVoucher = async (id, branding = "with", dispatchChannel = "EMAIL", recipientEmail = "", recipientPhone = "", terms = null) => {
    try {
      setSendingVoucher(true);
      const { data } = await API.patch(`/ops/vouchers/${id}/send`, {
        branding,
        dispatchChannel,
        email: recipientEmail,
        phone: recipientPhone,
        termsAndConditions: terms,
      });
      toast.success(data?.message || "Voucher sent successfully");
      setShowPreview(false);
      await fetchVouchers();
    } catch (error) {
      console.error("Failed to send voucher", error);
      toast.error(error?.response?.data?.message || "Failed to send voucher");
    } finally {
      setSendingVoucher(false);
    }
  };

  const handlePreview = (data, mode = "preview") => {
    setSelectedVoucher(data);
    setModalMode(mode);
    setShowPreview(true);
  };

  const handleOpenOfflineModal = (data) => {
    setSelectedOfflineVoucher(data);
    setShowOfflineModal(true);
  };

  const handleDownloadVoucher = async (voucher, branding = "with", terms = null) => {
    const toastId = toast.loading("Generating voucher PDF...");
    try {
      const opsBranding = {
        name: "Holiday Circuit",
        logo: "",
      };
      const enrichedVoucher = terms ? { ...voucher, termsAndConditions: terms } : voucher;
      const { fileName } = await exportVoucherAsPdf(enrichedVoucher, branding, opsBranding);
      toast.success(`Downloaded ${fileName}`, { id: toastId });
    } catch (err) {
      console.error("Failed to download voucher PDF", err);
      toast.error("Failed to generate voucher PDF", { id: toastId });
    }
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Voucher Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Generate and manage travel vouchers for confirmed bookings
            </p>
          </div>

          {/* Finance Verification Note */}
          <div className="flex items-start sm:items-center gap-2.5 rounded-lg border border-amber-200/90 bg-gradient-to-r from-amber-50/90 to-amber-100/50 px-3.5 py-2 text-xs text-amber-950 shadow-2xs max-w-xl">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-200/80 text-amber-800">
              <ShieldCheck size={14} className="stroke-[2.5]" />
            </div>
            <div className="leading-snug text-[11.5px]">
              <span className="font-extrabold text-amber-900">Finance Verification:</span>{" "}
              <span className="text-amber-900 font-medium">
                Bookings appear in <span className="font-bold text-amber-950">"Ready to Generate"</span> once finance verifies the agent payment (Partially Paid or Full Paid).
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard title="Ready to Generate" count={stats.ready} type="ready" />
          <StatCard title="Generated" count={stats.generated} type="generated" />
          <StatCard title="Sent to Agents" count={stats.sent} type="sent" />
        </div>

        <div className="relative mb-6 border border-gray-200 rounded-lg bg-white shadow-xs p-3">
          <Search className="absolute left-6 top-5.5 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none"
            placeholder="Search by Query ID, Guest Name, Agent, or Partner..."
          />
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading vouchers...</div>
        ) : (
          <div className="space-y-6">
            {filteredVouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                id={voucher.id}
                status={voucher.status}
                query={voucher.query}
                voucherNumber={voucher.voucherNumber}
                name={voucher.name}
                destination={voucher.destination}
                date={voucher.date}
                travelDate={voucher.travelDate}
                duration={voucher.duration}
                passengers={voucher.passengers}
                adults={voucher.adults}
                children={voucher.children}
                travelerSummary={voucher.travelerSummary}
                services={voucher.services || []}
                quotationServices={voucher.quotationServices || []}
                existingConfirmation={voucher.existingConfirmation || null}
                isOfflinePartner={voucher.isOfflinePartner}
                businessPartnerName={voucher.businessPartnerName}
                branding={voucher.branding || "with"}
                agentName={voucher.agentName}
                agentEmail={voucher.agentEmail}
                agentPhone={voucher.agentPhone}
                invoicePaymentStatus={voucher.invoicePaymentStatus}
                paymentVerificationStatus={voucher.paymentVerificationStatus}
                canSendVoucher={voucher.canSendVoucher}
                onPreview={handlePreview}
                onGenerate={handleGenerateVoucher}
                onOpenOfflineModal={handleOpenOfflineModal}
              />
            ))}
          </div>
        )}
      </div>

      {showPreview && (
        <VoucherPreviewModal
          data={selectedVoucher}
          mode={modalMode}
          loading={sendingVoucher}
          onSend={(branding, dispatchChannel, recipientEmail, recipientPhone, terms) =>
            handleSendVoucher(selectedVoucher.id, branding, dispatchChannel, recipientEmail, recipientPhone, terms)
          }
          onDownload={handleDownloadVoucher}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showOfflineModal && selectedOfflineVoucher && (
        <OfflinePartnerConfirmationModal
          voucherData={selectedOfflineVoucher}
          onClose={() => setShowOfflineModal(false)}
          onSuccess={async () => {
            await fetchVouchers();
          }}
        />
      )}
    </>
  );
}

function StatCard({ title, count, type }) {
  const theme = {
    ready: {
      card: "bg-gradient-to-br from-orange-50/80 via-white to-white hover:from-orange-100/40 hover:via-orange-50/10 hover:to-white border-orange-100 border-b-orange-500 shadow-xs shadow-orange-500/5",
      iconWrap: "bg-orange-100 text-orange-600 border border-orange-200/50",
    },
    generated: {
      card: "bg-gradient-to-br from-blue-50/80 via-white to-white hover:from-blue-100/40 hover:via-blue-50/10 hover:to-white border-blue-100 border-b-blue-500 shadow-xs shadow-blue-500/5",
      iconWrap: "bg-blue-100 text-blue-600 border border-blue-200/50",
    },
    sent: {
      card: "bg-gradient-to-br from-green-50/80 via-white to-white hover:from-green-100/40 hover:via-green-50/10 hover:to-white border-green-100 border-b-green-500 shadow-xs shadow-green-500/5",
      iconWrap: "bg-green-100 text-green-600 border border-green-200/50",
    },
  }[type] || {
    card: "bg-white border-gray-200 border-b-gray-400",
    iconWrap: "bg-gray-100 text-gray-600",
  };

  return (
    <div className={`border border-b-4 rounded-lg p-4 flex justify-between items-center hover:shadow-xs transition-all duration-300 ease-out ${theme.card}`}>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h2 className="text-2xl font-bold text-gray-800 mt-1">{count}</h2>
      </div>
      <div className={`p-2.5 rounded-md ${theme.iconWrap}`}>
        <FileText size={18} />
      </div>
    </div>
  );
}

function VoucherCard({
  id,
  status,
  query,
  voucherNumber,
  name,
  destination,
  date,
  travelDate,
  duration,
  passengers,
  adults,
  children,
  travelerSummary,
  services,
  quotationServices,
  existingConfirmation,
  isOfflinePartner,
  businessPartnerName,
  branding,
  agentName,
  agentEmail,
  agentPhone,
  invoicePaymentStatus,
  paymentVerificationStatus,
  canSendVoucher,
  onPreview,
  onGenerate,
  onOpenOfflineModal,
}) {
  const statusMap = {
    ready: {
      label: "Ready to Generate",
      badge: "bg-amber-100/90 text-amber-900 border border-amber-300/80 font-bold",
      icon: <FileText size={12} className="text-amber-700" />,
      cardBg: "bg-gradient-to-br from-amber-100/70 via-orange-50/40 to-white border-amber-200/90 hover:border-amber-300 shadow-2xs",
    },
    generated: {
      label: "Generated",
      badge: "bg-indigo-100/90 text-indigo-900 border border-indigo-300/80 font-bold",
      icon: <FileText size={12} className="text-indigo-700" />,
      cardBg: "bg-gradient-to-br from-indigo-100/70 via-purple-50/40 to-white border-indigo-200/90 hover:border-indigo-300 shadow-2xs",
    },
    sent: {
      label: "Sent to Agent",
      badge: "bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 font-bold",
      icon: <CheckCircle size={12} className="text-emerald-700" />,
      cardBg: "bg-gradient-to-br from-emerald-100/70 via-teal-50/40 to-white border-emerald-200/90 hover:border-emerald-300 shadow-2xs",
    },
  };

  const voucherPayload = {
    id,
    query,
    voucherNumber,
    name,
    destination,
    date,
    travelDate,
    duration,
    passengers,
    adults,
    children,
    travelerSummary,
    services,
    quotationServices,
    existingConfirmation,
    isOfflinePartner,
    businessPartnerName,
    branding,
    agentName,
    agentEmail,
    agentPhone,
    invoicePaymentStatus,
    paymentVerificationStatus,
    canSendVoucher,
  };
  const canSendFinalVoucher = Boolean(canSendVoucher);

  return (
    <div className={`border rounded-lg p-5 md:p-6 flex flex-col gap-4.5 transition-all duration-300 ${statusMap[status].cardBg}`}>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2.5 items-center flex-wrap">
          <h3 className="font-extrabold text-slate-900 text-xl tracking-tight font-sans">{query}</h3>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md ${statusMap[status].badge}`}>
            {statusMap[status].icon}
            {statusMap[status].label}
          </span>

          {isOfflinePartner && (
            <span className="flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300/90 uppercase tracking-wider shadow-2xs">
              <Building2 size={13} className="text-amber-700" />
              <span>Offline Partner{businessPartnerName ? `: ${businessPartnerName}` : ""}</span>
            </span>
          )}
        </div>
        
        {status === "sent" && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300/70 px-2.5 py-1 rounded-md shadow-2xs">
            <CheckCircle size={13} className="text-emerald-600" />
            Synced to Agent Portal
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 rounded-md bg-white/90 border border-slate-200/80 px-3 py-1.5 font-bold text-slate-800 shadow-2xs">
          <User size={13} className="text-indigo-600 shrink-0" />
          <span>{name}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-white/90 border border-slate-200/80 px-3 py-1.5 font-bold text-slate-800 shadow-2xs">
          <MapPin size={13} className="text-purple-600 shrink-0" />
          <span>{destination}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-white/90 border border-slate-200/80 px-3 py-1.5 font-bold text-slate-800 shadow-2xs">
          <Calendar size={13} className="text-orange-600 shrink-0" />
          <span>{formatDisplayDate(date)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 border-t border-slate-200/70 pt-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 min-w-[95px] pt-1">
          <Package size={13} className="text-indigo-600 shrink-0" />
          <span>Services:</span>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {(services || []).map((s, i) => {
            const title = typeof s === "string" ? s : s.title || s.name || "Service missing";
            const cnf = s.confirmation;
            const isConfirmed = cnf && cnf !== "Pending";

            return (
              <div
                key={i}
                className={`inline-flex items-center gap-1.5 border text-xs px-2.5 py-1.5 rounded-md font-semibold shadow-2xs transition ${
                  isConfirmed
                    ? "bg-emerald-50/90 border-emerald-300 text-emerald-900"
                    : "bg-white/95 border-slate-200/90 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40"
                }`}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold ${
                  isConfirmed ? "bg-emerald-200 text-emerald-800" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {i + 1}
                </span>
                <span>{title}</span>
                {isConfirmed && (
                  <span className="text-[9.5px] font-mono font-bold text-emerald-700 ml-0.5">
                    ({cnf})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex flex-wrap gap-2.5 border-t border-slate-200/70 pt-4 items-center">
        {/* Button for Offline Partner Service Confirmation (All services in 1 modal) */}
        {isOfflinePartner ? (
          <button
            onClick={() => onOpenOfflineModal(voucherPayload)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Open all services in one modal to add/edit confirmation numbers and 24/7 support details"
          >
            <Building2 size={15} />
            <span>{status === "ready" ? "Confirm Offline Services" : "Edit Service Confirmations"}</span>
          </button>
        ) : null}

        {status === "ready" && (
          <button
            onClick={() => onGenerate(id)}
            className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-950 hover:via-slate-900 hover:to-slate-950 text-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <FileText size={15} />
            Generate Voucher
          </button>
        )}

        {status === "generated" && (
          <>
            <button
              onClick={() => onPreview(voucherPayload, "preview")}
              className="flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Eye size={14} />
              Preview
            </button>

            <button
              onClick={() => onPreview(voucherPayload, "send")}
              disabled={!canSendFinalVoucher}
              title={canSendFinalVoucher ? "Send voucher to agent" : "Payment must be verified before sending the voucher"}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all shadow-xs active:scale-95 ${
                canSendFinalVoucher
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs cursor-pointer"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              <Send size={14} />
              {canSendFinalVoucher ? "Send to Agent" : "Awaiting Verification"}
            </button>
          </>
        )}

        {status === "sent" && (
          <>
            <button
              onClick={() => onPreview(voucherPayload, "view")}
              className="flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Eye size={14} />
              View
            </button>
          </>
        )}
      </div>
    </div>
  );
}

