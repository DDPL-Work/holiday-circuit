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
      className=""
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
                        ₹
                        {quote.clientTotalAmount ??
                          quote.pricing?.totalAmount ??
                          0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Valid until{" "}
                      {quote.validTill
                        ? new Date(quote.validTill).toLocaleDateString()
                        : "-"}
                    </p>

                    {/* Inclusions */}
                    <div className="border border-[#BEDBFF] rounded-xl p-3 bg-white mb-4">
                      <h4 className="font-medium mb-2">Inclusions</h4>
                      <ul className="list-disc ml-5 text-xs text-gray-700 space-y-1">
                        {quote.inclusions?.length > 0 ? (
                          quote.inclusions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))
                        ) : (
                          <li>No inclusions provided</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex flex-col items-center gap-3">
                  {/* STEP 1: ACCEPT */}
                  {quote.agentStatus === "Quote Sent" && (
                    <div className="flex items-center justify-center gap-10 ">
                      <button
                        onClick={() => handleAcceptQuote(quote._id)}
                        className="bg-green-600 text-white px-8 py-1 rounded-full cursor-pointer"
                      >
                        Accept Quote
                      </button>
                      <button className="border border-[#BEDBFF] px-8 py-1 rounded-full cursor-pointer">
                        Request Revision
                      </button>
                    </div>
                  )}

                  {quote.agentStatus === "Quote Accepted" && (
                    <div className="flex items-center justify-center gap-10 ">
                      <button
                        onClick={() => {
                          setActiveQuoteId(quote._id);
                          setIsMarkupModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-8 py-1 rounded-full cursor-pointer"
                      >
                        Markup Agent
                      </button>
                      <button
                        onClick={() => handleSendToClient(quote._id)}
                        className="bg-green-600 text-white px-8 py-1 rounded-full cursor-not-allowed"
                      >
                        Send to Client
                      </button>
                    </div>
                  )}

                  {/* STEP 2:------------------- MARKUP MODAL--------------------------------------- */}

                  {isMarkupModalOpen &&
                    activeQuoteId === quote._id &&
                    quote.agentStatus === "Quote Accepted" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
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
                  {quote.agentStatus === "Markup Applied" && (
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

{/*============================================== PENDING UI ====================================================I */}
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
  <h3 className="font-semibold mb-4">Activity Log</h3>

  <div className="space-y-4 relative">

    {query.activityLog
      ?.slice()
      .reverse()
      .map((log, index) => (

        <div key={index} className="flex gap-3 relative">

          {/* Vertical Line */}
          {index !== query.activityLog.length - 1 && (
            <span className="absolute left-1 top-4 w-0.5 h-9.5 bg-gray-200"></span>
          )}

          {/* Dot */} 
          <span
            className={`w-2 h-2 rounded-full mt-2  z-10 ${
              actionColors[log.action] || "bg-gray-300"
            }`}
          ></span>

          {/* Content */}
          <div>
            <p className="text-xs font-medium">{log.action}</p>

            <p className="text-xs text-gray-500">
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
