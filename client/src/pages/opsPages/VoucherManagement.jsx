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

  const handleSendVoucher = async (id, branding = "with") => {
    try {
      setSendingVoucher(true);
      const { data } = await API.patch(`/ops/vouchers/${id}/send`, { branding });
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
    const statusNote = getVoucherStatusNote(voucher.services || [], voucher.status === "sent");
    const servicesMarkup = (voucher.services || [])
      .map(
        (service) =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${service.type || "Service"}</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${service.title || service.name || "Service missing"}</td><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${service.confirmation || "Pending"}</td></tr>`
      )
      .join("");

    const html = `
      <html>
        <body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;">
          <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            ${
              branding === "with"
                ? `<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-align:center;padding:28px 20px;"><h1 style="margin:0;font-size:28px;">Holiday Circuit</h1><p style="margin:8px 0 0;font-size:12px;letter-spacing:1px;">TRAVEL VOUCHER</p></div>`
                : `<div style="padding:22px 20px;border-bottom:1px solid #e5e7eb;text-align:center;"><h1 style="margin:0;font-size:24px;color:#111827;">Travel Voucher</h1></div>`
            }
            <div style="padding:24px;">
              <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:20px;">
                <div><div style="font-size:12px;color:#6b7280;">Voucher No.</div><div style="font-size:16px;font-weight:700;color:#111827;">${voucher.voucherNumber || voucher.query}</div></div>
                <div style="text-align:right;"><div style="font-size:12px;color:#6b7280;">Destination</div><div style="font-size:16px;font-weight:700;color:#111827;">${voucher.destination || "-"}</div></div>
              </div>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr><td style="padding:8px 0;color:#6b7280;">Guest Name</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">${voucher.name || "-"}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Passengers</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">${voucher.passengers || "-"}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Duration</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">${voucher.duration || "-"}</td></tr>
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
                <thead><tr><th style="text-align:left;padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">Type</th><th style="text-align:left;padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">Service</th><th style="text-align:right;padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:12px;">Confirmation</th></tr></thead>
                <tbody>${servicesMarkup || '<tr><td colspan="3" style="padding:12px 0;color:#6b7280;">No services available</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        </body>
      </html>`;

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
                duration={voucher.duration}
                passengers={voucher.passengers}
                services={voucher.services || []}
                branding={voucher.branding || "with"}
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
          onSend={(branding) => handleSendVoucher(selectedVoucher.id, branding)}
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
  duration,
  passengers,
  services,
  branding,
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
    duration,
    passengers,
    services,
    branding,
  };

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
              className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-xl text-sm"
            >
              <Send size={14} />
              Send to Agent
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
