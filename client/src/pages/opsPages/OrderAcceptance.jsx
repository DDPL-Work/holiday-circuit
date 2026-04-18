// import {
// MapPin,
// Calendar,
// Users,
// Clock,
// CheckCircle,
// TriangleAlert,
// } from "lucide-react";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";

// import PassToAdminModal from "../../modal/PassToAdminModal";
// import ConfirmQuotationModal from "../../modal/ConfirmQuotationModal";
// import API from "../../utils/Api.js";

// export default function OrderAcceptance() {

// const [openModal, setOpenModal] = useState(false);
// const [openConfirmQuotationModal, setOpenConfirmQuotationModal] = useState(false);
// const [orders, setOrders] = useState([]);
// const [pendingOrders, setPendingOrders] = useState(0);
// const [avgTime, setAvgTime] = useState(0);
// const [selectedOrder, setSelectedOrder] = useState(null);



// useEffect(() => {
// const fetchOrders = async () => {
// try {
// const res = await API.get("/ops/queries/order-acceptance");
// setOrders(res.data.queries);
// setPendingOrders(res.data.pendingOrders);
// setAvgTime(res.data.avgResponseTime);
// } catch (error) {
// console.error("Error fetching orders", error);
// }
// };
// fetchOrders();
// }, []);



// const getDuration = (start, end) => {

// const startDate = new Date(start);
// const endDate = new Date(end);

// const diff = endDate - startDate;

// const days = diff / (1000 * 60 * 60 * 24);
// const nights = days - 1;

// return `${nights}N / ${days}D`;

// };

// return (

// <>

// <motion.div
// initial={{ opacity: 0, y: 20 }}
// animate={{ opacity: 1, y: 0 }}
// transition={{ duration: 0.4 }}
// className="bg-white p-2.5"
// >

// {/* HEADER */}

// <div className="mb-6">

// <h2 className="text-lg font-bold text-slate-900">
// Order Acceptance Interface
// </h2>

// <p className="text-sm text-gray-500">
// Review and decide on incoming booking requests
// </p>

// </div>


// {/* SUMMARY CARD */}

// <motion.div
// whileHover={{ scale: 1.002 }}
// transition={{ type: "spring", stiffness: 200 }}
// className="bg-white border border-gray-200 rounded-2xl px-6 py-4 mb-6 shadow-sm"
// >

// <div className="flex items-center justify-between">

// <div className="flex items-center gap-4">

// <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">

// <Clock className="w-6 h-6 text-orange-500" />

// </div>

// <div>

// <h3 className="text-lg font-semibold text-slate-900">
// {pendingOrders} Pending Orders
// </h3>

// <p className="text-xs text-gray-500">
// Awaiting your decision
// </p>

// </div>

// </div>

// <div className="text-right">

// <p className="text-xs text-gray-400">
// Avg Response Time
// </p>

// <p className="text-sm font-semibold text-slate-900">
// {avgTime} hours
// </p>

// </div>

// </div>

// </motion.div>


// {/* ORDER LIST */}

// <motion.div
// initial="hidden"
// animate="show"
// variants={{
// hidden: {},
// show: { transition: { staggerChildren: 0.15 } }
// }}
// className="space-y-5"
// >

// {orders.map((order) => (

// <motion.div
// key={order._id}
// initial={{ opacity: 0, y: 10 }}
// animate={{ opacity: 1, y: 0 }}
// whileHover={{ scale: 1.003 }}
// transition={{ duration: 0.3 }}
// className="border border-gray-300 rounded-2xl p-5 hover:shadow-md transition"
// >

// {/* TOP BAR */}

// <div className="flex justify-between items-start mb-4">

// <div className="flex flex-col gap-1">

// <div className="flex items-center gap-2">

// <p className="text-md font-bold text-slate-900">
// {order.queryId}
// </p>

// <motion.span
// whileHover={{ scale: 1.001 }}
// className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full text-[#BB4D00] border border-orange-300 bg-[#FEF3C6]"
// >

// <Clock size={12} />

// {order.quotationStatus?.replace("_"," ")}

// </motion.span>

// </div>

// <div className="flex items-center gap-1">

// <Users size={10} className="text-gray-500"/>

// <p className="text-xs text-gray-500">
// {order.agent?.companyName}
// </p>

