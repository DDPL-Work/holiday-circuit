import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const QueryDetails = ({ query, onClose }) => {
  const [quotes, setQuotes] = useState([]);
  const [markupType, setMarkupType] = useState("PERCENT");
  const [markupValue, setMarkupValue] = useState("");
  const [isMarkupModalOpen, setIsMarkupModalOpen] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState(null);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await API.get(`/agent/quotations/query/${query._id}`);
        console.log("res", res.data.quotations);
        setQuotes(res.data.quotations || []);
      } catch (err) {
        console.error("Error fetching quotations:", err);
      }
    };
    fetchQuotations();
  }, [query._id]);

  const updateQuote = (updatedQuote) => {
    setQuotes((prev) =>
      prev.map((q) => (q._id === updatedQuote._id ? updatedQuote : q)),
    );
  };

  const handleAcceptQuote = async (quoteId) => {
    try {
      const res = await API.patch(`/agent/quotations/${quoteId}/accept`, {
        action: "ACCEPT",
      });
      toast.success("Quote accepted");
      updateQuote(res.data.quotation);
      setActiveQuoteId(quoteId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  const handleApplyMarkup = async (id) => {
    try {
      const res = await API.patch(`/agent/quotations/${id}/accept`, {
        action: "APPLY_MARKUP",
        markupType,
        markupValue: Number(markupValue),
      });
      toast.success("Markup applied");
      updateQuote(res.data.quotation);
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  const handleSendToClient = async (id) => {
    try {
      const res = await API.patch(`/agent/quotations/${id}/accept`, {
        action: "SEND_TO_CLIENT",
      });
      toast.success("Quote sent to client");
      updateQuote(res.data.quotation);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  const handleClose = () => onClose();

  const actionColors = {
  "Query Created": "bg-cyan-500",
  "Query Accepted": "bg-yellow-500",
  "Query Rejected": "bg-red-500",
  "Revision Requested": "bg-orange-500",
  "Quote Sent": "bg-blue-600",
  "Booking Confirmed": "bg-green-600",
  "Invoice Generated": "bg-purple-600"
};

  return (
    <motion.div
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="p-2"
    >
      {/* Header */}
      <motion.div
        variants={itemVariant}
        className="flex justify-between items-start mb-2 mt-2 overflow-y-auto
             scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent"
      >
        <div className="flex items-center">
          <button
            onClick={handleClose}
            className="text-lg rounded-xl px-4 py-1 border-gray-300 hover:bg-gray-100 cursor-pointer "
          >
            <ArrowLeft className="w-5 h-5 stroke-[1.8] text-black" />
          </button>
          <div>
            <h2 className="text-lg font-bold">{query.destination}</h2>
            <p className="text-xs text-gray-500">
              ID: {query.queryId} • Created on{" "}
              {new Date(query.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/*========================================= Status ============================== */}

        {query.agentStatus === "Quote Sent" && (
          <span className="bg-green-100 text-green-700 px-3 py-2 rounded-full text-xs">
            Quote Sent
          </span>
        )}
        {query.agentStatus === "Pending" && (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
            Pending
          </span>
        )}
        {query.agentStatus === "Revision Requested" && (
          <span className="bg-red-400 text-white px-3 py-1 rounded-full text-xs">
            Revision Requested
          </span>
        )}

      </motion.div>

      <div className="grid grid-cols-3 gap-4 p-5">
        {/* LEFT MAIN SECTION */}
        <div className="col-span-2 space-y-4">
          {/* QUOTE SENT UI */}
          {query.agentStatus === "Quote Sent" &&
            quotes.length > 0 &&
            quotes.map((quote, index) => (
              <motion.div
                key={quote._id}
                variants={itemVariant}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl p-4 bg-[#F6F9FD] shadow-sm border border-[#BEDBFF]"
              >
                {quote.agentStatus === "Sent to Client" ? (
                  // ✅ FINAL MESSAGE ONLY
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <p className="text-sm font-medium text-green-700">
                      Quotation has been sent to the client
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex flex-col gap-1.5">
                      Waiting for client confirmation
                      <span className="text-2xl animate-bounce">👍</span>
                    </p>
                  </div>
                ) : (
                  <>
                    {/* PRICE */}
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-lg">
                        Quotation Received
                      </h3>
                      <span className="text-blue-600 font-bold text-lg">
                       ₹{(quote.clientTotalAmount ?? quote.pricing?.totalAmount ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Valid until{" "}
                      {quote.validTill
                        ? new Date(quote.validTill).toLocaleDateString()
                        : "-"}
                    </p>

  {/* ==============================  Inclusions Card Section  ========================================*/}

 <div className="border border-[#BEDBFF] rounded-xl p-3 bg-white mb-4">
  <div className="flex items-center gap-2 mb-3">
    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    </div>
    <h4 className="font-semibold text-sm text-gray-900">Inclusions</h4>
    {(quote.services?.length > 0 || quote.inclusions?.length > 0) && (
      <span className="ml-auto bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
        {quote.services?.length || quote.inclusions?.length} items
      </span>
    )}
  </div>

  <ul className="space-y-2">
    {quote.inclusions?.length > 0 ? (
      quote.inclusions.map((item, idx) => (
        <li key={idx} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700">
          {item}
        </li>
      ))
    ) : quote.services?.length > 0 ? (
      quote.services.map((service, idx) => {
        if (service.type === "hotel") {
          const amenities = (service.description || "").split("|").map(s => s.trim()).filter(Boolean);
          return (
            <li key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3" style={{ borderLeft: "3px solid #3b82f6" }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-gray-900">{service.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="text-[11px] text-gray-400">{service.city}, {service.country}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <span className="flex items-center gap-1 bg-blue-100 text-blue-700 rounded-md px-2 py-0.5 text-[11px] font-semibold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
                    </svg>
                    {service.nights}N
                  </span>
                  <span className="flex items-center gap-1 bg-purple-100 text-purple-700 rounded-md px-2 py-0.5 text-[11px] font-semibold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/>
                    </svg>
                    {service.rooms}R
                  </span>
                </div>
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {amenities.map((a, i) => (
                    <span key={i} className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-500">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        }

        if (service.type === "transfer") {
          const amenities = (service.description || "").split("|").map(s => s.trim()).filter(Boolean);
          return (
            <li key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3" style={{ borderLeft: "3px solid #10b981" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-xs text-gray-900">{service.title}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-[11px] text-gray-400">{service.city}, {service.country}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {service.vehicleType && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-800 rounded-md px-2 py-0.5 text-[11px] font-semibold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    {service.vehicleType}
                  </span>
                )}
                {service.passengerCapacity > 0 && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-800 rounded-md px-2 py-0.5 text-[11px] font-semibold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                    {service.passengerCapacity} Pax
                  </span>
                )}
                {service.luggageCapacity > 0 && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-800 rounded-md px-2 py-0.5 text-[11px] font-semibold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="7" width="12" height="14" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                    </svg>
                    {service.luggageCapacity} Luggage
                  </span>
                )}
                {service.usageType && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-800 rounded-md px-2 py-0.5 text-[11px] font-semibold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
                    </svg>
                    {service.usageType}
                  </span>
                )}
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {amenities.map((a, i) => (
                    <span key={i} className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-500">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        }

        return null;
      })
    ) : (
      <li className="text-center py-4 text-xs text-gray-400">No inclusions provided</li>
    )}
  </ul>
</div>
 </>
)}

                <div className="flex flex-col items-center gap-3">
                  {/* STEP 1: ACCEPT */}
                  {quote.status === "Quote Sent" && (
                    <div className="flex items-center justify-center gap-10 ">
                      <button
                        onClick={() => handleAcceptQuote(quote._id)}
                        className="bg-green-600 text-white  text-[10px] px-8 py-1 rounded-full cursor-pointer"
                      >
                        Accept Quote
                      </button>
                      <button className="border border-[#BEDBFF]  text-[10px] px-8 py-1 rounded-full cursor-pointer">
                        Request Revision
                      </button>
                    </div>
                  )}
                  {quote.status === "Quote Accepted" && (
                    <div className="w-103 flex items-center justify-between gap-20 ">
                      <button
                        onClick={() => {
                          setActiveQuoteId(quote._id);
                          setIsMarkupModalOpen(true);
                        }}
                        className="bg-blue-800 text-white text-[10px] px-8 py-2 rounded-full cursor-pointer"
                      >
                        Markup Agent
                      </button>
                      <button
                        onClick={() => handleSendToClient(quote._id)}
                        className="bg-green-800 text-white text-[10px] px-8 py-2 rounded-full cursor-not-allowed"
                      >
                        Send to Client
                      </button>
                    </div>
                  )}

                  {/* STEP 2:------------------- MARKUP MODAL--------------------------------------- */}

                  {isMarkupModalOpen &&
                    activeQuoteId === quote._id &&
                    quote.status === "Quote Accepted" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                      >
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative">
                          <div className="mb-4">
                            <h2 className="text-lg font-semibold">
                              Apply Agent Markup
                            </h2>
                            <p className="text-xs text-gray-500">
                              Set your margin before sending quotation to client
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-medium text-gray-600">
                                Markup Type
                              </label>
                              <select
                                value={markupType}
                                onChange={(e) => setMarkupType(e.target.value)}
                                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                              >
                                <option value="PERCENT">Percentage (%)</option>
                                <option value="AMOUNT">Fixed Amount (₹)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">
                                Markup Value
                              </label>
                              <input
                                type="number"
                                placeholder="Enter value"
                                value={markupValue}
                                onChange={(e) => setMarkupValue(e.target.value)}
                                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 mt-6">
                            <button
                              onClick={() => setIsMarkupModalOpen(false)}
                              className="px-5 py-1.5 rounded-full border text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                await handleApplyMarkup(activeQuoteId);
                                setIsMarkupModalOpen(false);
                              }}
                              className="px-6 py-1.5 rounded-full bg-blue-600 text-white text-sm cursor-pointer"
                            >
                              Apply Markup
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  {/* STEP 3:-------------------------- SEND TO CLIENT------------------- */}
                  {quote.status === "Markup Applied" && (
                    <div className="flex items-center justify-center gap-15 ">
                      <button className="bg-blue-600 text-white px-10 py-1.5 rounded-full cursor-not-allowed">
                        Markup Agent
                      </button>
                      <button
                        onClick={() => handleSendToClient(quote._id)}
                        className="bg-green-600 text-white px-10 py-1.5 rounded-full cursor-pointer"
                      >
                        Send to Client
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

{/*============================================== PENDING UI ===================================================I */}
          {query.agentStatus === "Pending" && (
            <motion.div
              variants={itemVariant}
              className="rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center gap-2 bg-white"
            >
              <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
                ⏳
              </div>
              <h3 className="font-semibold text-sm">
                Waiting for quotation from operations team
              </h3>
              <p className="text-xs text-gray-500">Expected within 24 hours</p>
            </motion.div>
          )}
 {/*======================================= REVISION REQUESTED UI =========================================== */}

          {query.agentStatus === "Revision Requested" && (
            <motion.div
              variants={itemVariant}
              className="rounded-2xl p-4 border border-red-300 bg-red-50 shadow-sm"
            >
              <h3 className="font-semibold text-lg text-red-600 mb-2">
                Revision Requested
              </h3>
              <p className="text-xs text-gray-700 mb-4">
                 {query.rejectionNote || "Operations team requested changes."}
              </p>
              <button className="border border-red-400 text-red-600 text-sm px-8 py-1.5 rounded-full cursor-pointer">
                View Requested Changes
              </button>
            </motion.div>
          )}
          
{/*======================================= IN PROGRESS UI =========================================== */}

{query.agentStatus === "In Progress" && (
  <motion.div
    variants={itemVariant}
    className="rounded-2xl p-6 border border-blue-200 shadow-sm flex flex-col items-center justify-center text-center gap-2 bg-blue-50"
  >
    <div className="w-10 h-10 rounded-full border-2 border-blue-400 flex items-center justify-center">
      ⚙️
    </div>
    <h3 className="font-semibold text-sm text-blue-700">
      Your quotation is being prepared
    </h3>
    <p className="text-xs text-gray-600">
      Our operations team is currently working on your travel plan.
    </p>
    <p className="text-xs text-gray-500">
      You will be notified once the quotation is ready.
    </p>
  </motion.div>
)}

{/*==================================== REQUIREMENTS ================================================== */}
          <motion.div
            variants={itemVariant}
            className="border border-gray-200 shadow-sm rounded-2xl p-4"
          >
            <h3 className="font-semibold text-lg mb-3">Requirements</h3>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <p className="text-gray-500">Dates</p>
                <p className="font-medium">
                  {new Date(query.startDate).toLocaleDateString("en-IN")} –{" "}
                  {new Date(query.endDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Travelers</p>
                <p className="font-medium">
                  {query.numberOfAdults} Adults
                  {query.numberOfChildren > 0 &&
                    `, ${query.numberOfChildren} Kids`}
                </p>
              </div>
            </div>

   <div className="mt-2 text-xs">
   <p className="text-gray-700 mb-2 ">Preferences</p>
  {query.specialRequirements ? (
    <div className="flex flex-wrap gap-2">
      {query.specialRequirements
       .split(/[.,;\n]/)
        .filter((item) => item.trim() !== "")
        .map((item, index) => (
          <span
            key={index}
            className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-900 border border-blue-300 rounded-full"
          >
            {item.trim()}
          </span>
        ))}
    </div>
  ) : (
    <p className="font-medium">No special preferences</p>
  )}
</div>
</motion.div>


</div>

{/*============================================ RIGHT ACTIVITY LOG ===================================*/}
<motion.div
  variants={itemVariant}
  className="border border-gray-200 shadow-sm rounded-2xl p-5 h-fit"
>
  {/* Header */}
  <div className="flex items-center gap-2 mb-5">
    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    </div>
    <h3 className="font-semibold text-sm text-gray-900">Activity Log</h3>
    {query.activityLog?.length > 0 && (
      <span className="ml-auto bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        {query.activityLog.length} events
      </span>
    )}
  </div>

  <div className="space-y-1 relative">
    {query.activityLog?.slice().reverse().map((log, index) => (
      <div key={index} className="flex gap-3 relative">

        {/* Vertical Line */}
        {index !== query.activityLog.length - 1 && (
          <span className="absolute left-[5px] top-4 w-0.5 h-full bg-gray-100 z-0" />
        )}

        {/* Dot */}
        <span
          className={`w-3 h-3 rounded-full mt-1.5 z-10 flex-shrink-0 ring-2 ring-white ${
            actionColors[log.action] || "bg-gray-300"
          }`}
        />

        {/* Content */}
        <div className="pb-4 flex-1">
          <p className="text-xs font-semibold text-gray-800 leading-tight">{log.action}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {new Date(log.timestamp).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

      </div>
    ))}
  </div>
</motion.div>
</div>
    </motion.div>
  );
};

export default QueryDetails;




