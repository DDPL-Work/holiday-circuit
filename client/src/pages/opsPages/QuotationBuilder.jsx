import { Send } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { FaWater } from "react-icons/fa";
import { GiCityCar, GiModernCity, GiWaterPolo } from "react-icons/gi";
import { LiaHotelSolid } from "react-icons/lia";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useLocation } from "react-router-dom";
import API from "../../utils/Api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import QuickAddServiceModal from "../../modal/QuickAddServiceModal";
import PackageTemplate from "./PackageTemplate";
import { ImLocation2 } from "react-icons/im";


const QuotationBuilder = () => {
  // markup
  const [showOpsPopup, setShowOpsPopup] = useState(false);

  // markup
  const [markup, setMarkup] = useState(5);
  const [showSendOptions, setShowSendOptions] = useState(false);

  const [notes, setNotes] = useState("");

  // ops charges
  const [serviceCharge, setServiceCharge] = useState(0);
  const [handlingFee, setHandlingFee] = useState(0);

  // const [baseAmount, setBaseAmount] = useState(0);

  const location = useLocation();
  const order = location.state;
  console.log("ref", order);
  const navigate = useNavigate();

  const [appliedTaxTotal, setAppliedTaxTotal] = useState(0);

  // tax toggle
  const [gstChecked, setGstChecked] = useState(false);
  const [tcsChecked, setTcsChecked] = useState(false);
  const [tourismChecked, setTourismChecked] = useState(false);

  // manual override
  const [gstAmount, setGstAmount] = useState("");
  const [tcsAmount, setTcsAmount] = useState("");
  const [tourismAmount, setTourismAmount] = useState("");

  // quotation
  const [validTill, setValidTill] = useState("");

  const [draftServiceCharge, setDraftServiceCharge] = useState(0);
  const [draftHandlingFee, setDraftHandlingFee] = useState(0);
  const [draftValidTill, setDraftValidTill] = useState("");

  const [draftGstChecked, setDraftGstChecked] = useState(false);
  const [draftTcsChecked, setDraftTcsChecked] = useState(false);
  const [draftTourismChecked, setDraftTourismChecked] = useState(false);

  const [draftGstAmount, setDraftGstAmount] = useState(0);
  const [draftTcsAmount, setDraftTcsAmount] = useState(0);
  const [draftTourismAmount, setDraftTourismAmount] = useState(0);

  const [showQuickServiceModal, setShowQuickServiceModal] = useState(false);
  const [marginType, setMarginType] = useState("percentage");
  const [fixedMargin, setFixedMargin] = useState(0);
  const [taxMode, setTaxMode] = useState("auto");

  const [services, setServices] = useState([]);

  const getServiceMeta = (type) => {
  switch (type) {
    case "hotel":
      return {
        icon: <LiaHotelSolid className="w-6 h-5 bg-blue-500 text-white rounded-md p-0.5"/>,
        color: "text-blue-400"
      };

    case "activity":
      return {
        icon: <FaWater className=" w-6 h-5 bg-[#00C950] text-white rounded-md p-0.5"/>,
        color: "text-green-400 text-[18px]"
      };

    case "transfer":
    case "car":
      return {
        icon: <GiCityCar className=" w-6 h-5 bg-[#AD46FF] text-white rounded-md p-0.5"/>,
        color: "text-blue-400"
      };

    case "sightseeing":
      return {
        icon: <GiModernCity className=" w-6 h-5 bg-blue-500 text-white rounded-md p-0.5"/>,
        color: "text-purple-400"
      };

    default:
      return {
        icon: <GiModernCity />,
        color: "text-gray-400"
      };
  }
};


  useEffect(() => {
  const loadServices = async () => {
    try {
    const res = await API.get("/ops/dmcAllGetServices");
    console.log("services", res.data.data);
    const formatted = res.data.data.map((s) => {
  const meta = getServiceMeta(s.type);
  return {
    id: s.id,
    type: s.type,
    title: s.title,
    desc: s.description || "",
    city: s.city || "",
    country: s.country || "",

    rate: s.price || 0,
    currency: s.currency,
    nights: 1,
    days: 1,
    pax: 1,
    checked: false,
    custom: false,
    icon: meta.icon,
    color: meta.color
  };
});

setServices(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  loadServices();
}, []);



  const addCustomService = (data) => {
    setServices((prev) => [
      ...prev,
      {
        id: Date.now(),
        checked: true,
        custom: true,
        ...data,
      },
    ]);
  };

  const deleteService = (id) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // const servicesTotal = services
  //   .filter((s) => s.checked)
  //   .reduce((sum, s) => {
  //     let qty = 1;

  //     if (s.type === "hotel") qty = s.nights;
  //     if (s.type === "transfer" || s.type === "car") qty = s.days;
  //     if (s.type === "pax") qty = s.pax;

  //     return sum + s.rate * qty;
  //   }, 0);

  // base values
 
  const  servicesTotal = useMemo(() => {
  return services
    .filter((s) => s.checked === true)
    .reduce((sum, s) => {
      if (s.type === "hotel") {
        return sum + s.rate * s.nights;
      }
      if (s.type === "transfer" || s.type === "car") {
        return sum + s.rate * s.days;
      }
      if (s.type === "activity") {
        return sum + s.rate * s.pax;
      }
     if (s.type === "sightseeing") {
  const pax = s.pax || 1;
  const days = s.days || 1;

  return sum + s.rate * Math.max(pax, days);
}
      return sum;
    }, 0);
}, [services]);
  
  const baseRate = Number(order?.customerBudget || 0);

  //  const serviceFeeAmount = Number(
  //   showOpsPopup ? draftServiceCharge : serviceCharge
  // );

  // const handlingFeeAmount = Number(
  //   showOpsPopup ? draftHandlingFee : handlingFee
  // );

  const serviceFeeAmount = Number(serviceCharge || 0);
  const handlingFeeAmount = Number(handlingFee || 0);

  // subtotal
  const subTotal = servicesTotal;

  // const gstCheckedFinal = showOpsPopup ? draftGstChecked : gstChecked;
  // const tcsCheckedFinal = showOpsPopup ? draftTcsChecked : tcsChecked;
  // const tourismCheckedFinal = showOpsPopup
  //   ? draftTourismChecked
  //   : tourismChecked;

  // const gstAmountFinal = showOpsPopup ? draftGstAmount : gstAmount;
  // const tcsAmountFinal = showOpsPopup ? draftTcsAmount : tcsAmount;
  // const tourismAmountFinal = showOpsPopup ? draftTourismAmount : tourismAmount;

  // const gstCheckedFinal = gstChecked;
  // const tcsCheckedFinal = tcsChecked;
  // const tourismCheckedFinal = tourismChecked;

  // const gstAmountFinal = gstAmount;
  // const tcsAmountFinal = tcsAmount;
  // const tourismAmountFinal = tourismAmount;

  const draftGstAuto = draftGstChecked ? (baseRate * 5) / 100 : 0;
  const draftTcsAuto = draftTcsChecked ? (baseRate * 0.1) / 100 : 0;
  const draftTourismAuto = draftTourismChecked ? 500 : 0;

  const draftGstFinal = draftGstChecked
    ? Number(draftGstAmount || draftGstAuto)
    : 0;

  const draftTcsFinal = draftTcsChecked
    ? Number(draftTcsAmount || draftTcsAuto)
    : 0;

  const draftTourismFinal = draftTourismChecked
    ? Number(draftTourismAmount || draftTourismAuto)
    : 0;

  const draftTaxationTotal = draftGstFinal + draftTcsFinal + draftTourismFinal;

  // OPS markup
  let opsMarkup = 0;

  if (marginType === "percentage") {
    opsMarkup = (baseRate * Number(markup || 0)) / 100;
  } else {
    opsMarkup = Number(fixedMargin || 0);
  }

  // OPS charges
  const opsChargesTotal = serviceFeeAmount + handlingFeeAmount;

  // markup amount (OPS charges + markup + tax)
  const markupAmount = opsChargesTotal + opsMarkup + appliedTaxTotal;

  // total amount
  const totalAmount = baseRate + subTotal + markupAmount;


  //=========================================== Api call ======================================

  const sendQuotation = async () => {
    if (!validTill) {
      toast.error("Please select Valid Till date");
      return;
    }
   if (!servicesTotal) {
  toast.error("No services selected");
  return;
}
    const loadingToast = toast.loading("Sending quotation...");

    try {
      const payload = {
        queryId: order.queryId,
        validTill,
        baseAmount,

        opsPercent: marginType === "percentage" ? markup : 0,
        opsAmount: opsMarkup,

        serviceCharge,
        handlingFee,

        gstPercent: draftGstChecked ? 5 : 0,
        gstAmount: gstAmount || 0,

        tcsPercent: draftTcsChecked ? 0.1 : 0,
        tcsAmount: tcsAmount || 0,

        tourismAmount: tourismAmount || 0,
      };
      const res = await API.post("/ops/quotations", payload);
      toast.dismiss(loadingToast);
      console.log("Quotation created", res.data);
      toast.success("Quotation sent successfully");
    } catch (error) {
      console.error("Quotation error", error);
      toast.error(error.response?.data?.message || "Failed to send quotation");
    }
  };

  const getDuration = (start, end) => {
    if (!start || !end) return "";

    const startDate = new Date(start);
    const endDate = new Date(end);

    const diff = endDate - startDate;

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const nights = days - 1;

    return `${nights}N / ${days}D`;
  };

  const totalPassengers =
  Number(order?.numberOfAdults || 0) + Number(order?.numberOfChildren || 0);
  const costPerPassenger =
  totalPassengers > 0 ? totalAmount / totalPassengers : 0;

  const toggleService = (id) => {
    setServices((prev) =>
    prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)),
    );
  };

  const updateField = (id, field, value) => {
    setServices((prev) =>
    prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };


  return (
    <>
      <div className="min-h-screen bg-black text-white p-3 font-sans">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-yellow-400 text-sm cursor-pointer"
          >
            ← Back to Order Acceptance
          </button>
          <div className="text-yellow-400 font-semibold">
            <p className="text-right text-[#90a1b9] text-xs">Query ID</p>
            <span className="font-bold">{order.queryId}</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold">Quotation Builder</h1>
        <p className="text-gray-400 mb-6">
          Create a quote from contracted rates
        </p>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">

        {/* Query Info */}
<div className="bg-[#0b0f19] rounded-2xl p-6 border border-yellow-500/50">
  <h2 className="text-md font-semibold text-white mb-6">
    Query Information
  </h2>

  <div className="grid grid-cols-2 gap-x-3 gap-y-4">
    
    {/* Agent Name */}
    <div>
      <p className="text-gray-400 text-xs mb-1">Agent Name</p>
      <p className="text-white text-xs font-medium">
        {order?.agent?.companyName}
      </p>
    </div>

    {/* Agent Email */}
    <div>
      <p className="text-gray-400 text-xs mb-1">Agent Email</p>
      <p className="text-white  text-xs font-medium">
        {order?.agent?.email}
      </p>
    </div>

    {/* Destination */}
    <div>
      <p className="text-gray-400 text-xs mb-">Destination</p>
      <p className="text-white  text-xs font-medium">
        {order?.destination}
      </p>
    </div>

    {/* Travel Date */}
    <div>
      <p className="text-gray-400 text-xs mb-">Travel Date</p>
      <p className="text-white  text-xs font-medium">
        {new Date(order?.startDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </div>

    {/* Duration */}
    <div>
      <p className="text-gray-400 text-xs">Duration</p>
      <p className="text-white  text-xs font-medium">
        {getDuration(order?.startDate, order?.endDate)}
      </p>
    </div>

    {/* Passengers */}
    <div>
      <p className="text-gray-400 text-xs">Passengers</p>
      <p className="text-white  text-xs font-medium">
        {order?.numberOfAdults + order?.numberOfChildren} PAX
      </p>
    </div>

  </div>
</div>

 <PackageTemplate onApply={(pkg) => { console.log(pkg);}}/>

{/*=================================== Select Contracted Rates Service =============================== */}

            <div className="h-120 overflow-y-auto custom-scroll  bg-black pr-1">
              <div className="sticky top-0 bg-black mb-3 z-10 flex items-center justify-between p-2 ">
                <h2 className="font-semibold mb-1.5 ">
                  Select Contracted Rates
                </h2>                                                                       

                <button
                  onClick={() => setShowQuickServiceModal(true)}
                  className="text-xs bg-yellow-400 text-black px-3 py-2 rounded-lg hover:bg-yellow-500 font-medium cursor-pointer"
                >
                  + Quick Add Service
                </button>
              </div>
              {/* Service Card */}
              {services.map((service) => (
                <Service
                  key={service.id}
                  service={service}
                  toggleService={toggleService}
                  updateField={updateField}
                  deleteService={deleteService}
                />
              ))}
            </div>
            {/* Notes */}
            <div className="bg-[#0e0e0e] border border-gray-700 rounded-3xl p-4">
              <p className="text-gray-400 mb-2">Additional Notes (Optional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add special terms, inclusions, exclusions, or any important information for the agent..."
                className="w-full bg-black border border-gray-600 rounded-xl p-3 text-sm"
                rows={4}
              />
            </div>
          </div>

          {/*========================= RIGHT SIDE =================================================== */}

          <div className="space-y-6">
            {/*=========================== DMC Margin Section ============================= */}

            <div className="bg-[#1a1600] border border-yellow-500 rounded-xl p-6">
              {/* Title */}
              <h2 className="font-semibold mb-4 text-start flex items-center gap-2">
                OPS Margin
              </h2>

              {/* Margin Type */}
              <p className="text-sm text-gray-300 mb-1 text-start">
                Margin Type
              </p>

              <select
                value={marginType}
                onChange={(e) => setMarginType(e.target.value)}
                className="w-full bg-black border text-sm mt-1 border-yellow-500 rounded-2xl pl-4 p-2 mb-4 outline-none text-white cursor-pointer"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>

 {/*========================================= Markup Percentage Section ================================ */}

              <p className="text-sm text-gray-300 mb-2 text-start">
                {marginType === "percentage"
                  ? "Markup Percentage"
                  : "Fixed Margin"}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={marginType === "percentage" ? markup : fixedMargin}
                  onChange={(e) =>
                    marginType === "percentage"
                      ? setMarkup(e.target.value)
                      : setFixedMargin(e.target.value)
                  }
                  className="w-full bg-black border border-yellow-500 text-sm font-bold rounded-2xl text-start pl-5 p-2 outline-none"
                />

                <span className="text-yellow-400 text-lg">
                  {marginType === "percentage" ? "%" : "₹"}
                </span>
              </div>
            </div>

{/* ==================================== Price Breakdown Section ============================================ */}

            <div className="bg-[#0e0e0e] border border-gray-700 rounded-xl p-4 text-sm space-y-4">
              <div className="flex  gap-3">
                <h2 className="font-semibold mb-2">Price Breakdown</h2>

                <button
                  onClick={() => {
                    setShowOpsPopup(true);

                    setDraftServiceCharge(serviceCharge);
                    setDraftHandlingFee(handlingFee);
                    setDraftValidTill(validTill);

                    setDraftGstChecked(gstChecked);
                    setDraftTcsChecked(tcsChecked);
                    setDraftTourismChecked(tourismChecked);

                    setDraftGstAmount(gstAmount);
                    setDraftTcsAmount(tcsAmount);
                    setDraftTourismAmount(tourismAmount);
                  }}
                  className="text-xs bg-yellow-400 text-black px-3 py-1 rounded-lg hover:bg-yellow-500 font-medium cursor-pointer"
                >
                  + OPS Charges
                </button>
              </div>
              <p className="flex justify-between border-b border-[#232426] ">
                <span className="text-[#90A1B9] mb-2">Selected Items</span>
                <span>{services.filter((s) => s.checked).length} items</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">Subtotal (Base Rates)</span>
                <span>₹{baseRate}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">
                  OPS Markup (
                  {marginType === "percentage"
                    ? `${markup}%`
                    : `₹${fixedMargin}`}
                  )
                </span>
                <span className="text-yellow-400">
                  {" "}
                  ₹{opsMarkup.toFixed(2)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#90A1B9]">
                  Taxes (GST + TCS + Other)
                </span>
                <span
                  className={`${
                    appliedTaxTotal > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  ₹{appliedTaxTotal.toFixed(2)}
                </span>
              </p>
              <div className="flex justify-between text-lg font-bold mt-4  border-t border-t-yellow-400 ">
                <span className="mt-1.5">Total Amount</span>
                <span className="text-yellow-400 mt-1.5">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="flex justify-between text-gray-400">
                <span>Cost per Passenger</span>
                <span>₹{costPerPassenger.toFixed(2)}</span>
              </p>
            </div>

{/*============================================ Buttons Finalize Button ==================================  */}
<div className="relative w-full">
  <button
    onClick={() => setShowSendOptions(!showSendOptions)}
    className="w-full bg-yellow-400 text-black text-md py-2 rounded-xl font-semibold hover:bg-yellow-500 flex items-center justify-center gap-2 cursor-pointer"
  >
    <Send />
    Finalize & Send Quote
  </button>

  {/*======================== POPUp Send To =================================================== */}
 {/* Popup */}
  <div
    className={`absolute bottom-full mb-3 right-0 w-69 backdrop-blur-xl
      bg-linear-to-br from-[#8787875e] to-[#11111113] border border-gray-700/60
      rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden z-50
      transform transition-all duration-300 ease-out origin-bottom-right
      ${showSendOptions ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
        : "opacity-0 scale-95 translate-y-2 pointer-events-none"
      }`}
  >
    {/** Header Info */}
    <div className="px-5 py-3 border-b border-gray-700/60">
      <p className="text-sm text-gray-400">Agent: {order?.agent?.companyName}</p>
      <p className="text-xs text-gray-500">Email: {order?.agent?.email}</p>
      <p className="text-xs text-gray-500">
        Selected Services: {services.filter(s => s.checked).length}
      </p>
      <p className="text-xs text-gray-500">
        Total Amount: ₹{totalAmount.toFixed(2)}
      </p>
    </div>

    {/** Options */}
    {["Dashboard Notification", "Email", "WhatsApp", "PDF Download", "Copy Text"].map((option, idx) => (
      <div
        key={idx}
        onClick={() => alert(`${option} triggered!`)}
        className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 cursor-pointer border-b border-gray-700/60"
      >
        <span className="text-lg">
          {option === "Email" ? "📧" :
           option === "WhatsApp" ? "💬" :
           option === "PDF Download" ? "⬇" :
           option === "Copy Text" ? "📋" : "🔔"}
        </span>
        <div>
          <p className="text-sm font-medium text-white">{option}</p>
          <p className="text-xs text-gray-400">
            {option === "Email" ? `Send to ${order?.agent?.email}` : ""}
            {option === "WhatsApp" ? "Direct message link" : ""}
            {option === "PDF Download" ? "Formatted quote document" : ""}
            {option === "Copy Text" ? "Plain text format" : ""}
            {option === "Dashboard Notification" ? "In-app alert to agent" : ""}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

            <button className="w-full bg-white py-2 text-md font-semibold text-gray-600 rounded-xl hover:text-gray-600 cursor-pointer">
              Save as Draft
            </button>

            {/* Footer Note */}
            <p className="text-xs border p-5 rounded-2xl text-[#8EC5FF] bg-[#2B7FFF1A]">
              Note: The quotation will be sent to{" "}
              {order?.agent?.email || "agent email"}.Once the agent uploads the
              payment receipt, you can track the Note:verification status in the
              Booking Hub. {order?.agent?.email || "agent email"}
            </p>
          </div>
        </div>

{/*======================== ✅ POPUP Ops Charges =============================================*/}

    {showOpsPopup && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80  animate-slideDown">
            <div className="w-200 bg-linear-to-br mt-2  from-[#111] to-[#1c1c1c] border border-yellow-500/40 rounded-2xl shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-yellow-400 font-semibold text-lg">
                  Charges & Taxation
                </h2>
          
                <button
                  onClick={() => setShowOpsPopup(false)}
                  className="text-gray-400 hover:text-red-400 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 2 Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/*========================= OPS CHARGES ========================================= */}

                <div className="border border-gray-700 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3">OPS Charges</h3>

                  <div className="mb-3">
                    <label className="text-xs text-gray-400">
                      Service Charge
                    </label>
                    <input
                      type="number"
                      value={draftServiceCharge}
                      onChange={(e) =>
                        setDraftServiceCharge(Number(e.target.value))
                      }
                      className="w-full mt-1 bg-black border border-gray-700 rounded-xl px-3 py-2 text-sm focus:border-yellow-400 outline-none"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-gray-400">
                      Handling Fee
                    </label>
                    <input
                      type="number"
                      value={draftHandlingFee}
                      onChange={(e) =>
                        setDraftHandlingFee(Number(e.target.value))
                      }
                      className="w-full mt-1 bg-black border border-gray-700 rounded-xl px-3 py-2 text-sm focus:border-yellow-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">Valid Till</label>
                    <input
                      type="date"
                      value={draftValidTill}
                      onChange={(e) => setDraftValidTill(e.target.value)}
                      className="w-full mt-1 bg-black border border-gray-700 rounded-xl px-3 py-2 text-sm focus:border-yellow-400 outline-none"
                    />
                  </div>
                </div>

                {/*============================== TAXATION CHARGES ===============================================*/}

                <div className="border border-gray-700 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold">Taxation</h3>
                    <span
                      onClick={() => {
                        setTaxMode("auto");
                        setDraftGstChecked(true);
                        setDraftTcsChecked(true);
                        setDraftTourismChecked(true);
                      }}
                      className={`text-sm cursor-pointer border px-2 py-1 rounded-lg 
                      ${taxMode === "auto" ? "bg-yellow-400 text-black" : "text-gray-400"}`}
                    >
                      Auto
                    </span>
                  </div>

                  {/* GST */}
                  <div className="flex flex-col justify-between items-center mb-3 border border-gray-700 rounded-xl p-2">
                    <div className="flex items-center gap-28">
                      <label className="flex items-center gap-2  text-xs">
                        <input
                          type="checkbox"
                          checked={draftGstChecked}
                          onChange={() => {
                            setTaxMode("manual");
                            setDraftGstChecked(!draftGstChecked);
                          }}
                        />
                        GST (Goods & Services Tax)
                      </label>
                      <span className="text-blue-400 text-sm">5%</span>
                    </div>
                    {taxMode === "manual" && draftGstChecked && (
                      <input
                        type="number"
                        placeholder="Override amount"
                        value={draftGstAmount}
                        onChange={(e) => setDraftGstAmount(e.target.value)}
                        className="w-full mt-2.5 bg-black border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:border-yellow-400 outline-none"
                      />
                    )}
                  </div>

                  {/*============================== TCS Charges ====================================== */}

                  <div className="flex flex-col justify-between items-center mb-3 border border-gray-700 rounded-xl p-2">
                    <div className="flex items-center gap-23">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={draftTcsChecked}
                          onChange={() => {
                            setTaxMode("manual");
                            setDraftTcsChecked(!draftTcsChecked);
                          }}
                        />
                        TCS (Tax Collected at Source)
                      </label>
                      <span className="text-blue-400 text-sm">0.1%</span>
                    </div>

                    {taxMode === "manual" && draftTcsChecked && (
                      <input
                        type="number"
                        placeholder="Enter TCS amount"
                        value={draftTcsAmount}
                        onChange={(e) => setDraftTcsAmount(e.target.value)}
                        className="w-full mt-2.5 bg-black border text-white border-gray-700 rounded-xl px-3 py-2 text-sm focus:border-yellow-400 outline-none"
                      />
                    )}
                  </div>

                  {/*================================== Tourism Fees ============================================ */}

                  <div className="flex flex-col justify-between items-center mb-3 border border-gray-700 rounded-xl p-2">
                    <div className="flex items-center gap-25">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={draftTourismChecked}
                          onChange={() => {
                            setTaxMode("manual");
                            setDraftTourismChecked(!draftTourismChecked);
                          }}
                        />
                        Tourism Development Fee
                      </label>
                      <span className="text-blue-400 text-sm">₹500</span>
                    </div>

                    {taxMode === "manual" && draftTourismChecked && (
                      <input
                        type="number"
                        value={draftTourismAmount}
                        onChange={(e) => setDraftTourismAmount(e.target.value)}
                        className="w-full mt-2 bg-black border border-gray-700 rounded-xl px-3 py-2 text-sm focus:border-yellow-400 outline-none"
                      />
                    )}
                  </div>

                  {/*========================== Total Tax ============================================*/}

                  <div className="flex justify-between border-t border-gray-700 pt-3 mt-2">
                    <span className="text-gray-400 text-sm">
                      Total Tax Amount
                    </span>
                    <span className="text-white font-semibold">
                      ₹{draftTaxationTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowOpsPopup(false)}
                  className="px-3 py-1.5 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setServiceCharge(draftServiceCharge);
                    setHandlingFee(draftHandlingFee);
                    setValidTill(draftValidTill);

                    setGstChecked(draftGstChecked);
                    setTcsChecked(draftTcsChecked);
                    setTourismChecked(draftTourismChecked);

                    setGstAmount(draftGstFinal);
                    setTcsAmount(draftTcsFinal);
                    setTourismAmount(draftTourismFinal);

                    setAppliedTaxTotal(draftTaxationTotal);
                    setShowOpsPopup(false);
                    setTimeout(() => {
                      toast.success("Charges & taxation applied");
                    }, 200);
                  }}
                  className="px-3 py-1.5 text-sm bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>
      <QuickAddServiceModal
        showModal={showQuickServiceModal}
        setShowModal={setShowQuickServiceModal}
        addCustomService={addCustomService}
      />
    </>
  );
};

/*============================================ Select Contracted Rates =======================================*/

const Service = ({ service, toggleService, updateField, deleteService, }) => {
 let qty = 1;

if (service.type === "hotel") {
  qty = service.nights;
} else if (service.type === "transfer" || service.type === "car") {
  qty = service.days;
} else if (service.type === "activity") {
  qty = service.pax;
} else if (service.type === "sightseeing") {
  const pax = service.pax || 1;
  const days = service.days || 1;
  qty = Math.max(pax, days);
}

const total = (service.rate || 0) * qty;
  // const formattedDesc = service.desc || "";
  // .map((d) => d.trim())
  // .join(" | ");

  const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  AED: "د.إ",
  IDR: "Rp",
  THB: "฿",
 
};
  return (
    <div
      className={`rounded-2xl p-3 mb-4 border transition-all duration-300 ease-in-out  ${
        service.checked
          ? "border-yellow-500 bg-[#1a1600]"
          : "border-gray-700 bg-[#0e0e0e]"
      }`}
    >
<div className="flex items-start gap-3 rounded-2xl ">
  {/* LEFT ICON + CHECK */}
  <input
    type="checkbox"
    checked={service.checked}
    onChange={() => toggleService(service.id)}
    className="accent-yellow-400 mt-1"
  />

  <div className={`text-xl ${service.color || "text-gray-400"}`}>
    {service.icon || "icon....?"}
  </div>

  {/* MAIN CONTENT */}
  <div className="flex-1">

    {/* TITLE */}
    <div className="flex items-center gap-6 w-59 ">
      <div className="flex items-center gap-4 ">
      <p className="font-semibold text-[13px] font-sans">{service.title}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
    <ImLocation2 className="text-green-300"/> {service.city}, {service.country}</p>
</div>
      {service.custom && (
        <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-xl">
          Custom
        </span>
      )}
    
    </div>

    {/* SUBTITLE */}
    <p className="text-[9px] text-gray-300 mt-1 w-90 font-sans">
     {service.desc || "No details available"}
    </p>

    {/* BASE RATE + CONTROLS */}
    <div className="flex items-center gap-5 mt-1.5 flex-wrap  w-100 ">

      {/* BASE RATE */}
      <div className="text-xs text-gray-400 px-2 py-1 rounded">
        Base Rate:{" "}
        <span className="text-yellow-400 font-semibold">
          {currencySymbols[service.currency] || service.currency}{" "}
          {(service.rate || 0).toLocaleString("en-IN")}
        </span>
      </div>

      {/*============================ HOTEL ==========================================*/}
      {service.checked && service.type === "hotel" && (
        <>
          <span className="text-xs">Nights:</span>
          <select
            value={service.nights}
            onChange={(e) =>
              updateField(service.id, "nights", Number(e.target.value))
            }
            className="bg-black border border-gray-700 text-xs rounded-xl px-2 py-1"
          >
            {[...Array(10)].map((_, i) => (
              <option key={i} value={i + 1}>{i + 1} Nights</option>
            ))}
          </select>
        </>
      )}

      {/*====================== TRANSFER ============================================= */}
      {service.checked && (service.type === "transfer" || service.type === "car") && (
        <>
       <div className="flex items-center gap-2  w-66">
        <p className="text-xs">Service :</p>
          <select
            value={service.serviceType || "One Way"}
            onChange={(e) =>
              updateField(service.id, "serviceType", e.target.value)
            }
            className="bg-black border border-gray-400 text-xs rounded-xl px-1.5 py-1 outline-none"
          >
            <option>One Way</option>
            <option>Two Way</option>
            <option>Full Day</option>
          </select>

          <p className="text-xs">Days :</p>

          <select
            value={service.days}
            onChange={(e) =>
              updateField(service.id, "days", Number(e.target.value))
            }
            className="bg-black border border-gray-400 text-xs rounded-xl px-2 py-1 outline-none"
          >
            {[...Array(10)].map((_, i) => (
              <option key={i} value={i + 1}>{i + 1} Days</option>
            ))}
          </select>
          </div>
        </>

      )}

    {/*========================================== Activity ============================================*/}

   {service.checked && service.type === "activity" && (
    <>
    <span className="text-xs">PAX :</span>
    <input
    type="number"
    value={service.pax}
    onChange={(e) =>
      updateField(service.id, "pax", Number(e.target.value))
    }
    className="bg-black border border-gray-400 text-xs rounded-xl px-2 py-1 "/>
  </>
)}


{/* ===================== SIGHTSEEING ===================== */}
{service.checked && service.type === "sightseeing" && (
  <>
    {/* Tour Type */}
    {/* <div className="flex items-center gap-2">
      <p className="text-xs">Tour :</p>
      <select
        value={service.tourType || "SIC"}
        onChange={(e) =>
          updateField(service.id, "tourType", e.target.value)
        }
        className="bg-black border border-gray-400 text-xs rounded-xl px-2 py-1 outline-none"
      >
        <option value="SIC">SIC</option>
        <option value="Private">Private</option>
      </select>
    </div> */}

    {/* PAX */}
    <div className="flex items-center gap-2">
      <p className="text-xs">PAX :</p>
      <input
        type="number"
        value={service.pax}
        onChange={(e) =>
          updateField(service.id, "pax", Number(e.target.value))
        }
        className="bg-black border border-gray-400 text-xs rounded-xl px-2 py-1 w-14 outline-none"
      />
    </div>

    {/* Days */}
    <div className="flex items-center gap-2">
      <p className="text-xs">Days :</p>
      <select
        value={service.days}
        onChange={(e) =>
          updateField(service.id, "days", Number(e.target.value))
        }
        className="bg-black border border-gray-400 text-xs rounded-xl px-2 py-1"
      >
        {[...Array(10)].map((_, i) => (
          <option key={i} value={i + 1}>{i + 1} Days</option>
        ))}
      </select>
    </div>
  </>
)}
    </div>
  </div>

{/* RIGHT SIDE TOTAL (IMPORTANT 🔥) */}
{service.checked && (
  <div className="text-right min-w-15 flex flex-col items-center gap-6.5 justify-start">
    <div>
      <p className="text-xs text-gray-400">Total</p>
      <p className="text-xs font-semibold text-white ">
        ₹{total.toLocaleString("en-IN")}
      </p>
    </div>

    {service.custom && (
    <RiDeleteBin6Line
    onClick={() => deleteService(service.id)}
    className="text-red-400 cursor-pointer hover:text-red-600"
    />
  )}
  </div>
)}

</div>
</div>
  );
};

export default QuotationBuilder;