// <span className="flex items-center gap-1">

// <Clock size={10} className="text-gray-500 mt-0.5"/>

// <p className="text-xs text-gray-500">

// {Math.floor(
// (Date.now() - new Date(order.createdAt)) /
// (1000*60*60*24)
// )}d ago

// </p>

// </span>

// </div>

// </div>

// <div className="text-right">

// <p className="text-xs text-[#62748E]">
// Estimated Value
// </p>

// <p className="text-green-600 font-bold text-sm mt-1">

// ₹{order.customerBudget?.toLocaleString("en-IN")}

// </p>

// </div>

// </div>


// {/* INFO GRID */}

// <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-4 border border-gray-200 p-5 rounded-2xl">

// <div className="flex flex-col">

// <div className="flex items-center gap-1 text-[#62748E]">

// <MapPin size={14} className="text-blue-500"/>

// <p className="text-xs">Destination</p>

// </div>

// <span className="font-bold font-sans">
// {order.destination}
// </span>

// </div>


// <div className="flex flex-col">

// <div className="flex items-center gap-1 text-[#62748E]">

// <Calendar size={14} className="text-purple-500"/>

// <p className="text-xs">Travel Date</p>

// </div>

// <span className="font-bold font-sans">

// {new Date(order.startDate).toLocaleDateString("en-IN",{
// day:"numeric",
// month:"short",
// year:"numeric"
// })}

// </span>

// </div>


// <div className="flex flex-col">

// <div className="flex items-center gap-1 text-[#62748E]">

// <Clock size={14} className="text-orange-500"/>

// <p className="text-xs">Duration</p>

// </div>

// <span className="font-bold font-sans">

// {getDuration(order.startDate,order.endDate)}

// </span>

// </div>


// <div className="flex flex-col">

// <div className="flex items-center gap-1 text-[#62748E]">

// <Users size={14} className="text-green-500"/>

// <p className="text-xs">Passengers</p>

// </div>

// <span className="font-bold font-sans">

// {order.numberOfAdults + order.numberOfChildren} PAX

// </span>

// </div>

// </div>


// {/* REQUIREMENTS */}

// <div className="mb-4">

// <p className="text-xs text-gray-500 mb-2">
// Requirements
// </p>

// <div className="flex flex-wrap gap-2">

// {order.specialRequirements &&
// order.specialRequirements
// .split("\n")
// .filter((req)=>req.trim()!=="")
// .map((req,i)=>(
// <motion.span
// key={i}
// whileHover={{ scale: 1.01 }}
// className="text-xs px-3 py-1 border border-gray-300 rounded-full bg-gray-200 text-gray-700"
// >
// {req}
// </motion.span>
// ))}

// </div>

// </div>


// {/* ACTION BUTTONS */}

// <div className="flex gap-3">

// <motion.button
// whileHover={{ scale: 1.005 }}
// whileTap={{ scale: 0.95 }}
// onClick={()=>{
// setSelectedOrder(order);
// setOpenConfirmQuotationModal(true);
// }}
// className="flex-1 flex items-center justify-center gap-2 font-semibold bg-green-600 text-white py-2 rounded-xl text-sm hover:bg-green-700 transition cursor-pointer"
// >

// <CheckCircle size={16}/>

// Confirm & Create Quotation

// </motion.button>


// <motion.button
// whileHover={{ scale: 1.005 }}
// whileTap={{ scale: 0.95 }}
// onClick={()=>setOpenModal(true)}
// className="flex-1 flex items-center justify-center gap-2 border font-semibold border-orange-300 text-[#BB4D00] py-2 rounded-xl text-sm hover:bg-orange-50 transition cursor-pointer"
// >

// <TriangleAlert size={16}/>

// Pass to Admin

// </motion.button>

// </div>

// </motion.div>

// ))}

// </motion.div>

// </motion.div>


// {/* MODALS */}

// {openModal &&
// <PassToAdminModal onClose={()=>setOpenModal(false)}/>
// }

// {openConfirmQuotationModal &&
// <ConfirmQuotationModal
// order={selectedOrder}
// onClose={()=>setOpenConfirmQuotationModal(false)}
// />
// }

// </>

// );

// }


