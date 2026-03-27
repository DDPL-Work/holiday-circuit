import { Send } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { FaStar, FaWater } from "react-icons/fa";
import { GiCityCar, GiModernCity,} from "react-icons/gi";
import { FaCarSide } from "react-icons/fa";
import { MdKingBed, MdOutlineTravelExplore } from "react-icons/md";
import { BsPeople } from "react-icons/bs";
import { HiOutlineBriefcase } from "react-icons/hi";
import { IoStarSharp } from "react-icons/io5";
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
  const [gstPercent, setGstPercent] = useState(5);
  const [tcsPercent, setTcsPercent] = useState(0.1);
  const [draftGstAmount, setDraftGstAmount] = useState(0);
  const [draftTcsAmount, setDraftTcsAmount] = useState(0);
  const [draftTourismAmount, setDraftTourismAmount] = useState(0);

  const [showQuickServiceModal, setShowQuickServiceModal] = useState(false);
  const [marginType, setMarginType] = useState("percentage");
  const [fixedMargin, setFixedMargin] = useState(0);
  const [taxMode, setTaxMode] = useState("auto");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedSendOption, setSelectedSendOption] = useState(null);

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
    vehicleType: s.vehicleType || "",
    usageType: s.usageType || "",
    passengerCapacity: s.passengerCapacity || 0,
    luggageCapacity: s.luggageCapacity || 0,
    rate: s.price || 0,
    // 🔥 ADD THIS
    awebRate: s.awebRate || 0,
    cwebRate: s.cwebRate || 0,
    cwoebRate: s.cwoebRate || 0,
    currency: s.currency,
    nights: 1,
    days: 1,
    pax: 1,
    // ================== ADD THIS ==================
    roomCategory: s.roomCategory || "Double",
    roomType:s.roomType,
    hotelCategory:s.hotelCategory,
    bedType: s.bedType || "King",
    adults: 2,
    children: 0,
    infants: 0,
    // ============================================
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
  let total = (s.rate || 0) * (s.nights || 1);

  if (s.extraAdult) {
    total += (s.awebRate || 0) * (s.nights || 1);
  }

  if (s.childWithBed) {
    total += (s.cwebRate || 0) * (s.nights || 1);
  }

  if (s.childWithoutBed) {
    total += (s.cwoebRate || 0) * (s.nights || 1);
  }

  return sum + total;
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

 const draftGstAuto = draftGstChecked ? (baseRate * gstPercent) / 100 : 0;
 const draftTcsAuto = draftTcsChecked ? (baseRate * tcsPercent) / 100 : 0;
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

 const sendQuotation = async (sendVia = []) => {
  if (!validTill) {
    toast.error("Please select Valid Till date");
    return;
  }
  const selectedServices = services.filter(s => s.checked);

  if (!selectedServices.length) {
    toast.error("No services selected");
    return;
  }

  const loadingToast = toast.loading("Sending quotation...");

  try {

    // 🔥 MAIN PAYLOAD
    const payload = {
      queryId: order.queryId,
      validTill,
      baseAmount: baseRate,
      sendVia: sendVia,
      services: selectedServices.map(s => ({
      serviceId: s.id,
      type: s.type,
      title: s.title,

        city: s.city,
        country: s.country,
        description: s.desc,

        // HOTEL
        nights: s.nights || 1,

        // TRANSFER
        vehicleType: s.vehicleType,
        passengerCapacity: s.passengerCapacity,
        luggageCapacity: s.luggageCapacity,
        usageType: s.usageType,
        days: s.days || 1,

        // ACTIVITY / SIGHTSEEING
        pax: s.pax || 1,

        // PRICE
        currency: s.currency,
        price: s.rate,

        total:
        s.type === "hotel"
    ? (() => {
        let total = (s.rate || 0) * (s.nights || 1);

        if (s.extraAdult) {
          total += (s.awebRate || 0) * s.nights;
        }
        if (s.childWithBed) {
          total += (s.cwebRate || 0) * s.nights;
        }
        if (s.childWithoutBed) {
          total += (s.cwoebRate || 0) * s.nights;
        }

        return total;
      })()
            : s.type === "transfer"
            ? s.rate * s.days
            : s.type === "activity"
            ? s.rate * s.pax
            : s.type === "sightseeing"
            ? s.rate * Math.max(s.pax || 1, s.days || 1)
            : s.rate
      })),

      pricing: {
        baseAmount: baseRate,
        subTotal: servicesTotal,
        totalAmount: totalAmount
      },

  opsPercent: marginType === "percentage" ? Number(markup || 0) : 0,
  opsAmount: marginType === "fixed"
    ? Number(fixedMargin || 0)
    : Number(opsMarkup || 0),

      // OPS + TAX
   serviceCharge,
  handlingFee,
  tax: {
    gstAmount: gstAmount || draftGstFinal,
    gstPercent,
    tcsAmount: tcsAmount || draftTcsFinal,
    tcsPercent,
    tourismAmount: tourismAmount || draftTourismFinal
  }
  };

    console.log("🔥 FINAL PAYLOAD:", payload);

 // ✅ STEP 1: Create quotation
    const res = await API.post("/ops/quotations", payload);
    console.log("payload", res.data)

// 🔥 STEP 2: UPDATE QUERY + CREATE LOG
    await API.patch(`/ops/queries/send-quotation/${order._id}`);

    toast.dismiss(loadingToast);
    toast.success("Quotation sent successfully");
    setShowSuccessPopup(true)

  } catch (error) {
    console.error(error);
    toast.error("Failed to send quotation");
  }
};

