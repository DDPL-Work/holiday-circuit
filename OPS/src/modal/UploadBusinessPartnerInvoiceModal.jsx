

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {X,Upload,FileText,Calendar,Building2,IndianRupee,Info,CheckCircle2,AlertCircle,Clock,Sparkles,ArrowRight,ShieldCheck,Check,Loader2,FileSearch,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../utils/Api.js";


const todayStr = () => new Date().toISOString().slice(0, 10);

const formatIndianNumber = (val) => {
  if (val === "" || val === null || val === undefined) return "";
  const clean = String(val).replace(/,/g, "").trim();
  if (!clean || isNaN(Number(clean))) return String(val);
  const parts = clean.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] !== undefined ? "." + parts[1] : "";
  
  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  const formattedInt =
    otherNumbers !== ""
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;

  return formattedInt + decimalPart;
};

export default function UploadBusinessPartnerInvoiceModal({
  onClose,
  onSuccess,
  initialQuery = null,
}) {
  const [queries, setQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState(
    initialQuery?._id || initialQuery?.queryId || initialQuery?.id || ""
  );
  const [querySearch, setQuerySearch] = useState(
    initialQuery?.queryId || ""
  );
  const [isQueryDropdownOpen, setIsQueryDropdownOpen] = useState(false);

  const [partnerName, setPartnerName] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayStr());
  const [creditPeriodDays, setCreditPeriodDays] = useState(7);
  const [subtotal, setSubtotal] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [grandTotal, setGrandTotal] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [autoExtracted, setAutoExtracted] = useState(false);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoadingQueries(true);
        const { data } = await API.get("/ops/business-partner-invoices/queries");
        setQueries(data?.data || []);
      } catch (err) {
        console.error("Failed to load queries for partner invoice upload", err);
      } finally {
        setLoadingQueries(false);
      }
    };
    fetchQueries();
  }, []);

  const selectedQuery = useMemo(() => {
    if (!selectedQueryId) return initialQuery || null;
    return (
      queries.find(
        (q) => String(q.id) === String(selectedQueryId) || String(q.queryId) === String(selectedQueryId)
      ) || initialQuery || null
    );
  }, [selectedQueryId, queries, initialQuery]);

  const filteredQueries = useMemo(() => {
    if (!querySearch.trim()) return queries.slice(0, 15);
    const search = querySearch.toLowerCase();
    return queries.filter(
      (q) =>
        q.queryId?.toLowerCase().includes(search) ||
        q.destination?.toLowerCase().includes(search) ||
        q.customerName?.toLowerCase().includes(search) ||
        q.agentName?.toLowerCase().includes(search)
    ).slice(0, 15);
  }, [queries, querySearch]);

  const dueDate = useMemo(() => {
    if (!invoiceDate) return "";
    const parsed = new Date(invoiceDate);
    if (Number.isNaN(parsed.getTime())) return "";
    parsed.setDate(parsed.getDate() + Number(creditPeriodDays || 7));
    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [invoiceDate, creditPeriodDays]);

  const handleSubtotalChange = (val) => {
    const raw = val.replace(/,/g, "").replace(/[^0-9.]/g, "");
    setSubtotal(formatIndianNumber(raw));
    const sub = Number(raw || 0);
    const tax = Number(String(taxAmount).replace(/,/g, "") || 0);
    if (sub > 0 || tax > 0) {
      setGrandTotal(formatIndianNumber(Math.round(sub + tax)));
    }
  };

  const handleTaxChange = (val) => {
    const raw = val.replace(/,/g, "").replace(/[^0-9.]/g, "");
    setTaxAmount(formatIndianNumber(raw));
    const sub = Number(String(subtotal).replace(/,/g, "") || 0);
    const tax = Number(raw || 0);
    if (sub > 0 || tax > 0) {
      setGrandTotal(formatIndianNumber(Math.round(sub + tax)));
    }
  };

  const handleGrandTotalChange = (val) => {
    const raw = val.replace(/,/g, "").replace(/[^0-9.]/g, "");
    setGrandTotal(formatIndianNumber(raw));
  };

  const mathMismatch = useMemo(() => {
    const s = Number(String(subtotal).replace(/,/g, "") || 0);
    const t = Number(String(taxAmount).replace(/,/g, "") || 0);
    const g = Number(String(grandTotal).replace(/,/g, "") || 0);
    const tableSum = Math.round(s + t);
    const diff = Math.round(g - tableSum);

    if (s > 0 && g > 0 && Math.abs(diff) > 1) {
      let reason = "";
      if (diff > 0) {
        reason = `Net Payable (₹${formatIndianNumber(g)}) is ₹${formatIndianNumber(diff)} higher than the line-item table sum (₹${formatIndianNumber(tableSum)}) due to post-table additions (e.g. Handling charges, TDS, K3 Tax, or adjustments).`;
      } else {
        reason = `Net Payable (₹${formatIndianNumber(g)}) is ₹${formatIndianNumber(Math.abs(diff))} lower than the line-item table sum (₹${formatIndianNumber(tableSum)}) due to discounts, commissions earned, or deductions.`;
      }

      return {
        isMismatch: true,
        tableSum,
        diff,
        reason,
        netAdjustedSubtotal: Math.max(0, g - t),
      };
    }
    return { isMismatch: false, tableSum: 0, diff: 0, reason: "", netAdjustedSubtotal: 0 };
  }, [subtotal, taxAmount, grandTotal]);

  // Auto-extraction handler when user drops/selects an invoice file
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) return;

    setFile(selectedFile);
    setAutoExtracted(false);
    setParsing(true);

    try {
      const rawSub = Number(String(subtotal).replace(/,/g, "") || 0);
      const rawTax = Number(String(taxAmount).replace(/,/g, "") || 0);
      const rawGrand = Number(String(grandTotal).replace(/,/g, "") || 0);

      const formData = new FormData();
      formData.append("uploadedInvoice", selectedFile);
      formData.append(
        "claimedSummary",
        JSON.stringify({
          subtotal: rawSub,
          taxAmount: rawTax,
          grandTotal: rawGrand,
        })
      );

      const { data } = await API.post("/admin/internal-invoices/parse-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extraction = data?.data || null;
      const fields = extraction?.fields || {};

      // 1. Partner Name Auto-fill
      const detectedPartner = fields.partnerName || fields.supplierName || "";
      if (detectedPartner) {
        setPartnerName(detectedPartner);
      }

      // 2. Invoice Number
      if (fields.invoiceNumber) {
        setInvoiceNumber(fields.invoiceNumber);
      }

      // 3. Invoice Date
      if (fields.invoiceDate) {
        setInvoiceDate(fields.invoiceDate);
      }

      // 4. Grand Total & Subtotal & Tax with Indian Commas
      const extractedGrand = Number(fields.grandTotal || 0);
      const extractedTax = Number(fields.taxAmount || 0);
      const extractedSub = Number(fields.subtotal || 0);

      if (extractedGrand > 0) {
        setGrandTotal(formatIndianNumber(extractedGrand));
        setSubtotal(formatIndianNumber(extractedSub > 0 ? extractedSub : Math.max(0, extractedGrand - extractedTax)));
        setTaxAmount(formatIndianNumber(extractedTax));
      } else if (extractedSub > 0) {
        setSubtotal(formatIndianNumber(extractedSub));
        setTaxAmount(formatIndianNumber(extractedTax));
        setGrandTotal(formatIndianNumber(extractedSub + extractedTax));
      }

      setAutoExtracted(true);
      if (extraction?.status === "parsed") {
        toast.success("OCR Scanning: Invoice parsed & values auto-filled successfully!");
      } else {
        toast("Invoice uploaded. Please verify auto-filled amounts.");
      }
    } catch (error) {
      console.warn("Auto-extraction fallback to manual entry:", error);
      toast("Invoice attached. You can manually enter or review amounts.");
    } finally {
      setParsing(false);
      event.target.value = "";
    }
  };

  const effectivePartnerName = partnerName.trim();

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!selectedQueryId && !selectedQuery?.queryId) {
      toast.error("Please select a Booking / Query Reference");
      return;
    }

    if (!effectivePartnerName) {
      toast.error("Please enter the Business Partner / Supplier Name");
      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error("Please enter the Partner Invoice Number");
      return;
    }

    if (!invoiceDate) {
      toast.error("Please select the Invoice Date");
      return;
    }

    const subtotalNum = Number(String(subtotal).replace(/,/g, "") || 0);
    const taxAmountNum = Number(String(taxAmount).replace(/,/g, "") || 0);
    const grandTotalNum = Number(String(grandTotal).replace(/,/g, "") || subtotalNum || 0);

    if (grandTotalNum <= 0) {
      toast.error("Please enter a valid Invoice Amount (Grand Total)");
      return;
    }

    if (!file) {
      toast.error("Please attach the partner invoice document (PDF / Image / Doc)");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("queryId", selectedQuery?.queryId || selectedQueryId);
      formData.append("businessPartnerName", effectivePartnerName);
      formData.append("invoiceNumber", invoiceNumber.trim());
      formData.append("invoiceDate", invoiceDate);
      formData.append("creditPeriodDays", creditPeriodDays);
      formData.append("subtotal", subtotalNum || grandTotalNum);
      formData.append("taxAmount", taxAmountNum);
      formData.append("grandTotal", grandTotalNum);
      formData.append("remarks", remarks.trim());
      if (file) {
        formData.append("uploadedInvoice", file);
      }

      const { data } = await API.post("/ops/business-partner-invoices/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(
        data?.message || `Invoice for ${effectivePartnerName} uploaded successfully and sent to Finance!`
      );
      onSuccess?.(data?.data);
      onClose?.();
    } catch (err) {
      console.error("Failed to upload business partner invoice", err);
      toast.error(
        err?.response?.data?.message || "Failed to upload business partner invoice. Please check details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-xl border border-gray-200 bg-white text-slate-800 shadow-2xl overflow-hidden font-sans"
        >
          {/* Header - Matching CreatePreDefinedPackageModal Style */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/90 px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-600 shrink-0 shadow-xs">
                <Building2 size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                    Upload Business Partner Invoice
                  </h2>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700">
                    Offline Partner Flow
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload & auto-extract invoice details for MakeMyTrip, Agoda, Yatra or offline suppliers to Finance
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body - 2 Column Grid */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scroll">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Column (Cols 1-7): Partner & Booking Details */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* 1. Booking / Query Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Booking Reference (Query ID) <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={querySearch}
                      onChange={(e) => {
                        setQuerySearch(e.target.value);
                        setIsQueryDropdownOpen(true);
                      }}
                      onFocus={() => setIsQueryDropdownOpen(true)}
                      placeholder="Search Query ID (e.g. QRY-1093), Destination, or Agent..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />

                    {isQueryDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsQueryDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl custom-scroll">
                          {loadingQueries ? (
                            <p className="p-2 text-center text-xs text-slate-400">Loading queries...</p>
                          ) : filteredQueries.length > 0 ? (
                            filteredQueries.map((q) => (
                              <button
                                key={q.id || q.queryId}
                                type="button"
                                onClick={() => {
                                  setSelectedQueryId(q.queryId || q.id);
                                  setQuerySearch(q.queryId);
                                  setIsQueryDropdownOpen(false);
                                }}
                                className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-slate-50 transition cursor-pointer"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{q.queryId}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {q.destination} • {q.pax} Pax • {q.agentName}
                                  </p>
                                </div>
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                                  {q.status}
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="p-2 text-center text-xs text-slate-400">No matching bookings found</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {selectedQuery && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-50/70 border border-blue-200/80 px-3 py-1.5 text-xs">
                      <span className="font-semibold text-blue-900">
                        Linked Booking: <span className="font-bold">{selectedQuery.queryId}</span> ({selectedQuery.destination || "Destination"})
                      </span>
                      <span className="text-blue-700 font-medium">
                        {selectedQuery.pax ? `${selectedQuery.pax} PAX` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Partner Name Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Partner / Offline Supplier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. MakeMyTrip, Agoda, Riya Travels, Yatra, Hotel Oberoi..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Type manually or upload invoice document to auto-extract partner name
                  </p>
                </div>

                {/* 3. Invoice Number, Date, Credit Terms */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Invoice Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. MMT-INV-98210"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Invoice Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer [color-scheme:light]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Credit Terms
                    </label>
                    <select
                      value={creditPeriodDays}
                      onChange={(e) => setCreditPeriodDays(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
                    >
                      <option value={7}>7-Day Credit</option>
                      <option value={15}>15-Day Credit</option>
                    </select>
                    {dueDate && (
                      <p className="mt-1 text-[10px] font-medium text-slate-400">
                        Due: <span className="font-semibold text-slate-600">{dueDate}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ops Remarks / Notes for Finance (Optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. MMT booking confirmation received for hotel & airport transfer."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                  />
                </div>
              </div>

              {/* Right Column (Cols 8-12): File Upload with AI OCR & Financials */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* File Upload Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Attach Invoice Document <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                      <Sparkles size={11} />
                      Auto-Extracts Details
                    </span>
                  </div>

                  <label className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition cursor-pointer ${
                    parsing
                      ? "border-blue-400 bg-blue-50/50"
                      : file
                      ? "border-emerald-300 bg-emerald-50/40"
                      : "border-gray-300 bg-gray-50/70 hover:border-blue-400 hover:bg-blue-50/30"
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {parsing ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <div>
                          <p className="text-xs font-bold text-blue-700">OCR Scanning Document...</p>
                          <p className="text-[10px] text-slate-500">Extracting invoice number & amounts</p>
                        </div>
                      </div>
                    ) : file ? (
                      <div className="relative flex flex-col items-center gap-1.5 py-1 w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setFile(null);
                            setAutoExtracted(false);
                          }}
                          title="Remove uploaded file"
                          className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-300 text-gray-400 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition cursor-pointer shadow-xs z-10"
                        >
                          <X size={13} />
                        </button>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <CheckCircle2 size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">{file.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {Math.max(1, Math.round(file.size / 1024))} kB • Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <Upload size={22} className="mx-auto text-slate-400 mb-1.5" />
                        <p className="text-xs font-bold text-slate-700">
                          Upload Partner Invoice PDF / Image
                        </p>
                        <p className="text-[10.5px] text-slate-400 mt-1">
                          Auto-fills invoice number, date & amount breakdown
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Amount Breakdown Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <IndianRupee size={14} className="text-emerald-600" />
                      Invoice Amount Breakdown
                    </p>
                    {autoExtracted && (
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check size={10} className="stroke-[3]" /> Auto-Filled
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">
                        Subtotal Amount (₹)
                      </label>
                      <input
                        type="text"
                        value={subtotal}
                        onChange={(e) => handleSubtotalChange(e.target.value)}
                        placeholder="e.g. 85000"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">
                        Tax / GST Amount (₹)
                      </label>
                      <input
                        type="text"
                        value={taxAmount}
                        onChange={(e) => handleTaxChange(e.target.value)}
                        placeholder="e.g. 4250"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="pt-1 border-t border-gray-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Grand Total Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={grandTotal}
                        onChange={(e) => handleGrandTotalChange(e.target.value)}
                        placeholder="e.g. 89,250"
                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm font-extrabold outline-none shadow-2xs transition ${
                          mathMismatch.isMismatch
                            ? "border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                            : "border-amber-400 text-amber-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        }`}
                      />
                    </div>

                    {mathMismatch.isMismatch && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-[11px] text-amber-950 space-y-2 animate-fadeIn shadow-2xs">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs text-amber-900">
                                ⚠ Amount Verification Notice
                              </p>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                                {mathMismatch.diff > 0 ? `+₹${formatIndianNumber(mathMismatch.diff)}` : `-₹${formatIndianNumber(Math.abs(mathMismatch.diff))}`} diff
                              </span>
                            </div>

                            {/* Breakdown comparison */}
                            <div className="mt-1.5 p-2 rounded-lg bg-white/90 border border-amber-200 text-[10.5px] space-y-1">
                              <div className="flex justify-between text-slate-600">
                                <span>Base Table Sum (Subtotal + Tax):</span>
                                <span className="font-semibold text-slate-800">₹{subtotal} + ₹{taxAmount || "0"} = ₹{formatIndianNumber(mathMismatch.tableSum)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Invoice Net Amount (Grand Total):</span>
                                <span className="font-bold text-slate-900">₹{grandTotal}</span>
                              </div>
                            </div>

                            {/* Reason explanation */}
                            <p className="text-[10.5px] text-amber-800 mt-1 leading-relaxed">
                              <strong className="font-semibold text-amber-950">Reason:</strong> {mathMismatch.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </form>

          {/* Footer - Matching CreatePreDefinedPackageModal Button Layout */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/90 px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
                submitting
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[#3E63DD] hover:bg-blue-700"
              }`}
            >
              {submitting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Uploading to Finance...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Upload Partner Invoice</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
