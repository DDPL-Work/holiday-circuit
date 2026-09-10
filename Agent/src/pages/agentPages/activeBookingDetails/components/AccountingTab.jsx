import React from "react";
import {
  BadgePercent,
  Upload,
  X,
  FileText,
  CheckCheck,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { PaymentTracker } from "./PaymentTracker";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  statusTone,
} from "../utils/bookingDetailsHelpers";

export const AccountingTab = ({
  accountingSubTab,
  setAccountingSubTab,
  totalPaidAmount,
  expectedPaymentAmount,
  remainingPaymentAmount,
  headerBookingId,
  validTrackerPayments,
  handleDownloadInstallmentReceipt,
  booking,
  setCouponModalOpen,
  invoiceId,
  preparingInvoice,
  trackerTotalAmount,
  trackerPayments,
  handleAddTrackerPayment,
  handleEditTrackerPayment,
  notify,
  utrNumber,
  setUtrNumber,
  remarks,
  setRemarks,
  receiptFile,
  setReceiptFile,
  handlePaymentSubmit,
  canSubmitPayment,
  submittingPayment,
  snapshotPaymentAmount,
  snapshotUtr,
  snapshotPaymentDate,
  snapshotReceiptName,
  currency,
  paymentStatus,
  paymentSubmission,
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start mb-6">
      {/* LEFT SIDEBAR SUB-TABS (Vertical list matching Sembark) */}
      <div className="w-full lg:w-40 shrink-0 bg-white border-r border-slate-200/80 py-1 font-sans">
        <div className="flex lg:flex-col overflow-x-auto">
          <button
            type="button"
            onClick={() => setAccountingSubTab("payments")}
            className={`w-full text-left px-3.5 py-2.5 text-[14px] transition-all relative flex items-center justify-between cursor-pointer ${
              accountingSubTab === "payments"
                ? "bg-[#f8fafc] text-slate-900 font-bold"
                : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/50"
            }`}
          >
            <span>Payments</span>
            {accountingSubTab === "payments" && (
              <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#35489e] rounded-l-xs" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setAccountingSubTab("proforma")}
            className={`w-full text-left px-3.5 py-2.5 text-[14px] transition-all relative flex items-center justify-between cursor-pointer ${
              accountingSubTab === "proforma"
                ? "bg-[#f8fafc] text-slate-900 font-bold"
                : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50/50"
            }`}
          >
            <span>Proforma Invoice</span>
            {accountingSubTab === "proforma" && (
              <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#35489e] rounded-l-xs" />
            )}
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 min-w-0 w-full px-3 lg:px-4 pt-3 pb-3 space-y-5 bg-white border border-slate-200 rounded-sm shadow-2xs">
        {accountingSubTab === "payments" && (
          <div className="space-y-5 font-sans">
            {/* SECTION 1: PAYMENTS FROM FINANCE */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2.5">Payments to Finance</h3>

              {/* Light Gray Section Wrapper matching Image 1 */}
              <div className="w-full bg-[#f1f5f9] p-3.5 lg:p-4.5 flex flex-col lg:flex-row items-start gap-3.5 lg:gap-5 rounded-xs border border-slate-200/50 mb-6">
                {/* Left summary stat block */}
                <div className="w-full lg:w-44 shrink-0 py-1 flex flex-col justify-start">
                  <p className="text-xs font-bold text-slate-900">INR</p>
                  <div className="mt-1 text-3xl font-extrabold text-[#15803d] tracking-tight leading-none">
                    + {totalPaidAmount.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1.5 text-3xl font-extrabold text-slate-900 flex items-baseline gap-1 leading-none">
                    <span className="text-slate-400 font-normal text-xl">/</span>
                    <span>{(expectedPaymentAmount || 38650).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 font-normal leading-tight">
                    <p>Created by Finance Team</p>
                    <p>Remaining: <span className="font-semibold text-amber-700">{"\u20B9"}{remainingPaymentAmount.toLocaleString("en-IN")}</span></p>
                    <p>Trip ID: {headerBookingId}</p>
                  </div>
                </div>

                {/* Right Installment list matching Image 1 */}
                <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-sm p-3.5 lg:p-4 shadow-2xs space-y-3">
                  <div className="grid grid-cols-12 text-xs font-bold text-slate-600 pb-2 border-b border-slate-200/80 gap-2">
                    <div className="col-span-2">Amount (INR)</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2">Payment Date</div>
                    <div className="col-span-5">Comments</div>
                  </div>

                  {validTrackerPayments.length > 0 ? (
                    validTrackerPayments.map((inst, idx) => {
                      const isInstallmentVerified = inst?.verificationStatus === "Verified";
                      const receiptForDownload = isInstallmentVerified ? inst?.financeReceipt : inst?.receipt;
                      const hasDownloadableReceipt = isInstallmentVerified || Boolean(receiptForDownload?.url);
                      const reviewerName = inst?.verifiedByName || booking?.assignedFinanceName || "Finance Team";
                      return (
                      <div key={idx} className="grid grid-cols-12 text-xs items-start py-2.5 border-b border-slate-100 last:border-0 gap-2">
                        <div className="col-span-2 font-extrabold text-slate-900 text-sm">
                          ₹{Number(inst.amount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="col-span-3">
                          <div className="flex flex-col gap-1">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[11px] w-fit whitespace-nowrap">
                              <span>Paid: {inst.date || "Completed"}</span>
                              {hasDownloadableReceipt ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadInstallmentReceipt(receiptForDownload, idx, { isInstallmentVerified })}
                                  className="relative inline-flex text-slate-400 hover:text-slate-700"
                                  title={`Open ${isInstallmentVerified ? "finance receipt" : "payment proof"}`}
                                >
                                  <FileText size={11} className={inst?.receiptStatus === "Sent" ? "text-emerald-600" : undefined} />
                                  {inst?.receiptStatus === "Sent" && (
                                    <CheckCheck size={8} className="absolute -left-1 -top-1 text-emerald-600" aria-label="Receipt shared by finance" />
                                  )}
                                </button>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-slate-700 font-medium leading-tight">
                              {isInstallmentVerified ? reviewerName : "Awaiting Finance Review"}
                            </p>
                            <p className="text-[10.5px] text-slate-500 font-normal leading-tight">
                              Trip ID: {headerBookingId}
                            </p>
                            {inst?.utrNumber && (
                              <p className="text-[10.5px] text-slate-500 font-normal leading-tight break-all">
                                UTR: {inst.utrNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2 text-xs font-semibold text-slate-700 pt-0.5 text-left whitespace-nowrap">
                          {inst.date || "Pending"}
                        </div>
                        <div className="col-span-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5 min-w-0">
                          <span className="text-xs text-slate-500 font-medium flex items-start gap-1 min-w-0 break-words pr-1">
                            <MessageSquare size={12} className="shrink-0 mt-0.5" />
                            <span className="break-words">{inst.note || "Payout confirmed by finance"}</span>
                          </span>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {inst?.receiptStatus === "Sent" && (
                              <span className="order-2 inline-flex items-center gap-1 text-[10.5px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold whitespace-nowrap">
                                Receipt Shared
                              </span>
                            )}
                            <span className={`order-1 inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded border font-semibold whitespace-nowrap ${isInstallmentVerified ? "text-emerald-700 bg-emerald-50 border-emerald-200/80" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                              <CheckCircle size={11} className={isInstallmentVerified ? "text-emerald-600" : "text-amber-500"} />
                              {isInstallmentVerified ? "Verified" : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400 font-medium">
                      No customer payment installments received yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: SUBMIT AGENT PAYMENT DETAILS */}
            <div className="pt-4 border-t border-slate-200">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">Submit / Update Agent Payment Details</h3>
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(true)}
                  disabled={!invoiceId || preparingInvoice}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#3E63DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#3E63DD] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  <BadgePercent size={14} />
                  Apply Coupon
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <PaymentTracker
                  totalAmount={trackerTotalAmount}
                  payments={trackerPayments}
                  onAddPayment={handleAddTrackerPayment}
                  onUpdatePayment={handleEditTrackerPayment}
                  onDownloadReceipt={handleDownloadInstallmentReceipt}
                  onValidationError={(message) => notify("warning", "Payment Details", message)}
                />
                <div className="grid gap-3 xl:grid-cols-2">
                  {/* UTR */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">UTR / Transaction ID</span>
                    <input
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase outline-none focus:border-indigo-500"
                      placeholder="e.g. UTR12345678"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">e.g. 312345678901, HDFC1234567890</p>
                  </div>

                  {/* Remarks */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Remarks</span>
                    <input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                      placeholder="Optional notes for finance..."
                    />
                  </div>
                </div>

                {/* Receipt Upload */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Payment Receipt</span>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/60 transition-all">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{receiptFile ? receiptFile.name : "Choose Receipt File"}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {receiptFile && (
                      <button
                        type="button"
                        onClick={() => setReceiptFile(null)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!canSubmitPayment}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg text-xs font-bold shadow-md hover:from-slate-800 hover:to-slate-700 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {submittingPayment ? "Submitting..." : "Submit Payment For Verification"}
                </button>
              </form>
            </div>

            {/* RIGHT: snapshot + finance */}
            <div className="space-y-4">
              {/* Submission Snapshot */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="border-b border-slate-300 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Current Submission Snapshot</p>
                  </div>
                </div>
                <div className="px-5 py-1.5">
                  {[
                    { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9 8h6M9 11h6M9 8a3 3 0 010 6H9l4 5" /></svg>, label: "Payment Amount", value: formatCurrency(snapshotPaymentAmount, currency), ok: snapshotPaymentAmount > 0, color: "text-amber-500" },
                    { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" /></svg>, label: "UTR", value: snapshotUtr, ok: Boolean(snapshotUtr), color: "text-violet-500" },
                    { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="17" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg>, label: "Payment Date", value: formatDate(snapshotPaymentDate), ok: Boolean(snapshotPaymentDate), color: "text-sky-500" },
                    { icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49" /></svg>, label: "Receipt", value: snapshotReceiptName, ok: Boolean(snapshotReceiptName), color: "text-teal-500" },
                  ].map(({ icon, label, value, ok, color }) => (
                    <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 last:border-b-0">
                      <span className={`flex items-center gap-2 text-[12px] text-slate-500 ${color}`}>{icon}<span className="text-slate-500">{label}</span></span>
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                        {ok ? (
                          <span className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.35)]">
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </span>
                        ) : (
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        )}
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finance Ownership */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Finance Ownership</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Current reviewer & audit timing</p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${statusTone(paymentStatus)}`}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M5 13l4 4L19 7" /></svg>
                    {paymentStatus}
                  </span>
                </div>
                <div className="px-3.5 py-1.5">
                  {[
                    { label: "Assigned Finance", value: booking?.assignedFinanceName || "Awaiting assignment", icon: <svg className="box-content h-3 w-3 rounded-md bg-slate-100 p-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                    { label: "Reviewed By", value: booking?.reviewedByName || "Pending", icon: <svg className="box-content h-3 w-3 rounded-md bg-slate-100 p-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
                    { label: "Submitted", value: formatDateTime(paymentSubmission?.submittedAt), icon: <svg className="box-content h-3 w-3 rounded-md bg-slate-100 p-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-50 py-2 last:border-b-0">
                      <span className="flex items-center gap-2 text-[12px] text-slate-500">{icon}<span className="text-slate-500">{label}</span></span>
                      <span className="text-[12px] font-semibold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
              <p className="text-sm font-bold text-emerald-700">Net Received: INR {totalPaidAmount.toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
