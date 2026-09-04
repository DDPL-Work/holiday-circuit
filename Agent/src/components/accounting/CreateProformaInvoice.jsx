import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Pencil, Phone, Mail, CreditCard, Plus, X, ChevronDown, AlertTriangle, FileText } from "lucide-react";
import API from "../../utils/Api";

const extractPlainTextFromTerm = (rawContent) => {
  if (!rawContent) return "";
  if (Array.isArray(rawContent)) {
    return rawContent.map((t) => String(t || "").trim()).filter(Boolean).join("\n");
  }
  if (typeof rawContent !== "string") return "";

  if (/<[a-z][\s\S]*>/i.test(rawContent)) {
    try {
      const doc = new DOMParser().parseFromString(rawContent, "text/html");
      const lines = [];
      const processNode = (node) => {
        if (!node) return;
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName.toLowerCase();
          if (["ul", "ol"].includes(tag)) {
            Array.from(node.childNodes).forEach(processNode);
          } else if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "div"].includes(tag)) {
            const text = (node.textContent || "").trim();
            if (text) {
              lines.push(text);
            }
          } else {
            Array.from(node.childNodes).forEach(processNode);
          }
        }
      };
      Array.from(doc.body.childNodes).forEach(processNode);
      if (lines.length > 0) return lines.join("\n");
      const plain = (doc.body.textContent || "").trim();
      if (plain) return plain;
    } catch (e) {
      return rawContent
        .replace(/<br\s*[\/]?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .trim();
    }
  }

  return rawContent;
};

const PRESET_TAX_OPTIONS = [
  { id: "gst", label: "GST (GST)", value: "GST" },
  { id: "taxes", label: "Taxes (Taxes)", value: "Taxes" },
  { id: "tcs", label: "TCS (Tax Collected At Source)", value: "TCS" },
  { id: "hidden", label: "(HIDDEN) Disabled as non sharing tax", value: "(HIDDEN)" },
];

