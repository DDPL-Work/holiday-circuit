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

          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Download size={16} />
            Bulk Download
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard title="Ready to Generate" count={stats.ready} color="bg-orange-100 text-orange-600" />
          <StatCard title="Generated" count={stats.generated} color="bg-blue-100 text-blue-600" />
          <StatCard title="Sent to Agents" count={stats.sent} color="bg-green-100 text-green-600" />
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
          <div className="space-y-4">
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

function StatCard({ title, count, color }) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h2 className="text-2xl font-semibold">{count}</h2>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
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
      badge: "bg-orange-100 text-orange-600",
      icon: <FileText size={12} />,
    },
    generated: {
      label: "Generated",
      badge: "bg-blue-100 text-blue-600",
      icon: <FileText size={12} />,
    },
    sent: {
      label: "Sent to Agent",
      badge: "bg-green-100 text-green-600",
      icon: <CheckCircle size={12} />,
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
    <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 flex flex-col gap-1">
      <div className="flex gap-3 items-start">
        <h3 className="font-semibold text-gray-900">{query}</h3>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusMap[status].badge}`}>
          {statusMap[status].icon}
          {statusMap[status].label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <User size={14} />
          {name}
        </div>
        <div className="flex items-center gap-1">
          <MapPin size={14} />
          {destination}
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          {formatDisplayDate(date)}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <p className="text-sm text-gray-500 mb-1">Services:</p>
        <div className="flex flex-wrap gap-2">
          {(services || []).map((s, i) => (
            <span
              key={i}
              className="border border-gray-300 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-2xl"
            >
              {typeof s === "string" ? s : s.title || s.name || "Service missing"}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {status === "ready" && (
          <button
            onClick={() => onGenerate(id)}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1"
          >
            <FileText size={15} />
            Generate Voucher
          </button>
        )}

        {status === "generated" && (
          <>
            <button
              onClick={() => onPreview(voucherPayload, "preview")}
              className="flex items-center gap-1 border border-gray-300 px-4 py-2 rounded-xl text-sm"
            >
              <Eye size={14} />
              Preview
            </button>

            <button
              onClick={() => onPreview(voucherPayload, "send")}
              disabled={!canSendFinalVoucher}
              title={canSendFinalVoucher ? "Send voucher to agent" : "Payment must be verified before sending the voucher"}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm ${
                canSendFinalVoucher
                  ? "bg-green-600 text-white"
                  : "cursor-not-allowed bg-gray-200 text-gray-500"
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
              className="flex items-center gap-1 border border-gray-300 px-4 py-2 rounded-xl text-sm"
            >
              <Eye size={14} />
              View
            </button>
            <button
              onClick={() => onPreview(voucherPayload, "view")}
              className="flex items-center gap-1 border border-gray-300 px-4 py-2 rounded-xl text-sm"
            >
              <Download size={14} />
              Download
            </button>
          </>
        )}
      </div>

      {status === "sent" && (
        <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
          <CheckCircle size={14} />
          Synced to Agent Portal
        </div>
      )}
    </div>
  );
}
