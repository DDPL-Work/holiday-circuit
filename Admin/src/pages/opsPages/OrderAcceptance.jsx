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


import {MapPin,Calendar,Users,Clock,CheckCircle,TriangleAlert,Activity,Zap,FileCheck,UserCheck,AlertTriangle,XCircle,ShieldAlert,Sparkles,ChevronLeft,ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import PassToAdminModal from "../../modal/PassToAdminModal";
import ConfirmQuotationModal from "../../modal/ConfirmQuotationModal";
import API from "../../utils/Api.js";

/* ── Activity log config ── */
const hiddenLogActions = new Set();

const logConfig = {
  "Query Received": { color: "bg-[#3E63DD]", light: "bg-blue-50/50", text: "text-[#3E63DD]", border: "border-blue-100", icon: Activity },
  "Query Accepted": { color: "bg-blue-600", light: "bg-blue-50/40", text: "text-blue-700", border: "border-blue-100", icon: FileCheck },
  "Query Rejected": { color: "bg-rose-500", light: "bg-rose-50/50", text: "text-rose-700", border: "border-rose-100", icon: XCircle },
  "Quotation Started": { color: "bg-amber-500", light: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100", icon: Activity },
  "Quote Sent": { color: "bg-indigo-600", light: "bg-indigo-50/50", text: "text-indigo-700", border: "border-indigo-100", icon: Zap },
  "Passed to Admin": { color: "bg-amber-500", light: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100", icon: AlertTriangle },
  "Passed to Manager": { color: "bg-amber-500", light: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100", icon: AlertTriangle },
  "Admin Replied": { color: "bg-indigo-500", light: "bg-indigo-50/50", text: "text-indigo-700", border: "border-indigo-100", icon: UserCheck },
  "Revision Requested": { color: "bg-rose-500", light: "bg-rose-50/50", text: "text-rose-700", border: "border-rose-100", icon: ShieldAlert },
  "Booking Confirmed": { color: "bg-emerald-600", light: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100", icon: CheckCircle },
  "Invoice Generated": { color: "bg-indigo-600", light: "bg-indigo-50/50", text: "text-indigo-700", border: "border-indigo-100", icon: FileCheck },
  "Voucher Sent": { color: "bg-blue-600", light: "bg-blue-50/50", text: "text-blue-700", border: "border-blue-100", icon: Sparkles },
  "Traveler Documents Submitted": { color: "bg-slate-600", light: "bg-slate-50/60", text: "text-slate-700", border: "border-slate-200", icon: UserCheck },
  "Traveler Documents Verified": { color: "bg-emerald-600", light: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100", icon: UserCheck },
  "Traveler Documents Rejected": { color: "bg-rose-500", light: "bg-rose-50/50", text: "text-rose-700", border: "border-rose-100", icon: XCircle },
};
const fallbackConfig = { color: "bg-slate-500", light: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: Activity };

const getLatestReassignmentEntry = (order = {}) => {
  const history = Array.isArray(order?.reassignmentHistory) ? order.reassignmentHistory : [];
  return history.length ? history[history.length - 1] : null;
};

const getOrderStatusMeta = (order = {}) => {
  const isRevisionRequested =
    String(order?.agentStatus || "").trim() === "Revision Requested" ||
    String(order?.opsStatus || "").trim() === "Revision_Query";

  if (isRevisionRequested) {
    return {
      label: "Quotation Rejected",
      detail: String(order?.rejectionNote || "").trim() || "Client or agent asked for changes on this quotation.",
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
      noticeClassName: "border-rose-200 bg-rose-50/80",
      noticeIconClassName: "bg-rose-100 text-rose-600",
      noticeTitle: "Revision Needed For This Query",
      noticeBody:
        String(order?.rejectionNote || "").trim() ||
        "The earlier quotation was rejected for this specific query. Open the builder and resend a revised quotation.",
      Icon: XCircle,
    };
  }

  if (String(order?.opsStatus || "").trim() === "Invoice_Requested") {
    return {
      label: "Client Approved",
      detail: "Client has approved the quotation. Booking is now in the amount and documents stage.",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      noticeClassName: "",
      noticeIconClassName: "",
      noticeTitle: "",
      noticeBody: "",
      Icon: CheckCircle,
    };
  }

  if (String(order?.quotationStatus || "").trim() === "Sent_To_Agent") {
    return {
      label: "Sent To Agent",
      detail: "Quotation has been shared with the agent and is awaiting their action.",
      badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
      noticeClassName: "",
      noticeIconClassName: "",
      noticeTitle: "",
      noticeBody: "",
      Icon: Zap,
    };
  }

  if (String(order?.quotationStatus || "").trim() === "Quotation_Created") {
    return {
      label: "Quotation Created",
      detail: "Quotation draft is ready for sharing.",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      noticeClassName: "",
      noticeIconClassName: "",
      noticeTitle: "",
      noticeBody: "",
      Icon: Activity,
    };
  }

  return {
    label: String(order?.quotationStatus || "Awaiting_Decision").replaceAll("_", " "),
    detail: "This query is currently waiting for the next quotation action.",
    badgeClassName: "border-orange-300 bg-[#FEF3C6] text-[#BB4D00]",
    noticeClassName: "",
    noticeIconClassName: "",
    noticeTitle: "",
    noticeBody: "",
    Icon: Clock,
  };
};

/* ── Horizontal Activity Log Strip ── */
const ActivityStrip = ({ logs = [] }) => {
  const viewportRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
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

  const syncNavigationState = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const nextHasOverflow = viewport.scrollWidth - viewport.clientWidth > 8;
    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);

    setHasOverflow(nextHasOverflow);
    setCanScrollLeft(nextHasOverflow && viewport.scrollLeft > 4);
    setCanScrollRight(nextHasOverflow && viewport.scrollLeft < maxScrollLeft - 4);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const syncOnFrame = window.requestAnimationFrame(syncNavigationState);
    const handleResize = () => syncNavigationState();

    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(syncOnFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, [uniqueLogs.length]);

  if (!uniqueLogs.length) {
    return null;
  }

  const handleActivityScroll = (direction) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const scrollStep = Math.max(220, Math.round(viewport.clientWidth * 0.7));
    viewport.scrollBy({
      left: direction === "left" ? -scrollStep : scrollStep,
      behavior: "smooth",
    });
  };

  return (

    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative w-full mb-6 overflow-visible rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 px-4 py-3 pb-2 shadow-xs transition hover:border-emerald-300"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Activity size={13} className="text-emerald-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Activity Log</span>
        <span className="ml-auto rounded-full border border-emerald-200/80 bg-emerald-100/70 px-2.5 py-0.5 text-[9px] font-bold text-emerald-800">
        {uniqueLogs.length} events
      </span>
      </div>

      {/* Horizontal timeline */}
      <div className="relative">
        {hasOverflow ? (
          <button
            type="button"
            onClick={() => handleActivityScroll("left")}
            disabled={!canScrollLeft}
            className={`absolute -left-7 top-[1rem] z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[#233CFF] shadow-md transition ${
              canScrollLeft
                ? "cursor-pointer border-slate-200 opacity-100 hover:scale-105 hover:border-slate-300"
                : "cursor-not-allowed border-slate-100 opacity-45"
            }`}
            aria-label="Show previous activity"
          >
            <ChevronLeft size={14} />
          </button>
        ) : null}

        {hasOverflow ? (
          <button
            type="button"
            onClick={() => handleActivityScroll("right")}
            disabled={!canScrollRight}
            className={`absolute -right-7 top-[1rem] z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-[#233CFF] shadow-md transition ${
              canScrollRight
                ? "cursor-pointer border-slate-200 opacity-100 hover:scale-105 hover:border-slate-300"
                : "cursor-not-allowed border-slate-100 opacity-45"
            }`}
            aria-label="Show next activity"
          >
            <ChevronRight size={14} />
          </button>
        ) : null}

        <div
          ref={viewportRef}
          onScroll={syncNavigationState}
          className={`activity-strip-viewport activity-strip-scroll-hidden pb-1 ${hasOverflow ? "px-4" : ""}`}
        >
          <div className={`flex items-start gap-1 pr-1 ${hasOverflow ? "w-max min-w-max" : "w-full justify-center"}`}>
          {uniqueLogs.map((log, index) => {
            const display = log.action === "Query Created" ? "Query Received" : log.action;
            const cfg = logConfig[display] || fallbackConfig;
            const Icon = cfg.icon;
            const isLast = index === uniqueLogs.length - 1;
            return (
              <div
                key={`${display}-${log.timestamp}-${index}`}
                className="flex items-center"
              >
                {/* Node */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: Math.min(index, uniqueLogs.length - 1) * 0.08, type: "spring", stiffness: 260, damping: 20 }}
                  className="flex w-[92px] flex-col items-center text-center"
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
        </div>
      </div>
    </motion.div>
  );
};

export default function OrderAcceptance() {
  const currentUser = useSelector((state) => state.auth.user);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUserId = String(currentUser?.id || currentUser?._id || "");
  const isAdminView = currentUser?.role === "admin";
  const isOperationManagerView = currentUser?.role === "operation_manager";
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmQuotationModal, setOpenConfirmQuotationModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [relativeNow, setRelativeNow] = useState(() => Date.now());
  const [showAcceptGuardPopup, setShowAcceptGuardPopup] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState("");
  const handledNotificationOrderRef = useRef("");



 const fetchOrders = async () => {
  try {
    const res = await API.get("/ops/queries/order-acceptance", {
      headers: {
        "Cache-Control": "no-cache"
      },
      skipGlobalLoader: true,
    }); 
    setOrders(res.data.queries);
    setPendingOrders(res.data.pendingOrders);
    setAvgTime(res.data.avgResponseTime);
  } catch (error) {
    console.error("Error fetching orders", error);
  }
};

useEffect(() => {
  const timerId = window.setTimeout(() => {
    fetchOrders();
  }, 0);

  return () => window.clearTimeout(timerId);
}, []);

useEffect(() => {
  const refreshOrders = () => {
    if (document.visibilityState === "visible") {
      fetchOrders();
    }
  };

  const intervalId = window.setInterval(refreshOrders, 15000);
  window.addEventListener("focus", refreshOrders);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("focus", refreshOrders);
  };
}, []);

useEffect(() => {
  const timerId = window.setInterval(() => {
    setRelativeNow(Date.now());
  }, 60000);

  return () => window.clearInterval(timerId);
}, []);

useEffect(() => {
  if (orders.length > 0) {
    const nextSelectedOrder = selectedOrder?._id
      ? orders.find((o) => o._id === selectedOrder._id) || null
      : orders[0];

    const frameId = window.requestAnimationFrame(() => {
      setSelectedOrder(nextSelectedOrder);
    });

    return () => window.cancelAnimationFrame(frameId);
  }
}, [orders, selectedOrder?._id]);

useEffect(() => {
  const notificationOrderId = String(location.state?.notificationMeta?.queryId || "").trim();
  if (!notificationOrderId || !orders.length) return;
  if (handledNotificationOrderRef.current === notificationOrderId) return;

  const targetOrder = orders.find(
    (order) =>
      String(order?._id || "") === notificationOrderId ||
      String(order?.queryId || "") === notificationOrderId,
  );

  if (!targetOrder) return;

  handledNotificationOrderRef.current = notificationOrderId;
  const frameId = window.requestAnimationFrame(() => {
    setSelectedOrder(targetOrder);
    setHighlightedOrderId(String(targetOrder._id || ""));
    document
      .getElementById(`order-card-${targetOrder._id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  const clearHighlightTimer = window.setTimeout(() => {
    setHighlightedOrderId("");
  }, 2600);

  navigate(location.pathname, { replace: true, state: {} });

  return () => {
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(clearHighlightTimer);
  };
}, [location.pathname, location.state, navigate, orders]);

const handleStartQuotation = async (order) => {
  const assignedExecutiveId = String(order?.assignedTo?._id || order?.assignedTo?.id || "");
  if (currentUser?.role === "operations" && assignedExecutiveId && assignedExecutiveId !== currentUserId) {
    return;
  }

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
          className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 px-6 py-4 mb-6 shadow-xs transition hover:border-amber-300"
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
              <p className="text-sm font-semibold text-slate-900">{avgTime}</p>
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
  const isActivityLogSelected = selectedOrder?._id === order._id;
  const receivedLog = order.activityLog?.find(
    (l) => l.action === "Query Received"
  );
  const baseTime = receivedLog?.timestamp || order.createdAt;
  const diffMs = relativeNow - new Date(baseTime);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const assignedExecutiveId = String(order.assignedTo?._id || order.assignedTo?.id || "");
  const latestReassignment = getLatestReassignmentEntry(order);
  const isAssignedToCurrentUser =
    currentUserId && assignedExecutiveId && assignedExecutiveId === currentUserId;
  const movedAwayFromCurrentUser =
    currentUser?.role === "operations" &&
    currentUserId &&
    !isAssignedToCurrentUser &&
    String(latestReassignment?.fromUser || latestReassignment?.fromUser?._id || "") === currentUserId;
  const receivedFrom =
    isAssignedToCurrentUser &&
    String(latestReassignment?.toUser || latestReassignment?.toUser?._id || "") === currentUserId
      ? latestReassignment?.fromName || ""
      : "";
  const isReceivedQuery = Boolean(receivedFrom);
  const isReadOnlyReassigned = Boolean(movedAwayFromCurrentUser);
  const assignedExecutive = order.assignedTo?.name || order.assignedTo?.email || "Unassigned";
  const readOnlyAssigneeName =
    latestReassignment?.toName || assignedExecutive || "another team member";
  const readOnlyReason = `This query is now assigned to ${readOnlyAssigneeName}. You can only view updates here.`;
  const adminCoordination = order.adminCoordination || {};
  const adminCoordinationStatus = String(adminCoordination.status || "idle");
  const pendingAdminReply = adminCoordinationStatus === "pending_admin_reply";
  const hasAdminReply = Boolean(String(adminCoordination.lastAdminReply || "").trim());
  const latestCoordinationEntry = Array.isArray(adminCoordination.thread) && adminCoordination.thread.length
    ? adminCoordination.thread[adminCoordination.thread.length - 1]
    : null;
  const orderStatusMeta = getOrderStatusMeta(order);
  const StatusBadgeIcon = orderStatusMeta.Icon;
  const latestQuotation = order.latestQuotation || null;
  const latestQuotationCreator = latestQuotation?.createdBy?.label || "";
  const latestQuotationAmount = Number(latestQuotation?.totalAmount || 0);
  const latestCoordinationSenderRole = String(latestCoordinationEntry?.senderRole || "").trim();
  const isAwaitingAdminReview =
    isOperationManagerView &&
    pendingAdminReply &&
    latestCoordinationSenderRole === "operation_manager";
  const isEscalationActionDisabled =
    isAdminView ||
    isReadOnlyReassigned ||
    (isOperationManagerView ? isAwaitingAdminReview : pendingAdminReply);
  const adminButtonLabel = isAdminView
    ? "Reply from Admin Dashboard"
    : isOperationManagerView
      ? isAwaitingAdminReview
        ? "Awaiting Admin Review"
        : hasAdminReply
          ? "Re-open with Admin"
          : "Pass to Admin"
    : pendingAdminReply
      ? "Awaiting Manager Review"
      : hasAdminReply
        ? "Re-open with Manager"
        : "Pass to Manager";

  return (
            <motion.div
              id={`order-card-${order._id}`}
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`border rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
                isReadOnlyReassigned ? "" : "hover:shadow-md"
              } ${
                highlightedOrderId === String(order._id)
                  ? "border-blue-400 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                  : isReadOnlyReassigned
                    ? "border-slate-300 bg-slate-100/90 opacity-80 shadow-none"
                  : isActivityLogSelected
                    ? "border-blue-300 bg-gradient-to-br from-blue-50/60 via-slate-50/90 to-indigo-50/30 shadow-[0_0_0_2px_rgba(59,130,246,0.1)]"
                  : "border-slate-200/90 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30 shadow-xs hover:border-slate-300"
              }`}
            >
              {/* TOP BAR */}
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-md font-bold text-slate-900">{order.queryId}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${orderStatusMeta.badgeClassName}`}>
                      <StatusBadgeIcon size={12} />
                      {orderStatusMeta.label}
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
                    {isReadOnlyReassigned ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700">
                        <TriangleAlert size={10} />
                        Read Only
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
                  <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100/60 transition">
                    <input
                      type="checkbox"
                      checked={isActivityLogSelected}
                      onChange={() => setSelectedOrder(isActivityLogSelected ? null : order)}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                    />
                    Show activity log
                  </label>
                  <div className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
                    <span className="text-[#62748E]">Est. Value:</span>
                    <span className="font-bold text-emerald-600 text-xs">
                      ₹{order.customerBudget?.toLocaleString("en-IN") || 0}
                    </span>
                  </div>
                </div>
              </div>

              {orderStatusMeta.noticeBody ? (
                <div className={`mb-4 rounded-2xl border p-4 ${orderStatusMeta.noticeClassName}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-2 ${orderStatusMeta.noticeIconClassName}`}>
                      <StatusBadgeIcon size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                        {orderStatusMeta.noticeTitle}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{orderStatusMeta.noticeBody}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {latestQuotation ? (
                <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                        Latest Quotation Sent
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {latestQuotation.quotationNumber || "Quotation"}
                        </span>
                        <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {latestQuotation.status || "Quote Sent"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {latestQuotationCreator
                          ? `Prepared and sent by ${latestQuotationCreator}.`
                          : "Prepared and sent by operations."}
                        {latestQuotation.updatedAtLabel ? ` Last updated ${latestQuotation.updatedAtLabel}.` : ""}
                      </p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Quote Total
                      </p>
                      <p className="mt-1 text-sm font-bold text-blue-700">
                        INR {latestQuotationAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* INFO GRID */}
              <div className={`mb-4 grid gap-3 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xs p-3 sm:p-3.5 text-sm text-gray-600 ${
                isReceivedQuery ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-4"
              }`}>
                <div className="flex flex-col justify-center rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-100/70 via-blue-50/40 to-white px-3.5 py-2.5 shadow-2xs transition hover:border-blue-300">
                  <div className="flex items-center gap-1.5 text-[#62748E] mb-1">
                    <MapPin size={13} className="text-blue-600 shrink-0" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900/80">Destination</p>
                  </div>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm font-sans truncate">{order.destination}</span>
                </div>

                <div className="flex flex-col justify-center rounded-xl border border-purple-200/80 bg-gradient-to-br from-purple-100/70 via-purple-50/40 to-white px-3.5 py-2.5 shadow-2xs transition hover:border-purple-300">
                  <div className="flex items-center gap-1.5 text-[#62748E] mb-1">
                    <Calendar size={13} className="text-purple-600 shrink-0" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/80">Travel Date</p>
                  </div>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm font-sans truncate">
                    {new Date(order.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                <div className="flex flex-col justify-center rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-100/70 via-orange-50/40 to-white px-3.5 py-2.5 shadow-2xs transition hover:border-orange-300">
                  <div className="flex items-center gap-1.5 text-[#62748E] mb-1">
                    <Clock size={13} className="text-orange-600 shrink-0" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-900/80">Duration</p>
                  </div>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm font-sans truncate">{getDuration(order.startDate, order.endDate)}</span>
                </div>

                <div className="flex flex-col justify-center rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-100/70 via-emerald-50/40 to-white px-3.5 py-2.5 shadow-2xs transition hover:border-emerald-300">
                  <div className="flex items-center gap-1.5 text-[#62748E] mb-1">
                    <Users size={13} className="text-emerald-600 shrink-0" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/80">Passengers</p>
                  </div>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm font-sans truncate">{order.numberOfAdults + order.numberOfChildren} PAX</span>
                </div>

                {isReceivedQuery ? (
                  <div className="flex flex-col justify-center rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-100/70 via-sky-50/40 to-white px-3.5 py-2.5 shadow-2xs transition hover:border-sky-300">
                    <div className="flex items-center gap-1.5 text-[#62748E] mb-1">
                      <UserCheck size={13} className="text-sky-600 shrink-0" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-sky-900/80">Assigned To</p>
                    </div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm font-sans truncate">{assignedExecutive}</span>
                  </div>
                ) : null}

                {isReceivedQuery ? (
                  <div className="flex flex-col justify-center rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-100/70 via-amber-50/40 to-white px-3.5 py-2.5 shadow-2xs transition hover:border-amber-300">
                    <div className="flex items-center gap-1.5 text-[#62748E] mb-1">
                      <UserCheck size={13} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/80">Received From</p>
                    </div>
                    <span className="font-bold text-amber-700 text-xs sm:text-sm font-sans truncate">{receivedFrom}</span>
                  </div>
                ) : null}
              </div>

              {isReadOnlyReassigned ? (
                <div className="mb-4 rounded-2xl border border-slate-300 bg-slate-200/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-slate-300 p-2 text-slate-700">
                      <TriangleAlert size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                        Reassigned By Manager
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{readOnlyReason}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        Actions are disabled for you because this booking has moved out of your queue.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* REQUIREMENTS */}
              {order.specialRequirements &&
                order.specialRequirements
                  .split("\n")
                  .filter((req) => req.trim() !== "").length > 0 && (
                <div className="mb-4 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xs p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Requirements & Preferences
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {order.specialRequirements
                      .split("\n")
                      .filter((req) => req.trim() !== "")
                      .map((req, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-xs text-slate-700 shadow-2xs transition hover:border-blue-200"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10.5px] font-bold text-blue-600 border border-blue-100">
                            {i + 1}
                          </span>
                          <p className="leading-snug font-medium text-slate-800 flex-1">{req.trim()}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.95 }}
                 onClick={() => {
                    if (isReadOnlyReassigned) return;
                    handleStartQuotation(order);
                  }}
                  disabled={isReadOnlyReassigned}
                  className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2 rounded-xl text-sm transition ${
                    isReadOnlyReassigned
                      ? "cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-500"
                      : "cursor-pointer bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <CheckCircle size={16} />
                  {isReadOnlyReassigned
                    ? "Query Reassigned"
                    : order.opsStatus === "Invoice_Requested"
                      ? "Open Approved Booking"
                      : order.opsStatus === "Revision_Query"
                        ? "Open Builder for Revision"
                        : String(order?.quotationStatus || "").trim() === "Sent_To_Agent"
                          ? "Open Sent Quotation"
                        : "Confirm & Create Quotation"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isEscalationActionDisabled) return;
                    setSelectedOrder(order);
                    setOpenModal(true);
                  }}
                  disabled={isEscalationActionDisabled}
                  className={`flex-1 flex items-center justify-center gap-2 border font-semibold py-2 rounded-xl text-sm transition ${
                    isReadOnlyReassigned
                      ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500"
                      : isEscalationActionDisabled
                        ? "cursor-not-allowed border-orange-200 bg-orange-50 text-orange-400"
                        : "cursor-pointer border-orange-300 text-[#BB4D00] hover:bg-orange-50"
                  }`}
                >
                  <TriangleAlert size={16} />
                  {isReadOnlyReassigned ? "Manager Reassigned" : adminButtonLabel}
                </motion.button>
              </div>
            </motion.div>
          )})}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {openModal ? (
          <PassToAdminModal
            onClose={() => setOpenModal(false)}
            order={selectedOrder}
            onSuccess={fetchOrders}
          />
        ) : null}
      </AnimatePresence>
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
