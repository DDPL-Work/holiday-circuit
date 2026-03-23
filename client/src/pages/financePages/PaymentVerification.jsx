import React, { useState } from 'react';
import { 
  FileText, Clock, CheckCircle2, XCircle, DollarSign, 
  Search, ChevronDown, Eye, FileDown, Image as ImageIcon,
  Download, Check, X
} from 'lucide-react';

// --- MOCK DATA ---
const statsData = [
  { title: "Total Payments", value: "4", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Pending Review", value: "2", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
  { title: "Verified", value: "1", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
  { title: "Rejected", value: "1", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  { title: "Total Amount", value: "₹4.8L", icon: DollarSign, color: "text-yellow-500", bg: "bg-yellow-50" },
];

const paymentsData = [
  { ref: "BK-2024-001", agent: "Travel Experts India", amount: "₹1,25,000", utr: "UTR123456789012", date: "18/3/2026", bank: "HDFC Bank", status: "Pending" },
  { ref: "BK-2024-002", agent: "Wanderlust Tours", amount: "₹85,000", utr: "UTR987654321098", date: "17/2/2026", bank: "ICICI Bank", status: "Verified" },
  { ref: "BK-2024-003", agent: "Global Adventures", amount: "₹2,00,000", utr: "UTR456789123456", date: "16/1/2026", bank: "State Bank of India", status: "Pending" },
  { ref: "BK-2024-004", agent: "Dream Destinations", amount: "₹65,000", utr: "UTR789123456789", date: "15/12/2025", bank: "Axis Bank", status: "Rejected" },
];

// --- HELPER COMPONENT: Status Badge ---
const StatusBadge = ({ status }) => {
  const styles = {
    "Pending": "bg-amber-50 text-amber-600 border-amber-200",
    "Verified": "bg-green-50 text-green-600 border-green-200",
    "Rejected": "bg-red-50 text-red-600 border-red-200",
  };
  
  const icons = {
    "Pending": <Clock className="w-3 h-3 mr-1" />,
    "Verified": <CheckCircle2 className="w-3 h-3 mr-1" />,
    "Rejected": <XCircle className="w-3 h-3 mr-1" />,
  };
  
  const currentStyle = styles[status] || "bg-gray-50 text-gray-600 border-gray-200";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border ${currentStyle}`}>
      {icons[status]}
      {status}
    </span>
  );
};

// --- MAIN COMPONENT ---
const PaymentVerification = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("list"); // "list" | "detail"
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleReviewClick = (payment) => {
    setSelectedPayment(payment);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedPayment(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto text-slate-800 pb-10">
      
      {/* 1. HEADER SECTION (Always Visible) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment Verification</h1>
          <p className="text-sm text-slate-500 mt-1">Review and verify agent payment submissions</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm">
          <FileDown className="w-4 h-4" />
          Export Finance Report
        </button>
      </div>

      {/* 2. STATS GRID (Always Visible) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statsData.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.title === "Pending Review" ? "text-amber-500" : stat.title === "Verified" ? "text-green-500" : stat.title === "Rejected" ? "text-red-500" : "text-slate-800"}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* --------------------------------------------------- */}
      {/* CONDITIONAL RENDERING: LIST VIEW VS DETAIL VIEW     */}
      {/* --------------------------------------------------- */}

      {view === "list" ? (
        <>
          {/* 3. FILTER & SEARCH BAR */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by booking ref, agent name, or UTR number..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Verified</option>
                  <option>Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                  <option>Custom Range</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4. DATA TABLE */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200">
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Reference</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agent Name</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">UTR Number</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Date</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentsData.map((payment, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-800">{payment.ref}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-600">{payment.agent}</td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">{payment.amount}</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-mono tracking-wide">
                          {payment.utr}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {payment.date}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-600">{payment.bank}</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        {/* TRIGGER TO SWITCH VIEW */}
                        <button 
                          onClick={() => handleReviewClick(payment)}
                          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* --------------------------------------------------- */
        /* DETAIL VIEW COMPONENT                               */
        /* --------------------------------------------------- */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          {/* Detail Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Payment Verification Details</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedPayment?.ref}</p>
            </div>
            <button 
              onClick={handleBackToList}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
            >
              Back to List
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Details & Actions */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-800">Agent Payment Details</h3>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Agent Name</p>
                    <p className="text-sm font-bold text-slate-900">{selectedPayment?.agent}</p>
                  </div>
                  <StatusBadge status={selectedPayment?.status || "Pending"} />
                </div>

                <div className="flex justify-between items-center py-2">
                  <p className="text-xs text-slate-500">Booking Reference</p>
                  <p className="text-sm font-bold text-slate-900">{selectedPayment?.ref}</p>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <p className="text-xs text-slate-500">Payment Amount</p>
                  <p className="text-lg font-bold text-yellow-500">{selectedPayment?.amount}</p>
                </div>

                <div className="flex justify-between items-center py-2">
                  <p className="text-xs text-slate-500">UTR Number</p>
                  <p className="text-[10px] font-mono font-semibold text-amber-500">{selectedPayment?.utr}</p>
                </div>

                <div className="flex justify-between items-center py-2">
                  <p className="text-xs text-slate-500">Bank Name</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPayment?.bank}</p>
                </div>

                <div className="flex justify-between items-center py-2">
                  <p className="text-xs text-slate-500">Payment Date</p>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {selectedPayment?.date}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg text-sm font-medium transition-colors">
                  <Check className="w-4 h-4" />
                  Approve & Settle
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg text-sm font-medium transition-colors">
                  <X className="w-4 h-4" />
                  Reject/Dispute
                </button>
              </div>
            </div>

            {/* Right Column: Receipt Image */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-800">Payment Receipt</h3>
              </div>
              
              <div className="border border-slate-200 rounded-xl p-2 bg-white flex-1 flex flex-col">
                <img 
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Payment Receipt" 
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <button className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-sm font-medium transition-colors mt-auto">
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;