const handleFinalSend = () => {
  if (!selectedSendOption) {
    toast.error("Please select an option");
    return;
  }

  const map = {
    "Email": ["email"],
    "WhatsApp": ["whatsapp"],
    "Dashboard Notification": ["dashboard_notification"],
    "PDF Download": ["pdf"],
    "Copy Text": ["copy"]
  };

  sendQuotation(map[selectedSendOption]);

  // optional UX
  setShowSendOptions(false);
  setSelectedSendOption(null);
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
                  appliedTaxTotal > 0 ? "text-green-400" : "text-red-400"}`}>
                  ₹{appliedTaxTotal.toFixed(2)}
                </span>
              </p>
              <p className="flex justify-between">
              <span className="text-[#90A1B9]">Services Total</span>
              <span  className={`${
                  appliedTaxTotal > 0 ? "text-sky-500" : "text-red-400"}`}>₹{servicesTotal.toFixed(2)}</span>
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
      onClick={() => setSelectedSendOption(option)}
        className={`flex items-center gap-3 px-5 py-3 cursor-pointer border-b
  ${selectedSendOption === option ? "bg-yellow-400/20" : "hover:bg-white/5"}`}
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

  <button
  onClick={() => handleFinalSend()}
  className="w-full bg-yellow-400 text-black py-2 font-semibold cursor-pointer"
>
  Send Now
</button>
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
            <div className="w-230 bg-linear-to-br mt-2  from-[#111] to-[#1c1c1c] border border-yellow-500/40 rounded-2xl shadow-2xl p-6">
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
                      className="w-full mt-1 bg-gray-600 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:border-yellow-400 outline-none"
                    />
                  </div>
                </div>

                {/*============================== TAXATION CHARGES ===========================*/}

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
                      <div className="flex items-center gap-2">
  <input
    type="number"
    value={gstPercent}
    onChange={(e) => setGstPercent(Number(e.target.value))}
    className="w-16 bg-black border border-gray-600 rounded-xl px-2 py-1 text-xs outline-none"
  />
  <span className="text-blue-400 text-xs">%</span>
</div>
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
                    <div className="flex items-center gap-25">
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
                     <div className="flex items-center gap-2">
  <input
    type="number"
    value={tcsPercent}
    onChange={(e) => setTcsPercent(Number(e.target.value))}
    className="w-16 bg-black border border-gray-600 rounded-xl px-2 py-1 text-xs outline-none"
  />
  <span className="text-blue-400 text-xs">%</span>
</div>
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

                  <div className="flex flex-col justify-end items-center mb-3 border border-gray-700 rounded-xl p-2">
                    <div className="flex items-center gap-41">
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

{/*======================== ✅ POPUP Success final Charges =============================================*/}
   {showSuccessPopup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">

    <div className="bg-[#111] border border-yellow-500/40 rounded-2xl p-6 w-100 text-center shadow-2xl animate-scaleIn">

      {/* ICON */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-black text-3xl">
          ✓
        </div>
      </div>

      {/* TITLE */}
      <h2 className="text-xl font-semibold text-white mb-2">
        Quotation Sent Successfully
      </h2>

      {/* SUBTEXT */}
      <p className="text-gray-400 text-sm mb-4">
        Your quotation has been delivered to the agent via selected channels.
      </p>

      {/* DETAILS */}
      <div className="bg-[#1a1a1a] rounded-xl p-3 text-left text-xs mb-4">
        <p className="flex justify-between">
          <span className="text-gray-400">Agent</span>
          <span className="text-white">{order?.agent?.companyName}</span>
        </p>

        <p className="flex justify-between mt-1">
          <span className="text-gray-400">Total Amount</span>
          <span className="text-yellow-400">₹{totalAmount.toFixed(2)}</span>
        </p>

        <p className="flex justify-between mt-1">
          <span className="text-gray-400">Services</span>
          <span className="text-white">{services.filter(s => s.checked).length}</span>
        </p>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowSuccessPopup(false)}
          className="w-full bg-gray-800 text-white py-2 rounded-xl hover:bg-gray-700"
        >
          Close
        </button>

        <button
          onClick={() => {
            setShowSuccessPopup(false);
            navigate("/ops/dashboard");
          }}
          className="w-full bg-yellow-400 text-black py-2 rounded-xl font-semibold hover:bg-yellow-500"
        >
          Go to Dashboard
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

const Service = ({ service, toggleService, updateField, deleteService }) => {
  let total = 0;

  if (service.type === "hotel") {
    const nights = service.nights || 1;
    total = (service.rate || 0) * nights;
    if (service.extraAdult) total += (service.awebRate || 0) * nights;
    if (service.childWithBed) total += (service.cwebRate || 0) * nights;
    if (service.childWithoutBed) total += (service.cwoebRate || 0) * nights;
  } else if (service.type === "transfer" || service.type === "car") {
    total = (service.rate || 0) * (service.days || 1);
  } else if (service.type === "activity") {
    total = (service.rate || 0) * (service.pax || 1);
  } else if (service.type === "sightseeing") {
    const pax = service.pax || 1;
    const days = service.days || 1;
    total = (service.rate || 0) * Math.max(pax, days);
  }

  const currencySymbols = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£",
    AUD: "A$", AED: "د.إ", IDR: "Rp", THB: "฿",
  };

  const sym = currencySymbols[service.currency] || service.currency;

  const getHotelStars = (category) => {
    if (!category) return 3;
    const value = category.toString().toLowerCase().trim();
    const match = value.match(/\d/);
    if (match) return Number(match[0]);
    if (value.includes("luxury") || value.includes("premium")) return 5;
    if (value.includes("deluxe")) return 4;
    if (value.includes("standard")) return 3;
    if (value.includes("budget")) return 2;
    return 3;
  };

  const formatUsage = (val) => {
    if (!val) return "";
    return val.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const amenities = (service.desc || "")
    .split(/,|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const selectCls =
    "bg-[#0a0a0a] border border-[#2a2a2a] hover:border-yellow-600/50 text-white text-[11px] rounded-lg px-2.5 py-1 outline-none cursor-pointer transition-colors duration-150 focus:border-yellow-500";

  const inputCls =
    "bg-[#0a0a0a] border border-[#2a2a2a] hover:border-yellow-600/50 text-white text-[11px] rounded-lg px-2.5 py-1 w-16 outline-none transition-colors duration-150 focus:border-yellow-500";

  const tagCls =
    "flex items-center gap-1.5 text-[10px] bg-[#141414] border border-[#222] text-gray-400 px-2.5 py-1 rounded-lg";

  return (
    <div
      className={`rounded-2xl mb-3 border transition-all duration-200 relative overflow-hidden ${
        service.checked
          ? "border-yellow-500/60 bg-[#0f0d00] shadow-[0_0_0_1px_rgba(234,179,8,0.08),inset_0_1px_0_rgba(234,179,8,0.06)]"
          : "border-[#1f1f1f] bg-[#0b0b0b] hover:border-[#2a2a2a]"
      }`}
    >
      {/* TOP ACCENT LINE */}
      {service.checked && (
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
      )}

      <div className="flex items-stretch">
        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0 p-4">

          {/* ── ROW 1: Checkbox + Icon + Title block ── */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={service.checked}
              onChange={() => toggleService(service.id)}
              className="accent-yellow-400 mt-[3px] w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
            />

            {/* Icon Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg border ${
                service.checked
                  ? "bg-yellow-500/10 border-yellow-500/20"
                  : "bg-[#161616] border-[#222]"
              }`}
            >
              <span className={service.color || "text-gray-400"}>
                {service.icon || "🏨"}
              </span>
            </div>

            {/* Title + Meta */}
            <div className="flex-1 min-w-0">
              {/* Name + Custom badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[13.5px] text-white tracking-tight leading-none">
                  {service.title}
                </p>
                {service.custom && (
                  <span className="bg-yellow-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
                    Custom
                  </span>
                )}
              </div>

              {/* Location + Stars row */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] text-gray-200">
                  <ImLocation2 className="text-emerald-400 text-[10px]" />
                  {service.city}, {service.country}
                </span>
                {service.hotelCategory && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span className="text-gray-200">Hotel:</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: getHotelStars(service.hotelCategory) }).map((_, i) => (
                        <IoStarSharp key={i} className="text-yellow-400 text-[9px]" />
                      ))}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── ROW 2: Amenity pills ── */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pl-[52px]">
              {amenities.map((item, i) => (
                <span
                  key={i}
                  className="text-[9.5px] text-gray-300 bg-[#141414] border border-[#232323] px-2 py-0.5 rounded-md"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* ── TRANSPORT TAGS ── */}
          {service.type === "transfer" && (
            <div className="flex flex-wrap gap-1.5 mt-2.5 pl-[52px]">
              {service.vehicleType && (
                <span className={tagCls}>
                  <FaCarSide className="text-yellow-400" />
                  {service.vehicleType}
                </span>
              )}
              {service.usageType && (
                <span className={tagCls}>
                  <MdOutlineTravelExplore className="text-blue-400" />
                  {formatUsage(service.usageType)}
                </span>
              )}
              {service.passengerCapacity > 0 && (
                <span className={tagCls}>
                  <BsPeople className="text-emerald-400" />
                  {service.passengerCapacity} pax
                </span>
              )}
              {service.luggageCapacity > 0 && (
                <span className={tagCls}>
                  <HiOutlineBriefcase className="text-purple-400" />
                  {service.luggageCapacity} bags
                </span>
              )}
            </div>
          )}

          {/* ── DIVIDER ── */}
          <div className="h-px bg-[#1a1a1a] mt-3 ml-[52px]" />

          {/* ── ROW 3: Base rate + controls ── */}
          <div className="flex items-center gap-2.5 mt-2.5 pl-[52px] flex-wrap">

            {/* Base Rate pill */}
            <div className="flex items-center gap-1.5 bg-[#141414] border border-[#1e1e1e] rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-gray-200">Base Rate</span>
              <span className="text-[11px] font-semibold text-yellow-400 tracking-tight">
                {sym} {(service.rate || 0).toLocaleString("en-IN")}
              </span>
            </div>

            {/* HOTEL controls */}
            {service.checked && service.type === "hotel" && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-gray-200">Nights</span>
                <select
                  value={service.nights}
                  onChange={(e) => updateField(service.id, "nights", Number(e.target.value))}
                  className={selectCls}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1} Night{i > 0 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            )}

            {/* TRANSFER controls */}
            {service.checked && (service.type === "transfer" || service.type === "car") && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-gray-500">Service</span>
                <select
                  value={service.usageType || "point-to-point"}
                  onChange={(e) => updateField(service.id, "usageType", e.target.value)}
                  className={selectCls}
                >
                  <option value="point-to-point">One Way</option>
                  <option value="round-trip">Two Way</option>
                  <option value="full-day">Full Day</option>
                  <option value="half-day">Half Day</option>
                </select>
                <span className="text-[10px] text-gray-500">Days</span>
                <select
                  value={service.days}
                  onChange={(e) => updateField(service.id, "days", Number(e.target.value))}
                  className={selectCls}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1} Day{i > 0 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ACTIVITY controls */}
            {service.checked && service.type === "activity" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">PAX</span>
                <input
                  type="number"
                  value={service.pax}
                  onChange={(e) => updateField(service.id, "pax", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            )}

            {/* SIGHTSEEING controls */}
            {service.checked && service.type === "sightseeing" && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-gray-500">PAX</span>
                <input
                  type="number"
                  value={service.pax}
                  onChange={(e) => updateField(service.id, "pax", Number(e.target.value))}
                  className={inputCls}
                />
                <span className="text-[10px] text-gray-500">Days</span>
                <select
                  value={service.days}
                  onChange={(e) => updateField(service.id, "days", Number(e.target.value))}
                  className={selectCls}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1} Day{i > 0 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── ROW 4: Room type + Bed type tags (hotel only) ── */}
          {service.checked && service.type === "hotel" && (service.roomType || service.bedType) && (
            <div className="flex gap-2 flex-wrap mt-2.5 pl-[52px]">
              {service.roomType && (
                <span className={tagCls}>
                  <LiaHotelSolid className="text-blue-400 text-sm" />
                  <span className="text-gray-200">Room:</span>
                  {service.roomType}
                </span>
              )}
              {service.bedType && (
                <span className={tagCls}>
                  <MdKingBed className="text-yellow-400 text-sm" />
                  <span className="text-gray-200">Bed:</span>
                  {service.bedType}
                </span>
              )}
            </div>
          )}

          {/* ── ROW 5: Extra PAX checkboxes (hotel only) ── */}
          {service.checked && service.type === "hotel" && (
            <div className="flex flex-wrap gap-2 mt-2.5 pl-[52px]">
              {/* A.W.E.B */}
              <label className="flex items-center gap-1.5 text-[10px] bg-[#141414] border border-[#222] hover:border-yellow-500/30 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors duration-150">
                <input
                  type="checkbox"
                  checked={service.extraAdult || false}
                  onChange={(e) => updateField(service.id, "extraAdult", e.target.checked)}
                  className="accent-yellow-400 w-3 h-3"
                />
                <span className="text-gray-400">A.W.E.B</span>
                <span className="text-yellow-400 font-medium">{sym} {service.awebRate}</span>
              </label>

              {/* C.W.E.B */}
              <label className="flex items-center gap-1.5 text-[10px] bg-[#141414] border border-[#222] hover:border-emerald-500/30 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors duration-150">
                <input
                  type="checkbox"
                  checked={service.childWithBed || false}
                  onChange={(e) => updateField(service.id, "childWithBed", e.target.checked)}
                  className="accent-yellow-400 w-3 h-3"
                />
                <span className="text-gray-400">C.W.E.B</span>
                <span className="text-emerald-400 font-medium">{sym} {service.cwebRate}</span>
              </label>

              {/* C.Wo.E.B */}
              <label className="flex items-center gap-1.5 text-[10px] bg-[#141414] border border-[#222] hover:border-blue-500/30 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors duration-150">
                <input
                  type="checkbox"
                  checked={service.childWithoutBed || false}
                  onChange={(e) => updateField(service.id, "childWithoutBed", e.target.checked)}
                  className="accent-yellow-400 w-3 h-3"
                />
                <span className="text-gray-400">C.Wo.E.B</span>
                <span className="text-blue-400 font-medium">{sym} {service.cwoebRate}</span>
              </label>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDE: Total + Delete ── */}
        {service.checked && (
          <div className="flex flex-col items-end justify-between px-4 py-4 border-l border-[#1a1a1a] min-w-[90px]">
            <div className="text-right">
              <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Total</p>
              <p className="text-[15px] font-semibold text-white tracking-tight leading-none">
                ₹{total.toLocaleString("en-IN")}
              </p>
            </div>
            {service.custom && (
              <button
                onClick={() => deleteService(service.id)}
                className="mt-3 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
              >
                <RiDeleteBin6Line className="text-[14px]" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};






export default QuotationBuilder;
