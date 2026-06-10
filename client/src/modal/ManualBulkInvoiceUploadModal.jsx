import { createElement, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, ChevronDown, FileText, Hash, IndianRupee, Loader2, Upload, X, AlertCircle, Info, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import API from "../utils/Api";

const todayInput = () => new Date().toISOString().slice(0, 10);

const addDays = (value, days) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + Number(days || 0));
  return parsed.toISOString().slice(0, 10);
};

const FieldIcon = ({ icon }) => (
  <span className="pointer-events-none absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
    {createElement(icon, { size: 14 })}
  </span>
);

export default function ManualBulkInvoiceUploadModal({ onClose, onUploaded }) {
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [file, setFile] = useState(null);
  const [invoiceExtraction, setInvoiceExtraction] = useState(null);
  const [isExtractionOpen, setIsExtractionOpen] = useState(false);
  const [form, setForm] = useState({
    vendorId: "",
    invoiceNumber: `MANUAL-${Date.now()}`,
    invoiceDate: todayInput(),
    creditPeriodDays: 7,
    subtotal: "",
    taxAmount: "",
    grandTotal: "",
    notes: "",
  });

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => String(vendor.id) === String(form.vendorId)) || null,
    [form.vendorId, vendors],
  );

  const dueDate = useMemo(
    () => addDays(form.invoiceDate, Number(form.creditPeriodDays || 7)),
    [form.creditPeriodDays, form.invoiceDate],
  );

  useEffect(() => {
    let cancelled = false;

    const loadVendors = async () => {
      try {
        setLoadingVendors(true);
        const { data } = await API.get("/admin/vendors");
        if (!cancelled) {
          setVendors(data?.data || []);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load vendors");
      } finally {
        if (!cancelled) {
          setLoadingVendors(false);
        }
      }
    };

    loadVendors();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) return;

    setFile(selectedFile);
    setInvoiceExtraction(null);
    setIsExtractionOpen(false);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append("uploadedInvoice", selectedFile);
      formData.append("claimedSummary", JSON.stringify({
        subtotal: Number(form.subtotal || 0),
        taxAmount: Number(form.taxAmount || 0),
        grandTotal: Number(form.grandTotal || 0),
      }));

      const { data } = await API.post("/admin/internal-invoices/parse-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extraction = data?.data || null;
      const fields = extraction?.fields || {};
      setInvoiceExtraction(extraction);
      setIsExtractionOpen(true);
      setForm((prev) => ({
        ...prev,
        invoiceNumber: fields.invoiceNumber || prev.invoiceNumber,
        invoiceDate: fields.invoiceDate || prev.invoiceDate,
        subtotal: String(Number(fields.subtotal || 0)),
        taxAmount: String(Number(fields.taxAmount || 0)),
        grandTotal: String(Number(fields.grandTotal || 0)),
      }));

      if (extraction?.status === "parsed") {
        toast.success("Invoice parsed and values filled");
      } else {
        toast("Invoice uploaded. Please review values manually.");
      }
    } catch (error) {
      setInvoiceExtraction({
        status: "failed",
        source: "upload",
        error: error?.response?.data?.message || "Unable to parse this invoice automatically.",
      });
      setIsExtractionOpen(true);
      toast.error(error?.response?.data?.message || "Invoice parser needs manual review");
    } finally {
      setParsing(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!form.vendorId) {
      toast.error("Select vendor first");
      return;
    }

    if (!file) {
      toast.error("Upload vendor invoice PDF, DOC, or DOCX");
      return;
    }

    if (!form.invoiceNumber || !form.invoiceDate || Number(form.grandTotal || 0) <= 0) {
      toast.error("Invoice number, date, and grand total are required");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("vendorId", form.vendorId);
      formData.append("uploadedInvoice", file);
      formData.append("invoiceMeta", JSON.stringify({
        vendorId: form.vendorId,
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        dueDate,
        creditPeriodDays: Number(form.creditPeriodDays || 7),
        notes: form.notes,
      }));
      formData.append("claimedSummary", JSON.stringify({
        subtotal: Number(form.subtotal || 0),
        taxAmount: Number(form.taxAmount || 0),
        grandTotal: Number(form.grandTotal || 0),
      }));

      const { data } = await API.post("/admin/internal-invoices/manual-bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(data?.message || "Bulk invoice uploaded");
      onUploaded?.(data?.data);
      onClose?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to upload bulk invoice",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-4xl max-h-[82vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl relative flex flex-col"
          initial={{ y: 24, scale: 0.98, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 20, scale: 0.98, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          {/* Header with Top Gradient Border */}
          <div className="relative flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-blue-50/10 to-white px-5 py-2.5">
            <div className="absolute top-0 left-0 h-[4px] w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-blue-600">
                Finance Handoff
              </p>
              <h2 className="mt-0.5 text-lg font-bold text-slate-900">Manual Bulk Vendor Invoice</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Upload any vendor invoice format and create a finance settlement record.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid gap-4 p-3.5 lg:grid-cols-[1.3fr_1fr] flex-1 overflow-y-auto min-h-0 hide-scrollbar">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor</label>
                <select
                  value={form.vendorId}
                  onChange={(event) => updateField("vendorId", event.target.value)}
                  disabled={loadingVendors}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                >
                  <option value="">{loadingVendors ? "Loading vendors..." : "Select DMC vendor"}</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} {vendor.email ? `- ${vendor.email}` : ""}
                    </option>
                  ))}
                </select>
                {selectedVendor ? (
                  <p className="mt-0.5 text-[10px] text-slate-500 font-medium">
                    Credit allowed: {(selectedVendor.creditDays || [7, 15]).join(", ")} days
                  </p>
                ) : null}
              </div>

              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FieldIcon icon={Hash} />
                    <input
                      value={form.invoiceNumber}
                      onChange={(event) => updateField("invoiceNumber", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-11 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                      placeholder="e.g. VND-INV-2026-001"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FieldIcon icon={Calendar} />
                    <input
                      type="date"
                      value={form.invoiceDate}
                      onChange={(event) => updateField("invoiceDate", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-11 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Vendor Credit Period <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FieldIcon icon={Calendar} />
                    <select
                      value={form.creditPeriodDays}
                      onChange={(event) => updateField("creditPeriodDays", Number(event.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-11 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                    >
                      <option value={7}>7-day credit</option>
                      <option value={15}>15-day credit</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Auto Due Date
                  </label>
                  <div className="relative">
                    <FieldIcon icon={Calendar} />
                    <input
                      value={dueDate}
                      readOnly
                      className="w-full rounded-xl border border-slate-200 bg-slate-100/60 py-1.5 pl-11 pr-3 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">
                {[
                  ["subtotal", "Invoice Subtotal"],
                  ["taxAmount", "Invoice Tax Amount"],
                  ["grandTotal", "Invoice Grand Total"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {label}{key === "grandTotal" ? <span className="text-red-500"> *</span> : null}
                    </label>
                    <div className="relative">
                      <FieldIcon icon={IndianRupee} />
                      <input
                        type="number"
                        value={form[key]}
                        onChange={(event) => updateField(key, event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-11 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Finance Note
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  placeholder="Optional note, vendor remarks, or settlement instruction"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/30 via-slate-50/10 to-emerald-50/20 p-3 w-full self-start">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <FileText size={14} className="text-blue-600" />
                Invoice File
              </div>
              <label className="mt-2 flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-center transition-all duration-300 hover:border-blue-500 hover:bg-white hover:shadow-md hover:shadow-blue-50/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform duration-300 hover:scale-105">
                  <Upload size={15} />
                </div>
                <span className="mt-2 text-xs font-bold text-slate-800">
                  {file ? file.name : "Choose invoice"}
                </span>
                <span className="mt-0.5 text-[10px] text-slate-400">PDF, DOCX, JPG, PNG</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {parsing ? (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  <Loader2 size={12} className="animate-spin" />
                  Parsing invoice
                </div>
              ) : null}
              {invoiceExtraction ? (
                (() => {
                  const extractionPassed =
                    invoiceExtraction.status === "parsed" &&
                    invoiceExtraction.verification?.passed !== false &&
                    !invoiceExtraction.verification?.warnings?.length;
                  const extractionFailed =
                    invoiceExtraction.status === "parsed" && !extractionPassed;
                  const fields = invoiceExtraction.fields || {};
                  const getCurrencySymbol = (currency) => {
                    const cur = String(currency || '').trim().toUpperCase();
                    if (cur === 'INR') return '₹';
                    if (cur === 'USD') return '$';
                    if (cur === 'EUR') return '€';
                    if (cur === 'GBP') return '£';
                    if (cur === 'THB') return '฿';
                    return cur;
                  };

                  const getFieldCheckDetails = (label, key, isAmount = false) => {
                    const matched = isAmount 
                      ? Number(fields[key] || 0) > 0 
                      : Boolean(fields[key]);
                    
                    let primaryValue = fields[key] || "-";
                    let secondaryValue = null;

                    if (isAmount) {
                      const amount = Number(fields[key] || 0).toLocaleString("en-IN");
                      const currency = fields.currency || "INR";
                      primaryValue = `${getCurrencySymbol(currency)} ${amount}`;
                      
                      const originalValue = fields.originalAmounts?.[key];
                      if (fields.conversionApplied && Number(originalValue || 0) > 0) {
                        secondaryValue = `from ${getCurrencySymbol(fields.originalCurrency)} ${Number(originalValue || 0).toLocaleString("en-IN")}`;
                      }
                    }

                    return { label, primaryValue, secondaryValue, matched };
                  };

                  const fieldChecks = [
                    { label: "Invoice", primaryValue: fields.invoiceNumber || "-", secondaryValue: null, matched: Boolean(fields.invoiceNumber) },
                    { label: "Date", primaryValue: fields.invoiceDate || "-", secondaryValue: null, matched: Boolean(fields.invoiceDate) },
                    getFieldCheckDetails("Subtotal", "subtotal", true),
                    getFieldCheckDetails("Tax", "taxAmount", true),
                    getFieldCheckDetails("Total", "grandTotal", true),
                  ];
                  return (
                <div className={`mt-3 overflow-hidden rounded-2xl border text-xs shadow-sm ${
                  extractionPassed
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                    : extractionFailed
                      ? "border-rose-200 bg-rose-50/80 text-rose-900"
                    : "border-amber-200 bg-amber-50/80 text-amber-900"
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsExtractionOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/30"
                    aria-expanded={isExtractionOpen}
                  >
                    <p className="font-bold uppercase tracking-[0.16em]">
                      Parser / OCR Check
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 font-semibold">
                      {(invoiceExtraction.source || "parser").replace(/_/g, " ")} · {invoiceExtraction.confidence || 0}% confidence
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${isExtractionOpen ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExtractionOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                  <div className="border-t border-white/70 px-4 pb-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {fieldChecks.map((field) => (
                        <div
                          key={field.label}
                          className={`flex flex-col justify-between p-3 rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md cursor-default ${
                            field.matched 
                              ? "bg-emerald-500/10 border-emerald-250/60 text-emerald-950" 
                              : "bg-rose-500/10 border-rose-250/60 text-rose-950"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
                              {field.label}
                            </span>
                            {field.matched ? (
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle size={14} className="text-rose-600 shrink-0" />
                            )}
                          </div>
                          <span className="font-extrabold text-[12.5px] leading-tight">
                            {field.primaryValue}
                          </span>
                          {field.secondaryValue && (
                            <span className="mt-1 text-[10px] font-medium text-slate-500/80 leading-normal">
                              {field.secondaryValue}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {invoiceExtraction.verification?.warnings?.length ? (
                      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-200/50 p-3.5 text-xs leading-relaxed text-rose-950 shadow-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                        <span>{invoiceExtraction.verification.warnings.join(" ")}</span>
                      </div>
                    ) : null}

                    {invoiceExtraction.error ? (
                      <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-200/50 p-3.5 text-xs leading-relaxed text-rose-950 shadow-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-700" />
                        <span>{invoiceExtraction.error}</span>
                      </div>
                    ) : null}
                  </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                  );
                })()
              ) : null}
              <p className="mt-3 text-[10px] leading-relaxed text-slate-400 text-center font-medium">
                Parser fills known values when possible. Finance can still review and edit before payout.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-5 py-2.5 bg-slate-50/40">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || parsing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-100/50 hover:shadow-lg hover:shadow-blue-100/80 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {submitting ? "Uploading..." : parsing ? "Parsing..." : "Upload Bulk Invoice"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
