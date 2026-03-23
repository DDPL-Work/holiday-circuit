import React from 'react';
import { 
  Shield, CheckCircle2, TrendingUp, Building2, Clock, 
  Users, Calendar, CheckCircle, AlertCircle, DollarSign
} from 'lucide-react';

// --- MOCK DATA (Replace these with your real API data later) ---
const permissions = [
  "Verify agent payments", "Manage internal invoices", "Track payment statuses",
  "Review UTR numbers and receipts", "Generate financial reports"
];

const receivables = [
  { id: "BK-2024-001", status: "Unpaid", company: "Travel Experts India", date: "25/3/2024", amount: "₹1,25,000" },
  { id: "BK-2024-002", status: "Pending Verification", company: "Wanderlust Tours", date: "22/3/2024", amount: "₹85,000" },
  { id: "BK-2024-003", status: "Pending Verification", company: "Global Adventures", date: "20/3/2024", amount: "₹2,00,000" },
  { id: "BK-2024-004", status: "Settled", company: "Dream Destinations", date: "28/3/2024", amount: "₹65,000" },
  { id: "BK-2024-005", status: "Unpaid", company: "Sky Travels", date: "26/3/2024", amount: "₹1,50,000" },
];

const payables = [
  { name: "Bali Paradise DMC", status: "Unpaid", date: "24/3/2024", amount: "₹95,000" },
  { name: "Dubai Luxury Partners", status: "Pending Verification", date: "21/3/2024", amount: "₹1,80,000" },
  { name: "Maldives Dream DMC", status: "Settled", date: "27/3/2024", amount: "₹1,20,000" },
];

// --- HELPER COMPONENT: Status Badge ---
// This handles the dynamic colors based on the status text
const StatusBadge = ({ status }) => {
  const styles = {
    "Unpaid": "bg-red-50 text-red-600 border-red-100",
    "Pending Verification": "bg-amber-50 text-amber-600 border-amber-100",
    "Settled": "bg-green-50 text-green-600 border-green-100",
  };
  
  const currentStyle = styles[status] || "bg-gray-50 text-gray-600 border-gray-100";
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${currentStyle}`}>
      {status}
    </span>
  );
};

// --- MAIN COMPONENT ---
const FinanceDashboard = () => {
  return (
    <div className="flex flex-col gap-6 p-6  max-w-7xl mx-auto text-slate-800 pb-10">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Track receivables, payables, and payment verifications</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-medium leading-tight">Bank Reconciliation</span>
            <span className="text-sm font-bold text-green-600 leading-tight">Up to Date</span>
          </div>
        </div>
      </div>

      {/* 2. ACCESS LEVEL CARD */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Shield className="w-6 h-6 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">Your Access Level</h2>
              <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                Finance Team
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Access restricted to financial operations</p>
            
            <p className="text-xs font-bold text-slate-400 mt-6 mb-3 uppercase tracking-wider">Permissions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
              {permissions.map((perm, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-slate-600">{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receivable Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Total Receivable</h3>
            <p className="text-xs text-slate-400 mb-3">Money owed by Agents</p>
            <p className="text-3xl font-bold text-blue-600">₹5.60L</p>
            <p className="text-xs text-green-500 font-medium mt-2">+8%</p>
          </div>
          <TrendingUp className="w-6 h-6 text-blue-500" />
        </div>

        {/* Payable Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Total Payable</h3>
            <p className="text-xs text-slate-400 mb-3">Money to be paid to DMCs</p>
            <p className="text-3xl font-bold text-purple-600">₹2.75L</p>
            <p className="text-xs text-green-500 font-medium mt-2">+5%</p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg"><Building2 className="w-5 h-5 text-purple-500" /></div>
        </div>

        {/* Pending Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Pending Verifications</h3>
            <p className="text-xs text-slate-400 mb-3">Offline payments awaiting UTR check</p>
            <p className="text-3xl font-bold text-orange-500">3</p>
            <p className="text-xs text-red-500 font-medium mt-2">-2 from yesterday</p>
          </div>
          <div className="p-2 bg-orange-50 rounded-lg"><Clock className="w-5 h-5 text-orange-500" /></div>
        </div>
      </div>

      {/* 4. LEDGERS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Agent Receivables */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-bold">Agent Receivables</h2>
          </div>
          <div className="p-2">
            {receivables.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors rounded-lg">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-sm">{item.id}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-slate-500">{item.company}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>Payment Due: {item.date}</span>
                  </div>
                </div>
                <span className="font-bold text-base">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: DMC Payables */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-bold">DMC Payables</h2>
          </div>
          <div className="p-2">
            {payables.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors rounded-lg">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-sm">{item.name}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                    <Calendar className="w-3 h-3" />
                    <span>Payment Due: {item.date}</span>
                  </div>
                </div>
                <span className="font-bold text-base">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. THIS WEEK SUMMARY */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6">This Week Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="flex flex-col items-center">
            <div className="p-3 bg-green-50 rounded-full mb-3"><CheckCircle className="w-6 h-6 text-green-500" /></div>
            <p className="text-xs text-slate-500 mb-1">Payments Settled</p>
            <p className="text-2xl font-bold text-green-600">₹4.2L</p>
          </div>
          
          <div className="flex flex-col items-center border-l border-gray-100">
            <div className="p-3 bg-amber-50 rounded-full mb-3"><Clock className="w-6 h-6 text-amber-500" /></div>
            <p className="text-xs text-slate-500 mb-1">Pending Approvals</p>
            <p className="text-2xl font-bold text-amber-600">7</p>
          </div>
          
          <div className="flex flex-col items-center border-l border-gray-100">
            <div className="p-3 bg-red-50 rounded-full mb-3"><AlertCircle className="w-6 h-6 text-red-500" /></div>
            <p className="text-xs text-slate-500 mb-1">Overdue Payments</p>
            <p className="text-2xl font-bold text-red-600">3</p>
          </div>
          
          <div className="flex flex-col items-center border-l border-gray-100">
            <div className="p-3 bg-blue-50 rounded-full mb-3"><DollarSign className="w-6 h-6 text-blue-500" /></div>
            <p className="text-xs text-slate-500 mb-1">Tax Collected</p>
            <p className="text-2xl font-bold text-blue-600">₹68K</p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default FinanceDashboard;