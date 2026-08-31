import React from "react";
import {
  FileText,
  Upload,
  Briefcase,
  Hash,
  Calendar,
  Clock,
  CalendarDays,
  DollarSign,
  Receipt,
  IndianRupee,
  X,
  CheckCircle2,
  ChevronDown,
  XCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Send,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { RotatingLines } from "react-loader-spinner";
import { FieldShell } from "../FieldShell";
import {
  TEMPLATE_OPTIONS,
  formatMoney,
  EMPTY_CLAIMED_SUMMARY,
} from "../../utils/dmcPaymentLedgerHelpers";

export const BulkInvoiceSettlementForm = ({
  invoiceSource,
  setInvoiceSource,
  invoiceMeta,
  handleMetaChange,
  resolvedCreditDays,
  taxConfig,
  setTaxConfig,
  isFileUploading,
  uploadedInvoiceFile,
  setUploadedInvoiceFile,
  handleFileChange,
  invoiceExtraction,
  setInvoiceExtraction,
  isExtractionOpen,
  setIsExtractionOpen,
  selectedSubtotal,
  selectedGst,
  selectedTcs,
  selectedTotal,
  selectedCurrency,
  claimedSummary,
  setClaimedSummary,
  selectedRefs,
  submitBatch,
  submitting,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-[#1e3a8a] via-[#111827] to-emerald-600"></div>

      <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm animate-pulse">
          <FileText size={16} />
        </span>
        Bulk Invoice Details
      </h3>

      <div className="relative mt-4 flex items-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 p-1 text-[11px] font-semibold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => setInvoiceSource("system_template")}
          className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 transition-all duration-300 ${
            invoiceSource === "system_template"
              ? "font-bold text-white"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {invoiceSource === "system_template" && (
            <motion.span
              layoutId="bulk-invoice-source-tab-pill"
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#1e3a8a] to-[#107c41] shadow-[0_2px_8px_rgba(30,58,138,0.25)]"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1">
            <FileText size={12} />
            Company Template
          </span>
        </button>
        <button
          type="button"
          onClick={() => setInvoiceSource("uploaded_invoice")}
          className={`relative z-10 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 transition-all duration-300 ${
            invoiceSource === "uploaded_invoice"
              ? "font-bold text-white"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {invoiceSource === "uploaded_invoice" && (
            <motion.span
              layoutId="bulk-invoice-source-tab-pill"
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#1e3a8a] to-[#107c41] shadow-[0_2px_8px_rgba(30,58,138,0.25)]"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1">
            <Upload size={12} />
            Upload Invoice
          </span>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Supplier Name <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Briefcase} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
              <input
                value={invoiceMeta.supplierName}
                onChange={(e) => handleMetaChange("supplierName", e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-blue-50/20 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="DMC Company Name"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Invoice Number <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Hash} iconWrapClassName="bg-gradient-to-tr from-sky-50 to-cyan-50 border border-sky-100 text-sky-600 shadow-sm">
              <input
                value={invoiceMeta.invoiceNumber}
                onChange={(e) => handleMetaChange("invoiceNumber", e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-sky-50/20 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="INV-2026-0001"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Invoice Date <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Calendar} iconWrapClassName="bg-gradient-to-tr from-orange-50 to-amber-50 border border-orange-100 text-orange-600 shadow-sm">
              <input
                type="date"
                value={invoiceMeta.invoiceDate}
                onChange={(e) => handleMetaChange("invoiceDate", e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-orange-50/20 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </FieldShell>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Credit Period <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={Clock} iconWrapClassName="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-600 shadow-sm">
              <select
                value={invoiceMeta.creditPeriodDays}
                onChange={(e) => handleMetaChange("creditPeriodDays", e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-emerald-50/15 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
              >
                {resolvedCreditDays.map((days) => (
                  <option key={days} value={days}>
                    {Number(days) === 0 ? "Immediate (0-day credit)" : `${days}-day credit`}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Due Date <span className="text-red-600">*</span>
            </label>
            <FieldShell icon={CalendarDays} iconWrapClassName="bg-gradient-to-tr from-rose-50 to-red-50 border border-rose-100 text-rose-600 shadow-sm">
              <input
                type="date"
                value={invoiceMeta.dueDate}
                readOnly
                className="w-full rounded-xl border border-gray-300 bg-rose-50/15 py-2 pl-11 pr-3 text-sm text-slate-700 shadow-sm outline-none cursor-not-allowed"
              />
            </FieldShell>
          </div>

          {invoiceSource === "system_template" ? (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Template <span className="text-red-600">*</span>
              </label>
              <FieldShell icon={FileText} iconWrapClassName="bg-gradient-to-tr from-violet-50 to-indigo-50 border border-violet-100 text-violet-600 shadow-sm">
                <select
                  value={invoiceMeta.templateVariant}
                  onChange={(e) => handleMetaChange("templateVariant", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-violet-50/20 py-2 pl-11 pr-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                >
                  {TEMPLATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">GST %</label>
            <FieldShell icon={DollarSign} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
              <input
                type="number"
                value={taxConfig.gstRate}
                onChange={(event) =>
                  setTaxConfig((prev) => ({ ...prev, gstRate: Number(event.target.value || 0) }))
                }
                className="w-full rounded-xl border border-gray-300 bg-blue-50/20 py-2 pl-11 pr-2 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2"
              />
            </FieldShell>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">TCS %</label>
            <FieldShell icon={Receipt} iconWrapClassName="bg-gradient-to-tr from-violet-50 to-purple-50 border border-violet-100 text-violet-600 shadow-sm">
              <input
                type="number"
                value={taxConfig.tcsRate}
                onChange={(event) =>
                  setTaxConfig((prev) => ({ ...prev, tcsRate: Number(event.target.value || 0) }))
                }
                className="w-full rounded-xl border border-gray-300 bg-violet-50/20 py-2 pl-11 pr-2 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2"
              />
            </FieldShell>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">Other</label>
            <FieldShell icon={IndianRupee} iconWrapClassName="bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-100 text-amber-600 shadow-sm">
              <input
                type="number"
                value={taxConfig.otherTax}
                onChange={(event) =>
                  setTaxConfig((prev) => ({ ...prev, otherTax: Number(event.target.value || 0) }))
                }
                className="w-full rounded-xl border border-gray-300 bg-amber-50/20 py-2 pl-11 pr-2 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2"
              />
            </FieldShell>
          </div>
        </div>
      </div>

      {invoiceSource === "uploaded_invoice" ? (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-3 shadow-inner animate-fade-in">
          <div className="mb-3">
            {isFileUploading ? (
              <div className="flex min-h-[80px] flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-white/95 p-3 text-center shadow-inner">
                <RotatingLines
                  width="22"
                  strokeColor="#2563eb"
                  strokeWidth="4"
                  animationDuration="0.75"
                />
                <span className="mt-1.5 text-[11px] font-semibold text-blue-600 animate-pulse">
                  Uploading & Scanning...
                </span>
              </div>
            ) : uploadedInvoiceFile ? (
              <div className="relative flex min-h-[80px] flex-col items-center justify-center rounded-xl border border-emerald-250 bg-emerald-50/80 p-3 text-center shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setUploadedInvoiceFile(null);
                    setInvoiceExtraction(null);
                    setIsExtractionOpen(false);
                    setClaimedSummary(EMPTY_CLAIMED_SUMMARY);
                  }}
                  className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm border border-emerald-100 hover:bg-rose-50 hover:text-rose-700 transition"
                  title="Remove Invoice"
                >
                  <X size={10} />
                </button>
                <CheckCircle2 size={18} className="mb-1 text-emerald-600 animate-scale-in" />
                <span className="max-w-[200px] truncate text-[11px] font-bold text-slate-800">
                  {uploadedInvoiceFile.name}
                </span>
                <span className="text-[9px] text-emerald-600 font-semibold animate-pulse">
                  Scanned and ready
                </span>
              </div>
            ) : (
              <label className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/30 group">
                <Upload size={16} className="mb-1 text-blue-500 transition-transform group-hover:-translate-y-0.5 duration-200" />
                <span className="text-[11px] font-bold text-slate-700">Choose Invoice</span>
                <span className="text-[9px] font-normal text-slate-400">PDF, DOCX, JPG, PNG up to 10MB</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {invoiceExtraction ? (
            (() => {
              const extractionPassed =
                invoiceExtraction.status === "parsed" &&
                invoiceExtraction.verification?.passed !== false &&
                !invoiceExtraction.verification?.warnings?.length;
              const extractionFailed =
                invoiceExtraction.status === "parsed" && !extractionPassed;
              const fields = invoiceExtraction.fields || {};
              const expectedTax = selectedGst + selectedTcs + Number(taxConfig.otherTax || 0);
              const amountMatches = (extracted, expected) =>
                Number(expected || 0) === 0
                  ? Math.round(Number(extracted || 0)) === 0
                  : Number(extracted || 0) > 0 &&
                    Math.round(Number(extracted || 0)) === Math.round(Number(expected || 0));
              const getCurrencySymbol = (currency) => {
                const cur = String(currency || '').trim().toUpperCase();
                if (cur === 'INR') return '₹';
                if (cur === 'USD') return '$';
                if (cur === 'EUR') return '€';
                if (cur === 'GBP') return '£';
                if (cur === 'THB') return '฿';
                return cur;
              };

              const getFieldCheckDetails = (label, key, expectedValue, isAmount = false) => {
                const matched = isAmount 
                  ? amountMatches(fields[key], expectedValue) 
                  : Boolean(fields[key]);
                
                let primaryValue = fields[key] || "-";
                let secondaryValue = null;

                if (isAmount) {
                  const amount = Number(fields[key] || 0).toLocaleString("en-IN");
                  const currency = fields.currency || selectedCurrency || "INR";
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
                getFieldCheckDetails("Subtotal", "subtotal", selectedSubtotal, true),
                getFieldCheckDetails("Tax", "taxAmount", expectedTax, true),
                getFieldCheckDetails("Total", "grandTotal", selectedTotal, true),
              ];
              return (
                <div className={`mb-3 overflow-hidden rounded-2xl border text-xs shadow-sm ${
                  extractionPassed
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                    : extractionFailed
                      ? "border-rose-200 bg-rose-50/80 text-rose-900"
                    : "border-amber-200 bg-amber-50/80 text-amber-900"
                }`}>
                  <button
                    type="button"
                    onClick={() => setIsExtractionOpen((prev) => !prev)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/30"
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

                          {invoiceExtraction.verification?.notes?.length ? (
                            <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-blue-500/10 border border-blue-200/50 p-3.5 text-xs leading-relaxed text-blue-950 shadow-sm">
                              <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
                              <span>{invoiceExtraction.verification.notes.join(" ")}</span>
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

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Subtotal</label>
              <FieldShell icon={IndianRupee} iconWrapClassName="bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-sm">
                <input
                  type="number"
                  value={claimedSummary.subtotal ?? ""}
                  onChange={(event) =>
                    setClaimedSummary((prev) => ({
                      ...prev,
                      subtotal: event.target.value === "" ? "" : Number(event.target.value),
                    }))
                  }
                  placeholder="Enter subtotal"
                  className="w-full rounded-xl border border-gray-300 bg-blue-50/20 py-2 pl-11 pr-2 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </FieldShell>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Tax</label>
              <FieldShell icon={Receipt} iconWrapClassName="bg-gradient-to-tr from-rose-50 to-red-50 border border-rose-100 text-rose-600 shadow-sm">
                <input
                  type="number"
                  value={claimedSummary.taxAmount ?? ""}
                  onChange={(event) =>
                    setClaimedSummary((prev) => ({
                      ...prev,
                      taxAmount: event.target.value === "" ? "" : Number(event.target.value),
                    }))
                  }
                  placeholder="Enter tax"
                  className="w-full rounded-xl border border-gray-300 bg-rose-50/20 py-2 pl-11 pr-2 text-xs text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </FieldShell>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total</label>
              <FieldShell icon={IndianRupee} iconWrapClassName="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-600 shadow-sm">
                <input
                  type="number"
                  value={claimedSummary.grandTotal ?? ""}
                  onChange={(event) =>
                    setClaimedSummary((prev) => ({
                      ...prev,
                      grandTotal: event.target.value === "" ? "" : Number(event.target.value),
                    }))
                  }
                  placeholder="Enter total"
                  className="w-full rounded-xl border border-gray-300 bg-emerald-50/20 py-2 pl-11 pr-2 text-xs text-slate-900 outline-none font-bold focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </FieldShell>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-blue-100 bg-sky-50/40 p-4 text-xs shadow-inner">
        {invoiceSource === "uploaded_invoice" ? (
          <p className="mb-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">System Reference Summary</p>
        ) : null}
        <div className="flex justify-between text-slate-500">
          <span>Selected services</span>
          <span className="font-semibold text-slate-800">{selectedRefs.length}</span>
        </div>
        <div className="mt-2 flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-800">{formatMoney(selectedSubtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-slate-500">
          <span>Tax</span>
          <span className="font-semibold text-slate-800">{formatMoney(selectedGst + selectedTcs + Number(taxConfig.otherTax || 0))}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
          <span>Total</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800">{formatMoney(selectedTotal)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={submitBatch}
        disabled={submitting || !selectedRefs.length}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-500 ease-in-out ${
          submitting || !selectedRefs.length
            ? "cursor-not-allowed bg-slate-200 text-slate-400 border border-slate-200"
            : "bg-gradient-to-r from-blue-900 to-emerald-600 hover:from-blue-950 hover:to-emerald-700 hover:shadow-[0_4px_14px_rgba(16,185,129,0.35)] active:scale-[0.98] transform"
        }`}
      >
        {submitting ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={16} />
            Send Bulk Settlement
          </>
        )}
      </button>

      <div className="mt-4 rounded-xl bg-blue-50/60 border border-blue-100/50 px-3.5 py-3 text-xs leading-5 text-blue-800 flex items-start gap-2">
        <IndianRupee size={15} className="mt-0.5 shrink-0 text-blue-600" />
        <span>Finance will see this as a bulk internal invoice and can pay it in one or multiple payout installments.</span>
      </div>
    </div>
  );
};
