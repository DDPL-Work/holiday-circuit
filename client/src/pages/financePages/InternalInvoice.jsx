import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, ChevronDown, Eye, Cloud, CheckCircle, 
  FileDown, Calendar 
} from 'lucide-react';

import InvoiceDocumentModal from '../../modal/InvoiceDocumentModal';

// --- MOCK DATA (Dates updated to 2026 for accurate testing) ---
const statsData = [
  { title: "Total Invoices", value: "5", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Pending", value: "2", icon: FileText, color: "text-amber-500", bg: "bg-amber-50" },
  { title: "Paid", value: "2", icon: FileText, color: "text-green-500", bg: "bg-green-50" },
  { title: "Overdue", value: "1", icon: FileText, color: "text-red-500", bg: "bg-red-50" },
  { title: "Total Revenue", value: "₹1.5L", icon: FileText, color: "text-yellow-500", bg: "bg-yellow-50" },
  { title: "Pending Amount", value: "₹4.3L", icon: FileText, color: "text-yellow-500", bg: "bg-yellow-50" },
];

const invoicesData = [
  // 3 days ago (Last 7 Days, This Month)
  { id: "INV-2024-001", isDmc: false, ref: "BK-2024-001", party: "Travel Experts India", utr: "UTR123456789012", bank: "HDFC Bank", date: "20/3/2026", amount: "₹1,25,000", tax: "₹10,000", status: "Pending", method: null },
  // Yesterday (Last 7 Days, This Month)
  { id: "INV-2024-002", isDmc: false, ref: "BK-2024-002", party: "Wanderlust Tours", utr: "UTR987654321098", bank: "ICICI Bank", date: "22/3/2026", amount: "₹85,000", tax: "₹7,000", status: "Paid", method: "NEFT" },
  // Last Month (Last 30 Days)
  { id: "DMC-INV-2024-001", isDmc: true, ref: "BK-2024-003", party: "Bali Paradise DMC", utr: "UTR456789123456", bank: "State Bank of India", date: "25/2/2026", amount: "₹2,00,000", tax: "₹15,000", status: "Pending", method: null },
  // Today (Last 7 Days, This Month)
  { id: "INV-2024-004", isDmc: false, ref: "BK-2024-004", party: "Dream Destinations", utr: "UTR789123456789", bank: "Axis Bank", date: "23/3/2026", amount: "₹65,000", tax: "₹5,000", status: "Paid", method: "UPI" },
  // 10 days ago (This Month, Last 30 Days)
  { id: "INV-2024-005", isDmc: false, ref: "BK-2024-005", party: "Sky Travels", utr: "Pending", bank: "N/A", date: "13/3/2026", amount: "₹1,03,000", tax: "₹8,000", status: "Overdue", method: null },
];

// --- HELPER COMPONENT: Status Badge ---
const StatusBadge = ({ status, method }) => {
  const styles = {
    "Pending": "bg-amber-50 text-amber-600 border-amber-200",
    "Paid": "bg-green-50 text-green-600 border-green-200",
    "Overdue": "bg-red-50 text-red-600 border-red-200",
  };
  
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status]}`}>
        {status}
      </span>
      {method && <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase">{method}</span>}
    </div>
  );
};

// --- HELPER FUNCTION: Parse "DD/MM/YYYY" to JS Date Object ---
const parseDateString = (dateStr) => {
  const [day, month, year] = dateStr.split('/');
  return new Date(year, month - 1, day);
};

// --- MAIN COMPONENT ---
const InternalInvoices = () => {
  // 1. Setup State for all filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("All Time"); // Added 'All Time' as default
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const openModal = (invoice) => setSelectedInvoice(invoice);
  const closeModal = () => setSelectedInvoice(null);

  // 2. The Core Filtering Logic (useMemo prevents recalculating on every single render)
  const filteredInvoices = useMemo(() => {
    return invoicesData.filter((invoice) => {
      
      // A. SEARCH LOGIC
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        invoice.id.toLowerCase().includes(searchLower) ||
        invoice.ref.toLowerCase().includes(searchLower) ||
        invoice.party.toLowerCase().includes(searchLower);

      // B. STATUS LOGIC
      const matchesStatus = statusFilter === "All Status" || invoice.status === statusFilter;

      // C. DATE LOGIC
      let matchesDate = true;
      if (dateFilter !== "All Time") {
        const invoiceDate = parseDateString(invoice.date);
        const today = new Date();
        
        // Reset times to midnight for accurate day calculation
        today.setHours(0, 0, 0, 0);
        invoiceDate.setHours(0, 0, 0, 0);

        // Calculate difference in days
        const diffTime = today - invoiceDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateFilter === "Last 7 Days") {
          matchesDate = diffDays >= 0 && diffDays <= 7;
        } else if (dateFilter === "Last 30 Days") {
          matchesDate = diffDays >= 0 && diffDays <= 30;
        } else if (dateFilter === "This Month") {
          matchesDate = 
            invoiceDate.getMonth() === today.getMonth() && 
            invoiceDate.getFullYear() === today.getFullYear();
        }
      }

      // Invoice must pass ALL THREE filters to be shown
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [searchTerm, statusFilter, dateFilter]); // Re-run only when these change

  return (
    <div className="h-full flex flex-col gap-4 max-w-[1600px] mx-auto text-slate-800 w-full overflow-hidden p-2 sm:p-4">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        {/* ... (Header code remains unchanged) ... */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">Internal Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track all internal invoices</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
          <FileDown className="w-4 h-4" />
          Export Finance Report
        </button>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0">
        {/* ... (Stats code remains unchanged) ... */}
        {statsData.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-[10px] text-slate-500 font-medium mb-1">{stat.title}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col lg:flex-row justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by invoice number, booking ref, or party name..." 
            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          
          {/* STATUS DROPDOWN CONNECTED TO STATE */}
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          {/* DATE DROPDOWN CONNECTED TO STATE */}
          <div className="relative">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="overflow-y-auto overflow-x-hidden flex-1 custom-scroll">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="w-[14%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoice No.</th>
                <th className="w-[11%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Ref</th>
                <th className="w-[14%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Party Name</th>
                <th className="w-[13%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">UTR Number</th>
                <th className="w-[12%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Name</th>
                <th className="w-[11%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="w-[10%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="w-[7%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="w-[8%] py-3 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              
              {/* WE NOW MAP OVER filteredInvoices INSTEAD OF invoicesData */}
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">{invoice.id}</span>
                        {invoice.isDmc && (
                          <span className="bg-purple-50 text-purple-600 border border-purple-200 text-[8px] font-bold px-1 rounded uppercase tracking-wide">
                            DMC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 truncate">{invoice.ref}</td>
                    <td className="py-3 px-3 text-[11px] text-slate-800 font-medium">
                      <div className="truncate" title={invoice.party}>{invoice.party}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider truncate" title={invoice.utr}>
                        {invoice.utr}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">
                      <div className="truncate" title={invoice.bank}>{invoice.bank}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {invoice.date}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-800 truncate">{invoice.amount}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 truncate">Tax: {invoice.tax}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={invoice.status} method={invoice.method} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2.5">
                        <button onClick={() => openModal(invoice)} className="text-slate-400 hover:text-blue-600 transition-colors focus:outline-none" title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="text-slate-400 hover:text-slate-800 transition-colors focus:outline-none" title="Download Invoice">
                          <Cloud className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className={`transition-colors focus:outline-none ${invoice.status === 'Paid' ? 'text-green-500/40 cursor-not-allowed' : 'text-slate-400 hover:text-green-600'}`} 
                          title="Mark as Paid" 
                          disabled={invoice.status === 'Paid'}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty State UI if filters return 0 results */
                <tr>
                  <td colSpan="9" className="py-10 text-center text-slate-500">
                    <p className="text-sm">No invoices match your current filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDocumentModal invoice={selectedInvoice} onClose={closeModal} />
      )}

    </div>
  );
};

export default InternalInvoices;