// Reusable Tax Name Dropdown component with Radio selection & Custom typing
const TaxNameInputWithDropdown = ({ value, onChange, placeholder = "e.g. GST" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 font-medium placeholder:text-slate-400"
      />
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[240px] bg-white border border-slate-200 rounded-md shadow-xl z-50 py-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          {PRESET_TAX_OPTIONS.map((opt) => {
            const isSelected = value?.trim().toLowerCase() === opt.value.toLowerCase() || value?.trim().toLowerCase() === opt.label.toLowerCase();
            return (
              <div
                key={opt.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 flex items-center gap-2.5 cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50/80 text-blue-900 font-semibold" : "hover:bg-slate-50 text-slate-700 font-normal"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-blue-600 bg-blue-600" : "border-slate-400 bg-white"
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="truncate">{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const resolveClientDetails = (data) => {
  if (!data) return { name: "", phone: "", email: "", address: "", country: "India" };

  const qId = data?.queryId || data?._id || data?.id;
  let savedTourists = null;
  let savedLeadName = "";
  let savedLeadPhone = "";
  let savedLeadEmail = "";
  let savedLeadAddress = "";

  if (qId) {
    const rawId = String(qId);
    const cleanId = rawId.replace(/^#\s*/, "").trim();
    const keysToTry = [
      `trip_tourists_${rawId}`,
      `trip_tourists_${cleanId}`,
      data?._id ? `trip_tourists_${data._id}` : null,
      data?.queryId ? `trip_tourists_${data.queryId}` : null,
    ].filter(Boolean);

    for (const k of keysToTry) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedTourists = parsed;
            break;
          }
        }
      } catch (e) {}
    }

    const leadKeys = [
      `trip_tourists_${rawId}_lead`,
      `trip_tourists_${cleanId}_lead`,
      data?._id ? `trip_tourists_${data._id}_lead` : null,
      data?.queryId ? `trip_tourists_${data.queryId}_lead` : null,
    ].filter(Boolean);

    for (const k of leadKeys) {
      try {
        const val = localStorage.getItem(k);
        if (val) {
          savedLeadName = val;
          break;
        }
      } catch (e) {}
    }

    const phoneKeys = [
      `trip_tourists_${rawId}_phone`,
      `trip_tourists_${cleanId}_phone`,
      data?._id ? `trip_tourists_${data._id}_phone` : null,
      data?.queryId ? `trip_tourists_${data.queryId}_phone` : null,
    ].filter(Boolean);

    for (const k of phoneKeys) {
      try {
        const val = localStorage.getItem(k);
        if (val) {
          savedLeadPhone = val;
          break;
        }
      } catch (e) {}
    }

    const emailKeys = [
      `trip_tourists_${rawId}_email`,
      `trip_tourists_${cleanId}_email`,
      data?._id ? `trip_tourists_${data._id}_email` : null,
      data?.queryId ? `trip_tourists_${data.queryId}_email` : null,
    ].filter(Boolean);

    for (const k of emailKeys) {
      try {
        const val = localStorage.getItem(k);
        if (val) {
          savedLeadEmail = val;
          break;
        }
      } catch (e) {}
    }

    const addressKeys = [
      `trip_tourists_${rawId}_address`,
      `trip_tourists_${cleanId}_address`,
      data?._id ? `trip_tourists_${data._id}_address` : null,
      data?.queryId ? `trip_tourists_${data.queryId}_address` : null,
    ].filter(Boolean);

    for (const k of addressKeys) {
      try {
        const val = localStorage.getItem(k);
        if (val) {
          savedLeadAddress = val;
          break;
        }
      } catch (e) {}
    }
  }

  const primaryTourist = savedTourists
    ? savedTourists.find((t) => t.isFlagged) || savedTourists[0]
    : null;

  let primaryTouristName = "";
  if (primaryTourist) {
    const sal = primaryTourist.salutation || "";
    const rawN = (primaryTourist.name || "").replace(/^(Mr\.|Mrs\.|Ms\.|Master|Dr\.)\s*/i, "").trim();
    primaryTouristName = [sal, rawN].filter(Boolean).join(" ");
  }

  let primaryTouristPhone = "";
  if (primaryTourist?.phones?.[0]?.number) {
    const rawNum = primaryTourist.phones[0].number.trim();
    const codeStr = primaryTourist.phones[0].countryCode
      ? `+${primaryTourist.phones[0].countryCode.split("-")[0]}-`
      : "+91-";
    primaryTouristPhone = rawNum.startsWith("+") ? rawNum : `${codeStr}${rawNum}`;
  }

  const primaryTouristEmail = primaryTourist?.email ? primaryTourist.email.trim() : "";
  const primaryTouristAddress = primaryTourist?.address ? primaryTourist.address.trim() : "";

  // Check data.travelerDetails
  const travelers = Array.isArray(data?.travelerDetails) ? data.travelerDetails : [];
  const primaryDbTraveler = travelers.find(
    (t) => String(t?.travelerType || "").toLowerCase() === "adult" && (t?.fullName || t?.name)
  ) || travelers[0];

  const dbTravelerName = primaryDbTraveler?.fullName || primaryDbTraveler?.name || "";
  let dbTravelerPhone = primaryDbTraveler?.phone || "";
  if (dbTravelerPhone && !dbTravelerPhone.startsWith("+") && /^\d+$/.test(dbTravelerPhone.replace(/\s+/g, ""))) {
    dbTravelerPhone = `+91-${dbTravelerPhone.replace(/^\+?91-?/, "").trim()}`;
  }
  const dbTravelerEmail = primaryDbTraveler?.email || "";
  const dbTravelerAddress = primaryDbTraveler?.address || "";

  // Resolved Name
  const rawName =
    savedLeadName ||
    primaryTouristName ||
    data?.headerLeadTraveler ||
    data?.leadTraveler ||
    data?.clientName ||
    data?.customerName ||
    data?.guestName ||
    data?.name ||
    data?.leadPassenger ||
    data?.travelerName ||
    dbTravelerName ||
    data?.client?.name ||
    "";

  // Fix duplicated salutations e.g. "Mr. Mr Vivek" -> "Mr. Vivek"
  const cleanName = rawName.replace(/^(Mr\.|Mrs\.|Ms\.|Master|Dr\.)\s+(?=(Mr\.|Mrs\.|Ms\.|Master|Dr\.)\b)/i, "").trim();

  // Resolved Phone
  let resolvedPhone =
    savedLeadPhone ||
    primaryTouristPhone ||
    data?.currentLeadPhone ||
    data?.headerLeadPhone ||
    data?.clientPhone ||
    data?.leadPhone ||
    data?.guestPhone ||
    dbTravelerPhone ||
    data?.phone ||
    data?.mobileNumber ||
    data?.contactNumber ||
    data?.client?.phone ||
    "";

  if (resolvedPhone && !resolvedPhone.startsWith("+") && /^\d{10}$/.test(resolvedPhone.replace(/\s+/g, ""))) {
    resolvedPhone = `+91-${resolvedPhone.replace(/^\+?91-?/, "").trim()}`;
  }

  // Resolved Email: Prioritize client / tourist email over agent's login email
  const resolvedEmail =
    savedLeadEmail ||
    primaryTouristEmail ||
    dbTravelerEmail ||
    data?.clientEmail ||
    data?.leadEmail ||
    data?.guestEmail ||
    data?.client?.email ||
    (data?.email && !data?.email.includes("agent") ? data.email : "") ||
    data?.email ||
    "";

  // Resolved Address
  const resolvedAddress =
    savedLeadAddress ||
    primaryTouristAddress ||
    dbTravelerAddress ||
    data?.clientAddress ||
    data?.buyerAddress ||
    data?.address ||
    data?.location ||
    (data?.destination ? `${data.destination}, India` : "") ||
    "";

  const resolvedCountry =
    data?.buyerCountry ||
    data?.clientCountry ||
    data?.country ||
    "India";

  return {
    name: cleanName || "Client",
    phone: resolvedPhone,
    email: resolvedEmail,
    address: resolvedAddress,
    country: resolvedCountry,
  };
};

const CreateProformaInvoice = ({ onClose, onSave, queryData = {} }) => {
  const [hideTaxBreakup, setHideTaxBreakup] = useState(false);
  const [bankName, setBankName] = useState(queryData?.bankName || "");
  const [branchName, setBranchName] = useState(queryData?.branchName || "");
  const [accountHolderName, setAccountHolderName] = useState(queryData?.accountHolderName || "");
  const [accountNumber, setAccountNumber] = useState(queryData?.accountNumber || "");
  const [ifscCode, setIfscCode] = useState(queryData?.ifscCode || "");
  const [overview, setOverview] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [termsConditions, setTermsConditions] = useState(
    queryData?.termsConditions || queryData?.terms || ""
  );
  const [termsList, setTermsList] = useState([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [activeTypeDropdownIndex, setActiveTypeDropdownIndex] = useState(null);
  const [isRoundedOff, setIsRoundedOff] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAgentTerms = async () => {
      try {
        setLoadingTerms(true);
        let res;
        try {
          res = await API.get("/agent/terms");
        } catch (e) {
          try {
            res = await API.get("/admin/terms");
          } catch (err) {
            console.error("Failed to fetch terms:", err);
          }
        }
        let list = [];
        if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (res?.data?.success || res?.data?.data || res?.data?.terms) {
          list = res.data.data || res.data.terms || [];
        }
        if (isMounted) {
          setTermsList(list);
        }
      } catch (err) {
        console.error("Failed to load terms and conditions:", err);
      } finally {
        if (isMounted) {
          setLoadingTerms(false);
        }
      }
    };
    fetchAgentTerms();
    return () => {
      isMounted = false;
    };
  }, []);

  const parseAmount = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.]/g, "");
    return Number(cleaned) || 0;
  };

  const clientInfo = resolveClientDetails(queryData);
  const queryId = queryData?.queryId || queryData?.id || queryData?._id || "4310346";
  const clientName = clientInfo.name;
  const clientPhone = clientInfo.phone;
  const clientEmail = clientInfo.email;
  const clientAddress = clientInfo.address;
  const agentName = queryData?.agentName || queryData?.agencyName || queryData?.agent?.agencyName || queryData?.agent?.name || "Agency";
  const destination = queryData?.destination || "Tour";
  const numDays = queryData?.duration || (queryData?.numberOfNights ? `${queryData.numberOfNights}N/${Number(queryData.numberOfNights) + 1}D` : "4N,5D");
  const pax = queryData?.pax || queryData?.paxCount || (queryData?.numberOfAdults ? `${queryData.numberOfAdults}A` : "2A");

  const tripDateDisplay = queryData?.startDate
    ? new Date(queryData.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : (queryData?.headerDateRangeText ? queryData.headerDateRangeText.split("-")[0]?.trim() : "Trip Date");

  const extractQuotationAmount = (data) => {
    if (!data) return 0;
    const candidates = [
      data?.headerPackageAmount,
      data?.clientTotalAmount,
      data?.quotationAmount,
      data?.quotation,
      data?.quoteAmount,
      data?.activeQuote?.clientTotalAmount,
      data?.activeQuote?.pricing?.totalAmount,
      data?.activeQuote?.pricing?.subTotal,
      data?.activeQuote?.pricing?.grandTotal,
      data?.activeQuote?.totalAmount,
      data?.totalAmount,
      data?.finalQuoteAmount,
      data?.packagePrice,
      data?.pkgPrice,
      data?.pricing?.grandTotal,
      data?.pricing?.totalAmount,
      data?.pricing?.subTotal,
      data?.costing?.agentCost,
      data?.costing?.totalCost,
      data?.costing?.grandTotal,
      data?.costing?.total,
      data?.amount,
      data?.price,
      data?.cost,
    ];

    for (const cand of candidates) {
      const parsed = parseAmount(cand);
      if (parsed > 0) return parsed;
    }

    if (Array.isArray(data?.quotes) && data.quotes.length > 0) {
      for (const q of data.quotes) {
        const qAmt = parseAmount(q?.clientTotalAmount || q?.pricing?.totalAmount || q?.pricing?.subTotal || q?.totalAmount);
        if (qAmt > 0) return qAmt;
      }
    }

    return 0;
  };

  const extractedPrice = extractQuotationAmount(queryData);
  const totalPkgPrice = extractedPrice > 0 ? extractedPrice : 160000;

  const [items, setItems] = useState([
    {
      particularText: `Trip#: ${String(queryId).replace(/^#\s*/, "")}\n${destination} Tour Package\n${clientName}\n- ${tripDateDisplay} - ${numDays} - ${pax}`,
      hsnSac: "",
      qty: 1,
      baseAmount: totalPkgPrice,
      applyTax: true,
      taxType: "percentage", // "percentage" | "amount"
      taxes: [
        { id: 1, name: "GST", value: 0 },
      ],
    },
  ]);

  // Seller Details (DDLC Company Details)
  const [isEditingSeller, setIsEditingSeller] = useState(false);
  const [sellerDetails, setSellerDetails] = useState({
    name: queryData?.sellerName || "DDLC Company Pvt. Ltd.",
    address: queryData?.sellerAddress || "KG 3/69, Ground Floor, Vikas Puri",
    cityState: queryData?.sellerCityState || "New Delhi, Delhi",
    countryZip: queryData?.sellerCountryZip || "India, 110018",
    phone: queryData?.sellerPhone || "9368825518",
    email: queryData?.sellerEmail || "joy@gmail.com",
    pan: queryData?.sellerPan || "ABAPW1816B",
    gst: queryData?.sellerGst || "07ABAPW1816B3ZZ",
    msme: queryData?.sellerMsme || "UDYAM-DL-10-0079437",
    tan: queryData?.sellerTan || "DELV30189F",
  });

  // Buyer Details (Agent's Client)
  const [isEditingBuyer, setIsEditingBuyer] = useState(false);
  const [buyerDetails, setBuyerDetails] = useState({
    name: queryData?.buyerName && queryData?.buyerName !== "Carma Tours" ? queryData.buyerName : clientName,
    address: queryData?.buyerAddress || clientAddress,
    country: queryData?.buyerCountry || clientInfo.country || "India",
    phone: queryData?.buyerPhone || clientPhone,
    email: queryData?.buyerEmail || clientEmail,
  });

  // Close type dropdown when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveTypeDropdownIndex(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleTaxTypeChange = (itemIndex, newType) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[itemIndex] = { ...updated[itemIndex], taxType: newType };
      return updated;
    });
    setActiveTypeDropdownIndex(null);
  };

  const handleTaxChange = (itemIndex, taxIndex, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const currentItem = { ...updated[itemIndex] };
      const currentTaxes = [...(currentItem.taxes || [])];
      currentTaxes[taxIndex] = { ...currentTaxes[taxIndex], [field]: value };
      currentItem.taxes = currentTaxes;
      updated[itemIndex] = currentItem;
      return updated;
    });
  };

  const addTaxRow = (itemIndex) => {
    setItems((prev) => {
      const updated = [...prev];
      const currentItem = { ...updated[itemIndex] };
      const currentTaxes = [...(currentItem.taxes || [])];
      currentTaxes.push({ id: Date.now(), name: "", value: 0 });
      currentItem.taxes = currentTaxes;
      updated[itemIndex] = currentItem;
      return updated;
    });
  };

  const removeTaxRow = (itemIndex, taxIndex) => {
    setItems((prev) => {
      const updated = [...prev];
      const currentItem = { ...updated[itemIndex] };
      let currentTaxes = [...(currentItem.taxes || [])];
      if (currentTaxes.length > 1) {
        currentTaxes = currentTaxes.filter((_, i) => i !== taxIndex);
      } else {
        currentTaxes = [{ id: Date.now(), name: "", value: 0 }];
      }
      currentItem.taxes = currentTaxes;
      updated[itemIndex] = currentItem;
      return updated;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        particularText: "",
        hsnSac: "",
        qty: 1,
        baseAmount: 0,
        applyTax: true,
        taxType: "percentage",
        taxes: [
          { id: Date.now(), name: "GST", value: 0 },
        ],
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setItems([
        {
          particularText: "",
          hsnSac: "",
          qty: 1,
          baseAmount: 0,
          applyTax: true,
          taxType: "percentage",
          taxes: [
            { id: Date.now(), name: "GST", value: 0 },
          ],
        },
      ]);
    }
  };

  const calculateItemBase = (item) => {
    const qty = Number(item.qty || 0);
    const base = Number(item.baseAmount || 0);
    return qty * base;
  };

  const calculateSingleTaxAmount = (item, tax) => {
    if (!item.applyTax) return 0;
    const base = calculateItemBase(item);
    const val = Number(tax.value || 0);
    if (item.taxType === "amount") {
      return val;
    }
    return (base * val) / 100;
  };

  const calculateItemTaxes = (item) => {
    if (!item.applyTax || !Array.isArray(item.taxes)) return 0;
    return item.taxes.reduce((sum, tax) => sum + calculateSingleTaxAmount(item, tax), 0);
  };

  const calculateItemTotal = (item) => {
    return calculateItemBase(item) + calculateItemTaxes(item);
  };

  const calculateGrandTotal = () => {
    const rawTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    return isRoundedOff ? Math.round(rawTotal) : rawTotal;
  };

  const formatDueDate = (val) => {
    if (!val) return "August 29, 2026";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const grandTotal = calculateGrandTotal();
  const hasAmountMismatch = Math.abs(grandTotal - totalPkgPrice) > 0.01;

  const handleSave = () => {
    if (!confirmed) {
      alert("Please confirm that all details of this proforma invoice are correct.");
      return;
    }
    if (onSave) {
      onSave({
        items: items.map((item) => ({
          ...item,
          taxName: item.taxes?.[0]?.name || "GST",
          taxPercentage: item.taxType === "percentage" ? (item.taxes?.[0]?.value || 0) : 0,
          taxAmount: calculateItemTaxes(item),
          calculatedBaseTotal: calculateItemBase(item),
          calculatedGrandTotal: calculateItemTotal(item),
        })),
        sellerDetails,
        buyerDetails,
        bankName,
        branchName,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankDetails: {
          bankName,
          branchName,
          accountHolderName,
          accountNumber,
          ifscCode,
        },
        overview,
        specialNotes,
        termsConditions,
        grandTotal: calculateGrandTotal(),
        packageAmount: totalPkgPrice,
      });
    }
    if (onClose) onClose();
  };

  return (
    <div className="w-full min-h-screen bg-white font-sans text-slate-800">
      {/* Top Header Strip with Back Icon & Title */}
      <div className="w-full bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          Create New Proforma Invoice
        </h1>
      </div>

      {/* Main Full-Width Page Container */}
      <div className="w-full px-6 py-4 space-y-6">
        {/* Section 1: Invoice Options */}
        <div className="bg-[#f1f3f5] rounded-md p-4 border border-slate-200/60">
          <p className="text-xs font-semibold text-slate-500 mb-2">Invoice Options</p>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-900 select-none">
            <input
              type="checkbox"
              checked={hideTaxBreakup}
              onChange={(e) => setHideTaxBreakup(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Hide Tax Breakup</span>
          </label>
        </div>

        {/* Section 2: Proforma Invoice Header & Details Box */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 text-center mb-4">
            Proforma Invoice
          </h2>

          <div className="bg-[#f8f9fa] rounded-md border border-slate-200/80 p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Seller Billing/Address Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-bold text-slate-900">Seller Billing/Address Details</h3>
                <button
                  type="button"
                  onClick={() => setIsEditingSeller(!isEditingSeller)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-200/50"
                  title="Edit Seller Details"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {isEditingSeller ? (
                <div className="space-y-2 bg-white p-3 rounded border border-slate-300 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Seller Name (Agent):</label>
                    <input
                      type="text"
                      value={sellerDetails.name}
                      onChange={(e) => setSellerDetails({ ...sellerDetails, name: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Address:</label>
                    <input
                      type="text"
                      value={sellerDetails.address}
                      onChange={(e) => setSellerDetails({ ...sellerDetails, address: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">City, State:</label>
                    <input
                      type="text"
                      value={sellerDetails.cityState}
                      onChange={(e) => setSellerDetails({ ...sellerDetails, cityState: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Phone:</label>
                      <input
                        type="text"
                        value={sellerDetails.phone}
                        onChange={(e) => setSellerDetails({ ...sellerDetails, phone: e.target.value })}
                        className="w-full border border-slate-300 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Email:</label>
                      <input
                        type="text"
                        value={sellerDetails.email}
                        onChange={(e) => setSellerDetails({ ...sellerDetails, email: e.target.value })}
                        className="w-full border border-slate-300 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSeller(false)}
                    className="px-3 py-1 bg-blue-600 text-white font-bold rounded text-xs mt-1 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-normal text-slate-800">
                    <span className="font-normal text-slate-800">Name:</span> {sellerDetails.name}
                  </p>
                  <p className="italic text-slate-600">{sellerDetails.address}</p>
                  <p className="italic text-slate-600">{sellerDetails.cityState}</p>
                  <p className="italic text-slate-600">{sellerDetails.countryZip}</p>

                  <div className="pt-2 space-y-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{sellerDetails.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{sellerDetails.email}</span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Billing Details</span>
                    </div>
                    <div className="text-xs text-slate-700 space-y-0.5 pl-5 font-normal">
                      <p>PAN: {sellerDetails.pan}</p>
                      <p>GST: {sellerDetails.gst}</p>
                      <p>MSME REG NO : {sellerDetails.msme}</p>
                      <p>TAN NO - {sellerDetails.tan}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Buyer Billing/Address Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-bold text-slate-900">Buyer Billing/Address Details</h3>
                <button
                  type="button"
                  onClick={() => setIsEditingBuyer(!isEditingBuyer)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-200/50"
                  title="Edit Buyer Details"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {isEditingBuyer ? (
                <div className="space-y-2 bg-white p-3 rounded border border-slate-300 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Buyer Name (Client):</label>
                    <input
                      type="text"
                      value={buyerDetails.name}
                      onChange={(e) => setBuyerDetails({ ...buyerDetails, name: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Address:</label>
                    <input
                      type="text"
                      value={buyerDetails.address}
                      onChange={(e) => setBuyerDetails({ ...buyerDetails, address: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-0.5">Country:</label>
                    <input
                      type="text"
                      value={buyerDetails.country}
                      onChange={(e) => setBuyerDetails({ ...buyerDetails, country: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Phone:</label>
                      <input
                        type="text"
                        value={buyerDetails.phone}
                        onChange={(e) => setBuyerDetails({ ...buyerDetails, phone: e.target.value })}
                        className="w-full border border-slate-300 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Email:</label>
                      <input
                        type="text"
                        value={buyerDetails.email}
                        onChange={(e) => setBuyerDetails({ ...buyerDetails, email: e.target.value })}
                        className="w-full border border-slate-300 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingBuyer(false)}
                    className="px-3 py-1 bg-blue-600 text-white font-bold rounded text-xs mt-1 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-normal text-slate-800">
                    <span className="font-normal text-slate-800">Name:</span> {buyerDetails.name}
                  </p>
                  <p className="italic text-slate-600">{buyerDetails.address}</p>
                  <p className="italic text-slate-600">{buyerDetails.country}</p>

                  <div className="pt-3 space-y-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{buyerDetails.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{buyerDetails.email}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Bank Details (Account No., Branch Name, A/c Holder Name, IFSC Code) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Account No.
            </label>
            <input
              type="text"
              placeholder="e.g. 051727000000221"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600 font-medium placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Branch Name
            </label>
            <select
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
            >
              <option value="">Select Bank Name...</option>
              <option value="YES BANK">YES BANK</option>
              <option value="HDFC BANK">HDFC BANK</option>
              <option value="ICICI BANK">ICICI BANK</option>
              <option value="STATE BANK OF INDIA">STATE BANK OF INDIA (SBI)</option>
              <option value="AXIS BANK">AXIS BANK</option>
              <option value="KOTAK MAHINDRA BANK">KOTAK MAHINDRA BANK</option>
              <option value="PUNJAB NATIONAL BANK">PUNJAB NATIONAL BANK</option>
              <option value="BANK OF BARODA">BANK OF BARODA</option>
              <option value="INDUSIND BANK">INDUSIND BANK</option>
              <option value="CANARA BANK">CANARA BANK</option>
              <option value="UNION BANK OF INDIA">UNION BANK OF INDIA</option>
              <option value="IDFC FIRST BANK">IDFC FIRST BANK</option>
              <option value="FEDERAL BANK">FEDERAL BANK</option>
              <option value="OTHER BANK">OTHER BANK</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              A/c Holder Name
            </label>
            <input
              type="text"
              placeholder="e.g. Leela Travels"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600 font-medium placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              IFSC Code
            </label>
            <input
              type="text"
              placeholder="e.g. YESB0000517"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-600 font-medium placeholder:text-slate-400 uppercase"
            />
          </div>
        </div>

        {/* Section 4: Overview */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1.5">Overview</label>
          <textarea
            rows={3}
            placeholder="eg. Darjeeling Tour Package - 27 Oct 2025 - 6N, 7D - 2A, 3 Children (10y, 9y, 8y)"
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            className="w-full border border-slate-300 rounded-md p-3 text-sm bg-white focus:outline-none focus:border-blue-600 resize-y placeholder:text-slate-400"
          />
        </div>

        {/* Section 5: Particulars Table with Dynamic Tax Dropdowns & Multi-Tax Support */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900">Particulars</h3>

          <div className="border border-slate-200 rounded-md overflow-x-auto bg-white shadow-2xs">
            <table className="w-full text-left text-sm border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-900 font-bold">
                  <th className="p-3.5 w-8">#</th>
                  <th className="p-3.5 min-w-[220px]">Particular</th>
                  <th className="p-3.5 w-20 text-center">Qty</th>
                  <th className="p-3.5 min-w-[340px]">Base Amount Per Qty (INR)</th>
                  <th className="p-3.5 w-52 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const totalBase = calculateItemBase(item);
                  const itemTaxes = calculateItemTaxes(item);
                  const itemTotal = calculateItemTotal(item);

                  return (
                    <tr key={index} className="border-b border-slate-200/80 align-top">
                      <td className="p-3.5 font-semibold text-slate-700">{index + 1}</td>
                      
                      {/* Particular Description */}
                      <td className="p-3.5 space-y-3">
                        <textarea
                          rows={4}
                          value={item.particularText}
                          onChange={(e) => handleItemChange(index, "particularText", e.target.value)}
                          placeholder="Details regarding the item"
                          className="w-full border border-slate-300 rounded-md p-3 text-sm focus:outline-none focus:border-blue-600 font-normal leading-relaxed placeholder:text-slate-400"
                        />
                      </td>

                      {/* Qty */}
                      <td className="p-3.5 text-center">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-16 text-center focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </td>

                      {/* Base Amount & Taxes Dynamic Block */}
                      <td className="p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="number"
                            value={item.baseAmount}
                            onChange={(e) => handleItemChange(index, "baseAmount", Number(e.target.value))}
                            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:border-blue-600 font-semibold"
                          />
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer whitespace-nowrap select-none">
                            <input
                              type="checkbox"
                              checked={item.applyTax}
                              onChange={(e) => handleItemChange(index, "applyTax", e.target.checked)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Apply Tax on Base Amount</span>
                          </label>
                        </div>

                        {/* Tax Dynamic Container matching Sembark image */}
                        {item.applyTax && (
                          <div className="bg-white p-3.5 rounded-md border border-slate-200/90 space-y-3">
                            {/* Tax Section Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold text-slate-800">Tax Name</span>
                              
                              <div className="flex items-center gap-2">
                                {/* Percentage / Amount Dropdown Header */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTypeDropdownIndex(activeTypeDropdownIndex === index ? null : index);
                                    }}
                                    className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <span>{item.taxType === "amount" ? "Amount" : "Percentage"}</span>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                  </button>

                                  {activeTypeDropdownIndex === index && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1 text-xs"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleTaxTypeChange(index, "percentage")}
                                        className={`w-full text-left px-3 py-1.5 cursor-pointer transition-colors ${
                                          item.taxType !== "amount" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        Percentage
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleTaxTypeChange(index, "amount")}
                                        className={`w-full text-left px-3 py-1.5 cursor-pointer transition-colors ${
                                          item.taxType === "amount" ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-100 text-slate-700"
                                        }`}
                                      >
                                        Amount
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Header Plus Button to Add New Tax Row */}
                                <button
                                  type="button"
                                  onClick={() => addTaxRow(index)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                                  title="Add Another Tax"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Tax Rows List */}
                            <div className="space-y-2.5">
                              {(item.taxes || [{ id: 1, name: "GST", value: 0 }]).map((tax, tIdx) => {
                                const rowTaxAmount = calculateSingleTaxAmount(item, tax);

                                return (
                                  <div key={tax.id || tIdx} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      {/* Tax Name with Preset Dropdown Popover */}
                                      <div className="flex-1">
                                        <TaxNameInputWithDropdown
                                          value={tax.name}
                                          placeholder="e.g. GST"
                                          onChange={(newVal) => handleTaxChange(index, tIdx, "name", newVal)}
                                        />
                                      </div>

                                      {/* Percentage/Amount Rate Input */}
                                      <div className="w-24 shrink-0 relative">
                                        <div className="flex items-center border border-slate-300 rounded-md bg-white focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-500">
                                          <input
                                            type="number"
                                            value={tax.value}
                                            onChange={(e) => handleTaxChange(index, tIdx, "value", Number(e.target.value))}
                                            className="px-2 py-1.5 text-xs w-full text-center focus:outline-none font-semibold text-slate-800"
                                            placeholder="0"
                                          />
                                          <span className="text-xs text-slate-500 font-semibold pr-2 select-none">
                                            {item.taxType === "amount" ? "₹" : "%"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Delete Tax Row Button */}
                                      <button
                                        type="button"
                                        onClick={() => removeTaxRow(index, tIdx)}
                                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                        title="Remove Tax"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Calculated Tax Display Underneath Input */}
                                    <div className="flex justify-end pr-8">
                                      <span className="text-[11px] text-slate-500 font-medium tracking-tight">
                                        {rowTaxAmount.toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Right Summary Column: Total Base Amount, Taxes, Item Total */}
                      <td className="p-3.5 space-y-2 text-right">
                        {/* Remove Particular Item Button */}
                        <div className="flex justify-end mb-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="border border-slate-200 rounded p-1 text-[#2563eb] hover:bg-blue-50 transition-colors cursor-pointer shadow-2xs"
                            title="Remove Item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 text-left">Total Base Amount</p>
                          <div className="bg-[#f8fafc] border border-slate-200 rounded-md px-3.5 py-1.5 text-sm text-slate-800 font-semibold text-center w-full shadow-2xs">
                            {totalBase.toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
                          <p className="text-xs font-bold text-slate-800 text-left">Taxes</p>
                          <div className="bg-[#f8fafc] border border-slate-200 rounded-md px-3.5 py-1.5 text-sm text-slate-800 font-semibold text-center w-full shadow-2xs">
                            {itemTaxes.toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div className="pt-2 text-right">
                          <span className="text-lg font-extrabold text-slate-900">
                            {itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-[#eef2ff] text-[#2563eb] hover:bg-blue-100 rounded-md text-sm font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Section 6: Total Summary Bar with Round Off & Package Amount Warning */}
        <div className="space-y-2 my-4">
          <div className="bg-[#f0f4f9] rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-end gap-3 shadow-2xs">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsRoundedOff(!isRoundedOff)}
                className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors cursor-pointer shadow-2xs ${
                  isRoundedOff
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Round Off
              </button>

              <div className="text-right">
                <span className="text-lg font-bold text-slate-900 mr-2">Total:</span>
                <span className="text-xs font-semibold text-slate-500 align-top mr-1">INR</span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Warning Alert Banner matching Sembark reference */}
          {hasAmountMismatch && (
            <div className="bg-[#fffbeb] border border-amber-200/90 rounded-md px-4 py-2.5 flex items-center justify-end gap-2 text-amber-900 text-xs font-medium animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                The invoice amount (INR {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 0 })}) is not equal to the package amount (INR {totalPkgPrice.toLocaleString("en-IN", { minimumFractionDigits: 0 })})
              </span>
            </div>
          )}
        </div>

        {/* Section 7: Special Notes & Terms and Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Special Notes <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Any special notes here"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-3 text-sm bg-white focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
            />
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
              <label className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Terms and Conditions</span>
              </label>

              {/* Agent Terms & Conditions Dropdown */}
              <div className="relative min-w-[220px] max-w-[280px]">
                <select
                  value={selectedTermId}
                  onChange={(e) => {
                    const termId = e.target.value;
                    setSelectedTermId(termId);
                    if (termId) {
                      const foundTerm = termsList.find(
                        (t) => String(t.id || t._id) === String(termId)
                      );
                      if (foundTerm) {
                        const parsed = extractPlainTextFromTerm(foundTerm.content);
                        setTermsConditions(parsed || foundTerm.content || "");
                      }
                    }
                  }}
                  disabled={loadingTerms}
                  className="w-full appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-2.5 pr-8 text-xs font-medium text-slate-700 shadow-2xs outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingTerms
                      ? "Loading TnC templates..."
                      : termsList.length === 0
                      ? "-- No saved TnC found --"
                      : "-- Select Saved TnC Template --"}
                  </option>
                  {termsList.map((term) => (
                    <option key={term.id || term._id} value={term.id || term._id}>
                      {term.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              </div>
            </div>

            <textarea
              rows={4}
              value={termsConditions}
              onChange={(e) => setTermsConditions(e.target.value)}
              placeholder="Terms and Conditions"
              className="w-full border border-slate-300 rounded-md p-3 text-sm bg-white focus:outline-none focus:border-blue-600 font-normal leading-relaxed placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Section 8: Yellow Alert Box */}
        <div className="bg-[#fffbeb] border border-amber-200 rounded-md p-4 space-y-2.5 my-4">
          <p className="text-sm font-semibold text-slate-900">
            Please cross check all the details and correct it if something is not as per rules and regulations.
          </p>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span>I confirm that all the details of this proforma invoice are correct</span>
          </label>
        </div>

        {/* Section 9: Footer Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Save Details
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-md text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProformaInvoice;