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


import {MapPin,Calendar,Users,Clock,CheckCircle,TriangleAlert,Activity,Zap,FileCheck,UserCheck,AlertTriangle,XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PassToAdminModal from "../../modal/PassToAdminModal";
import ConfirmQuotationModal from "../../modal/ConfirmQuotationModal";
import API from "../../utils/Api.js";

/* ── Activity log config ── */
const logConfig = {
  "Query Received":   {color: "bg-indigo-500",light: "bg-indigo-50",text: "text-indigo-700",border: "border-indigo-200",icon: UserCheck},
  "Query Accepted":{ color: "bg-green-500",  light: "bg-green-50",  text: "text-green-700",  border: "border-green-200", icon: FileCheck },
  "Query Rejected": {color: "bg-red-500",light: "bg-red-50",text: "text-red-700",border: "border-red-200", icon:XCircle},
  "Quotation Started": {color: "bg-yellow-500",light: "bg-yellow-50",text: "text-yellow-700",border: "border-yellow-200",icon: Activity},
  "Quote Sent":       { color: "bg-blue-500",   light: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",  icon: Zap },
  "Passed to Admin":  { color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", border: "border-orange-200",icon: AlertTriangle },
};
const fallbackConfig = { color: "bg-gray-400", light: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: Activity };

/* ── Horizontal Activity Log Strip ── */
const ActivityStrip = ({ logs = [] }) => {
  const sortedLogs = [...logs].sort(
  (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
);
  return (

    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full mb-6 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm overflow-x-auto"
    >
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} className="text-green-700" />
        <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Activity Log</span>
        <span className="ml-auto bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {logs.length} events</span>
      </div>

      {/* Horizontal timeline */}
      <div className="flex items-center justify-center gap-2 min-w-max ">
        {sortedLogs.map((log, index) => {
         console.log("LOG ACTION:", log.action);
         const display = log.action;
         const cfg = logConfig[display] || fallbackConfig;
         const Icon = cfg.icon;
         const isLast = index === sortedLogs.length - 1;

          return (

            <div key={index} className="flex items-center">
              {/* Node */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                className="flex flex-col items-center"
              >
                {/* Icon bubble */}
                <div className={`w-8 h-8 rounded-full ${cfg.light} border ${cfg.border} flex items-center justify-center mb-1.5 shadow-sm`}>
                  <Icon size={13} className={cfg.text} />
                </div>

                {/* Label */}
                <span className={`text-[10px] font-semibold ${cfg.text} max-w-25 text-center leading-tight`}>
                {display}
                </span>

                {/* Timestamp */}
                <span className="text-[9px] text-gray-400 mt-0.5 text-center max-w-18 leading-tight">
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
                <div className="flex items-center mx-1.5 mb-6">
                  <div className="w-8 h-0.5 bg-gray-200 rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 -ml-0.5" />
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
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmQuotationModal, setOpenConfirmQuotationModal] = useState(false);
  const [orders, setOrders] = useState([]);
 console.log("UPDATED ORDERS:", orders);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  console.log("selectOrder",selectedOrder)



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
        className="bg-white p-2.5"
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
                    <motion.span
                      whileHover={{ scale: 1.001 }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full text-[#BB4D00] border border-orange-300 bg-[#FEF3C6]"
                    >
                      <Clock size={12} />
                      {order.quotationStatus?.replace("_", " ")}
                    </motion.span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={10} className="text-gray-500" />
                    <p className="text-xs text-gray-500">{order.agent?.companyName}</p>
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-gray-500 mt-0.5" />
                      <p className="text-xs text-gray-500">
                      {hours < 24 ? `${hours}h ago` : `${days}d ago`}
                      </p>
                    </span>
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
              <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-4 border border-gray-200 p-5 rounded-2xl">
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

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.95 }}
                 onClick={() => handleStartQuotation(order)}
                  className="flex-1 flex items-center justify-center gap-2 font-semibold bg-green-600 text-white py-2 rounded-xl text-sm hover:bg-green-700 transition cursor-pointer"
                >
                  <CheckCircle size={16} />
                  Confirm & Create Quotation
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setOpenModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 border font-semibold border-orange-300 text-[#BB4D00] py-2 rounded-xl text-sm hover:bg-orange-50 transition cursor-pointer"
                >
                  <TriangleAlert size={16} />
                  Pass to Admin
                </motion.button>
              </div>
            </motion.div>
          )})}
        </motion.div>
      </motion.div>

      {openModal && <PassToAdminModal onClose={() => setOpenModal(false)} />}
      {openConfirmQuotationModal && (
    <ConfirmQuotationModal order={selectedOrder} onClose={() => setOpenConfirmQuotationModal(false)} refresh={fetchOrders} />
      )}
    </>
  );
}