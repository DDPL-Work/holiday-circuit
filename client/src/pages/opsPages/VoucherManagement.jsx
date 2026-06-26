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
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import VoucherPreviewModal from "../../modal/VoucherPreviewModal";
import API from "../../utils/Api.js";
import { buildVoucherHtml } from "../../utils/voucherTemplate";

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
      voucher.destination?.toLowerCase().includes(term)
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

  const handleSendVoucher = async (id, branding = "with", dispatchChannel = "EMAIL", recipientEmail = "", recipientPhone = "") => {
    try {
      setSendingVoucher(true);
      const { data } = await API.patch(`/ops/vouchers/${id}/send`, {
        branding,
        dispatchChannel,
        email: recipientEmail,
        phone: recipientPhone,
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

  const handleDownloadVoucher = (voucher, branding) => {
    const html = buildVoucherHtml(voucher, branding);

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${voucher.voucherNumber || voucher.query}-${branding}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Voucher Management</h1>
            <p className="text-sm text-gray-500">
              Generate and manage travel vouchers for confirmed bookings
            </p>
          </div>

          <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-300 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <Download size={16} />
            Bulk Download
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard title="Ready to Generate" count={stats.ready} type="ready" />
          <StatCard title="Generated" count={stats.generated} type="generated" />
          <StatCard title="Sent to Agents" count={stats.sent} type="sent" />
        </div>

        <div className="relative mb-6 border border-gray-200 rounded-2xl shadow-sm p-4">
          <Search className="absolute left-8 top-7 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            placeholder="Search by Query ID, Guest Name, or Agent..."
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
                branding={voucher.branding || "with"}
                agentName={voucher.agentName}
                agentEmail={voucher.agentEmail}
                agentPhone={voucher.agentPhone}
                invoicePaymentStatus={voucher.invoicePaymentStatus}
                paymentVerificationStatus={voucher.paymentVerificationStatus}
                canSendVoucher={voucher.canSendVoucher}
                onPreview={handlePreview}
                onGenerate={handleGenerateVoucher}
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
          onSend={(branding, dispatchChannel, recipientEmail, recipientPhone) =>
            handleSendVoucher(selectedVoucher.id, branding, dispatchChannel, recipientEmail, recipientPhone)
          }
          onDownload={handleDownloadVoucher}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

function StatCard({ title, count, type }) {
  const theme = {
    ready: {
      card: "bg-gradient-to-br from-orange-50/80 via-white to-white hover:from-orange-100/40 hover:via-orange-50/10 hover:to-white border-orange-100 border-b-orange-500 shadow-sm shadow-orange-500/5",
      iconWrap: "bg-orange-100 text-orange-600 border border-orange-200/50",
    },
    generated: {
      card: "bg-gradient-to-br from-blue-50/80 via-white to-white hover:from-blue-100/40 hover:via-blue-50/10 hover:to-white border-blue-100 border-b-blue-500 shadow-sm shadow-blue-500/5",
      iconWrap: "bg-blue-100 text-blue-600 border border-blue-200/50",
    },
    sent: {
      card: "bg-gradient-to-br from-green-50/80 via-white to-white hover:from-green-100/40 hover:via-green-50/10 hover:to-white border-green-100 border-b-green-500 shadow-sm shadow-green-500/5",
      iconWrap: "bg-green-100 text-green-600 border border-green-200/50",
    },
  }[type] || {
    card: "bg-white border-gray-200 border-b-gray-400",
    iconWrap: "bg-gray-100 text-gray-600",
  };

  return (
    <div className={`border border-b-4 rounded-xl p-4 flex justify-between items-center hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out ${theme.card}`}>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h2 className="text-2xl font-bold text-gray-800 mt-1">{count}</h2>
      </div>
      <div className={`p-3 rounded-lg ${theme.iconWrap}`}>
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
  branding,
  agentName,
  agentEmail,
  agentPhone,
  invoicePaymentStatus,
  paymentVerificationStatus,
  canSendVoucher,
  onPreview,
  onGenerate,
}) {
  const statusMap = {
    ready: {
      label: "Ready to Generate",
      badge: "bg-orange-50 text-orange-650 border border-orange-100",
      icon: <FileText size={12} />,
      cardBg: "bg-gradient-to-br from-orange-50/20 via-white to-white border-orange-100/80 hover:border-orange-200/90 shadow-orange-500/5",
    },
    generated: {
      label: "Generated",
      badge: "bg-blue-50 text-blue-650 border border-blue-100",
      icon: <FileText size={12} />,
      cardBg: "bg-gradient-to-br from-blue-50/20 via-white to-white border-blue-100/80 hover:border-blue-200/90 shadow-blue-500/5",
    },
    sent: {
      label: "Sent to Agent",
      badge: "bg-green-50 text-green-655 border border-green-100",
      icon: <CheckCircle size={12} />,
      cardBg: "bg-gradient-to-br from-emerald-50/20 via-white to-white border-emerald-100/80 hover:border-emerald-200/90 shadow-emerald-500/5",
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
    <div className={`border shadow-sm rounded-2xl p-5 md:p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out ${statusMap[status].cardBg}`}>
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div className="flex gap-3 items-center">
          <h3 className="font-bold text-gray-900 text-lg tracking-tight">{query}</h3>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusMap[status].badge}`}>
            {statusMap[status].icon}
            {statusMap[status].label}
          </span>
        </div>
        
        {status === "sent" && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-655 bg-green-50/80 border border-green-100 px-2.5 py-1 rounded-full shadow-sm">
            <CheckCircle size={12} />
            Synced to Agent Portal
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-650">
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-gray-400" />
          <span className="font-medium text-gray-800">{name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-gray-400" />
          <span className="text-gray-700">{destination}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-gray-750 font-medium">{formatDisplayDate(date)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-t border-gray-100/60 pt-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Services:</span>
        <div className="flex flex-wrap gap-1.5">
          {(services || []).map((s, i) => (
            <span
              key={i}
              className="bg-gray-50 border border-gray-200 text-gray-750 text-xs px-2.5 py-1 rounded-full font-medium"
            >
              {typeof s === "string" ? s : s.title || s.name || "Service missing"}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2.5 border-t border-gray-100/60 pt-4">
        {status === "ready" && (
          <button
            onClick={() => onGenerate(id)}
            className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 hover:from-blue-950 hover:via-slate-900 hover:to-slate-950 text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 hover:shadow-md transition-all duration-300 ease-out"
          >
            <FileText size={15} />
            Generate Voucher
          </button>
        )}

        {status === "generated" && (
          <>
            <button
              onClick={() => onPreview(voucherPayload, "preview")}
              className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-750 px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-all duration-300 ease-out"
            >
              <Eye size={14} />
              Preview
            </button>

            <button
              onClick={() => onPreview(voucherPayload, "send")}
              disabled={!canSendFinalVoucher}
              title={canSendFinalVoucher ? "Send voucher to agent" : "Payment must be verified before sending the voucher"}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${
                canSendFinalVoucher
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-md"
                  : "cursor-not-allowed bg-gray-100 text-gray-400 border border-gray-200"
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
              className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-750 px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-all duration-300 ease-out"
            >
              <Eye size={14} />
              View
            </button>
            <button
              onClick={() => onPreview(voucherPayload, "view")}
              className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-750 px-5 py-2 rounded-full text-sm font-semibold shadow-sm transition-all duration-300 ease-out"
            >
              <Download size={14} />
              Download
            </button>
          </>
        )}
      </div>
    </div>
  );
}