import {MapPin,Calendar,Users,Clock,CheckCircle,TriangleAlert,Activity,Zap,FileCheck,UserCheck,AlertTriangle,XCircle,ShieldAlert,Sparkles,ChevronDown,ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import PassToAdminModal from "../../modal/PassToAdminModal";
import ConfirmQuotationModal from "../../modal/ConfirmQuotationModal";
import API from "../../utils/Api.js";

/* ── Activity log config ── */
const hiddenLogActions = new Set(["Query Received"]);

const logConfig = {
  "Query Accepted": { color: "bg-green-500", light: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: FileCheck },
  "Query Rejected": { color: "bg-red-500", light: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
  "Quotation Started": { color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Activity },
  "Quote Sent": { color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Zap },
  "Passed to Admin": { color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: AlertTriangle },
  "Admin Replied": { color: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: UserCheck },
  "Revision Requested": { color: "bg-rose-500", light: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: ShieldAlert },
  "Booking Confirmed": { color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
  "Invoice Generated": { color: "bg-violet-500", light: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: FileCheck },
  "Voucher Sent": { color: "bg-cyan-500", light: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: Sparkles },
  "Traveler Documents Submitted": { color: "bg-fuchsia-500", light: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200", icon: UserCheck },
  "Traveler Documents Verified": { color: "bg-teal-500", light: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", icon: UserCheck },
  "Traveler Documents Rejected": { color: "bg-pink-500", light: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", icon: XCircle },
};
const fallbackConfig = { color: "bg-sky-500", light: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", icon: Activity };

/* ── Horizontal Activity Log Strip ── */
const ActivityStrip = ({ logs = [] }) => {
  const sortedLogs = [...logs].sort(
  (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
);
 const seenActions = new Set();
 const uniqueLogs = sortedLogs.filter((log) => {
  if (hiddenLogActions.has(String(log?.action || "").trim())) {
    return false;
  }
  if (log.action === "Quote Sent") {
    if (seenActions.has("Quote Sent")) return false;
    seenActions.add("Quote Sent");
  }
  return true;
});

  if (!uniqueLogs.length) {
    return null;
  }
  return (

    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="thin-scrollbar w-full mb-6 overflow-x-auto overflow-y-hidden rounded-2xl border border-gray-200 bg-white px-4 py-3 pb-2 shadow-sm"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Activity size={13} className="text-green-700" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-800">Activity Log</span>
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
        {uniqueLogs.length} events
      </span>
      </div>

      {/* Horizontal timeline */}
      <div className="flex min-w-max items-start justify-center gap-1 pr-1">
        {uniqueLogs.map((log, index) => {
         const display = log.action;
         const cfg = logConfig[display] || fallbackConfig;
         const Icon = cfg.icon;
         const isLast = index === uniqueLogs.length - 1;

          return (

            <div key={index} className="flex items-center">
              {/* Node */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                className="flex w-[68px] flex-col items-center text-center"
              >
                {/* Icon bubble */}
                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full ${cfg.light} border ${cfg.border} shadow-sm`}>
                  <Icon size={10} className={cfg.text} />
                </div>

                {/* Label */}
                <span className={`w-full text-center text-[8px] font-semibold leading-[1.2] ${cfg.text}`}>
                {display}
                </span>

                {/* Timestamp */}
                <span className="mt-0.5 w-full text-center text-[7px] leading-[1.2] text-gray-400">
                  {new Date(log.timestamp).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </motion.div>

              {/* Connector line */}
              {!isLast && (
                <div className="mx-0.5 mb-5 flex items-center">
                  <div className={`h-0.5 w-6 rounded-full ${cfg.color} opacity-30`} />
                  <div className={`-ml-0.5 h-1.5 w-1.5 rounded-full ${cfg.color} opacity-55`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default function OrderAcceptance() {
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = String(currentUser?.id || currentUser?._id || "");
  const isAdminView = currentUser?.role === "admin";
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmQuotationModal, setOpenConfirmQuotationModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAcceptGuardPopup, setShowAcceptGuardPopup] = useState(false);
  const [adminCoordinationVisibility, setAdminCoordinationVisibility] = useState({});



 const fetchOrders = async () => {
  try {
    const res = await API.get("/ops/queries/order-acceptance", {
  headers: {
    "Cache-Control": "no-cache"
  }
}); 
    setOrders(res.data.queries);
    setPendingOrders(res.data.pendingOrders);
    setAvgTime(res.data.avgResponseTime);
  } catch (error) {
    console.error("Error fetching orders", error);
  }
};

useEffect(() => {
 fetchOrders();
}, []);

useEffect(() => {
  if (orders.length > 0) {
    if (selectedOrder?._id) {
      const updated = orders.find(o => o._id === selectedOrder._id);
      setSelectedOrder(updated || null);
    } else {
      setSelectedOrder(orders[0]);
    }
  }
}, [orders]);

const handleStartQuotation = async (order) => {
  if (!["Booking_Accepted", "Invoice_Requested", "Revision_Query"].includes(order.opsStatus)) {
    setSelectedOrder(order);
    setShowAcceptGuardPopup(true);
    return;
  }

  if (order.opsStatus === "Invoice_Requested") {
    setSelectedOrder(order);
    setOpenConfirmQuotationModal(true);
    return;
  }

  if (order.opsStatus === "Revision_Query") {
    setSelectedOrder(order);
    setOpenConfirmQuotationModal(true);
    return;
  }

  try {
    const res = await API.patch(`/ops/queries/start-quotation/${order._id}`);
    if (res?.data?.success) {
      setSelectedOrder(order);
      setOpenConfirmQuotationModal(true);
      // 🔥 refresh data
     await fetchOrders();
     setTimeout(() => {
      setSelectedOrder(prev => prev?._id === order._id ? prev : order);
      }, 200);
    //  setSelectedOrder(updated);
    }

  } catch (error) {
    console.error(error);
  }
};


  const getDuration = (start, end) => {
    const diff = new Date(end) - new Date(start);
    const days = diff / (1000 * 60 * 60 * 24);
    const nights = days - 1;
    return `${nights}N / ${days}D`;
  };

  /* Collect all activityLog entries across all orders (latest overall) */
  // const allLogs = orders
  //   .flatMap((o) => (o.activityLog || []).map((l) => ({ ...l, queryId: o.queryId })))
  //   .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white"
      >
        {/* HEADER */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Order Acceptance Interface</h2>
          <p className="text-sm text-gray-500">Review and decide on incoming booking requests</p>
        </div>

        {/* ── ACTIVITY LOG STRIP (top, full width) ── */}
       {selectedOrder?.activityLog?.length > 0 && (<ActivityStrip logs={selectedOrder.activityLog} />)}
     
        {/* SUMMARY CARD */}
        <motion.div
          whileHover={{ scale: 1.002 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-white border border-gray-200 rounded-2xl px-6 py-4 mb-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{pendingOrders} Pending Orders</h3>
                <p className="text-xs text-gray-500">Awaiting your decision</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Avg Response Time</p>
              <p className="text-sm font-semibold text-slate-900">{avgTime} hours</p>
            </div>
          </div>
        </motion.div>

        {/* ORDER LIST */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
          className="space-y-5"
        >
{orders.map((order) => {
  const receivedLog = order.activityLog?.find(
    (l) => l.action === "Query Received"
  );
  const baseTime = receivedLog?.timestamp || order.createdAt;
  const diffMs = Date.now() - new Date(baseTime);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const assignedExecutiveId = String(order.assignedTo?._id || order.assignedTo?.id || "");
  const latestReassignment = Array.isArray(order.reassignmentHistory)
    ? order.reassignmentHistory[order.reassignmentHistory.length - 1]
    : null;
  const isAssignedToCurrentUser =
    currentUserId && assignedExecutiveId && assignedExecutiveId === currentUserId;
  const receivedFrom =
    isAssignedToCurrentUser &&
    String(latestReassignment?.toUser || latestReassignment?.toUser?._id || "") === currentUserId
      ? latestReassignment?.fromName || ""
      : "";
  const isReceivedQuery = Boolean(receivedFrom);
  const assignedExecutive = order.assignedTo?.name || order.assignedTo?.email || "Unassigned";
  const adminCoordination = order.adminCoordination || {};
  const adminCoordinationStatus = String(adminCoordination.status || "idle");
  const pendingAdminReply = adminCoordinationStatus === "pending_admin_reply";
  const hasAdminReply = Boolean(String(adminCoordination.lastAdminReply || "").trim());
  const hasAdminRequest = Boolean(String(adminCoordination.lastOpsMessage || "").trim());
  const adminButtonLabel = isAdminView
    ? "Reply from Admin Dashboard"
    : pendingAdminReply
      ? "Awaiting Admin Reply"
      : hasAdminReply
        ? "Re-open with Admin"
        : "Pass to Admin";
  const isAdminCoordinationOpen =
    adminCoordinationVisibility[order._id] ?? (pendingAdminReply || hasAdminReply);

  return (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.003 }}
              transition={{ duration: 0.3 }}
              className="border border-gray-300 rounded-2xl p-5 hover:shadow-md transition"
            >
              {/* TOP BAR */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-md font-bold text-slate-900">{order.queryId}</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-[#FEF3C6] px-2 py-1 text-xs text-[#BB4D00]">
                      <Clock size={12} />
                      {order.quotationStatus?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Users size={10} className="text-gray-500" />
                    <p className="text-xs text-gray-500">{order.agent?.companyName}</p>
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-gray-500 mt-0.5" />
                      <p className="text-xs text-gray-500">
                      {hours < 24 ? `${hours}h ago` : `${days}d ago`}
                      </p>
                    </span>
                    {isReceivedQuery ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                        <UserCheck size={10} />
                        Assigned To: {assignedExecutive}
                      </span>
                    ) : null}
                    {isReceivedQuery ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                        <UserCheck size={10} />
                        Received From: {receivedFrom}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#62748E]">Estimated Value</p>
                  <p className="text-green-600 font-bold text-sm mt-1">
                    ₹{order.customerBudget?.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* INFO GRID */}
              <div className={`mb-4 grid gap-4 rounded-2xl border border-gray-200 p-5 text-sm text-gray-600 ${
                isReceivedQuery ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-6" : "grid-cols-2 md:grid-cols-2 xl:grid-cols-4"
              }`}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[#62748E]">
                    <MapPin size={14} className="text-blue-500" />
                    <p className="text-xs">Destination</p>
                  </div>
                  <span className="font-bold font-sans">{order.destination}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[#62748E]">
                    <Calendar size={14} className="text-purple-500" />
                    <p className="text-xs">Travel Date</p>
                  </div>
                  <span className="font-bold font-sans">
                    {new Date(order.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[#62748E]">
                    <Clock size={14} className="text-orange-500" />
                    <p className="text-xs">Duration</p>
                  </div>
                  <span className="font-bold font-sans">{getDuration(order.startDate, order.endDate)}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-[#62748E]">
                    <Users size={14} className="text-green-500" />
                    <p className="text-xs">Passengers</p>
                  </div>
                  <span className="font-bold font-sans">{order.numberOfAdults + order.numberOfChildren} PAX</span>
                </div>
                {isReceivedQuery ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-[#62748E]">
                      <UserCheck size={14} className="text-blue-500" />
                      <p className="text-xs">Assigned To</p>
                    </div>
                    <span className="font-bold font-sans text-slate-900">{assignedExecutive}</span>
                  </div>
                ) : null}
                {isReceivedQuery ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-[#62748E]">
                      <UserCheck size={14} className="text-amber-500" />
                      <p className="text-xs">Received From</p>
                    </div>
                    <span className="font-bold font-sans text-amber-700">{receivedFrom}</span>
                  </div>
                ) : null}
              </div>

              {/* REQUIREMENTS */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {order.specialRequirements &&
                    order.specialRequirements
                      .split("\n")
                      .filter((req) => req.trim() !== "")
                      .map((req, i) => (
                        <motion.span
                          key={i}
                          whileHover={{ scale: 1.01 }}
                          className="text-xs px-3 py-1 border border-gray-300 rounded-full bg-gray-200 text-gray-700"
                        >
                          {req}
                        </motion.span>
                      ))}
                </div>
              </div>

              {(hasAdminRequest || hasAdminReply || pendingAdminReply) ? (
                <div className="mb-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                        Admin Coordination
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {pendingAdminReply ? "Waiting for admin response" : hasAdminReply ? "Admin has replied" : "Escalated to admin"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        pendingAdminReply
                          ? "border border-orange-200 bg-orange-100 text-orange-700"
                          : hasAdminReply
                            ? "border border-indigo-200 bg-indigo-100 text-indigo-700"
                            : "border border-slate-200 bg-slate-100 text-slate-700"
                      }`}>
                        <TriangleAlert size={12} />
                        {pendingAdminReply ? "Pending Admin Reply" : hasAdminReply ? "Reply Received" : "Escalated"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setAdminCoordinationVisibility((prev) => ({
                            ...prev,
                            [order._id]: !isAdminCoordinationOpen,
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {isAdminCoordinationOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isAdminCoordinationOpen ? "Hide details" : "Show details"}
                      </button>
                    </div>
                  </div>

                  {isAdminCoordinationOpen ? (
                    <>
                      {hasAdminRequest ? (
                        <div className="mt-3 rounded-2xl border border-orange-100 bg-white/90 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">Ops note</p>
                          <p className="mt-1 text-sm text-slate-700">{adminCoordination.lastOpsMessage}</p>
                          <p className="mt-2 text-[11px] text-slate-500">
                            {adminCoordination.lastOpsMessageByName || "Operations"} | {" "}
                            {adminCoordination.lastOpsMessageAt
                              ? new Date(adminCoordination.lastOpsMessageAt).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </p>
                        </div>
                      ) : null}

                      {hasAdminReply ? (
                        <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Admin reply</p>
                          <p className="mt-1 text-sm text-slate-700">{adminCoordination.lastAdminReply}</p>
                          <p className="mt-2 text-[11px] text-slate-500">
                            {adminCoordination.lastAdminReplyByName || "Admin"} | {" "}
                            {adminCoordination.lastAdminReplyAt
                              ? new Date(adminCoordination.lastAdminReplyAt).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </p>
                        </div>
                      ) : pendingAdminReply ? (
                        <p className="mt-3 text-xs text-orange-700">
                          Admin has been notified. The reply will appear here once shared.
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.95 }}
                 onClick={() => handleStartQuotation(order)}
                  className="flex-1 flex items-center justify-center gap-2 font-semibold bg-green-600 text-white py-2 rounded-xl text-sm hover:bg-green-700 transition cursor-pointer"
                >
                  <CheckCircle size={16} />
                  {order.opsStatus === "Invoice_Requested"
                    ? "Open Builder for Finance Invoice"
                    : order.opsStatus === "Revision_Query"
                      ? "Open Builder for Revision"
                      : "Confirm & Create Quotation"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isAdminView || pendingAdminReply) return;
                    setSelectedOrder(order);
                    setOpenModal(true);
                  }}
                  disabled={isAdminView || pendingAdminReply}
                  className={`flex-1 flex items-center justify-center gap-2 border font-semibold py-2 rounded-xl text-sm transition ${
                    isAdminView || pendingAdminReply
                      ? "cursor-not-allowed border-orange-200 bg-orange-50 text-orange-400"
                      : "cursor-pointer border-orange-300 text-[#BB4D00] hover:bg-orange-50"
                  }`}
                >
                  <TriangleAlert size={16} />
                  {adminButtonLabel}
                </motion.button>
              </div>
            </motion.div>
          )})}
        </motion.div>
      </motion.div>

      {openModal && (
        <PassToAdminModal
          onClose={() => setOpenModal(false)}
          order={selectedOrder}
          onSuccess={fetchOrders}
        />
      )}
      {openConfirmQuotationModal && (
    <ConfirmQuotationModal order={selectedOrder} onClose={() => setOpenConfirmQuotationModal(false)} refresh={fetchOrders} />
      )}
      <AnimatePresence>
        {showAcceptGuardPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4"
            onClick={() => setShowAcceptGuardPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-2xl"
            >
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-5 py-6 text-white">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <ShieldAlert size={24} />
                </div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-amber-50/90">
                  Acceptance Required
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-tight">
                  Accept this query before creating quotation
                </h3>
                <p className="mt-2 text-sm text-white/85">
                  Open the query with the View button and accept it first. After that, quotation builder access will unlock.
                </p>
              </div>

              <div className="px-5 py-5">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        Next step
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-800/90">
                        Go to this query in the list, click View, then use the Accept action in the popup. Once accepted, come back and click Confirm & Create Quotation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAcceptGuardPopup(false)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowAcceptGuardPopup(false)}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Understood
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
