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
import VoucherPreviewModal from "../../modal/VoucherPreviewModal";
import { useState } from "react";

export default function VoucherManagement() {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const handlePreview = (data) => {
    setSelectedVoucher(data);
    setShowPreview(true);
  };

  return (
    <>
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Voucher Management
          </h1>
          <p className="text-sm text-gray-500">
            Generate and manage travel vouchers for confirmed bookings
          </p>
        </div>

        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Download size={16} />
          Bulk Download
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Ready to Generate" count="5" color="bg-orange-100 text-orange-600"/>
        <StatCard title="Generated" count="12" color="bg-blue-100 text-blue-600" />
        <StatCard title="Sent to Agents" count="34" color="bg-green-100 text-green-600" />
      </div>

      {/* Search */}
      <div className="relative mb-6 border border-gray-200 rounded-2xl shadow-sm p-4">
        <Search className="absolute left-8 top-7 text-gray-400" size={16} />
        <input
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
          placeholder="Search by Query ID, Guest Name, or Agent..."
        />
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {/* Ready to Generate */}
        <VoucherCard
          status="ready"
          query="QRY-2026-0232"
          name="Mr. Rajesh Kumar"
          destination="Maldives"
          date="Mar 20, 2026"
          services={["Hotel - HTL-ANT-78934", "Flight - FLT-EK-45678", "Transfer - TRF-SPD-2345"]}
          onPreview={handlePreview}
        />

        {/* Generated */}
        <VoucherCard
          status="generated"
          query="QRY-2026-0231"
          name="Mrs. Priya Sharma"
          destination="Paris, France"
          date="May 5, 2026"
          services={["Hotel - HTL-LMP-12345", "Flight - FLT-AF-67890"]}
          onPreview={handlePreview}
        />

        {/* Sent */}
        <VoucherCard
          status="sent"
          query="QRY-2026-0230"
          name="Mr. Vikram Singh"
          destination="Switzerland"
          date="Apr 20, 2026"
          services={["Hotel - HTL-GHZ-56789", "Flight - FLT-LX-98765"]}
          onPreview={handlePreview}
        />
      </div>
    </div>
    {showPreview && (<VoucherPreviewModal data={selectedVoucher} onClose={() => setShowPreview(false)}/>)}
   </>
  );
}

/* ---------------- Components ---------------- */

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

function VoucherCard({ status, query, name, destination, date, services,onPreview, }) {
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

  return (

    <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 flex flex-col gap-1 ">
      {/* Top Row */}
      <div className="flex gap-3 items-start">
        <h3 className="font-semibold text-gray-900">{query}</h3>

        <span
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusMap[status].badge}`}
        >
          {statusMap[status].icon}
          {statusMap[status].label}
        </span>
      </div>

      {/* Meta Info */}
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
          {date}
        </div>
      </div>

      {/* Services */}
      <div className="mt-3 flex items-center gap-2">
        <p className="text-sm text-gray-500 mb-1">Services:</p>
        <div className="flex flex-wrap gap-2">
          {services.map((s, i) => (
            <span
              key={i}
              className="border border-gray-300 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-2xl"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {status === "ready" && (
          <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1">
            <FileText size={15} />
            Generate Voucher
          </button>
        )}

        {status === "generated" && (
          <>
         <button onClick={() =>
        onPreview({ query, name, destination, date, services })
      } className="flex items-center gap-1 border border-gray-300 px-4 py-2 rounded-xl text-sm">
              <Eye size={14} />
              Preview
            </button>
            <button className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-xl text-sm">
              <Send size={14} />
              Send to Agent
            </button>
          </>
        )}

        {status === "sent" && (
          <>
            <button onClick={() =>
        onPreview({ query, name, destination, date, services })
      } className="flex items-center gap-1 border border-gray-300 px-4 py-2 rounded-xl text-sm">
              <Eye size={14} />
              View
            </button>
            <button className="flex items-center gap-1 border  border-gray-300  px-4 py-2 rounded-xl text-sm">
              <Download size={14} />
              Download
            </button>
          </>
        )}
      </div>

      {/* Synced text */}
      {status === "sent" && (
        <div className="mt-3 flex items-center  gap-1 text-sm text-green-600">
          <CheckCircle size={14} />
          Synced to Agent Portal
        </div>
      )}
    </div>
    
  );
}